import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useVendor } from "@/lib/vendor";
import { motion, AnimatePresence } from "framer-motion";
import { Package, MapPin, Clock, X, CheckCircle2, ShoppingBag, IndianRupee, Phone } from "lucide-react";

function playAlertSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const playBeep = (freq, start, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.3, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + start + duration);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration);
    };
    playBeep(880, 0, 0.15);
    playBeep(1100, 0.2, 0.15);
    setTimeout(() => ctx.close(), 600);
  } catch (e) { /* audio not available */ }
}

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default function VendorOrderPopup() {
  const { vendor } = useVendor();
  const navigate = useNavigate();
  const [activeOrder, setActiveOrder] = useState(null);
  const [queue, setQueue] = useState([]);
  const [dismissed, setDismissed] = useState(new Set());
  const timerRef = useRef(null);
  const vendorIdRef = useRef(null);

  useEffect(() => {
    if (vendor?.id) vendorIdRef.current = vendor.id;
  }, [vendor]);

  useEffect(() => {
    let unsub = () => {};
    let mounted = true;

    const setup = () => {
      unsub = base44.entities.Order.subscribe((event) => {
        if (!mounted || event.type !== "create") return;
        const vid = vendorIdRef.current;
        if (!vid || event.data.vendor_id !== vid) return;
        if (dismissed.has(event.data.id)) return;
        playAlertSound();
        setQueue((q) => [...q, event.data]);
      });
    };
    setup();

    return () => { mounted = false; unsub(); };
  }, [dismissed]);

  // Process queue — show first item
  useEffect(() => {
    if (activeOrder || queue.length === 0) return;
    setActiveOrder(queue[0]);
    // Auto-dismiss after 45 seconds
    timerRef.current = setTimeout(() => {
      handleDismiss();
    }, 45000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [queue, activeOrder]);

  const handleDismiss = () => {
    if (!activeOrder) return;
    setDismissed((s) => new Set(s).add(activeOrder.id));
    if (timerRef.current) clearTimeout(timerRef.current);
    setActiveOrder(null);
    setQueue((q) => q.filter((o) => o.id !== activeOrder.id));
  };

  const handleAccept = async () => {
    if (!activeOrder) return;
    try {
      await base44.entities.Order.update(activeOrder.id, { status: "accepted" });
    } catch (e) { /* ignore */ }
    navigate("/vendor/orders");
    handleDismiss();
  };

  const o = activeOrder;
  if (!o) return null;
  const itemCount = (o.items || []).reduce((s, i) => s + (i.qty || 1), 0);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="fixed bottom-4 right-4 z-[60] w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border-2 border-emerald-400 bg-white shadow-2xl"
      >
        {/* Pulsing top bar */}
        <div className="relative flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2.5">
          <motion.span
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="flex h-2.5 w-2.5 rounded-full bg-white"
          />
          <span className="text-sm font-bold uppercase tracking-wide text-white">New Order Received!</span>
          <button onClick={handleDismiss} className="ml-auto text-white/80 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-slate-900">{o.order_number || "Order"}</p>
              <p className="text-xs text-slate-500">{o.created_date ? timeAgo(o.created_date) : ""}</p>
            </div>
            {o.payment_method && (
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase text-emerald-700">
                {o.payment_method === "cod" ? "COD" : (o.payment_method || "").toUpperCase()}
              </span>
            )}
          </div>

          {/* Customer info */}
          <div className="mb-3 rounded-lg bg-slate-50 p-2.5">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <ShoppingBag className="h-3.5 w-3.5 text-slate-400" />
              {o.customer_name || "Customer"}
            </div>
          </div>

          {/* Items */}
          {(o.items || []).length > 0 && (
            <div className="mb-3 max-h-32 space-y-1.5 overflow-y-auto">
              {o.items.slice(0, 4).map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <span className="flex h-5 w-5 items-center justify-center rounded bg-emerald-100 text-[10px] font-bold text-emerald-700">
                    {item.qty || 1}
                  </span>
                  <span className="flex-1 truncate text-slate-700">{item.name}</span>
                  <span className="text-xs font-medium text-slate-500">₹{(item.price || 0) * (item.qty || 1)}</span>
                </div>
              ))}
              {(o.items || []).length > 4 && (
                <p className="text-xs text-slate-400">+{(o.items || []).length - 4} more items</p>
              )}
            </div>
          )}

          {/* Total */}
          <div className="mb-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
            <div className="flex items-center gap-1.5 text-sm text-slate-500">
              <Package className="h-3.5 w-3.5" />
              {itemCount} item{itemCount !== 1 ? "s" : ""}
            </div>
            <div className="flex items-center gap-1 text-lg font-bold text-slate-900">
              <IndianRupee className="h-4 w-4" />
              {(o.total || 0).toLocaleString("en-IN")}
            </div>
          </div>

          {/* Shipping address */}
          {o.shipping_address && (
            <div className="mb-3 flex items-start gap-2 rounded-lg bg-amber-50 p-2.5">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
              <p className="line-clamp-2 text-xs text-slate-600">{o.shipping_address}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleAccept}
              className="flex-1 rounded-lg bg-emerald-600 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700"
            >
              Accept Order
            </button>
            <button
              onClick={() => { navigate("/vendor/orders"); handleDismiss(); }}
              className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              View
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}