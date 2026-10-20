import React, { useCallback, useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useList } from "@/hooks/useList";
import { KpiCard, PageHeader, SectionCard, EmptyState } from "@/components/ui-bits";
import MarketplaceRow from "@/components/admin/MarketplaceRow";
import QueueHeader from "@/components/admin/QueueHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { logAudit } from "@/lib/auditLog";
import { ShoppingBag, PackageCheck, Star, EyeOff } from "lucide-react";

const TABS = [
  { key: "listings", label: "Live listings" },
  { key: "featured", label: "Featured" },
  { key: "disabled", label: "Disabled" },
  { key: "all", label: "All statuses" },
];

export default function AdminMarketplace() {
  const { toast } = useToast();
  const [tab, setTab] = useState("listings");
  const [query, setQuery] = useState("");
  const [counts, setCounts] = useState(null);
  const [busy, setBusy] = useState(false);
  const [version, setVersion] = useState(0);

  const filters = useMemo(() => {
    const base =
      tab === "listings" ? { approval_status: "approved" }
        : tab === "featured" ? { featured: true, approval_status: "approved" }
          : tab === "disabled" ? { approval_status: "disabled" }
            : {};
    const term = query.trim();
    if (term) base.name = { $regex: term, $options: "i" };
    return base;
  }, [tab, query]);

  const products = useList("Product", filters, "-created_date", 50);
  const services = useList("Service", filters, "-created_date", 50);

  const loadCounts = useCallback(async () => {
    const [productStatus, serviceStatus] = await Promise.all([
      base44.entities.Product.aggregate({ groupBy: "approval_status" }),
      base44.entities.Service.aggregate({ groupBy: "approval_status" }),
    ]);
    const [featuredProducts, featuredServices] = await Promise.all([
      base44.entities.Product.count({ featured: true }),
      base44.entities.Service.count({ featured: true }),
    ]);
    const inStatus = (rows, key) => (rows || []).filter((r) => r.approval_status === key).reduce((n, r) => n + (r.count || 0), 0);
    setCounts({
      live: inStatus(productStatus.rows, "approved") + inStatus(serviceStatus.rows, "approved"),
      pending: inStatus(productStatus.rows, "pending") + inStatus(serviceStatus.rows, "pending"),
      featured: featuredProducts + featuredServices,
      disabled: inStatus(productStatus.rows, "disabled") + inStatus(serviceStatus.rows, "disabled"),
    });
  }, []);

  useEffect(() => { loadCounts(); }, [loadCounts, version]);

  const rows = useMemo(() => {
    const merged = [
      ...products.data.map((p) => ({ ...p, kind: "Product" })),
      ...services.data.map((s) => ({ ...s, kind: "Service" })),
    ];
    return merged.sort((a, b) => String(b.created_date || "").localeCompare(String(a.created_date || "")));
  }, [products.data, services.data]);

  const refresh = () => {
    products.reload();
    services.reload();
    setVersion((v) => v + 1);
  };

  const toggleFeatured = async (item) => {
    setBusy(true);
    try {
      await base44.entities[item.kind].update(item.id, { featured: !item.featured });
      await logAudit({
        action: item.featured ? "listing_unfeatured" : "listing_featured",
        module: "Marketplace",
        entityId: item.id,
        after: item.featured ? "not featured" : "featured",
      });
      toast({ title: item.featured ? "Removed from featured" : "Featured on storefront", description: item.name });
      refresh();
    } catch (e) {
      toast({ title: "Could not update listing", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const toggleDisabled = async (item) => {
    const disabled = item.approval_status === "disabled";
    setBusy(true);
    try {
      await base44.entities[item.kind].update(item.id, { approval_status: disabled ? "approved" : "disabled" });
      await logAudit({
        action: disabled ? "listing_restored" : "listing_disabled",
        module: "Marketplace",
        entityId: item.id,
        before: item.approval_status,
        after: disabled ? "approved" : "disabled",
      });
      toast({ title: disabled ? "Listing restored" : "Listing disabled", description: item.name });
      refresh();
    } catch (e) {
      toast({ title: "Could not update listing", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const loading = products.loading || services.loading;
  const show = (v) => (v == null ? "—" : v);

  return (
    <div>
      <PageHeader
        title="Marketplace"
        icon={ShoppingBag}
        subtitle="Everything approved vendors are selling, and the controls behind the storefront."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Live Listings" value={show(counts?.live)} icon={PackageCheck} tone="green" sub="Products + services" />
        <KpiCard label="Awaiting Approval" value={show(counts?.pending)} icon={ShoppingBag} tone="amber" sub="In the approval queue" />
        <KpiCard label="Featured" value={show(counts?.featured)} icon={Star} tone="violet" sub="Highlighted on the storefront" />
        <KpiCard label="Disabled" value={show(counts?.disabled)} icon={EyeOff} tone="rose" sub="Hidden from buyers" />
      </div>

      <div className="mt-6">
        <QueueHeader
          tabs={TABS}
          value={tab}
          onChange={setTab}
          query={query}
          onQueryChange={setQuery}
          placeholder="Search listing name…"
        />
      </div>

      {loading ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}</div>
      ) : rows.length === 0 ? (
        <SectionCard>
          <EmptyState
            icon={ShoppingBag}
            title="Nothing here yet"
            description="Listings that match this filter, once vendors publish them, appear here with feature and visibility controls."
          />
        </SectionCard>
      ) : (
        <SectionCard>
          <div className="divide-y divide-slate-50">
            {rows.map((item) => (
              <MarketplaceRow
                key={`${item.kind}-${item.id}`}
                item={item}
                busy={busy}
                onToggleFeatured={toggleFeatured}
                onToggleDisabled={toggleDisabled}
              />
            ))}
          </div>
        </SectionCard>
      )}

      <p className="mt-3 text-xs text-slate-400">
        Showing the newest {rows.length} listing(s) for this filter. Feature a listing to highlight it on the public
        storefront; disable it to hide it from buyers without deleting it.
      </p>
    </div>
  );
}