import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useList } from "@/hooks/useList";
import { orgIdentity, orgQuery } from "@/lib/orgScope";
import { PageHeader, SectionCard, EmptyState } from "@/components/ui-bits";
import RecordTable from "@/components/shared/RecordTable";
import SiteFormDialog from "@/components/shared/SiteFormDialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { MapPin, Plus, Pencil, Trash2 } from "lucide-react";

export default function Sites() {
  const { user } = useAuth();
  const { toast } = useToast();
  const org = orgIdentity(user);
  const { data, loading, reload } = useList("Site", orgQuery(user), "name", 200);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const remove = async (site) => {
    if (!window.confirm(`Delete site "${site.name}"?`)) return;
    try {
      await base44.entities.Site.delete(site.id);
      toast({ title: "Site deleted" });
      reload();
    } catch (err) {
      toast({ title: "Could not delete site", description: err?.message, variant: "destructive" });
    }
  };

  return (
    <div>
      <PageHeader
        title="Sites"
        subtitle="Buildings and locations covered by your fire safety plan."
        icon={MapPin}
        actions={
          <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
            <Plus className="h-4 w-4" /> Add site
          </Button>
        }
      />

      {!org.organization_id && (
        <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Link your organization from the Profile page so sites are shared with your whole team.
        </p>
      )}

      <SectionCard title={`${data.length} site${data.length === 1 ? "" : "s"}`}>
        <RecordTable
          loading={loading}
          rows={data}
          empty={{
            icon: MapPin,
            title: "No sites yet",
            description: "Add your first site to start tagging assets, certificates and inspections.",
            action: <Button onClick={() => { setEditing(null); setDialogOpen(true); }}><Plus className="h-4 w-4" /> Add site</Button>,
          }}
          columns={[
            { key: "name", label: "Site", render: (r) => (
              <div>
                <p className="font-medium text-slate-900">{r.name}</p>
                <p className="text-xs text-slate-500">{r.address || "—"}{r.city ? `, ${r.city}` : ""}</p>
              </div>
            ) },
            { key: "city", label: "City", render: (r) => r.city || "—" },
            { key: "floors", label: "Floors", render: (r) => r.floors ?? "—" },
            { key: "buildings", label: "Buildings", render: (r) => (r.buildings?.length ? r.buildings.join(", ") : "—") },
            { key: "actions", label: "", headClassName: "px-4 py-3 text-right", cellClassName: "px-4 py-3 text-right", render: (r) => (
              <div className="flex justify-end gap-1">
                <Button size="sm" variant="ghost" onClick={() => { setEditing(r); setDialogOpen(true); }}>
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
                <Button size="sm" variant="ghost" className="text-rose-600 hover:text-rose-700" onClick={() => remove(r)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) },
          ]}
        />
      </SectionCard>

      <SiteFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        record={editing}
        defaults={{ organization_id: org.organization_id, organization_name: org.organization_name }}
        onSaved={reload}
      />
    </div>
  );
}