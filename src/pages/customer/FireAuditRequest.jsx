import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useList } from "@/hooks/useList";
import { PageHeader, SectionCard, EmptyState, KpiCard } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import { Flame, FileText, Calendar, Building2 } from "lucide-react";

export default function FireAuditRequest() {
  const { toast } = useToast();
  const audits = useList("FireAuditRequest", {}, "-created_date", 100);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ site_name: "", address: "", city: "", preferred_date: "", audit_type: "fire_safety", description: "" });

  const submit = async () => {
    if (!form.site_name.trim() || !form.address.trim()) { toast({ title: "Site name and address are required", variant: "destructive" }); return; }
    setBusy(true);
    try {
      const user = await base44.auth.me();
      const reqNo = `FA-${Date.now().toString().slice(-8)}`;
      await base44.entities.FireAuditRequest.create({
        ...form,
        request_number: reqNo,
        customer_id: user.id,
        customer_name: user.full_name || user.email,
        organization_id: user.data?.organization_id || "",
        status: "open",
      });
      toast({ title: "Fire audit requested!", description: `Request ${reqNo} submitted.` });
      setForm({ site_name: "", address: "", city: "", preferred_date: "", audit_type: "fire_safety", description: "" });
      audits.reload();
    } catch (e) { toast({ title: "Request failed", description: e.message, variant: "destructive" }); }
    finally { setBusy(false); }
  };

  return (
    <div>
      <PageHeader title="Fire Audit Request" subtitle="Request a professional fire safety audit for your premises." icon={Flame} />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <KpiCard label="Total Requests" value={audits.loading ? "…" : audits.data.length} icon={FileText} tone="rose" />
        <KpiCard label="Open" value={audits.data.filter((a) => a.status === "open").length} icon={Calendar} tone="amber" />
        <KpiCard label="Completed" value={audits.data.filter((a) => a.status === "completed").length} icon={Flame} tone="green" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Request a Fire Audit">
          <div className="space-y-3 p-5">
            <div><Label>Site / Building Name</Label><Input value={form.site_name} onChange={(e) => setForm({ ...form, site_name: e.target.value })} placeholder="e.g. Patel Industries - Unit 1" /></div>
            <div><Label>Full Address</Label><Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={2} /></div>
            <div className="grid grid-cols-2 gap-3"><div><Label>City</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div><div><Label>Preferred Date</Label><Input type="date" value={form.preferred_date} onChange={(e) => setForm({ ...form, preferred_date: e.target.value })} /></div></div>
            <div><Label>Audit Type</Label><select value={form.audit_type} onChange={(e) => setForm({ ...form, audit_type: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"><option value="fire_safety">Fire Safety</option><option value="electrical_safety">Electrical Safety</option><option value="building_safety">Building Safety</option><option value="compliance">Compliance Audit</option><option value="comprehensive">Comprehensive Audit</option></select></div>
            <div><Label>Description (optional)</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Any specific concerns or areas to inspect" /></div>
            <Button onClick={submit} disabled={busy} className="w-full bg-rose-600 hover:bg-rose-700">{busy ? "Submitting…" : "Submit Request"}</Button>
          </div>
        </SectionCard>

        <SectionCard title="My Audit Requests">
          {audits.loading ? (
            <div className="space-y-3 p-5">{[0, 1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-lg bg-slate-200/60" />)}</div>
          ) : audits.data.length === 0 ? (
            <EmptyState icon={Flame} title="No requests yet" description="Your fire audit requests will appear here." />
          ) : (
            <div className="divide-y divide-slate-50">
              {audits.data.map((a) => (
                <div key={a.id} className="px-5 py-3">
                  <div className="flex items-center justify-between"><p className="text-sm font-medium text-slate-800">{a.request_number}</p><StatusBadge status={a.status} tone={statusTone(a.status)} /></div>
                  <p className="mt-0.5 text-xs text-slate-500"><Building2 className="mr-1 inline h-3 w-3" />{a.site_name} · {a.city}</p>
                  <p className="text-xs text-slate-400 capitalize">{a.audit_type?.replace("_", " ")} · Pref: {a.preferred_date || "—"}</p>
                  {a.assigned_vendor_name && <p className="mt-0.5 text-xs text-blue-600">Assigned: {a.assigned_vendor_name}</p>}
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}