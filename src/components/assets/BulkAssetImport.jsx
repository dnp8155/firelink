import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Upload, FileSpreadsheet, Download, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";

const TEMPLATE_HEADERS = ["name", "category", "brand", "model", "site_name", "building", "floor", "zone", "install_date", "status", "condition"];

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if (ch === "," && !inQuotes) { result.push(current.trim()); current = ""; continue; }
    current += ch;
  }
  result.push(current.trim());
  return result;
}

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().trim());
  const rows = lines.slice(1).map((line) => {
    const vals = parseCSVLine(line);
    const obj = {};
    headers.forEach((h, i) => { obj[h] = vals[i] || ""; });
    return obj;
  });
  return { headers, rows };
}

export default function BulkAssetImport({ open, onClose, onImported, organizationDefaults }) {
  const { toast } = useToast();
  const fileRef = useRef(null);
  const [parsing, setParsing] = useState(false);
  const [preview, setPreview] = useState(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  const defaults = {
    organization_id: "org_patel",
    organization_name: "Patel Enterprises",
    ...organizationDefaults,
  };

  const reset = () => {
    setPreview(null);
    setResult(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleFile = async (file) => {
    setParsing(true);
    setResult(null);
    try {
      const text = await file.text();
      const { headers, rows } = parseCSV(text);
      if (!headers.includes("name")) {
        toast({ title: "Invalid CSV", description: "CSV must have a 'name' column. Download the template first.", variant: "destructive" });
        setParsing(false);
        return;
      }
      setPreview({ headers, rows, fileName: file.name });
    } catch (e) {
      toast({ title: "Failed to read file", description: e.message, variant: "destructive" });
    } finally {
      setParsing(false);
    }
  };

  const downloadTemplate = () => {
    const csv = TEMPLATE_HEADERS.join(",") + "\n" +
      "CO2 Extinguisher,Extinguisher,Safex,SX-5,Main Plant,Block A,Ground Floor,Zone 1,2024-01-15,active,good\n" +
      "Smoke Detector,Detector,UTC,SD-200,Main Plant,Block B,1st Floor,Zone 2,2024-03-20,active,good\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "firelink_asset_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const doImport = async () => {
    if (!preview || preview.rows.length === 0) return;
    setImporting(true);
    try {
      const records = preview.rows.map((row, idx) => {
        const code = "AST-" + Date.now().toString().slice(-6) + idx;
        return {
          asset_code: code,
          qr_code: "QR" + code,
          name: row.name || "Unnamed Asset",
          category: row.category || "Extinguisher",
          brand: row.brand || "",
          model: row.model || "",
          organization_id: defaults.organization_id,
          organization_name: defaults.organization_name,
          site_name: row.site_name || "",
          building: row.building || "",
          floor: row.floor || "",
          zone: row.zone || "",
          install_date: row.install_date || null,
          status: row.status || "active",
          condition: row.condition || "good",
        };
      });

      const created = await base44.entities.Asset.bulkCreate(records);
      const count = Array.isArray(created) ? created.length : (created?.data?.length || records.length);
      setResult({ success: count, failed: 0, total: records.length });
      toast({ title: "Import successful", description: `${count} assets imported.` });
      onImported?.();
      // Don't auto-close — let user see the result
    } catch (e) {
      setResult({ success: 0, failed: preview.rows.length, total: preview.rows.length, error: e.message });
      toast({ title: "Import failed", description: e.message, variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><FileSpreadsheet className="h-5 w-5 text-emerald-600" /> Bulk Import Assets</DialogTitle>
        </DialogHeader>

        {result ? (
          // ---- Result view ----
          <div className="py-4">
            <div className="flex flex-col items-center text-center">
              {result.failed === 0 ? (
                <CheckCircle2 className="h-12 w-12 text-emerald-500" />
              ) : (
                <AlertTriangle className="h-12 w-12 text-rose-500" />
              )}
              <p className="mt-2 text-lg font-bold text-slate-900">
                {result.success > 0 ? `${result.success} assets imported` : "Import failed"}
              </p>
              {result.failed > 0 && <p className="text-sm text-rose-600">{result.failed} failed</p>}
              {result.error && <p className="mt-2 text-xs text-slate-500">{result.error}</p>}
            </div>
          </div>
        ) : !preview ? (
          // ---- Upload view ----
          <div className="space-y-4">
            <div className="rounded-xl border-2 border-dashed border-slate-200 p-6 text-center">
              {parsing ? (
                <div className="flex flex-col items-center gap-2"><Loader2 className="h-8 w-8 animate-spin text-emerald-500" /><p className="text-sm text-slate-500">Parsing file…</p></div>
              ) : (
                <>
                  <Upload className="mx-auto h-10 w-10 text-slate-300" />
                  <p className="mt-2 text-sm font-medium text-slate-700">Drop CSV file or click to browse</p>
                  <p className="text-xs text-slate-400">CSV with columns: name, category, brand, model, site_name, building, floor, zone, install_date, status, condition</p>
                  <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files[0]; if (f) handleFile(f); }} />
                  <Button variant="outline" className="mt-3" onClick={() => fileRef.current?.click()}>Select CSV File</Button>
                </>
              )}
            </div>
            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
              <p className="text-xs text-slate-500">Need a template?</p>
              <button onClick={downloadTemplate} className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:underline">
                <Download className="h-3.5 w-3.5" /> Download CSV Template
              </button>
            </div>
          </div>
        ) : (
          // ---- Preview view ----
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2">
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-medium text-slate-700">{preview.fileName}</span>
              <span className="ml-auto text-xs font-bold text-emerald-700">{preview.rows.length} rows</span>
            </div>
            <div className="max-h-48 overflow-auto rounded-lg border border-slate-100">
              <table className="w-full text-xs">
                <thead className="bg-slate-50">
                  <tr>{preview.headers.slice(0, 6).map((h) => <th key={h} className="px-2 py-1.5 text-left font-semibold text-slate-500">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {preview.rows.slice(0, 5).map((row, i) => (
                    <tr key={i} className="border-t border-slate-50">
                      {preview.headers.slice(0, 6).map((h) => <td key={h} className="px-2 py-1.5 text-slate-600">{row[h] || "—"}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.rows.length > 5 && <p className="px-2 py-1.5 text-xs text-slate-400">+ {preview.rows.length - 5} more rows</p>}
            </div>
          </div>
        )}

        <DialogFooter>
          {result ? (
            <Button onClick={handleClose}>Done</Button>
          ) : preview ? (
            <>
              <Button variant="outline" onClick={reset}>Choose Different File</Button>
              <Button onClick={doImport} disabled={importing} className="bg-emerald-600 hover:bg-emerald-700">
                {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Import {preview.rows.length} Assets
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={handleClose}>Cancel</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}