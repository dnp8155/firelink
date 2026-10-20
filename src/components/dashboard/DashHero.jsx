import React from "react";
import { cn } from "@/lib/utils";

const GRADIENTS = {
  primary: "from-slate-950 via-slate-900 to-rose-950",
  emerald: "from-slate-950 via-slate-900 to-emerald-950",
  amber: "from-slate-950 via-slate-900 to-amber-950",
  violet: "from-slate-950 via-slate-900 to-violet-950",
  sky: "from-slate-950 via-slate-900 to-sky-950",
  teal: "from-slate-950 via-slate-900 to-teal-950",
  slate: "from-slate-950 via-slate-900 to-slate-800",
};

const GLOWS = {
  primary: "bg-rose-500/25",
  emerald: "bg-emerald-500/25",
  amber: "bg-amber-500/25",
  violet: "bg-violet-500/25",
  sky: "bg-sky-500/25",
  teal: "bg-teal-500/25",
  slate: "bg-slate-400/20",
};

export const HERO_BTN = "inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-white/90";
export const HERO_BTN_GHOST = "inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-inset ring-white/20 transition hover:bg-white/20";

export default function DashHero({ eyebrow, title, subtitle, meta, stats = [], actions, tone = "primary", className }) {
  return (
    <section className={cn("relative isolate overflow-hidden rounded-3xl bg-gradient-to-br p-6 text-white shadow-xl shadow-slate-900/10 sm:p-8", GRADIENTS[tone] || GRADIENTS.primary, className)}>
      <div aria-hidden className={cn("pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full blur-3xl", GLOWS[tone] || GLOWS.primary)} />
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)", backgroundSize: "24px 24px" }} />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          {eyebrow && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/75 ring-1 ring-inset ring-white/15">
              {eyebrow}
            </span>
          )}
          <h1 className="mt-3 font-heading text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/70">{subtitle}</p>}
          {meta && <p className="mt-2 text-xs text-white/50">{meta}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2 lg:shrink-0">{actions}</div>}
      </div>

      {stats.length > 0 && (
        <dl className="relative mt-7 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-white/10 ring-1 ring-inset ring-white/10 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-slate-950/50 px-4 py-3.5 backdrop-blur-sm">
              <dt className="text-[11px] font-medium uppercase tracking-wide text-white/50">{s.label}</dt>
              <dd className="mt-1 font-heading text-lg font-bold tabular-nums text-white">{s.value}</dd>
              {s.sub && <p className="mt-0.5 truncate text-[11px] text-white/45">{s.sub}</p>}
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}