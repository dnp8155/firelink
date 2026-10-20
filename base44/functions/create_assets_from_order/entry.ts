import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Auto-registers compliance assets from a delivered order: every ordered unit
// becomes its own QR-tracked asset with a first inspection date, so the buyer's
// purchase turns into a tracked, inspectable record. Idempotent per order —
// re-running (vendor, returns restore, dispute close) never duplicates assets.

const MONTHS_TO_FIRST_INSPECTION = 12;
const MAX_ASSETS_PER_ORDER = 200;
const ADMIN_ROLES = ['admin', 'platform_admin', 'super_admin'];

function isoDate(value) {
  return new Date(value).toISOString().slice(0, 10);
}

function addMonths(value, months) {
  const d = new Date(value);
  d.setMonth(d.getMonth() + months);
  return d;
}

function safeCode(value) {
  return String(value || '').replace(/[^A-Za-z0-9]/g, '').slice(0, 24);
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await req.json().catch(() => null);
    const orderId = payload && typeof payload.order_id === 'string' ? payload.order_id.trim() : '';
    if (!orderId) return Response.json({ error: 'order_id is required' }, { status: 400 });

    const order = await base44.asServiceRole.entities.Order.get(orderId).catch(() => null);
    if (!order) return Response.json({ error: 'Order not found' }, { status: 404 });

    // Only a party to the order (buyer, its vendor) or an admin may register its assets.
    const userVendorId = (user.data && user.data.vendor_id) || user.vendor_id;
    const isBuyer = !!order.customer_id && order.customer_id === user.id;
    const isVendorSide = !!userVendorId && order.vendor_id === userVendorId;
    if (!ADMIN_ROLES.includes(user.role) && !isBuyer && !isVendorSide) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (order.status !== 'delivered') {
      return Response.json({ ok: true, created: 0, reason: 'order is not delivered' });
    }

    // Assets are registered once per order.
    const already = await base44.asServiceRole.entities.Asset.filter({ order_id: orderId }, '-created_date', 1);
    if (already && already.length) {
      return Response.json({ ok: true, created: 0, already_registered: true });
    }

    const items = (order.items || []).filter((i) => i && i.name);
    if (!items.length) return Response.json({ ok: true, created: 0, reason: 'order has no items' });

    const buyer = order.customer_id
      ? await base44.asServiceRole.entities.User.get(order.customer_id).catch(() => null)
      : null;
    const buyerData = (buyer && buyer.data) || {};
    const organizationId = order.organization_id || buyerData.organization_id || '';
    const organizationName = buyerData.organization_name || '';
    if (!organizationId) {
      return Response.json({ ok: true, created: 0, reason: 'buyer has no organisation profile' });
    }

    // Product details enrich each asset (category / brand / model).
    const productIds = [...new Set(items.map((i) => i.product_id).filter(Boolean))];
    const products = productIds.length
      ? await base44.asServiceRole.entities.Product.filter({ id: { $in: productIds } }, '-created_date', 200).catch(() => [])
      : [];
    const productById = new Map((products || []).map((p) => [p.id, p]));

    const deliveredOn = order.updated_date || new Date().toISOString();
    const installDate = isoDate(deliveredOn);
    const firstInspection = isoDate(addMonths(deliveredOn, MONTHS_TO_FIRST_INSPECTION));
    const codeBase = safeCode(order.order_number) || safeCode(orderId);

    const records = [];
    items.forEach((item, lineIndex) => {
      const product = item.product_id ? productById.get(item.product_id) : null;
      const quantity = Math.max(1, Math.min(Number(item.qty) || 1, MAX_ASSETS_PER_ORDER));
      for (let unit = 1; unit <= quantity && records.length < MAX_ASSETS_PER_ORDER; unit += 1) {
        const code = 'AST-' + codeBase + '-' + (lineIndex + 1) + (quantity > 1 ? '-' + unit : '');
        records.push({
          asset_code: code,
          qr_code: 'QR' + code,
          name: item.name,
          category: (product && product.category) || 'Other',
          brand: (product && product.brand) || '',
          model: (product && product.model) || '',
          organization_id: organizationId,
          organization_name: organizationName,
          location_detail: order.shipping_address || '',
          install_date: installDate,
          next_inspection_date: firstInspection,
          status: 'active',
          condition: 'good',
          owner_id: order.customer_id || '',
          order_id: orderId,
          order_number: order.order_number || '',
          description: 'Auto-registered from order ' + (order.order_number || ''),
        });
      }
    });

    if (!records.length) return Response.json({ ok: true, created: 0, reason: 'nothing to register' });

    await base44.asServiceRole.entities.Asset.bulkCreate(records);
    return Response.json({
      ok: true,
      created: records.length,
      order_number: order.order_number || '',
      first_inspection_date: firstInspection,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}