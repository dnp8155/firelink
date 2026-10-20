import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { useList, formatINR } from "@/hooks/useList";
import { useVendor, profileCompletion, missingProfileItems, VENDOR_STAGES, stageIndex } from "@/lib/vendor";
import { EmptyState } from "@/components/ui-bits";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import DashHero, { HERO_BTN, HERO_BTN_GHOST } from "@/components/dashboard/DashHero";
import StatTile from "@/components/dashboard/StatTile";
import Panel from "@/components/dashboard/Panel";
import PanelRow from "@/components/dashboard/PanelRow";
import ProgressRing from "@/components/dashboard/ProgressRing";
import QuickActions from "@/components/dashboard/QuickActions";
import DashboardSkeleton from "@/components/dashboard/DashboardSkeleton";
import {
  IndianRupee, Package, FileText, ReceiptText, Boxes, AlertTriangle, Truck,
  Plus, Warehouse, BarChart3, Wrench, ShieldCheck, Star, Store, ClipboardCheck, ArrowRight, CheckCircle2, Upload,
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";

const vendorActions = [
  { label: "Add product", hint: "List a new item", path: "/vendor/products", icon: Plus, tone: "emerald" },
  { label: "Create quote", hint: "Respond to RFQs", path: "/vendor/rfqs", icon: ReceiptText, tone: "sky" },
  { label: "Update inventory", hint: "Stock and pricing", path: "/vendor/inventory", icon: Warehouse, tone: "amber" },
  { label: "View orders", hint: "Fulfil and dispatch", path: "/vendor/orders", icon: Truck, tone: "violet" },
  { label: "Add service", hint: "Publish a service", path: "/vendor/services", icon: Wrench, tone: "teal" },
  { label: "Upload document", hint: "Verification records", path: "/vendor/documents", icon: Upload, tone: "slate" },
];

const title = (s) => String(s || "").replace(/_/g, " ");

export default function VendorDashboard() {
  const { user } = useAuth();
  const { vendor, loading } = useVendor();
  const products = useList("Product", {}, "-created_date", 300);
  const orders = useList("Order", {}, "-created_date", 300);
  const rfqs = useList("RFQ", { status: "open" }, "-created_date", 100);
  const quotes = useList("Quotation", {}, "-created_date", 100);
  const docs = useList("VendorDocument", {}, "-created_date", 100);

  if (loading) return <DashboardSkeleton tiles={8} />;

  if (!vendor) {
    return (
      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <EmptyState
          icon={Store}
          title="No vendor profile found"
          description="This account isn't linked to a vendor company yet. Register your company to start selling on FireLink."
          action={<Link to="/vendor/register" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">Register as Vendor</Link>}
        />
      </div>
    );
  }

  const status = vendor.approval_status;

  // ---------- PRE-APPROVAL ONBOARDING DASHBOARD ----------
  if (status !== "approved") {
    const myDocs = docs.data.filter((d) => d.vendor_id === vendor.id);
    const pendingDocs = 6 - myDocs.filter((d) => ["uploaded", "under_review", "approved"].includes(d.status)).length;
    const needAction = myDocs.filter((d) => ["rejected", "replacement_required"].includes(d.status));
    const currentStage = stageIndex(status);
    const completion = profileCompletion(vendor);

    return (
      <div className="space-y-5">
        <DashHero
          eyebrow="Vendor onboarding"
          title={`Welcome, ${vendor.company_name}`}
          subtitle="Your onboarding centre — complete verification to unlock selling, quoting and payouts."
          meta={`Application status: ${title(status)}`}
          tone="amber"
          stats={[
            { label: "Profile completion", value: `${completion}%` },
            { label: "Documents pending", value: Math.max(0, pendingDocs) },
            { label: "Admin requests", value: needAction.length },
            { label: "Stage", value: `${Math.min(currentStage + 1, VENDOR_STAGES.length)}/${VENDOR_STAGES.length}` },
          ]}
          actions={
            <Link to="/vendor/verification" className={HERO_BTN}>
              <ShieldCheck className="h-4 w-4" /> Complete verification
            </Link>
          }
        />

        {status === "rejected" && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4">
            <p className="text-sm font-bold text-rose-800">Application rejected</p>
            <p className="mt-1 text-sm text-rose-700">{vendor.rejection_reason || vendor.admin_remarks || "Please contact support for details and re-apply."}</p>
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-3">
          <Panel title="Application status" subtitle="Verification pipeline" icon={ClipboardCheck} bodyClassName="p-5">
            <ProgressRing
              value={completion}
              size={132}
              tone={completion >= 80 ? "emerald" : "amber"}
              label="complete"
              sub={`${missingProfileItems(vendor).length} profile items left`}
            />
            <div className="mt-6 space-y-0">
              {VENDOR_STAGES.map((s, i) => {
                const done = i < currentStage;
                const active = i === currentStage;
                return (
                  <div key={s.key} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold ${done ? "bg-emerald-100 text-emerald-600" : active ? "bg-amber-100 text-amber-600 ring-2 ring-amber-200" : "bg-muted text-muted-foreground"}`}>
                        {done ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                      </span>
                      {i < VENDOR_STAGES.length - 1 && <span className={`h-7 w-0.5 ${done ? "bg-emerald-200" : "bg-border"}`} />}
                    </div>
                    <div className="pt-1">
                      <p className={`text-sm font-semibold ${done || active ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</p>
                      {active && <p className="text-xs text-amber-600">In progress</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>

          <div className="space-y-4 lg:col-span-2">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
              <StatTile label="Profile completion" value={`${completion}%`} sub="Keep it above 80%" icon={ClipboardCheck} tone="emerald" />
              <StatTile label="Documents pending" value={Math.max(0, pendingDocs)} sub="Required for approval" icon={FileText} tone="amber" />
              <StatTile label="Admin requests" value={needAction.length} sub="Needs your reply" icon={AlertTriangle} tone="rose" />
            </div>

            <Panel title="Next steps" subtitle="What to do while your application is reviewed" icon={ArrowRight} bodyClassName="p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Link to="/vendor/verification" className="group flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 transition hover:border-emerald-300">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground">Complete verification</p>
                    <p className="text-xs text-muted-foreground">Upload the required documents</p>
                  </div>
                  <span className="shrink-0 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white">Primary</span>
                </Link>
                {[
                  { label: "Company profile", hint: missingProfileItems(vendor).slice(0, 3).join(", ") || "All key details filled", path: "/vendor/company" },
                  { label: "Prepare catalog", hint: "Draft products while you wait", path: "/vendor/products" },
                  { label: "Contact support", hint: "Questions about your application", path: "/vendor/support" },
                ].map((n) => (
                  <Link key={n.path} to={n.path} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 transition hover:border-primary/30">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-foreground">{n.label}</p>
                      <p className="truncate text-xs text-muted-foreground">{n.hint}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/60" />
                  </Link>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      </div>
    );
  }

  // ---------- APPROVED: FULL OPERATING DASHBOARD ----------
  const myProducts = products.data.filter((p) => p.vendor_id === vendor.id || p.created_by_id === user?.id);
  const myOrders = orders.data.filter((o) => o.vendor_id === vendor.id);
  const approvedProducts = myProducts.filter((p) => p.approval_status === "approved");
  const pendingProducts = myProducts.filter((p) => ["pending", "changes_required"].includes(p.approval_status));
  const drafts = myProducts.filter((p) => p.approval_status === "draft");
  const lowStock = myProducts.filter((p) => (p.stock || 0) <= 5);
  const pendingShipments = myOrders.filter((o) => ["accepted", "packed"].includes(o.status));
  const revenue = myOrders.filter((o) => o.payment_status === "paid").reduce((s, o) => s + (o.total || 0), 0);
  const openQuotes = quotes.data.filter((q) => ["submitted", "revised"].includes(q.status));
  const settlementDue = myOrders.filter((o) => o.status === "delivered" && o.payment_status !== "paid").reduce((s, o) => s + (o.total || 0), 0);
  const myDocs = docs.data.filter((d) => d.vendor_id === vendor.id);

  const salesData = myOrders.slice(0, 6).map((o) => ({ m: (o.order_number || "").slice(-4), v: o.total || 0 })).reverse();

  return (
    <div className="space-y-5">
      <DashHero
        eyebrow={`${vendor.company_name} · Vendor console`}
        title="Vendor Dashboard"
        subtitle="Sales, products, inventory and service operations at a glance."
        meta={[vendor.city, vendor.business_type ? title(vendor.business_type) : null].filter(Boolean).join(" · ") || undefined}
        tone="emerald"
        stats={[
          { label: "Revenue", value: formatINR(revenue), sub: "Paid orders" },
          { label: "Orders", value: myOrders.length, sub: `${pendingShipments.length} to fulfil` },
          { label: "New RFQs", value: rfqs.data.length, sub: "Open requests" },
          { label: "Open quotations", value: openQuotes.length, sub: "Submitted or revised" },
        ]}
        actions={
          <>
            <Link to="/vendor/products" className={HERO_BTN}>
              <Plus className="h-4 w-4" /> Add product
            </Link>
            <Link to="/vendor/rfqs" className={HERO_BTN_GHOST}>
              <ReceiptText className="h-4 w-4" /> Create quote
            </Link>
          </>
        }
      />

      <QuickActions items={vendorActions} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Total products" value={myProducts.length} sub={`${approvedProducts.length} live · ${drafts.length} drafts`} icon={Boxes} tone="slate" href="/vendor/products" />
        <StatTile label="Pending approvals" value={pendingProducts.length} sub="Awaiting platform review" icon={AlertTriangle} tone="amber" href="/vendor/products" />
        <StatTile label="Low stock" value={lowStock.length} sub="5 units or fewer" icon={Warehouse} tone="rose" href="/vendor/inventory" />
        <StatTile label="Pending shipments" value={pendingShipments.length} sub="Accepted or packed" icon={Truck} tone="teal" href="/vendor/orders" />
        <StatTile label="Service requests" value={0} sub="Across your technicians" icon={Wrench} tone="violet" href="/vendor/service-requests" />
        <StatTile label="Pending settlement" value={formatINR(settlementDue)} sub="Delivered, not settled" icon={IndianRupee} tone="amber" href="/vendor/settlements" />
        <StatTile label="Customer rating" value={vendor.rating ? vendor.rating.toFixed(1) : "New"} sub="Marketplace reviews" icon={Star} tone="emerald" href="/vendor/analytics" />
        <StatTile label="Verification docs" value={myDocs.length} sub="On file with platform" icon={ShieldCheck} tone="slate" href="/vendor/documents" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Revenue trend" subtitle="Recent orders" icon={BarChart3} className="lg:col-span-2" bodyClassName="p-4">
          <div className="h-60">
            {salesData.length === 0 ? (
              <EmptyState icon={BarChart3} title="No sales data yet" description="Your order revenue will appear here." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesData}>
                  <defs>
                    <linearGradient id="vs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="m" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                  <Tooltip formatter={(v) => formatINR(v)} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
                  <Area type="monotone" dataKey="v" stroke="#10b981" strokeWidth={2} fill="url(#vs)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Panel>

        <Panel
          title="Recent orders"
          count={myOrders.length}
          icon={Package}
          action={<Link to="/vendor/orders" className="font-semibold text-emerald-600 hover:underline">View all</Link>}
          bodyClassName="divide-y divide-border"
        >
          {myOrders.length === 0 ? (
            <EmptyState icon={Package} title="No orders yet" description="Once customers order your products, they'll appear here." />
          ) : (
            myOrders.slice(0, 6).map((o) => (
              <PanelRow
                key={o.id}
                icon={Package}
                tone="emerald"
                title={o.order_number}
                meta={`${o.customer_name || "Customer"} · ${formatINR(o.total)}`}
                trailing={<StatusBadge status={o.status} tone={statusTone(o.status)} />}
                href="/vendor/orders"
              />
            ))
          )}
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel
          title="Inventory alerts"
          count={lowStock.length}
          icon={Warehouse}
          action={<Link to="/vendor/inventory" className="font-semibold text-emerald-600 hover:underline">Restock</Link>}
          bodyClassName="divide-y divide-border"
        >
          {lowStock.length === 0 ? (
            <EmptyState icon={Warehouse} title="Stock levels healthy" description="No product is running low right now." />
          ) : (
            lowStock.slice(0, 5).map((p) => (
              <PanelRow
                key={p.id}
                icon={AlertTriangle}
                tone="rose"
                title={p.name}
                meta={`${p.sku || "No SKU"} · ${p.stock || 0} left`}
                trailing={<StatusBadge status={`${p.stock || 0} in stock`} tone={(p.stock || 0) === 0 ? "red" : "amber"} />}
                href="/vendor/inventory"
              />
            ))
          )}
        </Panel>

        <Panel
          title="Products awaiting approval"
          count={pendingProducts.length}
          icon={Package}
          action={<Link to="/vendor/products" className="font-semibold text-emerald-600 hover:underline">Review</Link>}
          bodyClassName="divide-y divide-border"
        >
          {pendingProducts.length === 0 ? (
            <EmptyState icon={Package} title="Nothing pending" description="All your submitted products have been reviewed." />
          ) : (
            pendingProducts.slice(0, 5).map((p) => (
              <PanelRow
                key={p.id}
                icon={Package}
                tone="amber"
                title={p.name}
                meta={[p.sku, p.category].filter(Boolean).join(" · ") || "—"}
                trailing={<StatusBadge status={p.approval_status} tone={statusTone(p.approval_status)} />}
                href="/vendor/products"
              />
            ))
          )}
        </Panel>

        <Panel
          title="Quotations in play"
          count={openQuotes.length}
          icon={ReceiptText}
          action={<Link to="/vendor/quotations" className="font-semibold text-emerald-600 hover:underline">Open</Link>}
          bodyClassName="divide-y divide-border"
        >
          {openQuotes.length === 0 ? (
            <EmptyState icon={ReceiptText} title="No open quotations" description="Quotes you submit against RFQs appear here." />
          ) : (
            openQuotes.slice(0, 5).map((q) => (
              <PanelRow
                key={q.id}
                icon={ReceiptText}
                tone="sky"
                title={q.quotation_number || q.rfq_title || "Quotation"}
                meta={[q.customer_name || q.buyer_name, q.total ? formatINR(q.total) : null].filter(Boolean).join(" · ") || "—"}
                trailing={<StatusBadge status={q.status} tone={statusTone(q.status)} />}
                href="/vendor/quotations"
              />
            ))
          )}
        </Panel>
      </div>
    </div>
  );
}