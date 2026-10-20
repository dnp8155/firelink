import React, { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { PageHeader, KpiCard, SectionCard, EmptyState } from "@/components/ui-bits";
import InspectionRow from "@/components/technician/InspectionRow";
import OfflineSyncPanel from "@/components/technician/OfflineSyncPanel";
import { useToast } from "@/components/ui/use-toast";
import { logAudit } from "@/lib/auditLog";
import { enqueue, isOfflineError } from "@/lib/offline/queue";
import { saveAssets } from "@/lib/offline/assetCache";
import { ClipboardCheck, Boxes, AlertCircle, AlertTriangle } from "lucide-react";

const todayISO = () => new Date().toISOString().slice(0, 10);
const plus90 = () => new Date(Date.now() + 90 * 864e5).toISOString().slice(0, 10);

const dueQuery = () => ({
  $or: [
    { next_inspection_date: { $lte: todayISO() } },
    { next_inspection_date: { $exists: false } },
    { condition: { $in: ["needs_attention", "faulty"] } },
  ],
});

export default function Inspections() {
  const [assets, setAssets] = useState([]);
  const [counts, setCounts] = useState({ total: 0, due: 0, attention: 0, faulty: 0 });
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const query = dueQuery();
      const [list, total, due, attention, faulty] = await Promise.all([
        base44.entities.Asset.filter(query, { sort: "next_inspection_date", limit: 50 }),
        base44.entities.Asset.count({}),
        base44.entities.Asset.count(query),
        base44.entities.Asset.count({ condition: "needs_attention" }),
        base44.entities.Asset.count({ condition: "faulty" }),
      ]);
      setAssets(list.items || []);
      setCounts({ total, due, attention, faulty });
      saveAssets(list.items || []); // keep a device copy so QR scans work offline
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Refresh the list once queued field work reaches the server.
  useEffect(() => {
    const onSynced = () => load();
    window.addEventListener("firelink:field-synced", onSynced);
    return () => window.removeEventListener("firelink:field-synced", onSynced);
  }, [load]);

  const markInspected = async (asset) => {
    setBusyId(asset.id);
    const today = todayISO();
    const next = plus90();
    const payload = {
      last_inspection_date: today,
      next_inspection_date: next,
      condition: "good",
      status: "active",
    };
    const audit = {
      action: "Asset inspection completed",
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
      toast({ title: "Saved offline", description: `${asset.asset_code} syncs automatically when you're back online.` });
    };

    if (!navigator.onLine) {
      queueOffline();
      setBusyId(null);
      return;
    }

    try {
      await base44.entities.Asset.update(asset.id, payload);
      await logAudit(audit);
      toast({ title: "Inspection complete", description: `${asset.asset_code} · next due ${next}` });
      await load();
    } catch (e) {
      if (isOfflineError(e)) {
        queueOffline();
      } else {
        toast({ title: "Update failed", description: e.message, variant: "destructive" });
      }
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <PageHeader title="Inspections" icon={ClipboardCheck} subtitle="Assets due for inspection and their schedules." />

      <OfflineSyncPanel />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Total Assets" value={counts.total} icon={Boxes} tone="blue" />
        <KpiCard label="Due for Inspection" value={counts.due} icon={ClipboardCheck} tone="amber" />
        <KpiCard label="Needs Attention" value={counts.attention} icon={AlertCircle} tone="rose" />
        <KpiCard label="Faulty" value={counts.faulty} icon={AlertTriangle} tone="rose" />
      </div>

      <div className="mt-6">
        <SectionCard title={`Due now (${counts.due})`}>
          {loading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          ) : assets.length === 0 ? (
            <EmptyState
              icon={ClipboardCheck}
              title="Nothing due right now"
              description="Assets whose inspection date is approaching, or that need attention, will appear here."
            />
          ) : (
            <div className="divide-y divide-slate-50">
              {assets.map((asset) => (
                <InspectionRow
                  key={asset.id}
                  asset={asset}
                  busy={busyId === asset.id}
                  onMark={markInspected}
                />
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}