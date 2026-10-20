import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { EmptyState } from "@/components/ui-bits";
import { formatINR } from "@/hooks/useList";
import { countByField, timeAgo } from "@/lib/format";
import DashHero, { HERO_BTN, HERO_BTN_GHOST } from "@/components/dashboard/DashHero";
import StatTile from "@/components/dashboard/StatTile";
import Panel from "@/components/dashboard/Panel";
import QuickActions from "@/components/dashboard/QuickActions";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import DashboardSkeleton from "@/components/dashboard/DashboardSkeleton";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import {
  Building2, Store, Package, ShoppingCart, IndianRupee, Award, Boxes, LifeBuoy, Activity,
  Crown, KeyRound, Flag, Plug, TrendingUp, Database, ClipboardCheck,
} from "lucide-react";

const OPEN_TICKETS = ["open", "assigned", "in_progress", "waiting_for_customer"];
const title = (s) => String(s || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const SHORTCUTS = [
  { label: "Command Center", path: "/admin/dashboard", icon: Crown, tone: "primary" },
  { label: "Roles & Permissions", path: "/admin/roles", icon: KeyRound, tone: "violet" },
  { label: "Feature Flags", path: "/admin/feature-flags", icon: Flag, tone: "amber" },
  { label: "Revenue Model", path: "/admin/revenue", icon: TrendingUp, tone: "emerald" },
  { label: "Integrations", path: "/admin/integrations", icon: Plug, tone: "sky" },
  { label: "System Health", path: "/admin/system-health", icon: Activity, tone: "teal" },
];

export default function SystemDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    let alive = true;
    Promise.all([
      base44.entities.Organization.count({}),
      base44.entities.Vendor.aggregate({ groupBy: "approval_status" }),
      base44.entities.Product.aggregate({ groupBy: "approval_status" }),
      base44.entities.Order.aggregate({ groupBy: "status", sum: ["total"] }),
      base44.entities.Certificate.count({}),
      base44.entities.Asset.count({}),
      base44.entities.SupportTicket.aggregate({ groupBy: "status" }),
      base44.entities.AuditLog.filter({}, { sort: "-created_date", limit: 8, fields: ["action", "module", "user_name", "created_date"] }),
    ]).then(([organizations, vendors, products, orders, certificates, assets, tickets, activity]) => {
      if (!alive) return;
      const v = countByField(vendors.rows, "approval_status");
      const p = countByField(products.rows, "approval_status");
      const t = countByField(tickets.rows, "status");
      const orderRows = orders.rows || [];
      const total = (map) => Object.values(map).reduce((n, c) => n + c, 0);
      setData({
        organizations,
        vendors: total(v),
        vendorsApproved: v.approved || 0,
        products: total(p),
        productsListed: p.approved || 0,
        orders: orderRows.reduce((n, r) => n + r.count, 0),
        gmv: orderRows.reduce((n, r) => n + (r.sum_total || 0), 0),
        certificates,
        assets,
        tickets: total(t),
        openTickets: OPEN_TICKETS.reduce((n, k) => n + (t[k] || 0), 0),
        chart: orderRows.filter((r) => r.count > 0).map((r) => ({ name: title(r.status), count: r.count })).sort((a, b) => b.count - a.count),
        activity: activity.items || [],
      });
    });
    return () => { alive = false; };
  }, []);

  if (!data) return <DashboardSkeleton tiles={8} panels={3} />;

  const footprint = [
    ["Organizations", data.organizations],
    ["Vendors", data.vendors],
    ["Products", data.products],
    ["Orders", data.orders],
    ["Certificates", data.certificates],
    ["Assets", data.assets],
    ["Support tickets", data.tickets],
  ];
  const footprintMax = Math.max(...footprint.map(([, v]) => v), 1);

  return (
    <div className="space-y-5">
      <DashHero
        eyebrow="Super admin · Platform governance"
        title="System Dashboard"
        subtitle="Platform-wide footprint, marketplace growth and governance controls."
        meta={new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        tone="amber"
        stats={[
          { label: "Organizations", value: data.organizations, sub: "Registered buyers" },
          { label: "Vendors", value: data.vendors, sub: `${data.vendorsApproved} approved` },
          { label: "Marketplace GMV", value: formatINR(data.gmv), sub: `${data.orders} orders` },
          { label: "Open tickets", value: data.openTickets, sub: `${data.tickets} lifetime` },
        ]}
        actions={
          <>
            <Link to="/admin/roles" className={HERO_BTN}>
              <KeyRound className="h-4 w-4" /> Roles & permissions
            </Link>
            <Link to="/admin/system-health" className={HERO_BTN_GHOST}>
              <Activity className="h-4 w-4" /> System health
            </Link>
          </>
        }
      />

      <QuickActions items={SHORTCUTS} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Organizations" value={data.organizations} sub="Registered buyers" icon={Building2} tone="sky" href="/admin/organizations" />
        <StatTile label="Vendors" value={data.vendors} sub={`${data.vendorsApproved} approved`} icon={Store} tone="emerald" href="/admin/vendors" />
        <StatTile label="Products" value={data.products} sub={`${data.productsListed} listed`} icon={Package} tone="primary" href="/admin/product-approvals" />
        <StatTile label="Orders" value={data.orders} sub="All time" icon={ShoppingCart} tone="violet" href="/admin/orders" />
        <StatTile label="Marketplace GMV" value={formatINR(data.gmv)} sub="Order value" icon={IndianRupee} tone="amber" href="/admin/analytics" />
        <StatTile label="Certificates" value={data.certificates} sub="Issued" icon={Award} tone="teal" href="/admin/certificate-verification" />
        <StatTile label="Assets" value={data.assets} sub="Tracked" icon={Boxes} tone="slate" href="/admin/marketplace" />
        <StatTile label="Open tickets" value={data.openTickets} sub={`${data.tickets} total`} icon={LifeBuoy} tone="amber" href="/admin/tickets" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Orders by status" subtitle="Order pipeline distribution" icon={ShoppingCart} className="lg:col-span-2" bodyClassName="p-4">
          {data.chart.length === 0 ? (
            <EmptyState icon={ShoppingCart} title="No orders yet" description="Order volume will chart here as buyers check out." />
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.chart} margin={{ top: 4, right: 8, bottom: 4, left: -12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
                  <Bar dataKey="count" name="Orders" fill="hsl(var(--chart-1))" radius={[6, 6, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>

        <Panel title="Data footprint" subtitle="Records held across the platform" icon={Database} bodyClassName="p-5">
          <div className="space-y-3.5">
            {footprint.map(([label, value]) => (
              <div key={label}>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-semibold tabular-nums text-foreground">{value}</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary/70" style={{ width: `${Math.max(4, Math.round((value / footprintMax) * 100))}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Recent platform activity" subtitle="Approvals and configuration changes" icon={Activity} bodyClassName="py-1">
        {data.activity.length === 0 ? (
          <EmptyState icon={Activity} title="No activity yet" description="Approvals and configuration changes are logged here." />
        ) : (
          <ActivityFeed
            items={data.activity.map((a) => ({
              id: a.id,
              icon: ClipboardCheck,
              tone: "amber",
              title: title(a.action || "change"),
              meta: [a.module, a.user_name].filter(Boolean).join(" · ") || "—",
              time: timeAgo(a.created_date),
            }))}
          />
        )}
      </Panel>
    </div>
  );
}