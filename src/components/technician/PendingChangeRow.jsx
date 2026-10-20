import React from "react";
import { Clock } from "lucide-react";

export default function PendingChangeRow({ item }) {
  const time = item.created_at
    ? new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";
  const kind = item.kind === "job_status" ? "Job status update" : "Asset inspection";

  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2">
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-slate-700">{item.label}</p>
        <p className="text-[11px] text-slate-500">{kind} · captured {time}</p>
      </div>
      <span className="flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
        <Clock className="h-3 w-3" /> Queued
      </span>
    </div>
  );
}