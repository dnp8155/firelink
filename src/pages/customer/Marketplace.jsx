import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useList } from "@/hooks/useList";
import { useCart } from "@/lib/CartContext";
import { useAuthGate } from "@/hooks/useAuthGate";
import { useConsumePendingAction } from "@/hooks/useConsumePendingAction";
import AuthRequiredModal from "@/components/AuthRequiredModal";
import MarketplaceHero from "@/components/marketplace/MarketplaceHero";
import { CategorySidebar, SidebarContent } from "@/components/marketplace/CategorySidebar";
import ProductCard from "@/components/marketplace/ProductCard";
import CompareBar from "@/components/marketplace/CompareBar";
import { SectionCard, EmptyState } from "@/components/ui-bits";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Search, SlidersHorizontal, Flame, Siren, Droplets, Waves, Gauge, DoorOpen, HardHat } from "lucide-react";
import { cn } from "@/lib/utils";
import Seo from "@/components/Seo";
import JsonLd from "@/components/JsonLd";
import { keywordList } from "@/lib/seoPages";
import { itemListSchema, graph } from "@/lib/schema";

const CAT_META = {
  "Extinguishers": { icon: Flame, tone: "bg-rose-50 text-rose-600" },
  "Fire Detectors": { icon: Siren, tone: "bg-blue-50 text-blue-600" },
  "Sprinklers": { icon: Droplets, tone: "bg-sky-50 text-sky-600" },
  "Hose & Reels": { icon: Waves, tone: "bg-indigo-50 text-indigo-600" },
  "Pumps": { icon: Gauge, tone: "bg-emerald-50 text-emerald-600" },
  "Signage": { icon: DoorOpen, tone: "bg-amber-50 text-amber-600" },
  "PPE": { icon: HardHat, tone: "bg-teal-50 text-teal-600" },
};

export default function Marketplace() {
  const { data: products, loading } = useList("Product", { approval_status: "approved" }, "-created_date", 200);
  const { add } = useCart();
  const { authed, open, setOpen, message, gate } = useAuthGate();
  useConsumePendingAction(authed);
  const navigate = useNavigate();
  const requestQuote = (p) =>
    gate({ action: "request_quote", payload: p, message: "Sign in to request a quote for this product.", run: () => navigate("/rfqs") });
  const [q, setQ] = useState(() => new URLSearchParams(window.location.search).get("q") || "");
  const [cat, setCat] = useState("All");
  const [sort, setSort] = useState("featured");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [dealsOnly, setDealsOnly] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [wishlist, setWishlist] = useState(() => { try { return JSON.parse(localStorage.getItem("fsc_wishlist")) || []; } catch { return []; } });
  const [compare, setCompare] = useState([]);

  const toggleCompare = (p) =>
    setCompare((prev) =>
      prev.some((x) => x.id === p.id) ? prev.filter((x) => x.id !== p.id) : prev.length >= 3 ? prev : [...prev, p]
    );

  const toggleWish = (p) =>
    gate({
      action: "wishlist",
      payload: { id: p.id },
      message: "Sign in to save products to your wishlist.",
      run: () =>
        setWishlist((prev) => {
          const next = prev.includes(p.id) ? prev.filter((x) => x !== p.id) : [...prev, p.id];
          localStorage.setItem("fsc_wishlist", JSON.stringify(next));
          return next;
        }),
    });

  const addToCart = (p) =>
    gate({ action: "add_to_cart", payload: p, message: "Sign in to add products to your cart.", run: () => add(p) });

  const categories = useMemo(
    () =>
      Object.entries(CAT_META)
        .map(([name, meta]) => ({ name, ...meta, count: products.filter((p) => p.category === name).length }))
        .filter((c) => c.count > 0),
    [products]
  );

  const filtered = useMemo(() => {
    const list = products.filter(
      (p) =>
        (cat === "All" || p.category === cat) &&
        (!inStockOnly || p.stock > 0) &&
        (!dealsOnly || (p.mrp && p.mrp > p.price)) &&
        (!q || (p.name + p.brand + p.manufacturer + p.sku).toLowerCase().includes(q.toLowerCase()))
    );
    if (sort === "price_low") return [...list].sort((a, b) => a.price - b.price);
    if (sort === "price_high") return [...list].sort((a, b) => b.price - a.price);
    if (sort === "rating") return [...list].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    return [...list].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || (b.rating || 0) - (a.rating || 0));
  }, [products, q, cat, sort, inStockOnly, dealsOnly]);

  const sidebarProps = { categories, total: products.length, cat, setCat, sort, setSort, inStockOnly, setInStockOnly, dealsOnly, setDealsOnly };

  return (
    <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6">
      <Seo
        title="Fire Safety Products Online in India — Extinguishers, Alarms &amp; PPE | FireLink"
        description="Shop ISI/BIS-certified fire safety products in India — fire extinguishers, alarm systems, hydrants, pumps and safety PPE from platform-verified vendors with GST invoice and PAN-India delivery."
        keywords={keywordList("fire safety products India", "fire extinguisher price India", "fire alarm system India", "fire safety equipment store India")}
        path="/products"
      />
      <JsonLd
        data={graph(
          itemListSchema({
            name: "Fire safety products available in India",
            path: "/products",
            items: products.slice(0, 50).map((p) => ({ name: p.name, path: `/products/${p.id}` })),
          })
        )}
      />
      <MarketplaceHero q={q} setQ={setQ} />

      {/* Mobile quick categories */}
      <div className="mt-4 flex gap-2.5 overflow-x-auto pb-1.5 lg:hidden">
        <button
          onClick={() => setCat("All")}
          className={cn(
            "flex shrink-0 items-center gap-2 rounded-full py-2 pl-2 pr-4 text-xs font-semibold ring-1 transition",
            cat === "All" ? "bg-primary text-primary-foreground ring-primary" : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"
          )}
        >
          <span className={cn("flex h-7 w-7 items-center justify-center rounded-full", cat === "All" ? "bg-white/20" : "bg-slate-100")}>
            <SlidersHorizontal className="h-3.5 w-3.5" />
          </span>
          All Products
          <span className={cn("rounded-full px-1.5 py-0.5 text-[10px]", cat === "All" ? "bg-white/20" : "bg-slate-100 text-slate-500")}>{products.length}</span>
        </button>
        {categories.map((c) => {
          const Icon = c.icon;
          const active = cat === c.name;
          return (
            <button
              key={c.name}
              onClick={() => setCat(c.name)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-full py-2 pl-2 pr-4 text-xs font-semibold ring-1 transition",
                active ? "bg-primary text-primary-foreground ring-primary" : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"
              )}
            >
              <span className={cn("flex h-7 w-7 items-center justify-center rounded-full", active ? "bg-white/20" : c.tone)}>
                <Icon className="h-3.5 w-3.5" />
              </span>
              {c.name}
              <span className={cn("rounded-full px-1.5 py-0.5 text-[10px]", active ? "bg-white/20" : "bg-slate-100 text-slate-500")}>{c.count}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[250px_1fr]">
        <CategorySidebar {...sidebarProps} />

        <div>
          {/* Toolbar */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-500">
              {loading ? (
                "Loading products…"
              ) : (
                <>
                  <span className="font-semibold text-slate-800">{filtered.length}</span> product{filtered.length !== 1 && "s"}
                  {cat !== "All" && <> in <span className="font-medium text-slate-700">{cat}</span></>}
                  {q && <> for "<span className="font-medium text-slate-700">{q}</span>"</>}
                </>
              )}
            </p>
            <div className="flex items-center gap-2">
              <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetTrigger asChild>
                  <button className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 lg:hidden">
                    <SlidersHorizontal className="h-4 w-4" /> Filters
                  </button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="px-4 pb-6">
                    <SidebarContent {...sidebarProps} onSelect={() => setSheetOpen(false)} />
                  </div>
                </SheetContent>
              </Sheet>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none focus:border-primary/40"
              >
                <option value="featured">Featured</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-80 animate-pulse rounded-2xl bg-white" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <SectionCard>
              <EmptyState icon={Search} title="No products found" description="Try a different search, category or filter." />
            </SectionCard>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
              {filtered.map((p) => (
                <ProductCard
                  key={p.id}
                  p={p}
                  wished={wishlist.includes(p.id)}
                  onWish={toggleWish}
                  onAdd={addToCart}
                  onQuote={requestQuote}
                  compared={compare.some((c) => c.id === p.id)}
                  onCompare={toggleCompare}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <CompareBar compare={compare} onRemove={(id) => setCompare((prev) => prev.filter((x) => x.id !== id))} onClear={() => setCompare([])} />

      <AuthRequiredModal open={open} onClose={() => setOpen(false)} message={message} />
    </div>
  );
}