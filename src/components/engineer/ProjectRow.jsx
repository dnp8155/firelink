import React from "react";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/hooks/useList";
import { CalendarDays, Pencil, Trash2 } from "lucide-react";

const TYPE_LABELS = {
  design: "Design",
  audit: "Audit",
  installation: "Installation",
  retrofit: "Retrofit",
  maintenance: "Maintenance",
};

const dateLabel = (value) => (value ? new Date(value).toLocaleDateString("en-IN") : "—");

export default function ProjectRow({ project, onEdit, onDelete }) {
  return (
    <div className="flex flex-wrap items-center gap-3 px-5 py-4">
      <div className="min-w-[200px] flex-1">
        <p className="text-sm font-semibold text-slate-800">{project.name}</p>
        <p className="text-xs text-slate-500">
          {[project.client_name, project.site_name, project.city].filter(Boolean).join(" · ") || "No client details yet"}
        </p>
        {project.scope && <p className="mt-1 line-clamp-2 text-xs text-slate-400">{project.scope}</p>}
      </div>

      <span className="w-24 text-xs font-medium text-slate-500">{TYPE_LABELS[project.project_type] || "—"}</span>
      <div className="flex w-32 items-center gap-1.5 text-xs text-slate-500">
        <CalendarDays className="h-3.5 w-3.5" /> {dateLabel(project.target_date)}
      </div>
      <StatusBadge status={project.status} tone={statusTone(project.status)} />
      <span className="w-24 text-right text-sm font-semibold text-slate-900">{formatINR(project.project_value)}</span>

      <div className="flex items-center gap-1.5">
        <Button size="sm" variant="outline" onClick={() => onEdit(project)}>
          <Pencil className="h-3.5 w-3.5" /> Edit
        </Button>
        <button
          onClick={() => onDelete(project)}
          title="Delete project"
          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}