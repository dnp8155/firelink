import React, { useState } from "react";
import { PageHeader, SectionCard } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { Flame, Calculator, AlertTriangle } from "lucide-react";

const MATERIALS = [
  { key: "wood", label: "Wood / Furniture", cv: 17 },
  { key: "paper", label: "Paper / Files", cv: 15 },
  { key: "plastic", label: "Plastics", cv: 35 },
  { key: "textile", label: "Textiles", cv: 20 },
  { key: "diesel", label: "Diesel / Fuel", cv: 45 },
  { key: "solvent", label: "Paints / Solvents", cv: 40 },
  { key: "pvc", label: "PVC / Cables", cv: 25 },
];

function classify(q) {
  if (q < 1130) return { label: "Low", tone: "text-emerald-600 bg-emerald-50", hint: "Standard detection & first-aid firefighting adequate." };
  if (q < 2270) return { label: "Moderate", tone: "text-amber-600 bg-amber-50", hint: "Sprinkler protection recommended as per NBC." };
  if (q < 4550) return { label: "High", tone: "text-orange-600 bg-orange-50", hint: "Automatic sprinklers + hydrant system required." };
  return { label: "Very High", tone: "text-rose-600 bg-rose-50", hint: "Full hydrant, sprinkler and special suppression systems required." };
}

export default function FireLoad() {
  const [area, setArea] = useState(500);
  const [masses, setMasses] = useState({ wood: 200, paper: 50, plastic: 20 });
  const [result, setResult] = useState(null);

  const compute = () => {
    const totalMJ = MATERIALS.reduce((s, m) => s + (Number(masses[m.key]) || 0) * m.cv, 0);
    const q = totalMJ / (Number(area) || 1);
    setResult({ totalMJ, q: Math.round(q), ...classify(q) });
  };

  return (
    <div>
      <PageHeader title="Fire Load Calculator" icon={Flame} subtitle="Estimate fire load density (MJ/m²) per NBC 2016 Part 4." />
      <div className="mb-4 flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <p className="text-xs font-medium text-amber-800">Engineering calculations and AI recommendations require review by a qualified professional.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Compartment Details" actions={<Button size="sm" onClick={compute}><Calculator className="h-3.5 w-3.5" /> Calculate</Button>}>
          <div className="space-y-4 p-5">
            <div>
              <label className="text-xs font-medium text-slate-500">Floor Area (m²)</label>
              <input type="number" min="1" value={area} onChange={(e) => setArea(e.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-rose-300" />
            </div>
            <div className="space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Combustible Contents (kg)</p>
              {MATERIALS.map((m) => (
                <div key={m.key} className="flex items-center gap-3">
                  <span className="w-40 text-sm text-slate-700">{m.label}</span>
                  <span className="w-14 text-[11px] text-slate-400">{m.cv} MJ/kg</span>
                  <input
                    type="number" min="0" value={masses[m.key] ?? ""}
                    onChange={(e) => setMasses({ ...masses, [m.key]: e.target.value })}
                    placeholder="0" className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-rose-300"
                  />
                </div>
              ))}
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Result">
          <div className="p-5">
            {!result ? (
              <p className="py-16 text-center text-sm text-slate-400">Enter contents and press Calculate.</p>
            ) : (
              <>
                <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 p-5 text-center">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Fire Load Density</p>
                  <p className="mt-2 text-4xl font-extrabold text-slate-900">{result.q.toLocaleString("en-IN")}</p>
                  <p className="text-xs text-slate-500">MJ/m² · Total {Math.round(result.totalMJ).toLocaleString("en-IN")} MJ</p>
                  <span className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${result.tone}`}>
                    <Flame className="h-3.5 w-3.5" /> {result.label} Hazard
                  </span>
                </div>
                <p className="mt-4 text-xs leading-relaxed text-slate-500"><span className="font-semibold text-slate-700">Interpretation:</span> {result.hint}</p>
              </>
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}