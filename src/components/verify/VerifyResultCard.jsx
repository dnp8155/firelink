import React from "react";
import { CheckCircle2, XCircle, FileText, ShieldCheck, Building2, Calendar } from "lucide-react";

// Shared result card for the QR verification pages. `result` is the sanitized payload
// returned by the verify_qr backend function (or null when nothing matched).
export default function VerifyResultCard({ result, code }) {
  if (!result) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <XCircle className="mx-auto h-12 w-12 text-rose-500" />
        <h2 className="mt-3 text-lg font-semibold text-slate-900">Not Found</h2>
        <p className="mt-1 text-sm text-slate-500">
          No record matches <span className="font-mono text-slate-700">{code}</span>.
        </p>
        <p className="mt-3 text-xs text-slate-400">
          Check the certificate number printed on the document, or scan the QR code on the asset label.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-100 bg-emerald-50 px-5 py-4">
        <CheckCircle2 className="h-6 w-6 text-emerald-600" />
        <div>
          <p className="text-sm font-semibold text-emerald-800">Verified Successfully</p>
          <p className="text-xs text-emerald-600">This record is authentic and registered on FIRELINK.</p>
        </div>
      </div>
      <div className="space-y-4 p-5">
        <div className="flex items-center gap-2.5">
          <FileText className="h-4 w-4 text-slate-400" />
          <span className="text-sm font-semibold text-slate-900">{result.title}</span>
        </div>
        <Row icon={ShieldCheck} label="Reference" value={result.reference || "—"} />
        <Row icon={Building2} label="Issuing Organization" value={result.organization_name || "—"} />
        <Row icon={Calendar} label="Issue Date" value={result.issue_date || "—"} />
        {result.expiry_date && <Row icon={Calendar} label="Expiry Date" value={result.expiry_date} />}
        <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
          <span className="text-xs font-medium text-slate-500">Status</span>
          <span className="text-sm font-semibold capitalize text-slate-800">{(result.status || "valid").replace(/_/g, " ")}</span>
        </div>
      </div>
    </div>
  );
}

function Row({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-50 pb-3">
      <span className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <Icon className="h-3.5 w-3.5" /> {label}
      </span>
      <span className="text-sm font-medium text-slate-800">{value}</span>
    </div>
  );
}