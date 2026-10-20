import React from "react";
import JobCard from "@/components/technician/JobCard";
import SlaBadge from "@/components/sla/SlaBadge";

const TONES = {
  rose: "text-rose-600",
  amber: "text-amber-600",
  sky: "text-sky-600",
  slate: "text-slate-500",
};

export default function ScheduleGroup({ label, tone = "slate", hint, visits = [], busyId, onStart, onComplete }) {
  if (!visits.length) return null;
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className={"font-heading text-sm font-semibold " + (TONES[tone] || TONES.slate)}>{label}</h2>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">{visits.length}</span>
        {hint && <span className="text-xs text-slate-400">{hint}</span>}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {visits.map((visit) => (
          <div key={visit.id} className="space-y-2">
            <JobCard job={visit} busy={busyId === visit.id} onStart={onStart} onComplete={onComplete} />
            <SlaBadge request={visit} />
          </div>
        ))}
      </div>
    </section>
  );
}