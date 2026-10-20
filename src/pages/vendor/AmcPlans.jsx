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
import { ShieldPlus, Plus, Pencil, Trash2, CalendarDays, Repeat } from "lucide-react";

export default function AmcPlans() {
  const { toast } = useToast();
  const plans = useList("AMCPlan", {}, "-created_date", 200);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", plan_type: "standard", duration_months: 12, price: 0, mrp: 0, coverage: "", features: "", terms: "", visit_count: 4, status: "active" });

  const openCreate = () => { setEditId(null); setForm({ name: "", description: "", plan_type: "standard", duration_months: 12, price: 0, mrp: 0, coverage: "", features: "", terms: "", visit_count: 4, status: "active" }); setOpen(true); };
  const openEdit = (p) => { setEditId(p.id); setForm({ name: p.name, description: p.description || "", plan_type: p.plan_type, duration_months: p.duration_months, price: p.price, mrp: p.mrp || 0, coverage: (p.coverage || []).join(", "), features: (p.features || []).join(", "), terms: p.terms || "", visit_count: p.visit_count, status: p.status }); setOpen(true); };

  const save = async () => {
    if (!form.name.trim() || !form.price) { toast({ title: "Name and price are required", variant: "destructive" }); return; }
    setBusy(true);
    try {
      const user = await base44.auth.me();
      const payload = {
        ...form,
        vendor_id: user.data?.vendor_id || user.id,
        vendor_name: user.data?.vendor_name || user.full_name || "—",
        coverage: form.coverage.split(",").map((s) => s.trim()).filter(Boolean),
        features: form.features.split(",").map((s) => s.trim()).filter(Boolean),
      };
      if (editId) { await base44.entities.AMCPlan.update(editId, payload); toast({ title: "AMC plan updated" }); }
      else { await base44.entities.AMCPlan.create(payload); toast({ title: "AMC plan created" }); }
      setOpen(false); plans.reload();
    } catch (e) { toast({ title: "Save failed", description: e.message, variant: "destructive" }); }
    finally { setBusy(false); }
  };

  const remove = async (p) => { if (!window.confirm(`Delete "${p.name}"?`)) return; try { await base44.entities.AMCPlan.delete(p.id); plans.reload(); } catch (e) { toast({ title: "Delete failed", description: e.message, variant: "destructive" }); } };

  return (
    <div>
      <PageHeader title="AMC Plans" subtitle="Create Annual Maintenance Contract plans for customers." icon={ShieldPlus}
        actions={<Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4" /> New Plan</Button>} />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <KpiCard label="Total Plans" value={plans.loading ? "…" : plans.data.length} icon={ShieldPlus} tone="green" />
        <KpiCard label="Active" value={plans.data.filter((p) => p.status === "active").length} icon={Repeat} tone="blue" />
        <KpiCard label="Avg Price" value={plans.data.length ? formatINR(plans.data.reduce((s, p) => s + (p.price || 0), 0) / plans.data.length) : "—"} icon={CalendarDays} tone="amber" />
      </div>

      {plans.loading ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-200/60" />)}</div>
      ) : plans.data.length === 0 ? (
        <SectionCard><EmptyState icon={ShieldPlus} title="No AMC plans yet" description="Create your first maintenance contract plan." action={<Button onClick={openCreate} className="bg-emerald-600"><Plus className="h-4 w-4" /> New Plan</Button>} /></SectionCard>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {plans.data.map((p) => (
            <SectionCard key={p.id}>
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2"><p className="text-sm font-semibold text-slate-900">{p.name}</p><span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-violet-600">{p.plan_type}</span></div>
                    <p className="text-xs text-slate-500">{p.duration_months} months · {p.visit_count} visits</p>
                    <div className="mt-2 flex items-center gap-2"><span className="text-lg font-bold text-slate-900">{formatINR(p.price)}</span>{p.mrp > p.price && <span className="text-sm text-slate-400 line-through">{formatINR(p.mrp)}</span>}</div>
                    {p.description && <p className="mt-1 text-xs text-slate-500 line-clamp-2">{p.description}</p>}
                    {p.coverage?.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{p.coverage.slice(0, 3).map((c, i) => <span key={i} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">{c}</span>)}</div>}
                  </div>
                  <StatusBadge status={p.status} tone={statusTone(p.status)} />
                </div>
                <div className="mt-3 flex justify-end gap-2"><button onClick={() => openEdit(p)} className="text-slate-400 hover:text-blue-600"><Pencil className="h-4 w-4" /></button><button onClick={() => remove(p)} className="text-slate-300 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button></div>
              </div>
            </SectionCard>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? "Edit AMC Plan" : "New AMC Plan"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Plan Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Comprehensive Fire Safety AMC" /></div>
            <div className="grid grid-cols-2 gap-3"><div><Label>Plan Type</Label><select value={form.plan_type} onChange={(e) => setForm({ ...form, plan_type: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">{["basic", "standard", "premium", "custom"].map((t) => <option key={t}>{t}</option>)}</select></div><div><Label>Duration (months)</Label><Input type="number" value={form.duration_months} onChange={(e) => setForm({ ...form, duration_months: Number(e.target.value) })} /></div></div>
            <div className="grid grid-cols-3 gap-3"><div><Label>Price (₹)</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} /></div><div><Label>MRP (₹)</Label><Input type="number" value={form.mrp} onChange={(e) => setForm({ ...form, mrp: Number(e.target.value) })} /></div><div><Label>Visits</Label><Input type="number" value={form.visit_count} onChange={(e) => setForm({ ...form, visit_count: Number(e.target.value) })} /></div></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
            <div><Label>Coverage (comma-separated)</Label><Input value={form.coverage} onChange={(e) => setForm({ ...form, coverage: e.target.value })} placeholder="Extinguisher check, Hose test" /></div>
            <div><Label>Features (comma-separated)</Label><Input value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} placeholder="24/7 support, Free parts" /></div>
            <div><Label>Terms & Conditions</Label><Textarea value={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.value })} rows={2} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save} disabled={busy} className="bg-emerald-600 hover:bg-emerald-700">{editId ? "Update" : "Create"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}