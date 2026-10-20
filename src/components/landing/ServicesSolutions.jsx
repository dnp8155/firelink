import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const SERVICES = [
  {
    name: "Fire Safety Inspection",
    desc: "Professional inspection and reporting.",
    detail: "Site walk-through, checklist-based assessment, digital report.",
  },
  {
    name: "Fire NOC Assistance",
    desc: "Support for documentation and compliance.",
    detail: "Documentation, coordination and submission support.",
  },
  {
    name: "AMC & Maintenance",
    desc: "Preventive maintenance for fire protection systems.",
    detail: "Scheduled visits, parts and priority response.",
  },
  {
    name: "Fire Extinguisher Service",
    desc: "Inspection, refilling and hydro testing.",
    detail: "Refills, hydro testing and certification.",
  },
  {
    name: "Fire Alarm Service",
    desc: "Testing, maintenance and troubleshooting.",
    detail: "Panel testing, sensor calibration and repair.",
  },
  {
    name: "Hydrant & Sprinkler Service",
    desc: "Inspection and maintenance of fire water systems.",
    detail: "Flow testing, valve checks and flushing.",
  },
  {
    name: "Fire Safety Audit",
    desc: "Professional fire safety assessment.",
    detail: "Risk assessment, gap analysis and recommendations.",
  },
  {
    name: "Installation & Commissioning",
    desc: "Professional installation of fire protection systems.",
    detail: "Supply, install, test and handover.",
  },
];

export default function ServicesSolutions() {
  return (
    <section id="services" className="border-y border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-xl">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="text-sm font-semibold text-slate-700">Services</span>
            </div>
            <h2 className="font-display mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Professional fire &amp; safety services
            </h2>
            <p className="mt-3 text-lg text-slate-600">
              Certified engineers and technicians, delivered at your site.
            </p>
          </div>
          <Button asChild variant="outline" className="font-semibold">
            <Link to="/services">Explore all services <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>

        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map((s) => (
            <Link
              key={s.name}
              to="/services"
              className="group flex flex-col justify-between bg-white p-6 transition hover:bg-slate-50"
            >
              <div>
                <h3 className="text-base font-bold text-slate-900">{s.name}</h3>
                <p className="mt-1.5 text-sm text-slate-500">{s.desc}</p>
                <p className="mt-4 text-xs leading-relaxed text-slate-400">{s.detail}</p>
              </div>
              <span className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                Learn more <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}