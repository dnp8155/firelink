import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import SelectField from "@/components/shared/SelectField";
import { useToast } from "@/components/ui/use-toast";
import { nextNumber } from "@/lib/orgScope";

const STATUS = [
  { value: "valid", label: "Valid" },
  { value: "expiring_soon", label: "Expiring soon" },
  { value: "expired", label: "Expired" },
  { value: "renewal_in_progress", label: "Renewal in progress" },
];

const EMPTY = { noc_number: "", authority: "", site_name: "", issue_date: "", expiry_date: "", document_url: "", status: "valid" };

export default function NocFormDialog({ open, onOpenChange, record, defaults = {}, onSaved }) {
  const { toast } = useToast();
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(record ? { ...EMPTY, ...record } : { ...EMPTY, ...defaults });
  }, [open, record]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.noc_number?.trim() || !form.authority?.trim()) {
      toast({ title: "NOC number and authority are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        noc_number: form.noc_number.trim(),
        authority: form.authority.trim(),
        site_name: form.site_name || "",
        issue_date: form.issue_date || "",
        expiry_date: form.expiry_date || "",
        document_url: form.document_url || "",
        status: form.status || "valid",
        organization_id: form.organization_id || defaults.organization_id || "",
        organization_name: form.organization_name || defaults.organization_name || "",
      };
      if (record?.id) await base44.entities.NOC.update(record.id, payload);
      else await base44.entities.NOC.create(payload);
      toast({ title: record?.id ? "NOC updated" : "NOC added" });
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      toast({ title: "Could not save NOC", description: err?.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{record?.id ? "Edit Fire NOC" : "Add Fire NOC"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>NOC number</Label>
              <Input value={form.noc_number || ""} onChange={(e) => set("noc_number", e.target.value)} placeholder={nextNumber("NOC")} />
            </div>
            <div className="space-y-1.5">
              <Label>Issuing authority</Label>
              <Input value={form.authority || ""} onChange={(e) => set("authority", e.target.value)} placeholder="State Fire Department" />
            </div>
            <div className="space-y-1.5">
              <Label>Site</Label>
              <Input value={form.site_name || ""} onChange={(e) => set("site_name", e.target.value)} />
            </div>
            <SelectField label="Status" value={form.status} onChange={(v) => set("status", v)} options={STATUS} />
            <div className="space-y-1.5">
              <Label>Issue date</Label>
              <Input type="date" value={form.issue_date || ""} onChange={(e) => set("issue_date", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Expiry date</Label>
              <Input type="date" value={form.expiry_date || ""} onChange={(e) => set("expiry_date", e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Document link (optional)</Label>
            <Input value={form.document_url || ""} onChange={(e) => set("document_url", e.target.value)} placeholder="https://" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save NOC"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}