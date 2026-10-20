import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { SectionCard, EmptyState } from "@/components/ui-bits";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Boxes, MapPin, Package, Wrench, Award, ShieldCheck,
  Calendar, ClipboardCheck, Clock, CheckCircle2, AlertCircle, User, Loader2,
} from "lucide-react";

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function AssetDetail() {
  const { id } = useParams();
  const [asset, setAsset] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const a = await base44.entities.Asset.get(id);
        if (!alive) return;
        setAsset(a);

        // Gather all related records in parallel
        const [services, certs, capas, inspections] = await Promise.all([
          base44.entities.ServiceRequest.filter({ asset_id: id }, "-created_date", 100).catch(() => []),
          base44.entities.Certificate.filter({ asset_id: id }, "-created_date", 100).catch(() => []),
          base44.entities.CAPA.filter({ asset_id: id }, "-created_date", 100).catch(() => []),
          base44.entities.Inspection.filter({ asset_id: id }, "-created_date", 100).catch(() => []),
        ]);

        const events = [];
        // Install date as the starting point
        if (a.install_date) {
          events.push({
            id: "install", date: a.install_date, type: "install",
            title: "Asset Installed", icon: Package, tone: "slate",
            description: `${a.brand || ""} ${a.model || ""} installed at ${a.site_name || "site"}`,
          });
        }
        (services || []).forEach((s) => events.push({
          id: "srv-" + s.id, date: s.created_date, type: "service",
          title: s.service_type || "Service Request", icon: Wrench, tone: "blue",
          badge: s.status, subtitle: `Request ${s.request_number || ""}`,
          description: s.description, extra: s.completion_notes,
          technician: s.assigned_technician_name, scheduled: s.scheduled_date,
        }));
        (certs || []).forEach((c) => events.push({
          id: "cert-" + c.id, date: c.issue_date || c.created_date, type: "certificate",
          title: c.title || "Certificate Issued", icon: Award, tone: "green",
          badge: c.status, subtitle: `Cert #${c.certificate_number || ""}`,
          description: c.title, extra: c.expiry_date ? `Expires: ${formatDate(c.expiry_date)}` : null,
          issued_by: c.issued_by,
        }));
        (capas || []).forEach((c) => events.push({
          id: "capa-" + c.id, date: c.created_date, type: "capa",
          title: "CAPA Raised", icon: ClipboardCheck, tone: "amber",
          badge: c.status, subtitle: c.capa_number || "",
          description: c.description, extra: c.root_cause,
        }));
        (inspections || []).forEach((c) => events.push({
          id: "ins-" + c.id, date: c.inspected_on || c.created_date, type: "inspection",
          title: "Inspection — " + (c.score != null ? c.score + "%" : "recorded"), icon: ClipboardCheck,
          tone: c.passed ? "green" : "red",
          badge: c.passed ? "passed" : "failed",
          subtitle: c.inspection_number || c.template_name || "",
          description: c.notes || (c.failed_count ? c.failed_count + " check(s) failed" : ""),
          extra: c.next_due_date ? "Next due: " + c.next_due_date : null,
          technician: c.technician_name,
        }));

        // Sort: most recent first
        events.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
        if (alive) setTimeline(events);
      } catch (e) {
        if (alive) setAsset(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!asset) {
    return (
      <SectionCard>
        <EmptyState icon={AlertCircle} title="Asset not found" description="This asset may have been removed."
          action={<Link to="/customer/assets"><Button variant="outline">Back to Assets</Button></Link>} />
      </SectionCard>
    );
  }

  const TONE_STYLES = {
    slate: "bg-slate-100 text-slate-600",
    blue: "bg-blue-100 text-blue-600",
    green: "bg-emerald-100 text-emerald-600",
    amber: "bg-amber-100 text-amber-600",
    red: "bg-rose-100 text-rose-600",
  };

  return (
    <div>
      {/* Back link */}
      <Link to="/customer/assets" className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Back to Assets
      </Link>

      {/* Asset header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Boxes className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">{asset.name}</h1>
              <p className="text-sm text-slate-500">{asset.brand} {asset.model && `· ${asset.model}`}</p>
              <p className="mt-0.5 text-xs font-medium text-slate-400">{asset.asset_code} · QR: {asset.qr_code}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={asset.status} tone={statusTone(asset.status)} />
            <StatusBadge status={asset.condition} tone={statusTone(asset.condition)} />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-sm sm:grid-cols-4">
          <div>
            <p className="text-xs text-slate-400">Location</p>
            <p className="flex items-center gap-1 font-medium text-slate-700"><MapPin className="h-3.5 w-3.5 text-slate-400" />{asset.site_name || "—"}</p>
            <p className="text-xs text-slate-500">{[asset.building, asset.floor, asset.zone].filter(Boolean).join(" → ")}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Installed</p>
            <p className="font-medium text-slate-700">{formatDate(asset.install_date)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Last Inspection</p>
            <p className="font-medium text-slate-700">{formatDate(asset.last_inspection_date)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Next Inspection</p>
            <p className="font-medium text-slate-700">{formatDate(asset.next_inspection_date)}</p>
          </div>
        </div>
      </div>

      {/* Service History Timeline */}
      <div className="mt-6">
        <SectionCard title={`Service History (${timeline.length})`}>
          {timeline.length === 0 ? (
            <EmptyState icon={Clock} title="No service history yet" description="Service requests, inspections and certificates for this asset will appear here as a timeline." />
          ) : (
            <div className="p-5">
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-5 top-2 bottom-2 w-0.5 bg-slate-200" />
                <div className="space-y-5">
                  {timeline.map((ev) => {
                    const Icon = ev.icon;
                    return (
                      <div key={ev.id} className="relative flex gap-4">
                        <div className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-4 ring-white ${TONE_STYLES[ev.tone] || TONE_STYLES.slate}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 pb-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-slate-900">{ev.title}</p>
                            {ev.badge && <StatusBadge status={ev.badge} tone={statusTone(ev.badge)} />}
                          </div>
                          {ev.subtitle && <p className="text-xs font-medium text-slate-400">{ev.subtitle}</p>}
                          {ev.description && <p className="mt-1 text-sm text-slate-600">{ev.description}</p>}
                          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {formatDate(ev.date)}</span>
                            {ev.technician && <span className="flex items-center gap-1"><User className="h-3 w-3" /> {ev.technician}</span>}
                            {ev.issued_by && <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> {ev.issued_by}</span>}
                            {ev.scheduled && <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Scheduled: {formatDate(ev.scheduled)}</span>}
                          </div>
                          {ev.extra && (
                            <div className="mt-1.5 rounded-lg bg-slate-50 px-3 py-1.5 text-xs text-slate-500">
                              {ev.type === "service" && ev.badge === "completed" && <CheckCircle2 className="mr-1 inline h-3 w-3 text-emerald-500" />}
                              {ev.extra}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}