import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useList, formatINR } from "@/hooks/useList";
import { PageHeader, SectionCard, EmptyState, KpiCard } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import { Tag, Plus, Pencil, Trash2, Percent, IndianRupee, Calendar } from "lucide-react";

export default function Offers() {
  const { toast } = useToast();
  const offers = useList("Offer", {}, "-created_date", 200);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ title: "", code: "", description: "", discount_type: "percentage", discount_value: 10, max_discount: 0, min_order_value: 0, start_date: "", end_date: "", usage_limit: 0, status: "active" });

  const openCreate = () => { setEditId(null); setForm({ title: "", code: "", description: "", discount_type: "percentage", discount_value: 10, max_discount: 0, min_order_value: 0, start_date: "", end_date: "", usage_limit: 0, status: "active" }); setOpen(true); };
  const openEdit = (o) => { setEditId(o.id); setForm({ title: o.title, code: o.code || "", description: o.description || "", discount_type: o.discount_type, discount_value: o.discount_value, max_discount: o.max_discount || 0, min_order_value: o.min_order_value || 0, start_date: o.start_date || "", end_date: o.end_date || "", usage_limit: o.usage_limit || 0, status: o.status }); setOpen(true); };

  const save = async () => {
    if (!form.title.trim() || !form.discount_value) { toast({ title: "Title and discount value are required", variant: "destructive" }); return; }
    setBusy(true);
    try {
      const user = await base44.auth.me();
      const code = form.code.trim().toUpperCase().replace(/\s/g, "_") || form.title.trim().toUpperCase().replace(/\s/g, "_").slice(0, 15);
      const payload = { ...form, code, vendor_id: user.data?.vendor_id || user.id, vendor_name: user.data?.vendor_name || user.full_name || "—" };
      if (editId) { await base44.entities.Offer.update(editId, payload); toast({ title: "Offer updated" }); }
      else { await base44.entities.Offer.create(payload); toast({ title: "Offer created" }); }
      setOpen(false); offers.reload();
    } catch (e) { toast({ title: "Save failed", description: e.message, variant: "destructive" }); }
    finally { setBusy(false); }
  };

  const remove = async (o) => { if (!window.confirm(`Delete "${o.title}"?`)) return; try { await base44.entities.Offer.delete(o.id); offers.reload(); } catch (e) { toast({ title: "Delete failed", description: e.message, variant: "destructive" }); } };

  return (
    <div>
      <PageHeader title="Offers & Discounts" subtitle="Create promotional offers and discount codes." icon={Tag}
        actions={<Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4" /> New Offer</Button>} />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Total Offers" value={offers.loading ? "…" : offers.data.length} icon={Tag} tone="green" />
        <KpiCard label="Active" value={offers.data.filter((o) => o.status === "active").length} icon={Tag} tone="blue" />
        <KpiCard label="Total Usage" value={offers.data.reduce((s, o) => s + (o.used_count || 0), 0)} icon={Percent} tone="amber" />
        <KpiCard label="Avg Discount" value={offers.data.length ? `${(offers.data.reduce((s, o) => s + (o.discount_value || 0), 0) / offers.data.length).toFixed(1)}%` : "—"} icon={IndianRupee} tone="rose" />
      </div>

      {offers.loading ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-200/60" />)}</div>
      ) : offers.data.length === 0 ? (
        <SectionCard><EmptyState icon={Tag} title="No offers yet" description="Create your first promotional offer." action={<Button onClick={openCreate} className="bg-emerald-600"><Plus className="h-4 w-4" /> New Offer</Button>} /></SectionCard>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {offers.data.map((o) => (
            <SectionCard key={o.id}>
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">{o.title}</p>
                    <code className="rounded bg-emerald-50 px-2 py-0.5 font-mono text-xs text-emerald-600">{o.code}</code>
                    <p className="mt-1 text-sm font-medium text-slate-700">{o.discount_type === "percentage" ? `${o.discount_value}% off` : `${formatINR(o.discount_value)} off`}{o.max_discount > 0 && o.discount_type === "percentage" ? ` (max ${formatINR(o.max_discount)})` : ""}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-500"><Calendar className="h-3 w-3" />{o.start_date || "—"} → {o.end_date || "—"}</div>
                    <p className="mt-1 text-xs text-slate-400">Used {o.used_count || 0}{o.usage_limit > 0 ? ` / ${o.usage_limit}` : ""} times</p>
                  </div>
                  <StatusBadge status={o.status} tone={statusTone(o.status)} />
                </div>
                <div className="mt-3 flex justify-end gap-2"><button onClick={() => openEdit(o)} className="text-slate-400 hover:text-blue-600"><Pencil className="h-4 w-4" /></button><button onClick={() => remove(o)} className="text-slate-300 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button></div>
              </div>
            </SectionCard>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? "Edit Offer" : "New Offer"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Diwali Fire Safety Sale" /></div>
            <div><Label>Code (optional)</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="auto-generated if blank" className="font-mono text-sm" /></div>
            <div className="grid grid-cols-2 gap-3"><div><Label>Discount Type</Label><select value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"><option value="percentage">Percentage</option><option value="flat">Flat Amount</option></select></div><div><Label>Discount Value</Label><Input type="number" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: Number(e.target.value) })} /></div></div>
            <div className="grid grid-cols-2 gap-3"><div><Label>Max Discount (₹)</Label><Input type="number" value={form.max_discount} onChange={(e) => setForm({ ...form, max_discount: Number(e.target.value) })} /></div><div><Label>Min Order (₹)</Label><Input type="number" value={form.min_order_value} onChange={(e) => setForm({ ...form, min_order_value: Number(e.target.value) })} /></div></div>
            <div className="grid grid-cols-2 gap-3"><div><Label>Start Date</Label><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div><div><Label>End Date</Label><Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div></div>
            <div><Label>Usage Limit (0 = unlimited)</Label><Input type="number" value={form.usage_limit} onChange={(e) => setForm({ ...form, usage_limit: Number(e.target.value) })} /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save} disabled={busy} className="bg-emerald-600 hover:bg-emerald-700">{editId ? "Update" : "Create"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}