import React, { useState } from "react";
import { useList, formatINR } from "@/hooks/useList";
import { useVendor } from "@/lib/vendor";
import { base44 } from "@/api/base44Client";
import { PageHeader, SectionCard, EmptyState } from "@/components/ui-bits";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import { useToast } from "@/components/ui/use-toast";
import { PackageCheck, Truck, MapPin, ZoomIn } from "lucide-react";

export default function Shipments() {
  const { vendor } = useVendor();
  const { toast } = useToast();
  const orders = useList("Order", {}, "-created_date", 300);
  const [porterBusyId, setPorterBusyId] = useState(null);

  const mine = orders.data.filter((o) => (vendor && o.vendor_id === vendor.id) || (vendor && o.vendor_name === vendor.company_name));
  const readyToShip = mine.filter((o) => ["accepted", "packed"].includes(o.status));
  const inTransit = mine.filter((o) => o.status === "dispatched");
  const delivered = mine.filter((o) => o.status === "delivered");

  const bookPorter = async (o) => {
    setPorterBusyId(o.id);
    try {
      const res = await base44.functions.invoke("porter_book_delivery", {
        pickup_address: vendor?.address || vendor?.city || "Vendor warehouse",
        drop_address: o.shipping_address || "Customer address",
      });
      const d = res.data || {};
      await base44.entities.Order.update(o.id, {
        status: "dispatched",
        courier: "Porter",
        tracking_number: d.delivery_id || d.tracking_url || "—",
      });
      toast({ title: "Porter delivery booked!", description: `Delivery ID: ${d.delivery_id || "—"}` });
      orders.reload();
    } catch (e) {
      toast({ title: "Porter booking failed", description: e.response?.data?.error || e.message, variant: "destructive" });
    } finally { setPorterBusyId(null); }
  };

  return (
    <div>
      <PageHeader title="Shipments" icon={PackageCheck} subtitle="Track and update shipments for your orders." />

      <div className="mb-5 grid grid-cols-3 gap-4">
        <SectionCard><div className="p-4"><p className="text-xs text-slate-500">In Transit</p><p className="mt-1 text-2xl font-bold text-slate-900">{inTransit.length}</p></div></SectionCard>
        <SectionCard><div className="p-4"><p className="text-xs text-slate-500">Delivered</p><p className="mt-1 text-2xl font-bold text-emerald-600">{delivered.length}</p></div></SectionCard>
        <SectionCard><div className="p-4"><p className="text-xs text-slate-500">Ready to Ship</p><p className="mt-1 text-2xl font-bold text-amber-600">{mine.filter((o) => ["accepted", "packed"].includes(o.status)).length}</p></div></SectionCard>
      </div>

      {orders.loading ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-200/60" />)}</div>
      ) : inTransit.length === 0 ? (
        <SectionCard>
          <EmptyState icon={Truck} title="No active shipments" description="Dispatch orders from the Orders page — shipments will appear here for tracking." />
        </SectionCard>
      ) : (
        <SectionCard title="Active Shipments">
          <div className="divide-y divide-slate-50">
            {inTransit.map((o) => (
              <div key={o.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Truck className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-800">{o.order_number}</p>
                  <p className="text-xs text-slate-500">
                    {o.courier || "Courier"} · AWB {o.tracking_number || "—"} · {o.customer_name}
                  </p>
                  {o.shipping_address && (
                    <p className="mt-0.5 flex items-start gap-1 text-xs text-slate-400">
                      <MapPin className="mt-0.5 h-3 w-3 shrink-0" /> {o.shipping_address}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status="in transit" tone="blue" />
                  <span className="text-sm font-semibold text-slate-800">{formatINR(o.total)}</span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {readyToShip.length > 0 && (
        <div className="mb-5">
          <SectionCard title="Ready to Ship">
            <div className="divide-y divide-slate-50">
              {readyToShip.map((o) => (
                <div key={o.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                    <PackageCheck className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-800">{o.order_number}</p>
                    <p className="text-xs text-slate-500">{o.customer_name} · {o.shipping_address || "No address"}</p>
                  </div>
                  <button
                    onClick={() => bookPorter(o)}
                    disabled={porterBusyId === o.id}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
                  >
                    <ZoomIn className="h-3.5 w-3.5" /> {porterBusyId === o.id ? "Booking…" : "Book Porter Delivery"}
                  </button>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {delivered.length > 0 && (
        <div className="mt-5">
          <SectionCard title="Recently Delivered">
            <div className="divide-y divide-slate-50">
              {delivered.slice(0, 5).map((o) => (
                <div key={o.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800">{o.order_number}</p>
                    <p className="text-xs text-slate-500">{o.courier} · AWB {o.tracking_number || "—"}</p>
                  </div>
                  <StatusBadge status={o.status} tone={statusTone(o.status)} />
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}
    </div>
  );
}