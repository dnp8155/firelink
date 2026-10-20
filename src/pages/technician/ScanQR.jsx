import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { PageHeader, SectionCard, EmptyState } from "@/components/ui-bits";
import AssetResultCard from "@/components/technician/AssetResultCard";
import OfflineSyncPanel from "@/components/technician/OfflineSyncPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { logAudit } from "@/lib/auditLog";
import { enqueue, isOfflineError } from "@/lib/offline/queue";
import { assetCacheInfo, findCachedAsset } from "@/lib/offline/assetCache";
import { QrCode, ScanLine, Loader2 } from "lucide-react";

const todayISO = () => new Date().toISOString().slice(0, 10);
const plus90 = () => new Date(Date.now() + 90 * 864e5).toISOString().slice(0, 10);

export default function ScanQR() {
  const [code, setCode] = useState("");
  const [asset, setAsset] = useState(null);
  const [fromCache, setFromCache] = useState(false);
  const [searching, setSearching] = useState(false);
  const [logging, setLogging] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const scan = async (e) => {
    e.preventDefault();
    const query = code.trim();
    if (!query) return;
    setSearching(true);
    setAsset(null);
    setFromCache(false);

    // No signal: fall back to the asset list saved on this device.
    if (!navigator.onLine) {
      const cached = findCachedAsset(query);
      setSearching(false);
      if (cached) {
        setAsset(cached);
        setFromCache(true);
      } else {
        toast({
          title: "Offline",
          description: "This code is not in the device copy yet — it will work once you have signal.",
          variant: "destructive",
        });
      }
      return;
    }

    try {
      const page = await base44.entities.Asset.filter({ qr_code: query }, { limit: 1 });
      const found = page.items?.[0];
      const cached = found || findCachedAsset(query);
      if (!cached) {
        toast({ title: "Asset not found", description: "No asset matches this QR code.", variant: "destructive" });
      } else {
        setAsset(cached);
        setFromCache(!found);
      }
    } catch (err) {
      const cached = findCachedAsset(query);
      if (cached) {
        setAsset(cached);
        setFromCache(true);
      } else {
        toast({ title: "Scan failed", description: err.message, variant: "destructive" });
      }
    } finally {
      setSearching(false);
    }
  };

  const logInspection = async () => {
    if (!asset) return;
    setLogging(true);
    const today = todayISO();
    const next = plus90();
    const payload = {
      last_inspection_date: today,
      next_inspection_date: next,
      condition: "good",
      status: "active",
    };
    const audit = {
      action: "Asset inspection completed via QR scan",
      module: "Asset",
      entityId: asset.asset_code,
      before: asset.next_inspection_date || "",
      after: next,
    };
    const queueOffline = () => {
      enqueue({
        kind: "asset_inspection",
        entity_id: asset.id,
        label: `${asset.asset_code} · ${asset.name}`,
        payload,
        audit,
      });
      setAsset({ ...asset, ...payload });
      toast({ title: "Saved offline", description: "Logged on this device — it syncs when you're back online." });
    };

    if (!navigator.onLine) {
      queueOffline();
      setLogging(false);
      return;
    }

    try {
      await base44.entities.Asset.update(asset.id, payload);
      await logAudit(audit);
      setAsset({ ...asset, ...payload });
      toast({ title: "Inspection logged", description: `${asset.asset_code} · next due ${next}` });
    } catch (err) {
      if (isOfflineError(err)) {
        queueOffline();
      } else {
        toast({ title: "Failed to log inspection", description: err.message, variant: "destructive" });
      }
    } finally {
      setLogging(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Scan Asset QR" icon={QrCode} subtitle="Enter the QR code printed on any fire safety asset." />

      <OfflineSyncPanel />

      <form onSubmit={scan} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <ScanLine className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. QR-AST-000001"
              className="h-11 pl-11 text-base"
            />
          </div>
          <Button type="submit" size="lg" disabled={searching}>
            {searching ? <><Loader2 className="h-4 w-4 animate-spin" /> Searching…</> : "Verify asset"}
          </Button>
        </div>
      </form>

      {asset && fromCache && (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
          Loaded from this device · {assetCacheInfo().count} asset{assetCacheInfo().count === 1 ? "" : "s"} kept for offline
          use. Scanning and logging work without signal.
        </p>
      )}

      {asset && (
        <AssetResultCard
          asset={asset}
          busy={logging}
          onLog={logInspection}
          onViewInspections={() => navigate("/technician/inspections")}
        />
      )}

      {!asset && !searching && (
        <SectionCard className="mt-5">
          <EmptyState
            icon={QrCode}
            title="Scan to begin"
            description="Type the asset QR code above to pull up its details, inspection dates and log a new inspection."
          />
        </SectionCard>
      )}
    </div>
  );
}