import React from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff, ExternalLink, Package, Star, Wrench } from "lucide-react";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import { formatINR } from "@/hooks/useList";

export default function MarketplaceRow({ item, busy, onToggleFeatured, onToggleDisabled }) {
  const isProduct = item.kind === "Product";
  const TypeIcon = isProduct ? Package : Wrench;
  const href = isProduct ? `/products/${item.id}` : `/services/${item.slug || item.id}`;
  const disabled = item.approval_status === "disabled";

  return (
    <div className="flex flex-wrap items-center gap-3 px-5 py-3.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
        <TypeIcon className="h-4 w-4" />
      </div>

      <div className="min-w-[180px] flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-slate-800">{item.name}</p>
          {item.featured && <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />}
        </div>
        <p className="truncate text-xs text-slate-500">
          {[item.vendor_name, item.category, isProduct ? item.sku : item.service_type].filter(Boolean).join(" · ") || "—"}
        </p>
      </div>

      <span className="w-16 text-xs font-medium text-slate-500">{isProduct ? "Product" : "Service"}</span>
      <StatusBadge status={item.approval_status} tone={statusTone(item.approval_status)} />
      <span className="w-24 text-right text-sm font-semibold text-slate-900">{formatINR(item.price)}</span>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onToggleFeatured(item)}
          disabled={busy}
          title={item.featured ? "Remove from featured" : "Feature on the storefront"}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-amber-50 hover:text-amber-600 disabled:opacity-40"
        >
          <Star className="h-4 w-4" />
        </button>
        <button
          onClick={() => onToggleDisabled(item)}
          disabled={busy}
          title={disabled ? "Restore listing" : "Disable listing"}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
        >
          {disabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </button>
        <Link to={href} title="Open storefront page" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
          <ExternalLink className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}