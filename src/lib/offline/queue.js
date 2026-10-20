// Offline field-capture queue.
// Field work happens in basements, plant rooms and stairwells with no signal.
// Every write a technician makes while offline is parked here (on the device)
// and flushed to the server as soon as the connection is usable again.

const QUEUE_KEY = "firelink.field.queue.v1";
const SYNC_KEY = "firelink.field.lastSync.v1";

const listeners = new Set();
const emit = (items) => listeners.forEach((fn) => fn(items));

export function readQueue() {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(items) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
  } catch {
    // device storage unavailable or full — nothing else we can do here
  }
  emit(items);
}

export function subscribeQueue(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function enqueue(op) {
  const item = {
    id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    created_at: new Date().toISOString(),
    ...op,
  };
  writeQueue([...readQueue(), item]);
  return item;
}

export function dequeue(id) {
  writeQueue(readQueue().filter((item) => item.id !== id));
}

export function readLastSync() {
  try {
    return localStorage.getItem(SYNC_KEY) || "";
  } catch {
    return "";
  }
}

export function writeLastSync(iso) {
  try {
    localStorage.setItem(SYNC_KEY, iso);
  } catch {
    // ignore
  }
}

// True when a write failed because the device has no usable connection —
// those get queued instead of dropped. Server-side rejections fall through.
export function isOfflineError(err) {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return true;
  const message = String(err?.message || err || "").toLowerCase();
  return /network|failed to fetch|load failed|timeout|timed out|econn|offline|connection/.test(message);
}