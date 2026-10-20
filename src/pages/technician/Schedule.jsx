import React, { useCallback, useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { PageHeader, SectionCard, EmptyState, KpiCard } from "@/components/ui-bits";
import ScheduleGroup from "@/components/technician/ScheduleGroup";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { logAudit } from "@/lib/auditLog";
import { Link } from "react-router-dom";
import { CalendarClock, Loader2, HardHat, AlertTriangle, CalendarCheck, Wrench } from "lucide-react";

const dayISO = (offset = 0) => new Date(Date.now() + offset * 864e5).toISOString().slice(0, 10);

const CLOSED = ["completed", "cancelled"];

export default function Schedule() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [technician, setTechnician] = useState(null);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const email = (user?.email || "").toLowerCase();
      const techs = email ? await base44.entities.Technician.filter({ email }, "-created_date", 10) : [];
      const mine = (techs || []).find((t) => (t.email || "").toLowerCase() === email) || null;
      setTechnician(mine);
      if (!mine) {
        setVisits([]);
        return;
      }
      const page = await base44.entities.ServiceRequest.filter(
        { assigned_technician_id: mine.id },
        { sort: "scheduled_date", limit: 100 },
      );
      setVisits(page.items || []);
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => { load(); }, [load]);

  const groups = useMemo(() => {
    const today = dayISO(0);
    const tomorrow = dayISO(1);
    const weekEnd = dayISO(7);
    const buckets = { overdue: [], today: [], tomorrow: [], week: [], later: [], unscheduled: [], closed: [] };

    visits.forEach((visit) => {
      if (CLOSED.includes(visit.status)) { buckets.closed.push(visit); return; }
      const day = (visit.scheduled_date || "").slice(0, 10);
      if (!day) buckets.unscheduled.push(visit);
      else if (day < today) buckets.overdue.push(visit);
      else if (day === today) buckets.today.push(visit);
      else if (day === tomorrow) buckets.tomorrow.push(visit);
      else if (day <= weekEnd) buckets.week.push(visit);
      else buckets.later.push(visit);
    });
    return buckets;
  }, [visits]);

  const changeStatus = async (job, status) => {
    if (!navigator.onLine) {
      toast({ title: "You're offline", description: "Reconnect to update this visit.", variant: "destructive" });
      return;
    }
    setBusyId(job.id);
    try {
      await base44.entities.ServiceRequest.update(job.id, { status });
      await logAudit({
        action: status === "completed" ? "Service request completed" : "Service request started",
        module: "ServiceRequest",
        entityId: job.request_number || job.id,
        before: job.status,
        after: status,
      });
      toast({
        title: status === "completed" ? "Visit completed" : "Visit started",
        description: `${job.request_number || "Request"} · ${job.service_type}`,
      });
      await load();
    } catch (e) {
      toast({ title: "Update failed", description: e.message, variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const openCount = visits.filter((v) => !CLOSED.includes(v.status)).length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Dispatch schedule"
        subtitle={technician ? `Visits dispatched to ${technician.name}` : "Visits dispatched to you by your vendor"}
        icon={CalendarClock}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link to="/technician/dashboard"><Wrench className="h-3.5 w-3.5" /> Job board</Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Scheduled today" value={groups.today.length} icon={CalendarCheck} tone="amber" />
        <KpiCard label="Next 7 days" value={groups.week.length + groups.tomorrow.length} icon={CalendarClock} tone="blue" />
        <KpiCard label="Overdue" value={groups.overdue.length} icon={AlertTriangle} tone="rose" />
        <KpiCard label="Open visits" value={openCount} icon={HardHat} tone="teal" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-slate-400" />
        </div>
      ) : !technician ? (
        <SectionCard>
          <EmptyState
            icon={HardHat}
            title="No technician profile linked"
            description={`No technician record carries the email ${user?.email || "on your account"}. Ask your vendor admin to add you to their team with this email and your dispatched visits will appear here.`}
          />
        </SectionCard>
      ) : visits.length === 0 ? (
        <SectionCard>
          <EmptyState
            icon={CalendarClock}
            title="No visits dispatched yet"
            description="When your vendor assigns a service request to you with a visit date, your schedule will fill in here."
          />
        </SectionCard>
      ) : (
        <div className="space-y-6">
          <ScheduleGroup label="Overdue" tone="rose" hint="Past the scheduled visit date" visits={groups.overdue} busyId={busyId} onStart={(j) => changeStatus(j, "in_progress")} onComplete={(j) => changeStatus(j, "completed")} />
          <ScheduleGroup label="Today" tone="amber" hint={new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", weekday: "short" })} visits={groups.today} busyId={busyId} onStart={(j) => changeStatus(j, "in_progress")} onComplete={(j) => changeStatus(j, "completed")} />
          <ScheduleGroup label="Tomorrow" tone="sky" visits={groups.tomorrow} busyId={busyId} onStart={(j) => changeStatus(j, "in_progress")} onComplete={(j) => changeStatus(j, "completed")} />
          <ScheduleGroup label="Next 7 days" tone="sky" visits={groups.week} busyId={busyId} onStart={(j) => changeStatus(j, "in_progress")} onComplete={(j) => changeStatus(j, "completed")} />
          <ScheduleGroup label="Later" tone="slate" visits={groups.later} busyId={busyId} onStart={(j) => changeStatus(j, "in_progress")} onComplete={(j) => changeStatus(j, "completed")} />
          <ScheduleGroup label="Not yet scheduled" tone="slate" hint="Waiting for a visit date" visits={groups.unscheduled} busyId={busyId} onStart={(j) => changeStatus(j, "in_progress")} onComplete={(j) => changeStatus(j, "completed")} />
          <ScheduleGroup label="Completed" tone="slate" visits={groups.closed.slice(0, 6)} busyId={busyId} onStart={(j) => changeStatus(j, "in_progress")} onComplete={(j) => changeStatus(j, "completed")} />
        </div>
      )}
    </div>
  );
}