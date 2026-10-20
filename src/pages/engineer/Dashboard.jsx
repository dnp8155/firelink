import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useList, formatINR } from "@/hooks/useList";
import { EmptyState } from "@/components/ui-bits";
import DashHero, { HERO_BTN, HERO_BTN_GHOST } from "@/components/dashboard/DashHero";
import StatTile from "@/components/dashboard/StatTile";
import Panel from "@/components/dashboard/Panel";
import PanelRow from "@/components/dashboard/PanelRow";
import QuickActions from "@/components/dashboard/QuickActions";
import { Flame, Droplets, ClipboardList, Sparkles, Package, Boxes, FileBadge, FileText, AlertTriangle } from "lucide-react";

const TOOLS = [
  { label: "Fire Load Calculator", hint: "MJ/m² per NBC 2016 Part 4", path: "/engineering/fire-load", icon: Flame, tone: "amber" },
  { label: "Hydraulic Calculator", hint: "Friction loss & pump head", path: "/engineering/hydraulic", icon: Droplets, tone: "sky" },
  { label: "BOQ Generator", hint: "Bill of quantities with GST", path: "/engineering/boq", icon: ClipboardList, tone: "violet" },
  { label: "AI Engineering Assistant", hint: "Sizing, NBC compliance, BOQs", path: "/engineering/ai", icon: Sparkles, tone: "primary" },
];

export default function EngineerDashboard() {
  const [kpis, setKpis] = useState({ products: null, assets: null, certificates: null, rfqs: null });
  const { data: products, loading } = useList("Product", { approval_status: "approved" }, "-created_date", 5);

  useEffect(() => {
    let alive = true;
    Promise.all([
      base44.entities.Product.count({ approval_status: "approved" }),
      base44.entities.Asset.count({}),
      base44.entities.Certificate.count({}),
      base44.entities.RFQ.count({ status: "open" }),
    ]).then(([p, a, c, r]) => {
      if (alive) setKpis({ products: p, assets: a, certificates: c, rfqs: r });
    });
    return () => { alive = false; };
  }, []);

  const show = (v) => (v == null ? "—" : v);

  return (
    <div className="space-y-5">
      <DashHero
        eyebrow="Engineer · Design suite"
        title="Engineering Dashboard"
        subtitle="Design tools, calculations and the live project data behind them — all in one workspace."
        meta={new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        tone="violet"
        stats={[
          { label: "Catalog items", value: show(kpis.products), sub: "Approved for BOQ" },
          { label: "Tracked assets", value: show(kpis.assets), sub: "Platform wide" },
          { label: "Certificates", value: show(kpis.certificates), sub: "On file" },
          { label: "Open RFQs", value: show(kpis.rfqs), sub: "Awaiting quotes" },
        ]}
        actions={
          <>
            <Link to="/engineering/ai" className={HERO_BTN}>
              <Sparkles className="h-4 w-4" /> Ask the AI assistant
            </Link>
            <Link to="/engineering/fire-load" className={HERO_BTN_GHOST}>
              <Flame className="h-4 w-4" /> Fire load calculator
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Approved catalog items" value={show(kpis.products)} sub="Ready for BOQ" icon={Package} tone="sky" href="/engineering/boq" />
        <StatTile label="Tracked assets" value={show(kpis.assets)} sub="Across all sites" icon={Boxes} tone="violet" href="/assets" />
        <StatTile label="Certificates on file" value={show(kpis.certificates)} sub="Issued platform wide" icon={FileBadge} tone="emerald" href="/certificates" />
        <StatTile label="Open RFQs" value={show(kpis.rfqs)} sub="Awaiting vendor quotes" icon={FileText} tone="amber" />
      </div>

      <Panel title="Design tools" subtitle="Calculations and generators used on every project" icon={ClipboardList} bodyClassName="p-4">
        <QuickActions items={TOOLS} cols={4} />
      </Panel>

      <Panel
        title="Catalog items available for BOQ"
        count={products.length}
        subtitle="Approved products you can pull straight into a bill of quantities"
        icon={Package}
        action={
          <Link to="/engineering/boq" className="font-semibold text-primary hover:underline">
            Open BOQ generator
          </Link>
        }
        bodyClassName="divide-y divide-border"
      >
        {loading ? (
          <div className="space-y-2 p-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <EmptyState icon={Package} title="No approved catalog items yet" description="Products approved by the platform team will appear here and can be added to a BOQ." />
        ) : (
          products.map((p) => (
            <PanelRow
              key={p.id}
              icon={Package}
              tone="sky"
              title={p.name}
              meta={[p.sku, p.category].filter(Boolean).join(" · ") || "—"}
              trailing={<span className="text-sm font-semibold tabular-nums text-foreground">{formatINR(p.price)}</span>}
              href="/engineering/boq"
            />
          ))
        )}
      </Panel>

      <div className="flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <p className="text-xs font-medium text-amber-800">Engineering calculations and AI recommendations require review by a qualified professional.</p>
      </div>
    </div>
  );
}