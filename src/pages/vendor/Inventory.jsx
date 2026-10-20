import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useList, formatINR } from "@/hooks/useList";
import { PageHeader, SectionCard, EmptyState } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Warehouse, PackageX, PackageCheck, Save } from "lucide-react";
import { useVendor } from "@/lib/vendor";
import { useAuth } from "@/lib/AuthContext";
import { cn } from "@/lib/utils";

export default function Inventory() {
  const { vendor } = useVendor();
  const { user } = useAuth();
  const { data: allProducts, loading, reload } = useList("Product", {}, "-created_date", 300);
  const { toast } = useToast();
  const [edits, setEdits] = useState({});
  const products = allProducts.filter((p) => (vendor && p.vendor_id === vendor.id) || p.created_by_id === user?.id);

  const lowStock = products.filter((p) => (p.stock ?? 0) <= 30);
  const outOfStock = products.filter((p) => !p.stock);

  const saveStock = async (p) => {
    const val = edits[p.id];
    if (val == null || val === "" || val === p.stock) { setEdits((e) => { const n = { ...e }; delete n[p.id]; return n; }); return; }
    try {
      await base44.entities.Product.update(p.id, { stock: Number(val) });
      toast({ title: "Inventory updated", description: `${p.sku} → ${val} units` });
      setEdits((e) => { const n = { ...e }; delete n[p.id]; return n; });
      reload();
    } catch (e) {
      toast({ title: "Update failed", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div>
      <PageHeader title="Inventory & Warehouses" icon={Warehouse} subtitle="Track stock levels across your catalog and update availability." />

      <div className="mb-5 grid grid-cols-3 gap-4">
        <SectionCard><div className="p-4"><p className="text-xs text-slate-500">Total SKUs</p><p className="mt-1 text-2xl font-bold text-slate-900">{products.length}</p></div></SectionCard>
        <SectionCard><div className="p-4"><p className="text-xs text-slate-500">Low Stock</p><p className="mt-1 text-2xl font-bold text-amber-600">{lowStock.length}</p></div></SectionCard>
        <SectionCard><div className="p-4"><p className="text-xs text-slate-500">Out of Stock</p><p className="mt-1 text-2xl font-bold text-rose-600">{outOfStock.length}</p></div></SectionCard>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />)}</div>
      ) : products.length === 0 ? (
        <SectionCard><EmptyState icon={Warehouse} title="No products yet" description="Add products from the Products page to manage inventory." /></SectionCard>
      ) : (
        <SectionCard title="Stock Levels">
          <div className="divide-y divide-slate-50">
            {products.map((p) => {
              const edited = edits[p.id] != null && edits[p.id] !== "";
              return (
                <div key={p.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">{p.name}</p>
                    <p className="font-mono text-xs text-slate-400">{p.sku} · {formatINR(p.price)}</p>
                  </div>
                  {!p.stock ? (
                    <span className="flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-600"><PackageX className="h-3 w-3" /> Out of stock</span>
                  ) : p.stock <= 30 ? (
                    <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-600"><PackageX className="h-3 w-3" /> Low: {p.stock}</span>
                  ) : (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-600"><PackageCheck className="h-3 w-3" /> {p.stock} units</span>
                  )}
                  <div className="flex w-32 items-center gap-1.5">
                    <input
                      type="number" min="0"
                      value={edits[p.id] != null ? edits[p.id] : p.stock ?? 0}
                      onChange={(e) => setEdits({ ...edits, [p.id]: e.target.value })}
                      className={cn("w-20 rounded-lg border px-2.5 py-1.5 text-sm outline-none", edited ? "border-rose-300 bg-rose-50/50" : "border-slate-200")}
                    />
                    <Button size="sm" variant={edited ? "default" : "ghost"} disabled={!edited} onClick={() => saveStock(p)}><Save className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}
    </div>
  );
}