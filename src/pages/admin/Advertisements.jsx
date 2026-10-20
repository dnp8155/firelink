import React, { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { PageHeader, KpiCard, EmptyState } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Image } from "@/components/ui/image";
import QueueHeader from "@/components/admin/QueueHeader";
import ApprovalDialog from "@/components/admin/ApprovalDialog";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import { useToast } from "@/components/ui/use-toast";
import { logAudit } from "@/lib/auditLog";
import { countByField, formatDate } from "@/lib/format";
import { formatINR } from "@/hooks/useList";
import { Megaphone, ChevronRight, Eye, MousePointerClick, Clock, Rocket, Ban, CheckCircle2 } from "lucide-react";

const TABS = [
  { key: "pending", label: "Pending review" },
  { key: "live", label: "Live" },
  { key: "rejected", label: "Rejected" },
  { key: "inactive", label: "Paused" },
  { key: "all", label: "All" },
];
const FILTERS = {
  pending: { status: "pending" },
  live: { status: { $in: ["approved", "active"] } },
  rejected: { status: "rejected" },
  inactive: { status: "inactive" },
  all: {},
};

export default function Advertisements() {
  const { toast } = useToast();
  const [tab, setTab] = useState("pending");
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [active, setActive] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [busy, setBusy] = useState(null);
  const [version, setVersion] = useState(0);

  const loadStats = useCallback(async () => {
    const res = await base44.entities.Advertisement.aggregate({ groupBy: "status", sum: ["impressions", "clicks", "budget"] });
    const list = res.rows || [];
    const counts = countByField(list, "status");
    const impressions = list.reduce((n, r) => n + (r.sum_impressions || 0), 0);
    const clicks = list.reduce((n, r) => n + (r.sum_clicks || 0), 0);
    setStats({
      counts,
      total: list.reduce((n, r) => n + (r.count || 0), 0),
      pending: counts.pending || 0,
      live: (counts.approved || 0) + (counts.active || 0),
      impressions,
      clicks,
      ctr: impressions ? ((clicks / impressions) * 100).toFixed(1) : "0.0",
      budget: list.reduce((n, r) => n + (r.sum_budget || 0), 0),
    });
  }, []);

  const loadRows = useCallback(async () => {
    setLoading(true);
    const filter = { ...FILTERS[tab] };
    const term = query.trim();
    if (term) filter.title = { $regex: term, $options: "i" };
    const page = await base44.entities.Advertisement.filter(filter, { sort: "-created_date", limit: 50 });
    setRows(page.items || []);
    setLoading(false);
  }, [tab, query]);

  useEffect(() => { loadStats(); }, [loadStats, version]);
  useEffect(() => {
    const t = setTimeout(loadRows, query.trim() ? 400 : 0);
    return () => clearTimeout(t);
  }, [loadRows, query, version]);

  const openRow = (row) => { setActive(row); setRemarks(""); };

  const update = async (patch, key, message) => {
    if (!active) return;
    setBusy(key);
    await base44.entities.Advertisement.update(active.id, patch);
    await logAudit({ action: `advertisement_${patch.status}`, module: "Advertisement", entityId: active.id, before: active.status, after: remarks || patch.status });
    setBusy(null);
    setActive(null);
    setVersion((v) => v + 1);
    toast({ title: message, description: active.title });
  };

  const tabs = TABS.map((t) => ({
    ...t,
    count: t.key === "all" ? stats?.total || 0
      : t.key === "live" ? stats?.live || 0
        : stats?.counts?.[t.key] || 0,
  }));

  return (
    <div>
      <PageHeader title="Advertisements" icon={Megaphone} subtitle="Vendor campaigns waiting for approval, and how they perform." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Pending review" value={stats?.pending ?? "—"} sub={`${stats?.total || 0} campaigns in total`} icon={Clock} tone="amber" />
        <KpiCard label="Live campaigns" value={stats?.live ?? "—"} sub={stats ? `${formatINR(stats.budget)} booked` : null} icon={Rocket} tone="green" />
        <KpiCard label="Impressions" value={stats?.impressions ?? "—"} icon={Eye} tone="blue" />
        <KpiCard label="Clicks" value={stats?.clicks ?? "—"} sub={stats ? `${stats.ctr}% click-through` : null} icon={MousePointerClick} tone="violet" />
      </div>

      <div className="mt-6">
        <QueueHeader tabs={tabs} value={tab} onChange={setTab} query={query} onQueryChange={setQuery} placeholder="Search campaigns…" />
      </div>

      {loading ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}</div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <EmptyState icon={Megaphone} title="No campaigns here" description="Vendor ad campaigns appear here for approval and monitoring." />
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((ad) => {
            const ctr = ad.impressions ? ((ad.clicks || 0) / ad.impressions) * 100 : 0;
            return (
              <div key={ad.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm transition hover:border-slate-300 sm:flex-row sm:items-center">
                <div className="h-20 w-full shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:h-16 sm:w-28">
                  {ad.image_url && <Image src={ad.image_url} alt={ad.title} className="h-full w-full" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">{ad.title}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    {ad.vendor_name && <span>{ad.vendor_name}</span>}
                    <span className="capitalize">{String(ad.placement || "").replace(/_/g, " ")}</span>
                    {ad.budget != null && <span>{formatINR(ad.budget)} budget</span>}
                    <span className="hidden md:inline">{ad.impressions || 0} views · {ad.clicks || 0} clicks · {ctr.toFixed(1)}% CTR</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                  <StatusBadge status={ad.status} tone={statusTone(ad.status)} />
                  <Button size="sm" variant="outline" onClick={() => openRow(ad)}>Review <ChevronRight className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ApprovalDialog
        open={!!active}
        onClose={() => setActive(null)}
        title={active?.title || ""}
        subtitle={[active?.vendor_name, active?.placement].filter(Boolean).join(" · ")}
        status={active?.status}
        hero={active?.image_url ? (
          <div className="overflow-hidden rounded-xl border border-slate-100">
            <Image src={active.image_url} alt={active.title} className="h-44 w-full" />
          </div>
        ) : null}
        details={active ? [
          { label: "Vendor", value: active.vendor_name },
          { label: "Placement", value: String(active.placement || "").replace(/_/g, " ") },
          { label: "Target link", value: active.target_url },
          { label: "Budget", value: formatINR(active.budget) },
          { label: "Starts", value: formatDate(active.start_date) },
          { label: "Ends", value: formatDate(active.end_date) },
          { label: "Impressions", value: active.impressions || 0 },
          { label: "Clicks", value: active.clicks || 0 },
        ] : []}
        remarks={remarks}
        onRemarksChange={setRemarks}
        remarksLabel="Review note (recorded in the audit trail)"
        busy={busy}
        actions={[
          { label: "Reject", variant: "outline", icon: <Ban className="h-4 w-4" />, onClick: () => update({ status: "rejected" }, "rejected", "Campaign rejected"), loading: busy === "rejected" },
          { label: "Pause", variant: "outline", icon: <Clock className="h-4 w-4" />, onClick: () => update({ status: "inactive" }, "inactive", "Campaign paused"), loading: busy === "inactive" },
          { label: "Approve", variant: "outline", icon: <CheckCircle2 className="h-4 w-4" />, onClick: () => update({ status: "approved" }, "approved", "Campaign approved"), loading: busy === "approved" },
          { label: "Set live", icon: <Rocket className="h-4 w-4" />, onClick: () => update({ status: "active" }, "active", "Campaign is live"), loading: busy === "active" },
        ]}
      />
    </div>
  );
}