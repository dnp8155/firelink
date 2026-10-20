import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import SelectField from "@/components/shared/SelectField";
import { useToast } from "@/components/ui/use-toast";

const EMPTY = {
  name: "", client_name: "", site_name: "", city: "", project_type: "design",
  status: "planning", priority: "medium", start_date: "", target_date: "",
  engineer_name: "", project_value: "", scope: "",
};

const TYPES = [
  { value: "design", label: "Design" },
  { value: "audit", label: "Audit" },
  { value: "installation", label: "Installation" },
  { value: "retrofit", label: "Retrofit" },
  { value: "maintenance", label: "Maintenance" },
];

const STATUSES = [
  { value: "planning", label: "Planning" },
  { value: "in_progress", label: "In progress" },
  { value: "on_hold", label: "On hold" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export default function ProjectFormDialog({ open, onOpenChange, project, onSaved }) {
  const { toast } = useToast();
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(project ? { ...EMPTY, ...project, project_value: project.project_value ?? "" } : EMPTY);
  }, [open, project]);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast({ title: "Project name is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      name: form.name.trim(),
      project_value: Number(form.project_value) || 0,
      start_date: form.start_date || null,
      target_date: form.target_date || null,
    };
    delete payload.id;
    try {
      if (project) await base44.entities.EngineeringProject.update(project.id, payload);
      else await base44.entities.EngineeringProject.create(payload);
      toast({ title: project ? "Project updated" : "Project created", description: payload.name });
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      toast({ title: "Could not save project", description: err?.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{project ? "Edit project" : "New project"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Project name *</Label>
              <Input value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="Sprinkler design — Tower B" />
            </div>
            <div className="space-y-1.5">
              <Label>Client</Label>
              <Input value={form.client_name} onChange={(e) => set({ client_name: e.target.value })} placeholder="Patel Enterprises" />
            </div>
            <div className="space-y-1.5">
              <Label>Site</Label>
              <Input value={form.site_name} onChange={(e) => set({ site_name: e.target.value })} placeholder="Main plant" />
            </div>
            <div className="space-y-1.5">
              <Label>City</Label>
              <Input value={form.city} onChange={(e) => set({ city: e.target.value })} placeholder="Pune" />
            </div>
            <SelectField label="Project type" value={form.project_type} onChange={(v) => set({ project_type: v })} options={TYPES} />
            <SelectField label="Status" value={form.status} onChange={(v) => set({ status: v })} options={STATUSES} />
            <SelectField label="Priority" value={form.priority} onChange={(v) => set({ priority: v })} options={PRIORITIES} />
            <div className="space-y-1.5">
              <Label>Engineer</Label>
              <Input value={form.engineer_name} onChange={(e) => set({ engineer_name: e.target.value })} placeholder="Rahul Mehta" />
            </div>
            <div className="space-y-1.5">
              <Label>Start date</Label>
              <Input type="date" value={form.start_date || ""} onChange={(e) => set({ start_date: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Target date</Label>
              <Input type="date" value={form.target_date || ""} onChange={(e) => set({ target_date: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Project value (₹)</Label>
              <Input type="number" min="0" value={form.project_value} onChange={(e) => set({ project_value: e.target.value })} placeholder="0" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Scope</Label>
            <Textarea rows={3} value={form.scope} onChange={(e) => set({ scope: e.target.value })} placeholder="Scope of work, drawings and standards followed." />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : project ? "Save changes" : "Create project"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}