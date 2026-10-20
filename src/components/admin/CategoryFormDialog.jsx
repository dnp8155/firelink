import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const slugify = (s) => String(s || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export default function CategoryFormDialog({ open, onClose, onSaved, category }) {
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    setForm(category ? { ...category } : { name: "", slug: "", type: "product", description: "", display_order: 0, is_active: true });
  }, [open, category]);

  if (!form) return null;
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const save = async () => {
    if (!String(form.name || "").trim()) { setError("Category name is required."); return; }
    setBusy(true);
    const payload = {
      name: form.name.trim(),
      slug: String(form.slug || "").trim() || slugify(form.name),
      type: form.type,
      description: form.description,
      display_order: Number(form.display_order) || 0,
      is_active: !!form.is_active,
    };
    if (category?.id) await base44.entities.Category.update(category.id, payload);
    else await base44.entities.Category.create(payload);
    setBusy(false);
    onSaved(category ? "Category updated" : "Category created");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{category ? "Edit category" : "New category"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="mb-1.5 block text-xs font-medium text-slate-500">Name</Label>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Fire Extinguishers" />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs font-medium text-slate-500">Type</Label>
              <Select value={form.type} onValueChange={(v) => set("type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="product">Product</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="mb-1.5 block text-xs font-medium text-slate-500">Slug (optional)</Label>
            <Input value={form.slug || ""} onChange={(e) => set("slug", e.target.value)} placeholder={slugify(form.name) || "auto-generated"} />
          </div>
          <div>
            <Label className="mb-1.5 block text-xs font-medium text-slate-500">Description</Label>
            <Textarea value={form.description || ""} onChange={(e) => set("description", e.target.value)} rows={2} placeholder="Short description shown to vendors" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="mb-1.5 block text-xs font-medium text-slate-500">Display order</Label>
              <Input type="number" value={form.display_order ?? 0} onChange={(e) => set("display_order", e.target.value)} />
            </div>
            <div className="flex items-end justify-between rounded-xl border border-slate-200 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-slate-700">Active</p>
                <p className="text-xs text-slate-500">Visible in the catalog</p>
              </div>
              <Switch checked={!!form.is_active} onCheckedChange={(v) => set("is_active", v)} />
            </div>
          </div>
          {error && <p className="text-sm text-rose-600">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={save} disabled={busy}>{busy ? "Saving…" : category ? "Save changes" : "Create category"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}