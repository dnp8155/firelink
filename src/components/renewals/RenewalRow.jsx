import React from "react";
import { Link } from "react-router-dom";
import { Award, Flame, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import { daysLeft } from "@/lib/renewals";

export default function RenewalRow({ item, raised, onRequest }) {
  const days = daysLeft(item.expiry_date);
  const due = days === null
    ? "No expiry date"
    : days < 0
      ? `${Math.abs(days)} days overdue`
      : `${days} days left`;
  const dueTone = days === null || days > 90 ? "text-slate-500" : days < 0 ? "text-rose-600" : days <= 30 ? "text-amber-600" : "text-blue-600";

  return (
    <div className="flex flex-wrap items-center gap-3 px-5 py-3.5">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${item.kind === "Certificate" ? "bg-violet-50 text-violet-600" : "bg-amber-50 text-amber-600"}`}>
        {item.kind === "Certificate" ? <Award className="h-4 w-4" /> : <Flame className="h-4 w-4" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-800">{item.label}</p>
        <p className="text-xs text-slate-500">
          {item.kind} · {item.reference} · expires {item.expiry_date || "—"}
          {item.detail ? ` · ${item.detail}` : ""}
        </p>
      </div>
      <span className={`text-xs font-semibold ${dueTone}`}>{due}</span>
      <StatusBadge status={item.status} tone={statusTone(item.status)} />
      {raised ? (
        <Link to="/rfqs" className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100">
          Renewal requested <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      ) : (
        <Button size="sm" onClick={() => onRequest(item)}>Request renewal</Button>
      )}
    </div>
  );
}