// Small shared formatting helpers for the admin dashboards.

export function timeAgo(input) {
  if (!input) return "";
  const diff = Math.floor((Date.now() - new Date(input).getTime()) / 1000);
  if (Number.isNaN(diff)) return "";
  if (diff < 60) return `${Math.max(diff, 0)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return formatDate(input);
}

export function formatDate(input) {
  if (!input) return "";
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

// Turns aggregate rows ({field, count}) into a lookup: { submitted: 3, approved: 12 }
export function countByField(rows, field) {
  const map = {};
  (rows || []).forEach((r) => { map[r[field]] = r.count; });
  return map;
}