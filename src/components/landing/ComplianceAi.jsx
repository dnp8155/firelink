import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuthGate } from "@/hooks/useAuthGate";
import AuthRequiredModal from "@/components/AuthRequiredModal";
import { ArrowRight } from "lucide-react";

const FEATURES = [
  "Certificate Tracking",
  "Fire NOC",
  "Inspection Scheduling",
  "Renewal Alerts",
  "Corrective Actions",
  "Compliance Dashboard",
];

const AI_EXAMPLES = [
  "Which extinguisher is suitable for my electrical room?",
  "When does my certificate expire?",
  "Which assets are due for service?",
  "Help me create an RFQ.",
];

export default function ComplianceAi() {
  const navigate = useNavigate();
  const { open, setOpen, message, gate } = useAuthGate();

  return (
    <>
      <section id="compliance" className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span className="text-sm font-semibold text-slate-700">Compliance</span>
          </div>
          <h2 className="font-display mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Stay ahead of compliance
          </h2>
          <p className="mt-3 max-w-lg text-lg text-slate-600">
            Certificates, NOCs, inspections and renewals — tracked automatically, with alerts before anything expires.
          </p>
          <div className="mt-7 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
            {FEATURES.map((f) => (
              <span key={f} className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {f}
              </span>
            ))}
          </div>
          <Button
            onClick={() => gate({ message: "Sign in to explore your compliance dashboard.", run: () => navigate("/compliance") })}
            className="mt-8 h-11 px-6 font-semibold"
          >
            Explore Compliance <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <p className="text-sm font-bold text-slate-900">Compliance Dashboard</p>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">LIVE</span>
          </div>
          <div className="mt-4 flex items-end gap-2">
            <p className="text-4xl font-extrabold text-slate-900">92<span className="text-lg">%</span></p>
            <p className="pb-1.5 text-xs font-medium text-slate-500">compliance score</p>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-[92%] rounded-full bg-emerald-500" />
          </div>
          <div className="mt-5 space-y-2">
            {[
              ["Fire NOC — Main Plant", "Valid till Mar 2027", "ok"],
              ["AMC Contract — Alarm System", "Valid till Dec 2026", "ok"],
              ["Extinguisher Certificates (7)", "Expiring in 30 days", "warn"],
              ["Hydrant Inspection", "Overdue by 4 days", "bad"],
            ].map(([label, sub, state]) => (
              <div key={label} className="flex items-center justify-between border-b border-slate-50 pb-2">
                <div>
                  <p className="text-xs font-semibold text-slate-800">{label}</p>
                  <p className="text-[11px] text-slate-500">{sub}</p>
                </div>
                <span
                  className={
                    "h-2.5 w-2.5 rounded-full " +
                    (state === "ok" ? "bg-emerald-500" : state === "warn" ? "bg-amber-500" : "bg-rose-500")
                  }
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50/60">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2">
          <div className="order-2 lg:order-1">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">AI</div>
                <div>
                  <p className="text-sm font-bold text-slate-900">FIRELINK AI Assistant</p>
                  <p className="text-[11px] text-emerald-600">Online</p>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                  Which extinguisher is suitable for my electrical room?
                </div>
                <div className="max-w-[90%] rounded-2xl rounded-bl-md bg-slate-100 px-4 py-2.5 text-sm text-slate-700">
                  For electrical rooms, a CO₂ or Clean Agent extinguisher is recommended — they're non-conductive and
                  leave no residue on sensitive equipment.
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                {AI_EXAMPLES.map((ex) => (
                  <span key={ex} className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-medium text-slate-600">
                    {ex}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="text-sm font-semibold text-slate-700">AI Assistant</span>
            </div>
            <h2 className="font-display mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Your fire &amp; safety AI assistant
            </h2>
            <p className="mt-3 max-w-lg text-lg text-slate-600">
              Get intelligent assistance for products, compliance, documents, assets and fire safety workflows.
            </p>
            <Button
              onClick={() => gate({ message: "Sign in to use your personal AI assistant.", run: () => navigate("/ai-assistant") })}
              className="mt-8 h-11 px-6 font-semibold"
            >
              Explore AI Assistant <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      <AuthRequiredModal open={open} onClose={() => setOpen(false)} message={message} />
    </>
  );
}