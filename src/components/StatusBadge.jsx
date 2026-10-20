import React from "react";
import { cn } from "@/lib/utils";

const TONES = {
  rose: "bg-rose-50 text-rose-700 ring-rose-200",
  red: "bg-red-50 text-red-700 ring-red-200",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  amber: "bg-amber-50 text-amber-700 ring-amber-200",
  blue: "bg-blue-50 text-blue-700 ring-blue-200",
  violet: "bg-violet-50 text-violet-700 ring-violet-200",
  gray: "bg-slate-100 text-slate-600 ring-slate-200",
  teal: "bg-teal-50 text-teal-700 ring-teal-200",
};

export function StatusBadge({ status, tone = "gray", className }) {
  const label = (status || "").replace(/_/g, " ");
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium capitalize ring-1 ring-inset", TONES[tone] || TONES.gray, className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  );
}

export function statusTone(status) {
  const s = (status || "").toLowerCase();
  if (["approved", "delivered", "completed", "valid", "closed", "paid", "active", "good", "resolved", "refunded"].includes(s)) return "green";
  if (["pending", "open", "submitted", "assigned", "in_progress", "renewal_in_progress", "expiring_soon", "needs_attention", "under_review", "documents_required", "replacement_required", "packed"].includes(s)) return "amber";
  if (["rejected", "cancelled", "expired", "faulty", "failed", "suspended", "disabled", "overdue", "critical", "disputed", "returned"].includes(s)) return "red";
  if (["dispatched", "accepted", "awarded", "quoted", "packed"].includes(s)) return "blue";
  if (["awaiting_verification", "waiting_for_customer"].includes(s)) return "violet";
  return "gray";
}