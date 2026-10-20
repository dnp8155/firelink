import React, { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { PageHeader, KpiCard, EmptyState, SectionCard } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import ApprovalDialog from "@/components/admin/ApprovalDialog";
import { useAuth } from "@/lib/AuthContext";
import { formatDate, timeAgo } from "@/lib/format";
import { formatINR } from "@/hooks/useList";
import { Users, Search, ChevronRight, IndianRupee, ShoppingCart, UserCheck } from "lucide-react";

const NON_CUSTOMER_ROLES = ["vendor", "vendor_admin", "technician", "engineer", "platform_admin", "super_admin"];

export default function Customers() {
  const { user } = useAuth();
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [stats, setStats] = useState(null);
  const [active, setActive] = useState(null);
  const [orders, setOrders] = useState({ loading: false, items: [] });

  const load = useCallback(async () => {
    setLoading(true);
    const [userList, spend] = await Promise.all([
      base44.entities.User.list(),
      base44.entities.Order.aggregate({ groupBy: "customer_id", sum: ["total"] }),
    ]);
    const all = Array.isArray(userList) ? userList : userList.items || [];
    const spendMap = {};
    (spend.rows || []).forEach((r) => { spendMap[r.customer_id] = { orders: r.count || 0, spend: r.sum_total || 0 }; });
    const buyers = all
      .filter((u) => !NON_CUSTOMER_ROLES.includes(String(u.role || "").toLowerCase()))
      .map((u) => ({ ...u, ...(spendMap[u.id] || { orders: 0, spend: 0 }) }));
    setPeople(buyers);
    const withOrders = buyers.filter((b) => b.orders > 0);
    const totalSpend = buyers.reduce((n, b) => n + b.spend, 0);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    setStats({
      total: buyers.length,
      withOrders: withOrders.length,
      spend: totalSpend,
      avg: withOrders.length ? Math.round(totalSpend / withOrders.length) : 0,
      newThisMonth: buyers.filter((b) => String(b.created_date || "") >= monthStart).length,
    });
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCustomer = async (person) => {
    setActive(person);
    setOrders({ loading: true, items: [] });
    const page = await base44.entities.Order.filter({ customer_id: person.id }, { sort: "-created_date", limit: 10 });
    setOrders({
      loading: false,
      items: (page.items || []).map((o) => ({ id: o.id, type: o.order_number, status: `${formatINR(o.total)} · ${o.status}` })),
    });
  };

  const term = query.trim().toLowerCase();
  const visible = term
    ? people.filter((p) => `${p.full_name || ""} ${p.email || ""}`.toLowerCase().includes(term))
    : people;

  return (
    <div>
      <PageHeader title="Customers" icon={Users} subtitle="Buyer accounts, their order history and lifetime value." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Customers" value={stats?.total ?? "—"} sub={stats ? `${stats.newThisMonth} joined this month` : null} icon={Users} tone="blue" />
        <KpiCard label="Active buyers" value={stats?.withOrders ?? "—"} sub="placed at least one order" icon={UserCheck} tone="green" />
        <KpiCard label="Lifetime value" value={stats ? formatINR(stats.spend) : "—"} sub="across all customers" icon={IndianRupee} tone="violet" />
        <KpiCard label="Avg per buyer" value={stats ? formatINR(stats.avg) : "—"} icon={ShoppingCart} tone="teal" />
      </div>

      <div className="relative mt-6 w-full max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or email…" className="pl-9" />
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}</div>
        ) : visible.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <EmptyState icon={Users} title="No customers here" description="Buyer accounts appear here once they sign up." />
          </div>
        ) : (
          <SectionCard title={`Customers (${visible.length})`}>
            <div className="divide-y divide-slate-50">
              {visible.map((p) => (
                <div key={p.id} className="flex flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500">
                      {String(p.full_name || p.email || "?").slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">{p.full_name || p.email || "—"}{p.id === user?.id && <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">You</span>}</p>
                      <p className="truncate text-xs text-slate-500">{p.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 sm:justify-end">
                    <span className="text-xs text-slate-500">{p.orders} order{p.orders === 1 ? "" : "s"}</span>
                    <span className="text-sm font-semibold text-slate-900">{formatINR(p.spend)}</span>
                    <span className="hidden text-xs text-slate-400 md:inline">joined {timeAgo(p.created_date)}</span>
                    <Button size="sm" variant="outline" onClick={() => openCustomer(p)}>View <ChevronRight className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        )}
      </div>

      <ApprovalDialog
        open={!!active}
        onClose={() => setActive(null)}
        title={active?.full_name || active?.email || ""}
        subtitle={active?.email || ""}
        details={active ? [
          { label: "Orders placed", value: active.orders },
          { label: "Lifetime value", value: formatINR(active.spend) },
          { label: "Role", value: active.role },
          { label: "Joined on", value: formatDate(active.created_date) },
        ] : []}
        documents={orders}
        documentsTitle="Recent orders"
      />
    </div>
  );
}