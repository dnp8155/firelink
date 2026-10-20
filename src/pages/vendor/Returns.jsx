import React from "react";
import { base44 } from "@/api/base44Client";
import { useList, formatINR } from "@/hooks/useList";
import { useVendor, logVendorAction } from "@/lib/vendor";
import { PageHeader, SectionCard, EmptyState } from "@/components/ui-bits";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Undo2, CheckCircle2, XCircle, RotateCcw } from "lucide-react";

export default function Returns() {
  const { vendor } = useVendor();
  const { toast } = useToast();
  const orders = useList("Order", {}, "-created_date", 300);

  const mine = orders.data.filter((o) => (vendor && o.vendor_id === vendor.id) || (vendor && o.vendor_name === vendor.company_name));
  const returnsList = mine.filter((o) => ["returned", "refunded"].includes(o.status));

  const act = async (o, status, msg) => {
    try {
      await base44.entities.Order.update(o.id, { status });
      await logVendorAction("Return processed", "Vendor Returns", o.order_number, o.status, status);
      // An order restored to delivered gets its compliance assets registered (best-effort)
      if (status === "delivered") {
        base44.functions.invoke("create_assets_from_order", { order_id: o.id }).catch(() => {});
      }
      toast({ title: msg });
      orders.reload();
    } catch (e) {
      toast({ title: "Action failed", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div>
      <PageHeader title="Returns & Refunds" icon={Undo2} subtitle="Review and process customer return requests. Refund processing follows platform payment rules." />

      {orders.loading ? (
        <div className="space-y-3">{[0, 1].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-200/60" />)}</div>
      ) : returnsList.length === 0 ? (
        <SectionCard>
          <EmptyState icon={Undo2} title="No return requests" description="Customer returns on your orders will appear here for review." />
        </SectionCard>
      ) : (
        <div className="space-y-3">
          {returnsList.map((o) => (
            <SectionCard key={o.id}>
              <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-slate-900">{o.order_number}</p>
                    <StatusBadge status={o.status} tone={o.status === "refunded" ? "green" : "amber"} />
                    <StatusBadge status={o.payment_status} tone="gray" />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{o.customer_name} · {formatINR(o.total)}</p>
                  {o.return_reason && <p className="mt-1 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs text-amber-700 ring-1 ring-amber-100">Reason: {o.return_reason}</p>}
                </div>
                {o.status === "returned" ? (
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => act(o, "refunded", "Return accepted — refund queued with the platform")}>
                      <CheckCircle2 className="h-3.5 w-3.5" /> Accept & Refund
                    </Button>
                    <Button size="sm" variant="outline" className="text-rose-600 hover:bg-rose-50" onClick={() => act(o, "delivered", "Return rejected — order restored to delivered")}>
                      <XCircle className="h-3.5 w-3.5" /> Reject
                    </Button>
                  </div>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                    <RotateCcw className="h-3.5 w-3.5" /> Refund processed via platform
                  </span>
                )}
              </div>
            </SectionCard>
          ))}
        </div>
      )}
    </div>
  );
}