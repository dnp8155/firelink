import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useList } from "@/hooks/useList";
import { orgQuery, orgIdentity } from "@/lib/orgScope";
import { PageHeader, SectionCard, KpiCard } from "@/components/ui-bits";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import RecordTable from "@/components/shared/RecordTable";
import ServiceRequestFormDialog from "@/components/shared/ServiceRequestFormDialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Wrench, Plus, Trash2, Clock, CheckCircle2, CalendarClock } from "lucide-react";

export default function Maintenance() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data, loading, reload } = useList("ServiceRequest", orgQuery(user), "-created_date", 200);
  const { data: assets } = useList("Asset", orgQuery(user), "name", 100);
  const [open, setOpen] = useState(false);
  const [scheduling, setScheduling] = useState(false);

  const openCount = data.filter((r) => ["open", "assigned", "in_progress"].includes(r.status)).length;
  const completed = data.filter((r) => r.status === "completed").length;

  // Turns every asset whose inspection is due into a scheduled vendor visit.
  const autoSchedule = async () => {
    const organizationId = orgIdentity(user).organization_id;
    if (!organizationId) {
      toast({
        title: "No organization on your profile",
        description: "Add your organization details before scheduling preventive maintenance.",
        variant: "destructive",
      });
      return;
    }
    setScheduling(true);
    try {
      const res = await base44.functions.invoke("generate_maintenance_schedule", {
        organization_id: organizationId,
        horizon_days: 30,
      });
      const result = res.data || {};
      if (result.error) throw new Error(result.error);
      toast({
        title: result.created
          ? `${result.created} visit${result.created === 1 ? "" : "s"} scheduled`
          : "Nothing new to schedule",
        description: result.created
          ? `Inspections due up to ${result.horizon_date}.`
          : result.scanned
            ? `All ${result.scanned} due assets already have an open visit.`
            : "No assets are due in the next 30 days.",
      });
      reload();
    } catch (err) {
      toast({ title: "Could not schedule visits", description: err?.message, variant: "destructive" });
    } finally {
      setScheduling(false);
    }
  };

  const cancel = async (row) => {
    if (!window.confirm(`Cancel request ${row.request_number}?`)) return;
    try {
      await base44.entities.ServiceRequest.update(row.id, { status: "cancelled" });
      toast({ title: "Request cancelled" });
      reload();
    } catch (err) {
      toast({ title: "Could not cancel request", description: err?.message, variant: "destructive" });
    }
  };

  return (
    <div>
      <PageHeader
        title="Maintenance"
        subtitle="Service requests raised for your assets and sites."
        icon={Wrench}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={autoSchedule} disabled={scheduling}>
              <CalendarClock className="h-4 w-4" /> {scheduling ? "Scheduling…" : "Auto-schedule due visits"}
            </Button>
            <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Raise request</Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Open requests" value={openCount} icon={Clock} tone="amber" sub="In progress or waiting" />
        <KpiCard label="Completed" value={completed} icon={CheckCircle2} tone="green" sub="Closed by vendor" />
        <KpiCard label="Total requests" value={data.length} icon={Wrench} tone="slate" sub="All time" />
      </div>

      <div className="mt-5">
        <SectionCard title="Service requests">
          <RecordTable
            loading={loading}
            rows={data}
            empty={{
              icon: Wrench,
              title: "No service requests",
              description: "Raise a request for refills, inspections, repairs or AMC visits.",
              action: <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Raise request</Button>,
            }}
            columns={[
              { key: "request_number", label: "Request", render: (r) => (
                <div>
                  <p className="font-medium text-slate-900">{r.request_number}</p>
                  <p className="text-xs text-slate-500">{r.service_type}</p>
                </div>
              ) },
              { key: "asset_name", label: "Asset", render: (r) => r.asset_name || r.site_name || "—" },
              { key: "priority", label: "Priority", render: (r) => <StatusBadge status={r.priority} tone={r.priority === "critical" || r.priority === "high" ? "red" : r.priority === "medium" ? "amber" : "gray"} /> },
              { key: "scheduled_date", label: "Preferred date", render: (r) => r.scheduled_date || "—" },
              { key: "assigned_technician_name", label: "Technician", render: (r) => r.assigned_technician_name || "Not assigned" },
              { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} tone={statusTone(r.status)} /> },
              { key: "actions", label: "", headClassName: "px-4 py-3 text-right", cellClassName: "px-4 py-3 text-right", render: (r) => (
                ["open", "assigned"].includes(r.status) ? (
                  <Button size="sm" variant="ghost" className="text-rose-600 hover:text-rose-700" onClick={() => cancel(r)}>
                    <Trash2 className="h-3.5 w-3.5" /> Cancel
                  </Button>
                ) : <span className="text-xs text-slate-400">—</span>
              ) },
            ]}
          />
        </SectionCard>
      </div>

      <ServiceRequestFormDialog open={open} onOpenChange={setOpen} user={user} assets={assets} onSaved={reload} />
    </div>
  );
}