import React, { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { EmptyState } from "@/components/ui-bits";
import DashHero, { HERO_BTN, HERO_BTN_GHOST } from "@/components/dashboard/DashHero";
import StatTile from "@/components/dashboard/StatTile";
import Panel from "@/components/dashboard/Panel";
import JobCard from "@/components/technician/JobCard";
import OfflineSyncPanel from "@/components/technician/OfflineSyncPanel";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { logAudit } from "@/lib/auditLog";
import { enqueue, isOfflineError } from "@/lib/offline/queue";
import { Link } from "react-router-dom";
import { Wrench, Clock, AlertCircle, CheckCircle2, QrCode, ClipboardList } from "lucide-react";

const todayISO = () => new Date().toISOString().slice(0, 10);
const tomorrowISO = () => new Date(Date.now() + 864e5).toISOString().slice(0, 10);

export default function TechnicianDashboard() {
  const [jobs, setJobs] = useState([]);
  const [counts, setCounts] = useState({ today: 0, pending: 0, overdue: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const today = todayISO();
      const [list, todayCount, pending, overdue, completed] = await Promise.all([
        base44.entities.ServiceRequest.filter(
          { status: { $in: ["open", "assigned", "in_progress"] } },
          { sort: "scheduled_date", limit: 20 }
        ),
        base44.entities.ServiceRequest.count({ scheduled_date: { $gte: today, $lt: tomorrowISO() } }),
        base44.entities.ServiceRequest.count({ status: { $in: ["open", "assigned"] } }),
        base44.entities.ServiceRequest.count({ scheduled_date: { $lt: today }, status: { $nin: ["completed", "cancelled"] } }),
        base44.entities.ServiceRequest.count({ status: "completed" }),
      ]);
      setJobs(list.items || []);
      setCounts({ today: todayCount, pending, overdue, completed });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Refresh jobs once queued field updates reach the server.
  useEffect(() => {
    const onSynced = () => load();
    window.addEventListener("firelink:field-synced", onSynced);
    return () => window.removeEventListener("firelink:field-synced", onSynced);
  }, [load]);

  const changeStatus = async (job, status) => {
    setBusyId(job.id);
    const audit = {
      action: status === "completed" ? "Service request completed" : "Service request started",
      module: "ServiceRequest",
      entityId: job.request_number || job.id,
      before: job.status,
      after: status,
    };
    const queueOffline = () => {
      enqueue({
        kind: "job_status",
        entity_id: job.id,
        label: `${job.request_number || "Job"} · ${job.service_type}`,
        payload: { status },
        audit,
      });
      setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, status } : j)));
      toast({ title: "Saved offline", description: `${job.request_number || "Job"} syncs when you're back online.` });
    };

    if (!navigator.onLine) {
      queueOffline();
      setBusyId(null);
      return;
    }

    try {
      await base44.entities.ServiceRequest.update(job.id, { status });
      await logAudit(audit);
      toast({
        title: status === "completed" ? "Job marked complete" : "Job started",
        description: `${job.request_number || "Request"} · ${job.service_type}`,
      });
      await load();
    } catch (e) {
      if (isOfflineError(e)) {
        queueOffline();
      } else {
        toast({ title: "Update failed", description: e.message, variant: "destructive" });
      }
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-5">
      <DashHero
        eyebrow="Technician · Field operations"
        title="My Jobs"
        subtitle="Today's field service assignments, their progress and offline capture status."
        meta={new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        tone="amber"
        stats={[
          { label: "Scheduled today", value: counts.today, sub: "Site visits" },
          { label: "Pending", value: counts.pending, sub: "Open & assigned" },
          { label: "Overdue", value: counts.overdue, sub: "Past due date" },
          { label: "Completed", value: counts.completed, sub: "All time" },
        ]}
        actions={
          <>
            <Link to="/technician/scan" className={HERO_BTN}>
              <QrCode className="h-4 w-4" /> Scan asset QR
            </Link>
            <Link to="/technician/inspections" className={HERO_BTN_GHOST}>
              <ClipboardList className="h-4 w-4" /> Inspection log
            </Link>
          </>
        }
      />

      <OfflineSyncPanel />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Scheduled today" value={counts.today} sub="Visits on the board" icon={Wrench} tone="amber" />
        <StatTile label="Pending jobs" value={counts.pending} sub="Open & assigned" icon={Clock} tone="sky" />
        <StatTile label="Overdue" value={counts.overdue} sub="Needs immediate action" icon={AlertCircle} tone="rose" />
        <StatTile label="Completed" value={counts.completed} sub="Closed successfully" icon={CheckCircle2} tone="emerald" />
      </div>

      <Panel
        title="Job board"
        count={jobs.length}
        subtitle="Open assignments sorted by scheduled date"
        icon={Wrench}
        action={
          <Button asChild size="sm" variant="outline">
            <Link to="/technician/scan"><QrCode className="h-3.5 w-3.5" /> Scan asset QR</Link>
          </Button>
        }
        bodyClassName="p-4"
      >
        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-40 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <EmptyState
            icon={Wrench}
            title="No jobs assigned"
            description="Service requests assigned to you will appear here. Check back later for new assignments."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                busy={busyId === job.id}
                onStart={(j) => changeStatus(j, "in_progress")}
                onComplete={(j) => changeStatus(j, "completed")}
              />
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}