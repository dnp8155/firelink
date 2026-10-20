import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Image } from "@/components/ui/image";
import { formatINR } from "@/hooks/useList";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { GitCompare, X, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const ROWS = [
  ["Price", (p) => <span className="font-bold text-slate-900">{formatINR(p.price)}</span>],
  ["MRP", (p) => (p.mrp && p.mrp > p.price ? <span className="text-slate-400 line-through">{formatINR(p.mrp)}</span> : "—")],
  ["Brand", (p) => p.brand || "—"],
  ["Manufacturer", (p) => p.manufacturer || "—"],
  ["Category", (p) => p.category || "—"],
  ["Rating", (p) => `${p.rating || "—"}${p.reviews_count ? ` (${p.reviews_count})` : ""}`],
  ["Availability", (p) => (p.stock > 0 ? `${p.stock} in stock` : "Out of stock")],
  ["MOQ", (p) => `${p.moq || 1} ${p.unit || "piece"}(s)`],
  ["Certifications", (p) => (p.certifications || []).join(", ") || "—"],
  ["Vendor", (p) => p.vendor_name || "—"],
  ["Location", (p) => p.location || "—"],
];

export default function CompareBar({ compare, onRemove, onClear }) {
  const [open, setOpen] = useState(false);
  if (compare.length === 0) return null;

  return (
    <>
      <div className="fixed inset-x-0 bottom-20 z-40 border-t border-slate-200 bg-white/95 shadow-2xl backdrop-blur lg:bottom-0">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <GitCompare className="h-5 w-5 shrink-0 text-primary" />
          <div className="flex flex-1 gap-2 overflow-x-auto">
            {compare.map((p) => (
              <div key={p.id} className="flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white py-1.5 pl-1.5 pr-2">
                {p.image_url ? <Image src={p.image_url} className="h-9 w-9 rounded-lg" /> : <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-[10px] text-slate-400">IMG</div>}
                <span className="max-w-[110px] truncate text-xs font-medium text-slate-700">{p.name}</span>
                <button onClick={() => onRemove(p.id)} className="rounded-full p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label="Remove">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
          <button onClick={onClear} className="hidden text-xs font-medium text-slate-500 hover:text-slate-700 sm:block">Clear</button>
          <button onClick={() => setOpen(true)} className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90">
            Compare ({compare.length})
          </button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><GitCompare className="h-4 w-4 text-primary" /> Product Comparison</DialogTitle>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[540px] text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="w-32 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Specification</th>
                  {compare.map((p) => (
                    <th key={p.id} className="px-4 py-3 text-left">
                      <div className="flex flex-col gap-2">
                        {p.image_url ? <Image src={p.image_url} className="h-16 w-16 rounded-xl" /> : <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-slate-100 text-slate-400">IMG</div>}
                        <Link to={`/products/${p.id}`} className="text-sm font-semibold text-slate-800 hover:text-primary">{p.name}</Link>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ROWS.map(([label, render]) => (
                  <tr key={label}>
                    <td className="px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-slate-400">{label}</td>
                    {compare.map((p) => (
                      <td key={p.id} className="px-4 py-2.5 text-slate-700">{render(p)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}