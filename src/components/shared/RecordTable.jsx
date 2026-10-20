import React from "react";
import { Loader2 } from "lucide-react";
import { EmptyState } from "@/components/ui-bits";

export default function RecordTable({ columns, rows, loading, empty }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }
  if (!rows?.length) {
    return (
      <EmptyState
        icon={empty?.icon}
        title={empty?.title || "Nothing here yet"}
        description={empty?.description}
        action={empty?.action}
      />
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            {columns.map((c) => (
              <th key={c.key} className={c.headClassName || "px-4 py-3"}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
              {columns.map((c) => (
                <td key={c.key} className={c.cellClassName || "px-4 py-3 text-slate-700"}>
                  {c.render ? c.render(row) : row[c.key] ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}