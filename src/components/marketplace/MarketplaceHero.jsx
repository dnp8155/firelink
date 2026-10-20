import React from "react";
import { Search, BadgeCheck, ShieldCheck, Truck } from "lucide-react";

export default function MarketplaceHero({ q, setQ }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white">
      <div className="grid items-center gap-8 p-6 sm:p-10 lg:grid-cols-[1fr_auto] lg:p-12">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span className="text-sm font-semibold text-slate-700">India's trusted fire safety marketplace</span>
          </div>
          <h1 className="font-display mt-4 text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-4xl">
            Fire safety equipment, <span className="text-primary">delivered fast.</span>
          </h1>
          <p className="mt-3 max-w-lg text-sm text-slate-600 sm:text-base">
            ISI-certified products from verified vendors — with GST invoice, warranty & PAN-India dispatch.
          </p>

          <div className="relative mt-6 max-w-xl">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search extinguishers, detectors, pumps, brands…"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-primary/50 focus:bg-white"
            />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium text-slate-600">
            <span className="flex items-center gap-1.5"><BadgeCheck className="h-3.5 w-3.5 text-emerald-500" /> Verified vendors only</span>
            <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> ISI / BIS certified</span>
            <span className="flex items-center gap-1.5"><Truck className="h-3.5 w-3.5 text-emerald-500" /> Free delivery above ₹5,000</span>
          </div>
        </div>
      </div>
    </section>
  );
}