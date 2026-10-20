import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useList } from "@/hooks/useList";
import { orgIdentity, orgQuery } from "@/lib/orgScope";
import { PageHeader, SectionCard, KpiCard } from "@/components/ui-bits";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import RecordTable from "@/components/shared/RecordTable";
import CapaFormDialog from "@/components/shared/CapaFormDialog";
import SelectField from "@/components/shared/SelectField";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { AlertTriangle, Plus, Pencil, Trash2, ArrowRight } from "lucide-react";

const OPEN = ["open", "assigned", "in_progress", "awaiting_verification"];
const NEXT_STATUS = { open: "assigned", assigned: "in_progress", in_progress: "awaiting_verification", awaiting_verification: "closed" };

const FILTERS = [
  { value: "all", label: "All statuses" },
  { value: "open", label: "Open" },
  { value: "assigned", label: "Assigned" },
  { value: "in_progress", label: "In progress" },
  { value: "awaiting_verification", label: "Awaiting verification" },
  { value: "closed", label: "Closed" },
];

export default function CAPA() {
  const { user } = useAuth();
  const { toast } = useToast();
  const org = orgIdentity(user);
  const [status, setStatus] = useState("all");
  const filter = { ...orgQuery(user), ...(status === "all" ? {} : { status }) };
  const { data, loading, reload } = useList("CAPA", filter, "-created_date", 200);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const openCapa = data.filter((c) => OPEN.includes(c.status)).length;
  const critical = data.filter((c) => c.severity === "critical" && c.status !== "closed").length;

  const advance = async (row) => {
    const next = NEXT_STATUS[row.status];
    if (!next) return;
    try {
      await base44.entities.CAPA.update(row.id, { status: next });
      toast({ title: `${row.capa_number} moved to ${next.replace(/_/g, " ")}` });
      reload();
    } catch (err) {
      toast({ title: "Could not update status", description: err?.message, variant: "destructive" });
    }
  };

  const remove = async (row) => {
    if (!window.confirm(`Delete ${row.capa_number}?`)) return;
    try {
      await base44.entities.CAPA.delete(row.id);
      toast({ title: "CAPA deleted" });
      reload();
    } catch (err) {
      toast({ title: "Could not delete CAPA", description: err?.message, variant: "destructive" });
    }
  };

  return (
    <div>
      <PageHeader
        title="CAPA"
        subtitle="Corrective and preventive actions for audit findings."
        icon={AlertTriangle}
        actions={<Button onClick={() => { setEditing(null); setDialogOpen(true); }}><Plus className="h-4 w-4" /> Raise CAPA</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Open findings" value={openCapa} icon={AlertTriangle} tone="amber" sub="Not yet closed" />
        <KpiCard label="Critical open" value={critical} icon={AlertTriangle} tone="rose" sub="Needs immediate action" />
        <KpiCard label="Total records" value={data.length} icon={AlertTriangle} tone="slate" sub="All findings" />
      </div>

      <div className="mt-5">
        <SectionCard
          title="Findings"
          actions={
            <div className="w-52">
              <SelectField label="" value={status} onChange={setStatus} options={FILTERS} />
            </div>
          }
        >
          <RecordTable
            loading={loading}
            rows={data}
            empty={{
              icon: AlertTriangle,
              title: "No corrective actions",
              description: "Raise a CAPA when an audit finds something that needs fixing.",
              action: <Button onClick={() => { setEditing(null); setDialogOpen(true); }}><Plus className="h-4 w-4" /> Raise CAPA</Button>,
            }}
            columns={[
              { key: "capa_number", label: "CAPA", render: (r) => (
                <div className="min-w-[160px]">
                  <p className="font-medium text-slate-900">{r.capa_number}</p>
                  <p className="text-xs text-slate-500">{r.site_name || "—"}</p>
                </div>
              ) },
              { key: "finding", label: "Finding", render: (r) => <span className="line-clamp-2 max-w-xs text-slate-700">{r.finding}</span> },
              { key: "severity", label: "Severity", render: (r) => <StatusBadge status={r.severity} tone={r.severity === "critical" || r.severity === "high" ? "red" : r.severity === "medium" ? "amber" : "gray"} /> },
              { key: "target_date", label: "Target", render: (r) => r.target_date || "—" },
              { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} tone={statusTone(r.status)} /> },
              { key: "actions", label: "", headClassName: "px-4 py-3 text-right", cellClassName: "px-4 py-3 text-right", render: (r) => (
                <div className="flex justify-end gap-1">
                  {NEXT_STATUS[r.status] && (
                    <Button size="sm" variant="outline" onClick={() => advance(r)}>
                      <ArrowRight className="h-3.5 w-3.5" /> {NEXT_STATUS[r.status].replace(/_/g, " ")}
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => { setEditing(r); setDialogOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="ghost" className="text-rose-600 hover:text-rose-700" onClick={() => remove(r)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              ) },
            ]}
          />
        </SectionCard>
      </div>

      <CapaFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        record={editing}
        defaults={{ organization_id: org.organization_id }}
        onSaved={reload}
      />
    </div>
  );
}