import React, { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { orgQuery } from "@/lib/orgScope";
import { PageHeader, SectionCard, EmptyState, KpiCard } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import RenewalRow from "@/components/renewals/RenewalRow";
import RenewalRequestDialog from "@/components/renewals/RenewalRequestDialog";
import {
  RENEWAL_BUCKETS,
  RENEWAL_WINDOW_DAYS,
  bucketOf,
  daysLeft,
  isRenewalRaised,
  isoInDays,
  toRenewalItem,
} from "@/lib/renewals";
import { RefreshCw, CalendarClock, AlertTriangle, Send, Loader2 } from "lucide-react";

// Renewal Center: every certificate / NOC that is expiring or already expired, with a
// one-click way to raise a vendor quotation request for it.
export default function Renewals() {
  const { user } = useAuth();
  const q = orgQuery(user);
  const orgId = user?.data?.organization_id;
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [rfqs, setRfqs] = useState([]);
  const [dialogItems, setDialogItems] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    const window = { $lte: isoInDays(RENEWAL_WINDOW_DAYS) };
    try {
      const [certs, nocs, rfqList] = await Promise.all([
        base44.entities.Certificate.filter({ ...q, expiry_date: window }, "expiry_date", 100),
        base44.entities.NOC.filter({ ...q, expiry_date: window }, "expiry_date", 100),
        base44.entities.RFQ.filter({}, "-created_date", 100),
      ]);
      setItems([
        ...(certs || []).map((c) => toRenewalItem("Certificate", c)),
        ...(nocs || []).map((n) => toRenewalItem("Fire NOC", n)),
      ]);
      setRfqs(rfqList || []);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => { load(); }, [load]);

  const withDays = items.map((i) => ({ ...i, days: daysLeft(i.expiry_date), raised: isRenewalRaised(i, rfqs) }));
  const overdue = withDays.filter((i) => i.days !== null && i.days < 0);
  const next30 = withDays.filter((i) => i.days !== null && i.days >= 0 && i.days <= 30);
  const next90 = withDays.filter((i) => i.days !== null && i.days > 30 && i.days <= 90);
  const raised = withDays.filter((i) => i.raised);
  const dueNow = withDays.filter((i) => !i.raised && ["expired", "soon"].includes(bucketOf(i.days)));

  return (
    <div>
      <PageHeader
        title="Renewal Center"
        subtitle="Certificates and fire NOCs that are expiring — raise a renewal request in one click."
        icon={RefreshCw}
        actions={
          <Button onClick={() => setDialogItems(dueNow)} disabled={dueNow.length === 0}>
            <Send className="h-4 w-4" /> Renew all due ({dueNow.length})
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Expired" value={overdue.length} icon={AlertTriangle} tone="rose" sub="Renew before the next inspection" />
        <KpiCard label="Due in 30 days" value={next30.length} icon={CalendarClock} tone="amber" sub="Act this month" />
        <KpiCard label="Due in 90 days" value={next90.length} icon={CalendarClock} tone="blue" sub="Plan ahead" />
        <KpiCard label="Renewals raised" value={raised.length} icon={Send} tone="green" sub="Awaiting vendor quotations" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : items.length === 0 ? (
        <div className="mt-5">
          <SectionCard>
            <EmptyState
              icon={RefreshCw}
              title="Nothing to renew"
              description="Certificates and fire NOCs appear here once their expiry date is within six months."
            />
          </SectionCard>
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          {RENEWAL_BUCKETS.map((bucket) => {
            const rows = withDays.filter((i) => bucketOf(i.days) === bucket.key);
            if (rows.length === 0) return null;
            return (
              <SectionCard key={bucket.key} title={`${bucket.label} (${rows.length})`}>
                <div className="divide-y divide-slate-50">
                  {rows.map((item) => (
                    <RenewalRow
                      key={item.id}
                      item={item}
                      raised={item.raised}
                      onRequest={(single) => setDialogItems([{ ...single }])}
                    />
                  ))}
                </div>
              </SectionCard>
            );
          })}
        </div>
      )}

      <RenewalRequestDialog
        open={dialogItems.length > 0}
        onOpenChange={(open) => { if (!open) setDialogItems([]); }}
        items={dialogItems}
        onDone={load}
      />
    </div>
  );
}