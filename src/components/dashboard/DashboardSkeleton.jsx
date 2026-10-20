import React from "react";

export default function DashboardSkeleton({ tiles = 8, panels = 2 }) {
  return (
    <div className="animate-pulse space-y-5">
      <div className="h-56 rounded-3xl bg-slate-200/70" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: tiles }).map((_, i) => (
          <div key={i} className="h-[104px] rounded-2xl bg-slate-200/60" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: panels }).map((_, i) => (
          <div key={i} className="h-64 rounded-2xl bg-slate-200/60" />
        ))}
      </div>
    </div>
  );
}