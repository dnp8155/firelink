import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useList } from "@/hooks/useList";
import { useAuthGate } from "@/hooks/useAuthGate";
import { useConsumePendingAction } from "@/hooks/useConsumePendingAction";
import AuthRequiredModal from "@/components/AuthRequiredModal";
import { getIcon } from "@/lib/icons";
import { SERVICES } from "@/lib/servicesData";
import { Button } from "@/components/ui/button";
import { Image } from "@/components/ui/image";
import {
  ArrowRight, ArrowLeft, Search, Star, ShieldCheck, MapPin, Clock,
  ChevronRight, Store, BadgeCheck, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Seo from "@/components/Seo";
import JsonLd from "@/components/JsonLd";
import FaqSection from "@/components/FaqSection";
import { keywordList } from "@/lib/seoPages";
import { itemListSchema, graph } from "@/lib/schema";
import { SERVICE_FAQS } from "@/lib/faqs";

const HERO_IMG = "https://media.base44.com/images/public/6aa4425cbf7ee7adfbdf102e/c231f8c0d_generated_image.png";

const FEATURED = [
  {
    slug: "fire-safety-audit",
    image: "https://media.base44.com/images/public/6aa4425cbf7ee7adfbdf102e/85559a556_generated_image.png",
    price: "₹15,000", mrp: "₹18,500", save: "19% off",
  },
  {
    slug: "amc-preventive-maintenance",
    image: "https://media.base44.com/images/public/6aa4425cbf7ee7adfbdf102e/e82a6aa4e_generated_image.png",
    price: "₹25,000", mrp: "₹30,000", save: "17% off", per: "/year",
  },
  {
    slug: "fire-noc-assistance",
    image: "https://media.base44.com/images/public/6aa4425cbf7ee7adfbdf102e/16de51507_generated_image.png",
    price: "₹10,000", mrp: "₹12,500", save: "20% off",
  },
];

function Hero() {
  return (
    <section className="border-b border-slate-200 bg-white">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-10 pt-8 sm:px-6 lg:grid-cols-2 lg:pb-14">
        <div>
          <Link to="/" className="mb-5 inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 transition hover:text-slate-900">
            <ArrowLeft className="h-3.5 w-3.5" /> Home
          </Link>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Fire & Safety Services</p>
          <h1 className="font-display mt-2 text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-4xl">
            Complete Fire & Safety Services.<br />From Installation to Compliance.
          </h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-500">
            Certified professionals, inspections, maintenance, audits and compliance support — managed from one intelligent platform.
          </p>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-1.5">
            {["Verified Service Providers", "Certified Technicians", "Digital Service Reports", "QR-Based Asset Tracking"].map((t) => (
              <span key={t} className="flex items-center gap-1 text-xs font-medium text-slate-600">
                <BadgeCheck className="h-3.5 w-3.5 text-emerald-500" /> {t}
              </span>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
            <Image
              src={HERO_IMG}
              alt="Fire safety service engineers in India — inspection, installation and AMC of fire protection systems"
              className="aspect-[4/3] w-full"
            />
          </div>
          <div className="absolute -bottom-4 left-4 flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-md">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-bold text-slate-900">Platform-verified providers</p>
              <p className="text-[11px] text-slate-500">Every provider is approved before going live</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CategoryTile({ service }) {
  const Icon = getIcon(service.icon);
  return (
    <Link
      to={`/services/${service.slug}`}
      className="group flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-4 text-center transition hover:border-primary/40 hover:shadow-sm"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-50 text-slate-600 transition group-hover:bg-red-50 group-hover:text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <span className="text-[11px] font-medium leading-tight text-slate-700">{service.name}</span>
    </Link>
  );
}

function FeaturedCard({ item, onBook }) {
  const service = SERVICES.find((s) => s.slug === item.slug);
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <Link to={`/services/${item.slug}`} className="relative block overflow-hidden">
        <Image
          src={item.image}
          alt={`${service?.name || "Fire safety service"} in India`}
          className="aspect-[4/3] w-full transition duration-300 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 rounded-md bg-primary px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
          {item.save}
        </span>
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-slate-900">{service.name}</h3>
          <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-slate-700">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {service.rating}
          </span>
        </div>
        <p className="mt-1 line-clamp-2 text-xs text-slate-500">{service.short}</p>
        <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-500">
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {service.duration}</span>
          <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-emerald-500" /> Verified</span>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-lg font-bold text-slate-900">{item.price}<span className="text-xs font-medium text-slate-500">{item.per || " onwards"}</span></span>
          <span className="text-xs text-slate-400 line-through">{item.mrp}</span>
        </div>
        <div className="mt-3 flex gap-2 pt-1">
          <Button asChild variant="outline" size="sm" className="flex-1 text-xs font-semibold">
            <Link to={`/services/${item.slug}`}>View Details</Link>
          </Button>
          <Button onClick={() => onBook(item.slug)} size="sm" className="flex-1 text-xs font-semibold">
            Book Now <Zap className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Services() {
  const navigate = useNavigate();
  const { authed, open, setOpen, message, gate } = useAuthGate();
  useConsumePendingAction(authed);
  const { data: vendors } = useList("Vendor", { approval_status: "approved" }, "-rating", 6);
  const [query, setQuery] = useState("");

  const bookService = (slug) => {
    const svc = SERVICES.find((s) => s.slug === slug) || SERVICES[1];
    gate({
      action: "book_service",
      payload: { service: svc.slug },
      message: "Sign in to book this service.",
      run: () => navigate("/customer/service-requests"),
    });
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SERVICES;
    return SERVICES.filter((s) => s.name.toLowerCase().includes(q) || s.short.toLowerCase().includes(q));
  }, [query]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Seo
        title="Fire Safety Services in India — Audits, AMC, Installation &amp; Refilling | FireLink"
        description="Book fire safety services across India — fire audits, NOC support, extinguisher refilling, alarm &amp; hydrant installation, AMC and training from certified engineers."
        keywords={keywordList("fire safety services India", "fire audit India", "fire NOC assistance India", "fire extinguisher refilling India", "AMC fire safety India")}
        path="/services"
      />
      <JsonLd
        data={graph(
          itemListSchema({
            name: "Fire safety services in India",
            path: "/services",
            items: SERVICES.map((s) => ({ name: s.name, path: `/services/${s.slug}` })),
          })
        )}
      />
      <Hero />

      {/* Search + categories */}
      <section className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-bold text-slate-900">Browse by category</h2>
          <div className="relative sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search services…"
              className="h-10 w-full rounded-full border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-primary/50"
            />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-2.5 sm:grid-cols-7 lg:grid-cols-13">
          {(query ? filtered : SERVICES).slice(0, 13).map((s) => (
            <CategoryTile key={s.slug} service={s} />
          ))}
        </div>
      </section>

      {/* Popular services */}
      <section className="mx-auto max-w-6xl px-4 pt-12 sm:px-6">
        <div className="mb-4 flex items-baseline justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Popular services</h2>
            <p className="text-xs text-slate-500">Most booked by enterprises this month</p>
          </div>
          <Link to={`/services/${FEATURED[0].slug}`} className="hidden items-center gap-1 text-xs font-semibold text-primary hover:underline sm:inline-flex">
            View all <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURED.map((f) => (
            <FeaturedCard key={f.slug} item={f} onBook={bookService} />
          ))}
        </div>
      </section>

      {/* All services — commerce grid */}
      <section className="mx-auto max-w-6xl px-4 pt-12 sm:px-6">
        <h2 className="mb-4 text-base font-bold text-slate-900">
          {query ? `Results for "${query}"` : "All services"} <span className="text-xs font-normal text-slate-400">({filtered.length})</span>
        </h2>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-14 text-center">
            <Search className="mb-3 h-6 w-6 text-slate-300" />
            <p className="text-sm font-medium text-slate-700">No services match your search</p>
            <button onClick={() => setQuery("")} className="mt-2 text-xs font-semibold text-primary hover:underline">Clear search</button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((s) => {
              const Icon = getIcon(s.icon);
              return (
                <div key={s.slug} className="flex items-center gap-3.5 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-primary/40 hover:shadow-sm">
                  <Link to={`/services/${s.slug}`} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-primary">
                    <Icon className="h-5 w-5" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link to={`/services/${s.slug}`} className="line-clamp-1 text-sm font-semibold text-slate-900 hover:text-primary">
                      {s.name}
                    </Link>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {s.rating} · {s.price}
                    </p>
                  </div>
                  <Button onClick={() => bookService(s.slug)} size="sm" variant="outline" className="shrink-0 text-xs font-semibold">
                    Book <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 pt-12 sm:px-6">
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ["01", "Book in minutes", "Pick a service, share site details, choose a date."],
            ["02", "Certified visit", "A verified engineer arrives with a digital checklist."],
            ["03", "Digital records", "Reports, photos and certificates land in your account."],
          ].map(([num, title, desc]) => (
            <div key={num} className="rounded-xl border border-slate-200 bg-white px-5 py-5">
              <p className="font-mono text-xs font-semibold text-primary">{num}</p>
              <h3 className="mt-1.5 text-sm font-bold text-slate-900">{title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Providers */}
      {(vendors || []).length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-12 sm:px-6">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-base font-bold text-slate-900">Top rated providers</h2>
            <Link to="/vendors" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(vendors || []).slice(0, 4).map((v) => (
              <Link key={v.id} to="/vendors" className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-primary/40 hover:shadow-sm">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white"><Store className="h-4 w-4" /></span>
                  <div className="min-w-0">
                    <p className="flex items-center gap-1 truncate text-sm font-semibold text-slate-900">
                      {v.company_name} <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    </p>
                    <p className="text-[11px] text-slate-400">{v.city || "Pan-India"}</p>
                  </div>
                </div>
                <p className="mt-2.5 flex items-center gap-1 text-xs font-medium text-slate-600">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {v.rating || "New"}
                  <span className="text-slate-300">|</span>
                  <MapPin className="h-3 w-3 text-slate-400" /> {(v.categories || [])[0] || "Fire safety"}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Bottom CTA */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-4 rounded-2xl bg-slate-900 px-6 py-8 sm:flex-row sm:px-8">
          <div>
            <h2 className="font-display text-lg font-bold text-white">Manage your entire fire safety lifecycle</h2>
            <p className="mt-0.5 text-sm text-slate-400">From installation to compliance — one platform, one team.</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button onClick={() => bookService(SERVICES[1].slug)} className="font-semibold">Book a Service</Button>
            <Button asChild variant="outline" className="border-white/20 bg-transparent font-semibold text-white hover:bg-white/10 hover:text-white">
              <Link to="/register">Create Free Account</Link>
            </Button>
          </div>
        </div>
      </section>

      <FaqSection
        title="Fire safety services in India — questions answered"
        subtitle="Booking, coverage, certifications and AMC, explained."
        items={SERVICE_FAQS}
      />

      {/* Mobile sticky CTA */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-3 backdrop-blur lg:hidden">
        <Button onClick={() => bookService(SERVICES[1].slug)} className="h-11 w-full font-semibold">
          Book a Service <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="h-16 lg:hidden" />

      <AuthRequiredModal open={open} onClose={() => setOpen(false)} message={message} />
    </div>
  );
}