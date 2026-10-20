import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useList, formatINR } from "@/hooks/useList";
import { useCart } from "@/lib/CartContext";
import { PageHeader, SectionCard, EmptyState } from "@/components/ui-bits";
import { Image } from "@/components/ui/image";
import { Heart, ShoppingCart, ShoppingBag, Star, Trash2 } from "lucide-react";

export default function Wishlist() {
  const { data: products, loading } = useList("Product", { approval_status: "approved" }, "-created_date", 200);
  const { add } = useCart();
  const [wish, setWish] = useState(() => { try { return JSON.parse(localStorage.getItem("fsc_wishlist")) || []; } catch { return []; } });

  const removeWish = (id) => {
    const next = wish.filter((x) => x !== id);
    setWish(next);
    localStorage.setItem("fsc_wishlist", JSON.stringify(next));
  };

  const items = products.filter((p) => wish.includes(p.id));

  return (
    <div>
      <PageHeader title="My Wishlist" subtitle={`${items.length} saved product${items.length !== 1 ? "s" : ""}.`} />
      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-72 animate-pulse rounded-2xl bg-slate-100" />)}</div>
      ) : items.length === 0 ? (
        <SectionCard>
          <EmptyState icon={Heart} title="Your wishlist is empty" description="Tap the heart on any product to save it here." action={<Link to="/marketplace" className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white">Browse Marketplace</Link>} />
        </SectionCard>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((p) => (
            <div key={p.id} className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
              <Link to={`/marketplace/${p.id}`} className="relative block aspect-square overflow-hidden bg-slate-50">
                {p.image_url ? (
                  <Image src={p.image_url} fittingType="fill" className="h-full w-full transition group-hover:scale-105" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-300"><ShoppingBag className="h-10 w-10" /></div>
                )}
              </Link>
              <div className="flex flex-1 flex-col p-3">
                <Link to={`/marketplace/${p.id}`} className="line-clamp-2 text-sm font-semibold text-slate-800 hover:text-rose-600">{p.name}</Link>
                <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {p.rating || "New"}
                </div>
                <div className="mt-auto flex items-center justify-between pt-2.5">
                  <span className="text-sm font-bold text-slate-900">{formatINR(p.price)}</span>
                  <div className="flex gap-1">
                    <button onClick={() => add(p)} className="flex items-center gap-1 rounded-lg bg-rose-600 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-rose-700"><ShoppingCart className="h-3 w-3" /> Add</button>
                    <button onClick={() => removeWish(p.id)} className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:text-rose-600"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}