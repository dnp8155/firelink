import React, { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { PageHeader, KpiCard, SectionCard, EmptyState } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { logAudit } from "@/lib/auditLog";
import { Flag, Plus, Pencil, Trash2, Search, Loader2, Power, PowerOff, Layers } from "lucide-react";

const EMPTY = { key: "", name: "", description: "", category: "General", enabled: true };
const slug = (s) => String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

export default function FeatureFlags() {
  const { toast } = useToast();
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const term = query.trim();
    const filter = term ? { $or: [{ name: { $regex: term, $options: "i" } }, { key: { $regex: term, $options: "i" } }] } : {};
    const page = await base44.entities.FeatureFlag.filter(filter, { sort: "name", limit: 200 });
    setFlags(page.items || []);
    setLoading(false);
  }, [query]);

  useEffect(() => {
    const t = setTimeout(load, query.trim() ? 400 : 0);
    return () => clearTimeout(t);
  }, [load, query]);

  const openCreate = () => { setEditing("new"); setForm(EMPTY); };
  const openEdit = (f) => { setEditing(f.id); setForm({ key: f.key || "", name: f.name || "", description: f.description || "", category: f.category || "General", enabled: !!f.enabled }); };

  const save = async () => {
    if (!form.name.trim()) { toast({ title: "Name is required", variant: "destructive" }); return; }
    setSaving(true);
    const payload = { ...form, name: form.name.trim(), key: form.key.trim() || slug(form.name) };
    if (editing === "new") {
      const created = await base44.entities.FeatureFlag.create(payload);
      await logAudit({ action: "feature_flag_created", module: "FeatureFlag", entityId: created.id, after: payload.key });
      toast({ title: "Flag created", description: payload.name });
    } else {
      await base44.entities.FeatureFlag.update(editing, payload);
      await logAudit({ action: "feature_flag_updated", module: "FeatureFlag", entityId: editing, after: payload.key });
      toast({ title: "Flag updated", description: payload.name });
    }
    setSaving(false);
    setEditing(null);
    load();
  };

  const toggle = async (f) => {
    setFlags((list) => list.map((x) => (x.id === f.id ? { ...x, enabled: !f.enabled } : x)));
    await base44.entities.FeatureFlag.update(f.id, { enabled: !f.enabled });
    await logAudit({ action: f.enabled ? "feature_flag_disabled" : "feature_flag_enabled", module: "FeatureFlag", entityId: f.id, after: f.key });
    toast({ title: !f.enabled ? "Flag enabled" : "Flag disabled", description: f.name });
  };

  const remove = async () => {
    const f = confirm;
    setConfirm(null);
    await base44.entities.FeatureFlag.delete(f.id);
    setFlags((list) => list.filter((x) => x.id !== f.id));
    await logAudit({ action: "feature_flag_deleted", module: "FeatureFlag", entityId: f.id, before: f.key });
    toast({ title: "Flag deleted", description: f.name });
  };

  const enabled = flags.filter((f) => f.enabled).length;
  const categories = Array.from(new Set(flags.map((f) => f.category || "General"))).sort();
  const grouped = categories.map((c) => [c, flags.filter((f) => (f.category || "General") === c)]);

  return (
    <div>
      <PageHeader
        title="Feature Flags"
        icon={Flag}
        subtitle="Turn platform capabilities on or off without a release."
        actions={<Button onClick={openCreate}><Plus className="h-4 w-4" />New flag</Button>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Total flags" value={flags.length} icon={Flag} tone="slate" />
        <KpiCard label="Enabled" value={enabled} icon={Power} tone="green" />
        <KpiCard label="Disabled" value={flags.length - enabled} icon={PowerOff} tone="amber" />
        <KpiCard label="Categories" value={categories.length} icon={Layers} tone="violet" />
      </div>

      <div className="relative mt-6 w-full max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search flags by name or key…" className="pl-9" />
      </div>

      <div className="mt-4 space-y-4">
        {loading ? (
          [0, 1].map((i) => <Skeleton key={i} className="h-48 w-full rounded-2xl" />)
        ) : flags.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <EmptyState
              icon={Flag}
              title="No flags yet"
              description="Create your first flag to roll capabilities out gradually."
              action={<Button onClick={openCreate}><Plus className="h-4 w-4" />New flag</Button>}
            />
          </div>
        ) : (
          grouped.map(([category, items]) => (
            <SectionCard key={category} title={`${category} (${items.length})`}>
              <div className="divide-y divide-slate-50">
                {items.map((f) => (
                  <div key={f.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold text-slate-900">{f.name}</p>
                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-500">{f.key}</span>
                      </div>
                      {f.description && <p className="mt-0.5 text-xs text-slate-500">{f.description}</p>}
                    </div>
                    <div className="flex items-center gap-3 sm:justify-end">
                      <Switch checked={!!f.enabled} onCheckedChange={() => toggle(f)} />
                      <span className={f.enabled ? "text-xs font-medium text-emerald-600" : "text-xs font-medium text-slate-400"}>{f.enabled ? "On" : "Off"}</span>
                      <Button size="sm" variant="outline" onClick={() => openEdit(f)}><Pencil className="h-3.5 w-3.5" />Edit</Button>
                      <Button size="sm" variant="ghost" onClick={() => setConfirm(f)}><Trash2 className="h-3.5 w-3.5 text-rose-500" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          ))
        )}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing === "new" ? "New feature flag" : "Edit feature flag"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="flag-name">Name</Label>
              <Input id="flag-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Vendor wallet payouts" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="flag-key">Key</Label>
              <Input id="flag-key" value={form.key} onChange={(e) => setForm((f) => ({ ...f, key: e.target.value }))} placeholder="vendor_wallet_payouts" className="mt-1.5 font-mono text-xs" />
              <p className="mt-1 text-xs text-slate-400">Leave blank to generate from the name.</p>
            </div>
            <div>
              <Label htmlFor="flag-category">Category</Label>
              <Input id="flag-category" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} placeholder="Marketplace" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="flag-desc">Description</Label>
              <Textarea id="flag-desc" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} className="mt-1.5" placeholder="What this flag controls…" />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-slate-800">Enabled</p>
                <p className="text-xs text-slate-500">The capability is live for everyone.</p>
              </div>
              <Switch checked={form.enabled} onCheckedChange={(v) => setForm((f) => ({ ...f, enabled: v }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)} disabled={saving}>Cancel</Button>
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {editing === "new" ? "Create flag" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{confirm?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>This permanently removes the flag. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={remove}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}