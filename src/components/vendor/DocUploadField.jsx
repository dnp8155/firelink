import React, { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, Loader2, Eye, CheckCircle2, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

// Reusable private-document upload field (GST, PAN, licenses…)
// doc: { name, file_uri } | null   onUploaded({ name, file_uri })
export default function DocUploadField({ label, required = false, doc, onUploaded }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const pick = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setBusy(true);
    setError("");
    base44.integrations.Core.UploadPrivateFile({ file })
      .then((res) => onUploaded({ name: file.name, file_uri: res.file_uri }))
      .catch((err) => setError(err.message || "Upload failed"))
      .finally(() => setBusy(false));
    e.target.value = "";
  };

  const view = async () => {
    setError("");
    try {
      const res = await base44.functions.invoke("get_vendor_document_url", { file_uri: doc.file_uri });
      if (res && res.data && res.data.signed_url) window.open(res.data.signed_url, "_blank");
      else setError("Could not open file.");
    } catch (err) {
      setError(err.message || "Could not open file.");
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-800">
          {label} {required && <span className="text-rose-500">*</span>}
        </p>
        {doc ? (
          <p className="truncate text-xs text-emerald-600">{doc.name}</p>
        ) : (
          <p className="text-xs text-slate-400">PDF, JPG or PNG · max 10MB</p>
        )}
        {error && <p className="text-xs text-rose-600">{error}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {doc ? (
          <>
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
              <CheckCircle2 className="h-3.5 w-3.5" /> Uploaded
            </span>
            <button
              type="button"
              onClick={view}
              className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              title="View document"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => inputRef.current && inputRef.current.click()}
              className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              title="Replace document"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current && inputRef.current.click()}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
              "bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60"
            )}
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            {busy ? "Uploading…" : "Upload"}
          </button>
        )}
        <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={pick} />
      </div>
    </div>
  );
}