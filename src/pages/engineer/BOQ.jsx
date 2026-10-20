import React, { useMemo, useState } from "react";
import { useList, formatINR } from "@/hooks/useList";
import { PageHeader, SectionCard, EmptyState } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { ClipboardList, Plus, Trash2, Printer, Search } from "lucide-react";

export default function BOQ() {
  const { data: products } = useList("Product", { approval_status: "approved" }, "-created_date", 200);
  const { toast } = useToast();
  const [project, setProject] = useState("Fire Protection System — New Site");
  const [items, setItems] = useState([
    { name: "ABC Dry Chemical Fire Extinguisher 5kg", spec: "ISI marked, 5kg", qty: 10, unit: "nos", rate: 2450 },
    { name: "Pendent Sprinkler Head 68°C", spec: "Glass bulb, 1/2 NPT", qty: 100, unit: "nos", rate: 320 },
  ]);
  const [picker, setPicker] = useState(false);

  const subtotal = useMemo(() => items.reduce((s, i) => s + i.qty * i.rate, 0), [items]);
  const tax = Math.round(subtotal * 0.18);
  const total = subtotal + tax;

  const addProduct = (p) => {
    setItems((prev) => prev.some((i) => i.name === p.name) ? prev : [...prev, { name: p.name, spec: p.sku || "", qty: 1, unit: p.unit || "nos", rate: p.price }]);
    setPicker(false);
    toast({ title: "Added to BOQ", description: p.name });
  };

  const update = (idx, field, value) => setItems(items.map((i, x) => (x === idx ? { ...i, [field]: field === "qty" || field === "rate" ? Number(value) : value } : i)));

  return (
    <div>
      <PageHeader
        title="BOQ Generator"
        icon={ClipboardList}
        subtitle="Build a Bill of Quantities with automatic GST and totals."
        actions={<Button variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print BOQ</Button>}
      />

      <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="text-xs font-medium text-slate-500">Project / Site Name</label>
        <input value={project} onChange={(e) => setProject(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-rose-300" />
      </div>

      <SectionCard
        title="Line Items"
        actions={<Button size="sm" variant="outline" onClick={() => setPicker(true)}><Plus className="h-3.5 w-3.5" /> From Catalog</Button>}
      >
        {items.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No line items" description="Add items manually or pick from the product catalog." action={<Button onClick={() => setPicker(true)}><Plus className="h-4 w-4" /> From Catalog</Button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3 font-medium">Item</th>
                  <th className="px-3 py-3 font-medium">Qty</th>
                  <th className="px-3 py-3 font-medium">Unit</th>
                  <th className="px-3 py-3 font-medium">Rate (₹)</th>
                  <th className="px-3 py-3 text-right font-medium">Amount</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {items.map((i, idx) => (
                  <tr key={idx}>
                    <td className="px-5 py-2.5">
                      <input value={i.name} onChange={(e) => update(idx, "name", e.target.value)} className="w-full min-w-[180px] rounded-lg border border-transparent px-1 py-1 font-medium text-slate-800 outline-none hover:border-slate-200 focus:border-rose-300" />
                    </td>
                    <td className="px-3 py-2.5"><input type="number" min="0" value={i.qty} onChange={(e) => update(idx, "qty", e.target.value)} className="w-16 rounded-lg border border-slate-200 px-2 py-1 outline-none focus:border-rose-300" /></td>
                    <td className="px-3 py-2.5"><input value={i.unit} onChange={(e) => update(idx, "unit", e.target.value)} className="w-14 rounded-lg border border-slate-200 px-2 py-1 outline-none focus:border-rose-300" /></td>
                    <td className="px-3 py-2.5"><input type="number" min="0" value={i.rate} onChange={(e) => update(idx, "rate", e.target.value)} className="w-24 rounded-lg border border-slate-200 px-2 py-1 outline-none focus:border-rose-300" /></td>
                    <td className="px-3 py-2.5 text-right font-semibold text-slate-900">{formatINR(i.qty * i.rate)}</td>
                    <td className="px-3 py-2.5"><button onClick={() => setItems(items.filter((_, x) => x !== idx))} className="text-slate-400 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button></td>
                  </tr>
                ))}
                <tr>
                  <td className="px-5 py-2.5"><button onClick={() => setItems([...items, { name: "", spec: "", qty: 1, unit: "nos", rate: 0 }])} className="text-xs font-medium text-rose-600 hover:underline">+ Add blank row</button></td>
                  <td colSpan={4} />
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <SectionCard title="Summary" className="lg:col-start-3">
          <div className="space-y-3 p-5">
            <Row label="Subtotal" value={formatINR(subtotal)} />
            <Row label="GST (18%)" value={formatINR(tax)} />
            <div className="border-t border-slate-100 pt-3">
              <Row label="Grand Total" value={formatINR(total)} bold />
            </div>
            <p className="pt-1 text-[11px] text-slate-400">Rates are indicative. Final BOQ subject to site survey and approved drawings.</p>
          </div>
        </SectionCard>
      </div>

      {picker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setPicker(false)}>
          <div className="max-h-[70vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center gap-2">
              <Search className="h-4 w-4 text-slate-400" />
              <p className="text-sm font-semibold text-slate-800">Pick from Catalog</p>
            </div>
            {products.length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-400">No approved catalog items available yet.</p>
            ) : (
              <div className="divide-y divide-slate-50">
                {products.map((p) => (
                  <button key={p.id} onClick={() => addProduct(p)} className="flex w-full items-center justify-between gap-3 px-1 py-2.5 text-left hover:bg-slate-50">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{p.name}</p>
                      <p className="text-xs text-slate-500">{p.sku} · {p.category}</p>
                    </div>
                    <span className="text-sm font-bold text-slate-900">{formatINR(p.price)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const Row = ({ label, value, bold }) => (
  <div className="flex items-center justify-between">
    <span className={bold ? "text-sm font-semibold text-slate-900" : "text-sm text-slate-500"}>{label}</span>
    <span className={bold ? "text-lg font-bold text-slate-900" : "text-sm font-medium text-slate-700"}>{value}</span>
  </div>
);