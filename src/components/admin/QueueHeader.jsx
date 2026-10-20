import React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function QueueHeader({ tabs, value, onChange, query, onQueryChange, placeholder = "Search…" }) {
  return (
    <div className="mb-4 flex flex-col gap-3">
      <div className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition",
              value === t.key
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            )}
          >
            {t.label}
            {t.count != null && (
              <span className={cn("rounded-full px-1.5 py-0.5 text-[11px] font-semibold", value === t.key ? "bg-primary/15 text-primary" : "bg-slate-100 text-slate-500")}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>
      <div className="relative w-full max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input value={query} onChange={(e) => onQueryChange(e.target.value)} placeholder={placeholder} className="pl-9" />
      </div>
    </div>
  );
}