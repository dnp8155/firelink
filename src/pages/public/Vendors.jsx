import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useList } from "@/hooks/useList";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BadgeCheck, MapPin, Star, ShieldCheck, ShoppingBag, Search } from "lucide-react";
import Seo from "@/components/Seo";
import JsonLd from "@/components/JsonLd";
import { keywordList } from "@/lib/seoPages";
import { itemListSchema, graph } from "@/lib/schema";

export default function Vendors() {
  const { data: vendors, loading } = useList("Vendor", { approval_status: "approved" }, "-rating", 100);
  const [locationFilter, setLocationFilter] = useState("");

  const sortedVendors = useMemo(() => {
    if (!locationFilter.trim()) return vendors;
    const loc = locationFilter.toLowerCase().trim();
    // First show vendors matching the searched location, then the rest by rating
    const matching = vendors.filter((v) =>
      (v.city || "").toLowerCase().includes(loc) ||
      (v.state || "").toLowerCase().includes(loc) ||
      (v.service_locations || []).some((s) => s.toLowerCase().includes(loc))
    );
    const rest = vendors.filter((v) => !matching.includes(v));
    return [...matching, ...rest];
  }, [vendors, locationFilter]);

  return (
    <div>
      <Seo
        title="Verified Fire Safety Vendors &amp; Suppliers in India | FireLink"
        description="Browse platform-verified fire safety vendors across India — manufacturers, distributors and service providers for extinguishers, alarms, hydrants, pumps, AMC and fire audits."
        keywords={keywordList("fire safety vendors India", "fire safety suppliers India", "fire extinguisher dealer India", "fire safety distributors India")}
        path="/vendors"
      />
      <JsonLd
        data={graph(
          itemListSchema({
            name: "Verified fire safety vendors and suppliers in India",
            path: "/vendors",
            items: vendors.slice(0, 50).map((v) => ({ name: v.company_name })),
          })
        )}
      />
      <div className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <Link to="/" className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to home
          </Link>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Verified Vendor Network
          </h1>
          <p className="mt-2 flex max-w-2xl items-center gap-1.5 text-sm text-slate-500 sm:text-base">
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
            Only vendors approved by the FIRELINK platform team appear here — pending or suspended vendors are never listed.
          </p>
          <div className="mt-5 flex items-center gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                placeholder="Search vendors by location (city, state)…"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              />
            </div>
            {locationFilter && (
              <button onClick={() => setLocationFilter("")} className="text-xs font-medium text-slate-500 hover:text-slate-900">
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-44 animate-pulse rounded-2xl bg-white" />
            ))}
          </div>
        ) : sortedVendors.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
            No vendors found. Try a different location or clear your search.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sortedVendors.map((v) => (
              <div
                key={v.id}
                className="flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 text-base font-bold text-white">
                    {(v.company_name || "V").slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-base font-bold text-slate-900">{v.company_name}</p>
                    <p className="flex items-center gap-1 text-xs text-slate-500">
                      <MapPin className="h-3 w-3" /> {v.city || "India"}
                    </p>
                  </div>
                  <span className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                    <BadgeCheck className="h-3 w-3" /> Verified Vendor
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {(v.categories || []).slice(0, 4).map((c) => (
                    <span key={c} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                      {c}
                    </span>
                  ))}
                </div>
                <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="flex items-center gap-1 text-sm font-bold text-slate-800">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {v.rating || "New"}
                  </span>
                  <Button asChild variant="outline" size="sm" className="font-semibold">
                    <Link to="/products"><ShoppingBag className="h-3.5 w-3.5" /> View Products</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}