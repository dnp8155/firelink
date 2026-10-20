import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const fileUri = body.file_uri;
    if (!fileUri || typeof fileUri !== 'string' || fileUri.length > 500) {
      return Response.json({ error: 'Invalid file reference' }, { status: 400 });
    }

    // Authorization: the user must be able to read a vendor document or certificate
    // that holds this file, or be a platform admin. RLS on both entities enforces
    // vendor-scoped access.
    const docs = await base44.entities.VendorDocument.filter({ file_url: fileUri }, '-created_date', 5);
    let allowed = !!(docs && docs.length > 0);
    if (!allowed) {
      const certs = await base44.entities.Certificate.filter({ file_url: fileUri }, '-created_date', 5);
      allowed = !!(certs && certs.length > 0);
    }
    const isAdmin = user.role === 'admin';
    if (!allowed && !isAdmin) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const res = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({
      file_uri: fileUri,
      expires_in: 300,
    });
    return Response.json({ signed_url: res.signed_url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}