import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { orgQuery } from "@/lib/orgScope";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import RecordTable from "@/components/shared/RecordTable";
import DashHero, { HERO_BTN } from "@/components/dashboard/DashHero";
import StatTile from "@/components/dashboard/StatTile";
import Panel from "@/components/dashboard/Panel";
import PanelRow from "@/components/dashboard/PanelRow";
import ProgressRing from "@/components/dashboard/ProgressRing";
import DashboardSkeleton from "@/components/dashboard/DashboardSkeleton";
import { Building2, Boxes, Award, Flame, AlertTriangle, Wrench, ArrowRight, ShieldCheck } from "lucide-react";

const sum = (rows) => (rows || []).reduce((a, r) => a + (r.count || 0), 0);
const pick = (rows, key) => (rows || []).find((r) => r.status === key)?.count || 0;
const OPEN_CAPA = ["open", "assigned", "in_progress", "awaiting_verification"];

export default function OrgDashboard() {
  const { user } = useAuth();
  const orgId = user?.data?.organization_id;
  const q = orgQuery(user);
  const [loading, setLoading] = useState(true);
  const [s, setS] = useState({ certs: [], nocs: [], capas: [], assets: [], requests: [], sites: 0, attention: [] });

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const [certs, nocs, capas, assets, requests, sites, attention] = await Promise.all([
        base44.entities.Certificate.aggregate({ query: q, groupBy: "status" }),
        base44.entities.NOC.aggregate({ query: q, groupBy: "status" }),
        base44.entities.CAPA.aggregate({ query: q, groupBy: "status" }),
        base44.entities.Asset.aggregate({ query: q, groupBy: "condition" }),
        base44.entities.ServiceRequest.aggregate({ query: q, groupBy: "status" }),
        base44.entities.Site.count(q),
        base44.entities.Certificate.filter({ ...q, status: { $in: ["expiring_soon", "expired"] } }, "-expiry_date", 6),
      ]);
      if (!alive) return;
      setS({
        certs: certs?.rows || [], nocs: nocs?.rows || [], capas: capas?.rows || [],
        assets: assets?.rows || [], requests: requests?.rows || [], sites, attention: attention || [],
      });
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [orgId]);

  const openCapa = (s.capas || []).filter((r) => OPEN_CAPA.includes(r.status)).reduce((a, r) => a + (r.count || 0), 0);
  const openRequests = (s.requests || []).filter((r) => ["open", "assigned", "in_progress"].includes(r.status)).reduce((a, r) => a + (r.count || 0), 0);
  const validCerts = pick(s.certs, "valid");
  const totalCerts = sum(s.certs);
  const certScore = totalCerts === 0 ? 100 : Math.round((validCerts / totalCerts) * 100);
  const totalNocs = sum(s.nocs);
  const validNocs = pick(s.nocs, "valid");
  const nocScore = totalNocs === 0 ? 100 : Math.round((validNocs / totalNocs) * 100);
  const capaMax = Math.max(...(s.capas || []).map((r) => r.count || 0), 1);
  const assetTotal = sum(s.assets);

  return (
    <div className="space-y-5">
      <DashHero
        eyebrow="Organization admin · Compliance"
        title="Organization Dashboard"
        subtitle={user?.data?.organization_name || "Compliance, assets and service activity for your organization"}
        meta={`${s.sites} site${s.sites === 1 ? "" : "s"} registered`}
        tone="sky"
        stats={[
          { label: "Sites", value: s.sites, sub: "Registered locations" },
          { label: "Assets tracked", value: assetTotal, sub: "Across all sites" },
          { label: "Certificate validity", value: `${certScore}%`, sub: `${validCerts}/${totalCerts} valid` },
          { label: "Open CAPA", value: openCapa, sub: "Findings in progress" },
        ]}
        actions={
          <>
            <Link to="/compliance" className={HERO_BTN}>
              <ShieldCheck className="h-4 w-4" /> Open compliance
            </Link>
            <Link to="/sites" className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-inset ring-white/20 transition hover:bg-white/20">
              <Building2 className="h-4 w-4" /> Manage sites
            </Link>
          </>
        }
      />

      {!orgId && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <p className="text-sm text-amber-900">
            Your profile isn't linked to an organization yet. Add your organization details to unlock sites, assets and compliance tracking.
          </p>
          <Link to="/profile" className="ml-auto inline-flex items-center gap-1 text-sm font-semibold text-amber-900 hover:underline">
            Open Profile <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {loading ? (
        <DashboardSkeleton tiles={6} panels={2} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <StatTile label="Sites" value={s.sites} sub="Registered locations" icon={Building2} tone="sky" href="/sites" />
            <StatTile label="Assets tracked" value={assetTotal} sub="Across all sites" icon={Boxes} tone="violet" href="/compliance" />
            <StatTile label="Valid certificates" value={`${validCerts}/${totalCerts}`} sub="Current validity" icon={Award} tone="emerald" href="/certificates" />
            <StatTile label="Fire NOC" value={`${validNocs}/${totalNocs}`} sub="Valid NOCs" icon={Flame} tone="amber" href="/fire-noc" />
            <StatTile label="Open CAPA" value={openCapa} sub="Findings in progress" icon={AlertTriangle} tone="rose" href="/capa" />
            <StatTile label="Open service requests" value={openRequests} sub="Awaiting completion" icon={Wrench} tone="teal" href="/maintenance" />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Panel title="Compliance posture" subtitle="Certificate & NOC validity" icon={ShieldCheck} bodyClassName="p-5">
              <div className="flex items-center justify-around gap-2">
                <ProgressRing value={certScore} size={104} stroke={9} tone={certScore >= 80 ? "emerald" : "amber"} label="certs" />
                <ProgressRing value={nocScore} size={104} stroke={9} tone={nocScore >= 80 ? "emerald" : "amber"} label="NOC" />
              </div>
              <p className="mt-4 text-center text-xs text-muted-foreground">
                {pick(s.certs, "expiring_soon")} expiring soon · {pick(s.certs, "expired")} expired
              </p>
            </Panel>

            <Panel
              title="Needs attention"
              count={s.attention.length}
              icon={AlertTriangle}
              action={<Link to="/compliance" className="font-semibold text-primary hover:underline">View compliance</Link>}
              bodyClassName="divide-y divide-border"
            >
              {s.attention.length === 0 ? (
                <p className="px-5 py-6 text-sm text-muted-foreground">No certificates are expiring or expired.</p>
              ) : (
                s.attention.map((c) => (
                  <PanelRow
                    key={c.id}
                    icon={AlertTriangle}
                    tone={c.status === "expired" ? "rose" : "amber"}
                    title={c.title}
                    meta={`${c.certificate_number} · expires ${c.expiry_date || "—"}`}
                    trailing={<StatusBadge status={c.status} tone={statusTone(c.status)} />}
                    href="/certificates"
                  />
                ))
              )}
            </Panel>

            <Panel
              title="CAPA pipeline"
              count={sum(s.capas)}
              icon={Wrench}
              action={<Link to="/capa" className="font-semibold text-primary hover:underline">Open CAPA</Link>}
              bodyClassName="p-5"
            >
              {s.capas.length === 0 ? (
                <p className="py-4 text-sm text-muted-foreground">No corrective actions recorded.</p>
              ) : (
                <div className="space-y-3.5">
                  {s.capas.map((r) => (
                    <div key={r.status}>
                      <div className="flex items-center justify-between gap-2">
                        <StatusBadge status={r.status} tone={statusTone(r.status)} />
                        <span className="text-sm font-semibold tabular-nums text-foreground">{r.count}</span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary/70" style={{ width: `${Math.max(6, Math.round(((r.count || 0) / capaMax) * 100))}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>

          <Panel
            title="Service requests by status"
            subtitle="Maintenance activity across your sites"
            icon={Wrench}
            action={<Link to="/maintenance" className="font-semibold text-primary hover:underline">Open maintenance</Link>}
          >
            <RecordTable
              columns={[
                { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} tone={statusTone(r.status)} /> },
                { key: "count", label: "Requests", headClassName: "px-4 py-3 text-right", cellClassName: "px-4 py-3 text-right font-semibold text-slate-800" },
              ]}
              rows={s.requests}
              empty={{ icon: Wrench, title: "No service requests", description: "Requests raised from maintenance will appear here." }}
            />
          </Panel>
        </>
      )}
    </div>
  );
}