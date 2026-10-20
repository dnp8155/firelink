import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useList, formatINR } from "@/hooks/useList";
import { useVendor, logVendorAction } from "@/lib/vendor";
import { PageHeader, SectionCard, EmptyState, KpiCard } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import { Image as Img } from "@/components/ui/image";
import { Wrench, Plus, Pencil, Trash2, Clock, Star } from "lucide-react";

const EMPTY = { name: "", category: "", service_type: "", description: "", price: 0, mrp: 0, duration_hours: 1, image_url: "", service_location: "" };

export default function VendorServices() {
  const { vendor } = useVendor();
  const { toast } = useToast();
  const services = useList("Service", { vendor_id: vendor?.id || "__no_vendor__" }, "-created_date", 200);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const openCreate = () => { setEditId(null); setForm(EMPTY); setOpen(true); };
  const openEdit = (s) => {
    setEditId(s.id);
    setForm({
      name: s.name || "", category: s.category || "", service_type: s.service_type || "",
      description: s.description || "", price: s.price || 0, mrp: s.mrp || 0,
      duration_hours: s.duration_hours || 1, image_url: s.image_url || "", service_location: s.service_location || "",
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.name.trim() || !form.category.trim() || !form.price) {
      toast({ title: "Name, category and price are required", variant: "destructive" });
      return;
    }
    if (!vendor) { toast({ title: "No vendor profile linked to your account.", variant: "destructive" }); return; }
    setBusy(true);
    try {
      const payload = { ...form, vendor_id: vendor.id, vendor_name: vendor.company_name, approval_status: "pending" };
      if (editId) {
        await base44.entities.Service.update(editId, payload);
        toast({ title: "Service updated" });
      } else {
        await base44.entities.Service.create(payload);
        await logVendorAction("Service added", "Vendor Services", form.name);
        toast({ title: "Service created", description: "Pending admin approval." });
      }
      setOpen(false);
      services.reload();
    } catch (e) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (s) => {
    if (!window.confirm(`Delete "${s.name}"?`)) return;
    try {
      await base44.entities.Service.delete(s.id);
      toast({ title: "Service removed" });
      services.reload();
    } catch (e) {
      toast({ title: "Delete failed", description: e.message, variant: "destructive" });
    }
  };

  const rows = services.data;

  return (
    <div>
      <PageHeader title="Service Catalog" subtitle="Upload and manage your fire safety services." icon={Wrench}
        actions={<Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4" /> New Service</Button>} />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Total Services" value={services.loading ? "…" : rows.length} icon={Wrench} tone="green" />
        <KpiCard label="Approved" value={rows.filter((s) => s.approval_status === "approved").length} icon={Wrench} tone="blue" />
        <KpiCard label="Pending" value={rows.filter((s) => s.approval_status === "pending").length} icon={Clock} tone="amber" />
        <KpiCard label="Avg Rating" value={rows.length ? (rows.reduce((sum, x) => sum + (x.rating || 0), 0) / rows.length).toFixed(1) : "—"} icon={Star} tone="rose" />
      </div>

      {services.loading ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-200/60" />)}</div>
      ) : rows.length === 0 ? (
        <SectionCard>
          <EmptyState icon={Wrench} title="No services yet" description="Upload your first fire safety service."
            action={<Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4" /> New Service</Button>} />
        </SectionCard>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((s) => (
            <SectionCard key={s.id}>
              <div className="p-5">
                <div className="flex gap-3">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                    {s.image_url && <Img src={s.image_url} className="h-full w-full" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">{s.name}</p>
                    <p className="text-xs text-slate-500">{s.category} · {s.service_type || "Service"}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{formatINR(s.price)}</span>
                      {s.mrp > s.price && <span className="text-xs text-slate-400 line-through">{formatINR(s.mrp)}</span>}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <StatusBadge status={s.approval_status} tone={statusTone(s.approval_status)} />
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(s)} className="text-slate-400 hover:text-blue-600" title="Edit"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => remove(s)} className="text-slate-300 hover:text-rose-600" title="Delete"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              </div>
            </SectionCard>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? "Edit Service" : "New Service"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Service Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Fire Extinguisher Refilling" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Category</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Maintenance" /></div>
              <div><Label>Service Type</Label><Input value={form.service_type} onChange={(e) => setForm({ ...form, service_type: e.target.value })} placeholder="e.g. On-site" /></div>
            </div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Price (₹)</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} /></div>
              <div><Label>MRP (₹)</Label><Input type="number" value={form.mrp} onChange={(e) => setForm({ ...form, mrp: Number(e.target.value) })} /></div>
              <div><Label>Duration (hrs)</Label><Input type="number" value={form.duration_hours} onChange={(e) => setForm({ ...form, duration_hours: Number(e.target.value) })} /></div>
            </div>
            <div><Label>Image URL</Label><Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://…" /></div>
            <div><Label>Service Location</Label><Input value={form.service_location} onChange={(e) => setForm({ ...form, service_location: e.target.value })} placeholder="e.g. Mumbai, Pune" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={busy} className="bg-emerald-600 hover:bg-emerald-700">{editId ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}