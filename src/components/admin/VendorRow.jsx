import React from "react";
import { Image } from "@/components/ui/image";
import { Button } from "@/components/ui/button";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import { timeAgo } from "@/lib/format";
import { MapPin, Mail, ChevronRight } from "lucide-react";

export default function VendorRow({ vendor: v, onReview }) {
  const initials = String(v.company_name || v.trade_name || "V").slice(0, 2).toUpperCase();
  const completion = Math.min(Number(v.profile_completion || 0), 100);

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {v.logo_url ? (
          <Image src={v.logo_url} alt={v.company_name || "Vendor"} className="h-11 w-11 shrink-0 rounded-xl" />
        ) : (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-semibold text-slate-500">{initials}</div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{v.company_name || "Untitled vendor"}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            <span className="capitalize">{String(v.business_type || "vendor").replace(/_/g, " ")}</span>
            {v.city && (
              <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{v.city}{v.state ? `, ${v.state}` : ""}</span>
            )}
            {v.email && <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" />{v.email}</span>}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 sm:justify-end">
        <div className="hidden w-28 lg:block">
          <div className="flex items-center justify-between text-[11px] text-slate-500"><span>Profile</span><span>{completion}%</span></div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${completion}%` }} />
          </div>
        </div>
        <span className="hidden text-xs text-slate-400 md:inline">{timeAgo(v.created_date)}</span>
        <StatusBadge status={v.approval_status} tone={statusTone(v.approval_status)} />
        <Button size="sm" variant="outline" onClick={onReview}>Review <ChevronRight className="h-3.5 w-3.5" /></Button>
      </div>
    </div>
  );
}