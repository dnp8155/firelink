import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuthGate } from "@/hooks/useAuthGate";
import AuthRequiredModal from "@/components/AuthRequiredModal";
import { ArrowRight, ChevronRight } from "lucide-react";

const STATS = [
  { label: "Total Assets", value: "248" },
  { label: "Due for Service", value: "12" },
  { label: "Certificates Expiring", value: "7" },
  { label: "Compliance Score", value: "92%" },
];

const STEPS = ["QR Code", "Asset Details", "Certificate", "Inspection History", "Maintenance"];

export default function AssetQr() {
  const navigate = useNavigate();
  const { open, setOpen, message, gate } = useAuthGate();

  return (
    <>
      <section className="bg-slate-900">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              <span className="text-sm font-semibold text-slate-300">Asset Management</span>
            </div>
            <h2 className="font-display mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Know every fire safety asset you own
            </h2>
            <p className="mt-4 max-w-lg text-lg text-slate-300">
              Track equipment, certificates, inspections and maintenance from one connected platform.
            </p>
            <Button
              onClick={() =>
                gate({
                  message: "Sign in to explore asset management.",
                  run: () => navigate("/assets"),
                })
              }
              className="mt-8 h-11 px-6 font-semibold"
            >
              Explore Asset Management <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="rounded-2xl border border-slate-700/60 bg-slate-800/60 p-6">
            <div className="grid grid-cols-2 gap-3">
              {STATS.map((s) => (
                <div key={s.label} className="rounded-xl bg-slate-900/60 p-4">
                  <p className="text-2xl font-bold text-white">{s.value}</p>
                  <p className="text-[11px] text-slate-400">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-2">
              {["ABC Extinguisher — Block A, Floor 2", "Smoke Detector — Level 3, Zone C", "Fire Hydrant — Gate 1"].map((row, i) => (
                <div key={row} className="flex items-center justify-between rounded-xl bg-slate-900/60 px-4 py-3">
                  <span className="text-xs font-medium text-slate-300">{row}</span>
                  <span className={`text-[10px] font-semibold ${i === 1 ? "text-amber-400" : "text-emerald-400"}`}>
                    {i === 1 ? "Due for service" : "Healthy"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-[auto_1fr]">
          <div className="flex h-40 w-40 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
            <div className="text-center">
              <div className="mx-auto h-20 w-20 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center text-2xl font-bold text-slate-700">QR</div>
            </div>
          </div>
          <div>
            <h2 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Scan. Verify. Know.</h2>
            <p className="mt-2 max-w-xl text-base text-slate-600">
              Every connected asset can be identified through QR-based tracking.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-2">
              {STEPS.map((step, i) => (
                <React.Fragment key={step}>
                  {i > 0 && <ChevronRight className="h-4 w-4 text-slate-300" />}
                  <span className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700">
                    {step}
                  </span>
                </React.Fragment>
              ))}
            </div>
            <Button asChild variant="outline" className="mt-7 font-medium">
              <a href="#compliance">Learn More</a>
            </Button>
          </div>
        </div>
      </section>

      <AuthRequiredModal open={open} onClose={() => setOpen(false)} message={message} />
    </>
  );
}