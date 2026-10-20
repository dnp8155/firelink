import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import SelectField from "@/components/shared/SelectField";
import { useToast } from "@/components/ui/use-toast";
import { nextNumber, orgIdentity } from "@/lib/orgScope";
import { slaDueFrom, slaHours } from "@/lib/sla";

const PRIORITY = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];
const EMPTY = { service_type: "", asset_name: "", site_name: "", priority: "medium", description: "", scheduled_date: "" };

export default function ServiceRequestFormDialog({ open, onOpenChange, user, assets = [], onSaved }) {
  const { toast } = useToast();
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(EMPTY);
  }, [open]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const onAssetPick = (assetId) => {
    const asset = assets.find((a) => a.id === assetId);
    setForm((f) => ({
      ...f,
      asset_id: asset?.id || "",
      asset_name: asset?.name || "",
      site_name: asset?.site_name || f.site_name,
      asset_ref: assetId,
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.service_type?.trim()) {
      toast({ title: "Service type is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const org = orgIdentity(user);
      const hours = slaHours(form.priority);
      await base44.entities.ServiceRequest.create({
        request_number: nextNumber("SR"),
        customer_id: user?.id || "",
        customer_name: user?.full_name || user?.email || "",
        organization_id: org.organization_id,
        asset_id: form.asset_id || "",
        asset_name: form.asset_name || "",
        site_name: form.site_name || "",
        service_type: form.service_type.trim(),
        priority: form.priority,
        description: form.description || "",
        scheduled_date: form.scheduled_date || "",
        sla_hours: hours,
        sla_due_date: slaDueFrom(form.priority),
        sla_status: "on_track",
        status: "open",
      });
      toast({ title: "Service request raised" });
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      toast({ title: "Could not raise request", description: err?.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Raise service request</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Service type</Label>
            <Input value={form.service_type} onChange={(e) => set("service_type", e.target.value)} placeholder="Extinguisher refill" />
          </div>
          {assets.length > 0 && (
            <SelectField
              label="Asset (optional)"
              value={form.asset_ref}
              onChange={onAssetPick}
              placeholder="Pick an asset"
              options={assets.map((a) => ({ value: a.id, label: `${a.name}${a.asset_code ? ` · ${a.asset_code}` : ""}` }))}
            />
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Site</Label>
              <Input value={form.site_name || ""} onChange={(e) => set("site_name", e.target.value)} />
            </div>
            <SelectField label="Priority" value={form.priority} onChange={(v) => set("priority", v)} options={PRIORITY} />
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Preferred date</Label>
              <Input type="date" value={form.scheduled_date || ""} onChange={(e) => set("scheduled_date", e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Details</Label>
            <Textarea rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Submitting…" : "Raise request"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}