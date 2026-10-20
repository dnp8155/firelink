import React, { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { PageHeader, EmptyState } from "@/components/ui-bits";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import QueueHeader from "@/components/admin/QueueHeader";
import ProductRow from "@/components/admin/ProductRow";
import ApprovalDialog from "@/components/admin/ApprovalDialog";
import { Image } from "@/components/ui/image";
import { logAudit } from "@/lib/auditLog";
import { countByField, formatDate } from "@/lib/format";
import { formatINR } from "@/hooks/useList";
import { PackageCheck, Check, X } from "lucide-react";

const TABS = [
  { key: "pending", label: "Awaiting review" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "disabled", label: "Disabled" },
  { key: "all", label: "All products" },
];

export default function ProductApprovals() {
  const { toast } = useToast();
  const [statusKey, setStatusKey] = useState("pending");
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [busy, setBusy] = useState(null);
  const [version, setVersion] = useState(0);

  const loadCounts = useCallback(async () => {
    const res = await base44.entities.Product.aggregate({ groupBy: "approval_status" });
    setCounts(countByField(res.rows, "approval_status"));
  }, []);

  const loadRows = useCallback(async () => {
    setLoading(true);
    const filter = {};
    if (statusKey !== "all") filter.approval_status = statusKey;
    const term = query.trim();
    if (term) filter.$or = [{ name: { $regex: term, $options: "i" } }, { sku: { $regex: term, $options: "i" } }];
    const page = await base44.entities.Product.filter(filter, { sort: "-created_date", limit: 50 });
    setRows(page.items || []);
    setLoading(false);
  }, [statusKey, query]);

  useEffect(() => { loadCounts(); }, [loadCounts, version]);
  useEffect(() => {
    const t = setTimeout(loadRows, query.trim() ? 450 : 0);
    return () => clearTimeout(t);
  }, [loadRows, query, version]);

  const openReview = (product) => {
    setActive(product);
    setRemarks(product.approval_remarks || "");
  };

  const decide = async (status, label) => {
    if (!active) return;
    setBusy(status);
    await base44.entities.Product.update(active.id, { approval_status: status });
    await logAudit({ action: `product_${status}`, module: "Product", entityId: active.id, before: active.approval_status, after: status });
    setBusy(null);
    setActive(null);
    setVersion((v) => v + 1);
    toast({ title: label, description: active.name });
  };

  const totalCount = Object.values(counts).reduce((n, c) => n + c, 0);
  const tabs = TABS.map((t) => ({ ...t, count: t.key === "all" ? totalCount : counts[t.key] || 0 }));

  return (
    <div>
      <PageHeader title="Product Approvals" icon={PackageCheck} subtitle="Check specifications and certifications before listing products." />
      <QueueHeader tabs={tabs} value={statusKey} onChange={setStatusKey} query={query} onQueryChange={setQuery} placeholder="Search by product name or SKU…" />

      {loading ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}</div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <EmptyState
            icon={PackageCheck}
            title={statusKey === "pending" ? "Nothing awaiting approval" : "No products here"}
            description={statusKey === "pending" ? "Products submitted by vendors will appear here for review." : "No products match this filter or search."}
          />
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((p) => <ProductRow key={p.id} product={p} onReview={() => openReview(p)} />)}
        </div>
      )}

      <ApprovalDialog
        open={!!active}
        onClose={() => setActive(null)}
        title={active?.name || ""}
        subtitle={[active?.sku, active?.vendor_name].filter(Boolean).join(" · ")}
        status={active?.approval_status}
        hero={active?.image_url ? (
          <Image src={active.image_url} alt={active.name || "Product"} className="h-40 w-full rounded-xl" />
        ) : null}
        details={active ? [
          { label: "Brand", value: active.brand },
          { label: "Manufacturer", value: active.manufacturer },
          { label: "Category", value: [active.category, active.subcategory].filter(Boolean).join(" · ") },
          { label: "Vendor", value: active.vendor_name },
          { label: "Price", value: formatINR(active.price) },
          { label: "MRP", value: active.mrp ? formatINR(active.mrp) : "" },
          { label: "Stock", value: active.stock != null ? `${active.stock} ${active.unit || ""}`.trim() : "" },
          { label: "MOQ", value: active.moq ? String(active.moq) : "" },
          { label: "Fire class", value: active.fire_class },
          { label: "Capacity", value: active.capacity },
          { label: "Standards", value: active.applicable_standards },
          { label: "Certifications", value: (active.certifications || []).join(", ") },
          { label: "Warranty", value: active.warranty_months ? `${active.warranty_months} months` : "" },
          { label: "HSN code", value: active.hsn_code },
          { label: "Submitted on", value: formatDate(active.created_date) },
        ] : []}
        remarks={remarks}
        onRemarksChange={setRemarks}
        remarksLabel="Review note (internal)"
        busy={busy}
        actions={[
          { label: "Reject", variant: "outline", icon: <X className="h-4 w-4" />, onClick: () => decide("rejected", "Product rejected"), loading: busy === "rejected" },
          { label: "Approve product", icon: <Check className="h-4 w-4" />, onClick: () => decide("approved", "Product approved"), loading: busy === "approved" },
        ]}
      />
    </div>
  );
}