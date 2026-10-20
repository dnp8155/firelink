import React, { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { PageHeader, KpiCard, SectionCard, EmptyState } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { logAudit } from "@/lib/auditLog";
import { formatINR } from "@/hooks/useList";
import { TrendingUp, Plus, Pencil, Trash2, Loader2, Percent, Repeat, Megaphone, IndianRupee } from "lucide-react";

const CATEGORIES = ["commission", "fee", "subscription", "advertising", "lead", "service"];
const MODELS = ["percentage", "flat", "subscription", "referral"];
const EMPTY = { key: "", name: "", category: "commission", model_type: "percentage", rate: 0, fee: 0, applies_to: "", description: "", active: true, display_order: 0 };
const CATEGORY_TONE = {
  commission: "bg-rose-50 text-rose-700",
  fee: "bg-blue-50 text-blue-700",
  subscription: "bg-violet-50 text-violet-700",
  advertising: "bg-amber-50 text-amber-700",
  lead: "bg-teal-50 text-teal-700",
  service: "bg-emerald-50 text-emerald-700",
};
const title = (s) => String(s || "").replace(/_/g, " ");
const money = (stream) => (stream.model_type === "percentage" ? `${stream.rate || 0}%` : formatINR(stream.fee || 0));

export default function RevenueModel() {
  const { toast } = useToast();
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const page = await base44.entities.RevenueStream.filter({}, { sort: "display_order", limit: 100 });
    setStreams(page.items || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing("new"); setForm(EMPTY); };
  const openEdit = (s) => {
    setEditing(s.id);
    setForm({ key: s.key || "", name: s.name || "", category: s.category || "commission", model_type: s.model_type || "percentage", rate: s.rate || 0, fee: s.fee || 0, applies_to: s.applies_to || "", description: s.description || "", active: s.active !== false, display_order: s.display_order || 0 });
  };

  const save = async () => {
    if (!form.name.trim()) { toast({ title: "Name is required", variant: "destructive" }); return; }
    setSaving(true);
    const payload = { ...form, name: form.name.trim(), key: form.key.trim() || form.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_"), rate: Number(form.rate) || 0, fee: Number(form.fee) || 0 };
    if (editing === "new") {
      const created = await base44.entities.RevenueStream.create(payload);
      await logAudit({ action: "revenue_stream_created", module: "RevenueStream", entityId: created.id, after: payload.key });
      toast({ title: "Revenue stream added", description: payload.name });
    } else {
      await base44.entities.RevenueStream.update(editing, payload);
      await logAudit({ action: "revenue_stream_updated", module: "RevenueStream", entityId: editing, after: payload.key });
      toast({ title: "Revenue stream updated", description: payload.name });
    }
    setSaving(false);
    setEditing(null);
    load();
  };

  const toggle = async (s) => {
    setStreams((list) => list.map((x) => (x.id === s.id ? { ...x, active: s.active === false } : x)));
    await base44.entities.RevenueStream.update(s.id, { active: s.active === false });
    await logAudit({ action: s.active === false ? "revenue_stream_enabled" : "revenue_stream_disabled", module: "RevenueStream", entityId: s.id, after: s.key });
    toast({ title: s.active === false ? "Stream enabled" : "Stream disabled", description: s.name });
  };

  const remove = async () => {
    const s = confirm;
    setConfirm(null);
    await base44.entities.RevenueStream.delete(s.id);
    setStreams((list) => list.filter((x) => x.id !== s.id));
    await logAudit({ action: "revenue_stream_deleted", module: "RevenueStream", entityId: s.id, before: s.key });
    toast({ title: "Revenue stream deleted", description: s.name });
  };

  const active = streams.filter((s) => s.active !== false);
  const commission = active.find((s) => s.category === "commission" && s.model_type === "percentage");
  const subscriptions = active.filter((s) => s.category === "subscription").length;

  return (
    <div>
      <PageHeader
        title="Revenue Model"
        icon={TrendingUp}
        subtitle="Every way the platform earns — commission, subscriptions, ads and fees."
        actions={<Button onClick={openCreate}><Plus className="h-4 w-4" />New stream</Button>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Revenue streams" value={streams.length} sub={`${active.length} active`} icon={TrendingUp} tone="violet" />
        <KpiCard label="Commission rate" value={commission ? `${commission.rate}%` : "—"} sub={commission ? commission.applies_to || "marketplace orders" : "not configured"} icon={Percent} tone="rose" />
        <KpiCard label="Subscription lines" value={subscriptions} sub="vendor plans & tiers" icon={Repeat} tone="teal" />
        <KpiCard label="Ad & lead streams" value={active.filter((s) => ["advertising", "lead"].includes(s.category)).length} sub="promoted placements" icon={Megaphone} tone="amber" />
      </div>

      <div className="mt-6">
        {loading ? (
          <Skeleton className="h-64 w-full rounded-2xl" />
        ) : streams.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <EmptyState
              icon={IndianRupee}
              title="No revenue streams configured"
              description="Add the commission, subscription and advertising lines this platform earns from."
              action={<Button onClick={openCreate}><Plus className="h-4 w-4" />New stream</Button>}
            />
          </div>
        ) : (
          <SectionCard title={`Streams (${streams.length})`}>
            <div className="divide-y divide-slate-50">
              {streams.map((s) => (
                <div key={s.id} className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-slate-900">{s.name}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${CATEGORY_TONE[s.category] || "bg-slate-100 text-slate-600"}`}>{title(s.category)}</span>
                      <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] capitalize text-slate-500">{title(s.model_type)}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">{s.description || s.applies_to || "—"}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 lg:justify-end">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">{money(s)}</p>
                      <p className="text-[11px] text-slate-500">per {s.model_type === "subscription" ? "plan" : "transaction"}</p>
                    </div>
                    <Switch checked={s.active !== false} onCheckedChange={() => toggle(s)} />
                    <Button size="sm" variant="outline" onClick={() => openEdit(s)}><Pencil className="h-3.5 w-3.5" />Edit</Button>
                    <Button size="sm" variant="ghost" onClick={() => setConfirm(s)}><Trash2 className="h-3.5 w-3.5 text-rose-500" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        )}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing === "new" ? "New revenue stream" : "Edit revenue stream"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rs-name">Name</Label>
              <Input id="rs-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Marketplace commission" className="mt-1.5" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c} className="capitalize">{title(c)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Model</Label>
                <Select value={form.model_type} onValueChange={(v) => setForm((f) => ({ ...f, model_type: v }))}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>{MODELS.map((m) => <SelectItem key={m} value={m} className="capitalize">{title(m)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="rs-rate">Rate (%)</Label>
                <Input id="rs-rate" type="number" value={form.rate} onChange={(e) => setForm((f) => ({ ...f, rate: e.target.value }))} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="rs-fee">Flat fee (₹)</Label>
                <Input id="rs-fee" type="number" value={form.fee} onChange={(e) => setForm((f) => ({ ...f, fee: e.target.value }))} className="mt-1.5" />
              </div>
            </div>
            <div>
              <Label htmlFor="rs-applies">Applies to</Label>
              <Input id="rs-applies" value={form.applies_to} onChange={(e) => setForm((f) => ({ ...f, applies_to: e.target.value }))} placeholder="Marketplace orders" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="rs-desc">Description</Label>
              <Textarea id="rs-desc" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} className="mt-1.5" placeholder="How this line is charged…" />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-slate-800">Active</p>
                <p className="text-xs text-slate-500">Included in the platform's revenue mix.</p>
              </div>
              <Switch checked={form.active} onCheckedChange={(v) => setForm((f) => ({ ...f, active: v }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)} disabled={saving}>Cancel</Button>
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {editing === "new" ? "Add stream" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{confirm?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>This removes the revenue line from the model. This cannot be undone.</AlertDialogDescription>
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