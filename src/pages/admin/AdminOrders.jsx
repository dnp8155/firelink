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
import { countByField, timeAgo, formatDate } from "@/lib/format";
import { formatINR } from "@/hooks/useList";
import { ShoppingCart, ChevronRight, IndianRupee, Truck, RotateCcw, Ban, CheckCircle2 } from "lucide-react";

const TABS = [
  { key: "all", label: "All orders" },
  { key: "pending", label: "Pending" },
  { key: "processing", label: "Processing" },
  { key: "dispatched", label: "Dispatched" },
  { key: "delivered", label: "Delivered" },
  { key: "returns", label: "Returns & refunds" },
  { key: "cancelled", label: "Cancelled" },
];
const FILTERS = {
  all: {},
  pending: { status: "pending" },
  processing: { status: { $in: ["accepted", "packed"] } },
  dispatched: { status: "dispatched" },
  delivered: { status: "delivered" },
  returns: { status: { $in: ["returned", "refunded"] } },
  cancelled: { status: "cancelled" },
};

export default function AdminOrders() {
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
    const [byStatus, byPayment] = await Promise.all([
      base44.entities.Order.aggregate({ groupBy: "status", sum: ["total"] }),
      base44.entities.Order.aggregate({ groupBy: "payment_status", sum: ["total"] }),
    ]);
    const status = countByField(byStatus.rows, "status");
    const sums = {};
    (byStatus.rows || []).forEach((r) => { sums[r.status] = r.sum_total || 0; });
    const paid = ((byPayment.rows || []).find((r) => r.payment_status === "paid") || {}).sum_total || 0;
    setStats({
      status,
      sums,
      total: Object.values(status).reduce((n, c) => n + c, 0),
      gmv: (byStatus.rows || []).reduce((n, r) => n + (r.sum_total || 0), 0),
      paid,
      delivered: status.delivered || 0,
      returns: (status.returned || 0) + (status.refunded || 0),
    });
  }, []);

  const loadRows = useCallback(async () => {
    setLoading(true);
    const filter = { ...FILTERS[tab] };
    const term = query.trim();
    if (term) filter.$or = [{ order_number: { $regex: term, $options: "i" } }, { customer_name: { $regex: term, $options: "i" } }];
    const page = await base44.entities.Order.filter(filter, { sort: "-created_date", limit: 50 });
    setRows(page.items || []);
    setLoading(false);
  }, [tab, query]);

  useEffect(() => { loadStats(); }, [loadStats, version]);
  useEffect(() => {
    const t = setTimeout(loadRows, query.trim() ? 400 : 0);
    return () => clearTimeout(t);
  }, [loadRows, query, version]);

  const openOrder = (order) => { setActive(order); setRemarks(""); };

  const act = async (patch, label) => {
    if (!active) return;
    setBusy(label);
    await base44.entities.Order.update(active.id, patch);
    await logAudit({ action: `order_${label === "refund" ? "refunded" : "cancelled"}`, module: "Order", entityId: active.id, before: `${active.status}/${active.payment_status}`, after: remarks || label });
    setBusy(null);
    setActive(null);
    setVersion((v) => v + 1);
    toast({ title: label === "refund" ? "Order refunded" : "Order cancelled", description: active.order_number });
  };

  const tabs = TABS.map((t) => {
    const s = stats?.status || {};
    const count = t.key === "all" ? stats?.total || 0
      : t.key === "processing" ? (s.accepted || 0) + (s.packed || 0)
        : t.key === "returns" ? (s.returned || 0) + (s.refunded || 0)
          : s[t.key] || 0;
    return { ...t, count };
  });

  return (
    <div>
      <PageHeader title="Orders" icon={ShoppingCart} subtitle="Every marketplace order, its payment state and fulfilment." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Orders" value={stats?.total ?? "—"} icon={ShoppingCart} tone="blue" />
        <KpiCard label="Order value" value={stats ? formatINR(stats.gmv) : "—"} sub="all statuses" icon={IndianRupee} tone="violet" />
        <KpiCard label="Paid" value={stats ? formatINR(stats.paid) : "—"} sub="settled by buyers" icon={CheckCircle2} tone="green" />
        <KpiCard label="Returns & refunds" value={stats?.returns ?? "—"} sub={`${stats?.delivered || 0} delivered`} icon={RotateCcw} tone="amber" />
      </div>

      <div className="mt-6">
        <QueueHeader tabs={tabs} value={tab} onChange={setTab} query={query} onQueryChange={setQuery} placeholder="Search by order number or customer…" />
      </div>

      {loading ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}</div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <EmptyState icon={ShoppingCart} title="No orders here" description="Orders matching this filter will appear here." />
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((o) => (
            <div key={o.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">{o.order_number || "—"}</p>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                  {o.customer_name && <span>{o.customer_name}</span>}
                  {o.vendor_name && <span>{o.vendor_name}</span>}
                  <span>{(o.items || []).length} item{(o.items || []).length === 1 ? "" : "s"}</span>
                  <span className="hidden md:inline">{timeAgo(o.created_date)}</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                <span className="text-sm font-semibold text-slate-900">{formatINR(o.total)}</span>
                <StatusBadge status={o.payment_status} tone={statusTone(o.payment_status)} />
                <StatusBadge status={o.status} tone={statusTone(o.status)} />
                <Button size="sm" variant="outline" onClick={() => openOrder(o)}>View <ChevronRight className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ApprovalDialog
        open={!!active}
        onClose={() => setActive(null)}
        title={active?.order_number || ""}
        subtitle={[active?.customer_name, active?.vendor_name].filter(Boolean).join(" · ")}
        status={active?.status}
        details={active ? [
          { label: "Payment status", value: active.payment_status },
          { label: "Payment method", value: active.payment_method },
          { label: "Subtotal", value: formatINR(active.subtotal) },
          { label: "Tax", value: formatINR(active.tax) },
          { label: "Shipping", value: formatINR(active.shipping) },
          { label: "Total", value: formatINR(active.total) },
          { label: "Courier", value: active.courier },
          { label: "Tracking number", value: active.tracking_number },
          { label: "Shipping address", value: active.shipping_address },
          { label: "Return reason", value: active.return_reason },
          { label: "Notes", value: active.notes },
          { label: "Placed on", value: formatDate(active.created_date) },
        ] : []}
        documents={active ? {
          loading: false,
          items: (active.items || []).map((i, idx) => ({ id: `${active.id}-${idx}`, type: `${i.qty} × ${i.name}`, status: formatINR((i.price || 0) * (i.qty || 0)) })),
        } : null}
        documentsTitle="Items"
        remarks={remarks}
        onRemarksChange={setRemarks}
        remarksLabel="Reason / note (recorded in the audit trail)"
        busy={busy}
        actions={[
          { label: "Cancel order", variant: "outline", icon: <Ban className="h-4 w-4" />, onClick: () => act({ status: "cancelled" }, "cancel"), loading: busy === "cancel" },
          { label: "Refund payment", icon: <IndianRupee className="h-4 w-4" />, onClick: () => act({ payment_status: "refunded", status: "refunded" }, "refund"), loading: busy === "refund" },
        ]}
      />
    </div>
  );
}