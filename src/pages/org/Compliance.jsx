import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { orgQuery } from "@/lib/orgScope";
import { PageHeader, KpiCard, SectionCard } from "@/components/ui-bits";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import RecordTable from "@/components/shared/RecordTable";
import { Award, Flame, AlertTriangle, ShieldCheck, Loader2, Calendar, Boxes } from "lucide-react";
import { Button } from "@/components/ui/button";

const sum = (rows) => (rows || []).reduce((a, r) => a + (r.count || 0), 0);
const pick = (rows, key) => (rows || []).find((r) => r.status === key)?.count || 0;
const iso = (days) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
const today = new Date().toISOString().slice(0, 10);

export default function OrgCompliance() {
  const { user } = useAuth();
  const q = orgQuery(user);
  const [loading, setLoading] = useState(true);
  const [s, setS] = useState({ certs: [], nocs: [], assets: [], capas: [] });

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const [certs, nocs, assets, capas] = await Promise.all([
        base44.entities.Certificate.aggregate({ query: q, groupBy: "status" }),
        base44.entities.NOC.aggregate({ query: q, groupBy: "status" }),
        base44.entities.Asset.aggregate({ query: q, groupBy: "condition" }),
        base44.entities.CAPA.aggregate({ query: q, groupBy: "status" }),
      ]);
      if (!alive) return;
      setS({ certs: certs?.rows || [], nocs: nocs?.rows || [], assets: assets?.rows || [], capas: capas?.rows || [] });
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [user?.data?.organization_id]);

  const [certsDue, setCertsDue] = useState([]);
  const [nocsDue, setNocsDue] = useState([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [c, n] = await Promise.all([
        base44.entities.Certificate.filter({ ...q, expiry_date: { $gte: today, $lte: iso(90) } }, "expiry_date", 25),
        base44.entities.NOC.filter({ ...q, expiry_date: { $gte: today, $lte: iso(90) } }, "expiry_date", 25),
      ]);
      if (!alive) return;
      setCertsDue(c || []);
      setNocsDue(n || []);
    })();
    return () => { alive = false; };
  }, [user?.data?.organization_id]);

  const totalCerts = sum(s.certs);
  const totalNocs = sum(s.nocs);
  const valid = pick(s.certs, "valid") + pick(s.nocs, "valid");
  const score = totalCerts + totalNocs > 0 ? Math.round((valid / (totalCerts + totalNocs)) * 100) : 0;
  const needsAttention = (s.assets || []).filter((r) => ["needs_attention", "faulty", "expired"].includes(r.condition)).reduce((a, r) => a + (r.count || 0), 0);

  if (loading) {
    return <div className="flex items-center justify-center py-24 text-slate-400"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  }

  return (
    <div>
      <PageHeader
        title="Compliance"
        subtitle="Certificate and NOC validity across your organization."
        icon={ShieldCheck}
        actions={
          <>
            <Button variant="outline" asChild><Link to="/compliance-calendar"><Calendar className="h-4 w-4" /> Calendar</Link></Button>
            <Button asChild><Link to="/certificates"><Award className="h-4 w-4" /> Certificates</Link></Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Compliance score" value={`${score}%`} icon={ShieldCheck} tone={score >= 80 ? "green" : score >= 50 ? "amber" : "rose"} sub={`${valid} of ${totalCerts + totalNocs} records valid`} />
        <KpiCard label="Certificates" value={totalCerts} icon={Award} tone="violet" sub={`${pick(s.certs, "expiring_soon")} expiring soon`} />
        <KpiCard label="Fire NOCs" value={totalNocs} icon={Flame} tone="amber" sub={`${pick(s.nocs, "expired")} expired`} />
        <KpiCard label="Assets needing attention" value={needsAttention} icon={Boxes} tone="rose" sub="Faulty, expired or flagged" />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <SectionCard title="Certificate validity">
          <RecordTable
            columns={[
              { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} tone={statusTone(r.status)} /> },
              { key: "count", label: "Certificates", headClassName: "px-4 py-3 text-right", cellClassName: "px-4 py-3 text-right font-semibold text-slate-800" },
            ]}
            rows={s.certs}
            empty={{ icon: Award, title: "No certificates yet", description: "Certificate records uploaded for your assets will show here." }}
          />
        </SectionCard>

        <SectionCard title="NOC validity">
          <RecordTable
            columns={[
              { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} tone={statusTone(r.status)} /> },
              { key: "count", label: "NOCs", headClassName: "px-4 py-3 text-right", cellClassName: "px-4 py-3 text-right font-semibold text-slate-800" },
            ]}
            rows={s.nocs}
            empty={{ icon: Flame, title: "No NOC records", description: "Add your fire NOCs to track renewals." }}
          />
        </SectionCard>

        <SectionCard title="Certificates expiring in 90 days">
          <RecordTable
            columns={[
              { key: "title", label: "Certificate", render: (r) => (
                <div>
                  <p className="font-medium text-slate-900">{r.title}</p>
                  <p className="text-xs text-slate-500">{r.certificate_number}</p>
                </div>
              ) },
              { key: "expiry_date", label: "Expires", render: (r) => r.expiry_date || "—" },
            ]}
            rows={certsDue}
            empty={{ icon: Calendar, title: "Nothing due", description: "No certificates expire in the next 90 days." }}
          />
        </SectionCard>

        <SectionCard title="NOCs expiring in 90 days">
          <RecordTable
            columns={[
              { key: "noc_number", label: "NOC", render: (r) => (
                <div>
                  <p className="font-medium text-slate-900">{r.noc_number}</p>
                  <p className="text-xs text-slate-500">{r.authority}</p>
                </div>
              ) },
              { key: "expiry_date", label: "Expires", render: (r) => r.expiry_date || "—" },
            ]}
            rows={nocsDue}
            empty={{ icon: Calendar, title: "Nothing due", description: "No NOCs expire in the next 90 days." }}
          />
        </SectionCard>
      </div>

      <div className="mt-5">
        <SectionCard title="Open corrective actions" actions={<Link to="/capa" className="text-xs font-semibold text-rose-600 hover:underline">Open CAPA</Link>}>
          <RecordTable
            columns={[
              { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} tone={statusTone(r.status)} /> },
              { key: "count", label: "Findings", headClassName: "px-4 py-3 text-right", cellClassName: "px-4 py-3 text-right font-semibold text-slate-800" },
            ]}
            rows={s.capas}
            empty={{ icon: AlertTriangle, title: "No CAPA records", description: "Corrective actions raised from audits appear here." }}
          />
        </SectionCard>
      </div>
    </div>
  );
}