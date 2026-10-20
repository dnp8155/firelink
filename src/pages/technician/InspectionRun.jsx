import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { SectionCard, EmptyState } from "@/components/ui-bits";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import ChecklistItemCard from "@/components/technician/ChecklistItemCard";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { logAudit } from "@/lib/auditLog";
import { ArrowLeft, ClipboardCheck, Loader2, AlertCircle, MapPin, Send } from "lucide-react";

const todayISO = () => new Date().toISOString().slice(0, 10);

function shiftDate(iso, { months = 0, days = 0 }) {
  const d = new Date(iso + "T00:00:00");
  d.setMonth(d.getMonth() + months);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function InspectionRun() {
  const { assetId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [asset, setAsset] = useState(null);
  const [template, setTemplate] = useState(null);
  const [results, setResults] = useState([]);
  const [itemNotes, setItemNotes] = useState([]);
  const [overallNotes, setOverallNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const [loadedAsset, templates] = await Promise.all([
          base44.entities.Asset.get(assetId),
          base44.entities.InspectionTemplate.filter({ active: true }, "display_order", 50).catch(() => []),
        ]);
        if (!alive) return;
        const list = templates || [];
        const category = (loadedAsset?.category || "").toLowerCase();
        const match =
          list.find((t) => (t.category || "").toLowerCase() === category) ||
          list.find((t) => (t.category || "").toLowerCase() === "other") ||
          list[0] ||
          null;
        setAsset(loadedAsset);
        setTemplate(match);
        const items = (match && match.items) || [];
        setResults(items.map(() => null));
        setItemNotes(items.map(() => ""));
      } catch {
        if (alive) setAsset(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [assetId]);

  const items = (template && template.items) || [];
  const answered = results.filter(Boolean).length;
  const failedIndexes = results.map((r, i) => (r === "fail" ? i : -1)).filter((i) => i >= 0);

  const score = useMemo(() => {
    const counted = items
      .map((item, i) => ({ item, result: results[i] }))
      .filter((row) => row.result === "pass" || row.result === "fail");
    if (!counted.length) return 0;
    const total = counted.reduce((sum, row) => sum + (Number(row.item.weight) || 1), 0);
    const passed = counted.filter((row) => row.result === "pass").reduce((sum, row) => sum + (Number(row.item.weight) || 1), 0);
    return Math.round((passed / total) * 100);
  }, [items, results]);

  const criticalFail = failedIndexes.some((i) => items[i] && items[i].critical);
  const conditionAfter = criticalFail ? "faulty" : failedIndexes.length ? "needs_attention" : "good";
  const complete = items.length > 0 && answered === items.length;

  const submit = async () => {
    if (!asset || !template || !complete) return;
    if (!navigator.onLine) {
      toast({ title: "You're offline", description: "Reconnect to submit this inspection.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const today = todayISO();
      const interval = Number(template.interval_months) || 6;
      const nextDue = shiftDate(today, { months: interval });
      const inspectionNumber =
        "INS-" + (asset.asset_code || asset.id || "").replace(/[^A-Za-z0-9]/g, "").slice(0, 20) + "-" + Date.now().toString(36).toUpperCase();

      const checklist = items.map((item, i) => ({
        question: item.question,
        guidance: item.guidance || "",
        result: results[i],
        note: (itemNotes[i] || "").trim(),
        critical: !!item.critical,
        weight: Number(item.weight) || 1,
      }));

      // A failed critical check is a finding, not just a low score: raise the CAPA.
      const capaPayloads = failedIndexes
        .filter((i) => items[i] && items[i].critical)
        .map((i, order) => ({
          capa_number: "CAPA-" + (asset.asset_code || "").replace(/[^A-Za-z0-9]/g, "").slice(0, 16) + "-" + Date.now().toString(36).toUpperCase() + "-" + (order + 1),
          finding: items[i].question + (itemNotes[i] ? " — " + itemNotes[i].trim() : ""),
          asset_id: asset.id,
          asset_name: asset.name || "",
          organization_id: asset.organization_id || "",
          site_name: asset.site_name || "",
          severity: "high",
          status: "open",
          target_date: shiftDate(today, { days: 14 }),
          description: "Raised automatically from inspection " + inspectionNumber + " (" + template.name + ").",
        }));

      const capas = capaPayloads.length ? await base44.entities.CAPA.bulkCreate(capaPayloads) : [];

      await base44.entities.Inspection.create({
        inspection_number: inspectionNumber,
        asset_id: asset.id,
        asset_name: asset.name || "",
        asset_code: asset.asset_code || "",
        organization_id: asset.organization_id || "",
        organization_name: asset.organization_name || "",
        site_name: asset.site_name || "",
        template_name: template.name,
        checklist,
        passed_count: results.filter((r) => r === "pass").length,
        failed_count: failedIndexes.length,
        score,
        passed: failedIndexes.length === 0,
        condition_after: conditionAfter,
        technician_id: user?.id || "",
        technician_name: user?.full_name || "",
        inspected_on: today,
        next_due_date: nextDue,
        capa_ids: (capas || []).map((c) => c.id),
        notes: overallNotes.trim(),
      });

      await base44.entities.Asset.update(asset.id, {
        last_inspection_date: today,
        next_inspection_date: nextDue,
        condition: conditionAfter,
        status: "active",
      });

      await logAudit({
        action: "Checklist inspection completed",
        module: "Asset",
        entityId: asset.asset_code || asset.id,
        before: asset.condition || "",
        after: score + "% · " + conditionAfter,
      });

      toast({
        title: capas.length ? "Inspection saved — " + capas.length + " CAPA raised" : "Inspection passed",
        description: (asset.asset_code || "") + " · score " + score + "% · next due " + nextDue,
      });
      navigate("/technician/inspections");
    } catch (e) {
      toast({ title: "Could not save inspection", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

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
        <EmptyState
          icon={AlertCircle}
          title="Asset not found"
          description="This asset may have been removed."
          action={<Link to="/technician/inspections"><Button variant="outline">Back to Inspections</Button></Link>}
        />
      </SectionCard>
    );
  }

  return (
    <div>
      <Link to="/technician/inspections" className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Back to Inspections
      </Link>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-mono text-xs text-slate-400">{asset.asset_code}</p>
            <h1 className="text-lg font-bold text-slate-900">{asset.name}</h1>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-500">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              {asset.site_name || asset.location_detail || "—"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={asset.condition} tone={statusTone(asset.condition)} />
            <StatusBadge status={answered + "/" + items.length + " answered"} tone={complete ? "green" : "amber"} />
          </div>
        </div>
      </div>

      {!template || !items.length ? (
        <div className="mt-5">
          <SectionCard>
            <EmptyState
              icon={ClipboardCheck}
              title="No checklist available"
              description="Add an active inspection template for this asset's category, then start the checklist again."
            />
          </SectionCard>
        </div>
      ) : (
        <>
          <div className="mt-5">
            <SectionCard
              title={template.name}
              actions={<span className="text-xs text-slate-500">Repeat every {Number(template.interval_months) || 6} months</span>}
            >
              <div className="divide-y divide-slate-100">
                {items.map((item, i) => (
                  <ChecklistItemCard
                    key={i}
                    item={item}
                    index={i}
                    value={results[i]}
                    note={itemNotes[i]}
                    onResult={(result) => setResults((prev) => prev.map((v, j) => (j === i ? result : v)))}
                    onNote={(note) => setItemNotes((prev) => prev.map((v, j) => (j === i ? note : v)))}
                  />
                ))}
              </div>
            </SectionCard>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <label className="text-sm font-medium text-slate-700">Inspection notes (optional)</label>
            <Textarea
              rows={2}
              value={overallNotes}
              onChange={(e) => setOverallNotes(e.target.value)}
              placeholder="Overall remarks for this visit"
              className="mt-2"
            />
          </div>

          <div className="sticky bottom-4 mt-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-xs text-slate-500">Score</p>
                <p className="text-xl font-semibold text-slate-900">{score}%</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Failed checks</p>
                <p className={"text-xl font-semibold " + (failedIndexes.length ? "text-rose-600" : "text-emerald-600")}>{failedIndexes.length}</p>
              </div>
              {criticalFail && (
                <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700">
                  Critical failure — CAPA will be raised
                </span>
              )}
            </div>
            <Button onClick={submit} disabled={!complete || submitting}>
              <Send className="h-4 w-4" />
              {submitting ? "Saving…" : complete ? "Submit inspection" : "Answer all " + items.length + " checks"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}