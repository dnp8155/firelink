// Service-level-agreement windows: the response time a service request has,
// measured from the moment the customer raised it.
export const SLA_HOURS = { critical: 4, high: 24, medium: 72, low: 168 };

export function slaHours(priority) {
  return SLA_HOURS[priority] || SLA_HOURS.medium;
}

export function formatWindow(hours) {
  return hours < 24 ? `${hours}h` : `${Math.round(hours / 24)}d`;
}

function countdown(ms) {
  const hours = ms / 3600000;
  if (hours < 1) return `${Math.max(1, Math.round(ms / 60000))} min`;
  if (hours < 24) return `${Math.round(hours)}h`;
  return `${Math.round(hours / 24)}d`;
}

// Deadline a new request inherits from its priority.
export function slaDueFrom(priority, from) {
  const base = from ? new Date(from).getTime() : Date.now();
  return new Date(base + slaHours(priority) * 3600000).toISOString();
}

// Display state of one request's SLA — derived so existing requests show a
// deadline even before the SLA check has stored one.
export function slaState(request) {
  const windowHours = Number(request.sla_hours) || slaHours(request.priority);
  const due = request.sla_due_date
    ? new Date(request.sla_due_date).getTime()
    : new Date(request.created_date || Date.now()).getTime() + windowHours * 3600000;
  const closed = ["completed", "cancelled"].includes(request.status);
  const left = due - Date.now();

  if (closed) {
    return left < 0
      ? { status: "missed", label: "Closed · SLA missed", tone: "red", due }
      : { status: "met", label: "Closed within SLA", tone: "green", due };
  }
  if (left <= 0) {
    return { status: "breached", label: `SLA breached · ${countdown(-left)} over`, tone: "red", due };
  }
  const dueSoon = left <= Math.min(windowHours * 3600000 * 0.25, 12 * 3600000);
  return {
    status: dueSoon ? "due_soon" : "on_track",
    label: `SLA ${dueSoon ? "closing" : "due"} · ${countdown(left)} left`,
    tone: dueSoon ? "amber" : "green",
    due,
  };
}