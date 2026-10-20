import React, { useState } from "react";
import { useList, formatINR } from "@/hooks/useList";
import { PageHeader, SectionCard, EmptyState } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import { Image as Img } from "@/components/ui/image";
import { GitCompare, Search, Star, MapPin, Check, X, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function VendorCompare() {
  const vendors = useList("Vendor", { approval_status: "approved" }, "company_name", 200);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState([]);

  const filtered = vendors.data.filter((v) =>
    !q || (v.company_name || "").toLowerCase().includes(q.toLowerCase()) || (v.city || "").toLowerCase().includes(q.toLowerCase()) || (v.categories || []).join(" ").toLowerCase().includes(q.toLowerCase())
  );

  const toggle = (v) => {
    if (selected.find((s) => s.id === v.id)) setSelected(selected.filter((s) => s.id !== v.id));
    else if (selected.length < 4) setSelected([...selected, v]);
  };

  return (
    <div>
      <PageHeader title="Compare Vendors" subtitle="Compare multiple vendors side-by-side to make the best choice." icon={GitCompare} />

      {selected.length > 0 ? (
        <SectionCard className="mb-6 overflow-x-auto">
          <div className="min-w-[600px]">
            <div className="grid" style={{ gridTemplateColumns: `200px repeat(${selected.length}, 1fr)` }}>
              <div className="border-b border-slate-100 p-4 text-xs font-semibold uppercase text-slate-400">Attribute</div>
              {selected.map((v) => (
                <div key={v.id} className="relative border-b border-l border-slate-100 p-4">
                  <button onClick={() => toggle(v)} className="absolute right-2 top-2 text-slate-300 hover:text-rose-500"><X className="h-3.5 w-3.5" /></button>
                  <div className="mx-auto mb-2 h-12 w-12 overflow-hidden rounded-lg bg-slate-100">{v.logo_url && <Img src={v.logo_url} className="h-full w-full" />}</div>
                  <p className="text-center text-sm font-semibold text-slate-900">{v.company_name}</p>
                </div>
              ))}
              <Row label="Rating" />
              {selected.map((v) => <Cell key={v.id}><span className="flex items-center justify-center gap-1"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />{v.rating || "—"}</span></Cell>)}
              <Row label="City" />
              {selected.map((v) => <Cell key={v.id}><span className="flex items-center justify-center gap-1 text-slate-700"><MapPin className="h-3 w-3 text-slate-400" />{v.city || "—"}</span></Cell>)}
              <Row label="Business Type" />
              {selected.map((v) => <Cell key={v.id}><span className="capitalize text-slate-700">{v.business_type?.replace("_", " ") || "—"}</span></Cell>)}
              <Row label="Categories" />
              {selected.map((v) => <Cell key={v.id}><div className="flex flex-wrap justify-center gap-1">{(v.categories || []).slice(0, 3).map((c, i) => <span key={i} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">{c}</span>)}</div></Cell>)}
              <Row label="Brands" />
              {selected.map((v) => <Cell key={v.id}><div className="flex flex-wrap justify-center gap-1">{(v.brands || []).slice(0, 3).map((b, i) => <span key={i} className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] text-blue-600">{b}</span>)}</div></Cell>)}
              <Row label="Service Locations" />
              {selected.map((v) => <Cell key={v.id}><div className="flex flex-wrap justify-center gap-1">{(v.service_locations || []).slice(0, 3).map((s, i) => <span key={i} className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-600">{s}</span>)}</div></Cell>)}
              <Row label="Established" />
              {selected.map((v) => <Cell key={v.id}><span className="text-slate-700">{v.year_established || "—"}</span></Cell>)}
              <Row label="Employees" />
              {selected.map((v) => <Cell key={v.id}><span className="text-slate-700">{v.employees_count || "—"}</span></Cell>)}
              <Row label="Status" />
              {selected.map((v) => <Cell key={v.id}><StatusBadge status={v.approval_status} tone={statusTone(v.approval_status)} /></Cell>)}
              <Row label="Website" />
              {selected.map((v) => <Cell key={v.id}>{v.website ? <a href={v.website} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">Visit</a> : <span className="text-slate-300">—</span>}</Cell>)}
            </div>
          </div>
        </SectionCard>
      ) : (
        <div className="mb-6 rounded-xl border-2 border-dashed border-slate-200 p-8 text-center">
          <GitCompare className="mx-auto mb-2 h-8 w-8 text-slate-300" />
          <p className="text-sm text-slate-500">Select up to 4 vendors to compare side-by-side</p>
        </div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <div className="relative max-w-sm"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search vendors…" className="pl-9" /></div>
        {selected.length > 0 && <Button variant="outline" onClick={() => setSelected([])}><Trash2 className="h-4 w-4" /> Clear All</Button>}
      </div>

      {vendors.loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-200/60" />)}</div>
      ) : filtered.length === 0 ? (
        <SectionCard><EmptyState icon={GitCompare} title="No vendors found" /></SectionCard>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((v) => {
            const isSelected = selected.find((s) => s.id === v.id);
            return (
              <div key={v.id} className={cn("rounded-2xl border bg-white p-4 shadow-sm transition", isSelected ? "border-emerald-400 ring-1 ring-emerald-400" : "border-slate-200 hover:border-slate-300")}>
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100">{v.logo_url && <Img src={v.logo_url} className="h-full w-full" />}</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{v.company_name}</p>
                    <p className="text-xs text-slate-500">{v.city} · {v.business_type?.replace("_", " ")}</p>
                    <div className="mt-1 flex items-center gap-1 text-xs text-slate-500"><Star className="h-3 w-3 fill-amber-400 text-amber-400" />{v.rating || "New"}</div>
                  </div>
                </div>
                <Button size="sm" variant={isSelected ? "default" : "outline"} onClick={() => toggle(v)} disabled={!isSelected && selected.length >= 4} className={cn("mt-3 w-full", isSelected ? "bg-emerald-600 hover:bg-emerald-700" : "")}>
                  {isSelected ? <><Check className="h-3.5 w-3.5" /> Selected</> : <><Plus className="h-3.5 w-3.5" /> Compare</>}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const Row = ({ label }) => <div className="border-b border-slate-100 p-4 text-xs font-semibold uppercase text-slate-400">{label}</div>;
const Cell = ({ children }) => <div className="flex items-center justify-center border-b border-l border-slate-100 p-4 text-sm">{children}</div>;