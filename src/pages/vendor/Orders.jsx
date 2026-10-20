import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useList, formatINR } from "@/hooks/useList";
import { useVendor, logVendorAction } from "@/lib/vendor";
import { PageHeader, SectionCard, EmptyState } from "@/components/ui-bits";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Truck, CheckCircle2, XCircle, PackageSearch, Search } from "lucide-react";

export default function Orders() {
  const { vendor } = useVendor();
  const { toast } = useToast();
  const orders = useList("Order", {}, "-created_date", 300);
  const [q, setQ] = useState("");
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState("");

  const mine = orders.data.filter((o) => (vendor && o.vendor_id === vendor.id) || (o.vendor_name && vendor && o.vendor_name === vendor.company_name));
  const filtered = mine.filter((o) => !q || `${o.order_number} ${o.customer_name} ${o.status}`.toLowerCase().includes(q.toLowerCase()));

  const update = async (o, patch, msg) => {
    try {
      await base44.entities.Order.update(o.id, patch);
      await logVendorAction("Order status change", "Vendor Orders", o.order_number, o.status, patch.status || o.status);
      if (patch.status) {
        // Let the customer know their order progressed (best-effort)
        base44.functions.invoke("order_notification", { type: "order_status", order_id: o.id }).catch(() => {});
        // Delivered goods become QR-tracked compliance assets for the buyer (best-effort)
        if (patch.status === "delivered") {
          base44.functions.invoke("create_assets_from_order", { order_id: o.id }).catch(() => {});
        }
      }
      toast({ title: msg });
      orders.reload();
    } catch (e) {
      toast({ title: "Action failed", description: e.message, variant: "destructive" });
    }
  };

  const confirmReject = async () => {
    if (!reason.trim()) { toast({ title: "Please provide a rejection reason.", variant: "destructive" }); return; }
    await update(rejecting, { status: "cancelled", notes: reason }, "Order rejected");
    setRejecting(null); setReason("");
  };

  const STATUS_ACTIONS = {
    pending: (o) => (
      <>
        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => update(o, { status: "accepted" }, "Order accepted")}>
          <CheckCircle2 className="h-3.5 w-3.5" /> Accept
        </Button>
        <Button size="sm" variant="outline" className="text-rose-600 hover:bg-rose-50" onClick={() => setRejecting(o)}>
          <XCircle className="h-3.5 w-3.5" /> Reject
        </Button>
      </>
    ),
    accepted: (o) => (
      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => update(o, { status: "packed" }, "Order packed & ready to ship")}>
        Pack & Ready to Ship
      </Button>
    ),
    packed: (o) => <PackShipment order={o} onDone={(courier, tracking) => update(o, { status: "dispatched", courier, tracking_number: tracking }, "Shipment created — order dispatched")} />,
    dispatched: (o) => (
      <Button size="sm" variant="outline" onClick={() => update(o, { status: "delivered" }, "Order marked delivered")}>
        Mark Delivered
      </Button>
    ),
  };

  return (
    <div>
      <PageHeader title="Orders" icon={Truck} subtitle="Orders placed by customers for your products." />

      <div className="mb-4 relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search orders…"
          className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-emerald-300" />
      </div>

      {orders.loading ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-200/60" />)}</div>
      ) : filtered.length === 0 ? (
        <SectionCard><EmptyState icon={Truck} title="No orders yet" description="Once customers place orders on your products, they will appear here." /></SectionCard>
      ) : (
        <div className="space-y-3">
          {filtered.map((o) => (
            <SectionCard key={o.id}>
              <div className="flex flex-col gap-3 p-5 lg:flex-row lg:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-slate-900">{o.order_number}</p>
                    <StatusBadge status={o.status} tone={statusTone(o.status)} />
                    <StatusBadge status={o.payment_status} tone={statusTone(o.payment_status)} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {o.customer_name || "Customer"} · {(o.items || []).length} item(s) · {o.created_date ? new Date(o.created_date).toLocaleDateString() : "—"}
                  </p>
                  {(o.notes || o.return_reason) && <p className="mt-1 text-xs text-amber-600">{o.return_reason ? `Return reason: ${o.return_reason}` : `Note: ${o.notes}`}</p>}
                </div>
                <div className="text-right">
                  <p className="text-base font-bold text-slate-900">{formatINR(o.total)}</p>
                  <div className="mt-1.5 flex flex-wrap justify-end gap-2">
                    {STATUS_ACTIONS[o.status] ? STATUS_ACTIONS[o.status](o) : (
                      <span className="text-xs text-slate-400">
                        {["delivered", "cancelled", "returned", "refunded"].includes(o.status) ? "No actions available" : ""}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </SectionCard>
          ))}
        </div>
      )}

      <Dialog open={!!rejecting} onOpenChange={(op) => !op && setRejecting(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject Order</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-600">Please provide a reason — the customer will be notified.</p>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="e.g. Item out of stock, delivery location not serviceable…" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejecting(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmReject}>Reject Order</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PackShipment({ order, onDone }) {
  const [courier, setCourier] = useState(order.courier || "");
  const [tracking, setTracking] = useState(order.tracking_number || "");
  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      <Input value={courier} onChange={(e) => setCourier(e.target.value)} placeholder="Courier" className="h-8 w-28 text-xs" />
      <Input value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="Tracking no." className="h-8 w-32 text-xs" />
      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" disabled={!courier || !tracking} onClick={() => onDone(courier, tracking)}>
        <PackageSearch className="h-3.5 w-3.5" /> Dispatch
      </Button>
    </div>
  );
}