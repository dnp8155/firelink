import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const CATEGORIES = [
  { name: "Fire Extinguishers", tags: "ABC · CO₂ · Clean Agent · Water" },
  { name: "Fire Alarm Systems", tags: "Panels · Smoke & Heat Detectors" },
  { name: "Hydrant & Sprinkler", tags: "Hydrants · Hose Reels · Valves" },
  { name: "Fire Pumps", tags: "Electric · Diesel · Jockey" },
  { name: "Safety PPE", tags: "Helmets · Gloves · Shoes · Clothing" },
  { name: "Emergency Equipment", tags: "Exit Signs · Lighting · First Aid" },
  { name: "Gas Detection", tags: "Detectors · Sensors · Controllers" },
  { name: "Fire Suppression", tags: "Clean Agent · Kitchen · Gas" },
];

const SOLUTIONS = [
  "Residential", "Commercial", "Industrial", "Warehouse",
  "Hospital", "School", "Hotel", "Data Center", "Construction",
];

export default function Categories() {
  return (
    <section id="categories" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span className="text-sm font-semibold text-slate-700">Marketplace</span>
          </div>
          <h2 className="font-display mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Explore fire &amp; safety products
          </h2>
        </div>
        <Link to="/products" className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline sm:inline-flex">
          View all <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-4">
        {CATEGORIES.map((c) => (
          <Link
            key={c.name}
            to="/products"
            className="group flex flex-col justify-between bg-white p-6 transition hover:bg-slate-50"
          >
            <div>
              <h3 className="text-base font-bold text-slate-900">{c.name}</h3>
              <p className="mt-1.5 text-sm text-slate-500">{c.tags}</p>
            </div>
            <span className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-primary">
              Shop <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>

      <div id="solutions" className="mt-16 border-t border-slate-200 pt-12">
        <p className="text-sm font-semibold text-slate-700">Solutions for every environment</p>
        <div className="mt-5 flex flex-wrap gap-2.5">
          {SOLUTIONS.map((s) => (
            <Link
              key={s}
              to="/products"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-primary/40 hover:text-primary"
            >
              {s}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}