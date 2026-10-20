import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useCart } from "@/lib/CartContext";
import { useRole } from "@/lib/RoleContext";
import { useAuth } from "@/lib/AuthContext";
import { PageHeader, SectionCard, EmptyState } from "@/components/ui-bits";
import { formatINR } from "@/hooks/useList";
import { Image } from "@/components/ui/image";
import { ShoppingCart, Trash2, Minus, Plus, ShieldCheck, Truck, ArrowRight, Check, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

export default function Cart() {
  const { items, remove, setQty, clear, total } = useCart();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { activeRole } = useRole();
  const [placing, setPlacing] = useState(false);
  const [paying, setPaying] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);

  const payWithRazorpay = async () => {
    if (items.length === 0) return;
    if (!user?.id) { toast({ title: "Please sign in to pay.", variant: "destructive" }); return; }
    setPaying(true);
    try {
      // 1. Create the order(s) first (COD), then init Razorpay for the grand total
      const groups = {};
      items.forEach((i) => {
        const key = i.vendor_id || "unassigned";
        if (!groups[key]) groups[key] = { vendor_id: i.vendor_id || null, vendor_name: i.vendor_name || "", items: [] };
        groups[key].items.push(i);
      });
      const orgId = user?.data?.organization_id || user?.organization_id || null;
      const stamp = Date.now().toString().slice(-8);
      const created = [];
      let n = 0;
      for (const g of Object.values(groups)) {
        n += 1;
        const sub = g.items.reduce((s, i) => s + i.price * i.qty, 0);
        const gTax = Math.round(sub * 0.18);
        const order = await base44.entities.Order.create({
          order_number: `ORD-${stamp}-${n}`,
          customer_id: user.id, customer_name: user.full_name || user.email,
          organization_id: orgId, vendor_id: g.vendor_id, vendor_name: g.vendor_name,
          items: g.items.map(({ product_id, name, sku, price, qty, image_url }) => ({ product_id, name, sku, price, qty, image_url })),
          subtotal: sub, tax: gTax, total: sub + gTax, status: "pending", payment_status: "pending",
        });
        created.push(order);
        base44.functions.invoke("order_notification", { type: "order_placed", order_id: order.id }).catch(() => {});
        // Reserve stock for each ordered product (best-effort)
        g.items.forEach((i) => {
          base44.entities.Product.updateMany({ id: i.product_id }, { $inc: { stock: -i.qty } }).catch(() => {});
        });
      }

      // 2. Create Razorpay order for the full amount
      const rzpRes = await base44.functions.invoke("razorpay_create_order", { amount: grand, order_id: created[0]?.order_number });
      const rzp = rzpRes.data;

      // 3. Load Razorpay checkout script and open modal
      const loadScript = () => new Promise((resolve) => {
        if (window.Razorpay) return resolve(true);
        const s = document.createElement("script");
        s.src = "https://checkout.razorpay.com/v1/checkout.js";
        s.onload = () => resolve(true);
        s.onerror = () => resolve(false);
        document.body.appendChild(s);
      });
      const loaded = await loadScript();
      if (!loaded) { toast({ title: "Failed to load Razorpay. Try Card on Delivery.", variant: "destructive" }); setPaying(false); return; }

      const rzpOpts = {
        key: rzp.key_id,
        amount: rzp.amount,
        currency: "INR",
        name: "FireLink",
        description: `Payment for ${created.length} order(s)`,
        order_id: rzp.razorpay_order_id,
        handler: async () => {
          // Mark all orders as paid
          for (const o of created) {
            await base44.entities.Order.update(o.id, { payment_status: "paid", payment_method: "Razorpay" }).catch(() => {});
          }
          clear();
          toast({ title: "Payment successful!", description: `${created.length} order(s) placed and marked paid.` });
          setOrderSuccess({ orders: created, method: "Razorpay", total: grand });
        },
        modal: { ondismiss: () => { toast({ title: "Payment cancelled", description: "Orders were placed as unpaid (COD)." }); navigate("/customer/orders"); } },
        prefill: { name: user.full_name, email: user.email },
      };
      const rzpObj = new window.Razorpay(rzpOpts);
      rzpObj.open();
    } catch (e) {
      toast({ title: "Payment failed", description: e.response?.data?.error || e.message, variant: "destructive" });
    } finally { setPaying(false); }
  };

  const tax = Math.round(total * 0.18);
  const grand = total + tax;
  const savings = items.reduce((s, i) => s + (i.mrp && i.mrp > i.price ? (i.mrp - i.price) * i.qty : 0), 0);

  const placeOrder = async () => {
    if (items.length === 0) return;
    if (!user?.id) {
      toast({ title: "Please sign in to place your order.", variant: "destructive" });
      return;
    }
    setPlacing(true);
    try {
      // One order per vendor — each vendor only ever sees and manages their own fulfillment
      const groups = {};
      items.forEach((i) => {
        const key = i.vendor_id || "unassigned";
        if (!groups[key]) groups[key] = { vendor_id: i.vendor_id || null, vendor_name: i.vendor_name || "", items: [] };
        groups[key].items.push(i);
      });
      const orgId = user?.data?.organization_id || user?.organization_id || null;
      const stamp = Date.now().toString().slice(-8);
      const created = [];
      let n = 0;
      for (const g of Object.values(groups)) {
        n += 1;
        const sub = g.items.reduce((s, i) => s + i.price * i.qty, 0);
        const gTax = Math.round(sub * 0.18);
        const order = await base44.entities.Order.create({
          order_number: `ORD-${stamp}-${n}`,
          customer_id: user.id,
          customer_name: user.full_name || user.email,
          organization_id: orgId,
          vendor_id: g.vendor_id,
          vendor_name: g.vendor_name,
          items: g.items.map(({ product_id, name, sku, price, qty, image_url }) => ({ product_id, name, sku, price, qty, image_url })),
          subtotal: sub,
          tax: gTax,
          total: sub + gTax,
          status: "pending",
          payment_status: "pending",
        });
        created.push(order);
        // Notify the vendor about the new order (best-effort)
        base44.functions.invoke("order_notification", { type: "order_placed", order_id: order.id }).catch(() => {});
        // Reserve stock for each ordered product (best-effort)
        g.items.forEach((i) => {
          base44.entities.Product.updateMany({ id: i.product_id }, { $inc: { stock: -i.qty } }).catch(() => {});
        });
      }
      clear();
      setOrderSuccess({ orders: created, method: "COD", total: grand });
    } catch (e) {
      toast({ title: "Failed to place order", description: e.message, variant: "destructive" });
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div>
      <PageHeader title="Cart" subtitle={`${items.length} item(s) in your cart.`} />
      {items.length === 0 ? (
        <SectionCard><EmptyState icon={ShoppingCart} title="Your cart is empty" description="Browse the marketplace to add products." action={<Link to="/marketplace" className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white">Go to Marketplace</Link>} /></SectionCard>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-2">
            {items.map((i) => (
              <div key={i.product_id} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-50">
                  {i.image_url ? <Image src={i.image_url} fittingType="fill" className="h-full w-full" /> : <div className="flex h-full w-full items-center justify-center text-slate-300"><ShoppingCart className="h-6 w-6" /></div>}
                </div>
                <div className="flex flex-1 flex-col">
                  <p className="text-sm font-semibold text-slate-800">{i.name}</p>
                  <p className="text-xs text-slate-500">{i.sku} · {i.vendor_name || "Vendor"}</p>
                  <div className="mt-auto flex items-center justify-between pt-2">
                    <div className="flex items-center rounded-lg border border-slate-200">
                      <button onClick={() => setQty(i.product_id, i.qty - 1)} className="px-2.5 py-1.5 text-slate-500 hover:bg-slate-50"><Minus className="h-3.5 w-3.5" /></button>
                      <span className="w-8 text-center text-sm font-medium">{i.qty}</span>
                      <button onClick={() => setQty(i.product_id, i.qty + 1)} className="px-2.5 py-1.5 text-slate-500 hover:bg-slate-50"><Plus className="h-3.5 w-3.5" /></button>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-slate-900">{formatINR(i.price * i.qty)}</span>
                      <button onClick={() => remove(i.product_id)} className="text-slate-400 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div>
            <SectionCard title="Order Summary">
              <div className="space-y-3 p-5">
                <Row label="Subtotal" value={formatINR(total)} />
                {savings > 0 && (
                  <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2">
                    <span className="text-sm font-medium text-emerald-700">Total savings on MRP</span>
                    <span className="text-sm font-bold text-emerald-700">− {formatINR(savings)}</span>
                  </div>
                )}
                <Row label="GST (18%)" value={formatINR(tax)} />
                <Row label="Shipping" value="Free" />
                <div className="border-t border-slate-100 pt-3">
                  <Row label="Total" value={formatINR(grand)} bold />
                </div>
                <button onClick={payWithRazorpay} disabled={paying || placing} className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
                  {paying ? "Processing…" : <>Pay with Razorpay <Check className="h-4 w-4" /></>}
                </button>
                <button onClick={placeOrder} disabled={placing || paying} className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60">
                  {placing ? "Placing…" : <>Place Order (COD) <ArrowRight className="h-4 w-4" /></>}
                </button>
                <div className="flex items-center justify-center gap-4 pt-2 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Secure</span>
                  <span className="flex items-center gap-1"><Truck className="h-3 w-3" /> Fast Delivery</span>
                </div>
              </div>
            </SectionCard>
          </div>
        </div>
      )}

      {/* Order Success Popup */}
      <Dialog open={!!orderSuccess} onOpenChange={(o) => !o && setOrderSuccess(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="sr-only">Order Confirmation</DialogTitle>
          </DialogHeader>
          {orderSuccess && (
            <div className="flex flex-col items-center py-4 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="h-9 w-9 text-emerald-600" />
              </div>
              <h2 className="font-display text-xl font-bold text-slate-900">Order Placed Successfully!</h2>
              <p className="mt-2 text-sm text-slate-500">
                {orderSuccess.orders.length > 1
                  ? `${orderSuccess.orders.length} orders created — one per vendor.`
                  : `Order ${orderSuccess.orders[0].order_number} confirmed.`}
              </p>
              <div className="mt-4 w-full rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Payment Method</span>
                  <span className="font-medium text-slate-800">{orderSuccess.method === "Razorpay" ? "Razorpay (Paid)" : "Cash on Delivery"}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-slate-500">Total Amount</span>
                  <span className="font-bold text-slate-900">{formatINR(orderSuccess.total)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-slate-500">Orders</span>
                  <span className="font-medium text-slate-800">{orderSuccess.orders.length} order(s)</span>
                </div>
              </div>
              <div className="mt-5 flex w-full gap-2">
                <button onClick={() => { setOrderSuccess(null); navigate("/marketplace"); }} className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
                  Continue Shopping
                </button>
                <button onClick={() => { setOrderSuccess(null); navigate("/customer/orders"); }} className="flex-1 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700">
                  View My Orders
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

const Row = ({ label, value, bold }) => (
  <div className="flex items-center justify-between">
    <span className={bold ? "text-sm font-semibold text-slate-900" : "text-sm text-slate-500"}>{label}</span>
    <span className={bold ? "text-base font-bold text-slate-900" : "text-sm font-medium text-slate-700"}>{value}</span>
  </div>
);