import React, { useCallback, useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useList, formatINR } from "@/hooks/useList";
import { KpiCard, PageHeader, SectionCard, EmptyState } from "@/components/ui-bits";
import ProjectRow from "@/components/engineer/ProjectRow";
import ProjectFormDialog from "@/components/engineer/ProjectFormDialog";
import QueueHeader from "@/components/admin/QueueHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { FolderKanban, Plus, PlayCircle, CheckCircle2, IndianRupee } from "lucide-react";

const TABS = [
  { key: "all", label: "All" },
  { key: "planning", label: "Planning" },
  { key: "in_progress", label: "In progress" },
  { key: "on_hold", label: "On hold" },
  { key: "completed", label: "Completed" },
];

export default function EngineerProjects() {
  const { toast } = useToast();
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [kpis, setKpis] = useState(null);
  const [version, setVersion] = useState(0);

  const filter = useMemo(() => {
    const f = {};
    if (tab !== "all") f.status = tab;
    const term = query.trim();
    if (term) f.$or = [{ name: { $regex: term, $options: "i" } }, { client_name: { $regex: term, $options: "i" } }];
    return f;
  }, [tab, query]);

  const projects = useList("EngineeringProject", filter, "-created_date", 50);

  const loadKpis = useCallback(async () => {
    const res = await base44.entities.EngineeringProject.aggregate({ groupBy: "status", sum: "project_value" });
    const rows = res.rows || [];
    const inStatus = (key) => rows.filter((r) => r.status === key).reduce((n, r) => n + (r.count || 0), 0);
    setKpis({
      total: rows.reduce((n, r) => n + (r.count || 0), 0),
      active: inStatus("planning") + inStatus("in_progress"),
      completed: inStatus("completed"),
      value: rows.reduce((n, r) => n + (r.sum_project_value || 0), 0),
    });
  }, []);

  useEffect(() => { loadKpis(); }, [loadKpis, version]);

  const openNew = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (project) => { setEditing(project); setFormOpen(true); };

  const afterSave = () => {
    projects.reload();
    setVersion((v) => v + 1);
  };

  const remove = async (project) => {
    try {
      await base44.entities.EngineeringProject.delete(project.id);
      toast({ title: "Project deleted", description: project.name });
      afterSave();
    } catch (e) {
      toast({ title: "Could not delete project", description: e.message, variant: "destructive" });
    }
  };

  const show = (v) => (v == null ? "—" : v);
  const money = (v) => (v == null ? "—" : formatINR(v));

  return (
    <div>
      <PageHeader
        title="Projects"
        icon={FolderKanban}
        subtitle="Design, audit and installation jobs with their scope, dates and value."
        actions={<Button onClick={openNew} className="bg-rose-600 hover:bg-rose-700"><Plus className="h-4 w-4" /> New Project</Button>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Projects" value={show(kpis?.total)} icon={FolderKanban} tone="violet" />
        <KpiCard label="Active" value={show(kpis?.active)} icon={PlayCircle} tone="blue" sub="Planning + in progress" />
        <KpiCard label="Completed" value={show(kpis?.completed)} icon={CheckCircle2} tone="green" />
        <KpiCard label="Portfolio Value" value={money(kpis?.value)} icon={IndianRupee} tone="amber" />
      </div>

      <div className="mt-6">
        <QueueHeader
          tabs={TABS}
          value={tab}
          onChange={setTab}
          query={query}
          onQueryChange={setQuery}
          placeholder="Search project or client…"
        />
      </div>

      {projects.loading ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}</div>
      ) : projects.data.length === 0 ? (
        <SectionCard>
          <EmptyState
            icon={FolderKanban}
            title="No projects yet"
            description="Track every design, audit and installation job here — scope, client, target date and value in one place."
            action={<Button onClick={openNew}><Plus className="h-4 w-4" /> New Project</Button>}
          />
        </SectionCard>
      ) : (
        <SectionCard>
          <div className="divide-y divide-slate-50">
            {projects.data.map((p) => (
              <ProjectRow key={p.id} project={p} onEdit={openEdit} onDelete={remove} />
            ))}
          </div>
        </SectionCard>
      )}

      <ProjectFormDialog open={formOpen} onOpenChange={setFormOpen} project={editing} onSaved={afterSave} />
    </div>
  );
}