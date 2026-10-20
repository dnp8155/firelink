import React from "react";
import { cn } from "@/lib/utils";
import { Activity } from "lucide-react";

const TONES = {
  primary: "bg-primary/10 text-primary",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  sky: "bg-sky-50 text-sky-600",
  violet: "bg-violet-50 text-violet-600",
  slate: "bg-slate-100 text-slate-500",
};

export default function ActivityFeed({ items = [], className }) {
  return (
    <ol className={cn("relative", className)}>
      {items.map((item, i) => (
        <li key={item.id || i} className="relative flex gap-3 px-5 py-3">
          {i < items.length - 1 && <span aria-hidden className="absolute left-[34px] top-12 h-[calc(100%-24px)] w-px bg-border" />}
          <span className={cn("relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-4 ring-card", TONES[item.tone] || TONES.slate)}>
            {item.icon ? <item.icon className="h-3.5 w-3.5" /> : <Activity className="h-3.5 w-3.5" />}
          </span>
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="truncate text-sm font-medium capitalize text-foreground">{item.title}</p>
            {item.meta && <p className="truncate text-xs text-muted-foreground">{item.meta}</p>}
          </div>
          {item.time && <span className="shrink-0 pt-0.5 text-[11px] tabular-nums text-muted-foreground/70">{item.time}</span>}
        </li>
      ))}
    </ol>
  );
}