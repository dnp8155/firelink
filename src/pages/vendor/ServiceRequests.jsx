import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useList } from "@/hooks/useList";
import { useVendor, logVendorAction } from "@/lib/vendor";
import { PageHeader, SectionCard, EmptyState } from "@/components/ui-bits";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import SlaBadge from "@/components/sla/SlaBadge";
import { slaDueFrom, slaHours } from "@/lib/sla";
import { Input } from "@/components/ui/input";
import { Wrench, UserCheck, PlayCircle, CheckCircle2, HardHat, CalendarClock, RefreshCw } from "lucide-react";

export default function ServiceRequests() {
  const { vendor } = useVendor();
  const { toast } = useToast();
  const requests = useList("ServiceRequest", {}, "-created_date", 300);
  const techs = useList("Technician", {}, "-created_date", 200);
  const [assigning, setAssigning] = useState(null); // request being assigned
  const [techId, setTechId] = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [completing, setCompleting] = useState(null); // request being completed
  const [notes, setNotes] = useState("");
  const [checking, setChecking] = useState(false);

  const mine = requests.data.filter((r) => vendor && (r.vendor_id === vendor.id || (r.vendor_name && vendor.company_name && r.vendor_name === vendor.company_name)));
  const myTechs = techs.data.filter((t) => vendor && t.vendor_id === vendor.id && t.status !== "inactive");

  const update = async (r, patch, msg) => {
    try {
      await base44.entities.ServiceRequest.update(r.id, patch);
      await logVendorAction("Service request update", "Vendor Services", r.request_number, r.status, patch.status || r.status);
      toast({ title: msg });
      requests.reload();
    } catch (e) {
      toast({ title: "Action failed", description: e.message, variant: "destructive" });
    }
  };

  const openAssign = (r) => {
    setAssigning(r);
    setTechId(r.assigned_technician_id || "");
    setVisitDate(r.scheduled_date || new Date().toISOString().slice(0, 10));
  };

  const confirmAssign = async () => {
    const r = assigning;
    const tech = myTechs.find((t) => t.id === techId);
    if (!tech) { toast({ title: "Please select a technician.", variant: "destructive" }); return; }
    const patch = {
      assigned_technician_id: tech.id,
      assigned_technician_name: tech.name,
      scheduled_date: visitDate || r.scheduled_date || "",
      status: r.status === "open" ? "assigned" : r.status,
    };
    // Requests raised before the SLA existed still get their deadline on dispatch.
    if (!r.sla_due_date) {
      patch.sla_hours = slaHours(r.priority);
      patch.sla_due_date = slaDueFrom(r.priority, r.created_date);
      patch.sla_status = "on_track";
    }
    await update(r, patch, `${tech.name} dispatched to ${r.request_number}`);
    setAssigning(null);
    setTechId("");
    setVisitDate("");
  };

  const runSlaCheck = async () => {
    setChecking(true);
    try {
      const res = await base44.functions.invoke("service_sla_check", {});
      const out = (res && res.data) || {};
      toast({
        title: out.escalated ? `${out.escalated} request(s) escalated` : "All requests within SLA",
        description: `${out.scanned || 0} open · ${out.due_soon || 0} closing soon · ${out.breached || 0} breached`,
        variant: out.escalated ? "destructive" : "default",
      });
      requests.reload();
    } catch (e) {
      toast({ title: "SLA check failed", description: e.message, variant: "destructive" });
    } finally {
      setChecking(false);
    }
  };

  const confirmComplete = async () => {
    const r = completing;
    if (!notes.trim()) { toast({ title: "Please add completion notes.", variant: "destructive" }); return; }
    await update(r, { status: "completed", completion_notes: notes }, `${r.request_number} marked completed`);
    setCompleting(null);
    setNotes("");
  };

  const RESCHEDULE = (r) => (
    <Button size="sm" variant="outline" onClick={() => openAssign(r)}>
      <CalendarClock className="h-3.5 w-3.5" /> Reschedule
    </Button>
  );

  const ACTIONS = {
    open: (r) => (
      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => openAssign(r)}>
        <UserCheck className="h-3.5 w-3.5" /> Assign Technician
      </Button>
    ),
    assigned: (r) => (
      <>
        {RESCHEDULE(r)}
        <Button size="sm" variant="outline" onClick={() => update(r, { status: "in_progress" }, "Work started")}>
          <PlayCircle className="h-3.5 w-3.5" /> Start Work
        </Button>
      </>
    ),
    in_progress: (r) => (
      <>
        {RESCHEDULE(r)}
        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => { setCompleting(r); setNotes(""); }}>
          <CheckCircle2 className="h-3.5 w-3.5" /> Complete
        </Button>
      </>
    ),
  };

  return (
    <div>
      <PageHeader
        title="Service Requests"
        icon={Wrench}
        subtitle="Customer service and maintenance requests dispatched to your technicians."
        actions={
          <Button variant="outline" size="sm" onClick={runSlaCheck} disabled={checking}>
            <RefreshCw className={"h-3.5 w-3.5" + (checking ? " animate-spin" : "")} /> {checking ? "Checking…" : "Check SLA"}
          </Button>
        }
      />

      {requests.loading ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-200/60" />)}</div>
      ) : mine.length === 0 ? (
        <SectionCard>
          <EmptyState icon={Wrench} title="No service requests" description="When customers raise service requests for your company, they'll appear here for technician assignment." />
        </SectionCard>
      ) : (
        <div className="space-y-3">
          {mine.map((r) => (
            <SectionCard key={r.id}>
              <div className="flex flex-col gap-3 p-5 lg:flex-row lg:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-slate-900">{r.request_number}</p>
                    <StatusBadge status={r.status} tone={statusTone(r.status)} />
                    {r.priority && r.priority !== "medium" && <StatusBadge status={r.priority} tone={r.priority === "critical" ? "red" : r.priority === "high" ? "amber" : "gray"} />}
                    <SlaBadge request={r} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {r.service_type || "Service"} · {r.customer_name || r.organization_name || "Customer"}{r.site_name ? ` · ${r.site_name}` : ""}
                    {r.scheduled_date ? ` · Scheduled ${new Date(r.scheduled_date).toLocaleDateString()}` : ""}
                  </p>
                  {r.asset_name && <p className="mt-0.5 text-xs text-slate-400">Asset: {r.asset_name}</p>}
                  {r.description && <p className="mt-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs text-slate-600">{r.description}</p>}
                  {r.assigned_technician_name && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                      <HardHat className="h-3.5 w-3.5" /> Technician: {r.assigned_technician_name}
                    </p>
                  )}
                  {r.completion_notes && <p className="mt-1 text-xs text-slate-500">Completion notes: {r.completion_notes}</p>}
                </div>
                <div className="flex shrink-0 flex-wrap justify-end gap-2">
                  {ACTIONS[r.status] ? ACTIONS[r.status](r) : (
                    <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" /> Completed</span>
                  )}
                </div>
              </div>
            </SectionCard>
          ))}
        </div>
      )}

      {/* Assign technician dialog */}
      <Dialog open={!!assigning} onOpenChange={(o) => !o && setAssigning(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Assign Technician</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-600">Select an active technician for <span className="font-semibold text-slate-900">{assigning?.request_number}</span>.</p>
          <div>
            <Label>Technician</Label>
            {myTechs.length === 0 ? (
              <div className="mt-1.5 rounded-lg bg-amber-50 p-3 text-xs text-amber-700 ring-1 ring-amber-100">
                No active technicians. Add technicians first from the Technicians page.
              </div>
            ) : (
              <select value={techId} onChange={(e) => setTechId(e.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm">
                <option value="">Select technician…</option>
                {myTechs.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}{t.city ? ` — ${t.city}` : ""}{(t.skills || []).length ? ` (${t.skills.slice(0, 2).join(", ")})` : ""}</option>
                ))}
              </select>
            )}
          </div>
          <div>
            <Label>Visit date</Label>
            <Input type="date" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} className="mt-1.5" />
            <p className="mt-1 text-xs text-slate-500">Shown on the technician's dispatch schedule.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssigning(null)}>Cancel</Button>
            <Button onClick={confirmAssign} disabled={!techId} className="bg-emerald-600 hover:bg-emerald-700">Assign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete dialog */}
      <Dialog open={!!completing} onOpenChange={(o) => !o && setCompleting(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Mark Completed</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-600">Add completion notes for <span className="font-semibold text-slate-900">{completing?.request_number}</span> — the customer will see them.</p>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Work performed, parts replaced, observations…" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleting(null)}>Cancel</Button>
            <Button onClick={confirmComplete} className="bg-emerald-600 hover:bg-emerald-700">Complete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}