import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { PageHeader, SectionCard, EmptyState } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Image as Img } from "@/components/ui/image";
import { PenTool, Upload, ShieldCheck, FileCheck2, CheckCircle2 } from "lucide-react";

export default function DigitalSignature() {
  const { toast } = useToast();
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const user = await base44.auth.me();
      const vid = user.data?.vendor_id;
      if (vid) { const vendors = await base44.entities.Vendor.filter({ _id: vid }, "-created_date", 1); if (vendors.length > 0) { setVendor(vendors[0]); setUrl(vendors[0].digital_signature_url || ""); } }
    } catch (e) { toast({ title: "Failed to load vendor", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const upload = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setBusy(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      setUrl(file_url);
      if (vendor) { await base44.entities.Vendor.update(vendor.id, { digital_signature_url: file_url }); }
      toast({ title: "Digital signature uploaded" });
    } catch (e) { toast({ title: "Upload failed", description: e.message, variant: "destructive" }); }
    finally { setBusy(false); }
  };

  const save = async () => {
    if (!vendor) return;
    setBusy(true);
    try { await base44.entities.Vendor.update(vendor.id, { digital_signature_url: url }); toast({ title: "Digital signature saved" }); load(); }
    catch (e) { toast({ title: "Save failed", description: e.message, variant: "destructive" }); }
    finally { setBusy(false); }
  };

  return (
    <div>
      <PageHeader title="Digital Signature" subtitle="Upload your digital signature for certificates and quotations." icon={PenTool} />
      <div className="mx-auto max-w-2xl">
        <SectionCard>
          <div className="p-6">
            {loading ? (
              <div className="h-40 animate-pulse rounded-xl bg-slate-200/60" />
            ) : (
              <>
                <div className="mb-4 flex items-center gap-3 rounded-xl bg-blue-50 p-4"><ShieldCheck className="h-5 w-5 shrink-0 text-blue-600" /><p className="text-sm text-blue-700">Your digital signature will be applied to certificates and quotations you generate.</p></div>

                {url ? (
                  <div className="mb-4 rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center gap-3"><FileCheck2 className="h-5 w-5 text-emerald-600" /><span className="text-sm font-medium text-slate-700">Current Signature</span><CheckCircle2 className="ml-auto h-4 w-4 text-emerald-500" /></div>
                    <div className="mt-3 rounded-lg bg-slate-50 p-4"><Img src={url} className="mx-auto max-h-32" fittingType="fit" /></div>
                  </div>
                ) : (
                  <div className="mb-4 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 p-8 text-center"><PenTool className="mb-2 h-8 w-8 text-slate-300" /><p className="text-sm text-slate-500">No signature uploaded yet</p></div>
                )}

                <div className="space-y-3">
                  <div><Label>Upload Signature Image</Label>
                    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100">
                      <Upload className="h-4 w-4" />{busy ? "Uploading…" : "Choose File"}
                      <input type="file" accept="image/*" className="hidden" onChange={upload} disabled={busy} />
                    </label>
                  </div>
                  <div><Label>Or paste image URL</Label><Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" /></div>
                  <Button onClick={save} disabled={busy || !url} className="w-full bg-emerald-600 hover:bg-emerald-700">{busy ? "Saving…" : "Save Signature"}</Button>
                </div>
              </>
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}