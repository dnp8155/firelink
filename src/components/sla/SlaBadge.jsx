import React from "react";
import { cn } from "@/lib/utils";
import { slaState } from "@/lib/sla";
import { Timer } from "lucide-react";

const TONES = {
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  amber: "bg-amber-50 text-amber-700 ring-amber-200",
  red: "bg-rose-50 text-rose-700 ring-rose-200",
  slate: "bg-slate-100 text-slate-600 ring-slate-200",
};

export default function SlaBadge({ request, className }) {
  if (!request) return null;
  const state = slaState(request);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
        TONES[state.tone] || TONES.slate,
        className,
      )}
    >
      <Timer className="h-3 w-3" />
      {state.label}
    </span>
  );
}