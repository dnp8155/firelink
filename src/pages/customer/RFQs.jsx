import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useList, formatINR } from "@/hooks/useList";
import { useAuth } from "@/lib/AuthContext";
import { PageHeader, SectionCard, EmptyState } from "@/components/ui-bits";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import { FileText, Plus, GitCompare, Send, IndianRupee } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function RFQs() {
  const { user } = useAuth();
  const { toast } = useToast();
  const rfqs = useList("RFQ", {}, "-created_date", 100);
  const quotes = useList("Quotation", {}, "-created_date", 200);
  const [open, setOpen] = useState(false);
  const [compareRfq, setCompareRfq] = useState(null);
  const [catOptions, setCatOptions] = useState([]);
  const [form, setForm] = useState({ title: "", category: "", description: "", delivery_location: "", expected_delivery_date: "" });

  useEffect(() => {
    (async () => {
      try {
        const cats = await base44.entities.Category.filter({ type: "product", is_active: true }, "display_order", 50);
        const names = (cats || []).map((c) => c.name);
        setCatOptions(names);
        if (names.length && !form.category) setForm((f) => ({ ...f, category: names[0] }));
      } catch (e) {}
    })();
  }, []);

  const create = async () => {
    if (!form.title) return;
    try {
      const created = await base44.entities.RFQ.create({
        rfq_number: "RFQ-" + Date.now().toString().slice(-8),
        customer_id: user?.id,
        customer_name: user?.full_name || user?.email || "Customer",
        organization_id: user?.data?.organization_id || user?.organization_id || null,
        organization_name: user?.data?.organization_name || "",
        title: form.title,
        category: form.category,
        description: form.description,
        delivery_location: form.delivery_location,
        expected_delivery_date: form.expected_delivery_date,
        status: "open",
        items: [{ name: form.title, qty: 10, unit: "piece" }],
      });
      toast({ title: "RFQ created", description: "Notifying matching vendors…" });
      setOpen(false);
      setForm({ title: "", category: catOptions[0] || "", description: "", delivery_location: "", expected_delivery_date: "" });
      rfqs.reload();
      base44.functions.invoke("rfq_notify_vendors", { rfq_id: created.id }).then((res) => {
        const n = res?.data?.vendors_notified ?? 0;
        toast({ title: `${n} vendor(s) notified`, description: "They will submit quotations shortly." });
      }).catch(() => {});
    } catch (e) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    }
  };

  const rfqQuotes = (rfqId) => quotes.data.filter((q) => q.rfq_id === rfqId);

  const acceptQuote = async (q) => {
    try {
      await base44.entities.Quotation.update(q.id, { status: "accepted" });
      // competing quotations are closed out
      await Promise.all(
        rfqQuotes(compareRfq.id)
          .filter((other) => other.id !== q.id && ["submitted", "revised"].includes(other.status))
          .map((other) => base44.entities.Quotation.update(other.id, { status: "rejected" }).catch(() => {}))
      );
      await base44.entities.RFQ.update(compareRfq.id, {
        status: "awarded",
        awarded_vendor_id: q.vendor_id,
        po_number: "PO-" + Date.now().toString().slice(-6),
      });
      base44.functions.invoke("order_notification", { type: "rfq_awarded", rfq_id: compareRfq.id }).catch(() => {});
      toast({ title: "Quotation accepted", description: `${q.vendor_name} has been awarded this RFQ.` });
      setCompareRfq(null);
      rfqs.reload();
      quotes.reload();
    } catch (e) {
      toast({ title: "Accept failed", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div>
      <PageHeader title="RFQs" subtitle="Request for Quotation — compare vendor offers." actions={
        <Button onClick={() => setOpen(true)} className="bg-rose-600 hover:bg-rose-700"><Plus className="h-4 w-4" /> New RFQ</Button>
      } />

      {rfqs.data.length === 0 ? <SectionCard><EmptyState icon={FileText} title="No RFQs yet" description="Create a request for quotation to receive vendor offers." action={<Button onClick={() => setOpen(true)} className="bg-rose-600"><Plus className="h-4 w-4" /> New RFQ</Button>} /></SectionCard> : (
        <div className="space-y-3">
          {rfqs.data.map((r) => {
            const rq = rfqQuotes(r.id);
            return (
              <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600"><FileText className="h-5 w-5" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">{r.title}</p>
                    <p className="text-xs text-slate-500">{r.rfq_number} · {r.category} · {r.expected_delivery_date || "Flexible"}</p>
                  </div>
                  <StatusBadge status={r.status} tone={statusTone(r.status)} />
                </div>
                {r.description && <p className="mt-2 text-sm text-slate-600">{r.description}</p>}
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-50 pt-3">
                  <span className="text-xs text-slate-500">{rq.length} quotation(s) received</span>
                  <div className="ml-auto flex gap-2">
                    <button onClick={() => setCompareRfq(r)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"><GitCompare className="h-3.5 w-3.5" /> Compare</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create RFQ</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. 50 CO₂ Fire Extinguishers" /></div>
            <div><Label>Category</Label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                {(catOptions.length ? catOptions : ["Fire Extinguisher", "Hydrant System", "Sprinkler", "Smoke Detector", "Fire Alarm Panel", "CCTV", "Safety Shoes", "Helmet", "Safety Belt", "Gas Detector", "SCBA", "PPE Kit", "Emergency Light", "Exit Signs", "First Aid", "Hose Pipe", "Valve", "Pump", "Industrial Gas Safety Equipment"]).map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div><Label>Description / Specification</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Delivery Location</Label><Input value={form.delivery_location} onChange={(e) => setForm({ ...form, delivery_location: e.target.value })} placeholder="City" /></div>
              <div><Label>Expected Delivery</Label><Input type="date" value={form.expected_delivery_date} onChange={(e) => setForm({ ...form, expected_delivery_date: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter><Button onClick={create} className="bg-rose-600 hover:bg-rose-700"><Send className="h-4 w-4" /> Submit RFQ</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!compareRfq} onOpenChange={(o) => !o && setCompareRfq(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Compare Quotations — {compareRfq?.title}</DialogTitle></DialogHeader>
          {(() => {
            const rq = compareRfq ? quotes.data.filter((q) => q.rfq_id === compareRfq.id) : [];
            if (rq.length === 0) return <p className="py-6 text-center text-sm text-slate-500">No quotations received yet.</p>;
            const sorted = [...rq].sort((a, b) => a.total - b.total);
            return (
              <div className="space-y-2">
                {sorted.map((q, i) => (
                  <div key={q.id} className={`flex items-center gap-3 rounded-xl border p-3 ${i === 0 ? "border-emerald-300 bg-emerald-50/50" : "border-slate-200"}`}>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-violet-600 shadow-sm"><IndianRupee className="h-5 w-5" /></div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900">{q.vendor_name}</p>
                      <p className="text-xs text-slate-500">Delivery: {q.delivery_days || "—"} days · Validity: {q.validity_days || 30} days</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900">{formatINR(q.total)}</p>
                      {i === 0 && <span className="text-[10px] font-semibold text-emerald-600">Lowest</span>}
                    </div>
                    <button onClick={() => acceptQuote(q)} className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-700">Accept</button>
                  </div>
                ))}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}