import React, { useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useList, formatINR } from "@/hooks/useList";
import { PageHeader, SectionCard, EmptyState } from "@/components/ui-bits";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ReceiptText, Check, X, RotateCcw, Eye, IndianRupee } from "lucide-react";

export default function Quotations() {
  const quotes = useList("Quotation", {}, "-created_date", 200);
  const rfqs = useList("RFQ", {}, "-created_date", 100);
  const { toast } = useToast();
  const [tab, setTab] = useState("pending");
  const [detail, setDetail] = useState(null);
  const [busy, setBusy] = useState(null);

  const rfqById = useMemo(() => Object.fromEntries(rfqs.data.map((r) => [r.id, r])), [rfqs.data]);

  const filtered = useMemo(() => {
    const all = quotes.data;
    if (tab === "pending") return all.filter((q) => ["submitted", "revised"].includes(q.status));
    if (tab === "accepted") return all.filter((q) => q.status === "accepted");
    if (tab === "rejected") return all.filter((q) => q.status === "rejected");
    return all;
  }, [quotes.data, tab]);

  const act = async (q, status) => {
    setBusy(q.id);
    try {
      await base44.entities.Quotation.update(q.id, { status });
      if (status === "accepted") {
        const rfq = rfqById[q.rfq_id];
        if (rfq) {
          await base44.entities.RFQ.update(rfq.id, {
            status: "awarded",
            awarded_vendor_id: q.vendor_id,
            po_number: "PO-" + Date.now().toString().slice(-8),
          });
          await base44.entities.Quotation.updateMany(
            { rfq_id: q.rfq_id, status: "submitted" },
            { $set: { status: "rejected" } }
          );
        }
        toast({ title: "Quotation accepted", description: `${q.vendor_name} awarded — PO generated.` });
      } else if (status === "revised") {
        toast({ title: "Revision requested", description: `${q.vendor_name} has been notified.` });
      } else {
        toast({ title: "Quotation rejected" });
      }
      quotes.reload();
    } catch (e) {
      toast({ title: "Action failed", description: e.message, variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <PageHeader title="My Quotations" subtitle="Vendor quotations on your RFQs — compare, accept or request revisions." icon={ReceiptText} />

      <Tabs value={tab} onValueChange={setTab} className="mb-5">
        <TabsList>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="accepted">Accepted</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <SectionCard>
          <EmptyState
            icon={ReceiptText}
            title="No quotations here yet"
            description="Quotations submitted by vendors on your RFQs will appear in this section."
          />
        </SectionCard>
      ) : (
        <div className="space-y-3">
          {filtered.map((q) => {
            const rfq = rfqById[q.rfq_id];
            const pending = ["submitted", "revised"].includes(q.status);
            return (
              <div key={q.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                    <IndianRupee className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">{q.vendor_name}</p>
                    <p className="text-xs text-slate-500">
                      {rfq ? `${rfq.rfq_number} · ${rfq.title}` : `RFQ ${q.rfq_number || ""}`} ·{" "}
                      {(q.line_items || []).length} item(s) · Delivery {q.delivery_days || "—"} days · Valid {q.validity_days || 30} days
                    </p>
                  </div>
                  <StatusBadge status={q.status} tone={statusTone(q.status)} />
                </div>

                <div className="mt-3 flex flex-wrap items-end justify-between gap-3 border-t border-slate-50 pt-3">
                  <div className="flex gap-6 text-xs">
                    <div><p className="text-slate-400">Subtotal</p><p className="font-semibold text-slate-700">{formatINR(q.subtotal)}</p></div>
                    <div><p className="text-slate-400">Tax (GST)</p><p className="font-semibold text-slate-700">{formatINR(q.tax)}</p></div>
                    <div><p className="text-slate-400">Total</p><p className="text-base font-bold text-slate-900">{formatINR(q.total)}</p></div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setDetail(q)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <Eye className="h-3.5 w-3.5" /> Details
                    </button>
                    {pending && (
                      <>
                        <button
                          onClick={() => act(q, "revised")}
                          disabled={busy === q.id}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                          <RotateCcw className="h-3.5 w-3.5" /> Request Revision
                        </button>
                        <button
                          onClick={() => act(q, "rejected")}
                          disabled={busy === q.id}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                          <X className="h-3.5 w-3.5" /> Reject
                        </button>
                        <button
                          onClick={() => act(q, "accepted")}
                          disabled={busy === q.id}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-50"
                        >
                          <Check className="h-3.5 w-3.5" /> Accept
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!detail} onOpenChange={(o) => { if (!o) setDetail(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Quotation — {detail?.vendor_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-2.5">Item</th>
                    <th className="px-4 py-2.5">Spec</th>
                    <th className="px-4 py-2.5 text-right">Qty</th>
                    <th className="px-4 py-2.5 text-right">Unit Price</th>
                    <th className="px-4 py-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(detail?.line_items || []).map((it, i) => (
                    <tr key={i}>
                      <td className="px-4 py-2.5 font-medium text-slate-800">{it.name}</td>
                      <td className="px-4 py-2.5 text-xs text-slate-500">{it.specification || "—"}</td>
                      <td className="px-4 py-2.5 text-right text-slate-700">{it.qty}</td>
                      <td className="px-4 py-2.5 text-right text-slate-700">{formatINR(it.unit_price)}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-slate-900">{formatINR(it.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {detail?.notes && (
              <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <span className="font-semibold text-slate-700">Vendor notes: </span>{detail.notes}
              </div>
            )}
            <div className="flex items-center justify-end gap-6 rounded-xl bg-slate-50 px-4 py-3 text-sm">
              <span className="text-slate-500">Subtotal <span className="font-semibold text-slate-700">{formatINR(detail?.subtotal)}</span></span>
              <span className="text-slate-500">Tax <span className="font-semibold text-slate-700">{formatINR(detail?.tax)}</span></span>
              <span className="font-bold text-slate-900">{formatINR(detail?.total)}</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}