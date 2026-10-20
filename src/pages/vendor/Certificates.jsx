import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useList } from "@/hooks/useList";
import { useVendor, logVendorAction } from "@/lib/vendor";
import { PageHeader, SectionCard, EmptyState } from "@/components/ui-bits";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import DocUploadField from "@/components/vendor/DocUploadField";
import { Award, Plus, Eye, Trash2, Loader2 } from "lucide-react";

const CERT_TYPES = ["Product Certificate", "Company Certificate", "Service Certification", "Technician Certificate", "Manufacturer Authorization", "ISO Certificate", "Other"];

const EMPTY = { title: "", type: CERT_TYPES[0], certificate_number: "", issued_by: "", issue_date: "", expiry_date: "", file: null };

const certStatus = (expiry) => {
  if (!expiry) return "valid";
  const days = (new Date(expiry).getTime() - Date.now()) / 86400000;
  if (days < 0) return "expired";
  if (days < 60) return "expiring soon";
  return "valid";
};

export default function Certificates() {
  const { vendor } = useVendor();
  const { toast } = useToast();
  const list = useList("Certificate", {}, "-created_date", 200);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const mine = list.data.filter((c) => (vendor && c.organization_id === vendor.id) || c.created_by_id);

  const save = async () => {
    if (!form.title || !vendor) { toast({ title: "Certificate name is required.", variant: "destructive" }); return; }
    if (!form.file) { toast({ title: "Please attach the certificate document.", variant: "destructive" }); return; }
    setSaving(true);
    try {
      await base44.entities.Certificate.create({
        certificate_number: form.certificate_number || "CERT-" + Date.now().toString().slice(-6),
        title: form.title,
        type: form.type,
        issued_by: form.issued_by || "FireLink Vendor",
        issue_date: form.issue_date || null,
        expiry_date: form.expiry_date || null,
        file_url: form.file.file_uri,
        organization_id: vendor.id,
        organization_name: vendor.company_name,
        status: "valid",
      });
      await logVendorAction("Certificate uploaded", "Vendor Certificates", form.title);
      toast({ title: "Certificate added" });
      setOpen(false);
      setForm(EMPTY);
      list.reload();
    } catch (e) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const view = async (c) => {
    try {
      const res = await base44.functions.invoke("get_vendor_document_url", { file_uri: c.file_url });
      if (res && res.data && res.data.signed_url) window.open(res.data.signed_url, "_blank");
      else toast({ title: "File not available", variant: "destructive" });
    } catch (e) {
      toast({ title: "Could not open file", description: e.message, variant: "destructive" });
    }
  };

  const remove = async (c) => {
    try {
      await base44.entities.Certificate.delete(c.id);
      toast({ title: "Certificate deleted" });
      list.reload();
    } catch (e) {
      toast({ title: "Delete failed", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div>
      <PageHeader title="Certificates" icon={Award} subtitle="Company, product, service and technician certificates with expiry tracking."
        actions={<Button onClick={() => setOpen(true)} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4" /> Add Certificate</Button>} />

      {list.loading ? (
        <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-200/60" />)}</div>
      ) : mine.length === 0 ? (
        <SectionCard>
          <EmptyState icon={Award} title="No certificates" description="Upload certificates — the platform will alert you before they expire."
            action={<Button onClick={() => setOpen(true)} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4" /> Add Certificate</Button>} />
        </SectionCard>
      ) : (
        <SectionCard>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3 font-medium">Certificate</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Issuer</th>
                <th className="px-5 py-3 font-medium">Expiry</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-50">
                {mine.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-800">{c.title}</p>
                      <p className="text-xs text-slate-400">{c.certificate_number}</p>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{c.type}</td>
                    <td className="px-5 py-3 text-slate-600">{c.issued_by || "—"}</td>
                    <td className="px-5 py-3 text-slate-600">{c.expiry_date ? new Date(c.expiry_date).toLocaleDateString() : "—"}</td>
                    <td className="px-5 py-3"><StatusBadge status={certStatus(c.expiry_date)} tone={certStatus(c.expiry_date) === "valid" ? "green" : certStatus(c.expiry_date) === "expiring soon" ? "amber" : "red"} /></td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1.5">
                        <button onClick={() => view(c)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"><Eye className="h-4 w-4" /></button>
                        <button onClick={() => remove(c)} className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button>
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
          <DialogHeader><DialogTitle>Add Certificate</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label>Certificate Name *</Label><Input value={form.title} onChange={set("title")} placeholder="e.g. ISO 9001:2015" /></div>
            <div><Label>Type</Label>
              <select value={form.type} onChange={set("type")} className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm">
                {CERT_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div><Label>Certificate Number</Label><Input value={form.certificate_number} onChange={set("certificate_number")} /></div>
            <div><Label>Issued By</Label><Input value={form.issued_by} onChange={set("issued_by")} placeholder="e.g. BIS, UL" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Issue Date</Label><Input type="date" value={form.issue_date} onChange={set("issue_date")} /></div>
              <div><Label>Expiry Date</Label><Input type="date" value={form.expiry_date} onChange={set("expiry_date")} /></div>
            </div>
            <div className="col-span-2">
              <Label>Document</Label>
              <div className="mt-1.5">
                <DocUploadField label="" doc={form.file ? { name: form.file.name, file_uri: form.file.file_uri } : null}
                  onUploaded={(val) => setForm({ ...form, file: val })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save Certificate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}