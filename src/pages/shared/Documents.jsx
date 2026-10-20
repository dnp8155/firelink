import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useList } from "@/hooks/useList";
import { orgQuery } from "@/lib/orgScope";
import { PageHeader, SectionCard } from "@/components/ui-bits";
import RecordTable from "@/components/shared/RecordTable";
import DocumentFormDialog from "@/components/shared/DocumentFormDialog";
import SelectField from "@/components/shared/SelectField";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { FolderOpen, Plus, Eye, Trash2, Loader2 } from "lucide-react";

const FILTERS = [
  { value: "all", label: "All types" },
  { value: "certificate", label: "Certificates" },
  { value: "fire_noc", label: "Fire NOC" },
  { value: "inspection_report", label: "Inspection reports" },
  { value: "maintenance_report", label: "Maintenance reports" },
  { value: "invoice", label: "Invoices" },
  { value: "purchase_order", label: "Purchase orders" },
  { value: "drawing", label: "Drawings" },
  { value: "manual", label: "Manuals" },
  { value: "other", label: "Other" },
];

export default function Documents() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [type, setType] = useState("all");
  const [open, setOpen] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const { data, loading, reload } = useList(
    "Document",
    { ...orgQuery(user), ...(type === "all" ? {} : { type }) },
    "-created_date",
    200
  );

  const openFile = async (doc) => {
    if (!doc.file_url) return;
    if (/^https?:/i.test(doc.file_url)) {
      window.open(doc.file_url, "_blank", "noopener,noreferrer");
      return;
    }
    setBusyId(doc.id);
    try {
      const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: doc.file_url });
      window.open(signed_url, "_blank", "noopener,noreferrer");
    } catch (err) {
      toast({ title: "Could not open file", description: err?.message, variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (doc) => {
    if (!window.confirm(`Delete "${doc.name}"?`)) return;
    try {
      await base44.entities.Document.delete(doc.id);
      toast({ title: "Document deleted" });
      reload();
    } catch (err) {
      toast({ title: "Could not delete document", description: err?.message, variant: "destructive" });
    }
  };

  return (
    <div>
      <PageHeader
        title="Documents"
        subtitle="Certificates, reports and drawings for your organization."
        icon={FolderOpen}
        actions={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Upload</Button>}
      />

      <SectionCard
        title="Document library"
        actions={<div className="w-48"><SelectField label="" value={type} onChange={setType} options={FILTERS} /></div>}
      >
        <RecordTable
          loading={loading}
          rows={data}
          empty={{
            icon: FolderOpen,
            title: "No documents",
            description: "Upload certificates, NOCs, inspection reports or invoices to keep them in one place.",
            action: <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Upload</Button>,
          }}
          columns={[
            { key: "name", label: "Document", render: (r) => (
              <div>
                <p className="font-medium text-slate-900">{r.name}</p>
                <p className="text-xs text-slate-500">{String(r.type || "other").replace(/_/g, " ")} · v{r.version || 1}</p>
              </div>
            ) },
            { key: "uploaded_by", label: "Uploaded by", render: (r) => r.uploaded_by || "—" },
            { key: "created_date", label: "Added", render: (r) => (r.created_date ? new Date(r.created_date).toLocaleDateString("en-IN") : "—") },
            { key: "actions", label: "", headClassName: "px-4 py-3 text-right", cellClassName: "px-4 py-3 text-right", render: (r) => (
              <div className="flex justify-end gap-1">
                <Button size="sm" variant="ghost" disabled={busyId === r.id} onClick={() => openFile(r)}>
                  {busyId === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />} Open
                </Button>
                <Button size="sm" variant="ghost" className="text-rose-600 hover:text-rose-700" onClick={() => remove(r)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) },
          ]}
        />
      </SectionCard>

      <DocumentFormDialog open={open} onOpenChange={setOpen} user={user} onSaved={reload} />
    </div>
  );
}