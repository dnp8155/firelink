import React from "react";
import { Eye, Trash2, FileText } from "lucide-react";

export default function ReportRow({ report, onView, onDelete }) {
  return (
    <div className="flex flex-wrap items-center gap-3 px-5 py-3.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
        <FileText className="h-4 w-4" />
      </div>
      <div className="min-w-[200px] flex-1">
        <p className="truncate text-sm font-medium text-slate-800">{report.name}</p>
        <p className="text-xs text-slate-500">
          {[report.uploaded_by, report.organization_name, report.created_date ? String(report.created_date).slice(0, 10) : null]
            .filter(Boolean)
            .join(" · ") || "—"}
        </p>
      </div>
      <span className="text-xs text-slate-500">v{report.version || 1}</span>
      <div className="flex items-center gap-1.5">
        <button onClick={() => onView(report)} title="Open report" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
          <Eye className="h-4 w-4" />
        </button>
        <button onClick={() => onDelete(report)} title="Delete report" className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}