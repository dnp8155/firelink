import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BadgeCheck, Building2, ShieldCheck, Store, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import Seo from "@/components/Seo";
import JsonLd from "@/components/JsonLd";
import { keywordList } from "@/lib/seoPages";
import { webPageSchema, graph } from "@/lib/schema";

const AUDIENCE = [
  {
    icon: Building2,
    title: "Organisations",
    text: "Factories, warehouses, hospitals, schools, hotels, offices and housing societies that must keep their premises fire-safe and inspection-ready.",
  },
  {
    icon: Store,
    title: "Vendors & manufacturers",
    text: "Certified suppliers, distributors and service providers who list their catalogue, quote for enquiries, fulfil orders and manage settlements.",
  },
  {
    icon: Wrench,
    title: "Engineers & technicians",
    text: "Fire safety engineers, consultants and field technicians who plan systems, run inspections and close out maintenance jobs on site.",
  },
];

const CAPABILITIES = [
  "Buy certified fire extinguishers, alarm panels, hydrants, sprinklers, pumps, suppression systems and PPE from verified vendors",
  "Request quotes, compare vendors and place bulk orders with GST invoicing",
  "Book inspections, refilling, installation, testing, fire audits and annual maintenance contracts",
  "Track every asset, certificate and fire NOC with QR codes, expiry alerts and a compliance calendar",
  "Raise corrective and preventive actions (CAPA) and follow them through to closure",
  "Use engineering tools — fire load, hydraulic and BOQ calculators — plus an AI assistant for fire safety questions",
];

export default function About() {
  return (
    <div className="bg-background">
      <Seo
        title="About FireLink — India's Connected Fire &amp; Safety Platform"
        description="FireLink is India's connected fire and safety platform for certified equipment, professional services and compliance — built by BrightLoop Technology for organisations, vendors and engineers."
        keywords={keywordList("fire safety platform India", "about FireLink", "fire safety company India", "fire and safety marketplace India")}
        path="/about"
      />
      <JsonLd
        data={graph(
          webPageSchema({
            type: "AboutPage",
            name: "About FireLink — India's Connected Fire & Safety Platform",
            description:
              "FireLink is India's connected fire and safety platform for certified equipment, professional services and compliance, built by BrightLoop Technology.",
            path: "/about",
          })
        )}
      />

      <section className="mx-auto max-w-4xl px-4 pb-2 pt-12 sm:px-6">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-primary">
          <ShieldCheck className="h-3.5 w-3.5" /> About us
        </span>
        <h1 className="font-display mt-4 text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-4xl">
          About FireLink
        </h1>
        <div className="mt-6 space-y-4 text-sm leading-relaxed text-slate-600 sm:text-base">
          <p>
            FireLink is a connected fire and safety platform for India. It brings everything a building
            needs to stay fire-safe into one place: certified fire extinguishers, alarm panels, hydrants,
            sprinklers, pumps, suppression systems and personal protective equipment from verified
            manufacturers and distributors, together with the professional services that keep them working
            — inspections, refilling, installation, testing, maintenance and annual maintenance contracts.
            Instead of chasing separate dealers, spreadsheets and renewal dates, teams source products,
            request quotations, compare vendors and track every asset, certificate and fire NOC from a
            single dashboard.
          </p>
          <p>
            FireLink is built for the people accountable for fire safety. Facility and plant managers,
            safety officers, EHS and compliance teams, engineers, contractors and system integrators use
            it to keep sites audit-ready and to show evidence when an inspector arrives. It serves
            organisations of every size — manufacturing plants, warehouses, hospitals, schools, hotels,
            offices, data centres and residential societies — while vendors, distributors, technicians and
            service partners use it to reach customers, quote, deliver, manage their teams and settle
            payments.
          </p>
          <p>
            The platform is designed and developed by <span className="font-semibold text-slate-900">BrightLoop Technology</span>,
            a product engineering team that builds connected software for industrial and safety businesses.
            We work closely with certified manufacturers and fire safety professionals so that the
            catalogues, compliance rules and service workflows on FireLink reflect what auditors and fire
            authorities actually expect — and we keep improving the platform as standards evolve.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h2 className="font-display text-xl font-bold text-slate-900">Who FireLink is for</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {AUDIENCE.map((a) => (
            <div key={a.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <a.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-slate-900">{a.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{a.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-6">
        <h2 className="font-display text-xl font-bold text-slate-900">What you can do on FireLink</h2>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {CAPABILITIES.map((c) => (
            <li key={c} className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-white p-4 text-sm leading-relaxed text-slate-600">
              <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 px-4 py-12 text-center sm:px-6">
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-slate-900">Want to talk to the team?</h2>
          <p className="max-w-xl text-sm leading-relaxed text-slate-600">
            Questions about products, services, compliance or partnering with FireLink — we answer every
            enquiry within one working day.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild className="font-semibold">
              <Link to="/contact">Contact us <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button asChild variant="outline" className="font-semibold">
              <Link to="/products">Browse the marketplace</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}