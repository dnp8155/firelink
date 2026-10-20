import React, { useCallback, useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useList } from "@/hooks/useList";
import { useAuth } from "@/lib/AuthContext";
import { KpiCard, PageHeader, SectionCard, EmptyState } from "@/components/ui-bits";
import ReportRow from "@/components/engineer/ReportRow";
import DocumentFormDialog from "@/components/shared/DocumentFormDialog";
import QueueHeader from "@/components/admin/QueueHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { FileBarChart, Plus, Upload, ShieldCheck } from "lucide-react";

const SEARCH_TABS = [{ key: "all", label: "Engineering reports" }];

const monthStart = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
};

export default function EngineerReports() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [counts, setCounts] = useState(null);
  const [version, setVersion] = useState(0);

  const filter = useMemo(() => {
    const f = { type: "engineering_report" };
    const term = query.trim();
    if (term) f.name = { $regex: term, $options: "i" };
    return f;
  }, [query]);

  const reports = useList("Document", filter, "-created_date", 50);

  const loadCounts = useCallback(async () => {
    const [total, recent] = await Promise.all([
      base44.entities.Document.count({ type: "engineering_report" }),
      base44.entities.Document.count({ type: "engineering_report", created_date: { $gte: monthStart() } }),
    ]);
    setCounts({ total, recent });
  }, []);

  useEffect(() => { loadCounts(); }, [loadCounts, version]);

  const afterChange = () => {
    reports.reload();
    setVersion((v) => v + 1);
  };

  const view = async (report) => {
    if (!report.file_url) {
      toast({ title: "No file attached", variant: "destructive" });
      return;
    }
    try {
      const res = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: report.file_url });
      window.open(res?.signed_url || report.file_url, "_blank", "noopener");
    } catch (e) {
      toast({ title: "Could not open report", description: e.message, variant: "destructive" });
    }
  };

  const remove = async (report) => {
    try {
      await base44.entities.Document.delete(report.id);
      toast({ title: "Report deleted", description: report.name });
      afterChange();
    } catch (e) {
      toast({ title: "Could not delete report", description: e.message, variant: "destructive" });
    }
  };

  const show = (v) => (v == null ? "—" : v);

  return (
    <div>
      <PageHeader
        title="Reports"
        icon={FileBarChart}
        subtitle="Design reports, survey findings and compliance documents kept with the project record."
        actions={
          <Button onClick={() => setUploadOpen(true)} className="bg-rose-600 hover:bg-rose-700">
            <Plus className="h-4 w-4" /> Upload Report
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Reports on File" value={show(counts?.total)} icon={FileBarChart} tone="violet" />
        <KpiCard label="Added This Month" value={show(counts?.recent)} icon={Upload} tone="blue" />
      </div>

      <div className="mt-6">
        <QueueHeader
          tabs={SEARCH_TABS}
          value="all"
          onChange={() => {}}
          query={query}
          onQueryChange={setQuery}
          placeholder="Search report name…"
        />
      </div>

      {reports.loading ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}</div>
      ) : reports.data.length === 0 ? (
        <SectionCard>
          <EmptyState
            icon={FileBarChart}
            title="No reports yet"
            description="Upload fire load calculations, hydraulic designs, survey findings and BOQs so they stay with the engineering record."
            action={<Button onClick={() => setUploadOpen(true)}><Plus className="h-4 w-4" /> Upload Report</Button>}
          />
        </SectionCard>
      ) : (
        <SectionCard>
          <div className="divide-y divide-slate-50">
            {reports.data.map((r) => (
              <ReportRow key={r.id} report={r} onView={view} onDelete={remove} />
            ))}
          </div>
        </SectionCard>
      )}

      <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
        <p className="text-xs text-slate-500">
          Report files are stored privately — no public link exists, and access follows the app's own permissions.
        </p>
      </div>

      <DocumentFormDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        user={user}
        defaultType="engineering_report"
        onSaved={afterChange}
      />
    </div>
  );
}