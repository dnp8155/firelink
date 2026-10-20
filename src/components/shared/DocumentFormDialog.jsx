import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import SelectField from "@/components/shared/SelectField";
import { useToast } from "@/components/ui/use-toast";
import { orgIdentity } from "@/lib/orgScope";

const TYPES = [
  { value: "certificate", label: "Certificate" },
  { value: "manual", label: "Manual" },
  { value: "datasheet", label: "Datasheet" },
  { value: "drawing", label: "Drawing" },
  { value: "purchase_order", label: "Purchase order" },
  { value: "invoice", label: "Invoice" },
  { value: "inspection_report", label: "Inspection report" },
  { value: "maintenance_report", label: "Maintenance report" },
  { value: "fire_noc", label: "Fire NOC" },
  { value: "engineering_report", label: "Engineering report" },
  { value: "other", label: "Other" },
];

const EMPTY = { name: "", type: "certificate" };

export default function DocumentFormDialog({ open, onOpenChange, user, onSaved, defaultType = "certificate" }) {
  const { toast } = useToast();
  const [form, setForm] = useState(EMPTY);
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({ ...EMPTY, type: defaultType });
    setFile(null);
  }, [open, defaultType]);

  const submit = async (e) => {
    e.preventDefault();
    if (!file) {
      toast({ title: "Choose a file to upload", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      const org = orgIdentity(user);
      await base44.entities.Document.create({
        name: form.name?.trim() || file.name,
        type: form.type,
        file_url: file_uri,
        version: 1,
        uploaded_by: user?.full_name || user?.email || "",
        organization_id: org.organization_id,
        organization_name: org.organization_name,
      });
      toast({ title: "Document uploaded" });
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      toast({ title: "Upload failed", description: err?.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload document</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Document name</Label>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Fire NOC 2026" />
          </div>
          <SelectField label="Type" value={form.type} onChange={(v) => setForm((f) => ({ ...f, type: v }))} options={TYPES} />
          <div className="space-y-1.5">
            <Label>File</Label>
            <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <p className="text-xs text-slate-500">Stored privately — only your organization's users can open it.</p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Uploading…" : "Upload"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}