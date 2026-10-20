import React, { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { PageHeader, EmptyState } from "@/components/ui-bits";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import QueueHeader from "@/components/admin/QueueHeader";
import VendorRow from "@/components/admin/VendorRow";
import ApprovalDialog from "@/components/admin/ApprovalDialog";
import { logAudit } from "@/lib/auditLog";
import { countByField, formatDate } from "@/lib/format";
import { Store, Check, X, FileWarning } from "lucide-react";

const QUEUE_STATUSES = ["submitted", "under_review", "documents_required"];
const TABS = [
  { key: "queue", label: "Awaiting review" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All vendors" },
];

const EXTRA_DOCS = [
  ["bank_proof_url", "bank proof"],
  ["digital_signature_url", "digital signature"],
  ["auth_signature_url", "authorised signature"],
  ["manufacturer_auth_url", "manufacturer authorisation"],
];

export default function VendorApprovals() {
  const { toast } = useToast();
  const [statusKey, setStatusKey] = useState("queue");
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);
  const [docs, setDocs] = useState({ loading: false, items: [] });
  const [remarks, setRemarks] = useState("");
  const [busy, setBusy] = useState(null);
  const [version, setVersion] = useState(0);

  const loadCounts = useCallback(async () => {
    const res = await base44.entities.Vendor.aggregate({ groupBy: "approval_status" });
    setCounts(countByField(res.rows, "approval_status"));
  }, []);

  const loadRows = useCallback(async () => {
    setLoading(true);
    const filter = {};
    if (statusKey === "queue") filter.approval_status = { $in: QUEUE_STATUSES };
    else if (statusKey !== "all") filter.approval_status = statusKey;
    const term = query.trim();
    if (term) filter.$or = [{ company_name: { $regex: term, $options: "i" } }, { email: { $regex: term, $options: "i" } }];
    const page = await base44.entities.Vendor.filter(filter, { sort: "-created_date", limit: 50 });
    setRows(page.items || []);
    setLoading(false);
  }, [statusKey, query]);

  useEffect(() => { loadCounts(); }, [loadCounts, version]);
  useEffect(() => {
    const t = setTimeout(loadRows, query.trim() ? 450 : 0);
    return () => clearTimeout(t);
  }, [loadRows, query, version]);

  const openReview = async (vendor) => {
    setActive(vendor);
    setRemarks(vendor.admin_remarks || "");
    setDocs({ loading: true, items: [] });
    const page = await base44.entities.VendorDocument.filter({ vendor_id: vendor.id }, { sort: "-created_date", limit: 25 });
    const uploaded = (page.items || []).map((d) => ({ id: d.id, type: d.doc_type, status: d.status, file_url: d.file_url }));
    const extra = EXTRA_DOCS.filter(([field]) => vendor[field]).map(([field, label]) => ({ id: field, type: label, status: "uploaded", file_url: vendor[field] }));
    setDocs({
      loading: false,
      items: [...uploaded, ...extra].map((d) => ({ ...d, onView: () => viewDocument(d.file_url) })),
    });
  };

  const viewDocument = async (fileUrl) => {
    if (!fileUrl) return;
    const res = await base44.functions.invoke("get_vendor_document_url", { file_uri: fileUrl });
    const url = res?.data?.signed_url;
    if (url) window.open(url, "_blank", "noopener");
    else toast({ title: "Could not open document", description: "The file link is unavailable right now.", variant: "destructive" });
  };

  const decide = async (status, label) => {
    if (!active) return;
    setBusy(status);
    const patch = { approval_status: status, admin_remarks: remarks || null };
    if (status === "rejected") patch.rejection_reason = remarks || null;
    await base44.entities.Vendor.update(active.id, patch);
    await logAudit({ action: `vendor_${status}`, module: "Vendor", entityId: active.id, before: active.approval_status, after: status });
    setBusy(null);
    setActive(null);
    setVersion((v) => v + 1);
    toast({ title: label, description: active.company_name });
  };

  const totalCount = Object.values(counts).reduce((n, c) => n + c, 0);
  const tabs = TABS.map((t) => ({
    ...t,
    count: t.key === "queue"
      ? QUEUE_STATUSES.reduce((n, k) => n + (counts[k] || 0), 0)
      : t.key === "all" ? totalCount : counts[t.key] || 0,
  }));

  return (
    <div>
      <PageHeader title="Vendor Approvals" icon={Store} subtitle="Verify applications, documents and compliance details before onboarding." />
      <QueueHeader tabs={tabs} value={statusKey} onChange={setStatusKey} query={query} onQueryChange={setQuery} placeholder="Search by company or email…" />

      {loading ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}</div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <EmptyState
            icon={Store}
            title={statusKey === "queue" ? "Review queue is clear" : "No vendors here"}
            description={statusKey === "queue" ? "New vendor applications land here for verification." : "No vendors match this filter or search."}
          />
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((v) => <VendorRow key={v.id} vendor={v} onReview={() => openReview(v)} />)}
        </div>
      )}

      <ApprovalDialog
        open={!!active}
        onClose={() => setActive(null)}
        title={active?.company_name || ""}
        subtitle={active?.trade_name || active?.website || ""}
        status={active?.approval_status}
        details={active ? [
          { label: "Contact person", value: active.contact_person },
          { label: "Phone", value: active.phone },
          { label: "Email", value: active.email },
          { label: "Vendor type", value: active.vendor_type },
          { label: "GST number", value: active.gst_number },
          { label: "PAN", value: active.pan_number },
          { label: "Location", value: [active.city, active.state, active.pincode].filter(Boolean).join(", ") },
          { label: "Registered address", value: active.address },
          { label: "Year established", value: active.year_established ? String(active.year_established) : "" },
          { label: "Categories", value: (active.categories || []).join(", ") },
          { label: "Bank", value: [active.bank_name, active.account_holder, active.ifsc_code].filter(Boolean).join(" · ") },
          { label: "Profile completion", value: `${active.profile_completion || 0}%` },
          { label: "Applied on", value: formatDate(active.created_date) },
        ] : []}
        documents={docs}
        remarks={remarks}
        onRemarksChange={setRemarks}
        remarksLabel="Note for the vendor (optional — required when rejecting)"
        busy={busy}
        actions={[
          { label: "Request documents", variant: "outline", icon: <FileWarning className="h-4 w-4" />, onClick: () => decide("documents_required", "Documents requested"), loading: busy === "documents_required" },
          { label: "Reject", variant: "outline", icon: <X className="h-4 w-4" />, onClick: () => decide("rejected", "Vendor rejected"), loading: busy === "rejected" },
          { label: "Approve vendor", icon: <Check className="h-4 w-4" />, onClick: () => decide("approved", "Vendor approved"), loading: busy === "approved" },
        ]}
      />
    </div>
  );
}