import React from "react";
import { PageHeader, SectionCard, EmptyState } from "@/components/ui-bits";
import { Plug, Sparkles, Image as ImageIcon, FileLock2, Mail, BellRing, QrCode, Database, ShieldCheck, HardDrive, Cpu, Radio } from "lucide-react";

const SERVICES = [
  { name: "ai_assistant", label: "Marketplace AI assistant", purpose: "Answers buyer and vendor questions about products, compliance and services.", group: "AI", icon: Sparkles },
  { name: "generate_product_image", label: "Product image generation", purpose: "Creates vendor product imagery from a text brief.", group: "AI", icon: ImageIcon },
  { name: "get_vendor_document_url", label: "Secure document links", purpose: "Issues short-lived links to private vendor documents and certificates.", group: "Files", icon: FileLock2 },
  { name: "order_notification", label: "Order notifications", purpose: "Emails buyers and vendors whenever an order status changes.", group: "Email", icon: Mail },
  { name: "rfq_notify_vendors", label: "RFQ vendor alerts", purpose: "Notifies matching vendors when a buyer publishes an RFQ.", group: "Email", icon: BellRing },
  { name: "verify_qr", label: "QR code verification", purpose: "Public endpoint that verifies certificate and asset QR codes.", group: "Verification", icon: QrCode },
];

const CAPABILITIES = [
  { label: "Data & entities", detail: "Records with row-level access rules", icon: Database },
  { label: "Authentication & roles", detail: "Sign-in, roles and permissions", icon: ShieldCheck },
  { label: "Private file storage", detail: "Signed, expiring document links", icon: HardDrive },
  { label: "AI services", detail: "Text, image and assistant models", icon: Cpu },
  { label: "Email delivery", detail: "Transactional notifications", icon: Mail },
  { label: "Realtime updates", detail: "Live record subscriptions", icon: Radio },
];

export default function Integrations() {
  return (
    <div>
      <PageHeader title="Integrations" icon={Plug} subtitle="Services this platform runs on, and the app services it exposes." />

      <SectionCard title={`App services (${SERVICES.length})`} className="mb-4">
        <div className="grid gap-3 p-5 md:grid-cols-2">
          {SERVICES.map((s) => (
            <div key={s.name} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><s.icon className="h-5 w-5" /></span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-slate-900">{s.label}</p>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">Active</span>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">{s.purpose}</p>
                <p className="mt-1.5 font-mono text-[11px] text-slate-400">{s.name}</p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Platform capabilities" className="mb-4">
        <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map((c) => (
            <div key={c.label} className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-slate-600 shadow-sm"><c.icon className="h-4 w-4" /></span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-800">{c.label}</p>
                <p className="truncate text-xs text-slate-500">{c.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Connected accounts">
        <EmptyState
          icon={Plug}
          title="No external accounts connected"
          description="Payments, calendars, messaging and other outside services can be connected when the platform needs them."
        />
      </SectionCard>
    </div>
  );
}