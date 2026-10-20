import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import { Wrench, MapPin, Clock, QrCode, Play, CheckCircle2 } from "lucide-react";

export default function JobCard({ job, onStart, onComplete, busy }) {
  const canStart = ["open", "assigned"].includes(job.status);
  const canComplete = job.status === "in_progress";

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card p-4 transition hover:border-primary/30 hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-600">{job.request_number}</p>
          <p className="mt-1 truncate font-heading text-sm font-semibold text-foreground">{job.service_type}</p>
        </div>
        <StatusBadge status={job.priority} tone={statusTone(job.priority)} />
      </div>

      <div className="mt-3 flex-1 space-y-1.5 text-xs text-muted-foreground">
        <p className="flex items-center gap-1.5"><Wrench className="h-3.5 w-3.5 shrink-0" /> {job.asset_name || "Asset not specified"}</p>
        <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 shrink-0" /> {job.site_name || "Site not specified"}</p>
        <p className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 shrink-0" /> {job.scheduled_date || "Not scheduled"}</p>
      </div>

      <div className="mt-4 flex items-center gap-2">
        {canStart && (
          <Button size="sm" className="flex-1" disabled={busy} onClick={() => onStart(job)}>
            <Play className="h-3.5 w-3.5" /> Start job
          </Button>
        )}
        {canComplete && (
          <Button size="sm" className="flex-1" disabled={busy} onClick={() => onComplete(job)}>
            <CheckCircle2 className="h-3.5 w-3.5" /> Mark complete
          </Button>
        )}
        {!canStart && !canComplete && <StatusBadge status={job.status} tone={statusTone(job.status)} />}
        <Button asChild size="sm" variant="outline">
          <Link to="/technician/scan" aria-label="Scan asset QR">
            <QrCode className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}