import React from "react";
import { Link } from "react-router-dom";
import { useList, formatINR } from "@/hooks/useList";
import { useRole } from "@/lib/RoleContext";
import { useCart } from "@/lib/CartContext";
import { Image } from "@/components/ui/image";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import { EmptyState } from "@/components/ui-bits";
import DashHero, { HERO_BTN, HERO_BTN_GHOST } from "@/components/dashboard/DashHero";
import StatTile from "@/components/dashboard/StatTile";
import Panel from "@/components/dashboard/Panel";
import PanelRow from "@/components/dashboard/PanelRow";
import ProgressRing from "@/components/dashboard/ProgressRing";
import QuickActions from "@/components/dashboard/QuickActions";
import {
  Wrench, AlertCircle, ShoppingBag, ShoppingCart, Star, ArrowRight, ShieldCheck,
  TrendingUp, Award, FileText, Store, LifeBuoy, Boxes,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";

const OPEN_STATUS = ["open", "assigned", "in_progress"];

const customerActions = [
  { label: "Marketplace", hint: "Browse fire safety products", path: "/customer/marketplace", icon: Store, tone: "primary" },
  { label: "Book a service", hint: "Schedule an engineer visit", path: "/customer/services", icon: Wrench, tone: "amber" },
  { label: "My assets", hint: "Track equipment by site", path: "/customer/assets", icon: Boxes, tone: "violet" },
  { label: "Certificates", hint: "Validity and renewals", path: "/customer/certificates", icon: Award, tone: "emerald" },
  { label: "Raise an RFQ", hint: "Get vendor quotations", path: "/customer/rfqs", icon: FileText, tone: "sky" },
  { label: "Support desk", hint: "Tickets and help", path: "/customer/support", icon: LifeBuoy, tone: "slate" },
];

export default function CustomerDashboard() {
  const { roleConfig } = useRole();
  const certs = useList("Certificate", {}, "-expiry_date", 50);
  const services = useList("ServiceRequest", {}, "-created_date", 50);
  const products = useList("Product", { approval_status: "approved" }, "-rating", 8);
  const { add, count: cartCount, total: cartTotal } = useCart();

  const recommended = products.data.slice(0, 4);
  const openRequests = services.data.filter((s) => OPEN_STATUS.includes(s.status));
  const upcoming = openRequests.slice(0, 4);
  const inProgress = services.data.filter((s) => s.status === "in_progress").length;
  const complianceAlerts = certs.data.filter((c) => ["expiring_soon", "expired"].includes(c.status));
  const expired = certs.data.filter((c) => c.status === "expired").length;
  const expiring = certs.data.filter((c) => c.status === "expiring_soon").length;
  const valid = certs.data.filter((c) => c.status === "valid").length;
  const totalCerts = certs.data.length;
  const complianceScore = totalCerts === 0 ? 100 : Math.round((valid / totalCerts) * 100);

  const spendData = [
    { m: "Apr", v: 42000 }, { m: "May", v: 38000 }, { m: "Jun", v: 55000 },
    { m: "Jul", v: 47000 }, { m: "Aug", v: 62000 }, { m: "Sep", v: 51000 },
  ];

  return (
    <div className="space-y-5">
      <DashHero
        eyebrow={`${roleConfig.label} workspace`}
        title={`Welcome back, ${roleConfig.label}`}
        subtitle="Your tasks, compliance, spend and recommendations — all in one control room."
        meta={new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        tone="primary"
        stats={[
          { label: "Open requests", value: openRequests.length, sub: `${inProgress} in progress` },
          { label: "Compliance alerts", value: complianceAlerts.length, sub: `${expired} expired` },
          { label: "Cart", value: formatINR(cartTotal), sub: `${cartCount} items` },
          { label: "Compliance score", value: `${complianceScore}%`, sub: `${valid}/${totalCerts} valid` },
        ]}
        actions={
          <>
            <Link to="/customer/marketplace" className={HERO_BTN}>
              <Store className="h-4 w-4" /> Browse marketplace
            </Link>
            <Link to="/customer/services" className={HERO_BTN_GHOST}>
              <Wrench className="h-4 w-4" /> Book a service
            </Link>
          </>
        }
      />

      <QuickActions items={customerActions} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Open service requests" value={openRequests.length} sub="Assigned or in progress" icon={Wrench} tone="amber" href="/customer/service-requests" />
        <StatTile label="Compliance alerts" value={complianceAlerts.length} sub={`${expired} expired · ${expiring} expiring`} icon={AlertCircle} tone="rose" href="/customer/certificates" />
        <StatTile label="Cart value" value={formatINR(cartTotal)} sub={`${cartCount} items ready to checkout`} icon={ShoppingCart} tone="sky" href="/cart" />
        <StatTile label="Certificates valid" value={`${valid}/${totalCerts}`} sub="Current validity" icon={ShieldCheck} tone="emerald" href="/customer/certificates" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title="Upcoming tasks"
          count={upcoming.length}
          icon={Wrench}
          action={<Link to="/customer/service-requests" className="font-semibold text-primary hover:underline">View all</Link>}
          bodyClassName="divide-y divide-border"
        >
          {upcoming.length === 0 ? (
            <EmptyState icon={Wrench} title="No pending service tasks" description="New service requests and scheduled visits will appear here." />
          ) : (
            upcoming.map((s) => (
              <PanelRow
                key={s.id}
                icon={Wrench}
                tone={s.status === "in_progress" ? "sky" : "amber"}
                title={s.service_type}
                meta={`${s.asset_name || "Asset"} · ${s.scheduled_date || "Not scheduled"}`}
                trailing={<StatusBadge status={s.status} tone={statusTone(s.status)} />}
              />
            ))
          )}
        </Panel>

        <Panel
          title="Compliance alerts"
          count={complianceAlerts.length}
          icon={ShieldCheck}
          action={<Link to="/customer/certificates" className="font-semibold text-primary hover:underline">View all</Link>}
          bodyClassName="divide-y divide-border"
        >
          {complianceAlerts.length === 0 ? (
            <EmptyState icon={ShieldCheck} title="All certificates are valid" description="Nothing is expiring right now — we'll flag anything that needs renewal." />
          ) : (
            complianceAlerts.slice(0, 4).map((c) => (
              <PanelRow
                key={c.id}
                icon={AlertCircle}
                tone={c.status === "expired" ? "rose" : "amber"}
                title={c.title}
                meta={`${c.certificate_number || "Certificate"} · expires ${c.expiry_date || "—"}`}
                trailing={<StatusBadge status={c.status} tone={statusTone(c.status)} />}
              />
            ))
          )}
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel
          title="Spend"
          subtitle="Last 6 months"
          icon={TrendingUp}
          className="lg:col-span-2"
          action={
            <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 font-medium text-emerald-600">
              <TrendingUp className="h-3 w-3" /> +12.4%
            </span>
          }
          bodyClassName="p-4"
        >
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={spendData} barCategoryGap="28%" margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="m" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip
                  cursor={{ fill: "#fff1f2" }}
                  formatter={(v) => [formatINR(v), "Spend"]}
                  contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
                />
                <Bar dataKey="v" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Compliance health" icon={ShieldCheck} bodyClassName="p-5">
          <div className="flex flex-col items-center">
            <ProgressRing value={complianceScore} label="valid" tone={complianceScore >= 80 ? "emerald" : complianceScore >= 50 ? "amber" : "rose"} />
            <p className="mt-3 text-center text-xs text-muted-foreground">
              {valid} valid · {expiring} expiring · {expired} expired
            </p>
          </div>
          <div className="mt-5 space-y-2">
            {[
              { label: "Valid", value: valid, tone: "bg-emerald-500" },
              { label: "Expiring soon", value: expiring, tone: "bg-amber-500" },
              { label: "Expired", value: expired, tone: "bg-rose-500" },
            ].map((r) => (
              <div key={r.label} className="flex items-center gap-3">
                <span className={`h-2 w-2 rounded-full ${r.tone}`} />
                <span className="flex-1 text-xs text-muted-foreground">{r.label}</span>
                <span className="text-xs font-semibold tabular-nums text-foreground">{r.value}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel
        title="Recommended for you"
        subtitle="Top rated products across the marketplace"
        icon={ShoppingBag}
        action={
          <Link to="/customer/marketplace" className="flex items-center gap-1 font-semibold text-primary hover:underline">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        }
        bodyClassName="p-4"
      >
        {products.loading ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-52 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : recommended.length === 0 ? (
          <EmptyState icon={ShoppingBag} title="No recommendations yet" description="Approved products will show up here as vendors list them." />
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {recommended.map((p) => (
              <div key={p.id} className="group overflow-hidden rounded-xl border border-border bg-card transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
                <Link to={`/customer/marketplace/${p.id}`} className="block aspect-square overflow-hidden bg-muted">
                  {p.image_url ? (
                    <Image src={p.image_url} fittingType="fill" className="h-full w-full transition group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground/50">
                      <ShoppingBag className="h-8 w-8" />
                    </div>
                  )}
                </Link>
                <div className="p-3">
                  <Link to={`/customer/marketplace/${p.id}`} className="line-clamp-1 text-xs font-semibold text-foreground hover:text-primary">
                    {p.name}
                  </Link>
                  <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    {p.rating || "New"}
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-sm font-bold tabular-nums text-foreground">{formatINR(p.price)}</span>
                    <button
                      onClick={() => add(p)}
                      className="flex items-center gap-1 rounded-md bg-primary px-2.5 py-1.5 text-[11px] font-semibold text-primary-foreground transition hover:bg-primary/90"
                    >
                      <ShoppingCart className="h-3 w-3" /> Add
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}