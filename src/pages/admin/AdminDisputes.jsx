import React, { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { PageHeader, KpiCard, EmptyState } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ApprovalDialog from "@/components/admin/ApprovalDialog";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import { useToast } from "@/components/ui/use-toast";
import { logAudit } from "@/lib/auditLog";
import { timeAgo, formatDate } from "@/lib/format";
import { formatINR } from "@/hooks/useList";
import { AlertTriangle, ChevronRight, RotateCcw, IndianRupee, CreditCard, CheckCircle2 } from "lucide-react";

const CASE_FILTER = {
  $or: [
    { status: { $in: ["returned", "refunded"] } },
    { payment_status: { $in: ["failed", "refunded"] } },
  ],
};

export default function AdminDisputes() {
  const { toast } = useToast();
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
    const sumOf = (rowsList, field, key) => ((rowsList || []).find((r) => r[field] === key) || {}).sum_total || 0;
    const countOf = (rowsList, field, key) => ((rowsList || []).find((r) => r[field] === key) || {}).count || 0;
    setStats({
      returned: countOf(byStatus.rows, "status", "returned"),
      refundedOrders: countOf(byStatus.rows, "status", "refunded"),
      refundedValue: sumOf(byPayment.rows, "payment_status", "refunded") + sumOf(byStatus.rows, "status", "refunded"),
      failedValue: sumOf(byPayment.rows, "payment_status", "failed"),
      failed: countOf(byPayment.rows, "payment_status", "failed"),
      cases: countOf(byStatus.rows, "status", "returned") + countOf(byStatus.rows, "status", "refunded") + countOf(byPayment.rows, "payment_status", "failed"),
    });
  }, []);

  const loadRows = useCallback(async () => {
    setLoading(true);
    const page = await base44.entities.Order.filter(CASE_FILTER, { sort: "-updated_date", limit: 50 });
    setRows(page.items || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadStats(); loadRows(); }, [loadStats, loadRows, version]);

  const openCase = (order) => { setActive(order); setRemarks(""); };

  const resolve = async (patch, key, message) => {
    if (!active) return;
    setBusy(key);
    await base44.entities.Order.update(active.id, patch);
    // Closing a case as delivered registers the buyer's compliance assets (best-effort)
    if (patch.status === "delivered") {
      base44.functions.invoke("create_assets_from_order", { order_id: active.id }).catch(() => {});
    }
    await logAudit({ action: `dispute_${key === "refund" ? "refunded" : "closed"}`, module: "Order", entityId: active.id, before: `${active.status}/${active.payment_status}`, after: remarks || key });
    setBusy(null);
    setActive(null);
    setVersion((v) => v + 1);
    toast({ title: message, description: active.order_number });
  };

  return (
    <div>
      <PageHeader title="Disputes" icon={AlertTriangle} subtitle="Returned orders, failed payments and refund cases that need a decision." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Open cases" value={stats?.cases ?? "—"} sub="returns, refunds, failed payments" icon={AlertTriangle} tone="amber" />
        <KpiCard label="Returned orders" value={stats?.returned ?? "—"} sub="buyer sent the order back" icon={RotateCcw} tone="rose" />
        <KpiCard label="Refunded value" value={stats ? formatINR(stats.refundedValue) : "—"} sub={`${stats?.refundedOrders || 0} refunded orders`} icon={IndianRupee} tone="violet" />
        <KpiCard label="Failed payments" value={stats ? formatINR(stats.failedValue) : "—"} sub={`${stats?.failed || 0} transactions`} icon={CreditCard} tone="slate" />
      </div>

      <div className="mt-6 space-y-3">
        {loading ? (
          [0, 1, 2].map((i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)
        ) : rows.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <EmptyState icon={AlertTriangle} title="No open cases" description="Returns, refunds and failed payments will be listed here for review." />
          </div>
        ) : (
          rows.map((o) => (
            <div key={o.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">{o.order_number || "—"}</p>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                  {o.customer_name && <span>{o.customer_name}</span>}
                  {o.vendor_name && <span>{o.vendor_name}</span>}
                  {o.return_reason && <span className="truncate">Reason: {o.return_reason}</span>}
                  <span className="hidden md:inline">{timeAgo(o.updated_date || o.created_date)}</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                <span className="text-sm font-semibold text-slate-900">{formatINR(o.total)}</span>
                <StatusBadge status={o.payment_status} tone={statusTone(o.payment_status)} />
                <StatusBadge status={o.status} tone={statusTone(o.status)} />
                <Button size="sm" variant="outline" onClick={() => openCase(o)}>Review <ChevronRight className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          ))
        )}
      </div>

      <ApprovalDialog
        open={!!active}
        onClose={() => setActive(null)}
        title={active?.order_number || ""}
        subtitle={[active?.customer_name, active?.vendor_name].filter(Boolean).join(" · ")}
        status={active?.payment_status}
        details={active ? [
          { label: "Order status", value: active.status },
          { label: "Payment status", value: active.payment_status },
          { label: "Payment method", value: active.payment_method },
          { label: "Order value", value: formatINR(active.total) },
          { label: "Return reason", value: active.return_reason },
          { label: "Courier", value: active.courier },
          { label: "Tracking number", value: active.tracking_number },
          { label: "Shipping address", value: active.shipping_address },
          { label: "Placed on", value: formatDate(active.created_date) },
        ] : []}
        remarks={remarks}
        onRemarksChange={setRemarks}
        remarksLabel="Decision note (recorded in the audit trail)"
        busy={busy}
        actions={[
          { label: "Close case — no refund", variant: "outline", icon: <CheckCircle2 className="h-4 w-4" />, onClick: () => resolve({ status: "delivered" }, "close", "Case closed without refund"), loading: busy === "close" },
          { label: "Refund buyer", icon: <IndianRupee className="h-4 w-4" />, onClick: () => resolve({ payment_status: "refunded", status: "refunded" }, "refund", "Buyer refunded"), loading: busy === "refund" },
        ]}
      />
    </div>
  );
}