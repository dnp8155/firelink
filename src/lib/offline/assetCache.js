// Device copy of the assets a technician was last shown.
// The Inspections screen refreshes this list, so a QR scan can still resolve an
// asset in a basement with no signal.

const KEY = "firelink.field.assets.v1";
const MAX_ASSETS = 300;

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && Array.isArray(parsed.assets) ? parsed : { saved_at: "", assets: [] };
  } catch {
    return { saved_at: "", assets: [] };
  }
}

export function saveAssets(assets) {
  if (!Array.isArray(assets) || !assets.length) return;
  try {
    const existing = read().assets;
    const byId = new Map(existing.map((asset) => [asset.id, asset]));
    assets.forEach((asset) => { if (asset?.id) byId.set(asset.id, asset); });
    const list = Array.from(byId.values()).slice(-MAX_ASSETS);
    localStorage.setItem(KEY, JSON.stringify({ saved_at: new Date().toISOString(), assets: list }));
  } catch {
    // ignore — offline copy is a convenience, never a requirement
  }
}

export function findCachedAsset(code) {
  const query = String(code || "").trim().toLowerCase();
  if (!query) return null;
  return (
    read().assets.find(
      (asset) =>
        String(asset.qr_code || "").toLowerCase() === query ||
        String(asset.asset_code || "").toLowerCase() === query
    ) || null
  );
}

export function assetCacheInfo() {
  const { saved_at, assets } = read();
  return { count: assets.length, savedAt: saved_at };
}