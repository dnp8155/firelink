import React, { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { PageHeader, KpiCard, EmptyState } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import QueueHeader from "@/components/admin/QueueHeader";
import ApprovalDialog from "@/components/admin/ApprovalDialog";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/AuthContext";
import { logAudit } from "@/lib/auditLog";
import { countByField, timeAgo, formatDate } from "@/lib/format";
import { LifeBuoy, ChevronRight, Inbox, Loader, CheckCircle2, AlertTriangle, UserCheck } from "lucide-react";

const TABS = [
  { key: "open", label: "New & assigned" },
  { key: "in_progress", label: "In progress" },
  { key: "waiting_for_customer", label: "Waiting on customer" },
  { key: "done", label: "Resolved & closed" },
  { key: "all", label: "All tickets" },
];
const FILTERS = {
  open: { status: { $in: ["open", "assigned"] } },
  in_progress: { status: "in_progress" },
  waiting_for_customer: { status: "waiting_for_customer" },
  done: { status: { $in: ["resolved", "closed"] } },
  all: {},
};
const PRIORITY_TONE = { low: "gray", medium: "blue", high: "amber", urgent: "red" };

export default function AdminTickets() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [tab, setTab] = useState("open");
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [active, setActive] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [busy, setBusy] = useState(null);
  const [version, setVersion] = useState(0);

  const loadStats = useCallback(async () => {
    const [byStatus, byPriority] = await Promise.all([
      base44.entities.SupportTicket.aggregate({ groupBy: "status" }),
      base44.entities.SupportTicket.aggregate({ groupBy: "priority" }),
    ]);
    const status = countByField(byStatus.rows, "status");
    const priority = countByField(byPriority.rows, "priority");
    setStats({
      status,
      priority,
      total: Object.values(status).reduce((n, c) => n + c, 0),
      newTickets: (status.open || 0) + (status.assigned || 0),
      urgent: (priority.urgent || 0) + (priority.high || 0),
      resolved: (status.resolved || 0) + (status.closed || 0),
    });
  }, []);

  const loadRows = useCallback(async () => {
    setLoading(true);
    const filter = { ...FILTERS[tab] };
    const term = query.trim();
    if (term) filter.$or = [{ subject: { $regex: term, $options: "i" } }, { ticket_number: { $regex: term, $options: "i" } }];
    const page = await base44.entities.SupportTicket.filter(filter, { sort: "-created_date", limit: 50 });
    setRows(page.items || []);
    setLoading(false);
  }, [tab, query]);

  useEffect(() => { loadStats(); }, [loadStats, version]);
  useEffect(() => {
    const t = setTimeout(loadRows, query.trim() ? 400 : 0);
    return () => clearTimeout(t);
  }, [loadRows, query, version]);

  const openTicket = (ticket) => { setActive(ticket); setRemarks(""); };

  const update = async (patch, key, message) => {
    if (!active) return;
    setBusy(key);
    await base44.entities.SupportTicket.update(active.id, patch);
    await logAudit({ action: `ticket_${patch.status || "updated"}`, module: "SupportTicket", entityId: active.id, before: active.status, after: remarks || patch.status });
    setBusy(null);
    setActive(null);
    setVersion((v) => v + 1);
    toast({ title: message, description: active.ticket_number });
  };

  const assignToMe = async () => {
    if (!active) return;
    setBusy("assign");
    await base44.entities.SupportTicket.update(active.id, { assigned_to: user?.full_name || user?.email || "Admin", status: "assigned" });
    await logAudit({ action: "ticket_assigned", module: "SupportTicket", entityId: active.id, before: active.status, after: user?.email || "admin" });
    setBusy(null);
    setActive(null);
    setVersion((v) => v + 1);
    toast({ title: "Ticket assigned to you", description: active.ticket_number });
  };

  const tabs = TABS.map((t) => {
    const s = stats?.status || {};
    const count = t.key === "all" ? stats?.total || 0
      : t.key === "open" ? (s.open || 0) + (s.assigned || 0)
        : t.key === "done" ? (s.resolved || 0) + (s.closed || 0)
          : s[t.key] || 0;
    return { ...t, count };
  });

  return (
    <div>
      <PageHeader title="Support Tickets" icon={LifeBuoy} subtitle="Buyer and vendor issues, triaged by priority and owner." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Total tickets" value={stats?.total ?? "—"} icon={Inbox} tone="blue" />
        <KpiCard label="New & assigned" value={stats?.newTickets ?? "—"} sub="waiting for a first response" icon={AlertTriangle} tone="amber" />
        <KpiCard label="High priority" value={stats?.urgent ?? "—"} sub="high or urgent" icon={AlertTriangle} tone="rose" />
        <KpiCard label="Resolved" value={stats?.resolved ?? "—"} sub="resolved or closed" icon={CheckCircle2} tone="green" />
      </div>

      <div className="mt-6">
        <QueueHeader tabs={tabs} value={tab} onChange={setTab} query={query} onQueryChange={setQuery} placeholder="Search by subject or ticket number…" />
      </div>

      {loading ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}</div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <EmptyState icon={LifeBuoy} title="No tickets here" description="Support requests land here as users raise them." />
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((t) => (
            <div key={t.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">{t.subject || "Untitled ticket"}</p>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                  {t.ticket_number && <span className="font-mono">{t.ticket_number}</span>}
                  {t.user_name && <span>{t.user_name}</span>}
                  {t.category && <span className="capitalize">{t.category}</span>}
                  <span className="hidden md:inline">{timeAgo(t.created_date)}</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                <StatusBadge status={t.priority} tone={PRIORITY_TONE[t.priority] || "gray"} />
                <StatusBadge status={t.status} tone={statusTone(t.status)} />
                <Button size="sm" variant="outline" onClick={() => openTicket(t)}>Open <ChevronRight className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ApprovalDialog
        open={!!active}
        onClose={() => setActive(null)}
        title={active?.subject || ""}
        subtitle={[active?.ticket_number, active?.user_name].filter(Boolean).join(" · ")}
        status={active?.status}
        hero={active?.description ? (
          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 text-sm text-slate-700">{active.description}</div>
        ) : null}
        details={active ? [
          { label: "Requester", value: active.user_name },
          { label: "Category", value: active.category },
          { label: "Priority", value: active.priority },
          { label: "Assigned to", value: active.assigned_to },
          { label: "Organization", value: active.organization_id },
          { label: "Raised on", value: formatDate(active.created_date) },
        ] : []}
        remarks={remarks}
        onRemarksChange={setRemarks}
        remarksLabel="Note for the ticket trail (optional)"
        busy={busy}
        actions={[
          { label: "Assign to me", variant: "outline", icon: <UserCheck className="h-4 w-4" />, onClick: assignToMe, loading: busy === "assign" },
          { label: "In progress", variant: "outline", icon: <Loader className="h-4 w-4" />, onClick: () => update({ status: "in_progress" }, "progress", "Ticket in progress"), loading: busy === "progress" },
          { label: "Waiting on customer", variant: "outline", icon: <AlertTriangle className="h-4 w-4" />, onClick: () => update({ status: "waiting_for_customer" }, "waiting", "Marked waiting on customer"), loading: busy === "waiting" },
          { label: "Resolve", icon: <CheckCircle2 className="h-4 w-4" />, onClick: () => update({ status: "resolved" }, "resolve", "Ticket resolved"), loading: busy === "resolve" },
        ]}
      />
    </div>
  );
}