import React, { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { PageHeader, KpiCard, EmptyState } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import QueueHeader from "@/components/admin/QueueHeader";
import ApprovalDialog from "@/components/admin/ApprovalDialog";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import { useToast } from "@/components/ui/use-toast";
import { logAudit } from "@/lib/auditLog";
import { countByField, formatDate, timeAgo } from "@/lib/format";
import { formatINR } from "@/hooks/useList";
import { Briefcase, ChevronRight, Clock, CheckCircle2, Users, MapPin, Ban, ArchiveX } from "lucide-react";

const TABS = [
  { key: "pending", label: "Pending review" },
  { key: "approved", label: "Approved" },
  { key: "draft", label: "Drafts" },
  { key: "closed", label: "Closed / rejected" },
  { key: "all", label: "All vacancies" },
];
const FILTERS = {
  pending: { status: "pending" },
  approved: { status: "approved" },
  draft: { status: "draft" },
  closed: { status: { $in: ["closed", "rejected"] } },
  all: {},
};

export default function JobApprovals() {
  const { toast } = useToast();
  const [tab, setTab] = useState("pending");
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [active, setActive] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [busy, setBusy] = useState(null);
  const [version, setVersion] = useState(0);

  const loadStats = useCallback(async () => {
    const res = await base44.entities.JobVacancy.aggregate({ groupBy: "status", sum: ["openings"] });
    const list = res.rows || [];
    const counts = countByField(list, "status");
    setStats({
      counts,
      total: list.reduce((n, r) => n + (r.count || 0), 0),
      pending: counts.pending || 0,
      approved: counts.approved || 0,
      openings: list.reduce((n, r) => n + (r.sum_openings || 0), 0),
    });
  }, []);

  const loadRows = useCallback(async () => {
    setLoading(true);
    const filter = { ...FILTERS[tab] };
    const term = query.trim();
    if (term) filter.$or = [{ title: { $regex: term, $options: "i" } }, { role: { $regex: term, $options: "i" } }, { vendor_name: { $regex: term, $options: "i" } }];
    const page = await base44.entities.JobVacancy.filter(filter, { sort: "-created_date", limit: 50 });
    setRows(page.items || []);
    setLoading(false);
  }, [tab, query]);

  useEffect(() => { loadStats(); }, [loadStats, version]);
  useEffect(() => {
    const t = setTimeout(loadRows, query.trim() ? 400 : 0);
    return () => clearTimeout(t);
  }, [loadRows, query, version]);

  const openRow = (row) => { setActive(row); setRemarks(""); };

  const update = async (patch, key, message) => {
    if (!active) return;
    setBusy(key);
    await base44.entities.JobVacancy.update(active.id, patch);
    await logAudit({ action: `job_vacancy_${patch.status}`, module: "JobVacancy", entityId: active.id, before: active.status, after: remarks || patch.status });
    setBusy(null);
    setActive(null);
    setVersion((v) => v + 1);
    toast({ title: message, description: active.title });
  };

  const tabs = TABS.map((t) => ({
    ...t,
    count: t.key === "all" ? stats?.total || 0
      : t.key === "closed" ? (stats?.counts?.closed || 0) + (stats?.counts?.rejected || 0)
        : stats?.counts?.[t.key] || 0,
  }));

  const salary = (job) => {
    if (!job.salary_min && !job.salary_max) return "Not disclosed";
    if (job.salary_min && job.salary_max) return `${formatINR(job.salary_min)} – ${formatINR(job.salary_max)}`;
    return formatINR(job.salary_min || job.salary_max);
  };

  return (
    <div>
      <PageHeader title="Job Approvals" icon={Briefcase} subtitle="Vendor vacancies that need review before they go public." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Total vacancies" value={stats?.total ?? "—"} icon={Briefcase} tone="blue" />
        <KpiCard label="Pending review" value={stats?.pending ?? "—"} sub="awaiting a decision" icon={Clock} tone="amber" />
        <KpiCard label="Approved" value={stats?.approved ?? "—"} sub="visible on the careers board" icon={CheckCircle2} tone="green" />
        <KpiCard label="Open positions" value={stats?.openings ?? "—"} sub="across all vacancies" icon={Users} tone="violet" />
      </div>

      <div className="mt-6">
        <QueueHeader tabs={tabs} value={tab} onChange={setTab} query={query} onQueryChange={setQuery} placeholder="Search title, role or vendor…" />
      </div>

      {loading ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}</div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <EmptyState icon={Briefcase} title="No vacancies here" description="Vacancies posted by vendors will appear here for approval." />
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((job) => (
            <div key={job.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">{job.title}</p>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                  {job.vendor_name && <span>{job.vendor_name}</span>}
                  {job.role && <span>{job.role}</span>}
                  {job.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{job.location}</span>}
                  {job.job_type && <span className="capitalize">{String(job.job_type).replace(/_/g, " ")}</span>}
                  <span className="hidden md:inline">{timeAgo(job.created_date)}</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 sm:justify-end">
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900">{salary(job)}</p>
                  <p className="text-[11px] text-slate-500">{job.openings || 1} opening{(job.openings || 1) === 1 ? "" : "s"}</p>
                </div>
                <StatusBadge status={job.status} tone={statusTone(job.status)} />
                <Button size="sm" variant="outline" onClick={() => openRow(job)}>Review <ChevronRight className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ApprovalDialog
        open={!!active}
        onClose={() => setActive(null)}
        title={active?.title || ""}
        subtitle={[active?.vendor_name, active?.role].filter(Boolean).join(" · ")}
        status={active?.status}
        hero={active?.description ? (
          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 text-sm text-slate-700">{active.description}</div>
        ) : null}
        details={active ? [
          { label: "Role", value: active.role },
          { label: "Job type", value: String(active.job_type || "").replace(/_/g, " ") },
          { label: "Location", value: active.location },
          { label: "Experience", value: active.experience_years != null ? `${active.experience_years} years` : null },
          { label: "Salary", value: salary(active) },
          { label: "Openings", value: active.openings || 1 },
          { label: "Skills", value: (active.skills || []).join(", ") },
          { label: "Contact email", value: active.contact_email },
          { label: "Posted on", value: formatDate(active.created_date) },
        ] : []}
        remarks={remarks}
        onRemarksChange={setRemarks}
        remarksLabel="Review note (recorded in the audit trail)"
        busy={busy}
        actions={[
          { label: "Reject", variant: "outline", icon: <Ban className="h-4 w-4" />, onClick: () => update({ status: "rejected" }, "rejected", "Vacancy rejected"), loading: busy === "rejected" },
          { label: "Close", variant: "outline", icon: <ArchiveX className="h-4 w-4" />, onClick: () => update({ status: "closed" }, "closed", "Vacancy closed"), loading: busy === "closed" },
          { label: "Approve", icon: <CheckCircle2 className="h-4 w-4" />, onClick: () => update({ status: "approved" }, "approved", "Vacancy approved"), loading: busy === "approved" },
        ]}
      />
    </div>
  );
}