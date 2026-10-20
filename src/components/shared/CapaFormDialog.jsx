import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import SelectField from "@/components/shared/SelectField";
import { useToast } from "@/components/ui/use-toast";
import { nextNumber } from "@/lib/orgScope";

const SEVERITY = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];
const STATUS = [
  { value: "open", label: "Open" },
  { value: "assigned", label: "Assigned" },
  { value: "in_progress", label: "In progress" },
  { value: "awaiting_verification", label: "Awaiting verification" },
  { value: "closed", label: "Closed" },
];

const EMPTY = { finding: "", site_name: "", asset_name: "", severity: "medium", responsible_person: "", target_date: "", corrective_action: "", preventive_action: "", status: "open" };

export default function CapaFormDialog({ open, onOpenChange, record, defaults = {}, onSaved }) {
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
    if (!form.finding?.trim()) {
      toast({ title: "Finding is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        capa_number: form.capa_number || nextNumber("CAPA"),
        finding: form.finding.trim(),
        site_name: form.site_name || "",
        asset_name: form.asset_name || "",
        severity: form.severity || "medium",
        responsible_person: form.responsible_person || "",
        target_date: form.target_date || "",
        corrective_action: form.corrective_action || "",
        preventive_action: form.preventive_action || "",
        status: form.status || "open",
        organization_id: form.organization_id || defaults.organization_id || "",
      };
      if (record?.id) await base44.entities.CAPA.update(record.id, payload);
      else await base44.entities.CAPA.create(payload);
      toast({ title: record?.id ? "CAPA updated" : "CAPA raised" });
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      toast({ title: "Could not save CAPA", description: err?.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{record?.id ? `Edit ${record.capa_number}` : "Raise CAPA"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Finding</Label>
            <Textarea rows={2} value={form.finding || ""} onChange={(e) => set("finding", e.target.value)} placeholder="Blocked fire exit on level 3" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Site</Label>
              <Input value={form.site_name || ""} onChange={(e) => set("site_name", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Asset</Label>
              <Input value={form.asset_name || ""} onChange={(e) => set("asset_name", e.target.value)} />
            </div>
            <SelectField label="Severity" value={form.severity} onChange={(v) => set("severity", v)} options={SEVERITY} />
            <SelectField label="Status" value={form.status} onChange={(v) => set("status", v)} options={STATUS} />
            <div className="space-y-1.5">
              <Label>Responsible person</Label>
              <Input value={form.responsible_person || ""} onChange={(e) => set("responsible_person", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Target date</Label>
              <Input type="date" value={form.target_date || ""} onChange={(e) => set("target_date", e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Corrective action</Label>
            <Textarea rows={2} value={form.corrective_action || ""} onChange={(e) => set("corrective_action", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Preventive action</Label>
            <Textarea rows={2} value={form.preventive_action || ""} onChange={(e) => set("preventive_action", e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save CAPA"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}