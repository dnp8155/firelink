import React from "react";
import { cn } from "@/lib/utils";

export default function Panel({ title, subtitle, count, action, children, className, bodyClassName, icon: Icon }) {
  return (
    <section className={cn("flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm", className)}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
          <div className="flex min-w-0 items-center gap-2.5">
            {Icon && (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Icon className="h-4 w-4" />
              </span>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="truncate font-heading text-sm font-semibold text-foreground">{title}</h2>
                {count != null && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold tabular-nums text-muted-foreground">{count}</span>
                )}
              </div>
              {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
            </div>
          </div>
          {action && <div className="shrink-0 text-xs">{action}</div>}
        </header>
      )}
      <div className={cn("flex-1", bodyClassName)}>{children}</div>
    </section>
  );
}