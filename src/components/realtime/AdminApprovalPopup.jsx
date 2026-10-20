import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Store, Wrench, X, ArrowRight, Clock } from "lucide-react";

function playAlertSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = 660;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
    setTimeout(() => ctx.close(), 400);
  } catch (e) { /* audio not available */ }
}

const TYPE_CONFIG = {
  product: {
    icon: Package,
    title: "New Product Submitted for Approval",
    accent: "from-violet-500 to-purple-600",
    link: "/admin/product-approvals",
    actionLabel: "Review Product",
    entity: "Product",
    statusField: "approval_status",
    statusValue: "pending",
    validate: (d) => d.approval_status === "pending",
  },
  service: {
    icon: Wrench,
    title: "New Service Submitted for Approval",
    accent: "from-blue-500 to-indigo-600",
    link: "/admin/marketplace",
    actionLabel: "Review Service",
    entity: "Service",
    statusField: "approval_status",
    statusValue: "pending",
    validate: (d) => d.approval_status === "pending",
  },
  vendor: {
    icon: Store,
    title: "New Vendor Application",
    accent: "from-emerald-500 to-teal-600",
    link: "/admin/vendors",
    actionLabel: "Review Vendor",
    entity: "Vendor",
    statusField: "approval_status",
    statusValue: "submitted",
    validate: (d) => ["submitted", "under_review"].includes(d.approval_status),
  },
};

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default function AdminApprovalPopup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [dismissed, setDismissed] = useState(new Set());
  const isAdmin = user?.role === "admin" || user?.data?.role === "admin";

  useEffect(() => {
    if (!isAdmin) return;
    let unsubs = [];
    let mounted = true;

    Object.entries(TYPE_CONFIG).forEach(([typeKey, config]) => {
      const unsub = base44.entities[config.entity].subscribe((event) => {
        if (!mounted || event.type !== "create") return;
        if (!config.validate(event.data)) return;
        const alertId = `${typeKey}-${event.data.id}`;
        if (dismissed.has(alertId)) return;
        playAlertSound();
        setAlerts((a) => [...a, {
          id: alertId,
          type: typeKey,
          data: event.data,
          timestamp: event.data.created_date || new Date().toISOString(),
        }]);
      });
      unsubs.push(unsub);
    });

    return () => {
      mounted = false;
      unsubs.forEach((u) => u && u());
    };
  }, [isAdmin, dismissed]);

  const current = alerts[0] || null;

  const handleDismiss = (id) => {
    setDismissed((s) => new Set(s).add(id));
    setAlerts((a) => a.filter((al) => al.id !== id));
  };

  const handleAction = (alert) => {
    navigate(TYPE_CONFIG[alert.type].link);
    handleDismiss(alert.id);
  };

  if (!current) return null;
  const config = TYPE_CONFIG[current.type];
  const Icon = config.icon;
  const d = current.data;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 400 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 400 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        className="fixed bottom-4 right-4 z-[60] w-[350px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border-2 border-orange-300 bg-white shadow-2xl"
      >
        <div className={`relative flex items-center gap-2 bg-gradient-to-r ${config.accent} px-4 py-2.5`}>
          <motion.span
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="flex h-2.5 w-2.5 rounded-full bg-white"
          />
          <span className="text-sm font-bold uppercase tracking-wide text-white">Pending Approval</span>
          <button onClick={() => handleDismiss(current.id)} className="ml-auto text-white/80 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4">
          <div className="mb-3 flex items-start gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${config.accent} text-white`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-900">{config.title}</p>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                <Clock className="h-3 w-3" />
                {timeAgo(current.timestamp)}
              </p>
            </div>
          </div>

          {/* Entity details */}
          <div className="mb-3 rounded-lg bg-slate-50 p-3">
            {current.type === "vendor" ? (
              <>
                <p className="truncate text-sm font-semibold text-slate-800">{d.company_name || "Unknown"}</p>
                <p className="text-xs text-slate-500">{d.business_type?.replace(/_/g, " ") || "Vendor"} · {d.city || d.state || "Location N/A"}</p>
                {d.contact_person && <p className="mt-1 text-xs text-slate-500">Contact: {d.contact_person} · {d.phone || d.email}</p>}
              </>
            ) : (
              <>
                <p className="truncate text-sm font-semibold text-slate-800">{d.name || "Untitled"}</p>
                <p className="text-xs text-slate-500">{d.category || "Uncategorized"} · {d.vendor_name || d.brand || "Unknown vendor"}</p>
                {d.price != null && <p className="mt-1 text-xs font-medium text-slate-600">Price: ₹{Number(d.price).toLocaleString("en-IN")}</p>}
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => handleAction(current)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r ${config.accent} py-2.5 text-sm font-bold text-white transition hover:opacity-90`}
            >
              {config.actionLabel}
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDismiss(current.id)}
              className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-50"
            >
              Later
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}