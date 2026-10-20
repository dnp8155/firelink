import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { orgQuery } from "@/lib/orgScope";
import { PageHeader, SectionCard, KpiCard } from "@/components/ui-bits";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import RecordTable from "@/components/shared/RecordTable";
import { Button } from "@/components/ui/button";
import { BarChart3, Download, Printer, Loader2, Boxes, Award, AlertTriangle, Package, Wrench } from "lucide-react";

const sum = (rows) => (rows || []).reduce((a, r) => a + (r.count || 0), 0);

const toCsv = (title, rows, labelKey) => {
  const lines = [`${title}`, `${labelKey},count`, ...rows.map((r) => `"${r[labelKey] ?? r.status ?? r.category ?? r.condition ?? "—"}",${r.count || 0}`)];
  return lines.join("\n");
};

export default function Reports() {
  const { user } = useAuth();
  const q = orgQuery(user);
  const [loading, setLoading] = useState(true);
  const [r, setR] = useState({ assetsByCategory: [], assetsBySite: [], certStatus: [], capaSeverity: [], requestStatus: [], ordersByStatus: [] });

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const [assetsByCategory, assetsBySite, certStatus, capaSeverity, requestStatus, ordersByStatus] = await Promise.all([
        base44.entities.Asset.aggregate({ query: q, groupBy: "category" }),
        base44.entities.Asset.aggregate({ query: q, groupBy: "site_name" }),
        base44.entities.Certificate.aggregate({ query: q, groupBy: "status" }),
        base44.entities.CAPA.aggregate({ query: q, groupBy: "severity" }),
        base44.entities.ServiceRequest.aggregate({ query: q, groupBy: "status" }),
        base44.entities.Order.aggregate({ query: q, groupBy: "status", sum: ["total"] }),
      ]);
      if (!alive) return;
      setR({
        assetsByCategory: assetsByCategory?.rows || [],
        assetsBySite: assetsBySite?.rows || [],
        certStatus: certStatus?.rows || [],
        capaSeverity: capaSeverity?.rows || [],
        requestStatus: requestStatus?.rows || [],
        ordersByStatus: ordersByStatus?.rows || [],
      });
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [user?.data?.organization_id]);

  const download = () => {
    const csv = [
      toCsv("Assets by category", r.assetsByCategory, "category"),
      "",
      toCsv("Assets by site", r.assetsBySite, "site_name"),
      "",
      toCsv("Certificates by status", r.certStatus, "status"),
      "",
      toCsv("CAPA by severity", r.capaSeverity, "severity"),
      "",
      toCsv("Service requests by status", r.requestStatus, "status"),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `firelink-org-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const orderValue = (r.ordersByStatus || []).reduce((a, x) => a + (x.sum_total || 0), 0);

  if (loading) {
    return <div className="flex items-center justify-center py-24 text-slate-400"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  }

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Organization-wide asset, compliance and spend summaries."
        icon={BarChart3}
        actions={
          <>
            <Button variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print</Button>
            <Button onClick={download}><Download className="h-4 w-4" /> Export CSV</Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Assets" value={sum(r.assetsByCategory)} icon={Boxes} tone="violet" sub={`${r.assetsByCategory.length} categories`} />
        <KpiCard label="Certificates" value={sum(r.certStatus)} icon={Award} tone="green" sub={`${r.certStatus.length} statuses`} />
        <KpiCard label="CAPA findings" value={sum(r.capaSeverity)} icon={AlertTriangle} tone="amber" sub="By severity" />
        <KpiCard label="Order value" value={`₹${Number(orderValue).toLocaleString("en-IN")}`} icon={Package} tone="blue" sub={`${sum(r.ordersByStatus)} orders`} />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <SectionCard title="Assets by category">
          <RecordTable
            columns={[
              { key: "category", label: "Category", render: (x) => x.category || "Uncategorised" },
              { key: "count", label: "Assets", headClassName: "px-4 py-3 text-right", cellClassName: "px-4 py-3 text-right font-semibold text-slate-800" },
            ]}
            rows={r.assetsByCategory}
            empty={{ icon: Boxes, title: "No assets yet" }}
          />
        </SectionCard>

        <SectionCard title="Assets by site">
          <RecordTable
            columns={[
              { key: "site_name", label: "Site", render: (x) => x.site_name || "Unassigned" },
              { key: "count", label: "Assets", headClassName: "px-4 py-3 text-right", cellClassName: "px-4 py-3 text-right font-semibold text-slate-800" },
            ]}
            rows={r.assetsBySite}
            empty={{ icon: Boxes, title: "No assets yet" }}
          />
        </SectionCard>

        <SectionCard title="Certificates by status">
          <RecordTable
            columns={[
              { key: "status", label: "Status", render: (x) => <StatusBadge status={x.status} tone={statusTone(x.status)} /> },
              { key: "count", label: "Certificates", headClassName: "px-4 py-3 text-right", cellClassName: "px-4 py-3 text-right font-semibold text-slate-800" },
            ]}
            rows={r.certStatus}
            empty={{ icon: Award, title: "No certificates yet" }}
          />
        </SectionCard>

        <SectionCard title="CAPA by severity">
          <RecordTable
            columns={[
              { key: "severity", label: "Severity", render: (x) => <StatusBadge status={x.severity} tone={x.severity === "critical" || x.severity === "high" ? "red" : "amber"} /> },
              { key: "count", label: "Findings", headClassName: "px-4 py-3 text-right", cellClassName: "px-4 py-3 text-right font-semibold text-slate-800" },
            ]}
            rows={r.capaSeverity}
            empty={{ icon: AlertTriangle, title: "No CAPA records" }}
          />
        </SectionCard>

        <SectionCard title="Service requests by status">
          <RecordTable
            columns={[
              { key: "status", label: "Status", render: (x) => <StatusBadge status={x.status} tone={statusTone(x.status)} /> },
              { key: "count", label: "Requests", headClassName: "px-4 py-3 text-right", cellClassName: "px-4 py-3 text-right font-semibold text-slate-800" },
            ]}
            rows={r.requestStatus}
            empty={{ icon: Wrench, title: "No service requests" }}
          />
        </SectionCard>

        <SectionCard title="Orders by status">
          <RecordTable
            columns={[
              { key: "status", label: "Status", render: (x) => <StatusBadge status={x.status} tone={statusTone(x.status)} /> },
              { key: "count", label: "Orders", headClassName: "px-4 py-3 text-right", cellClassName: "px-4 py-3 text-right font-semibold text-slate-800" },
              { key: "sum_total", label: "Value", headClassName: "px-4 py-3 text-right", cellClassName: "px-4 py-3 text-right font-semibold text-slate-800", render: (x) => `₹${Number(x.sum_total || 0).toLocaleString("en-IN")}` },
            ]}
            rows={r.ordersByStatus}
            empty={{ icon: Package, title: "No orders yet" }}
          />
        </SectionCard>
      </div>
    </div>
  );
}