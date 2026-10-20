import React from "react";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/ui-bits";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import { MapPin, CalendarDays, CheckCircle2, Boxes } from "lucide-react";

export default function AssetResultCard({ asset, onLog, onViewInspections, busy }) {
  return (
    <SectionCard title="Asset found" className="mt-5">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-xs text-slate-400">{asset.asset_code}</p>
            <h3 className="mt-0.5 text-lg font-bold text-slate-900">{asset.name}</h3>
            <p className="text-sm text-slate-500">{[asset.brand, asset.category].filter(Boolean).join(" · ") || "—"}</p>
          </div>
          <StatusBadge status={asset.condition} tone={statusTone(asset.condition)} />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="flex items-center gap-1.5 text-slate-500"><MapPin className="h-3.5 w-3.5" /> Location</p>
            <p className="mt-1 font-semibold text-slate-800">{asset.site_name || "—"}</p>
            <p className="text-slate-500">{[asset.building, asset.floor, asset.zone].filter(Boolean).join(" · ") || "—"}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="flex items-center gap-1.5 text-slate-500"><CalendarDays className="h-3.5 w-3.5" /> Inspection</p>
            <p className="mt-1 font-semibold text-slate-800">Last: {asset.last_inspection_date || "—"}</p>
            <p className="text-slate-500">Next due: {asset.next_inspection_date || "—"}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Button onClick={onLog} disabled={busy} className="flex-1">
            <CheckCircle2 className="h-4 w-4" /> {busy ? "Logging…" : "Log inspection (done today)"}
          </Button>
          <Button variant="outline" className="flex-1" onClick={onViewInspections}>
            <Boxes className="h-4 w-4" /> All inspections
          </Button>
        </div>
      </div>
    </SectionCard>
  );
}