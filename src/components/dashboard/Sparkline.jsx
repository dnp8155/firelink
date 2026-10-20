import React from "react";
import { cn } from "@/lib/utils";

const TONES = {
  primary: "bg-primary/70",
  emerald: "bg-emerald-500/70",
  amber: "bg-amber-500/70",
  sky: "bg-sky-500/70",
  violet: "bg-violet-500/70",
  teal: "bg-teal-500/70",
  rose: "bg-rose-500/70",
  slate: "bg-slate-400/70",
};

export default function Sparkline({ data = [], tone = "primary", className }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  return (
    <div className={cn("mt-3 flex h-7 items-end gap-1", className)} aria-hidden>
      {data.map((v, i) => (
        <span
          key={i}
          className={cn("flex-1 rounded-sm", TONES[tone] || TONES.primary)}
          style={{ height: `${Math.max(12, Math.round((v / max) * 100))}%` }}
        />
      ))}
    </div>
  );
}