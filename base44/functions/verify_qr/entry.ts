import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Public QR verification — reachable without login (like a webhook endpoint).
// Service role is used ONLY for an exact qr_code match, and the response
// contains only safe, non-confidential public fields. Private details
// (location, serial numbers, owners) are never returned.

// Simple in-memory rate limiter to slow down automated QR-code enumeration:
// max 20 verification attempts per source IP per minute.
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60 * 1000;
const hits = new Map();

function rateLimited(req) {
  const ip = (req.headers && (req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for'))) || 'unknown';
  const key = String(ip).split(',')[0].trim();
  const now = Date.now();
  const recent = (hits.get(key) || []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) hits.clear(); // keep memory bounded
  return false;
}

// Strict output sanitization: only whitelisted fields are returned, each
// coerced to a plain, trimmed, length-capped, control-char-free string.
const MAX_FIELD = 200;
function str(v) {
  if (v == null) return '';
  const s = String(v).replace(/[\u0000-\u001F\u007F]/g, '').trim();
  return s.length > MAX_FIELD ? s.slice(0, MAX_FIELD) : s;
}

function publicSafeDate(v) {
  const s = str(v);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : '';
}

function publicSafeStatus(v, fallback) {
  const s = str(v);
  return /^[a-z_]{1,30}$/.test(s) ? s : fallback;
}

export default async function (req) {
  try {
    if (rateLimited(req)) {
      return Response.json(
        { error: 'Too many verification attempts. Please try again in a minute.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }
    const base44 = createClientFromRequest(req);
    let payload = {};
    try { payload = await req.json(); } catch { payload = {}; }
    // `code` accepts a QR code or the printed certificate / NOC number; `qr_code` stays
    // supported for scanned QR links.
    const qrCode = typeof payload.code === 'string'
      ? payload.code.trim()
      : (typeof payload.qr_code === 'string' ? payload.qr_code.trim() : '');
    if (!qrCode || qrCode.length > 120) {
      return Response.json({ error: 'Enter a QR code or certificate number' }, { status: 400 });
    }

    const certsByQr = await base44.asServiceRole.entities.Certificate.filter({ qr_code: qrCode }, '-created_date', 1);
    const certs = certsByQr && certsByQr.length
      ? certsByQr
      : await base44.asServiceRole.entities.Certificate.filter({ certificate_number: qrCode }, '-created_date', 1);
    if (certs && certs.length) {
      const c = certs[0];
      return Response.json({
        kind: 'certificate',
        title: str(c.title),
        reference: str(c.certificate_number),
        organization_name: str(c.organization_name),
        issue_date: publicSafeDate(c.issue_date),
        expiry_date: publicSafeDate(c.expiry_date),
        status: publicSafeStatus(c.status, 'valid'),
      });
    }

    const assets = await base44.asServiceRole.entities.Asset.filter({ qr_code: qrCode }, '-created_date', 1);
    if (assets && assets.length) {
      const a = assets[0];
      return Response.json({
        kind: 'asset',
        title: str(a.name),
        reference: str(a.asset_code),
        organization_name: str(a.organization_name),
        issue_date: publicSafeDate(a.install_date),
        status: publicSafeStatus(a.status, 'active'),
      });
    }

    const nocs = await base44.asServiceRole.entities.NOC.filter({ noc_number: qrCode }, '-created_date', 1);
    if (nocs && nocs.length) {
      const n = nocs[0];
      return Response.json({
        kind: 'noc',
        title: 'Fire NOC',
        reference: str(n.noc_number),
        organization_name: str(n.organization_name),
        issue_date: publicSafeDate(n.issue_date),
        expiry_date: publicSafeDate(n.expiry_date),
        status: publicSafeStatus(n.status, 'valid'),
      });
    }

    return Response.json({ found: false });
  } catch (error) {
    // Never echo internal error details to a public endpoint
    return Response.json({ error: 'Verification failed. Please try again.' }, { status: 500 });
  }
}