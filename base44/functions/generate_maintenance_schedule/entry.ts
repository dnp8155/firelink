import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { actorScope, asList, hoursForPriority } from '../../shared/scheduling.ts';

// Preventive-maintenance auto-scheduling (Gap 2). Every active asset whose
// inspection date falls inside the horizon is turned into a work order
// (ServiceRequest) routed to the vendor who supplied it, so upkeep is booked
// before compliance lapses. Idempotent: one visit per asset per due month, and
// never a second while one for that asset is still open.

const MAX_ASSETS = 200;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

function safeCode(value) {
  return String(value || '').replace(/[^A-Za-z0-9]/g, '').slice(0, 20);
}

function monthKey(value) {
  return String(value || '').replace(/[^0-9]/g, '').slice(0, 6);
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = (await req.json().catch(() => null)) || {};
    // Platform admins may run one organization at a time; a cross-organization
    // sweep has to be asked for explicitly so a click can never touch every tenant.
    const scope = actorScope(user, payload);
    const organizationId = scope.organizationId;
    if (scope.error || (!organizationId && !scope.allOrganizations)) {
      return Response.json({ error: 'An organization is required to schedule visits.' }, { status: 400 });
    }

    const horizonDays = Math.min(Math.max(Number(payload.horizon_days) || 30, 1), 365);
    const today = isoDate(new Date());
    const horizon = isoDate(new Date(Date.now() + horizonDays * MS_PER_DAY));

    const assetQuery = { status: 'active', next_inspection_date: { $lte: horizon } };
    if (organizationId) assetQuery.organization_id = organizationId;

    const assets = asList(await base44.entities.Asset.filter(assetQuery, 'next_inspection_date', MAX_ASSETS));
    if (!assets.length) {
      return Response.json({ ok: true, scanned: 0, created: 0, already_scheduled: 0, horizon_date: horizon });
    }

    const assetIds = assets.map((a) => a.id);
    const openVisits = asList(await base44.entities.ServiceRequest.filter(
      { asset_id: { $in: assetIds }, service_type: 'Preventive Maintenance', status: { $in: ['open', 'assigned', 'in_progress'] } },
      '-created_date',
      200,
    ));
    const openByAsset = new Set(openVisits.map((r) => r.asset_id));

    const candidates = assets.filter((a) => a.next_inspection_date && !openByAsset.has(a.id));
    const numbers = candidates.map((a) => 'PM-' + (safeCode(a.asset_code) || safeCode(a.id)) + '-' + monthKey(a.next_inspection_date));
    const alreadyNumbered = numbers.length
      ? asList(await base44.entities.ServiceRequest.filter({ request_number: { $in: numbers } }, '-created_date', 200))
      : [];
    const numbered = new Set(alreadyNumbered.map((r) => r.request_number));

    const orderIds = [...new Set(candidates.map((a) => a.order_id).filter(Boolean))];
    const orders = orderIds.length
      ? asList(await base44.entities.Order.filter({ id: { $in: orderIds } }, '-created_date', 200))
      : [];
    const orderById = new Map(orders.map((o) => [o.id, o]));

    let orgOwner = '';
    let orgName = '';
    if (organizationId && candidates.some((a) => !a.owner_id)) {
      const org = await base44.entities.Organization.get(organizationId).catch(() => null);
      orgOwner = (org && org.owner_id) || '';
      orgName = (org && org.name) || '';
    }

    const records = [];
    const skipped = [];
    for (const asset of candidates) {
      const number = 'PM-' + (safeCode(asset.asset_code) || safeCode(asset.id)) + '-' + monthKey(asset.next_inspection_date);
      if (numbered.has(number)) { skipped.push(number); continue; }

      const order = asset.order_id ? orderById.get(asset.order_id) : null;
      const customerId = asset.owner_id || (order && order.customer_id) || orgOwner;
      if (!customerId) { skipped.push(number); continue; }

      const due = String(asset.next_inspection_date).slice(0, 10);
      const overdue = due < today;
      const priority = overdue ? 'high' : 'medium';
      const slaHours = hoursForPriority(priority);
      records.push({
        request_number: number,
        customer_id: customerId,
        customer_name: (order && order.customer_name) || orgName || asset.organization_name || '',
        organization_id: asset.organization_id || organizationId || '',
        asset_id: asset.id,
        asset_name: asset.name || '',
        site_name: asset.site_name || '',
        service_type: 'Preventive Maintenance',
        priority,
        description: (overdue ? 'Overdue inspection ' : 'Inspection due ') + due
          + ' — preventive maintenance auto-scheduled for asset ' + (asset.asset_code || asset.id) + '.',
        scheduled_date: due,
        sla_hours: slaHours,
        sla_due_date: new Date(Date.now() + slaHours * 3600000).toISOString(),
        sla_status: 'on_track',
        vendor_id: (order && order.vendor_id) || '',
        vendor_name: (order && order.vendor_name) || '',
        status: 'open',
      });
    }

    if (!records.length) {
      return Response.json({ ok: true, scanned: assets.length, created: 0, already_scheduled: skipped.length, horizon_date: horizon });
    }

    const created = asList(await base44.entities.ServiceRequest.bulkCreate(records));
    return Response.json({
      ok: true,
      scanned: assets.length,
      created: created.length,
      already_scheduled: skipped.length,
      horizon_date: horizon,
      created_ids: created.map((r) => r.id),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}