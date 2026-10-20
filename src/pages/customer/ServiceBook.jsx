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
import { Image as Img } from "@/components/ui/image";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import { Wrench, Search, Calendar, Star, MapPin, Clock } from "lucide-react";

export default function ServiceBook() {
  const { toast } = useToast();
  const services = useList("Service", { approval_status: "approved" }, "-created_date", 200);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ scheduled_date: "", address: "", notes: "" });

  const filtered = services.data.filter((s) =>
    !q || (s.name || "").toLowerCase().includes(q.toLowerCase()) || (s.category || "").toLowerCase().includes(q.toLowerCase()) || (s.vendor_name || "").toLowerCase().includes(q.toLowerCase())
  );

  const book = async () => {
    if (!form.scheduled_date) { toast({ title: "Select a preferred date", variant: "destructive" }); return; }
    setBusy(true);
    try {
      const user = await base44.auth.me();
      const reqNo = `SRV-${Date.now().toString().slice(-8)}`;
      await base44.entities.ServiceRequest.create({
        request_number: reqNo,
        customer_id: user.id,
        customer_name: user.full_name || user.email,
        organization_id: user.data?.organization_id || "",
        service_type: selected.name,
        description: `Service: ${selected.name}\nVendor: ${selected.vendor_name}\nDate: ${form.scheduled_date}\nAddress: ${form.address}\nNotes: ${form.notes}`,
        scheduled_date: form.scheduled_date,
        vendor_id: selected.vendor_id,
        status: "open",
        priority: "medium",
        site_name: form.address || "",
      });
      toast({ title: "Service booked!", description: `Request ${reqNo} created.` });
      setOpen(false); setForm({ scheduled_date: "", address: "", notes: "" });
    } catch (e) { toast({ title: "Booking failed", description: e.message, variant: "destructive" }); }
    finally { setBusy(false); }
  };

  const openBook = (s) => { setSelected(s); setForm({ scheduled_date: "", address: "", notes: "" }); setOpen(true); };

  return (
    <div>
      <PageHeader title="Book a Service" subtitle="Browse and book fire safety services from verified vendors." icon={Wrench} />
      <div className="mb-6">
        <div className="relative max-w-md"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search services, vendors…" className="pl-9" /></div>
      </div>

      {services.loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2, 3].map((i) => <div key={i} className="h-56 animate-pulse rounded-2xl bg-slate-200/60" />)}</div>
      ) : filtered.length === 0 ? (
        <SectionCard><EmptyState icon={Wrench} title="No services found" description="Try a different search term." /></SectionCard>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <SectionCard key={s.id}>
              <div className="p-5">
                <div className="mb-3 h-32 overflow-hidden rounded-lg bg-slate-100">{s.image_url && <Img src={s.image_url} className="h-full w-full" />}</div>
                <p className="text-sm font-semibold text-slate-900">{s.name}</p>
                <p className="text-xs text-slate-500">{s.vendor_name}</p>
                <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{s.service_location || "—"}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{s.duration_hours}h</span>
                </div>
                <div className="mt-3 flex items-end justify-between">
                  <div><span className="text-lg font-bold text-slate-900">{formatINR(s.price)}</span>{s.mrp > s.price && <span className="ml-1 text-xs text-slate-400 line-through">{formatINR(s.mrp)}</span>}</div>
                  {s.rating > 0 && <span className="flex items-center gap-1 text-xs text-slate-500"><Star className="h-3 w-3 fill-amber-400 text-amber-400" />{s.rating}</span>}
                </div>
                <Button onClick={() => openBook(s)} className="mt-3 w-full bg-rose-600 hover:bg-rose-700">Book Now</Button>
              </div>
            </SectionCard>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Book Service</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-3">
              <div className="rounded-lg bg-slate-50 p-3"><p className="text-sm font-semibold text-slate-900">{selected.name}</p><p className="text-xs text-slate-500">{selected.vendor_name} · {formatINR(selected.price)}</p></div>
              <div><Label>Preferred Date</Label><Input type="date" value={form.scheduled_date} onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })} /></div>
              <div><Label>Service Address</Label><Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={2} placeholder="Full address where service is needed" /></div>
              <div><Label>Notes (optional)</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Any specific requirements" /></div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={book} disabled={busy} className="bg-rose-600 hover:bg-rose-700">{busy ? "Booking…" : "Confirm Booking"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}