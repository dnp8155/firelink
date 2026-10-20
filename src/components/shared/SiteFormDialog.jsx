import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

const EMPTY = { name: "", address: "", city: "", state: "", floors: 1, buildings: "" };

export default function SiteFormDialog({ open, onOpenChange, record, defaults = {}, onSaved }) {
  const { toast } = useToast();
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(
      record
        ? { ...EMPTY, ...record, buildings: (record.buildings || []).join(", ") }
        : { ...EMPTY, ...defaults }
    );
  }, [open, record]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name?.trim()) {
      toast({ title: "Site name is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        address: form.address || "",
        city: form.city || "",
        state: form.state || "",
        floors: Number(form.floors) || 1,
        buildings: String(form.buildings || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        organization_id: form.organization_id || defaults.organization_id || "",
        organization_name: form.organization_name || defaults.organization_name || "",
      };
      if (record?.id) await base44.entities.Site.update(record.id, payload);
      else await base44.entities.Site.create(payload);
      toast({ title: record?.id ? "Site updated" : "Site added" });
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      toast({ title: "Could not save site", description: err?.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{record?.id ? "Edit site" : "Add site"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Site name</Label>
            <Input value={form.name || ""} onChange={(e) => set("name", e.target.value)} placeholder="Head Office" />
          </div>
          <div className="space-y-1.5">
            <Label>Address</Label>
            <Input value={form.address || ""} onChange={(e) => set("address", e.target.value)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>City</Label>
              <Input value={form.city || ""} onChange={(e) => set("city", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>State</Label>
              <Input value={form.state || ""} onChange={(e) => set("state", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Floors</Label>
              <Input type="number" min="1" value={form.floors ?? 1} onChange={(e) => set("floors", e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Buildings (comma separated)</Label>
            <Input value={form.buildings || ""} onChange={(e) => set("buildings", e.target.value)} placeholder="Block A, Block B" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save site"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}