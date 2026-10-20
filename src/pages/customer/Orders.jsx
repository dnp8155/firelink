import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useList, formatINR } from "@/hooks/useList";
import { PageHeader, SectionCard, EmptyState } from "@/components/ui-bits";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import { Image } from "@/components/ui/image";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { downloadInvoice } from "@/lib/invoice";
import { Package, Download, Eye, RotateCcw, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Orders() {
  const orders = useList("Order", {}, "-created_date", 200);
  const { toast } = useToast();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [returning, setReturning] = useState(null);
  const [reason, setReason] = useState("");

  const filtered = orders.data.filter((o) => {
    const matchQ = !q || (o.order_number + (o.customer_name || "") + (o.vendor_name || "")).toLowerCase().includes(q.toLowerCase());
    const matchF = filter === "all" || o.status === filter;
    return matchQ && matchF;
  });

  const statuses = ["all", "pending", "accepted", "dispatched", "delivered", "returned", "cancelled"];

  const submitReturn = async () => {
    if (!reason.trim()) {
      toast({ title: "Please describe the reason for your return.", variant: "destructive" });
      return;
    }
    try {
      await base44.entities.Order.update(returning.id, { status: "returned", return_reason: reason });
      toast({ title: "Return requested", description: "The vendor will review your return request." });
      setReturning(null);
      setReason("");
      orders.reload();
    } catch (e) {
      toast({ title: "Return request failed", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div>
      <PageHeader title="My Orders" subtitle="Track your purchases, download invoices and raise returns." />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search orders…" className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-rose-300" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {statuses.map((s) => (
            <button key={s} onClick={() => setFilter(s)} className={cn("rounded-full px-3 py-1.5 text-xs font-medium capitalize", filter === s ? "bg-rose-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50")}>{s}</button>
          ))}
        </div>
      </div>

      {orders.loading ? <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100" />)}</div>
        : filtered.length === 0 ? <SectionCard><EmptyState icon={Package} title="No orders found" description="Orders you place on the marketplace will appear here." /></SectionCard>
        : (
          <div className="space-y-3">
            {filtered.map((o) => (
              <div key={o.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600"><Package className="h-5 w-5" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">{o.order_number}</p>
                    <p className="text-xs text-slate-500">{o.vendor_name || "Vendor"} · {o.created_date ? new Date(o.created_date).toLocaleDateString() : "—"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">{formatINR(o.total)}</p>
                    <StatusBadge status={o.status} tone={statusTone(o.status)} />
                  </div>
                </div>
                {o.items && o.items.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-50 pt-3">
                    {o.items.slice(0, 4).map((it, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-1.5">
                        {it.image_url && <Image src={it.image_url} className="h-6 w-6 rounded" />}
                        <span className="text-xs text-slate-600">{it.name} × {it.qty}</span>
                      </div>
                    ))}
                  </div>
                )}
                {o.return_reason && <p className="mt-2 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs text-amber-700">Return reason: {o.return_reason}</p>}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link to={`/customer/orders/${o.id}`} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                    <Eye className="h-3.5 w-3.5" /> View
                  </Link>
                  <button onClick={() => downloadInvoice(o)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                    <Download className="h-3.5 w-3.5" /> Invoice
                  </button>
                  {o.status === "delivered" && (
                    <button onClick={() => { setReturning(o); setReason(""); }} className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100">
                      <RotateCcw className="h-3.5 w-3.5" /> Return
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      <Dialog open={!!returning} onOpenChange={(op) => !op && setReturning(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Request Return</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-600">Tell us why you want to return order <span className="font-semibold text-slate-900">{returning?.order_number}</span>. The vendor will review your request.</p>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="e.g. Wrong model delivered, packaging damaged…" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReturning(null)}>Cancel</Button>
            <Button onClick={submitReturn}>Submit Return Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}