import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { formatINR } from "@/hooks/useList";
import { SectionCard, EmptyState } from "@/components/ui-bits";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import { Image } from "@/components/ui/image";
import { useToast } from "@/components/ui/use-toast";
import { downloadInvoice, downloadPurchaseOrder } from "@/lib/invoice";
import { Package, ArrowLeft, X, RotateCcw, Download, LifeBuoy, Truck, CreditCard, MapPin, Boxes } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  ["pending", "Placed"],
  ["accepted", "Confirmed"],
  ["packed", "Processing"],
  ["dispatched", "Shipped"],
  ["delivered", "Delivered"],
];

export default function OrderDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [assets, setAssets] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const loaded = await base44.entities.Order.get(id);
        setOrder(loaded);
        // Goods delivered on this order are auto-registered as QR-tracked assets
        if (loaded.status === "delivered") {
          const page = await base44.entities.Asset.filter({ order_id: id }, { sort: "-created_date", limit: 50 });
          setAssets(page.items || []);
        }
      } catch {
        setOrder(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const act = async (status, msg) => {
    setBusy(true);
    try {
      await base44.entities.Order.update(id, { status });
      setOrder((o) => ({ ...o, status }));
      base44.functions.invoke("order_notification", { type: "order_status", order_id: id }).catch(() => {});
      toast({ title: msg });
    } catch (e) {
      toast({ title: "Action failed", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />;
  if (!order)
    return (
      <SectionCard>
        <EmptyState icon={Package} title="Order not found" description="This order may have been removed or is not accessible." action={<Link to="/customer/orders" className="text-sm font-semibold text-primary hover:underline">Back to My Orders</Link>} />
      </SectionCard>
    );

  const stepIdx = STEPS.findIndex(([s]) => s === order.status);
  const cancelled = ["cancelled", "returned", "refunded"].includes(order.status);

  return (
    <div className="mx-auto max-w-5xl">
      <Link to="/customer/orders" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Back to My Orders
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">{order.order_number}</h1>
          <p className="text-sm text-slate-500">Placed on {new Date(order.created_date).toLocaleDateString()} · Vendor: <span className="font-medium text-slate-700">{order.vendor_name || "—"}</span></p>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-lg font-bold text-slate-900">{formatINR(order.total)}</p>
          <StatusBadge status={order.status} tone={statusTone(order.status)} />
        </div>
      </div>

      {/* Timeline */}
      <SectionCard className="mb-4">
        <div className="p-5">
          {cancelled ? (
            <div className="flex items-center gap-3 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              <X className="h-4 w-4" /> This order is {order.status.replace("_", " ")}.
            </div>
          ) : (
            <div className="flex items-start">
              {STEPS.map(([s, label], i) => (
                <React.Fragment key={s}>
                  <div className="flex flex-col items-center">
                    <div className={cn("flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold", i <= stepIdx ? "bg-primary text-white shadow-sm" : "bg-slate-100 text-slate-400")}>
                      {i + 1}
                    </div>
                    <span className={cn("mt-1.5 whitespace-nowrap text-[10px] font-medium sm:text-xs", i <= stepIdx ? "text-primary" : "text-slate-400")}>{label}</span>
                  </div>
                  {i < STEPS.length - 1 && <div className={cn("mx-1 mt-4 h-0.5 flex-1 sm:mx-2", i < stepIdx ? "bg-primary" : "bg-slate-200")} />}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      </SectionCard>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Items */}
        <SectionCard title="Items" className="lg:col-span-2">
          <div className="divide-y divide-slate-100">
            {(order.items || []).map((it, i) => (
              <div key={i} className="flex items-center gap-3 p-4">
                {it.image_url ? <Image src={it.image_url} className="h-14 w-14 rounded-xl" /> : <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 text-slate-400"><Package className="h-6 w-6" /></div>}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800">{it.name}</p>
                  <p className="text-xs text-slate-500">SKU: {it.sku || "—"} · Qty: {it.qty}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900">{formatINR((it.price || 0) * (it.qty || 1))}</p>
                  <p className="text-xs text-slate-400">{formatINR(it.price)} each</p>
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-1.5 border-t border-slate-100 p-4 text-sm">
            <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>{formatINR(order.subtotal)}</span></div>
            <div className="flex justify-between text-slate-500"><span>Tax (GST)</span><span>{formatINR(order.tax)}</span></div>
            <div className="flex justify-between text-slate-500"><span>Shipping</span><span>{order.shipping ? formatINR(order.shipping) : "Free"}</span></div>
            <div className="flex justify-between border-t border-slate-100 pt-1.5 text-base font-bold text-slate-900"><span>Total</span><span>{formatINR(order.total)}</span></div>
          </div>
        </SectionCard>

        {/* Side info */}
        <div className="space-y-4">
          <SectionCard title="Payment">
            <div className="space-y-2 p-5 text-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-500"><CreditCard className="h-4 w-4" /> Status</span>
                <StatusBadge status={order.payment_status} tone={statusTone(order.payment_status)} />
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-500"><CreditCard className="h-4 w-4" /> Method</span>
                <span className="font-medium text-slate-700">{order.payment_method || "—"}</span>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Shipping">
            <div className="space-y-2 p-5 text-sm">
              <p className="flex items-start gap-2 text-slate-600"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" /> {order.shipping_address || "—"}</p>
              <p className="flex items-center gap-2 text-slate-600"><Truck className="h-4 w-4 shrink-0 text-slate-400" /> Tracking: <span className="font-medium text-slate-700">{order.tracking_number || "Not available yet"}</span></p>
            </div>
          </SectionCard>

          {assets.length > 0 && (
            <SectionCard title="Compliance assets">
              <div className="space-y-2 p-5 text-sm">
                <p className="flex items-center gap-2 text-slate-600">
                  <Boxes className="h-4 w-4 shrink-0 text-slate-400" /> {assets.length} QR-tracked asset{assets.length === 1 ? "" : "s"} registered
                </p>
                {assets[0].next_inspection_date && (
                  <p className="text-xs text-slate-500">First inspection due {assets[0].next_inspection_date}.</p>
                )}
                <Link to="/customer/assets" className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  <Boxes className="h-4 w-4" /> View assets
                </Link>
              </div>
            </SectionCard>
          )}

          <SectionCard title="Actions">
            <div className="space-y-2 p-5">
              {["pending", "accepted"].includes(order.status) && (
                <button onClick={() => act("cancelled", "Order cancelled")} disabled={busy} className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-50">
                  <X className="h-4 w-4" /> Cancel Order
                </button>
              )}
              {order.status === "delivered" && (
                <button onClick={() => act("returned", "Return request submitted")} disabled={busy} className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-50">
                  <RotateCcw className="h-4 w-4" /> Request Return
                </button>
              )}
              <button onClick={() => downloadInvoice(order)} className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                <Download className="h-4 w-4" /> Download Invoice
              </button>
              <button onClick={() => downloadPurchaseOrder(order)} className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-medium text-orange-700 hover:bg-orange-100">
                <Download className="h-4 w-4" /> Download PO
              </button>
              <Link to="/customer/support" className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                <LifeBuoy className="h-4 w-4" /> Contact Support
              </Link>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}