import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useList } from "@/hooks/useList";
import { useVendor, VENDOR_DOC_TYPES, docLabel, logVendorAction } from "@/lib/vendor";
import { PageHeader, SectionCard, EmptyState } from "@/components/ui-bits";
import { StatusBadge } from "@/components/StatusBadge";
import DocUploadField from "@/components/vendor/DocUploadField";
import { useToast } from "@/components/ui/use-toast";
import { ShieldCheck, AlertTriangle, Loader2 } from "lucide-react";

const DOC_STATUS_TONES = {
  uploaded: "amber", under_review: "blue", approved: "green",
  rejected: "red", replacement_required: "red", expired: "red", not_uploaded: "gray",
};

export default function Verification() {
  const { vendor, loading: vendorLoading } = useVendor();
  const { toast } = useToast();
  const docs = useList("VendorDocument", {}, "-created_date", 100);
  const [busy, setBusy] = useState(false);

  if (vendorLoading) {
    return <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-200/60" />)}</div>;
  }
  if (!vendor) {
    return <SectionCard><EmptyState icon={ShieldCheck} title="No vendor profile found" description="Register your company first." /></SectionCard>;
  }

  const myDocs = docs.data.filter((d) => d.vendor_id === vendor.id);
  const byType = {};
  myDocs.forEach((d) => { if (!byType[d.doc_type] || d.version > (byType[d.doc_type].version || 0)) byType[d.doc_type] = d; });

  const needAction = myDocs.filter((d) => ["rejected", "replacement_required"].includes(d.status));

  const upsert = async (docType, val) => {
    setBusy(true);
    try {
      const existing = byType[docType];
      if (existing) {
        await base44.entities.VendorDocument.update(existing.id, {
          name: val.name, file_url: val.file_uri,
          status: "uploaded", remarks: "",
          version: (existing.version || 1) + 1,
        });
      } else {
        await base44.entities.VendorDocument.create({
          vendor_id: vendor.id, doc_type: docType, name: val.name,
          file_url: val.file_uri, status: "uploaded", version: 1,
        });
      }
      await logVendorAction("Document upload", "Vendor Verification", docLabel(docType), "", val.name);
      toast({ title: "Document saved", description: "It will be reviewed by the FireLink team." });
      docs.reload();
    } catch (e) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Verification Center"
        icon={ShieldCheck}
        subtitle="Upload and manage the documents required for your vendor approval."
      />

      {needAction.length > 0 && (
        <div className="mb-5 space-y-2">
          {needAction.map((d) => (
            <div key={d.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-rose-50 p-4 ring-1 ring-rose-200">
              <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-rose-800">Action required: {docLabel(d.doc_type)} needs replacement.</p>
                {d.remarks && <p className="text-xs text-rose-600">Admin remarks: {d.remarks}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      <SectionCard title="Verification Documents" actions={
        <span className="text-xs text-slate-400">Status: <StatusBadge status={vendor.approval_status} tone={vendor.approval_status === "approved" ? "green" : "amber"} /></span>
      }>
        <div className="divide-y divide-slate-100">
          <div className="grid grid-cols-[1fr_auto] gap-2 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            <span>Document</span><span>Status</span>
          </div>
          {VENDOR_DOC_TYPES.map((d) => {
            const doc = byType[d.key] || null;
            return (
              <div key={d.key} className="border-t border-slate-100 px-3 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800">
                      {d.label} {d.required && <span className="text-rose-500">*</span>}
                    </p>
                    {doc ? (
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
                        <span>Uploaded {doc.created_date ? new Date(doc.created_date).toLocaleDateString() : "—"}</span>
                        {doc.expiry_date && <span>Expires {new Date(doc.expiry_date).toLocaleDateString()}</span>}
                        <span>v{doc.version || 1}</span>
                        {doc.remarks && <span className="text-rose-600">Remarks: {doc.remarks}</span>}
                      </p>
                    ) : (
                      <p className="mt-0.5 text-xs text-slate-400">{d.required ? "Mandatory — not uploaded yet" : "Optional"}</p>
                    )}
                  </div>
                  <StatusBadge
                    status={doc ? doc.status : "not_uploaded"}
                    tone={DOC_STATUS_TONES[doc ? doc.status : "not_uploaded"]}
                  />
                </div>
                <div className="mt-2">
                  {busy
                    ? <div className="flex items-center gap-2 text-xs text-slate-400"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</div>
                    : <DocUploadField label="" required={d.required} doc={doc ? { name: doc.name, file_uri: doc.file_url } : null} onUploaded={(val) => upsert(d.key, val)} />}
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
}