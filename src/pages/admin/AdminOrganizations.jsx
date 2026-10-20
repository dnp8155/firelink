import React, { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { PageHeader, KpiCard, EmptyState } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import ApprovalDialog from "@/components/admin/ApprovalDialog";
import { timeAgo, formatDate } from "@/lib/format";
import { Building2, MapPin, Search, ChevronRight, ShieldCheck, Layers } from "lucide-react";

export default function AdminOrganizations() {
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [stats, setStats] = useState(null);
  const [active, setActive] = useState(null);
  const [sites, setSites] = useState({ loading: false, items: [] });

  const loadStats = useCallback(async () => {
    const [total, siteCount, compliance, cities] = await Promise.all([
      base44.entities.Organization.count({}),
      base44.entities.Site.count({}),
      base44.entities.Organization.aggregate({ avg: ["compliance_score"] }),
      base44.entities.Organization.list({ distinct: "city" }),
    ]);
    setStats({
      total,
      sites: siteCount,
      compliance: Math.round((compliance.rows || [])[0]?.avg_compliance_score || 0),
      cities: (cities.items || []).filter(Boolean).length,
    });
  }, []);

  const loadOrgs = useCallback(async () => {
    setLoading(true);
    const term = query.trim();
    const filter = term ? { $or: [{ name: { $regex: term, $options: "i" } }, { email: { $regex: term, $options: "i" } }] } : {};
    const page = await base44.entities.Organization.filter(filter, { sort: "-created_date", limit: 50 });
    setOrgs(page.items || []);
    setLoading(false);
  }, [query]);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => {
    const t = setTimeout(loadOrgs, query.trim() ? 400 : 0);
    return () => clearTimeout(t);
  }, [loadOrgs, query]);

  const openOrg = async (org) => {
    setActive(org);
    setSites({ loading: true, items: [] });
    const page = await base44.entities.Site.filter({ organization_id: org.id }, { sort: "-created_date", limit: 15 });
    setSites({
      loading: false,
      items: (page.items || []).map((s) => ({ id: s.id, type: s.name, status: [s.city, s.state].filter(Boolean).join(", ") || "—" })),
    });
  };

  return (
    <div>
      <PageHeader title="Organizations" icon={Building2} subtitle="Buyer organizations, their sites and compliance standing." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Organizations" value={stats?.total ?? "—"} icon={Building2} tone="blue" />
        <KpiCard label="Sites" value={stats?.sites ?? "—"} sub="across all organizations" icon={Layers} tone="teal" />
        <KpiCard label="Avg compliance" value={stats ? `${stats.compliance}%` : "—"} sub="organization score" icon={ShieldCheck} tone="green" />
        <KpiCard label="Cities covered" value={stats?.cities ?? "—"} icon={MapPin} tone="violet" />
      </div>

      <div className="relative mt-6 w-full max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or email…" className="pl-9" />
      </div>

      <div className="mt-4 space-y-3">
        {loading ? (
          [0, 1, 2].map((i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)
        ) : orgs.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <EmptyState icon={Building2} title="No organizations yet" description="Buyer organizations appear here once they register." />
          </div>
        ) : (
          orgs.map((o) => (
            <div key={o.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-semibold text-slate-500">
                  {String(o.name || "O").slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{o.name || "Untitled organization"}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    {o.industry && <span className="capitalize">{o.industry}</span>}
                    {o.city && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{o.city}</span>}
                    {o.email && <span>{o.email}</span>}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 sm:justify-end">
                <div className="hidden w-28 lg:block">
                  <div className="flex items-center justify-between text-[11px] text-slate-500"><span>Compliance</span><span>{o.compliance_score || 0}%</span></div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(Number(o.compliance_score || 0), 100)}%` }} />
                  </div>
                </div>
                {o.plan && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium capitalize text-slate-600">{o.plan}</span>}
                <span className="hidden text-xs text-slate-400 md:inline">{timeAgo(o.created_date)}</span>
                <Button size="sm" variant="outline" onClick={() => openOrg(o)}>View <ChevronRight className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          ))
        )}
      </div>

      <ApprovalDialog
        open={!!active}
        onClose={() => setActive(null)}
        title={active?.name || ""}
        subtitle={active?.industry || ""}
        hero={null}
        details={active ? [
          { label: "Contact person", value: active.contact_person },
          { label: "Email", value: active.email },
          { label: "Phone", value: active.phone },
          { label: "GST number", value: active.gst_number },
          { label: "Address", value: active.address },
          { label: "City", value: active.city },
          { label: "Plan", value: active.plan },
          { label: "Compliance score", value: `${active.compliance_score || 0}%` },
          { label: "Registered on", value: formatDate(active.created_date) },
        ] : []}
        documents={sites}
        documentsTitle="Sites"
      />
    </div>
  );
}