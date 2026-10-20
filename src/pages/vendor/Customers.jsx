import React from "react";
import { useList, formatINR } from "@/hooks/useList";
import { useVendor } from "@/lib/vendor";
import { PageHeader, SectionCard, EmptyState } from "@/components/ui-bits";
import { Users, Building2 } from "lucide-react";

export default function Customers() {
  const { vendor } = useVendor();
  const orders = useList("Order", {}, "-created_date", 500);
  const rfqs = useList("RFQ", {}, "-created_date", 200);

  const mine = orders.data.filter((o) => (vendor && o.vendor_id === vendor.id) || (vendor && o.vendor_name === vendor.company_name));

  // Group by customer — only customers who have interacted with this vendor
  const byCustomer = {};
  mine.forEach((o) => {
    const key = o.customer_name || "Unknown Customer";
    if (!byCustomer[key]) byCustomer[key] = { name: key, orders: 0, revenue: 0, lastDate: null };
    byCustomer[key].orders += 1;
    byCustomer[key].revenue += o.total || 0;
    const d = o.created_date ? new Date(o.created_date).getTime() : 0;
    if (d > (byCustomer[key].lastDate || 0)) byCustomer[key].lastDate = d;
  });
  Object.values(byCustomer).forEach((c) => {
    c.rfqs = rfqs.data.filter((r) => r.customer_name === c.name).length;
  });
  const list = Object.values(byCustomer).sort((a, b) => b.revenue - a.revenue);

  return (
    <div>
      <PageHeader title="Customers" icon={Users} subtitle="Organizations that have purchased from you or sent you RFQs." />

      {orders.loading ? (
        <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-200/60" />)}</div>
      ) : list.length === 0 ? (
        <SectionCard>
          <EmptyState icon={Users} title="No customers yet" description="Once customers place orders or send RFQs, their organizations will appear here." />
        </SectionCard>
      ) : (
        <SectionCard>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3 font-medium">Customer Organization</th>
                <th className="px-5 py-3 font-medium">Orders</th>
                <th className="px-5 py-3 font-medium">RFQs</th>
                <th className="px-5 py-3 font-medium">Revenue</th>
                <th className="px-5 py-3 font-medium">Last Activity</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-50">
                {list.map((c) => (
                  <tr key={c.name} className="hover:bg-slate-50/50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                          <Building2 className="h-4 w-4" />
                        </div>
                        <span className="font-medium text-slate-800">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{c.orders}</td>
                    <td className="px-5 py-3 text-slate-600">{c.rfqs}</td>
                    <td className="px-5 py-3 font-semibold text-slate-800">{formatINR(c.revenue)}</td>
                    <td className="px-5 py-3 text-slate-500">
                      {c.lastDate ? new Date(c.lastDate).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}
    </div>
  );
}