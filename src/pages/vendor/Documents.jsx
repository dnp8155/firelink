import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useList } from "@/hooks/useList";
import { useVendor, logVendorAction, docLabel } from "@/lib/vendor";
import { PageHeader, SectionCard, EmptyState } from "@/components/ui-bits";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import DocUploadField from "@/components/vendor/DocUploadField";
import { FolderOpen, Plus, Eye, Trash2 } from "lucide-react";

const EXTRA_TYPES = ["contract", "invoice", "report", "other"];

export default function Documents() {
  const { vendor } = useVendor();
  const { toast } = useToast();
  const list = useList("VendorDocument", {}, "-created_date", 200);
  const [open, setOpen] = useState(false);
  const [docType, setDocType] = useState("other");
  const [expiry, setExpiry] = useState("");
  const [file, setFile] = useState(null);

  const mine = list.data.filter((d) => vendor && d.vendor_id === vendor.id);

  const view = async (d) => {
    try {
      const res = await base44.functions.invoke("get_vendor_document_url", { file_uri: d.file_url });
      if (res && res.data && res.data.signed_url) window.open(res.data.signed_url, "_blank");
      else toast({ title: "File not available", variant: "destructive" });
    } catch (e) {
      toast({ title: "Could not open file", description: e.message, variant: "destructive" });
    }
  };

  const remove = async (d) => {
    try {
      await base44.entities.VendorDocument.delete(d.id);
      toast({ title: "Document deleted" });
      list.reload();
    } catch (e) {
      toast({ title: "Delete failed", description: e.message, variant: "destructive" });
    }
  };

  const save = async () => {
    if (!file) { toast({ title: "Please attach a file.", variant: "destructive" }); return; }
    if (!vendor) { toast({ title: "No vendor profile on this account", description: "Sign in with your vendor account to save documents.", variant: "destructive" }); return; }
    try {
      await base44.entities.VendorDocument.create({
        vendor_id: vendor.id, doc_type: docType, name: file.name,
        file_url: file.file_uri, status: "uploaded", expiry_date: expiry || null, version: 1,
      });
      await logVendorAction("Document uploaded", "Vendor Documents", docLabel(docType));
      toast({ title: "Document uploaded" });
      setOpen(false); setFile(null); setExpiry("");
      list.reload();
    } catch (e) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div>
      <PageHeader title="Documents" icon={FolderOpen} subtitle="Your business document vault — contracts, invoices, reports and certificates."
        actions={<Button onClick={() => setOpen(true)} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4" /> Upload Document</Button>} />

      {list.loading ? (
        <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-200/60" />)}</div>
      ) : mine.length === 0 ? (
        <SectionCard>
          <EmptyState icon={FolderOpen} title="No documents" description="Upload company documents, contracts, invoices and reports for secure storage."
            action={<Button onClick={() => setOpen(true)} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4" /> Upload Document</Button>} />
        </SectionCard>
      ) : (
        <SectionCard>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3 font-medium">Document</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Uploaded</th>
                <th className="px-5 py-3 font-medium">Expiry</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-50">
                {mine.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-3 font-medium text-slate-800">{d.name || docLabel(d.doc_type)}</td>
                    <td className="px-5 py-3 text-slate-600 capitalize">{docLabel(d.doc_type)}</td>
                    <td className="px-5 py-3 text-slate-500">{d.created_date ? new Date(d.created_date).toLocaleDateString() : "—"}</td>
                    <td className="px-5 py-3 text-slate-500">{d.expiry_date ? new Date(d.expiry_date).toLocaleDateString() : "—"}</td>
                    <td className="px-5 py-3"><StatusBadge status={d.status} tone={d.status === "approved" ? "green" : d.status === "rejected" || d.status === "replacement_required" ? "red" : "amber"} /></td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1.5">
                        <button onClick={() => view(d)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"><Eye className="h-4 w-4" /></button>
                        <button onClick={() => remove(d)} className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      <Dialog open={open} onOpenChange={(o) => !o && setOpen(false)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Upload Document</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Document Type</Label>
              <select value={docType} onChange={(e) => setDocType(e.target.value)} className="mt-1.5 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm">
                <optgroup label="Verification">
                  {["gst_certificate", "pan", "company_registration", "address_proof", "bank_proof", "signatory_id"].map((t) => <option key={t} value={t}>{docLabel(t)}</option>)}
                </optgroup>
                <optgroup label="Business">
                  {EXTRA_TYPES.map((t) => <option key={t} value={t}>{docLabel(t)}</option>)}
                </optgroup>
              </select>
            </div>
            <div><Label>Expiry Date (optional)</Label><Input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} /></div>
            <DocUploadField label="" doc={file ? { name: file.name, file_uri: file.file_uri } : null} onUploaded={setFile} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} className="bg-emerald-600 hover:bg-emerald-700">Save Document</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}