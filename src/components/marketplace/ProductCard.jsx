import React from "react";
import { Link } from "react-router-dom";
import { Image } from "@/components/ui/image";
import { formatINR } from "@/hooks/useList";
import { Heart, ShoppingBag, ShoppingCart, Star, GitCompare, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProductCard({ p, wished, onWish, onAdd, onQuote, compared, onCompare }) {
  const off = p.mrp && p.mrp > p.price ? Math.round((1 - p.price / p.mrp) * 100) : 0;
  const cert = (p.certifications || [])[0];
  const inStock = p.stock > 0;
  const lowStock = inStock && p.stock <= 30;

  return (
    <div className="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg">
      <Link to={`/products/${p.id}`} className="relative block aspect-square overflow-hidden bg-slate-50">
        {p.image_url ? (
          <Image src={p.image_url} fittingType="fill" alt={p.name} className="h-full w-full transition duration-300 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-300">
            <ShoppingBag className="h-10 w-10" />
          </div>
        )}
        <div className="absolute left-1.5 top-1.5 flex flex-col items-start gap-1">
          {cert && (
            <span className="rounded-md bg-slate-900/85 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow">{cert}</span>
          )}
          {off > 0 && (
            <span className="rounded-md bg-emerald-600 px-1.5 py-0.5 text-[9px] font-bold text-white shadow">{off}% OFF</span>
          )}
        </div>
        {!inStock && (
          <span className="absolute inset-x-0 bottom-0 bg-slate-900/75 py-1 text-center text-[10px] font-semibold text-white">Out of stock</span>
        )}
        <button
          onClick={(e) => { e.preventDefault(); onWish(p); }}
          className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur transition hover:scale-105"
          aria-label="Wishlist"
        >
          <Heart className={cn("h-3.5 w-3.5", wished ? "fill-rose-500 text-rose-500" : "text-slate-400")} />
        </button>
        {onCompare && (
          <button
            onClick={(e) => { e.preventDefault(); onCompare(p); }}
            className={cn(
              "absolute right-1.5 top-11 hidden h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur transition hover:scale-105 sm:flex",
            )}
            aria-label="Compare"
          >
            <GitCompare className={cn("h-3.5 w-3.5", compared ? "text-primary" : "text-slate-400")} />
          </button>
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col px-2.5 pb-2.5 pt-2">
        {p.brand && <p className="truncate text-[9px] font-semibold uppercase tracking-wider text-slate-400">{p.brand}</p>}
        <Link to={`/products/${p.id}`} className="mt-0.5 line-clamp-2 min-h-[2.2em] text-[13px] font-bold leading-tight text-slate-900 transition hover:text-primary">
          {p.name}
        </Link>

        <div className="mt-1 flex items-center gap-1">
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
          <span className="text-[11px] font-semibold text-slate-600">{p.rating || "New"}</span>
          {p.reviews_count ? <span className="text-[10px] text-slate-400">({p.reviews_count})</span> : null}
        </div>

        <div className="mt-1.5 flex items-baseline gap-1.5">
          <p className="text-sm font-bold text-slate-900">{formatINR(p.price)}</p>
          {p.mrp && p.mrp > p.price && <span className="text-[10px] text-slate-400 line-through">{formatINR(p.mrp)}</span>}
        </div>

        <p className={cn(
          "mt-0.5 text-[10px] font-semibold",
          !inStock ? "text-rose-600" : lowStock ? "text-amber-600" : "text-emerald-600"
        )}>
          {!inStock ? "Out of Stock" : lowStock ? `Only ${p.stock} left` : "In Stock"}
        </p>

        <div className="mt-2 grid grid-cols-2 gap-1.5">
          <button
            onClick={() => onAdd(p)}
            disabled={!inStock}
            className="flex min-w-0 items-center justify-center gap-1 rounded-lg bg-primary px-1 py-1.5 text-[10px] font-semibold leading-tight text-primary-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-slate-300 sm:text-[11px]"
          >
            <ShoppingCart className="h-3 w-3 shrink-0" /> Add to Cart
          </button>
          <button
            onClick={() => onQuote && onQuote(p)}
            className="flex min-w-0 items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-1 py-1.5 text-[10px] font-semibold leading-tight text-slate-700 transition hover:bg-slate-50 sm:text-[11px]"
          >
            <FileText className="h-3 w-3 shrink-0" /> Get Quote
          </button>
        </div>
      </div>
    </div>
  );
}