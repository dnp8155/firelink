import React, { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { formatINR } from "@/hooks/useList";
import { PageHeader, SectionCard, EmptyState, KpiCard } from "@/components/ui-bits";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import { ReceiptText, Search, TrendingUp, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";

const STATUSES = ["submitted", "revised", "accepted", "rejected", "expired"];

export default function QuotationMonitoring() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, value: 0, accepted: 0, pending: 0 });
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    (async () => {
      const { rows: groups } = await base44.entities.Quotation.aggregate({ groupBy: "status", sum: "total" });
      const by = {};
      (groups || []).forEach((g) => { by[g.status] = { count: g.count || 0, sum: g.sum_total || 0 }; });
      setStats({
        total: (groups || []).reduce((s, g) => s + (g.count || 0), 0),
        value: (groups || []).reduce((s, g) => s + (g.sum_total || 0), 0),
        accepted: by.accepted?.count || 0,
        pending: (by.submitted?.count || 0) + (by.revised?.count || 0),
      });
    })();
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const query = {};
    if (statusFilter !== "all") query.status = statusFilter;
    if (q.trim()) {
      query.$or = [
        { rfq_number: { $regex: q.trim(), $options: "i" } },
        { vendor_name: { $regex: q.trim(), $options: "i" } },
      ];
    }
    const page = await base44.entities.Quotation.filter(query, { sort: "-created_date", limit: 100 });
    setRows(page.items || []);
    setLoading(false);
  }, [statusFilter, q]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div>
      <PageHeader title="Quotation Monitoring" subtitle="Global view of all vendor quotations across RFQs." icon={ReceiptText} />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Total Quotations" value={stats.total} icon={ReceiptText} tone="rose" />
        <KpiCard label="Total Value" value={formatINR(stats.value)} icon={TrendingUp} tone="green" />
        <KpiCard label="Accepted" value={stats.accepted} icon={ReceiptText} tone="blue" />
        <KpiCard label="Pending" value={stats.pending} icon={Calendar} tone="amber" />
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by RFQ or vendor…" className="pl-9" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm capitalize">
          <option value="all">All Status</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-200/60" />)}</div>
      ) : rows.length === 0 ? (
        <SectionCard><EmptyState icon={ReceiptText} title="No quotations found" /></SectionCard>
      ) : (
        <SectionCard>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">RFQ</th>
                  <th className="px-5 py-3">Vendor</th>
                  <th className="px-5 py-3">Version</th>
                  <th className="px-5 py-3">Subtotal</th>
                  <th className="px-5 py-3">Tax</th>
                  <th className="px-5 py-3">Total</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rows.map((qt) => (
                  <tr key={qt.id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-3 font-medium text-slate-800">{qt.rfq_number || "—"}</td>
                    <td className="px-5 py-3 text-slate-600">{qt.vendor_name || "—"}</td>
                    <td className="px-5 py-3 text-slate-500">v{qt.version || 1}</td>
                    <td className="px-5 py-3 text-slate-700">{formatINR(qt.subtotal)}</td>
                    <td className="px-5 py-3 text-slate-500">{formatINR(qt.tax)}</td>
                    <td className="px-5 py-3 font-semibold text-slate-800">{formatINR(qt.total)}</td>
                    <td className="px-5 py-3"><StatusBadge status={qt.status} tone={statusTone(qt.status)} /></td>
                    <td className="px-5 py-3 text-xs text-slate-500">{qt.created_date ? new Date(qt.created_date).toLocaleDateString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}
    </div>
  );
}