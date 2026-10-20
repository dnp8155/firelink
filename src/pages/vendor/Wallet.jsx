import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { formatINR } from "@/hooks/useList";
import { PageHeader, SectionCard, EmptyState, KpiCard } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Wallet, ArrowDownCircle, ArrowUpCircle, IndianRupee, History } from "lucide-react";

export default function VendorWallet() {
  const { toast } = useToast();
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ type: "debit", amount: 0, description: "" });
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmt, setWithdrawAmt] = useState(0);
  const [withdrawBusy, setWithdrawBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const user = await base44.auth.me();
      const vid = user.data?.vendor_id || user.id;
      let wallets = await base44.entities.VendorWallet.filter({ vendor_id: vid }, "-created_date", 1);
      if (wallets.length === 0) { wallets = [await base44.entities.VendorWallet.create({ vendor_id: vid, vendor_name: user.data?.vendor_name || user.full_name || "—", balance: 0, transactions: [] })]; }
      setWallet(wallets[0]);
    } catch (e) { toast({ title: "Failed to load wallet", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const pushTx = async (type, amount, description) => {
    const tx = { type, amount, description, date: new Date().toISOString() };
    const newBalance = type === "credit" ? (wallet.balance || 0) + amount : (wallet.balance || 0) - amount;
    await base44.entities.VendorWallet.update(wallet.id, { balance: newBalance, transactions: [tx, ...(wallet.transactions || [])] });
  };

  const transact = async () => {
    if (!form.amount || form.amount <= 0) { toast({ title: "Enter a valid amount", variant: "destructive" }); return; }
    setBusy(true);
    try {
      await pushTx(form.type, form.amount, form.description || (form.type === "credit" ? "Credit" : "Debit"));
      toast({ title: "Transaction recorded" }); setOpen(false); setForm({ type: "debit", amount: 0, description: "" }); load();
    } catch (e) { toast({ title: "Transaction failed", description: e.message, variant: "destructive" }); }
    finally { setBusy(false); }
  };

  const withdraw = async () => {
    if (!withdrawAmt || withdrawAmt <= 0) { toast({ title: "Enter a valid amount", variant: "destructive" }); return; }
    if (withdrawAmt > (wallet?.balance || 0)) { toast({ title: "Insufficient balance", variant: "destructive" }); return; }
    setWithdrawBusy(true);
    try {
      await pushTx("debit", withdrawAmt, "Withdrawal to bank");
      toast({ title: "Withdrawal initiated", description: `${formatINR(withdrawAmt)} will be transferred to your registered bank account.` });
      setWithdrawOpen(false); setWithdrawAmt(0); load();
    } catch (e) {
      toast({ title: "Withdrawal failed", description: e.message, variant: "destructive" });
    } finally { setWithdrawBusy(false); }
  };

  const txns = wallet?.transactions || [];

  return (
    <div>
      <PageHeader title="Vendor Wallet" subtitle="Track your wallet balance and transaction history." icon={Wallet}
        actions={<>
          <Button variant="outline" onClick={() => setWithdrawOpen(true)} className="border-slate-300">Withdraw to Bank</Button>
          <Button onClick={() => setOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">Add Transaction</Button>
        </>} />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <KpiCard label="Current Balance" value={loading ? "…" : formatINR(wallet?.balance || 0)} icon={IndianRupee} tone="green" />
        <KpiCard label="Total Credits" value={loading ? "—" : formatINR(txns.filter((t) => t.type === "credit").reduce((s, t) => s + (t.amount || 0), 0))} icon={ArrowDownCircle} tone="blue" />
        <KpiCard label="Total Debits" value={loading ? "—" : formatINR(txns.filter((t) => t.type === "debit").reduce((s, t) => s + (t.amount || 0), 0))} icon={ArrowUpCircle} tone="rose" />
      </div>

      <SectionCard title="Transaction History" actions={<History className="h-4 w-4 text-slate-400" />}>
        {loading ? (
          <div className="space-y-3 p-5">{[0, 1, 2].map((i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-200/60" />)}</div>
        ) : txns.length === 0 ? (
          <EmptyState icon={Wallet} title="No transactions yet" description="Your wallet activity will appear here." />
        ) : (
          <div className="divide-y divide-slate-50">
            {txns.map((t, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-full ${t.type === "credit" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>{t.type === "credit" ? <ArrowDownCircle className="h-5 w-5" /> : <ArrowUpCircle className="h-5 w-5" />}</div>
                <div className="min-w-0 flex-1"><p className="text-sm font-medium text-slate-800">{t.description}</p><p className="text-xs text-slate-500">{t.date ? new Date(t.date).toLocaleString() : "—"}</p></div>
                <span className={`text-sm font-semibold ${t.type === "credit" ? "text-emerald-600" : "text-rose-600"}`}>{t.type === "credit" ? "+" : "−"}{formatINR(t.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 text-lg font-semibold text-slate-900">Add Transaction</h3>
            <div className="space-y-3">
              <div><Label>Type</Label><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"><option value="credit">Credit (Add Money)</option><option value="debit">Debit (Withdraw)</option></select></div>
              <div><Label>Amount (₹)</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} /></div>
              <div><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="e.g. Settlement payout" /></div>
            </div>
            <div className="mt-5 flex justify-end gap-2"><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={transact} disabled={busy} className="bg-emerald-600 hover:bg-emerald-700">{busy ? "Processing…" : "Save"}</Button></div>
          </div>
        </div>
      )}

      {withdrawOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setWithdrawOpen(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-1 text-lg font-semibold text-slate-900">Withdraw to Bank</h3>
            <p className="mb-4 text-xs text-slate-500">Available balance: {formatINR(wallet?.balance || 0)}. Funds are recorded as a payout request and transferred to your registered bank account.</p>
            <div className="space-y-3">
              <div><Label>Amount (₹)</Label><Input type="number" value={withdrawAmt} onChange={(e) => setWithdrawAmt(Number(e.target.value))} placeholder="Enter withdrawal amount" /></div>
            </div>
            <div className="mt-5 flex justify-end gap-2"><Button variant="outline" onClick={() => setWithdrawOpen(false)}>Cancel</Button><Button onClick={withdraw} disabled={withdrawBusy} className="bg-emerald-600 hover:bg-emerald-700">{withdrawBusy ? "Processing…" : "Withdraw"}</Button></div>
          </div>
        </div>
      )}
    </div>
  );
}