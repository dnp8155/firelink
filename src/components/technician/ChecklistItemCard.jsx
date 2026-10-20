import React from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

const OPTIONS = [
  { key: "pass", label: "Pass", active: "border-emerald-300 bg-emerald-50 text-emerald-700" },
  { key: "fail", label: "Fail", active: "border-rose-300 bg-rose-50 text-rose-700" },
  { key: "na", label: "N/A", active: "border-slate-300 bg-slate-100 text-slate-700" },
];

export default function ChecklistItemCard({ item, index, value, note, onResult, onNote }) {
  return (
    <div className="px-5 py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-800">
            {index + 1}. {item.question}
          </p>
          {item.guidance && <p className="mt-0.5 text-xs text-slate-500">{item.guidance}</p>}
          {item.critical && (
            <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700">
              <AlertTriangle className="h-3 w-3" /> Critical — a failure raises a CAPA
            </span>
          )}
        </div>
        <div className="flex shrink-0 gap-1.5">
          {OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => onResult(option.key)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs font-medium transition",
                value === option.key ? option.active : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {value === "fail" && (
        <Textarea
          rows={2}
          value={note}
          onChange={(e) => onNote(e.target.value)}
          placeholder="What did you find? This is recorded as evidence on the inspection."
          className="mt-3"
        />
      )}
    </div>
  );
}