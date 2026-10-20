import React from "react";
import { Link } from "react-router-dom";
import { useList } from "@/hooks/useList";
import { Button } from "@/components/ui/button";
import { Star, ArrowRight } from "lucide-react";

export default function VendorsSection() {
  const { data: vendors, loading } = useList("Vendor", { approval_status: "approved" }, "-rating", 6);

  return (
    <section id="vendors" className="border-y border-slate-200 bg-slate-50/60">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-xl">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="text-sm font-semibold text-slate-700">Vendor Network</span>
            </div>
            <h2 className="font-display mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Shop from verified vendors
            </h2>
            <p className="mt-3 text-lg text-slate-600">
              Every vendor is verified and approved by our platform team before their products go live.
            </p>
          </div>
          <Button asChild variant="outline" className="font-semibold">
            <Link to="/vendors">View vendors <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>

        {loading ? (
          <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse bg-white" />
            ))}
          </div>
        ) : (
          <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-3">
            {(Array.isArray(vendors) ? vendors : []).slice(0, 6).map((v) => (
              <Link
                key={v.id}
                to="/vendors"
                className="group flex flex-col justify-between bg-white p-6 transition hover:bg-slate-50"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-base font-bold text-slate-900">{v.company_name}</p>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Verified</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{v.city || "Pan-India"}</p>
                </div>
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {(v.categories || []).slice(0, 3).map((c) => (
                    <span key={c} className="rounded border border-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                      {c}
                    </span>
                  ))}
                </div>
                <div className="mt-5 flex items-center gap-1 text-xs font-semibold text-slate-700">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {v.rating || "New"}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}