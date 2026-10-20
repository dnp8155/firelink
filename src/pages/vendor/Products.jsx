import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useList, formatINR } from "@/hooks/useList";
import { useAuth } from "@/lib/AuthContext";
import { useVendor, logVendorAction } from "@/lib/vendor";
import { PageHeader, SectionCard, EmptyState } from "@/components/ui-bits";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Image } from "@/components/ui/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Package, Plus, Search, Upload, ArrowLeft, ArrowRight, Copy, Archive, Send, Loader2, X, Edit, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES = ["Extinguishers", "Fire Detectors", "Sprinklers", "Hose & Reels", "Pumps", "Signage", "PPE", "Gas Detection", "Fire Suppression"];
const TABS = [
  { key: "all", label: "All" },
  { key: "draft", label: "Drafts" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Live" },
  { key: "rejected", label: "Rejected" },
];
const EMPTY = {
  name: "", sku: "", category: "Extinguishers", subcategory: "", brand: "", manufacturer: "", model: "",
  description: "", certifications: "", price: "", b2b_price: "", b2c_price: "", mrp: "", moq: "1", stock: "0", unit: "piece",
  image_url: "", datasheet_url: "", youtube_url: "",
  // Technical Specs
  fire_class: "", extinguishing_agent: "", capacity: "", operating_pressure: "", discharge_range: "", discharge_time: "",
  temperature_range: "", warranty_months: "", shelf_life: "", country_of_origin: "India", hsn_code: "",
  installation_type: "", application_area: "", applicable_standards: "", dimensions: "", weight_kg: "", material: "", rechargeable: false,
};

export default function VendorProducts() {
  const { user } = useAuth();
  const { vendor } = useVendor();
  const { toast } = useToast();
  const products = useList("Product", {}, "-created_date", 500);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("all");
  const [open, setOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [editing, setEditing] = useState(null); // product being edited
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [generatingImg, setGeneratingImg] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const mine = products.data.filter((p) => (vendor && p.vendor_id === vendor.id) || p.created_by_id === user?.id);
  const filtered = mine.filter((p) =>
    (tab === "all" ||
      (tab === "approved" && p.approval_status === "approved") ||
      (tab === "pending" && ["pending", "changes_required"].includes(p.approval_status)) ||
      (tab === "rejected" && ["rejected"].includes(p.approval_status)) ||
      (tab === "draft" && p.approval_status === "draft")) &&
    (!q || `${p.name} ${p.sku} ${p.category} ${p.brand}`.toLowerCase().includes(q.toLowerCase()))
  );

  const openCreate = () => { setForm(EMPTY); setEditing(null); setWizardStep(0); setOpen(true); };
  const openEdit = (p) => {
    setEditing(p);
    setForm({
      name: p.name || "", sku: p.sku || "", category: p.category || "Extinguishers", subcategory: p.subcategory || "",
      brand: p.brand || "", manufacturer: p.manufacturer || "", model: p.model || "",
      description: p.description || "", certifications: (p.certifications || []).join(", "),
      price: p.price ?? "", b2b_price: p.b2b_price ?? "", b2c_price: p.b2c_price ?? "", mrp: p.mrp ?? "", moq: p.moq ?? 1, stock: p.stock ?? 0, unit: p.unit || "piece",
      image_url: p.image_url || "", datasheet_url: p.datasheet_url || "", youtube_url: p.youtube_url || "",
      fire_class: p.fire_class || "", extinguishing_agent: p.extinguishing_agent || "", capacity: p.capacity || "",
      operating_pressure: p.operating_pressure || "", discharge_range: p.discharge_range || "", discharge_time: p.discharge_time || "",
      temperature_range: p.temperature_range || "", warranty_months: p.warranty_months ?? "", shelf_life: p.shelf_life || "",
      country_of_origin: p.country_of_origin || "India", hsn_code: p.hsn_code || "", installation_type: p.installation_type || "",
      application_area: p.application_area || "", applicable_standards: p.applicable_standards || "", dimensions: p.dimensions || "",
      weight_kg: p.weight_kg ?? "", material: p.material || "", rechargeable: p.rechargeable || false,
    });
    setWizardStep(0);
    setOpen(true);
  };

  const uploadImage = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setUploadingImg(true);
    try {
      const res = await base44.integrations.Core.UploadPublicFile({ file });
      const uploadedUrl = res.file_url;
      setForm((f) => ({ ...f, image_url: uploadedUrl }));
      setUploadingImg(false);

      // Auto-generate professional studio-style product image
      setGeneratingImg(true);
      try {
        const productName = form.name || "fire safety product";
        const genRes = await base44.functions.invoke("generate_product_image", { product_name: productName, image_url: uploadedUrl });
        const generatedUrl = genRes?.data?.url || genRes?.url;
        if (generatedUrl) {
          setForm((f) => ({ ...f, image_url: generatedUrl }));
          toast({ title: "Studio image generated!", description: "Professional product photo created automatically." });
        }
      } catch (genErr) {
        // Keep the original uploaded image if generation fails
        toast({ title: "Studio image could not be generated", description: "Using the uploaded image as-is." });
      } finally {
        setGeneratingImg(false);
      }
    } catch (err) {
      toast({ title: "Image upload failed", description: err.message, variant: "destructive" });
      setUploadingImg(false);
    } finally {
      e.target.value = "";
    }
  };

  const payload = () => ({
    name: form.name, sku: form.sku || "SKU-" + Date.now().toString().slice(-6), category: form.category,
    subcategory: form.subcategory || "", brand: form.brand || "", manufacturer: form.manufacturer || "",
    model: form.model || "", description: form.description || "",
    certifications: form.certifications ? form.certifications.split(",").map((s) => s.trim()).filter(Boolean) : [],
    price: Number(form.price) || 0, b2b_price: form.b2b_price ? Number(form.b2b_price) : null, b2c_price: form.b2c_price ? Number(form.b2c_price) : null, mrp: form.mrp ? Number(form.mrp) : null,
    moq: Number(form.moq) || 1, stock: Number(form.stock) || 0, unit: form.unit || "piece",
    image_url: form.image_url || "", datasheet_url: form.datasheet_url || "", youtube_url: form.youtube_url || "",
    vendor_id: vendor ? vendor.id : "", vendor_name: vendor ? vendor.company_name : "",
    fire_class: form.fire_class || "", extinguishing_agent: form.extinguishing_agent || "", capacity: form.capacity || "",
    operating_pressure: form.operating_pressure || "", discharge_range: form.discharge_range || "", discharge_time: form.discharge_time || "",
    temperature_range: form.temperature_range || "", warranty_months: form.warranty_months ? Number(form.warranty_months) : 0,
    shelf_life: form.shelf_life || "", country_of_origin: form.country_of_origin || "India", hsn_code: form.hsn_code || "",
    installation_type: form.installation_type || "", application_area: form.application_area || "",
    applicable_standards: form.applicable_standards || "", dimensions: form.dimensions || "",
    weight_kg: form.weight_kg ? Number(form.weight_kg) : 0, material: form.material || "", rechargeable: form.rechargeable || false,
  });

  const saveDraft = async () => {
    if (!form.name) { toast({ title: "Product name is required.", variant: "destructive" }); return; }
    setSaving(true);
    try {
      if (editing) {
        await base44.entities.Product.update(editing.id, { ...payload(), approval_status: editing.approval_status });
      } else {
        await base44.entities.Product.create({ ...payload(), approval_status: "draft" });
      }
      await logVendorAction("Product saved as draft", "Vendor Products", form.name);
      toast({ title: "Draft saved" });
      setOpen(false);
      products.reload();
    } catch (e) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const submitForApproval = async () => {
    if (!form.name || !form.price) {
      toast({ title: "Name and selling price are required to submit.", variant: "destructive" });
      setWizardStep(0);
      return;
    }
    if (vendor && vendor.approval_status !== "approved") {
      toast({ title: "Selling not enabled yet", description: "Your vendor application must be approved before products can be submitted. Saved as draft instead." });
      return saveDraft();
    }
    setSaving(true);
    try {
      if (editing) {
        await base44.entities.Product.update(editing.id, { ...payload(), approval_status: "pending" });
      } else {
        await base44.entities.Product.create({ ...payload(), approval_status: "pending" });
      }
      await logVendorAction("Product submitted for approval", "Vendor Products", form.name);
      toast({ title: "Submitted for approval", description: "The FireLink team will review your product." });
      setOpen(false);
      products.reload();
    } catch (e) {
      toast({ title: "Submit failed", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const duplicate = async (p) => {
    try {
      const { id, created_date, updated_date, approval_status, ...rest } = p;
      await base44.entities.Product.create({ ...rest, name: `${p.name} (Copy)`, approval_status: "draft" });
      toast({ title: "Product duplicated", description: "Edit the copy and submit it." });
      products.reload();
    } catch (e) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    }
  };

  const archive = async (p) => {
    try {
      await base44.entities.Product.update(p.id, { approval_status: "disabled" });
      await logVendorAction("Product archived", "Vendor Products", p.name);
      toast({ title: "Product archived" });
      products.reload();
    } catch (e) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    }
  };

  const submitAllForApproval = async () => {
    const submittable = mine.filter((p) => ["draft", "rejected", "changes_required"].includes(p.approval_status));
    if (submittable.length === 0) { toast({ title: "No products to submit" }); return; }
    if (vendor && vendor.approval_status !== "approved") { toast({ title: "Selling not enabled yet", description: "Your vendor application must be approved first." }); return; }
    setSaving(true);
    try {
      await base44.entities.Product.bulkUpdate(submittable.map((p) => ({ id: p.id, approval_status: "pending" })));
      await logVendorAction("Bulk product submission", "Vendor Products", `${submittable.length} products`);
      toast({ title: "All products submitted!", description: `${submittable.length} product(s) sent for approval.` });
      products.reload();
    } catch (e) {
      toast({ title: "Bulk submit failed", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const resubmit = async (p) => {
    if (vendor && vendor.approval_status !== "approved") {
      toast({ title: "Selling not enabled yet", variant: "destructive" });
      return;
    }
    try {
      await base44.entities.Product.update(p.id, { approval_status: "pending" });
      toast({ title: "Resubmitted for approval" });
      products.reload();
    } catch (e) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle="Your catalog — drafts, approvals and live marketplace listings."
        actions={<div className="flex gap-2"><Button onClick={submitAllForApproval} variant="outline" disabled={saving}><Send className="h-4 w-4" /> Submit All</Button><Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4" /> Add Product</Button></div>}
      />

      {/* Tabs + search */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn("rounded-lg px-3 py-1.5 text-xs font-semibold transition",
              tab === t.key ? "bg-slate-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50")}>
            {t.label}
          </button>
        ))}
        <div className="relative ml-auto w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products…"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-emerald-300" />
        </div>
      </div>

      {products.loading ? (
        <div className="space-y-2">{[0, 1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-200/60" />)}</div>
      ) : filtered.length === 0 ? (
        <SectionCard>
          <EmptyState
            icon={Package}
            title={tab === "all" ? "No products yet" : `No ${TABS.find((t) => t.key === tab)?.label.toLowerCase()}`}
            description="Add your first product, save it as a draft, then submit it for FireLink approval."
            action={<Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4" /> Add Product</Button>}
          />
        </SectionCard>
      ) : (
        <SectionCard>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3 font-medium">Product</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Price</th>
                <th className="px-5 py-3 font-medium">Stock</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                          {p.image_url ? <Image src={p.image_url} className="h-full w-full" /> : <Package className="m-2.5 h-5 w-5 text-slate-300" />}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{p.name}</p>
                          <p className="text-xs text-slate-400">{p.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{p.category}</td>
                    <td className="px-5 py-3 font-medium text-slate-800">{formatINR(p.price)}</td>
                    <td className="px-5 py-3"><span className={p.stock <= 5 ? "font-semibold text-rose-600" : "text-slate-600"}>{p.stock}</span></td>
                    <td className="px-5 py-3">
                      <StatusBadge status={p.approval_status === "approved" ? "approved (live)" : p.approval_status} tone={p.approval_status === "disabled" ? "red" : statusTone(p.approval_status)} />
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        {["draft", "rejected", "changes_required"].includes(p.approval_status) && (
                          <button onClick={() => resubmit(p)} title="Submit for approval" className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50"><Send className="h-4 w-4" /></button>
                        )}
                        <button onClick={() => openEdit(p)} title="Edit" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"><Edit className="h-4 w-4" /></button>
                        <button onClick={() => duplicate(p)} title="Duplicate" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"><Copy className="h-4 w-4" /></button>
                        <button onClick={() => archive(p)} title="Archive" className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600"><Archive className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      {/* Add/Edit wizard */}
      <Dialog open={open} onOpenChange={(o) => !o && setOpen(false)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Product" : "Add Product"}</DialogTitle>
          </DialogHeader>

          <div className="mb-4 flex items-center gap-1.5">
            {["Basics", "Details", "Technical Specs", "Pricing & Stock"].map((s, i) => (
              <React.Fragment key={s}>
                <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold", wizardStep === i ? "bg-emerald-600 text-white" : i < wizardStep ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400")}>{s}</span>
                {i < 3 && <span className={cn("h-0.5 w-4", i < wizardStep ? "bg-emerald-300" : "bg-slate-200")} />}
              </React.Fragment>
            ))}
          </div>

          {wizardStep === 0 && (
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label>Product Name *</Label><Input value={form.name} onChange={set("name")} placeholder="e.g. ABC 5kg ABC Dry Powder Fire Extinguisher" /></div>
              <div><Label>SKU</Label><Input value={form.sku} onChange={set("sku")} placeholder="Auto-generated if empty" /></div>
              <div><Label>Category</Label>
                <select value={form.category} onChange={set("category")} className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm">
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div><Label>Subcategory</Label><Input value={form.subcategory} onChange={set("subcategory")} placeholder="e.g. Dry Powder" /></div>
              <div><Label>Brand</Label><Input value={form.brand} onChange={set("brand")} placeholder="e.g. Safex" /></div>
              <div><Label>Manufacturer</Label><Input value={form.manufacturer} onChange={set("manufacturer")} /></div>
              <div><Label>Model</Label><Input value={form.model} onChange={set("model")} /></div>
            </div>
          )}

          {wizardStep === 1 && (
            <div className="space-y-3">
              <div><Label>Description</Label><Textarea value={form.description} onChange={set("description")} rows={4} placeholder="Short description, features and applications…" /></div>
              <div><Label>Certifications (comma separated)</Label><Input value={form.certifications} onChange={set("certifications")} placeholder="ISI, CE, ISO 9001" /></div>
              <div>
                <Label>Product Image</Label>
                <div className="mt-1.5 flex items-center gap-3">
                  <div className="relative h-16 w-16 overflow-hidden rounded-xl bg-slate-100">
                    {form.image_url && <img src={form.image_url} alt="" className="h-full w-full object-cover" />}
                    {generatingImg && <div className="absolute inset-0 flex items-center justify-center bg-violet-600/60"><Loader2 className="h-5 w-5 animate-spin text-white" /></div>}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800">
                      {uploadingImg ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />} Upload Image
                      <input type="file" accept=".png,.jpg,.jpeg,.webp" className="hidden" onChange={uploadImage} disabled={uploadingImg || generatingImg} />
                    </label>
                    {form.image_url && <button onClick={() => setForm({ ...form, image_url: "" })} className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 hover:text-rose-700"><X className="h-3.5 w-3.5" /> Remove Image</button>}
                    {generatingImg && <span className="inline-flex items-center gap-1 text-xs font-medium text-violet-600"><Sparkles className="h-3.5 w-3.5 animate-pulse" /> Generating studio image…</span>}
                  </div>
                </div>
              </div>
              <div><Label>Datasheet URL (optional)</Label><Input value={form.datasheet_url} onChange={set("datasheet_url")} placeholder="https://…" /></div>
              <div><Label>YouTube Video Link (optional)</Label><Input value={form.youtube_url} onChange={set("youtube_url")} placeholder="https://youtube.com/watch?v=…" /></div>
            </div>
          )}

          {wizardStep === 2 && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Fire Class / Rating</Label><Input value={form.fire_class} onChange={set("fire_class")} placeholder="e.g. A·B·C, 21A·113B" /></div>
                <div><Label>Extinguishing Agent</Label>
                  <select value={form.extinguishing_agent} onChange={set("extinguishing_agent")} className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm">
                    <option value="">Select…</option>
                    {["Dry Powder (ABC)", "CO₂", "AFFF Foam", "Water", "Wet Chemical", "Clean Agent", "Dry Powder (D Class)", "Foam"].map((a) => <option key={a}>{a}</option>)}
                  </select>
                </div>
                <div><Label>Capacity / Volume</Label><Input value={form.capacity} onChange={set("capacity")} placeholder="e.g. 5 kg, 9L, 2kg CO₂" /></div>
                <div><Label>Operating Pressure</Label><Input value={form.operating_pressure} onChange={set("operating_pressure")} placeholder="e.g. 15 bar" /></div>
                <div><Label>Discharge Range</Label><Input value={form.discharge_range} onChange={set("discharge_range")} placeholder="e.g. 3-5 metres" /></div>
                <div><Label>Discharge Time</Label><Input value={form.discharge_time} onChange={set("discharge_time")} placeholder="e.g. 8-12 sec" /></div>
                <div><Label>Temperature Range</Label><Input value={form.temperature_range} onChange={set("temperature_range")} placeholder="e.g. -20°C to +55°C" /></div>
                <div><Label>Shelf Life</Label><Input value={form.shelf_life} onChange={set("shelf_life")} placeholder="e.g. 5 years" /></div>
                <div><Label>Warranty (months)</Label><Input type="number" value={form.warranty_months} onChange={set("warranty_months")} placeholder="e.g. 60" /></div>
                <div><Label>Installation Type</Label>
                  <select value={form.installation_type} onChange={set("installation_type")} className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm">
                    <option value="">Select…</option>
                    {["Wall-mounted", "Floor-standing", "Portable", "Ceiling-mounted", "Trolley-mounted"].map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div><Label>Application Area</Label><Input value={form.application_area} onChange={set("application_area")} placeholder="e.g. Office, Kitchen, Factory, Electrical Panel" /></div>
              <div><Label>Applicable Standards (ISI / BIS / NBC / TAC)</Label><Input value={form.applicable_standards} onChange={set("applicable_standards")} placeholder="e.g. IS 15683:2018, ISI Marked" /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Dimensions (W×H×D)</Label><Input value={form.dimensions} onChange={set("dimensions")} placeholder="15×45×15 cm" /></div>
                <div><Label>Weight (kg)</Label><Input type="number" value={form.weight_kg} onChange={set("weight_kg")} placeholder="3.5" /></div>
                <div><Label>Material</Label><Input value={form.material} onChange={set("material")} placeholder="e.g. Mild Steel, Aluminium" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Country of Origin</Label><Input value={form.country_of_origin} onChange={set("country_of_origin")} placeholder="India" /></div>
                <div><Label>HSN Code</Label><Input value={form.hsn_code} onChange={set("hsn_code")} placeholder="e.g. 84241010" /></div>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={form.rechargeable} onChange={(e) => setForm({ ...form, rechargeable: e.target.checked })} className="h-4 w-4 rounded border-slate-300" /> Rechargeable / Reusable</label>
            </div>
          )}

          {wizardStep === 3 && (
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Selling Price (₹) *</Label><Input type="number" value={form.price} onChange={set("price")} /></div>
              <div><Label>B2B Price (₹)</Label><Input type="number" value={form.b2b_price} onChange={set("b2b_price")} placeholder="Bulk rate" /></div>
              <div><Label>B2C Price (₹)</Label><Input type="number" value={form.b2c_price} onChange={set("b2c_price")} placeholder="Retail rate" /></div>
              <div><Label>MRP (₹)</Label><Input type="number" value={form.mrp} onChange={set("mrp")} /></div>
              <div><Label>MOQ</Label><Input type="number" value={form.moq} onChange={set("moq")} /></div>
              <div><Label>Stock</Label><Input type="number" value={form.stock} onChange={set("stock")} /></div>
              <div><Label>Unit</Label>
                <select value={form.unit} onChange={set("unit")} className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm">
                  {["piece", "box", "set", "metre", "kg", "litre"].map((u) => <option key={u}>{u}</option>)}
                </select>
              </div>
            </div>
          )}

          <DialogFooter className="mt-4 flex items-center justify-between sm:justify-between">
            <Button variant="outline" onClick={() => setWizardStep((s) => Math.max(0, s - 1))} disabled={wizardStep === 0}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={saveDraft} disabled={saving}>Save Draft</Button>
              {wizardStep < 3 ? (
                <Button onClick={() => setWizardStep((s) => s + 1)} className="bg-emerald-600 hover:bg-emerald-700">Next <ArrowRight className="h-4 w-4" /></Button>
              ) : (
                <Button onClick={submitForApproval} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Submit for Approval
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}