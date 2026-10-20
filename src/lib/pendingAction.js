const KEY = "fsl_pending_action";

export function stashPendingAction(action) {
  try { localStorage.setItem(KEY, JSON.stringify(action)); } catch {}
}

export function getPendingAction() {
  try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; }
}

export function clearPendingAction() {
  try { localStorage.removeItem(KEY); } catch {}
}