import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { actorScope, asList, hoursForPriority } from '../../shared/scheduling.ts';

// SLA enforcement. Every open service request is measured against the response
// window of its priority; requests that cross their deadline are escalated once
// (priority raised, customer and platform admins alerted, audit trail written)
// so a request can never quietly rot on the board.

const OPEN_STATUSES = ['open', 'assigned', 'in_progress'];
const NEXT_PRIORITY = { low: 'medium', medium: 'high', high: 'critical', critical: 'critical' };
const MAX_REQUESTS = 300;
const MS_PER_HOUR = 3600000;

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = (await req.json().catch(() => null)) || {};
    const scope = actorScope(user, payload);
    if (scope.error) return Response.json({ error: scope.error }, { status: 400 });

    const query = { status: { $in: OPEN_STATUSES } };
    if (scope.vendorId) query.vendor_id = scope.vendorId;
    else if (scope.organizationId) query.organization_id = scope.organizationId;

    const requests = asList(await base44.entities.ServiceRequest.filter(query, 'scheduled_date', MAX_REQUESTS));
    const now = Date.now();
    const patches = [];
    const escalated = [];

    for (const request of requests) {
      const windowHours = Number(request.sla_hours) || hoursForPriority(request.priority);
      const due = request.sla_due_date
        ? new Date(request.sla_due_date).getTime()
        : new Date(request.created_date || now).getTime() + windowHours * MS_PER_HOUR;
      const left = due - now;
      const breach = left <= 0;
      const dueSoon = !breach && left <= Math.min(windowHours * MS_PER_HOUR * 0.25, 12 * MS_PER_HOUR);
      const nextStatus = breach ? 'breached' : dueSoon ? 'due_soon' : 'on_track';

      const patch = { id: request.id };
      let changed = false;
      if (!request.sla_hours) { patch.sla_hours = windowHours; changed = true; }
      if (!request.sla_due_date) { patch.sla_due_date = new Date(due).toISOString(); changed = true; }
      if (request.sla_status !== nextStatus) { patch.sla_status = nextStatus; changed = true; }

      // A breach escalates exactly once: priority rises and alerts go out.
      if (breach && !Number(request.escalation_level)) {
        patch.escalation_level = 1;
        patch.escalated_at = new Date(now).toISOString();
        patch.priority = NEXT_PRIORITY[request.priority] || 'critical';
        changed = true;
        escalated.push({ ...request, sla_due_date: new Date(due).toISOString(), priority: patch.priority, windowHours });
      }

      if (changed) patches.push(patch);
    }

    if (patches.length) await base44.entities.ServiceRequest.bulkUpdate(patches);

    let notified = 0;
    if (escalated.length) {
      const admins = asList(await base44.entities.User.filter({ role: 'admin' }, '-created_date', 10).catch(() => []));
      const alerts = [];
      for (const request of escalated) {
        const label = request.request_number || request.id;
        const message = (request.service_type || 'Service request')
          + ' for ' + (request.customer_name || request.organization_id || 'a customer')
          + ' crossed its ' + request.windowHours + 'h response window and was escalated to ' + request.priority + ' priority.';
        if (request.customer_id) {
          alerts.push({
            user_id: request.customer_id,
            title: 'Service request overdue — ' + label,
            message,
            type: 'service',
            link: '/customer/service-requests',
          });
        }
        for (const admin of admins) {
          alerts.push({
            user_id: admin.id,
            title: 'SLA breach — ' + label,
            message,
            type: 'service',
            link: '/maintenance',
          });
        }
      }
      if (alerts.length) {
        const sent = asList(await base44.entities.AppNotification.bulkCreate(alerts).catch(() => []));
        notified = sent.length;
      }
      await base44.entities.AuditLog.create({
        user_name: user.full_name || user.email || 'System',
        user_id: user.id,
        action: 'SLA breaches escalated',
        module: 'ServiceRequest',
        entity_id: escalated.map((r) => r.request_number || r.id).join(', ').slice(0, 200),
        after_value: escalated.length + ' request(s) escalated',
        description: 'Response deadline crossed on ' + escalated.length + ' request(s); priority raised and alerts sent.',
      }).catch(() => null);
    }

    return Response.json({
      ok: true,
      scanned: requests.length,
      updated: patches.length,
      due_soon: patches.filter((p) => p.sla_status === 'due_soon').length,
      breached: patches.filter((p) => p.sla_status === 'breached').length,
      escalated: escalated.length,
      notified,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}