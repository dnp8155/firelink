import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useList } from "@/hooks/useList";
import { useVendor, logVendorAction } from "@/lib/vendor";
import { PageHeader, SectionCard, EmptyState } from "@/components/ui-bits";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { HardHat, Plus, Pencil, Trash2, Power, BadgeCheck } from "lucide-react";

const EMPTY = { name: "", email: "", phone: "", city: "", skills: "", certifications: "" };

export default function Technicians() {
  const { vendor } = useVendor();
  const { toast } = useToast();
  const list = useList("Technician", {}, "-created_date", 200);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const mine = list.data.filter((t) => vendor && t.vendor_id === vendor.id);

  const openCreate = () => { setForm(EMPTY); setEditing(null); setOpen(true); };
  const openEdit = (t) => {
    setEditing(t);
    setForm({
      name: t.name || "", email: t.email || "", phone: t.phone || "", city: t.city || "",
      skills: (t.skills || []).join(", "), certifications: (t.certifications || []).join(", "),
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.name) { toast({ title: "Technician name is required.", variant: "destructive" }); return; }
    if (!vendor) { toast({ title: "No vendor profile linked to your account.", variant: "destructive" }); return; }
    try {
      const payload = {
        name: form.name, email: form.email || "", phone: form.phone || "", city: form.city || "",
        skills: form.skills ? form.skills.split(",").map((s) => s.trim()).filter(Boolean) : [],
        certifications: form.certifications ? form.certifications.split(",").map((s) => s.trim()).filter(Boolean) : [],
        vendor_id: vendor.id, vendor_name: vendor.company_name,
      };
      if (editing) {
        await base44.entities.Technician.update(editing.id, payload);
        toast({ title: "Technician updated" });
      } else {
        await base44.entities.Technician.create({ ...payload, status: "active", jobs_completed: 0 });
        await logVendorAction("Technician added", "Vendor Technicians", form.name);
        toast({ title: "Technician added" });
      }
      setOpen(false);
      list.reload();
    } catch (e) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    }
  };

  const toggleStatus = async (t) => {
    try {
      await base44.entities.Technician.update(t.id, { status: t.status === "active" ? "inactive" : "active" });
      list.reload();
    } catch (e) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    }
  };

  const remove = async (t) => {
    try {
      await base44.entities.Technician.delete(t.id);
      toast({ title: "Technician removed" });
      list.reload();
    } catch (e) {
      toast({ title: "Delete failed", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div>
      <PageHeader title="Technicians" icon={HardHat} subtitle="Your field service team — assign them to customer service requests."
        actions={<Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4" /> Add Technician</Button>} />

      {list.loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className="h-36 animate-pulse rounded-2xl bg-slate-200/60" />)}</div>
      ) : mine.length === 0 ? (
        <SectionCard>
          <EmptyState icon={HardHat} title="No technicians yet"
            description="Add your field technicians, their skills and certifications — then assign them to service requests."
            action={<Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4" /> Add Technician</Button>} />
        </SectionCard>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {mine.map((t) => (
            <div key={t.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <HardHat className="h-5 w-5" />
                </div>
                <StatusBadge status={t.status || "active"} tone={t.status === "inactive" ? "gray" : "green"} />
              </div>
              <p className="mt-3 text-sm font-bold text-slate-800">{t.name}</p>
              <p className="text-xs text-slate-500">{t.phone || "—"}{t.city ? ` · ${t.city}` : ""}</p>
              {t.email && <p className="text-xs text-slate-400">{t.email}</p>}
              {(t.skills || []).length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {t.skills.slice(0, 3).map((s) => (
                    <span key={s} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">{s}</span>
                  ))}
                </div>
              )}
              {(t.certifications || []).length > 0 && (
                <p className="mt-2 flex items-center gap-1 text-[11px] text-emerald-600">
                  <BadgeCheck className="h-3.5 w-3.5" /> {(t.certifications || []).join(", ")}
                </p>
              )}
              <p className="mt-2 text-[11px] text-slate-400">{t.jobs_completed || 0} job(s) completed</p>
              <div className="mt-3 flex gap-1.5">
                <Button size="sm" variant="outline" onClick={() => openEdit(t)}><Pencil className="h-3.5 w-3.5" /> Edit</Button>
                <Button size="sm" variant="ghost" onClick={() => toggleStatus(t)}><Power className="h-3.5 w-3.5" /> {t.status === "active" ? "Deactivate" : "Activate"}</Button>
                <Button size="sm" variant="ghost" className="text-rose-600 hover:bg-rose-50" onClick={() => remove(t)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={(o) => !o && setOpen(false)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Technician" : "Add Technician"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label>Full Name *</Label><Input value={form.name} onChange={set("name")} placeholder="e.g. Ramesh Kumar" /></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={set("phone")} /></div>
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={set("email")} /></div>
            <div className="col-span-2"><Label>City / Base Location</Label><Input value={form.city} onChange={set("city")} /></div>
            <div className="col-span-2"><Label>Skills (comma separated)</Label><Input value={form.skills} onChange={set("skills")} placeholder="Fire extinguisher servicing, Fire alarm, Sprinkler systems" /></div>
            <div className="col-span-2"><Label>Certifications (comma separated)</Label><Input value={form.certifications} onChange={set("certifications")} placeholder="NSC Fire Safety, Manufacturer certified" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} className="bg-emerald-600 hover:bg-emerald-700">{editing ? "Save Changes" : "Add Technician"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}