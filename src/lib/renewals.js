// Renewal Center helpers — turn expiring compliance records into a vendor quotation request.

export const RENEWAL_WINDOW_DAYS = 180;

export function daysLeft(date) {
  if (!date) return null;
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
}

export function isoInDays(days) {
  return new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
}

export const RENEWAL_BUCKETS = [
  { key: "expired", label: "Expired — renew now", tone: "rose" },
  { key: "soon", label: "Due within 30 days", tone: "amber" },
  { key: "quarter", label: "Due within 90 days", tone: "blue" },
  { key: "later", label: "Due within 6 months", tone: "slate" },
];

export function bucketOf(days) {
  if (days === null) return "later";
  if (days < 0) return "expired";
  if (days <= 30) return "soon";
  if (days <= 90) return "quarter";
  return "later";
}

// Normalise a Certificate or NOC record into one renewal row.
export function toRenewalItem(kind, record = {}) {
  if (kind === "Certificate") {
    return {
      id: record.id,
      kind,
      label: record.title || "Certificate",
      reference: record.certificate_number || record.qr_code || record.id,
      expiry_date: record.expiry_date || "",
      status: record.status || "valid",
      detail: record.asset_name || "",
    };
  }
  return {
    id: record.id,
    kind,
    label: record.site_name ? `Fire NOC — ${record.site_name}` : "Fire NOC",
    reference: record.noc_number || record.id,
    expiry_date: record.expiry_date || "",
    status: record.status || "valid",
    detail: record.authority || "",
  };
}

// A renewal counts as raised once an RFQ line item carries the record's reference.
export function isRenewalRaised(item, rfqs = []) {
  return rfqs.some((r) => (r.items || []).some((i) => i && i.specification === item.reference));
}

export function renewalRfqTitle(items = []) {
  if (items.length === 1) return `Renewal — ${items[0].label}`;
  return `Compliance renewals — ${items.length} records`;
}

export function renewalRfqItems(items = []) {
  return items.map((i) => ({
    name: `${i.kind}: ${i.label}`,
    specification: i.reference,
    qty: 1,
    unit: "service",
  }));
}

export function renewalRfqDescription(items = [], org = {}) {
  return [
    items.length === 1
      ? "Renewal request raised from the FireLink Renewal Center."
      : `Renewal request for ${items.length} compliance records, raised from the FireLink Renewal Center.`,
    "",
    ...items.map((i) => `• ${i.kind} — ${i.label} (${i.reference}), expires ${i.expiry_date || "—"}`),
    "",
    `Organization: ${org.organization_name || "—"}`,
    "Please quote for renewal including inspection, refilling or fresh documentation as applicable.",
  ].join("\n");
}

// Earliest expiry in the set, used as the default expected date.
export function earliestExpiry(items = []) {
  return items.map((i) => i.expiry_date).filter(Boolean).sort()[0] || "";
}