import React, { useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useList, formatINR } from "@/hooks/useList";
import { logVendorAction } from "@/lib/vendor";
import { PageHeader, SectionCard, EmptyState } from "@/components/ui-bits";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ReceiptText, Clock, CalendarClock, History, FilePenLine, Loader2, ChevronDown, ChevronUp, Send } from "lucide-react";

export default function Quotations() {
  const { toast } = useToast();
  const { data: quotes, loading, reload } = useList("Quotation", {}, "-created_date", 200);
  const [filter, setFilter] = useState("all");
  const [revising, setRevising] = useState(null);
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ delivery_days: "", validity_days: "30", notes: "", revision_notes: "" });
  const [saving, setSaving] = useState(false);
  const [historyFor, setHistoryFor] = useState(null);

  const filtered = useMemo(() => quotes.filter((qq) => filter === "all" || qq.status === filter), [quotes, filter]);
  const counts = useMemo(() => {
    const m = {};
    quotes.forEach((qq) => { m[qq.status] = (m[qq.status] || 0) + 1; });
    return m;
  }, [quotes]);

  // One quotation per vendor per RFQ — revisions share the rfq_id
  const versionsOf = (qq) => quotes
    .filter((x) => x.rfq_id === qq.rfq_id && x.vendor_id === qq.vendor_id)
    .sort((a, b) => (b.version || 1) - (a.version || 1));
  const isLatest = (qq) => {
    const vs = versionsOf(qq);
    return !vs[0] || vs[0].id === qq.id;
  };

  const openRevise = (qq) => {
    setRevising(qq);
    setItems((qq.line_items || []).map((li) => ({ ...li })));
    setMeta({
      delivery_days: qq.delivery_days != null ? String(qq.delivery_days) : "",
      validity_days: String(qq.validity_days || 30),
      notes: qq.notes || "",
      revision_notes: "",
    });
  };

  const setItem = (i, patch) => setItems(items.map((li, idx) => (idx === i ? { ...li, ...patch } : li)));

  const saveRevision = async () => {
    const qq = revising;
    if (!items.length || items.some((li) => !(Number(li.qty) > 0) || !(Number(li.unit_price) >= 0))) {
      toast({ title: "Please enter a valid quantity and price for every line item.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const lineItems = items.map((li) => ({
        ...li,
        qty: Number(li.qty),
        unit_price: Number(li.unit_price),
        total: Number(li.qty) * Number(li.unit_price),
      }));
      const subtotal = lineItems.reduce((s, li) => s + li.total, 0);
      const taxRatio = qq.subtotal ? (qq.tax || 0) / qq.subtotal : 0.18;
      const tax = Math.round(subtotal * taxRatio * 100) / 100;

      await base44.entities.Quotation.update(qq.id, { status: "revised" });
      await base44.entities.Quotation.create({
        rfq_id: qq.rfq_id,
        rfq_number: qq.rfq_number,
        organization_id: qq.organization_id,
        vendor_id: qq.vendor_id,
        vendor_name: qq.vendor_name,
        line_items: lineItems,
        subtotal,
        tax,
        total: subtotal + tax,
        delivery_days: meta.delivery_days ? Number(meta.delivery_days) : qq.delivery_days,
        validity_days: Number(meta.validity_days) || 30,
        notes: meta.notes,
        revision_notes: meta.revision_notes,
        status: "submitted",
        version: (qq.version || 1) + 1,
        revision_of: qq.id,
      });
      await logVendorAction("Quotation revised", "Vendor Quotations", qq.rfq_number, `v${qq.version || 1}`, `v${(qq.version || 1) + 1}`);
      toast({ title: "Revision submitted", description: `Version ${(qq.version || 1) + 1} has been sent to the customer.` });
      setRevising(null);
      reload();
    } catch (e) {
      toast({ title: "Revision failed", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="Quotations" icon={ReceiptText} subtitle="Quotations you've submitted against RFQs — revise with full version history." />

      <div className="mb-4 flex flex-wrap gap-2">
        {["all", "submitted", "revised", "accepted", "rejected", "expired"].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`rounded-full px-3.5 py-1.5 text-xs font-medium capitalize transition ${filter === s ? "bg-slate-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"}`}>
            {s === "all" ? `All (${quotes.length})` : `${s} (${counts[s] || 0})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-100" />)}</div>
      ) : filtered.length === 0 ? (
        <SectionCard><EmptyState icon={ReceiptText} title="No quotations" description="Submit a quotation from the RFQs page to see it here." /></SectionCard>
      ) : (
        <div className="space-y-3">
          {filtered.map((qq) => {
            const version = qq.version || 1;
            const vs = versionsOf(qq);
            const latest = isLatest(qq);
            const older = vs.filter((x) => x.id !== qq.id && (x.version || 1) < version);
            return (
              <SectionCard key={qq.id}>
                <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-mono text-xs text-slate-400">RFQ {qq.rfq_number}</p>
                      <StatusBadge status={qq.status} tone={statusTone(qq.status)} />
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${latest ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>v{version}</span>
                      {version > 1 && latest && <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-600">revision</span>}
                    </div>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{qq.line_items?.length || 0} line item(s) · {formatINR(qq.total)}</p>
                    <p className="text-xs text-slate-500">
                      {qq.line_items?.[0]?.name}{(qq.line_items?.length || 0) > 1 && ` +${qq.line_items.length - 1} more`} · GST {formatINR(qq.tax)}
                    </p>
                    {qq.revision_notes && version > 1 && (
                      <p className="mt-1.5 rounded-lg bg-violet-50 px-2.5 py-1 text-[11px] text-violet-700 ring-1 ring-violet-100">Revision note: {qq.revision_notes}</p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Delivery in {qq.delivery_days || "—"} days</span>
                      <span className="flex items-center gap-1"><CalendarClock className="h-3 w-3" /> Valid {qq.validity_days || 30} days</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <p className="text-lg font-bold text-slate-900">{formatINR(qq.total)}</p>
                    <div className="flex flex-wrap justify-end gap-2">
                      {qq.status === "submitted" && latest && (
                        <Button size="sm" onClick={() => openRevise(qq)}><FilePenLine className="h-3.5 w-3.5" /> Revise</Button>
                      )}
                      {older.length > 0 && (
                        <Button size="sm" variant="ghost" onClick={() => setHistoryFor(historyFor === qq.id ? null : qq.id)}>
                          <History className="h-3.5 w-3.5" /> {older.length + 1} versions
                          {historyFor === qq.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                {historyFor === qq.id && older.length > 0 && (
                  <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-3">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Version history</p>
                    <div className="space-y-1.5">
                      {older.map((o) => (
                        <div key={o.id} className="flex items-center gap-3 rounded-lg bg-white px-3 py-2 text-xs ring-1 ring-slate-100">
                          <span className="font-bold text-slate-500">v{o.version || 1}</span>
                          <span className="min-w-0 flex-1 truncate text-slate-500">{o.revision_notes || "Original submission"}</span>
                          <span className="font-semibold text-slate-700">{formatINR(o.total)}</span>
                          <StatusBadge status={o.status} tone={statusTone(o.status)} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </SectionCard>
            );
          })}
        </div>
      )}

      <Dialog open={!!revising} onOpenChange={(o) => !o && setRevising(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Revise Quotation — v{(revising?.version || 1) + 1}</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-slate-500">
            The current version stays on record; submitting creates version {(revising?.version || 1) + 1} for the customer and marks v{revising?.version || 1} as superseded.
          </p>
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {items.map((li, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-100 p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">{li.name}</p>
                  {li.specification && <p className="truncate text-[11px] text-slate-400">{li.specification}</p>}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400">Qty</span>
                  <Input type="number" value={li.qty} onChange={(e) => setItem(i, { qty: e.target.value })} className="h-8 w-20 text-xs" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400">₹/unit</span>
                  <Input type="number" value={li.unit_price} onChange={(e) => setItem(i, { unit_price: e.target.value })} className="h-8 w-24 text-xs" />
                </div>
                <span className="w-20 text-right text-xs font-semibold text-slate-700">{formatINR(Number(li.qty) * Number(li.unit_price))}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Delivery (days)</Label>
              <Input type="number" value={meta.delivery_days} onChange={(e) => setMeta({ ...meta, delivery_days: e.target.value })} className="mt-1.5 h-9" />
            </div>
            <div>
              <Label>Validity (days)</Label>
              <Input type="number" value={meta.validity_days} onChange={(e) => setMeta({ ...meta, validity_days: e.target.value })} className="mt-1.5 h-9" />
            </div>
            <div className="col-span-2">
              <Label>Revision note (shown to customer)</Label>
              <Input value={meta.revision_notes} onChange={(e) => setMeta({ ...meta, revision_notes: e.target.value })} placeholder="e.g. Updated pricing after bulk discount" className="mt-1.5 h-9" />
            </div>
            <div className="col-span-2">
              <Label>Terms / notes</Label>
              <Textarea value={meta.notes} onChange={(e) => setMeta({ ...meta, notes: e.target.value })} rows={2} className="mt-1.5" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevising(null)}>Cancel</Button>
            <Button onClick={saveRevision} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Submit Revision
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}