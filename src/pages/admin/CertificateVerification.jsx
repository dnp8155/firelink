import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { PageHeader, SectionCard, KpiCard } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Search, Award, ShieldCheck, Calendar } from "lucide-react";
import { StatusBadge, statusTone } from "@/components/StatusBadge";

export default function CertificateVerification() {
  const { toast } = useToast();
  const [certNo, setCertNo] = useState("");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [stats, setStats] = useState({ total: 0, valid: 0, expiring: 0 });

  useEffect(() => {
    (async () => {
      const { rows } = await base44.entities.Certificate.aggregate({ groupBy: "status" });
      const by = {};
      (rows || []).forEach((r) => { by[r.status] = r.count || 0; });
      setStats({
        total: (rows || []).reduce((s, r) => s + (r.count || 0), 0),
        valid: by.valid || 0,
        expiring: by.expiring_soon || 0,
      });
    })();
  }, []);

  const verify = async () => {
    if (!certNo.trim()) {
      toast({ title: "Enter a certificate number", variant: "destructive" });
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      const certs = await base44.entities.Certificate.filter({ certificate_number: certNo.trim() }, { sort: "-created_date", limit: 5 });
      if ((certs.items || []).length > 0) {
        setResult({ type: "certificate", data: certs.items[0] });
      } else {
        const assets = await base44.entities.Asset.filter({ qr_code: certNo.trim() }, { sort: "-created_date", limit: 5 });
        setResult((assets.items || []).length > 0 ? { type: "asset", data: assets.items[0] } : { found: false });
      }
    } catch (e) {
      toast({ title: "Verification failed", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader title="Certificate Verification" subtitle="Verify any certificate or asset QR code by number." icon={ShieldCheck} />
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Certificates Issued" value={stats.total} icon={Award} tone="rose" />
        <KpiCard label="Valid" value={stats.valid} icon={ShieldCheck} tone="green" />
        <KpiCard label="Expiring Soon" value={stats.expiring} icon={Calendar} tone="amber" />
      </div>

      <SectionCard title="Verify Certificate / Asset">
        <div className="p-5">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input value={certNo} onChange={(e) => setCertNo(e.target.value)} placeholder="Enter certificate number or QR code…" className="pl-9" onKeyDown={(e) => e.key === "Enter" && verify()} />
            </div>
            <Button onClick={verify} disabled={busy} className="bg-rose-600 hover:bg-rose-700">{busy ? "Verifying…" : "Verify"}</Button>
          </div>

          {result && (
            <div className="mt-5">
              {result.found === false ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-center">
                  <p className="text-sm font-semibold text-rose-700">No matching record found</p>
                  <p className="mt-1 text-xs text-rose-500">This certificate/QR may be invalid or fraudulent.</p>
                </div>
              ) : (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-emerald-600" />
                    <span className="text-sm font-semibold capitalize text-emerald-700">Verified — {result.type}</span>
                  </div>
                  <div className="grid gap-2 text-sm sm:grid-cols-2">
                    {result.type === "certificate" ? (
                      <>
                        <div><span className="text-slate-500">Number:</span> <span className="font-medium text-slate-800">{result.data.certificate_number}</span></div>
                        <div><span className="text-slate-500">Title:</span> <span className="font-medium text-slate-800">{result.data.title}</span></div>
                        <div><span className="text-slate-500">Type:</span> <span className="font-medium capitalize text-slate-800">{result.data.type}</span></div>
                        <div><span className="text-slate-500">Issued By:</span> <span className="font-medium text-slate-800">{result.data.issued_by}</span></div>
                        <div><span className="text-slate-500">Issue Date:</span> <span className="font-medium text-slate-800">{result.data.issue_date}</span></div>
                        <div><span className="text-slate-500">Expiry:</span> <span className="font-medium text-slate-800">{result.data.expiry_date || "—"}</span></div>
                        <div className="sm:col-span-2"><span className="text-slate-500">Status:</span> <StatusBadge status={result.data.status} tone={statusTone(result.data.status)} /></div>
                      </>
                    ) : (
                      <>
                        <div><span className="text-slate-500">Asset Code:</span> <span className="font-medium text-slate-800">{result.data.asset_code}</span></div>
                        <div><span className="text-slate-500">Name:</span> <span className="font-medium text-slate-800">{result.data.name}</span></div>
                        <div><span className="text-slate-500">Category:</span> <span className="font-medium capitalize text-slate-800">{result.data.category}</span></div>
                        <div><span className="text-slate-500">Brand:</span> <span className="font-medium text-slate-800">{result.data.brand}</span></div>
                        <div><span className="text-slate-500">Status:</span> <StatusBadge status={result.data.status} tone={statusTone(result.data.status)} /></div>
                        <div><span className="text-slate-500">Condition:</span> <StatusBadge status={result.data.condition} tone={statusTone(result.data.condition)} /></div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );
}