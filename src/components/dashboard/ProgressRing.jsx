import React from "react";
import { cn } from "@/lib/utils";

const STROKES = {
  primary: "stroke-primary",
  emerald: "stroke-emerald-500",
  amber: "stroke-amber-500",
  sky: "stroke-sky-500",
  violet: "stroke-violet-500",
  rose: "stroke-rose-500",
  slate: "stroke-slate-400",
};

export default function ProgressRing({ value = 0, size = 120, stroke = 10, tone = "primary", label, sub, className }) {
  const pct = Math.max(0, Math.min(100, Math.round(value || 0)));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-muted" />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c - (pct / 100) * c}
            className={cn("transition-[stroke-dashoffset] duration-700", STROKES[tone] || STROKES.primary)}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-heading text-2xl font-bold tabular-nums text-foreground">{pct}%</span>
          {label && <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span>}
        </div>
      </div>
      {sub && <p className="mt-3 text-center text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}