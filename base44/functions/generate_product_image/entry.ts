import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Generates a studio-style product photo for a vendor product listing.
// Narrowly scoped: one image, bounded inputs, returns only the resulting URL.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const productName = typeof body.product_name === 'string' ? body.product_name.slice(0, 200).trim() : '';
    if (!productName) return Response.json({ error: 'product_name is required' }, { status: 400 });

    const imageUrl = typeof body.image_url === 'string' && body.image_url.startsWith('https://')
      ? body.image_url.slice(0, 2000)
      : '';

    const prompt = `Professional studio product photograph of a ${productName}, placed on a clean white podium with soft even studio lighting, subtle natural shadow, minimalist light grey background, high-end commercial e-commerce product photography, sharp focus, crisp details, centered composition, 4k quality`;

    const result = await base44.asServiceRole.integrations.Core.GenerateImage({
      prompt,
      ...(imageUrl ? { existing_image_urls: [imageUrl] } : {}),
    });

    return Response.json({ url: (result && result.url) || '' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}