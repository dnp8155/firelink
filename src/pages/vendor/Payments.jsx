import React from "react";
import { useList, formatINR } from "@/hooks/useList";
import { useVendor } from "@/lib/vendor";
import { PageHeader, SectionCard, EmptyState, KpiCard } from "@/components/ui-bits";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import { CreditCard, IndianRupee, ShieldCheck, Lock } from "lucide-react";

const PLATFORM_FEE_RATE = 0.08;

export default function Payments() {
  const { vendor } = useVendor();
  const orders = useList("Order", {}, "-created_date", 500);

  const mine = orders.data.filter((o) => (vendor && o.vendor_id === vendor.id) || (vendor && o.vendor_name === vendor.company_name));
  const paid = mine.filter((o) => o.payment_status === "paid");
  const gross = paid.reduce((s, o) => s + (o.total || 0), 0);
  const fees = gross * PLATFORM_FEE_RATE;
  const net = gross - fees;

  return (
    <div>
      <PageHeader title="Payments" icon={CreditCard} subtitle="Order payments, platform fees and net earnings. Financial records are managed by the platform and are read-only." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Gross Collected" value={formatINR(gross)} icon={IndianRupee} tone="green" />
        <KpiCard label="Platform Fees (8%)" value={formatINR(fees)} icon={ShieldCheck} tone="slate" />
        <KpiCard label="Net to Settlement" value={formatINR(net)} icon={CreditCard} tone="teal" />
      </div>

      <div className="mt-5 flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-xs text-slate-500">
        <Lock className="h-3.5 w-3.5" /> Transaction records are controlled by FireLink — they cannot be edited by vendors.
      </div>

      {orders.loading ? (
        <div className="mt-5 space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-200/60" />)}</div>
      ) : mine.length === 0 ? (
        <div className="mt-5"><SectionCard><EmptyState icon={CreditCard} title="No payments yet" description="Payments will appear here once customers pay for your orders." /></SectionCard></div>
      ) : (
        <div className="mt-5">
          <SectionCard title="Payment Records">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3 font-medium">Order</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Gross</th>
                  <th className="px-5 py-3 font-medium">Platform Fee</th>
                  <th className="px-5 py-3 font-medium">Net</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {mine.map((o) => {
                    const g = o.total || 0;
                    const f = g * PLATFORM_FEE_RATE;
                    return (
                      <tr key={o.id} className="hover:bg-slate-50/50">
                        <td className="px-5 py-3 font-medium text-slate-800">{o.order_number}</td>
                        <td className="px-5 py-3 text-slate-500">{o.created_date ? new Date(o.created_date).toLocaleDateString() : "—"}</td>
                        <td className="px-5 py-3 font-semibold text-slate-800">{formatINR(g)}</td>
                        <td className="px-5 py-3 text-slate-500">− {formatINR(f)}</td>
                        <td className="px-5 py-3 font-semibold text-emerald-600">{formatINR(g - f)}</td>
                        <td className="px-5 py-3"><StatusBadge status={o.payment_status} tone={statusTone(o.payment_status)} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>
      )}
    </div>
  );
}