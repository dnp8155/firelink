import React, { useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useList, formatINR } from "@/hooks/useList";
import { useVendor } from "@/lib/vendor";
import { KpiCard, PageHeader, SectionCard, EmptyState } from "@/components/ui-bits";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { IndianRupee, Wallet, Hourglass, Landmark, ReceiptText } from "lucide-react";

const RATE = 0.05;
const DEAD = ["cancelled", "returned", "refunded"];

export default function Settlements() {
  const { vendor } = useVendor();
  const { toast } = useToast();
  const orders = useList("Order", {}, "-created_date", 300);
  const settlements = useList("Settlement", {}, "-created_date", 100);
  const [busy, setBusy] = useState(false);

  const mine = orders.data.filter(
    (o) => vendor && (o.vendor_id === vendor.id || (o.vendor_name && o.vendor_name === vendor.company_name))
  );
  const settledIds = useMemo(() => new Set(settlements.data.flatMap((s) => s.order_ids || [])), [settlements.data]);
  const eligible = mine.filter((o) => o.payment_status === "paid" && !settledIds.has(o.id) && !DEAD.includes(o.status));
  const paidSales = mine.filter((o) => o.payment_status === "paid" && !DEAD.includes(o.status));
  const gross = paidSales.reduce((s, o) => s + (o.total || 0), 0);
  const awaiting = eligible.reduce((s, o) => s + (o.total || 0), 0) * (1 - RATE);
  const paidOut = settlements.data.filter((s) => s.status === "paid").reduce((s, x) => s + (x.net_payable || 0), 0);
  const commission = Math.round(gross * RATE);

  const generate = async () => {
    if (!vendor || eligible.length === 0) return;
    setBusy(true);
    try {
      const g = eligible.reduce((s, o) => s + (o.total || 0), 0);
      const c = Math.round(g * RATE);
      await base44.entities.Settlement.create({
        vendor_id: vendor.id,
        vendor_name: vendor.company_name,
        period: new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
        order_ids: eligible.map((o) => o.id),
        order_count: eligible.length,
        gross: g,
        commission_rate: RATE,
        commission: c,
        net_payable: g - c,
        status: "pending",
      });
      toast({ title: "Settlement generated", description: `${eligible.length} order(s) — payout request of ${formatINR(g - c)} submitted.` });
      settlements.reload();
    } catch (e) {
      toast({ title: "Failed to generate settlement", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const rowState = (o) => {
    if (settledIds.has(o.id)) return { label: "In settlement", tone: "violet" };
    if (DEAD.includes(o.status)) return { label: o.status, tone: "rose" };
    if (o.payment_status === "paid") return { label: "Ready for settlement", tone: "green" };
    return { label: "Awaiting payment", tone: "amber" };
  };

  return (
    <div>
      <PageHeader
        title="Settlements"
        subtitle="Paid orders, platform commission (5%) and payout requests."
        icon={IndianRupee}
        actions={
          <Button onClick={generate} disabled={busy || eligible.length === 0} className="bg-rose-600 hover:bg-rose-700">
            <ReceiptText className="h-4 w-4" /> {busy ? "Generating…" : `Generate Settlement (${eligible.length})`}
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Gross Paid Sales" value={formatINR(gross)} icon={IndianRupee} tone="rose" />
        <KpiCard label="Platform Commission (5%)" value={formatINR(commission)} icon={Landmark} tone="slate" />
        <KpiCard label="Awaiting Payout" value={formatINR(Math.round(awaiting))} icon={Hourglass} tone="amber" sub={`${eligible.length} eligible order(s)`} />
        <KpiCard label="Paid Out" value={formatINR(paidOut)} icon={Wallet} tone="green" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <SectionCard title="Settlement History">
          {settlements.loading ? (
            <div className="space-y-3 p-5">{[0, 1].map((i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />)}</div>
          ) : settlements.data.length === 0 ? (
            <EmptyState icon={ReceiptText} title="No settlements yet" description="Generate a settlement from your eligible paid orders." />
          ) : (
            <div className="divide-y divide-slate-50">
              {settlements.data.map((s) => (
                <div key={s.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800">{s.period}</p>
                    <p className="text-xs text-slate-500">{s.order_count} order(s) · Commission {formatINR(s.commission)}</p>
                  </div>
                  <StatusBadge status={s.status} tone={statusTone(s.status)} />
                  <span className="w-24 text-right text-sm font-bold text-slate-900">{formatINR(s.net_payable)}</span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Payment Ledger">
          {orders.loading ? (
            <div className="space-y-3 p-5">{[0, 1, 2].map((i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />)}</div>
          ) : mine.length === 0 ? (
            <EmptyState icon={IndianRupee} title="No transactions yet" description="Customer payments will appear here." />
          ) : (
            <div className="divide-y divide-slate-50">
              {mine.map((o) => {
                const st = rowState(o);
                return (
                  <div key={o.id} className="flex items-center gap-3 px-5 py-3.5">
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-sm font-medium text-slate-800">{o.order_number}</p>
                      <p className="text-xs text-slate-500">{o.customer_name} · {o.payment_method || "—"} · {o.created_date?.slice(0, 10)}</p>
                    </div>
                    <span className={`text-[11px] font-medium ${st.tone === "green" ? "text-emerald-600" : st.tone === "violet" ? "text-violet-600" : st.tone === "amber" ? "text-amber-600" : "text-rose-500"}`}>{st.label}</span>
                    <span className="w-24 text-right text-sm font-bold text-slate-900">{formatINR(o.total)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}