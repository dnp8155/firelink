import React from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";

const TONES = {
  primary: "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground",
  emerald: "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white",
  amber: "bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white",
  sky: "bg-sky-50 text-sky-600 group-hover:bg-sky-600 group-hover:text-white",
  violet: "bg-violet-50 text-violet-600 group-hover:bg-violet-600 group-hover:text-white",
  teal: "bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white",
  rose: "bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white",
  slate: "bg-slate-100 text-slate-600 group-hover:bg-slate-700 group-hover:text-white",
};

const COLS = {
  3: "sm:grid-cols-3 lg:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
  6: "sm:grid-cols-3 lg:grid-cols-6",
};

export default function QuickActions({ items = [], className, cols = 6 }) {
  if (items.length === 0) return null;
  return (
    <div className={cn("grid grid-cols-2 gap-3", COLS[cols] || COLS[6], className)}>
      {items.map((a) => (
        <Link
          key={a.label}
          to={a.path}
          className="group flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
        >
          <span className="flex w-full items-start justify-between">
            <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl transition", TONES[a.tone] || TONES.primary)}>
              <a.icon className="h-4 w-4" />
            </span>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground/50 transition group-hover:text-primary" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-foreground">{a.label}</span>
            {a.hint && <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{a.hint}</span>}
          </span>
        </Link>
      ))}
    </div>
  );
}