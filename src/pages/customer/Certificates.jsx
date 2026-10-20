import React from "react";
import { useList } from "@/hooks/useList";
import { PageHeader, SectionCard, EmptyState } from "@/components/ui-bits";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import { Award, Download, Eye, AlertCircle, Calendar, Building2, FileDown } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

export default function Certificates() {
  const { toast } = useToast();
  const certs = useList("Certificate", {}, "-expiry_date", 200);

  return (
    <div>
      <PageHeader title="Certificates" subtitle="Track certificate validity and download copies." />

      {certs.data.length === 0 ? <SectionCard><EmptyState icon={Award} title="No certificates" description="Certificates uploaded for your assets will appear here." /></SectionCard> : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {certs.data.map((c) => (
            <div key={c.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><Award className="h-5 w-5" /></div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{c.title}</p>
                    <p className="text-xs text-slate-500">{c.certificate_number}</p>
                  </div>
                </div>
                <StatusBadge status={c.status} tone={statusTone(c.status)} />
              </div>
              <div className="mt-3 space-y-1.5 text-xs text-slate-500">
                <p className="flex items-center gap-1.5"><Building2 className="h-3 w-3" /> {c.organization_name || "—"}</p>
                <p className="flex items-center gap-1.5"><Calendar className="h-3 w-3" /> Issued: {c.issue_date || "—"}</p>
                <p className="flex items-center gap-1.5"><AlertCircle className="h-3 w-3" /> Expires: {c.expiry_date || "—"}</p>
                {c.asset_name && <p>Asset: {c.asset_name}</p>}
              </div>
              <div className="mt-3 flex gap-2 border-t border-slate-50 pt-3">
                {c.file_url ? (
                  <a href={c.file_url} target="_blank" rel="noopener noreferrer" className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"><Eye className="h-3.5 w-3.5" /> Preview</a>
                ) : (
                  <button disabled className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-100 px-3 py-1.5 text-xs font-medium text-slate-300"><Eye className="h-3.5 w-3.5" /> Preview</button>
                )}
                {c.file_url ? (
                  <a href={c.file_url} download className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"><Download className="h-3.5 w-3.5" /> Download</a>
                ) : (
                  <button
                    onClick={async () => {
                      toast({ title: "Generating PDF…" });
                      const { downloadCertificate } = await import("@/lib/certificate");
                      let vendor = null;
                      try { const v = await base44.entities.Vendor.filter({}, "-created_date", 5); vendor = v[0] || null; } catch {}
                      downloadCertificate(c, vendor);
                    }}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                  >
                    <FileDown className="h-3.5 w-3.5" /> Download PDF
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}