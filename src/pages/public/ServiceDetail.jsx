import React from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useAuthGate } from "@/hooks/useAuthGate";
import { useConsumePendingAction } from "@/hooks/useConsumePendingAction";
import AuthRequiredModal from "@/components/AuthRequiredModal";
import { getIcon } from "@/lib/icons";
import { getServiceBySlug, SERVICES } from "@/lib/servicesData";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, ArrowRight, CheckCircle2, Clock, Star, ShieldCheck,
  MapPin, ChevronRight, Zap, Phone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Seo from "@/components/Seo";
import { serviceKeywords } from "@/lib/seoPages";
import { serviceSchema, breadcrumbSchema, graph } from "@/lib/schema";

const TONES = [
  "bg-red-50 text-primary", "bg-blue-50 text-blue-600", "bg-emerald-50 text-emerald-600", "bg-amber-50 text-amber-600",
  "bg-sky-50 text-sky-600", "bg-teal-50 text-teal-600", "bg-violet-50 text-violet-600", "bg-rose-50 text-rose-600",
  "bg-indigo-50 text-indigo-600", "bg-orange-50 text-orange-600", "bg-cyan-50 text-cyan-600", "bg-purple-50 text-purple-600",
  "bg-pink-50 text-pink-600",
];

export default function ServiceDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { authed, open, setOpen, message, gate } = useAuthGate();
  useConsumePendingAction(authed);

  const service = getServiceBySlug(slug);

  if (!service) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Service not found</h1>
        <Button asChild className="mt-4"><Link to="/services">Back to Services</Link></Button>
      </div>
    );
  }

  const Icon = getIcon(service.icon);
  const idx = SERVICES.findIndex((s) => s.slug === slug);
  const related = SERVICES.filter((s) => s.slug !== slug).slice(0, 3);

  const bookService = () =>
    gate({
      action: "book_service",
      payload: { service: service.slug },
      message: "Sign in to book this service.",
      run: () => navigate("/customer/service-requests"),
    });

  const requestQuote = () =>
    gate({
      action: "request_quote",
      payload: { service: service.slug },
      message: "Sign in to request a quotation.",
      run: () => navigate("/customer/rfqs"),
    });

  return (
    <div className="bg-slate-50">
      <Seo
        title={`${service.name} in India — Book Certified Engineers | FireLink`}
        description={`Book ${service.name} anywhere in India with FireLink — verified vendors, certified engineers, transparent pricing and PAN-India coverage.`}
        keywords={serviceKeywords(service)}
        path={`/services/${slug}`}
        jsonLd={graph(
          serviceSchema(service, `/services/${slug}`),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Services", path: "/services" },
            { name: service.name, path: `/services/${slug}` },
          ])
        )}
      />
      {/* Breadcrumb */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-1.5 px-4 py-3 text-xs text-slate-500 sm:px-6">
          <Link to="/" className="hover:text-slate-900">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/services" className="hover:text-slate-900">Services</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-slate-700">{service.name}</span>
        </div>
      </div>

      {/* Top section */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          {/* Left: service info */}
          <div>
            <div className="flex items-start gap-4">
              <span className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl", TONES[idx % TONES.length])}>
                <Icon className="h-7 w-7" />
              </span>
              <div>
                <h1 className="font-display text-3xl font-extrabold tracking-tight text-slate-900">{service.name}</h1>
                <p className="mt-1 text-sm text-slate-500">{service.short}</p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-4 text-sm">
              <span className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1 font-semibold text-amber-700">
                <Star className="h-4 w-4 fill-amber-500 text-amber-500" /> {service.rating}
              </span>
              <span className="flex items-center gap-1.5 text-slate-600">
                <ShieldCheck className="h-4 w-4 text-emerald-500" /> Verified Provider
              </span>
              <span className="flex items-center gap-1.5 text-slate-600">
                <MapPin className="h-4 w-4 text-slate-400" /> {service.coverage}
              </span>
              <span className="flex items-center gap-1.5 text-slate-600">
                <Zap className="h-4 w-4 text-slate-400" /> Response in {service.responseTime}
              </span>
            </div>

            <p className="mt-6 text-base leading-relaxed text-slate-600">{service.long}</p>
          </div>

          {/* Right: booking card */}
          <div className="lg:sticky lg:top-20 lg:self-start">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Starting from</p>
                  <p className="text-2xl font-bold text-slate-900">{service.price}</p>
                </div>
                <div className="text-right">
                  <p className="flex items-center gap-1 text-xs text-slate-500"><Clock className="h-3.5 w-3.5" /> {service.duration}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><MapPin className="h-3.5 w-3.5" /> {service.coverage}</p>
                </div>
              </div>
              <div className="mt-4 space-y-2.5">
                <Button onClick={bookService} className="h-12 w-full text-sm font-semibold">
                  Book This Service <ArrowRight className="h-4 w-4" />
                </Button>
                <Button onClick={requestQuote} variant="outline" className="h-12 w-full text-sm font-semibold">
                  Request Quote
                </Button>
                <Button asChild variant="ghost" className="h-11 w-full text-sm font-medium text-slate-600">
                  <Link to="/support"><Phone className="h-4 w-4" /> Talk to an Expert</Link>
                </Button>
              </div>
              <div className="mt-4 rounded-xl bg-slate-50 p-3 text-center text-xs text-slate-500">
                <ShieldCheck className="mx-auto mb-1 h-4 w-4 text-emerald-500" />
                Free cancellation up to 24 hours before the scheduled visit.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content sections */}
      <section className="mx-auto max-w-7xl space-y-8 px-4 pb-12 sm:px-6">
        {/* Overview */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-display text-lg font-bold text-slate-900">Overview</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{service.long}</p>
        </div>

        {/* What's included */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-display text-lg font-bold text-slate-900">What's Included</h2>
          <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
            {service.includes.map((item) => (
              <div key={item} className="flex items-center gap-2.5 rounded-xl bg-slate-50 px-3.5 py-2.5">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                <span className="text-sm font-medium text-slate-700">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Process */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-display text-lg font-bold text-slate-900">Process</h2>
          <div className="mt-5 flex flex-col gap-0 sm:flex-row sm:items-start sm:gap-0">
            {service.process.map((step, i) => (
              <div key={step} className="flex items-start gap-3 sm:flex-col sm:items-center sm:text-center">
                <div className="flex items-center sm:flex-col sm:gap-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white shadow-sm">
                    {i + 1}
                  </div>
                  {i < service.process.length - 1 && (
                    <div className="ml-3 h-0.5 w-full bg-slate-200 sm:ml-0 sm:mt-0 sm:h-8 sm:w-0.5" />
                  )}
                </div>
                <span className="pb-4 text-sm font-medium text-slate-700 sm:pb-0 sm:pt-2 sm:max-w-[100px]">{step}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Deliverables */}
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-display text-lg font-bold text-slate-900">Deliverables</h2>
            <div className="mt-4 space-y-2">
              {service.deliverables.map((d) => (
                <div key={d} className="flex items-center gap-2.5 border-b border-slate-50 pb-2 last:border-0">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                  <span className="text-sm text-slate-700">{d}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-display text-lg font-bold text-slate-900">Who Should Book This?</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {service.industries.map((ind) => (
                <span key={ind} className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">{ind}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Related services */}
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900">Related Services</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {related.map((s, i) => {
              const RIcon = getIcon(s.icon);
              return (
                <Link key={s.slug} to={`/services/${s.slug}`} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-primary/30 hover:shadow-md">
                  <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", TONES[(i + 3) % TONES.length])}>
                    <RIcon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-3 text-sm font-bold text-slate-900">{s.name}</h3>
                  <p className="mt-0.5 text-xs text-slate-500">{s.short}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">View Service <ArrowRight className="h-3 w-3" /></span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <AuthRequiredModal open={open} onClose={() => setOpen(false)} message={message} />
    </div>
  );
}