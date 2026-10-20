import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { orgQuery } from "@/lib/orgScope";
import { PageHeader, SectionCard } from "@/components/ui-bits";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Calendar, Award, Flame, Boxes, Loader2, Printer } from "lucide-react";

const today = new Date();
const isoIn = (days) => new Date(today.getTime() + days * 86400000).toISOString().slice(0, 10);
const monthLabel = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { month: "long", year: "numeric" }) : "No date");

export default function ComplianceCalendar() {
  const { user } = useAuth();
  const q = orgQuery(user);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [months, setMonths] = useState([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const dateWindow = { $gte: today.toISOString().slice(0, 10), $lte: isoIn(180) };
      const [certs, nocs, assets, certMonths, nocMonths] = await Promise.all([
        base44.entities.Certificate.filter({ ...q, expiry_date: dateWindow }, "expiry_date", 50),
        base44.entities.NOC.filter({ ...q, expiry_date: dateWindow }, "expiry_date", 50),
        base44.entities.Asset.filter({ ...q, next_inspection_date: dateWindow }, "next_inspection_date", 50),
        base44.entities.Certificate.aggregate({ query: { ...q, expiry_date: dateWindow }, dateBucket: { field: "expiry_date", unit: "month" } }),
        base44.entities.NOC.aggregate({ query: { ...q, expiry_date: dateWindow }, dateBucket: { field: "expiry_date", unit: "month" } }),
      ]);
      if (!alive) return;
      const merged = [
        ...certs.map((c) => ({ id: `cert-${c.id}`, date: c.expiry_date, label: c.title || c.certificate_number, kind: "Certificate", status: c.status, icon: "award" })),
        ...nocs.map((n) => ({ id: `noc-${n.id}`, date: n.expiry_date, label: `Fire NOC ${n.noc_number}`, kind: "Fire NOC", status: n.status, icon: "flame" })),
        ...assets.map((a) => ({ id: `asset-${a.id}`, date: a.next_inspection_date, label: a.name, kind: "Inspection due", status: a.condition, icon: "boxes" })),
      ].sort((a, b) => String(a.date).localeCompare(String(b.date)));
      const rows = [...(certMonths?.rows || []), ...(nocMonths?.rows || [])]
        .map((r) => ({ label: monthLabel(r.expiry_date || r.month || r._id), count: r.count || 0 }))
        .reduce((acc, r) => {
          const hit = acc.find((a) => a.label === r.label);
          if (hit) hit.count += r.count;
          else acc.push(r);
          return acc;
        }, []);
      setItems(merged);
      setMonths(rows);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [user?.data?.organization_id]);

  const grouped = items.reduce((acc, item) => {
    const key = monthLabel(item.date);
    const hit = acc.find((a) => a.month === key);
    if (hit) hit.items.push(item);
    else acc.push({ month: key, items: [item] });
    return acc;
  }, []);

  const Icon = ({ kind }) => {
    if (kind === "Certificate") return <Award className="h-4 w-4 text-violet-600" />;
    if (kind === "Fire NOC") return <Flame className="h-4 w-4 text-amber-600" />;
    return <Boxes className="h-4 w-4 text-blue-600" />;
  };

  return (
    <div>
      <PageHeader
        title="Compliance Calendar"
        subtitle="Certificate, NOC and inspection dates for the next six months."
        icon={Calendar}
        actions={<Button variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print</Button>}
      />

      {loading ? (
        <div className="flex items-center justify-center py-24 text-slate-400"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : (
        <>
          {months.length > 0 && (
            <div className="mb-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {months.map((m) => (
                <div key={m.label} className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-medium text-slate-500">{m.label}</p>
                  <p className="mt-1 text-xl font-semibold text-slate-900">{m.count}</p>
                  <p className="text-xs text-slate-500">due</p>
                </div>
              ))}
            </div>
          )}

          {grouped.length === 0 ? (
            <SectionCard>
              <p className="px-5 py-10 text-center text-sm text-slate-500">
                Nothing due in the next six months. Certificate, NOC and asset inspection dates will appear here.
              </p>
            </SectionCard>
          ) : (
            <div className="space-y-5">
              {grouped.map((group) => (
                <SectionCard key={group.month} title={group.month}>
                  <div className="divide-y divide-slate-50">
                    {group.items.map((item) => (
                      <div key={item.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                        <Icon kind={item.kind} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-800">{item.label}</p>
                          <p className="text-xs text-slate-500">{item.kind} · due {item.date || "—"}</p>
                        </div>
                        <StatusBadge status={item.status} tone={statusTone(item.status)} />
                      </div>
                    ))}
                  </div>
                </SectionCard>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}