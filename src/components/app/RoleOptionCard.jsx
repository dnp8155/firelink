import React from "react";
import { getIcon } from "@/lib/icons";
import { ArrowRight } from "lucide-react";

export default function RoleOptionCard({ roleKey, label, icon, color, hint, active, onSelect }) {
  const Icon = getIcon(icon);

  return (
    <button
      type="button"
      onClick={() => onSelect(roleKey)}
      className="group flex w-full items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-md"
    >
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-white`}>
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-900">{label}</span>
          {active && (
            <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-600">Current</span>
          )}
        </span>
        <span className="mt-1 block text-xs leading-relaxed text-slate-500">{hint}</span>
      </span>
      <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-rose-500" />
    </button>
  );
}