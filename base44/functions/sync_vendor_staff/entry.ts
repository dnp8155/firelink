import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Keeps the staff role of a vendor team member on their user record, so
// row-level security can enforce what each sub-role may create, edit or delete.
// Called by the vendor Team screen (owner / vendor admin) or by a platform admin.

const STAFF_ROLES = [
  'VENDOR_ADMIN',
  'SALES_MANAGER',
  'PRODUCT_MANAGER',
  'INVENTORY_MANAGER',
  'ORDER_MANAGER',
  'SERVICE_MANAGER',
  'FINANCE_USER',
  'VIEW_ONLY',
];

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const caller = await base44.auth.me();
    if (!caller) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const email = String(body.email || '').trim().toLowerCase();
    const vendorId = body.vendor_id ? String(body.vendor_id) : '';
    const staffRole = body.staff_role ? String(body.staff_role) : '';

    if (!email || !vendorId) {
      return Response.json({ error: 'email and vendor_id are required' }, { status: 400 });
    }
    if (staffRole && !STAFF_ROLES.includes(staffRole)) {
      return Response.json({ error: 'Invalid staff_role' }, { status: 400 });
    }

    const vendor = await base44.asServiceRole.entities.Vendor.get(vendorId).catch(() => null);
    if (!vendor) return Response.json({ error: 'Vendor not found' }, { status: 404 });

    // Only the platform admin, the vendor owner, or a member of that vendor may sync staff roles.
    const callerVendorId = (caller.data && caller.data.vendor_id) || caller.vendor_id || null;
    const allowed =
      caller.role === 'admin' ||
      vendor.owner_id === caller.id ||
      vendor.created_by_id === caller.id ||
      callerVendorId === vendorId;
    if (!allowed) return Response.json({ error: 'Forbidden' }, { status: 403 });

    const matches = await base44.asServiceRole.entities.User.filter({ email });
    const user = (matches || [])[0];
    if (!user) return Response.json({ ok: true, updated: false, reason: 'user_not_registered' });

    await base44.asServiceRole.entities.User.update(user.id, {
      vendor_id: staffRole ? vendorId : null,
      staff_role: staffRole || null,
    });

    return Response.json({ ok: true, updated: true, user_id: user.id, staff_role: staffRole || null });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}