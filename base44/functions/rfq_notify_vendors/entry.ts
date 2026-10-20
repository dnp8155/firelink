import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Notifies approved vendors when a customer creates an RFQ.
// Vendors whose categories match the RFQ category are notified first;
// if none match, all approved vendors are notified (capped at 50).
// The caller must be the RFQ customer or an admin.

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await req.json().catch(() => null);
    const rfqId = payload && payload.rfq_id;
    if (!rfqId) return Response.json({ error: 'rfq_id is required' }, { status: 400 });

    const rfq = await base44.asServiceRole.entities.RFQ.get(rfqId).catch(() => null);
    if (!rfq) return Response.json({ error: 'RFQ not found' }, { status: 404 });

    if (user.role !== 'admin' && rfq.customer_id !== user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const allVendors = await base44.asServiceRole.entities.Vendor.filter(
      { approval_status: 'approved' },
      '-created_date',
      200
    ).catch(() => []);

    let targets = (allVendors || []).filter((v) =>
      Array.isArray(v.categories) && v.categories.some((c) =>
        (c || '').toLowerCase() === (rfq.category || '').toLowerCase()
      )
    );

    if (targets.length === 0) targets = (allVendors || []).slice(0, 50);
    else targets = targets.slice(0, 50);

    const subject = 'New RFQ available — ' + rfq.title;
    const text =
      'A new Request for Quotation has been posted on FireLink.\n\n' +
      'RFQ: ' + rfq.rfq_number + '\n' +
      'Title: ' + rfq.title + '\n' +
      'Category: ' + (rfq.category || '—') + '\n' +
      'Customer: ' + (rfq.customer_name || '—') + '\n' +
      'Delivery Location: ' + (rfq.delivery_location || 'Flexible') + '\n' +
      'Expected Delivery: ' + (rfq.expected_delivery_date || 'Flexible') + '\n\n' +
      (rfq.description ? 'Details: ' + rfq.description + '\n\n' : '') +
      'Open your Vendor Portal → RFQs to submit your quotation.\n\n— Team FireLink';

    let notified = 0;
    let emailsSent = 0;

    for (const vendor of targets) {
      try {
        const ownerId = vendor.owner_id || vendor.created_by_id;
        if (ownerId) {
          await base44.asServiceRole.entities.AppNotification.create({
            user_id: ownerId,
            title: subject,
            message: text.slice(0, 280),
            type: 'rfq',
            link: '/vendor/rfqs',
          });
          notified++;
        }
      } catch (e) {
        // in-app notification is best-effort
      }

      try {
        if (vendor.email) {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: vendor.email,
            subject,
            from_name: 'FireLink',
            text,
          });
          emailsSent++;
        }
      } catch (e) {
        // email delivery is best-effort
      }
    }

    return Response.json({ ok: true, vendors_notified: notified, emails_sent: emailsSent });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}