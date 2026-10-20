import React, { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { PageHeader, KpiCard, EmptyState } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import QueueHeader from "@/components/admin/QueueHeader";
import ApprovalDialog from "@/components/admin/ApprovalDialog";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import { useToast } from "@/components/ui/use-toast";
import { logAudit } from "@/lib/auditLog";
import { countByField, formatDate, timeAgo } from "@/lib/format";
import { formatINR } from "@/hooks/useList";
import { Percent, ChevronRight, IndianRupee, Wallet, Clock, CheckCircle2 } from "lucide-react";

const TABS = [
  { key: "all", label: "All settlements" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "paid", label: "Paid" },
];

export default function Commissions() {
  const { toast } = useToast();
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [active, setActive] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [busy, setBusy] = useState(null);
  const [version, setVersion] = useState(0);

  const loadStats = useCallback(async () => {
    const res = await base44.entities.Settlement.aggregate({ groupBy: "status", sum: ["gross", "commission", "net_payable"] });
    const list = res.rows || [];
    const pick = (key) => list.find((r) => r.status === key) || {};
    setStats({
      counts: countByField(list, "status"),
      total: list.reduce((n, r) => n + (r.count || 0), 0),
      pending: pick("pending").sum_net_payable || 0,
      approved: pick("approved").sum_net_payable || 0,
      paid: pick("paid").sum_net_payable || 0,
      commission: list.reduce((n, r) => n + (r.sum_commission || 0), 0),
      gross: list.reduce((n, r) => n + (r.sum_gross || 0), 0),
    });
  }, []);

  const loadRows = useCallback(async () => {
    setLoading(true);
    const filter = tab === "all" ? {} : { status: tab };
    const term = query.trim();
    if (term) filter.vendor_name = { $regex: term, $options: "i" };
    const page = await base44.entities.Settlement.filter(filter, { sort: "-created_date", limit: 50 });
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
    await base44.entities.Settlement.update(active.id, patch);
    await logAudit({ action: `settlement_${patch.status}`, module: "Settlement", entityId: active.id, before: active.status, after: remarks || patch.status });
    setBusy(null);
    setActive(null);
    setVersion((v) => v + 1);
    toast({ title: message, description: active.vendor_name });
  };

  const tabs = TABS.map((t) => ({ ...t, count: t.key === "all" ? stats?.total || 0 : stats?.counts?.[t.key] || 0 }));

  return (
    <div>
      <PageHeader title="Commissions" icon={Percent} subtitle="Platform commission and vendor payouts, period by period." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Commission earned" value={stats ? formatINR(stats.commission) : "—"} sub={stats ? `on ${formatINR(stats.gross)} gross` : null} icon={Percent} tone="rose" />
        <KpiCard label="Pending payout" value={stats ? formatINR(stats.pending) : "—"} sub="waiting for approval" icon={Clock} tone="amber" />
        <KpiCard label="Approved" value={stats ? formatINR(stats.approved) : "—"} sub="ready to release" icon={IndianRupee} tone="violet" />
        <KpiCard label="Paid out" value={stats ? formatINR(stats.paid) : "—"} sub="settled to vendors" icon={Wallet} tone="green" />
      </div>

      <div className="mt-6">
        <QueueHeader tabs={tabs} value={tab} onChange={setTab} query={query} onQueryChange={setQuery} placeholder="Search by vendor…" />
      </div>

      {loading ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}</div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <EmptyState icon={Percent} title="No settlements yet" description="Vendor settlement runs will appear here for approval and payout." />
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((s) => (
            <div key={s.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">{s.vendor_name || "Vendor"}</p>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                  {s.period && <span>Period {s.period}</span>}
                  <span>{s.order_count || 0} orders</span>
                  <span>Gross {formatINR(s.gross)}</span>
                  <span className="hidden md:inline">{timeAgo(s.created_date)}</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 sm:justify-end">
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900">{formatINR(s.net_payable)}</p>
                  <p className="text-[11px] text-slate-500">{Math.round((s.commission_rate || 0) * 100)}% · {formatINR(s.commission)}</p>
                </div>
                <StatusBadge status={s.status} tone={statusTone(s.status)} />
                <Button size="sm" variant="outline" onClick={() => openRow(s)}>Review <ChevronRight className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ApprovalDialog
        open={!!active}
        onClose={() => setActive(null)}
        title={active?.vendor_name || "Settlement"}
        subtitle={active?.period ? `Period ${active.period}` : ""}
        status={active?.status}
        details={active ? [
          { label: "Orders included", value: active.order_count },
          { label: "Gross value", value: formatINR(active.gross) },
          { label: "Commission rate", value: `${Math.round((active.commission_rate || 0) * 100)}%` },
          { label: "Commission", value: formatINR(active.commission) },
          { label: "Net payable", value: formatINR(active.net_payable) },
          { label: "Notes", value: active.notes },
          { label: "Created on", value: formatDate(active.created_date) },
        ] : []}
        remarks={remarks}
        onRemarksChange={setRemarks}
        remarksLabel="Payout reference / note (recorded in the audit trail)"
        busy={busy}
        actions={[
          { label: "Approve payout", variant: "outline", icon: <CheckCircle2 className="h-4 w-4" />, onClick: () => update({ status: "approved" }, "approved", "Payout approved"), loading: busy === "approved" },
          { label: "Mark as paid", icon: <Wallet className="h-4 w-4" />, onClick: () => update({ status: "paid" }, "paid", "Payout marked paid"), loading: busy === "paid" },
        ]}
      />
    </div>
  );
}