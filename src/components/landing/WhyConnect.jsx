import React from "react";

const BLOCKS = [
  {
    num: "01",
    title: "Buy",
    desc: "Find fire & safety products from verified vendors — certified, competitively priced and delivered Pan-India.",
  },
  {
    num: "02",
    title: "Manage",
    desc: "Track your fire safety assets digitally — every extinguisher, detector and pump in one connected register.",
  },
  {
    num: "03",
    title: "Maintain",
    desc: "Schedule inspections and maintenance with certified technicians. Never miss a service due date again.",
  },
  {
    num: "04",
    title: "Stay Compliant",
    desc: "Track certificates, inspections and Fire NOC renewals with proactive alerts and a live compliance score.",
  },
];

const TRUST_ITEMS = [
  "Verified Vendors",
  "Certified Products",
  "Secure Payments",
  "Transparent Orders",
  "Professional Services",
  "Compliance Support",
];

export default function WhyConnect() {
  return (
    <section id="why" className="border-y border-slate-200 bg-slate-50/60">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span className="text-sm font-semibold text-slate-700">Why FIRELINK</span>
          </div>
          <h2 className="font-display mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            More than a marketplace
          </h2>
          <p className="mt-3 text-lg text-slate-600">
            One connected platform for buying, managing, maintaining and staying compliant.
          </p>
        </div>

        <div className="mt-12 divide-y divide-slate-200 border-y border-slate-200">
          {BLOCKS.map((b) => (
            <div key={b.title} className="grid gap-4 py-7 sm:grid-cols-[auto_220px_1fr] sm:items-center sm:gap-8">
              <span className="font-mono text-sm font-bold text-primary">{b.num}</span>
              <h3 className="font-display text-lg font-bold text-slate-900">{b.title}</h3>
              <p className="text-sm leading-relaxed text-slate-600">{b.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3">
          {TRUST_ITEMS.map((t) => (
            <span key={t} className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {t}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}