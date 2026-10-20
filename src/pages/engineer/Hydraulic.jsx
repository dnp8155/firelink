import React, { useState } from "react";
import { PageHeader, SectionCard } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { Droplets, Calculator, AlertTriangle } from "lucide-react";

const C_OPTIONS = [
  { value: 140, label: "140 — New steel / CPVC" },
  { value: 130, label: "130 — Steel, good condition" },
  { value: 120, label: "120 — Steel, average" },
  { value: 100, label: "100 — Steel, poor / old" },
];

export default function Hydraulic() {
  const [flow, setFlow] = useState(1500);
  const [length, setLength] = useState(120);
  const [dia, setDia] = useState(80);
  const [c, setC] = useState(120);
  const [nozzles, setNozzles] = useState(4);
  const [result, setResult] = useState(null);

  const compute = () => {
    const Q = (Number(flow) || 0) / 60000;      // m³/s
    const d = (Number(dia) || 1) / 1000;        // m
    const frictionPerM = (10.67 * Math.pow(Q, 1.852)) / (Math.pow(Number(c) || 120, 1.852) * Math.pow(d, 4.87));
    const totalHead = frictionPerM * (Number(length) || 0);          // m of water
    const velocity = Q / (Math.PI * d * d / 4);                       // m/s
    const frictionBar = totalHead / 10.197;
    const nozzleBar = 0.5 + 0.35 * Math.max(0, Number(nozzles) - 1); // hose reel allowance (approx)
    const pumpBar = frictionBar + nozzleBar + 1.0;                   // + residual at hydrant
    setResult({
      velocity: velocity.toFixed(2),
      frictionBar: frictionBar.toFixed(2),
      totalHead: totalHead.toFixed(1),
      pumpBar: pumpBar.toFixed(1),
      pumpHP: Math.round((pumpBar * 10.197 * 1000 * (Number(flow) || 0) / 60000) / 746 * 1.2),
    });
  };

  return (
    <div>
      <PageHeader title="Hydraulic Calculator" icon={Droplets} subtitle="Hazen-Williams friction loss and pump head estimation for hydrant / sprinkler mains." />
      <div className="mb-4 flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <p className="text-xs font-medium text-amber-800">Engineering calculations and AI recommendations require review by a qualified professional.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="System Parameters" actions={<Button size="sm" onClick={compute}><Calculator className="h-3.5 w-3.5" /> Calculate</Button>}>
          <div className="grid grid-cols-2 gap-4 p-5">
            <div>
              <label className="text-xs font-medium text-slate-500">Design Flow (LPM)</label>
              <input type="number" min="1" value={flow} onChange={(e) => setFlow(e.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-rose-300" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500">Pipe Length (m)</label>
              <input type="number" min="1" value={length} onChange={(e) => setLength(e.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-rose-300" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500">Internal Diameter (mm)</label>
              <input type="number" min="10" value={dia} onChange={(e) => setDia(e.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-rose-300" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500">Hazen-Williams C</label>
              <select value={c} onChange={(e) => setC(Number(e.target.value))} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-rose-300">
                {C_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-slate-500">Active Hose Reels / Nozzles</label>
              <input type="number" min="0" value={nozzles} onChange={(e) => setNozzles(e.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-rose-300" />
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Results">
          <div className="p-5">
            {!result ? (
              <p className="py-16 text-center text-sm text-slate-400">Enter parameters and press Calculate.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Res label="Flow Velocity" value={`${result.velocity} m/s`} />
                <Res label="Friction Loss" value={`${result.frictionBar} bar`} />
                <Res label="Head Loss" value={`${result.totalHead} m`} />
                <Res label="Recommended Pump" value={`${result.pumpBar} bar`} highlight />
                <div className="col-span-2 rounded-2xl bg-gradient-to-br from-rose-600 to-red-700 p-5 text-center text-white shadow">
                  <p className="text-xs font-medium uppercase tracking-wider text-rose-100">Suggested Pump Size</p>
                  <p className="mt-1 text-3xl font-extrabold">{result.pumpHP} HP</p>
                  <p className="mt-1 text-[11px] text-rose-100">Includes 20% safety margin over duty point</p>
                </div>
              </div>
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

const Res = ({ label, value, highlight }) => (
  <div className={`rounded-xl p-4 ${highlight ? "bg-rose-50" : "bg-slate-50"}`}>
    <p className="text-xs text-slate-500">{label}</p>
    <p className="mt-1 text-lg font-bold text-slate-900">{value}</p>
  </div>
);