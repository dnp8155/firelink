import React, { useCallback, useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useList, formatINR } from "@/hooks/useList";
import { KpiCard, PageHeader, SectionCard, EmptyState } from "@/components/ui-bits";
import PayoutRow from "@/components/admin/PayoutRow";
import QueueHeader from "@/components/admin/QueueHeader";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { logAudit } from "@/lib/auditLog";
import { cn } from "@/lib/utils";
import { CreditCard, IndianRupee, Hourglass, RotateCcw, Wallet, ReceiptText } from "lucide-react";

const SECTIONS = [
  { key: "ledger", label: "Payment ledger" },
  { key: "payouts", label: "Vendor payouts" },
];

const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "paid", label: "Paid" },
  { key: "pending", label: "Pending" },
  { key: "refunded", label: "Refunded" },
  { key: "failed", label: "Failed" },
];

export default function AdminPayments() {
  const { toast } = useToast();
  const [section, setSection] = useState("ledger");
  const [statusKey, setStatusKey] = useState("all");
  const [query, setQuery] = useState("");
  const [kpis, setKpis] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [version, setVersion] = useState(0);

  const orderFilter = useMemo(() => {
    const filter = {};
    if (statusKey !== "all") filter.payment_status = statusKey;
    const term = query.trim();
    if (term) filter.$or = [{ order_number: { $regex: term, $options: "i" } }, { customer_name: { $regex: term, $options: "i" } }];
    return filter;
  }, [statusKey, query]);

  const orders = useList("Order", orderFilter, "-created_date", 50);
  const settlements = useList("Settlement", {}, "-created_date", 50);

  const loadKpis = useCallback(async () => {
    const [byPayment, byPayout] = await Promise.all([
      base44.entities.Order.aggregate({ groupBy: "payment_status", sum: "total" }),
      base44.entities.Settlement.aggregate({ groupBy: "status", sum: "net_payable" }),
    ]);
    const pay = (key) => (byPayment.rows || []).find((r) => r.payment_status === key) || {};
    const out = (key) => (byPayout.rows || []).find((r) => r.status === key) || {};
    setKpis({
      collected: pay("paid").sum_total || 0,
      collectedCount: pay("paid").count || 0,
      awaiting: pay("pending").sum_total || 0,
      awaitingCount: pay("pending").count || 0,
      refunded: pay("refunded").sum_total || 0,
      payoutDue: (out("pending").sum_net_payable || 0) + (out("approved").sum_net_payable || 0),
      payoutDueCount: (out("pending").count || 0) + (out("approved").count || 0),
      payoutDone: out("paid").sum_net_payable || 0,
    });
  }, []);

  useEffect(() => { loadKpis(); }, [loadKpis, version]);

  const decide = async (settlement, status, label) => {
    setBusyId(settlement.id);
    try {
      await base44.entities.Settlement.update(settlement.id, { status });
      await logAudit({
        action: `settlement_${status}`,
        module: "Settlement",
        entityId: settlement.id,
        before: settlement.status,
        after: status,
      });
      toast({ title: label, description: settlement.vendor_name });
      settlements.reload();
      setVersion((v) => v + 1);
    } catch (e) {
      toast({ title: "Could not update payout", description: e.message, variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const money = (v) => (v == null ? "—" : formatINR(v));

  return (
    <div>
      <PageHeader
        title="Payments"
        icon={CreditCard}
        subtitle="Customer payments collected on the platform and the payouts owed to vendors."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Collected" value={money(kpis?.collected)} icon={IndianRupee} tone="green" sub={kpis ? `${kpis.collectedCount} paid order(s)` : "Loading…"} />
        <KpiCard label="Awaiting Payment" value={money(kpis?.awaiting)} icon={Hourglass} tone="amber" sub={kpis ? `${kpis.awaitingCount} order(s)` : "Loading…"} />
        <KpiCard label="Payouts Due" value={money(kpis?.payoutDue)} icon={Wallet} tone="violet" sub={kpis ? `${kpis.payoutDueCount} settlement(s)` : "Loading…"} />
        <KpiCard label="Refunded" value={money(kpis?.refunded)} icon={RotateCcw} tone="rose" sub={kpis ? `Paid out ${formatINR(kpis.payoutDone)}` : "Loading…"} />
      </div>

      <div className="mt-6 inline-flex rounded-xl border border-slate-200 bg-white p-1">
        {SECTIONS.map((s) => (
          <button
            key={s.key}
            onClick={() => setSection(s.key)}
            className={cn(
              "rounded-lg px-3.5 py-1.5 text-sm font-medium transition",
              section === s.key ? "bg-rose-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {section === "ledger" ? (
        <div className="mt-4">
          <QueueHeader
            tabs={STATUS_TABS}
            value={statusKey}
            onChange={setStatusKey}
            query={query}
            onQueryChange={setQuery}
            placeholder="Search order number or customer…"
          />
          {orders.loading ? (
            <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}</div>
          ) : orders.data.length === 0 ? (
            <SectionCard>
              <EmptyState
                icon={CreditCard}
                title="No payments here"
                description="Customer orders and their payment status appear here once orders start coming in."
              />
            </SectionCard>
          ) : (
            <SectionCard>
              <div className="divide-y divide-slate-50">
                {orders.data.map((o) => (
                  <div key={o.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                    <div className="min-w-[180px] flex-1">
                      <p className="font-mono text-sm font-medium text-slate-800">{o.order_number}</p>
                      <p className="text-xs text-slate-500">
                        {[o.customer_name, o.vendor_name, o.created_date ? String(o.created_date).slice(0, 10) : null].filter(Boolean).join(" · ") || "—"}
                      </p>
                    </div>
                    <span className="text-xs text-slate-500">{o.payment_method || "—"}</span>
                    <StatusBadge status={o.payment_status} tone={statusTone(o.payment_status)} />
                    <span className="w-24 text-right text-sm font-semibold text-slate-900">{formatINR(o.total)}</span>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}
        </div>
      ) : (
        <div className="mt-4">
          <SectionCard title="Vendor payout requests">
            {settlements.loading ? (
              <div className="space-y-3 p-5">{[0, 1].map((i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}</div>
            ) : settlements.data.length === 0 ? (
              <EmptyState
                icon={ReceiptText}
                title="No payout requests"
                description="When a vendor generates a settlement from their paid orders, it lands here for approval."
              />
            ) : (
              <div className="divide-y divide-slate-50">
                {settlements.data.map((s) => (
                  <PayoutRow
                    key={s.id}
                    settlement={s}
                    busy={busyId === s.id}
                    onApprove={(x) => decide(x, "approved", "Payout approved")}
                    onMarkPaid={(x) => decide(x, "paid", "Payout marked paid")}
                  />
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      )}
    </div>
  );
}