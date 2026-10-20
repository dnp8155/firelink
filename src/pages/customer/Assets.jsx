import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useList } from "@/hooks/useList";
import { useAuth } from "@/lib/AuthContext";
import { PageHeader, SectionCard, EmptyState } from "@/components/ui-bits";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import { Boxes, Plus, QrCode, MapPin, Search, Eye, Wrench, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import BulkAssetImport from "@/components/assets/BulkAssetImport";
import { cn } from "@/lib/utils";

export default function Assets() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const assets = useList("Asset", {}, "-created_date", 300);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [qrAsset, setQrAsset] = useState(null);
  const [form, setForm] = useState({ name: "", category: "Extinguisher", brand: "", model: "", site_name: "", building: "", floor: "", zone: "" });
  const [bulkOpen, setBulkOpen] = useState(false);

  const filtered = assets.data.filter((a) => !q || (a.name + a.asset_code + a.brand + a.site_name).toLowerCase().includes(q.toLowerCase()));

  const create = async () => {
    if (!form.name) return;
    try {
      const code = "AST-" + Date.now().toString().slice(-6);
      await base44.entities.Asset.create({
        asset_code: code,
        qr_code: "QR" + code,
        name: form.name,
        category: form.category,
        brand: form.brand,
        model: form.model,
        organization_id: "org_patel",
        organization_name: "Patel Enterprises",
        site_name: form.site_name,
        building: form.building,
        floor: form.floor,
        zone: form.zone,
        status: "active",
        condition: "good",
        owner_id: user?.id || "demo",
      });
      toast({ title: "Asset registered", description: code });
      setOpen(false);
      setForm({ name: "", category: "Extinguisher", brand: "", model: "", site_name: "", building: "", floor: "", zone: "" });
      assets.reload();
    } catch (e) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div>
      <PageHeader title="Assets" subtitle="Fire safety assets with QR tracking." actions={
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setBulkOpen(true)}><Upload className="h-4 w-4" /> Bulk Import</Button>
          <Button onClick={() => setOpen(true)} className="bg-rose-600 hover:bg-rose-700"><Plus className="h-4 w-4" /> Register Asset</Button>
        </div>
      } />

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search assets by name, code, site…" className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-rose-300 sm:max-w-md" />
      </div>

      {assets.data.length === 0 ? <SectionCard><EmptyState icon={Boxes} title="No assets registered" description="Register your fire safety assets to track inspections and compliance." /></SectionCard> : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((a) => (
            <div key={a.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Boxes className="h-5 w-5" /></div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{a.name}</p>
                    <p className="text-xs text-slate-500">{a.asset_code}</p>
                  </div>
                </div>
                <StatusBadge status={a.status} tone={statusTone(a.status)} />
              </div>
              <div className="mt-3 space-y-1 text-xs text-slate-500">
                <p>{a.brand} {a.model && `· ${a.model}`}</p>
                <p className="flex items-center gap-1.5"><MapPin className="h-3 w-3" /> {[a.site_name, a.building, a.floor, a.zone].filter(Boolean).join(" → ") || "Unassigned"}</p>
                {a.next_inspection_date && <p>Next inspection: {a.next_inspection_date}</p>}
              </div>
              <div className="mt-3 flex gap-2 border-t border-slate-50 pt-3">
                <button onClick={() => setQrAsset(a)} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"><QrCode className="h-3.5 w-3.5" /> QR</button>
                <button onClick={() => navigate(`/customer/assets/${a.id}`)} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"><Eye className="h-3.5 w-3.5" /> View</button>
                <button onClick={() => navigate(`/customer/assets/${a.id}`)} className="flex items-center justify-center rounded-lg border border-slate-200 px-2.5 text-slate-600 hover:bg-slate-50"><Wrench className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Register Asset</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Asset Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. CO₂ Extinguisher" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Category</Label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                  {["Extinguisher", "Detector", "Sprinkler", "Hose", "Pump", "Hydrant", "Signage"].map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div><Label>Brand</Label><Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} /></div>
            </div>
            <div><Label>Model</Label><Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Site</Label><Input value={form.site_name} onChange={(e) => setForm({ ...form, site_name: e.target.value })} placeholder="Ahmedabad Plant" /></div>
              <div><Label>Building</Label><Input value={form.building} onChange={(e) => setForm({ ...form, building: e.target.value })} placeholder="Production Block" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Floor</Label><Input value={form.floor} onChange={(e) => setForm({ ...form, floor: e.target.value })} placeholder="First Floor" /></div>
              <div><Label>Zone</Label><Input value={form.zone} onChange={(e) => setForm({ ...form, zone: e.target.value })} placeholder="Fire Zone A" /></div>
            </div>
          </div>
          <DialogFooter><Button onClick={create} className="bg-rose-600 hover:bg-rose-700">Register</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!qrAsset} onOpenChange={(o) => !o && setQrAsset(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader><DialogTitle>Asset QR Code</DialogTitle></DialogHeader>
          {qrAsset && (
            <div className="flex flex-col items-center py-4">
              <div className="flex h-44 w-44 items-center justify-center rounded-2xl border-2 border-slate-200 bg-white">
                <div className="grid grid-cols-8 gap-px">
                  {Array.from({ length: 64 }).map((_, i) => <div key={i} className={cn("h-3.5 w-3.5", Math.random() > 0.45 ? "bg-slate-900" : "bg-transparent")} />)}
                </div>
              </div>
              <p className="mt-4 text-sm font-semibold text-slate-900">{qrAsset.name}</p>
              <p className="text-xs text-slate-500">{qrAsset.asset_code}</p>
              <p className="mt-2 text-[11px] text-slate-400">Scan to verify at /verify/{qrAsset.qr_code}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <BulkAssetImport
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        onImported={() => assets.reload()}
      />
    </div>
  );
}