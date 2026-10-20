import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const RESOURCES = [
  { label: "Fire Safety Guides", desc: "Fundamentals of fire protection for every facility." },
  { label: "Compliance Guides", desc: "NOC, NBC and audit requirements explained." },
  { label: "Product Guides", desc: "Choose the right equipment for your risk profile." },
  { label: "Maintenance Guides", desc: "Service schedules, refills and hydro testing." },
  { label: "Engineering Resources", desc: "Hydraulic calculations and fire load design." },
  { label: "Safety Checklists", desc: "Ready-to-use inspection checklists for your site." },
];

export default function Resources() {
  return (
    <section id="resources" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span className="text-sm font-semibold text-slate-700">Knowledge</span>
          </div>
          <h2 className="font-display mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Fire &amp; safety knowledge hub
          </h2>
          <p className="mt-3 text-lg text-slate-600">
            Free guides and resources — open to everyone, no account needed.
          </p>
          <Button asChild variant="outline" className="mt-6 hidden font-semibold lg:inline-flex">
            <Link to="/products">Browse marketplace <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>

        <div className="divide-y divide-slate-200 border-y border-slate-200">
          {RESOURCES.map((r) => (
            <div key={r.label} className="flex items-start justify-between gap-6 py-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">{r.label}</h3>
                <p className="mt-1 text-sm text-slate-500">{r.desc}</p>
              </div>
              <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-300" />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-16 flex flex-col items-center justify-between gap-6 rounded-2xl border border-slate-200 bg-white px-8 py-10 text-center sm:flex-row sm:text-left">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-slate-900">
            Ready to make fire safety smarter?
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Explore products, discover services and connect your fire safety operations in one platform.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="h-11 px-6 text-sm font-semibold">
            <Link to="/products">Explore Marketplace</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-11 px-6 text-sm font-semibold">
            <Link to="/services">Explore Services</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}