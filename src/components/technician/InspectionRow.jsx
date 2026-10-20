import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import { ClipboardCheck, MapPin, CalendarDays, CheckCircle2 } from "lucide-react";

export default function InspectionRow({ asset, onMark, busy }) {
  return (
    <div className="flex flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-center">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        <MapPin className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-mono text-xs text-slate-400">{asset.asset_code}</p>
          <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
            <ClipboardCheck className="h-3 w-3" /> Due
          </span>
        </div>
        <p className="text-sm font-semibold text-slate-800">{asset.name}</p>
        <p className="flex flex-wrap items-center gap-1 text-xs text-slate-500">
          <CalendarDays className="h-3 w-3" /> Last: {asset.last_inspection_date || "—"} · Next: {asset.next_inspection_date || "—"}
          {asset.site_name ? ` · ${asset.site_name}` : ""}
        </p>
      </div>

      <StatusBadge status={asset.condition} tone={statusTone(asset.condition)} />

      <div className="flex shrink-0 items-center gap-2">
        <Button size="sm" variant="outline" disabled={busy} onClick={() => onMark(asset)}>
          <CheckCircle2 className="h-3.5 w-3.5" /> {busy ? "Saving…" : "Quick mark"}
        </Button>
        <Button size="sm" asChild>
          <Link to={`/technician/inspection/${asset.id}`}>
            <ClipboardCheck className="h-3.5 w-3.5" /> Checklist
          </Link>
        </Button>
      </div>
    </div>
  );
}