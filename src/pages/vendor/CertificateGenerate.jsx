import React, { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useList } from "@/hooks/useList";
import { PageHeader, SectionCard, EmptyState, KpiCard } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import { Award, Plus, QrCode, ShieldCheck, Calendar, Download } from "lucide-react";

const CERT_TYPES = ["inspection", "maintenance", "installation", "compliance", "training"];

export default function CertificateGenerate() {
  const { toast } = useToast();
  const certs = useList("Certificate", {}, "-created_date", 100);
  const assets = useList("Asset", {}, "-created_date", 100);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [stats, setStats] = useState({ total: 0, valid: 0, expiring: 0, expired: 0 });
  const [form, setForm] = useState({
    certificate_number: "", title: "", type: "inspection", asset_id: "", asset_name: "",
    organization_id: "", organization_name: "", issued_by: "", issue_date: "", expiry_date: "",
  });

  const loadStats = useCallback(async () => {
    const { rows } = await base44.entities.Certificate.aggregate({ groupBy: "status" });
    const by = {};
    (rows || []).forEach((r) => { by[r.status] = r.count || 0; });
    setStats({
      total: (rows || []).reduce((s, r) => s + (r.count || 0), 0),
      valid: by.valid || 0,
      expiring: by.expiring_soon || 0,
      expired: by.expired || 0,
    });
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  const genCertNo = () => `FSC-${Date.now().toString().slice(-8)}`;
  const genQr = () => `QR-${Math.random().toString(36).substring(2, 12).toUpperCase()}`;

  const openCreate = () => {
    setForm({
      certificate_number: genCertNo(), title: "", type: "inspection", asset_id: "", asset_name: "",
      organization_id: "", organization_name: "", issued_by: "",
      issue_date: new Date().toISOString().split("T")[0], expiry_date: "",
    });
    setOpen(true);
  };

  const create = async () => {
    if (!form.title.trim() || !form.certificate_number.trim()) {
      toast({ title: "Title and certificate number are required", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const user = await base44.auth.me();
      const payload = {
        ...form,
        organization_id: form.organization_id || user.data?.organization_id || user.id,
        qr_code: genQr(),
        status: "valid",
        issued_by: form.issued_by || user.full_name || user.data?.vendor_name || "—",
      };
      await base44.entities.Certificate.create(payload);
      toast({ title: "Certificate generated", description: `QR Code: ${payload.qr_code}` });
      setOpen(false);
      certs.reload();
      loadStats();
    } catch (e) {
      toast({ title: "Create failed", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const selectAsset = (a) => setForm({ ...form, asset_id: a.id, asset_name: a.name, organization_id: a.organization_id || "", organization_name: a.organization_name || "" });

  const downloadPdf = async (c) => {
    const { downloadCertificate } = await import("@/lib/certificate");
    try { downloadCertificate(c, null); toast({ title: "Generating PDF…" }); }
    catch { toast({ title: "Could not build the PDF", variant: "destructive" }); }
  };

  return (
    <div>
      <PageHeader
        title="Certificate Generate"
        subtitle="Create digital certificates with QR codes for verification."
        icon={Award}
        actions={<Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4" /> Generate Certificate</Button>}
      />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Total Certificates" value={certs.loading ? "…" : stats.total} icon={Award} tone="green" />
        <KpiCard label="Valid" value={stats.valid} icon={ShieldCheck} tone="blue" />
        <KpiCard label="Expiring Soon" value={stats.expiring} icon={Calendar} tone="amber" />
        <KpiCard label="Expired" value={stats.expired} icon={Calendar} tone="rose" />
      </div>

      {certs.loading ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-200/60" />)}</div>
      ) : certs.data.length === 0 ? (
        <SectionCard><EmptyState icon={Award} title="No certificates yet" description="Generate your first digital certificate." action={<Button onClick={openCreate} className="bg-emerald-600"><Plus className="h-4 w-4" /> Generate Certificate</Button>} /></SectionCard>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {certs.data.map((c) => (
            <SectionCard key={c.id}>
              <div className="p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><Award className="h-6 w-6" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">{c.title}</p>
                    <p className="text-xs text-slate-500">{c.certificate_number}</p>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs capitalize text-slate-500">
                      <span>{c.type}</span>
                      {c.asset_name && <span>· {c.asset_name}</span>}
                      {c.expiry_date && <span>· Exp: {c.expiry_date}</span>}
                    </div>
                    <div className="mt-2 flex items-center gap-2"><QrCode className="h-3.5 w-3.5 text-slate-400" /><code className="text-[11px] text-slate-400">{c.qr_code}</code></div>
                    <button onClick={() => downloadPdf(c)} className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50">
                      <Download className="h-3 w-3" /> Download PDF
                    </button>
                  </div>
                  <StatusBadge status={c.status} tone={statusTone(c.status)} />
                </div>
              </div>
            </SectionCard>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Generate Certificate</DialogTitle></DialogHeader>
          <div className="max-h-[70vh] space-y-3 overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Certificate Number</Label><Input value={form.certificate_number} onChange={(e) => setForm({ ...form, certificate_number: e.target.value })} className="font-mono text-sm" /></div>
              <div>
                <Label>Type</Label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm capitalize">
                  {CERT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Fire Extinguisher Inspection Certificate" /></div>
            <div>
              <Label>Link to Asset (optional)</Label>
              <select value={form.asset_id} onChange={(e) => { const a = assets.data.find((x) => x.id === e.target.value); if (a) selectAsset(a); else setForm({ ...form, asset_id: "" }); }} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <option value="">Select asset…</option>
                {assets.data.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.asset_code})</option>)}
              </select>
            </div>
            <div><Label>Organization Name</Label><Input value={form.organization_name} onChange={(e) => setForm({ ...form, organization_name: e.target.value })} placeholder="Customer organization" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Issue Date</Label><Input type="date" value={form.issue_date} onChange={(e) => setForm({ ...form, issue_date: e.target.value })} /></div>
              <div><Label>Expiry Date</Label><Input type="date" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={create} disabled={busy} className="bg-emerald-600 hover:bg-emerald-700">{busy ? "Generating…" : "Generate"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}