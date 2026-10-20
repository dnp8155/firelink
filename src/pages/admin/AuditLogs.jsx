import React, { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { PageHeader, KpiCard, EmptyState, SectionCard } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { timeAgo } from "@/lib/format";
import { ScrollText, Search, Activity, Clock, Users, Layers, ChevronRight } from "lucide-react";

const title = (s) => String(s || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const since = (hours) => new Date(Date.now() - hours * 3600 * 1000).toISOString();

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [modules, setModules] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [stats, setStats] = useState(null);
  const [active, setActive] = useState(null);

  const loadStats = useCallback(async () => {
    const [total, recent, moduleList, actorList] = await Promise.all([
      base44.entities.AuditLog.count({}),
      base44.entities.AuditLog.count({ created_date: { $gte: since(24) } }),
      base44.entities.AuditLog.list({ distinct: "module" }),
      base44.entities.AuditLog.list({ distinct: "user_name" }),
    ]);
    setModules((moduleList.items || []).filter(Boolean).sort());
    setStats({
      total,
      recent,
      modules: (moduleList.items || []).filter(Boolean).length,
      actors: (actorList.items || []).filter(Boolean).length,
    });
  }, []);

  const load = useCallback(async (mode = "reset") => {
    setLoading(true);
    const filter = {};
    if (moduleFilter !== "all") filter.module = moduleFilter;
    const term = query.trim();
    if (term) filter.$or = [{ action: { $regex: term, $options: "i" } }, { user_name: { $regex: term, $options: "i" } }, { entity_id: { $regex: term, $options: "i" } }];
    const page = await base44.entities.AuditLog.filter(filter, { sort: "-created_date", limit: 50, ...(mode === "more" && cursor ? { cursor } : {}) });
    setLogs((prev) => (mode === "more" ? [...prev, ...(page.items || [])] : (page.items || [])));
    setCursor(page.next_cursor || null);
    setHasMore(!!page.has_more);
    setLoading(false);
  }, [moduleFilter, query, cursor]);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => {
    const t = setTimeout(() => load("reset"), query.trim() ? 400 : 0);
    return () => clearTimeout(t);
  }, [moduleFilter, query]);

  return (
    <div>
      <PageHeader title="Audit Logs" icon={ScrollText} subtitle="Every approval, status change and configuration edit, newest first." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Total events" value={stats?.total ?? "—"} icon={Activity} tone="blue" />
        <KpiCard label="Last 24 hours" value={stats?.recent ?? "—"} icon={Clock} tone="amber" />
        <KpiCard label="Modules tracked" value={stats?.modules ?? "—"} icon={Layers} tone="violet" />
        <KpiCard label="Actors" value={stats?.actors ?? "—"} icon={Users} tone="teal" />
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search action, user or record…" className="pl-9" />
        </div>
        <div className="w-full sm:w-56">
          <Select value={moduleFilter} onValueChange={setModuleFilter}>
            <SelectTrigger><SelectValue placeholder="All modules" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All modules</SelectItem>
              {modules.map((m) => <SelectItem key={m} value={m}>{title(m)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-4">
        {loading && logs.length === 0 ? (
          <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}</div>
        ) : logs.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <EmptyState icon={ScrollText} title="No audit events" description="Approvals, status changes and configuration edits are recorded here." />
          </div>
        ) : (
          <SectionCard title={`Events (${logs.length})`}>
            <div className="divide-y divide-slate-50">
              {logs.map((l) => (
                <button key={l.id} onClick={() => setActive(l)} className="flex w-full flex-col gap-2 px-5 py-3 text-left transition hover:bg-slate-50/70 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500"><Activity className="h-4 w-4" /></span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{title(l.action || "change")}</p>
                      <p className="truncate text-xs text-slate-500">
                        {[title(l.module), l.user_name, l.entity_id ? `record ${String(l.entity_id).slice(-8)}` : null].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:justify-end">
                    <span className="text-xs text-slate-400">{timeAgo(l.created_date)}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
                  </div>
                </button>
              ))}
            </div>
            {hasMore && (
              <div className="border-t border-slate-100 px-5 py-3 text-center">
                <Button variant="outline" size="sm" onClick={() => load("more")} disabled={loading}>
                  {loading ? "Loading…" : "Load more"}
                </Button>
              </div>
            )}
          </SectionCard>
        )}
      </div>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{title(active?.action || "change")}</DialogTitle>
          </DialogHeader>
          {active && (
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">{title(active.module)}</span>
                <span className="text-xs text-slate-500">{new Date(active.created_date).toLocaleString("en-IN")}</span>
              </div>
              {[
                ["Actor", active.user_name],
                ["Record", active.entity_id],
                ["Before", active.before_value],
                ["After", active.after_value],
              ].map(([label, value]) => value ? (
                <div key={label} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
                  <p className="break-words text-sm text-slate-800">{value}</p>
                </div>
              ) : null)}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}