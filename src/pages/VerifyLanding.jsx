import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import Seo from "@/components/Seo";
import JsonLd from "@/components/JsonLd";
import { keywordList } from "@/lib/seoPages";
import { webPageSchema, graph } from "@/lib/schema";
import VerifyResultCard from "@/components/verify/VerifyResultCard";
import { Button } from "@/components/ui/button";
import { ArrowRight, BadgeCheck, QrCode, Search, ShieldCheck, Building2, Wrench, Loader2 } from "lucide-react";

const CAN_VERIFY = [
  "Fire safety certificates issued for extinguishers, alarms, hydrants, sprinklers, pumps and suppression systems",
  "Fire NOC records registered by an organisation for its sites and buildings",
  "Assets tracked on FireLink — each label carries a QR code that opens its verification page",
];

const USES = [
  {
    icon: ShieldCheck,
    title: "Safety & procurement teams",
    text: "Check a supplier's certificate before you accept a delivery, or confirm a vendor's record is genuine before you sign off an invoice.",
  },
  {
    icon: Building2,
    title: "Facility & compliance managers",
    text: "Show an inspector that every certificate and fire NOC on site is authentic and still valid.",
  },
  {
    icon: Wrench,
    title: "Vendors & service partners",
    text: "Point customers at your verified record instead of emailing scanned copies that anyone could edit.",
  },
];

export default function VerifyLanding() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState(null);
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const verify = async (e) => {
    e.preventDefault();
    const value = code.trim();
    if (!value) return;
    setLoading(true);
    setError("");
    try {
      const res = await base44.functions.invoke("verify_qr", { code: value });
      const data = res?.data || {};
      setResult(data && data.found === false ? null : data);
      setChecked(true);
    } catch (err) {
      setResult(null);
      setChecked(false);
      setError(err?.response?.data?.error || "Verification failed. Please try again in a minute.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background">
      <Seo
        title="Verify a Fire Safety Certificate, NOC or Asset — FireLink India"
        description="Check the authenticity of any fire safety certificate, fire NOC or asset registered on FireLink. Enter the certificate number or scan the QR code for an instant verification result."
        keywords={keywordList(
          "fire safety certificate verification India",
          "fire NOC verification India",
          "verify fire extinguisher certificate India",
          "asset QR verification India"
        )}
        path="/verify"
      />
      <JsonLd
        data={graph(
          webPageSchema({
            type: "WebPage",
            name: "Verify a Fire Safety Certificate, NOC or Asset — FireLink",
            description:
              "Verify fire safety certificates, fire NOC records and asset QR labels registered on FireLink India.",
            path: "/verify",
          })
        )}
      />

      <section className="border-b border-slate-200 bg-gradient-to-br from-orange-50 via-white to-rose-50">
        <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-primary">
            <BadgeCheck className="h-3.5 w-3.5" /> Public verification
          </span>
          <h1 className="font-display mt-4 text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-4xl">
            Verify a fire safety certificate, NOC or asset
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
            Every certificate, fire NOC and asset label issued through FireLink carries a unique code.
            Enter it below — or scan the QR code — to confirm the record is genuine and see its validity.
          </p>

          <form onSubmit={verify} className="mt-7 flex flex-col gap-2.5 sm:flex-row">
            <div className="flex flex-1 items-center rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-sm focus-within:border-primary/40">
              <Search className="h-4 w-4 shrink-0 text-slate-400" />
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Certificate number or QR code (e.g. FL-CERT-2024-001)"
                className="w-full bg-transparent pl-2.5 text-sm text-slate-700 outline-none"
              />
            </div>
            <Button type="submit" size="lg" className="font-semibold" disabled={loading || !code.trim()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              {loading ? "Checking…" : "Verify now"}
            </Button>
          </form>

          {error && (
            <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs font-medium text-amber-800">{error}</p>
          )}

          {checked && (
            <div className="mt-6">
              <VerifyResultCard result={result} code={code.trim()} />
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2.5">
              <QrCode className="h-5 w-5 text-primary" />
              <h2 className="font-display text-lg font-bold text-slate-900">What you can verify</h2>
            </div>
            <ul className="mt-4 space-y-2.5">
              {CAN_VERIFY.map((c) => (
                <li key={c} className="flex items-start gap-2.5 text-sm leading-relaxed text-slate-600">
                  <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-display text-lg font-bold text-slate-900">Why it matters</h2>
            <div className="mt-4 space-y-4">
              {USES.map((u) => (
                <div key={u.title} className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <u.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{u.title}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-slate-600">{u.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 px-4 py-12 text-center sm:px-6">
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-slate-900">
            Issue verifiable certificates from your own dashboard
          </h2>
          <p className="max-w-xl text-sm leading-relaxed text-slate-600">
            Vendors generate certificates and asset QR labels on FireLink; organisations keep every
            certificate and fire NOC in one register with expiry alerts and renewals.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild className="font-semibold">
              <Link to="/vendor/register">Become a vendor <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button asChild variant="outline" className="font-semibold">
              <Link to="/contact">Talk to the team</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}