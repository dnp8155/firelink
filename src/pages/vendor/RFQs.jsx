import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useList, formatINR } from "@/hooks/useList";
import { useAuth } from "@/lib/AuthContext";
import { PageHeader, SectionCard, EmptyState } from "@/components/ui-bits";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import { FileText, Send, Eye, IndianRupee } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function VendorRFQs() {
  const { user } = useAuth();
  const { toast } = useToast();
  const rfqs = useList("RFQ", { status: "open" }, "-created_date", 100);
  const quotes = useList("Quotation", {}, "-created_date", 200);
  const [quoteFor, setQuoteFor] = useState(null);
  const [form, setForm] = useState({ total: "", delivery_days: 7, notes: "" });
  const [vendor, setVendor] = useState(null);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const vid = user.data?.vendor_id;
      if (vid) {
        try { setVendor(await base44.entities.Vendor.get(vid)); } catch {}
        return;
      }
      try {
        const list = await base44.entities.Vendor.filter({ owner_id: user.id }, "-created_date", 1);
        if (list.length) setVendor(list[0]);
      } catch {}
    })();
  }, [user]);

  const vendorId = vendor?.id;
  const vendorName = vendor?.company_name || user?.full_name || "Vendor";

  const submitQuote = async () => {
    if (!quoteFor || !form.total || !vendorId) return;
    try {
      const total = Number(form.total);
      const tax = Math.round(total * 0.18);
      await base44.entities.Quotation.create({
        rfq_id: quoteFor.id, rfq_number: quoteFor.rfq_number,
        vendor_id: vendorId, vendor_name: vendorName,
        organization_id: quoteFor.organization_id,
        line_items: [{ name: quoteFor.title, qty: 10, unit_price: Math.round(total / 10), total }],
        subtotal: total, tax, total: total + tax,
        delivery_days: Number(form.delivery_days), notes: form.notes, status: "submitted",
      });
      toast({ title: "Quotation submitted" });
      setQuoteFor(null);
      setForm({ total: "", delivery_days: 7, notes: "" });
      quotes.reload();
    } catch (e) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    }
  };

  const alreadyQuoted = (rfqId) => quotes.data.some((q) => q.rfq_id === rfqId && q.vendor_id === vendorId);

  return (
    <div>
      <PageHeader title="RFQs" subtitle="Open requests for quotation — submit your best offer." />

      {rfqs.data.length === 0 ? <SectionCard><EmptyState icon={FileText} title="No open RFQs" description="New RFQs from customers will appear here." /></SectionCard> : (
        <div className="space-y-3">
          {rfqs.data.map((r) => (
            <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><FileText className="h-5 w-5" /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900">{r.title}</p>
                  <p className="text-xs text-slate-500">{r.rfq_number} · {r.customer_name || "Customer"} · {r.category}</p>
                </div>
                {alreadyQuoted(r.id) ? <StatusBadge status="quoted" tone="blue" /> : <Button onClick={() => setQuoteFor(r)} size="sm" disabled={!vendorId} className="bg-emerald-600 hover:bg-emerald-700"><Send className="h-3.5 w-3.5" /> Quote</Button>}
              </div>
              {r.description && <p className="mt-2 text-sm text-slate-600">{r.description}</p>}
              <div className="mt-2 flex flex-wrap gap-x-4 text-xs text-slate-500">
                <span>📍 {r.delivery_location || "—"}</span>
                <span>📅 {r.expected_delivery_date || "Flexible"}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!quoteFor} onOpenChange={(o) => !o && setQuoteFor(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Submit Quotation</DialogTitle></DialogHeader>
          {quoteFor && (
            <div className="space-y-3">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-800">{quoteFor.title}</p>
                <p className="text-xs text-slate-500">{quoteFor.rfq_number} · {quoteFor.customer_name}</p>
              </div>
              <div><Label>Quoted Total (₹, ex-tax)</Label><Input type="number" value={form.total} onChange={(e) => setForm({ ...form, total: e.target.value })} /></div>
              <div><Label>Delivery Days</Label><Input type="number" value={form.delivery_days} onChange={(e) => setForm({ ...form, delivery_days: e.target.value })} /></div>
              <div><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
              {form.total && <p className="text-sm text-slate-500">Total incl. 18% GST: <span className="font-semibold text-slate-800">{formatINR(Number(form.total) * 1.18)}</span></p>}
            </div>
          )}
          <DialogFooter><Button onClick={submitQuote} className="bg-emerald-600 hover:bg-emerald-700"><IndianRupee className="h-4 w-4" /> Submit Quotation</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}