import React from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";
import Sparkline from "@/components/dashboard/Sparkline";

const TONES = {
  primary: "bg-primary/10 text-primary",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  sky: "bg-sky-50 text-sky-600",
  violet: "bg-violet-50 text-violet-600",
  teal: "bg-teal-50 text-teal-600",
  rose: "bg-rose-50 text-rose-600",
  slate: "bg-slate-100 text-slate-600",
};

export default function StatTile({ label, value, sub, icon: Icon, tone = "primary", delta, href, spark, className }) {
  const Wrapper = href ? Link : "div";
  const props = href ? { to: href } : {};
  return (
    <Wrapper
      {...props}
      className={cn(
        "group flex flex-col rounded-2xl border border-border bg-card p-4 shadow-sm transition",
        href && "hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {Icon && (
          <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", TONES[tone] || TONES.primary)}>
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>

      <div className="mt-3 flex items-end justify-between gap-2">
        <div className="min-w-0">
          <p className="font-heading text-[22px] font-bold leading-tight tracking-tight tabular-nums text-foreground">{value}</p>
          {sub && <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{sub}</p>}
        </div>
        {delta != null && (
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold",
              delta >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
            )}
          >
            {delta >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(delta)}%
          </span>
        )}
      </div>

      {spark && spark.length > 1 && <Sparkline data={spark} tone={tone} />}
    </Wrapper>
  );
}