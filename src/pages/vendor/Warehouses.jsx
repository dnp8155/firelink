import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useList } from "@/hooks/useList";
import { useVendor, logVendorAction } from "@/lib/vendor";
import { PageHeader, SectionCard, EmptyState } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Warehouse, Plus, MapPin, Pencil, Trash2, Power } from "lucide-react";

const EMPTY = { name: "", address: "", city: "", state: "", pincode: "", contact_person: "", phone: "", operating_hours: "" };

export default function Warehouses() {
  const { vendor } = useVendor();
  const { toast } = useToast();
  const list = useList("Warehouse", {}, "-created_date", 100);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const mine = list.data.filter((w) => vendor && w.vendor_id === vendor.id);

  const openCreate = () => { setForm(EMPTY); setEditing(null); setOpen(true); };
  const openEdit = (w) => { setForm({ ...w }); setEditing(w); setOpen(true); };

  const save = async () => {
    if (!form.name || !vendor) { toast({ title: "Warehouse name is required.", variant: "destructive" }); return; }
    try {
      if (editing) {
        await base44.entities.Warehouse.update(editing.id, form);
        toast({ title: "Warehouse updated" });
      } else {
        await base44.entities.Warehouse.create({ ...form, vendor_id: vendor.id, active: true });
        await logVendorAction("Warehouse created", "Vendor Warehouses", form.name);
        toast({ title: "Warehouse added" });
      }
      setOpen(false);
      list.reload();
    } catch (e) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    }
  };

  const toggleActive = async (w) => {
    try {
      await base44.entities.Warehouse.update(w.id, { active: !w.active });
      list.reload();
    } catch (e) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    }
  };

  const remove = async (w) => {
    try {
      await base44.entities.Warehouse.delete(w.id);
      toast({ title: "Warehouse deleted" });
      list.reload();
    } catch (e) {
      toast({ title: "Delete failed", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div>
      <PageHeader title="Warehouses" icon={Warehouse} subtitle="Manage your storage locations and stock transfer points."
        actions={<Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4" /> Add Warehouse</Button>} />

      {list.loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className="h-40 animate-pulse rounded-2xl bg-slate-200/60" />)}</div>
      ) : mine.length === 0 ? (
        <SectionCard>
          <EmptyState icon={Warehouse} title="No warehouses yet"
            description="Add your warehouses to organize inventory and fulfillment locations."
            action={<Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4" /> Add Warehouse</Button>} />
        </SectionCard>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {mine.map((w) => (
            <div key={w.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Warehouse className="h-5 w-5" />
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${w.active ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
                  {w.active ? "Active" : "Inactive"}
                </span>
              </div>
              <p className="mt-3 text-sm font-bold text-slate-800">{w.name}</p>
              <p className="mt-1 flex items-start gap-1 text-xs text-slate-500">
                <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                {[w.address, w.city, w.state, w.pincode].filter(Boolean).join(", ") || "No address"}
              </p>
              {(w.contact_person || w.phone) && <p className="mt-1 text-xs text-slate-500">{w.contact_person}{w.phone ? ` · ${w.phone}` : ""}</p>}
              <div className="mt-4 flex gap-1.5">
                <Button size="sm" variant="outline" onClick={() => openEdit(w)}><Pencil className="h-3.5 w-3.5" /> Edit</Button>
                <Button size="sm" variant="ghost" onClick={() => toggleActive(w)}><Power className="h-3.5 w-3.5" /> {w.active ? "Deactivate" : "Activate"}</Button>
                <Button size="sm" variant="ghost" className="text-rose-600 hover:bg-rose-50" onClick={() => remove(w)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={(o) => !o && setOpen(false)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Warehouse" : "Add Warehouse"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label>Warehouse Name *</Label><Input value={form.name} onChange={set("name")} placeholder="e.g. Mumbai Central Store" /></div>
            <div className="col-span-2"><Label>Address</Label><Input value={form.address} onChange={set("address")} /></div>
            <div><Label>City</Label><Input value={form.city} onChange={set("city")} /></div>
            <div><Label>State</Label><Input value={form.state} onChange={set("state")} /></div>
            <div><Label>Pincode</Label><Input value={form.pincode} onChange={set("pincode")} /></div>
            <div><Label>Operating Hours</Label><Input value={form.operating_hours} onChange={set("operating_hours")} placeholder="9 AM – 6 PM" /></div>
            <div><Label>Contact Person</Label><Input value={form.contact_person} onChange={set("contact_person")} /></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={set("phone")} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} className="bg-emerald-600 hover:bg-emerald-700">{editing ? "Save Changes" : "Add Warehouse"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}