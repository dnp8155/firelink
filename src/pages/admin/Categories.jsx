import React, { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { PageHeader, KpiCard, EmptyState, SectionCard } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import QueueHeader from "@/components/admin/QueueHeader";
import CategoryFormDialog from "@/components/admin/CategoryFormDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { logAudit } from "@/lib/auditLog";
import { countByField } from "@/lib/format";
import { FolderTree, Plus, PencilLine, Trash2, Layers, Package, Wrench, CheckCircle2 } from "lucide-react";

const TABS = [
  { key: "all", label: "All categories" },
  { key: "product", label: "Products" },
  { key: "service", label: "Services" },
];

export default function Categories() {
  const { toast } = useToast();
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [version, setVersion] = useState(0);

  const loadStats = useCallback(async () => {
    const [byType, active, total] = await Promise.all([
      base44.entities.Category.aggregate({ groupBy: "type" }),
      base44.entities.Category.count({ is_active: true }),
      base44.entities.Category.count({}),
    ]);
    setStats({ byType: countByField(byType.rows, "type"), active, total });
  }, []);

  const loadRows = useCallback(async () => {
    setLoading(true);
    const filter = tab === "all" ? {} : { type: tab };
    const term = query.trim();
    if (term) filter.name = { $regex: term, $options: "i" };
    const page = await base44.entities.Category.filter(filter, { sort: "display_order", limit: 100 });
    setRows(page.items || []);
    setLoading(false);
  }, [tab, query]);

  useEffect(() => { loadStats(); }, [loadStats, version]);
  useEffect(() => {
    const t = setTimeout(loadRows, query.trim() ? 400 : 0);
    return () => clearTimeout(t);
  }, [loadRows, query, version]);

  const toggleActive = async (category, value) => {
    await base44.entities.Category.update(category.id, { is_active: value });
    await logAudit({ action: value ? "category_enabled" : "category_disabled", module: "Category", entityId: category.id, before: String(category.is_active), after: String(value) });
    setVersion((v) => v + 1);
    toast({ title: value ? "Category enabled" : "Category disabled", description: category.name });
  };

  const remove = async () => {
    const target = confirm;
    setConfirm(null);
    await base44.entities.Category.delete(target.id);
    await logAudit({ action: "category_deleted", module: "Category", entityId: target.id, before: target.name, after: "deleted" });
    setVersion((v) => v + 1);
    toast({ title: "Category deleted", description: target.name });
  };

  const tabs = TABS.map((t) => ({ ...t, count: t.key === "all" ? stats?.total || 0 : stats?.byType?.[t.key] || 0 }));

  return (
    <div>
      <PageHeader
        title="Categories"
        icon={FolderTree}
        subtitle="The product and service taxonomy vendors list against."
        actions={<Button onClick={() => { setEditing(null); setFormOpen(true); }}><Plus className="h-4 w-4" /> New category</Button>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Total categories" value={stats?.total ?? "—"} icon={Layers} tone="blue" />
        <KpiCard label="Product categories" value={stats?.byType?.product ?? "—"} icon={Package} tone="violet" />
        <KpiCard label="Service categories" value={stats?.byType?.service ?? "—"} icon={Wrench} tone="teal" />
        <KpiCard label="Active" value={stats?.active ?? "—"} sub="visible in the catalog" icon={CheckCircle2} tone="green" />
      </div>

      <div className="mt-6">
        <QueueHeader tabs={tabs} value={tab} onChange={setTab} query={query} onQueryChange={setQuery} placeholder="Search categories…" />
      </div>

      {loading ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}</div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <EmptyState
            icon={FolderTree}
            title="No categories yet"
            description="Create the first category so vendors can start listing products and services."
            action={<Button size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}><Plus className="h-4 w-4" /> New category</Button>}
          />
        </div>
      ) : (
        <SectionCard title={`Categories (${rows.length})`}>
          <div className="divide-y divide-slate-50">
            {rows.map((c) => (
              <div key={c.id} className="flex flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-slate-900">{c.name}</p>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium capitalize text-slate-600">{c.type}</span>
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-slate-500">
                    {c.slug && <span className="font-mono">{c.slug}</span>}
                    <span>Order {c.display_order ?? 0}</span>
                    {c.description && <span className="truncate">{c.description}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:justify-end">
                  <Switch checked={!!c.is_active} onCheckedChange={(v) => toggleActive(c, v)} />
                  <Button size="icon" variant="ghost" onClick={() => { setEditing(c); setFormOpen(true); }}><PencilLine className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => setConfirm(c)}><Trash2 className="h-4 w-4 text-rose-500" /></Button>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      <CategoryFormDialog
        open={formOpen}
        category={editing}
        onClose={() => setFormOpen(false)}
        onSaved={(message) => {
          setFormOpen(false);
          setVersion((v) => v + 1);
          toast({ title: message });
        }}
      />

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{confirm?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              Listings filed under this category will keep their data but lose the category link. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep category</AlertDialogCancel>
            <AlertDialogAction className="bg-rose-600 hover:bg-rose-700" onClick={remove}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}