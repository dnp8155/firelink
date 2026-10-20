import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Image } from "@/components/ui/image";
import { ArrowRight, Wrench, ShieldCheck } from "lucide-react";

const HERO_IMG = "https://media.base44.com/images/public/6aa4425cbf7ee7adfbdf102e/bfe0fc2c4_generated_image.png";

const TRUST = [
  { label: "ISI / BIS certified products", icon: ShieldCheck },
  { label: "Platform-verified vendors", icon: ShieldCheck },
  { label: "Certified engineers & technicians", icon: Wrench },
  { label: "NOC & compliance support", icon: ShieldCheck },
];

export default function Hero() {
  return (
    <section className="border-b border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:py-24">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span className="text-sm font-semibold text-slate-700">India's Premium Fire & Safety Ecosystem</span>
          </div>
          <h1 className="font-display mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Complete fire &amp; safety solutions.{" "}
            <span className="text-primary">All in one place.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
            Discover certified products, professional services, asset management,
            compliance tools and expert support — connected through one platform.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="h-11 px-6 text-sm font-semibold">
              <Link to="/products">Explore Products <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-11 px-6 text-sm font-semibold">
              <Link to="/services"><Wrench className="h-4 w-4" /> Explore Services</Link>
            </Button>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-2">
            {TRUST.map((t) => {
              const Icon = t.icon;
              return (
                <div key={t.label} className="flex items-center gap-2.5">
                  <Icon className="h-4 w-4 shrink-0 text-primary" />
                  <span className="text-sm font-medium text-slate-700">{t.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <Image
              src={HERO_IMG}
              fittingType="fill"
              alt="Fire safety equipment in India — fire extinguishers, alarm control panel, smoke detector and hydrant valve from verified vendors"
              className="aspect-[4/3] w-full"
            />
          </div>
          <div className="absolute -bottom-5 -left-3 hidden items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex sm:-left-6">
            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">QR</div>
            <div>
              <p className="text-sm font-semibold text-slate-900">QR Asset Tracking</p>
              <p className="text-xs text-slate-500">Scan & verify on site</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}