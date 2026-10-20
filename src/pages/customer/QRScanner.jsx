import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageHeader, SectionCard } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QrCode, ScanLine, Boxes, ArrowRight, ShieldCheck, FileCheck2, ClipboardCheck } from "lucide-react";

export default function QRScanner() {
  const [code, setCode] = useState("");
  const navigate = useNavigate();

  const go = (e) => {
    e.preventDefault();
    if (code.trim()) navigate(`/verify/${encodeURIComponent(code.trim())}`);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="QR Scanner" subtitle="Scan or enter an asset / certificate QR code to verify it instantly." icon={QrCode} />

      <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
        <div className="relative mx-auto flex h-44 w-44 items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-white">
          <QrCode className="h-16 w-16 text-slate-700" />
          <ScanLine className="absolute left-4 right-4 animate-pulse border-t-2 border-primary" />
        </div>

        <form onSubmit={go} className="flex flex-col justify-center gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="qr">QR / Asset / Certificate code</Label>
            <Input
              id="qr"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. FL-AST-0001"
              className="h-11"
            />
          </div>
          <Button type="submit" disabled={!code.trim()} className="h-11 font-semibold">
            <ScanLine className="h-4 w-4" /> Verify Now
          </Button>
          <p className="text-xs text-slate-500">
            Point your phone camera at the asset QR sticker, or type the code printed below it.
          </p>
        </form>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          { icon: Boxes, title: "Asset Details", desc: "Type, make, model & location" },
          { icon: FileCheck2, title: "Certificate", desc: "Validity & issuing authority" },
          { icon: ClipboardCheck, title: "Service History", desc: "Inspections & maintenance" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.title} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <Icon className="h-5 w-5 text-primary" />
              <p className="mt-2 text-sm font-semibold text-slate-800">{s.title}</p>
              <p className="text-xs text-slate-500">{s.desc}</p>
            </div>
          );
        })}
      </div>

      <SectionCard className="mt-4">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="flex items-center gap-2 text-sm text-slate-600">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            Public verification only shows safe information — no confidential customer data is exposed.
          </p>
          <Link to="/customer/assets" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
            Go to My Assets <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </SectionCard>
    </div>
  );
}