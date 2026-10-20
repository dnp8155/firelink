import React from "react";
import { Image } from "@/components/ui/image";
import { Button } from "@/components/ui/button";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import { formatINR } from "@/hooks/useList";
import { timeAgo } from "@/lib/format";
import { Package, ChevronRight } from "lucide-react";

export default function ProductRow({ product: p, onReview }) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {p.image_url ? (
          <Image src={p.image_url} alt={p.name || "Product"} className="h-12 w-12 shrink-0 rounded-xl" />
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400"><Package className="h-5 w-5" /></div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{p.name || "Untitled product"}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            {p.sku && <span>SKU {p.sku}</span>}
            {p.category && <span>{p.category}</span>}
            {p.vendor_name && <span>{p.vendor_name}</span>}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 sm:justify-end">
        <div className="text-right">
          <p className="text-sm font-semibold text-slate-900">{formatINR(p.price)}</p>
          <p className="text-[11px] text-slate-500">{p.stock != null ? `${p.stock} ${p.unit || "in stock"}` : "Stock —"}</p>
        </div>
        <span className="hidden text-xs text-slate-400 md:inline">{timeAgo(p.created_date)}</span>
        <StatusBadge status={p.approval_status} tone={statusTone(p.approval_status)} />
        <Button size="sm" variant="outline" onClick={onReview}>Review <ChevronRight className="h-3.5 w-3.5" /></Button>
      </div>
    </div>
  );
}