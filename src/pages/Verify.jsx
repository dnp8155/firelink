import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Printer } from "lucide-react";
import { LogoFull } from "@/components/Logo";
import VerifyResultCard from "@/components/verify/VerifyResultCard";

// Public QR verification page. Data comes from the verify_qr backend function,
// which returns only safe, non-confidential fields — no private asset details.
export default function Verify() {
  const { qrCode } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await base44.functions.invoke("verify_qr", { qr_code: qrCode });
        if (!alive) return;
        const data = res.data || {};
        setResult(data && data.found === false ? null : data);
      } catch {
        if (alive) setResult(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [qrCode]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/50 print:min-h-0 print:bg-white">
      <div className="mx-auto max-w-lg px-4 py-10">
        <div className="mb-6 flex items-center gap-2.5">
          <LogoFull className="h-9" />
          <p className="text-[11px] font-medium text-orange-600">QR Verification</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-rose-600" />
          </div>
        ) : (
          <VerifyResultCard result={result} code={qrCode} />
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2 print:hidden">
          {result && (
            <>
              <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-medium text-white hover:bg-slate-800">
                <Printer className="h-3.5 w-3.5" /> Print / Save as PDF
              </button>
              <button onClick={async () => {
                const { downloadQrLabel } = await import("@/lib/certificate");
                downloadQrLabel(result);
              }} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50">
                <Printer className="h-3.5 w-3.5" /> Download QR Label
              </button>
            </>
          )}
          <Link to="/" className="ml-auto inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 mt-auto">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to app
          </Link>
        </div>
      </div>
    </div>
  );
}