import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useList, formatINR } from "@/hooks/useList";
import { PageHeader, SectionCard, EmptyState, KpiCard } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { ShieldPlus, Calendar, Check, Repeat, Star } from "lucide-react";

export default function AmcSubscribe() {
  const { toast } = useToast();
  const plans = useList("AMCPlan", { status: "active" }, "-created_date", 200);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState(null);

  const subscribe = async () => {
    setBusy(true);
    try {
      const user = await base44.auth.me();
      const reqNo = `AMC-${Date.now().toString().slice(-8)}`;
      await base44.entities.ServiceRequest.create({
        request_number: reqNo,
        customer_id: user.id,
        customer_name: user.full_name || user.email,
        organization_id: user.data?.organization_id || "",
        service_type: `AMC: ${selected.name}`,
        description: `AMC Plan: ${selected.name}\nVendor: ${selected.vendor_name}\nDuration: ${selected.duration_months} months\nVisits: ${selected.visit_count}\nPrice: ${formatINR(selected.price)}`,
        vendor_id: selected.vendor_id,
        status: "open",
        priority: "medium",
      });
      toast({ title: "AMC subscribed!", description: `Request ${reqNo} created. Vendor will confirm.` });
      setOpen(false);
    } catch (e) { toast({ title: "Subscription failed", description: e.message, variant: "destructive" }); }
    finally { setBusy(false); }
  };

  const planTypes = { basic: { color: "bg-blue-50 text-blue-600", label: "Basic" }, standard: { color: "bg-violet-50 text-violet-600", label: "Standard" }, premium: { color: "bg-amber-50 text-amber-600", label: "Premium" }, custom: { color: "bg-rose-50 text-rose-600", label: "Custom" } };

  return (
    <div>
      <PageHeader title="AMC Plans" subtitle="Subscribe to Annual Maintenance Contracts from verified vendors." icon={ShieldPlus} />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <KpiCard label="Available Plans" value={plans.loading ? "…" : plans.data.length} icon={ShieldPlus} tone="rose" />
        <KpiCard label="Vendors" value={new Set(plans.data.map((p) => p.vendor_id)).size} icon={Repeat} tone="green" />
        <KpiCard label="Avg Price" value={plans.data.length ? formatINR(plans.data.reduce((s, p) => s + (p.price || 0), 0) / plans.data.length) : "—"} icon={Calendar} tone="amber" />
      </div>

      {plans.loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className="h-64 animate-pulse rounded-2xl bg-slate-200/60" />)}</div>
      ) : plans.data.length === 0 ? (
        <SectionCard><EmptyState icon={ShieldPlus} title="No AMC plans available" description="Vendors haven't posted any plans yet." /></SectionCard>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.data.map((p) => {
            const pt = planTypes[p.plan_type] || planTypes.standard;
            return (
              <SectionCard key={p.id}>
                <div className="p-5">
                  <div className="mb-3 flex items-center justify-between"><span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase ${pt.color}`}>{pt.label}</span>{p.featured && <Star className="h-4 w-4 fill-amber-400 text-amber-400" />}</div>
                  <p className="text-sm font-semibold text-slate-900">{p.name}</p>
                  <p className="text-xs text-slate-500">{p.vendor_name}</p>
                  <div className="mt-3 flex items-end gap-2"><span className="text-2xl font-bold text-slate-900">{formatINR(p.price)}</span>{p.mrp > p.price && <span className="text-sm text-slate-400 line-through">{formatINR(p.mrp)}</span>}<span className="text-xs text-slate-500">/{p.duration_months}mo</span></div>
                  {p.description && <p className="mt-2 text-xs text-slate-500 line-clamp-2">{p.description}</p>}
                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-slate-600"><Check className="h-3.5 w-3.5 text-emerald-500" />{p.visit_count} service visits</div>
                    {p.coverage?.slice(0, 3).map((c, i) => <div key={i} className="flex items-center gap-2 text-xs text-slate-600"><Check className="h-3.5 w-3.5 text-emerald-500" />{c}</div>)}
                    {p.features?.slice(0, 2).map((f, i) => <div key={i} className="flex items-center gap-2 text-xs text-slate-600"><Check className="h-3.5 w-3.5 text-emerald-500" />{f}</div>)}
                  </div>
                  <Button onClick={() => { setSelected(p); setOpen(true); }} className="mt-4 w-full bg-rose-600 hover:bg-rose-700">Subscribe</Button>
                </div>
              </SectionCard>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Subscribe to AMC</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-2 text-sm">
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="font-semibold text-slate-900">{selected.name}</p>
                <p className="text-xs text-slate-500">{selected.vendor_name}</p>
                <p className="mt-2 text-lg font-bold text-slate-900">{formatINR(selected.price)} <span className="text-xs font-normal text-slate-500">/ {selected.duration_months} months</span></p>
                <p className="text-xs text-slate-500">{selected.visit_count} visits included</p>
              </div>
              <p className="text-xs text-slate-500">A service request will be created and the vendor will contact you to schedule the first visit.</p>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={subscribe} disabled={busy} className="bg-rose-600 hover:bg-rose-700">{busy ? "Subscribing…" : "Confirm Subscription"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}