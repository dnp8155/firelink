import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Compliance auto-expiry checker — runs daily (see function.jsonc).
// Scans Certificates and NOCs expiring in 60 / 30 / 7 days and sends the
// organization an email plus an in-app notification to the record owner.
// Repeat runs are de-duplicated by the notification title.

const THRESHOLDS = [60, 30, 7];
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const d = new Date(String(dateStr).slice(0, 10) + 'T00:00:00');
  if (isNaN(d.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / MS_PER_DAY);
}

function thresholdFor(daysLeft) {
  for (const t of THRESHOLDS) {
    if (Math.abs(daysLeft - t) <= 1) return t;
  }
  return null;
}

async function alreadyNotified(base44, title) {
  const dup = await base44.asServiceRole.entities.AppNotification.filter({ title }, { limit: 1 });
  return (dup.items || []).length > 0;
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);

    // Manual runs are admin-only; the daily automation runs without a user.
    const user = await base44.auth.me().catch(() => null);
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });
    }

    const notified = [];
    const skipped = [];

    const certPage = await base44.asServiceRole.entities.Certificate.filter({}, { sort: '-expiry_date', limit: 500 });
    for (const cert of certPage.items || []) {
      const daysLeft = daysUntil(cert.expiry_date);
      if (daysLeft == null || daysLeft < 0) continue;
      const threshold = thresholdFor(daysLeft);
      if (!threshold) continue;

      const title = `[Compliance] ${cert.title || 'Certificate'} expires in ${threshold} days (${cert.certificate_number || cert.id})`;
      if (await alreadyNotified(base44, title)) { skipped.push(title); continue; }

      let orgEmail = null;
      let ownerId = cert.created_by_id;
      if (cert.organization_id) {
        const org = await base44.asServiceRole.entities.Organization.get(cert.organization_id).catch(() => null);
        if (org) {
          orgEmail = org.email || null;
          if (org.owner_id) ownerId = org.owner_id;
        }
      }

      if (orgEmail) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: orgEmail,
          subject: title,
          from_name: 'FireLink Compliance',
          text:
            'Dear Team,\n\n' +
            'This is an automated reminder that the following fire-safety certificate is expiring soon:\n\n' +
            `Certificate: ${cert.title || '—'}\n` +
            `Number: ${cert.certificate_number || '—'}\n` +
            `Expiry Date: ${cert.expiry_date}\n` +
            `Days remaining: ${daysLeft}\n\n` +
            'Please initiate the renewal process immediately to stay compliant.\n\n' +
            '— Team FireLink Compliance Monitor',
        }).catch(() => null);
      }

      if (ownerId) {
        await base44.asServiceRole.entities.AppNotification.create({
          user_id: ownerId,
          title,
          message: `${cert.title || 'Certificate'} expires on ${cert.expiry_date} (${daysLeft} days left). Schedule renewal now.`,
          type: 'certificate',
          link: '/certificates',
        }).catch(() => null);
      }

      notified.push(title);
    }

    const nocPage = await base44.asServiceRole.entities.NOC.filter({}, { sort: '-expiry_date', limit: 500 });
    for (const noc of nocPage.items || []) {
      const daysLeft = daysUntil(noc.expiry_date);
      if (daysLeft == null || daysLeft < 0) continue;
      const threshold = thresholdFor(daysLeft);
      if (!threshold) continue;

      const title = `[Compliance] Fire NOC ${noc.noc_number || noc.id} expires in ${threshold} days`;
      if (await alreadyNotified(base44, title)) { skipped.push(title); continue; }

      let orgEmail = null;
      let ownerId = noc.created_by_id;
      if (noc.organization_id) {
        const org = await base44.asServiceRole.entities.Organization.get(noc.organization_id).catch(() => null);
        if (org) {
          orgEmail = org.email || null;
          if (org.owner_id) ownerId = org.owner_id;
        }
      }

      if (orgEmail) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: orgEmail,
          subject: title,
          from_name: 'FireLink Compliance',
          text:
            'Dear Team,\n\n' +
            `Your Fire NOC (number ${noc.noc_number || '—'}) issued by ${noc.authority || 'the authority'} is expiring soon.\n\n` +
            `Expiry Date: ${noc.expiry_date}\n` +
            `Days remaining: ${daysLeft}\n\n` +
            'Please initiate the renewal process to maintain compliance.\n\n' +
            '— Team FireLink Compliance Monitor',
        }).catch(() => null);
      }

      if (ownerId) {
        await base44.asServiceRole.entities.AppNotification.create({
          user_id: ownerId,
          title,
          message: `Fire NOC ${noc.noc_number || ''} expires on ${noc.expiry_date} (${daysLeft} days left). Renew now.`,
          type: 'noc',
          link: '/fire-noc',
        }).catch(() => null);
      }

      notified.push(title);
    }

    return Response.json({
      ok: true,
      notifications_sent: notified.length,
      skipped_duplicates: skipped.length,
      notified,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}