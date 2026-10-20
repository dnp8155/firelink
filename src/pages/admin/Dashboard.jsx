import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { EmptyState } from "@/components/ui-bits";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import { formatINR } from "@/hooks/useList";
import { countByField, timeAgo } from "@/lib/format";
import DashHero, { HERO_BTN, HERO_BTN_GHOST } from "@/components/dashboard/DashHero";
import StatTile from "@/components/dashboard/StatTile";
import Panel from "@/components/dashboard/Panel";
import PanelRow from "@/components/dashboard/PanelRow";
import ProgressRing from "@/components/dashboard/ProgressRing";
import QuickActions from "@/components/dashboard/QuickActions";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import DashboardSkeleton from "@/components/dashboard/DashboardSkeleton";
import {
  Store, Package, ShoppingCart, IndianRupee, Percent, Wallet, LifeBuoy, UserCheck,
  Activity, ReceiptText, ClipboardCheck, ScrollText, ShieldCheck,
} from "lucide-react";

const VENDOR_QUEUE = ["submitted", "under_review", "documents_required"];
const TICKET_OPEN = ["open", "assigned", "in_progress", "waiting_for_customer"];

const adminActions = [
  { label: "Vendor approvals", hint: "Verify new sellers", path: "/admin/vendors", icon: UserCheck, tone: "amber" },
  { label: "Product approvals", hint: "Review listings", path: "/admin/product-approvals", icon: Package, tone: "primary" },
  { label: "Orders", hint: "Marketplace fulfilment", path: "/admin/orders", icon: ShoppingCart, tone: "sky" },
  { label: "Payments", hint: "Settlements & payouts", path: "/admin/payments", icon: Wallet, tone: "emerald" },
  { label: "Support tickets", hint: "Customer escalations", path: "/admin/tickets", icon: LifeBuoy, tone: "violet" },
  { label: "Audit log", hint: "Every platform change", path: "/admin/audit", icon: ScrollText, tone: "slate" },
];

export default function AdminDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    let alive = true;
    Promise.all([
      base44.entities.Vendor.aggregate({ groupBy: "approval_status" }),
      base44.entities.Product.aggregate({ groupBy: "approval_status" }),
      base44.entities.Order.aggregate({ sum: ["total"] }),
      base44.entities.Settlement.aggregate({ groupBy: "status", sum: ["commission", "net_payable"] }),
      base44.entities.SupportTicket.aggregate({ groupBy: "status" }),
      base44.entities.Vendor.filter({ approval_status: { $in: VENDOR_QUEUE } }, { sort: "-created_date", limit: 5, fields: ["company_name", "business_type", "city", "approval_status", "created_date"] }),
      base44.entities.Product.filter({ approval_status: "pending" }, { sort: "-created_date", limit: 5, fields: ["name", "sku", "vendor_name", "price", "approval_status", "created_date"] }),
      base44.entities.Order.filter({}, { sort: "-created_date", limit: 6, fields: ["order_number", "customer_name", "vendor_name", "total", "status", "created_date"] }),
      base44.entities.AuditLog.filter({}, { sort: "-created_date", limit: 6, fields: ["action", "module", "user_name", "created_date"] }),
    ]).then(([vendors, products, orders, settlements, tickets, vendorQueue, productQueue, recentOrders, activity]) => {
      if (!alive) return;
      const v = countByField(vendors.rows, "approval_status");
      const p = countByField(products.rows, "approval_status");
      const t = countByField(tickets.rows, "status");
      const s = settlements.rows || [];
      const orderTotals = (orders.rows || [])[0] || {};
      setData({
        pendingVendors: VENDOR_QUEUE.reduce((n, k) => n + (v[k] || 0), 0),
        approvedVendors: v.approved || 0,
        pendingProducts: p.pending || 0,
        approvedProducts: p.approved || 0,
        orders: orderTotals.count || 0,
        gmv: orderTotals.sum_total || 0,
        commission: s.reduce((n, r) => n + (r.sum_commission || 0), 0),
        payoutsDue: s.filter((r) => r.status === "pending").reduce((n, r) => n + (r.sum_net_payable || 0), 0),
        openTickets: TICKET_OPEN.reduce((n, k) => n + (t[k] || 0), 0),
        vendorQueue: vendorQueue.items || [],
        productQueue: productQueue.items || [],
        recentOrders: recentOrders.items || [],
        activity: activity.items || [],
      });
    });
    return () => { alive = false; };
  }, []);

  if (!data) return <DashboardSkeleton tiles={8} panels={3} />;

  const vendorRate = data.approvedVendors + data.pendingVendors === 0 ? 100 : Math.round((data.approvedVendors / (data.approvedVendors + data.pendingVendors)) * 100);
  const productRate = data.approvedProducts + data.pendingProducts === 0 ? 100 : Math.round((data.approvedProducts / (data.approvedProducts + data.pendingProducts)) * 100);

  return (
    <div className="space-y-5">
      <DashHero
        eyebrow="Platform admin · Command center"
        title="Command Center"
        subtitle="Marketplace health, approval queues, money movement and support — the whole operation in one view."
        meta={new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        stats={[
          { label: "Marketplace GMV", value: formatINR(data.gmv), sub: `${data.orders} orders` },
          { label: "Commission earned", value: formatINR(data.commission), sub: "Platform share" },
          { label: "Payouts due", value: formatINR(data.payoutsDue), sub: "Pending settlements" },
          { label: "Open tickets", value: data.openTickets, sub: "Support queue" },
        ]}
        actions={
          <>
            <Link to="/admin/vendors" className={HERO_BTN}>
              <UserCheck className="h-4 w-4" /> Review vendors ({data.pendingVendors})
            </Link>
            <Link to="/admin/product-approvals" className={HERO_BTN_GHOST}>
              <Package className="h-4 w-4" /> Product approvals ({data.pendingProducts})
            </Link>
          </>
        }
      />

      <QuickActions items={adminActions} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Vendors to review" value={data.pendingVendors} sub={`${data.approvedVendors} approved live`} icon={UserCheck} tone="amber" href="/admin/vendors" />
        <StatTile label="Products to approve" value={data.pendingProducts} sub={`${data.approvedProducts} listed`} icon={Package} tone="primary" href="/admin/product-approvals" />
        <StatTile label="Orders" value={data.orders} sub="All time" icon={ShoppingCart} tone="sky" href="/admin/orders" />
        <StatTile label="Marketplace GMV" value={formatINR(data.gmv)} sub="Order value" icon={IndianRupee} tone="violet" href="/admin/analytics" />
        <StatTile label="Commission earned" value={formatINR(data.commission)} sub="Platform share" icon={Percent} tone="emerald" href="/admin/commissions" />
        <StatTile label="Payouts due" value={formatINR(data.payoutsDue)} sub="Pending settlements" icon={Wallet} tone="teal" href="/admin/payments" />
        <StatTile label="Open tickets" value={data.openTickets} sub="Support queue" icon={LifeBuoy} tone="amber" href="/admin/tickets" />
        <StatTile label="Vendors" value={data.approvedVendors + data.pendingVendors} sub="Approved + in review" icon={Store} tone="slate" href="/admin/vendors" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Marketplace health" subtitle="Approval coverage" icon={ShieldCheck} bodyClassName="p-5">
          <div className="flex items-center justify-around gap-2">
            <ProgressRing value={vendorRate} size={104} stroke={9} tone="emerald" label="vendors" />
            <ProgressRing value={productRate} size={104} stroke={9} tone="sky" label="catalog" />
          </div>
          <div className="mt-5 space-y-2">
            {[
              { label: "Vendors in review", value: data.pendingVendors },
              { label: "Products in review", value: data.pendingProducts },
              { label: "Open support tickets", value: data.openTickets },
            ].map((r) => (
              <div key={r.label} className="flex items-center justify-between border-t border-border pt-2">
                <span className="text-xs text-muted-foreground">{r.label}</span>
                <span className="text-xs font-semibold tabular-nums text-foreground">{r.value}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel
          title="Vendor applications"
          count={data.vendorQueue.length}
          icon={Store}
          action={<Link to="/admin/vendors" className="font-semibold text-primary hover:underline">Open queue</Link>}
          bodyClassName="divide-y divide-border"
        >
          {data.vendorQueue.length === 0 ? (
            <EmptyState icon={Store} title="Nothing pending" description="New vendor applications appear here for verification." />
          ) : (
            data.vendorQueue.map((v) => (
              <PanelRow
                key={v.id}
                icon={Store}
                tone="amber"
                title={v.company_name}
                meta={[String(v.business_type || "").replace(/_/g, " "), v.city].filter(Boolean).join(" · ") || "—"}
                trailing={
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="hidden text-xs tabular-nums text-muted-foreground sm:inline">{timeAgo(v.created_date)}</span>
                    <StatusBadge status={v.approval_status} tone={statusTone(v.approval_status)} />
                  </div>
                }
                href="/admin/vendors"
              />
            ))
          )}
        </Panel>

        <Panel
          title="Products awaiting approval"
          count={data.productQueue.length}
          icon={Package}
          action={<Link to="/admin/product-approvals" className="font-semibold text-primary hover:underline">Open queue</Link>}
          bodyClassName="divide-y divide-border"
        >
          {data.productQueue.length === 0 ? (
            <EmptyState icon={Package} title="Nothing pending" description="Products submitted by vendors appear here for review." />
          ) : (
            data.productQueue.map((p) => (
              <PanelRow
                key={p.id}
                icon={Package}
                tone="primary"
                title={p.name}
                meta={[p.sku, p.vendor_name].filter(Boolean).join(" · ") || "—"}
                trailing={<span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">{formatINR(p.price)}</span>}
                href="/admin/product-approvals"
              />
            ))
          )}
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel
          title="Recent orders"
          count={data.recentOrders.length}
          icon={ShoppingCart}
          className="lg:col-span-2"
          action={<Link to="/admin/orders" className="font-semibold text-primary hover:underline">View all</Link>}
          bodyClassName="divide-y divide-border"
        >
          {data.recentOrders.length === 0 ? (
            <EmptyState icon={ShoppingCart} title="No orders yet" description="Marketplace orders appear here as buyers check out." />
          ) : (
            data.recentOrders.map((o) => (
              <PanelRow
                key={o.id}
                icon={ReceiptText}
                tone="sky"
                title={o.order_number || "—"}
                meta={[o.customer_name, o.vendor_name].filter(Boolean).join(" · ") || "—"}
                trailing={
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-sm font-semibold tabular-nums text-foreground">{formatINR(o.total)}</span>
                    <StatusBadge status={o.status} tone={statusTone(o.status)} />
                  </div>
                }
                href="/admin/orders"
              />
            ))
          )}
        </Panel>

        <Panel title="Recent admin activity" subtitle="Approvals and platform changes" icon={Activity} bodyClassName="py-1">
          {data.activity.length === 0 ? (
            <EmptyState icon={Activity} title="No activity yet" description="Approvals and platform changes are logged here." />
          ) : (
            <ActivityFeed
              items={data.activity.map((a) => ({
                id: a.id,
                icon: ClipboardCheck,
                tone: "primary",
                title: String(a.action || "change").replace(/_/g, " "),
                meta: [a.module, a.user_name].filter(Boolean).join(" · ") || "—",
                time: timeAgo(a.created_date),
              }))}
            />
          )}
        </Panel>
      </div>
    </div>
  );
}