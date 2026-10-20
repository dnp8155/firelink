import React from "react";
import { Switch } from "@/components/ui/switch";
import { ShoppingBag, PackageCheck, Percent, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const SORTS = [
  ["featured", "Featured"],
  ["price_low", "Price: Low to High"],
  ["price_high", "Price: High to Low"],
  ["rating", "Top Rated"],
];

export function SidebarContent({
  categories, total, cat, setCat, sort, setSort,
  inStockOnly, setInStockOnly, dealsOnly, setDealsOnly, onSelect,
}) {
  const pick = (name) => { setCat(name); if (onSelect) onSelect(); };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Categories</p>
        <nav className="mt-3 space-y-1">
          <button
            onClick={() => pick("All")}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition",
              cat === "All" ? "bg-red-50 font-semibold text-primary" : "text-slate-600 hover:bg-slate-50"
            )}
          >
            <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", cat === "All" ? "bg-white text-primary shadow-sm" : "bg-slate-100 text-slate-500")}>
              <ShoppingBag className="h-3.5 w-3.5" />
            </span>
            <span className="flex-1">All Products</span>
            <span className={cn("rounded-full px-1.5 py-0.5 text-[10px]", cat === "All" ? "bg-white text-primary" : "bg-slate-100 text-slate-500")}>{total}</span>
          </button>
          {categories.map((c) => {
            const Icon = c.icon;
            const active = cat === c.name;
            return (
              <button
                key={c.name}
                onClick={() => pick(c.name)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition",
                  active ? "bg-red-50 font-semibold text-primary" : "text-slate-600 hover:bg-slate-50"
                )}
              >
                <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", active ? "bg-white text-primary shadow-sm" : c.tone)}>
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span className="flex-1 truncate">{c.name}</span>
                <span className={cn("rounded-full px-1.5 py-0.5 text-[10px]", active ? "bg-white text-primary" : "bg-slate-100 text-slate-500")}>{c.count}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Filters</p>
        <div className="mt-3 space-y-3.5">
          <label className="flex items-center justify-between text-sm font-medium text-slate-700">
            <span className="flex items-center gap-2"><PackageCheck className="h-4 w-4 text-slate-400" /> In stock only</span>
            <Switch checked={inStockOnly} onCheckedChange={setInStockOnly} />
          </label>
          <label className="flex items-center justify-between text-sm font-medium text-slate-700">
            <span className="flex items-center gap-2"><Percent className="h-4 w-4 text-slate-400" /> Great deals only</span>
            <Switch checked={dealsOnly} onCheckedChange={setDealsOnly} />
          </label>
        </div>

        <p className="mt-5 text-[11px] font-bold uppercase tracking-wider text-slate-400">Sort by</p>
        <div className="mt-2 space-y-1">
          {SORTS.map(([value, label]) => (
            <button
              key={value}
              onClick={() => setSort(value)}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition",
                sort === value ? "bg-red-50 font-semibold text-primary" : "text-slate-600 hover:bg-slate-50"
              )}
            >
              <span className="flex h-4 w-4 items-center justify-center">
                {sort === value && <Check className="h-3.5 w-3.5" />}
              </span>
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CategorySidebar(props) {
  return (
    <aside className="hidden lg:block">
      <div className="sticky top-20">
        <SidebarContent {...props} />
      </div>
    </aside>
  );
}