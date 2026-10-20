import React from "react";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/hooks/useList";
import { Check, Banknote } from "lucide-react";

export default function PayoutRow({ settlement, busy, onApprove, onMarkPaid }) {
  return (
    <div className="flex flex-wrap items-center gap-3 px-5 py-3.5">
      <div className="min-w-[180px] flex-1">
        <p className="text-sm font-semibold text-slate-800">{settlement.vendor_name || "Vendor"}</p>
        <p className="text-xs text-slate-500">
          {settlement.period || "—"} · {settlement.order_count || 0} order(s) · Gross {formatINR(settlement.gross)}
        </p>
      </div>
      <span className="text-xs text-slate-500">Commission {formatINR(settlement.commission)}</span>
      <StatusBadge status={settlement.status} tone={statusTone(settlement.status)} />
      <span className="w-24 text-right text-sm font-bold text-slate-900">{formatINR(settlement.net_payable)}</span>
      <div className="flex items-center gap-1.5">
        {settlement.status === "pending" && (
          <Button size="sm" variant="outline" disabled={busy} onClick={() => onApprove(settlement)}>
            <Check className="h-3.5 w-3.5" /> Approve
          </Button>
        )}
        {settlement.status === "approved" && (
          <Button size="sm" disabled={busy} onClick={() => onMarkPaid(settlement)}>
            <Banknote className="h-3.5 w-3.5" /> Mark paid
          </Button>
        )}
        {settlement.status === "paid" && <span className="text-xs font-medium text-emerald-600">Paid out</span>}
      </div>
    </div>
  );
}