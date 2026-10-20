import React, { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { PageHeader, KpiCard, SectionCard } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, AlertTriangle, Loader2, RefreshCw, Activity, ShieldCheck, Zap, Database, Radio } from "lucide-react";

const ENTITY_CHECKS = [
  ["Vendors", "Vendor", Database],
  ["Products", "Product", Database],
  ["Orders", "Order", Database],
  ["Certificates", "Certificate", Database],
  ["Assets", "Asset", Database],
  ["Support tickets", "SupportTicket", Database],
];
const SLOW_MS = 1200;

export default function SystemHealth() {
  const [checks, setChecks] = useState(null);
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState(null);

  const run = useCallback(async () => {
    setRunning(true);
    const rows = [];
    const time = async (fn) => {
      const start = performance.now();
      try {
        const result = await fn();
        return { result, ms: Math.round(performance.now() - start), ok: true };
      } catch (error) {
        return { result: null, ms: Math.round(performance.now() - start), ok: false, error: String(error?.message || error).slice(0, 120) };
      }
    };

    const auth = await time(() => base44.auth.me());
    rows.push({ name: "Authentication session", detail: auth.result?.email ? `Signed in as ${auth.result.email} (${auth.result.role || "user"})` : "No active session", ms: auth.ms, ok: auth.ok && !!auth.result });

    for (const [label, entity] of ENTITY_CHECKS) {
      const res = await time(() => base44.entities[entity].count({}));
      rows.push({ name: label, detail: res.ok ? `${res.result} records reachable` : `Unavailable${res.error ? ` — ${res.error}` : ""}`, ms: res.ms, ok: res.ok });
    }

    const fn = await time(() => base44.functions.invoke("verify_qr", { qr_code: "healthcheck-probe" }));
    rows.push({ name: "Backend functions", detail: fn.ok ? "verify_qr responded" : `No response${fn.error ? ` — ${fn.error}` : ""}`, ms: fn.ms, ok: fn.ok });

    let realtimeOk = true;
    const rtStart = performance.now();
    try {
      const unsubscribe = base44.entities.Vendor.subscribe(() => {});
      await new Promise((r) => setTimeout(r, 900));
      if (typeof unsubscribe === "function") unsubscribe();
    } catch {
      realtimeOk = false;
    }
    rows.push({ name: "Realtime channel", detail: realtimeOk ? "Live updates subscribed and closed cleanly" : "Subscription could not be opened", ms: Math.round(performance.now() - rtStart), ok: realtimeOk });

    setChecks(rows);
    setLastRun(new Date().toISOString());
    setRunning(false);
  }, []);

  useEffect(() => { run(); }, [run]);

  const healthy = checks ? checks.filter((c) => c.ok).length : 0;
  const slow = checks ? checks.filter((c) => c.ok && c.ms >= SLOW_MS).length : 0;
  const failed = checks ? checks.filter((c) => !c.ok).length : 0;
  const allGood = checks && failed === 0;

  return (
    <div>
      <PageHeader
        title="System Health"
        icon={Activity}
        subtitle="Live checks against the app's data, functions and live updates."
        actions={<Button onClick={run} disabled={running}>{running ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}Run checks</Button>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Status" value={!checks ? "—" : allGood ? "Operational" : "Degraded"} sub={lastRun ? `Checked ${new Date(lastRun).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}` : "Running…"} icon={allGood ? ShieldCheck : AlertTriangle} tone={!checks ? "slate" : allGood ? "green" : "amber"} />
        <KpiCard label="Checks passed" value={checks ? `${healthy}/${checks.length}` : "—"} icon={CheckCircle2} tone="green" />
        <KpiCard label="Slow checks" value={slow} sub={`over ${SLOW_MS} ms`} icon={Zap} tone="amber" />
        <KpiCard label="Failures" value={failed} icon={AlertTriangle} tone={failed ? "rose" : "slate"} />
      </div>

      <div className="mt-6">
        <SectionCard title="Live checks">
          {!checks ? (
            <div className="space-y-3 p-5">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}</div>
          ) : (
            <div className="divide-y divide-slate-50">
              {checks.map((c) => (
                <div key={c.name} className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span className={c.ok ? "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600" : "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600"}>
                      {c.ok ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{c.name}</p>
                      <p className="truncate text-xs text-slate-500">{c.detail}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:justify-end">
                    <span className="text-xs text-slate-400">{c.ms} ms</span>
                    <span className={
                      !c.ok
                        ? "rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-600"
                        : c.ms >= SLOW_MS
                          ? "rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700"
                          : "rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700"
                    }>
                      {!c.ok ? "Failed" : c.ms >= SLOW_MS ? "Slow" : "OK"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
        <Radio className="h-3.5 w-3.5" />
        Checks run from this browser against your live app data and services.
      </div>
    </div>
  );
}