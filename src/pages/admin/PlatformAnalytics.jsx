import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { formatINR } from "@/hooks/useList";
import { KpiCard, PageHeader, SectionCard, EmptyState } from "@/components/ui-bits";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";
import { BarChart3, ShoppingBag, Store, Building2, Package, FileText, Boxes } from "lucide-react";

const COLORS = ["#e11d48", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#64748b"];
const TOOLTIP = { borderRadius: 12, border: "1px solid #e2e8f0" };

export default function PlatformAnalytics() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [orders, products, rfqs, vendors, productCount, vendorCount, orgCount, assetCount] = await Promise.all([
        base44.entities.Order.aggregate({ groupBy: "status", sum: "total" }),
        base44.entities.Product.aggregate({ groupBy: "category" }),
        base44.entities.RFQ.aggregate({ groupBy: "status" }),
        base44.entities.Vendor.aggregate({ groupBy: "company_name", sum: "revenue", sort: "-sum_revenue", limit: 8 }),
        base44.entities.Product.count({}),
        base44.entities.Vendor.count({}),
        base44.entities.Organization.count({}),
        base44.entities.Asset.count({}),
      ]);
      if (!alive) return;
      const orderRows = orders.rows || [];
      const rfqRows = rfqs.rows || [];
      setData({
        gmv: orderRows.reduce((s, r) => s + (r.sum_total || 0), 0),
        orderCount: orderRows.reduce((s, r) => s + (r.count || 0), 0),
        rfqCount: rfqRows.reduce((s, r) => s + (r.count || 0), 0),
        statusData: orderRows.map((r) => ({ name: r.status, value: r.count || 0 })),
        catData: (products.rows || []).map((r) => ({ name: r.category || "Uncategorised", value: r.count || 0 })),
        rfqData: rfqRows.map((r) => ({ name: r.status, value: r.count || 0 })),
        vendorData: (vendors.rows || []).map((r) => ({ name: r.company_name || "—", value: r.sum_revenue || 0 })),
        counts: { products: productCount, vendors: vendorCount, orgs: orgCount, assets: assetCount },
      });
      setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  if (loading || !data) return <div className="h-96 animate-pulse rounded-2xl bg-slate-100" />;

  return (
    <div>
      <PageHeader title="Platform Analytics" icon={BarChart3} subtitle="Marketplace performance, growth and RFQ conversion." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 xl:grid-cols-7">
        <KpiCard label="GMV" value={formatINR(data.gmv)} icon={BarChart3} tone="rose" />
        <KpiCard label="Orders" value={data.orderCount} icon={Package} tone="blue" />
        <KpiCard label="RFQs" value={data.rfqCount} icon={FileText} tone="violet" />
        <KpiCard label="Products" value={data.counts.products} icon={ShoppingBag} tone="green" />
        <KpiCard label="Vendors" value={data.counts.vendors} icon={Store} tone="amber" />
        <KpiCard label="Organizations" value={data.counts.orgs} icon={Building2} tone="teal" />
        <KpiCard label="Assets Managed" value={data.counts.assets} icon={Boxes} tone="slate" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <SectionCard title="Orders by Status">
          <div className="h-64 p-4">
            {data.statusData.length === 0 ? <EmptyState title="No orders" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.statusData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                    {data.statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Catalog by Category">
          <div className="h-64 p-4">
            {data.catData.length === 0 ? <EmptyState title="No products" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.catData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} interval={0} angle={-20} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={TOOLTIP} />
                  <Bar dataKey="value" fill="#e11d48" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </SectionCard>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <SectionCard title="RFQ Pipeline">
          <div className="h-64 p-4">
            {data.rfqData.length === 0 ? <EmptyState title="No RFQs" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.rfqData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                    {data.rfqData.map((_, i) => <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Top Vendors by Revenue">
          <div className="h-64 p-4">
            {data.vendorData.length === 0 ? <EmptyState title="No vendor revenue yet" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.vendorData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={110} />
                  <Tooltip formatter={(v) => formatINR(v)} contentStyle={TOOLTIP} />
                  <Bar dataKey="value" fill="#3b82f6" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}