import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useList } from "@/hooks/useList";
import { orgIdentity, orgQuery } from "@/lib/orgScope";
import { PageHeader, SectionCard, KpiCard } from "@/components/ui-bits";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import RecordTable from "@/components/shared/RecordTable";
import NocFormDialog from "@/components/shared/NocFormDialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Flame, Plus, Pencil, Trash2, ExternalLink, Calendar } from "lucide-react";

const daysLeft = (date) => (date ? Math.ceil((new Date(date) - Date.now()) / 86400000) : null);

export default function FireNOC() {
  const { user } = useAuth();
  const { toast } = useToast();
  const org = orgIdentity(user);
  const { data, loading, reload } = useList("NOC", orgQuery(user), "expiry_date", 200);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const valid = data.filter((n) => n.status === "valid").length;
  const expiring = data.filter((n) => {
    const d = daysLeft(n.expiry_date);
    return n.status !== "expired" && d !== null && d >= 0 && d <= 90;
  }).length;
  const expired = data.filter((n) => n.status === "expired" || (daysLeft(n.expiry_date) ?? 1) < 0).length;

  const remove = async (row) => {
    if (!window.confirm(`Delete NOC ${row.noc_number}?`)) return;
    try {
      await base44.entities.NOC.delete(row.id);
      toast({ title: "NOC deleted" });
      reload();
    } catch (err) {
      toast({ title: "Could not delete NOC", description: err?.message, variant: "destructive" });
    }
  };

  return (
    <div>
      <PageHeader
        title="Fire NOC"
        subtitle="Track fire no-objection certificates and their renewals."
        icon={Flame}
        actions={<Button onClick={() => { setEditing(null); setDialogOpen(true); }}><Plus className="h-4 w-4" /> Add NOC</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Valid NOCs" value={valid} icon={Flame} tone="green" sub="Currently approved" />
        <KpiCard label="Expiring soon" value={expiring} icon={Calendar} tone="amber" sub="Within 90 days" />
        <KpiCard label="Expired" value={expired} icon={Flame} tone="rose" sub="Renewal needed" />
      </div>

      <div className="mt-5">
        <SectionCard title="NOC register">
          <RecordTable
            loading={loading}
            rows={data}
            empty={{
              icon: Flame,
              title: "No NOC records",
              description: "Add the fire NOC issued for each of your sites.",
              action: <Button onClick={() => { setEditing(null); setDialogOpen(true); }}><Plus className="h-4 w-4" /> Add NOC</Button>,
            }}
            columns={[
              { key: "noc_number", label: "NOC", render: (r) => (
                <div>
                  <p className="font-medium text-slate-900">{r.noc_number}</p>
                  <p className="text-xs text-slate-500">{r.site_name || "—"}</p>
                </div>
              ) },
              { key: "authority", label: "Authority", render: (r) => r.authority || "—" },
              { key: "issue_date", label: "Issued", render: (r) => r.issue_date || "—" },
              { key: "expiry_date", label: "Expires", render: (r) => (
                <div>
                  <p>{r.expiry_date || "—"}</p>
                  {r.expiry_date && <p className="text-xs text-slate-500">{daysLeft(r.expiry_date)} days left</p>}
                </div>
              ) },
              { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} tone={statusTone(r.status)} /> },
              { key: "actions", label: "", headClassName: "px-4 py-3 text-right", cellClassName: "px-4 py-3 text-right", render: (r) => (
                <div className="flex justify-end gap-1">
                  {r.document_url && (
                    <Button size="sm" variant="ghost" asChild>
                      <a href={r.document_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3.5 w-3.5" /></a>
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

      <NocFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        record={editing}
        defaults={{ organization_id: org.organization_id, organization_name: org.organization_name }}
        onSaved={reload}
      />
    </div>
  );
}