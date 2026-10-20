import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Transactional order & RFQ lifecycle notifications.
// Recipients are always resolved server-side from the order/RFQ/vendor record,
// so the client can only trigger a notification for a record it is party to.

const STATUS_LABEL = {
  accepted: 'confirmed',
  packed: 'packed and ready to ship',
  dispatched: 'shipped',
  delivered: 'delivered',
  cancelled: 'cancelled',
  returned: 'marked for return',
  refunded: 'refunded',
};

async function notifyVendor(base44, vendor, subject, text, link, type) {
  let emailSent = false;
  try {
    if (vendor.email) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: vendor.email,
        subject,
        from_name: 'FireLink',
        text,
      });
      emailSent = true;
    }
  } catch (e) {
    // email delivery is best-effort (address may not be reachable yet)
  }
  try {
    const ownerId = vendor.owner_id || vendor.created_by_id;
    if (ownerId) {
      await base44.asServiceRole.entities.AppNotification.create({
        user_id: ownerId,
        title: subject,
        message: text.slice(0, 280),
        type: type || 'order',
        link: link || '',
      });
    }
  } catch (e) {
    // in-app notification is best-effort
  }
  return emailSent;
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await req.json().catch(() => null);
    const type = payload && payload.type;

    // ---- RFQ awarded: notify the winning vendor ----
    if (type === 'rfq_awarded') {
      const rfq = payload.rfq_id
        ? await base44.asServiceRole.entities.RFQ.get(payload.rfq_id).catch(() => null)
        : null;
      if (!rfq) return Response.json({ error: 'RFQ not found' }, { status: 404 });
      if (user.role !== 'admin' && rfq.customer_id !== user.id) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
      if (!rfq.awarded_vendor_id) return Response.json({ ok: true, notified: false, reason: 'not awarded' });
      const vendor = await base44.asServiceRole.entities.Vendor.get(rfq.awarded_vendor_id).catch(() => null);
      if (!vendor) return Response.json({ ok: true, notified: false, reason: 'vendor missing' });
      const subject = 'Congratulations — you won RFQ ' + rfq.rfq_number;
      const text =
        'Dear ' + (vendor.contact_person || vendor.company_name) + ',\n\n' +
        'Your quotation for "' + rfq.title + '" (RFQ ' + rfq.rfq_number + ') has been accepted by ' + (rfq.customer_name || 'the customer') + '.\n' +
        'Purchase Order: ' + (rfq.po_number || 'will be shared separately') + '\n\n' +
        'Open your Vendor Portal to view the award and next steps.\n\n— Team FireLink';
      await notifyVendor(base44, vendor, subject, text, '/vendor/rfqs', 'rfq');
      return Response.json({ ok: true, notified: true });
    }

    // ---- Order events ----
    if (type === 'order_placed' || type === 'order_status') {
      const order = payload.order_id
        ? await base44.asServiceRole.entities.Order.get(payload.order_id).catch(() => null)
        : null;
      if (!order) return Response.json({ error: 'Order not found' }, { status: 404 });

      const userVendorId = (user.data && user.data.vendor_id) || user.vendor_id;
      const isCustomer = order.customer_id && order.customer_id === user.id;
      const isVendorSide = userVendorId && order.vendor_id === userVendorId;
      if (user.role !== 'admin' && !isCustomer && !isVendorSide) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }

      // New order → notify the vendor
      if (type === 'order_placed') {
        if (!order.vendor_id) return Response.json({ ok: true, notified: false });
        const vendor = await base44.asServiceRole.entities.Vendor.get(order.vendor_id).catch(() => null);
        if (!vendor) return Response.json({ ok: true, notified: false });
        const subject = 'New order received — ' + order.order_number;
        const text =
          'Dear ' + (vendor.contact_person || vendor.company_name) + ',\n\n' +
          'You have received a new order on FireLink.\n\n' +
          'Order: ' + order.order_number + '\n' +
          'Customer: ' + (order.customer_name || 'Customer') + '\n' +
          'Items: ' + (order.items || []).length + '\n' +
          'Order value: Rs.' + order.total + '\n\n' +
          'Please open your Vendor Portal to accept and process this order.\n\n— Team FireLink';
        await notifyVendor(base44, vendor, subject, text, '/vendor/orders', 'order');
        return Response.json({ ok: true, notified: true });
      }

      // Status change → notify the other side
      const label = STATUS_LABEL[order.status] || order.status;

      if (isVendorSide || user.role === 'admin') {
        // Vendor updated it → notify the customer
        const customer = order.customer_id
          ? await base44.asServiceRole.entities.User.get(order.customer_id).catch(() => null)
          : null;
        const subject = 'Your FireLink order ' + order.order_number + ' is ' + label;
        const text =
          'Dear ' + ((customer && (customer.full_name || customer.email)) || 'Customer') + ',\n\n' +
          'Your order ' + order.order_number + ' has been ' + label + '.' +
          (order.status === 'dispatched' && order.tracking_number
            ? '\n\nCourier: ' + (order.courier || '—') + '\nTracking number: ' + order.tracking_number
            : '') +
          '\n\nTrack it anytime in your FireLink portal.\n\n— Team FireLink';
        let emailSent = false;
        if (customer && customer.email) {
          try {
            await base44.asServiceRole.integrations.Core.SendEmail({
              to: customer.email,
              subject,
              from_name: 'FireLink',
              text,
            });
            emailSent = true;
          } catch (e) {
            // best-effort
          }
        }
        try {
          await base44.asServiceRole.entities.AppNotification.create({
            user_id: order.customer_id,
            title: subject,
            message: text.slice(0, 280),
            type: 'order',
            link: '/customer/orders',
          });
        } catch (e) {
          // best-effort
        }
        return Response.json({ ok: true, notified: true, email_sent: emailSent });
      }

      // Customer updated it (cancel/return) → notify the vendor
      const vendor = order.vendor_id
        ? await base44.asServiceRole.entities.Vendor.get(order.vendor_id).catch(() => null)
        : null;
      const subject = 'Order ' + order.order_number + ' ' + label + ' by customer';
      const text =
        'Dear ' + ((vendor && (vendor.contact_person || vendor.company_name)) || 'Vendor') + ',\n\n' +
        'Order ' + order.order_number + ' placed by ' + (order.customer_name || 'a customer') + ' has been ' + label + '.' +
        (order.return_reason ? '\n\nReason: ' + order.return_reason : '') +
        '\n\nPlease review it in your Vendor Portal.\n\n— Team FireLink';
      if (vendor) await notifyVendor(base44, vendor, subject, text, '/vendor/orders', 'order');
      return Response.json({ ok: true, notified: !!vendor });
    }

    return Response.json({ error: 'Unknown notification type' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}