import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useVendor, profileCompletion, missingProfileItems, logVendorAction } from "@/lib/vendor";
import { PageHeader, SectionCard } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Image } from "@/components/ui/image";
import { useToast } from "@/components/ui/use-toast";
import { Building2, Loader2, Save, Upload } from "lucide-react";

const FIELDS = {
  company: [
    ["company_name", "Legal Company Name *"], ["trade_name", "Trade Name"], ["registration_number", "Company Registration No."],
    ["gst_number", "GST Number"], ["pan_number", "PAN"], ["msme_number", "MSME Number"],
    ["year_established", "Year Established", "number"], ["website", "Website"],
    ["contact_person", "Contact Person"], ["phone", "Phone"], ["email", "Company Email"],
    ["address", "Address"], ["city", "City"], ["state", "State"], ["pincode", "Pincode"],
  ],
  bank: [
    ["bank_name", "Bank Name"], ["account_holder", "Account Holder Name"],
    ["account_number", "Account Number"], ["ifsc_code", "IFSC"],
  ],
};

const LIST_FIELDS = [
  ["categories", "Categories (comma separated)"],
  ["brands", "Brands (comma separated)"],
  ["services_offered", "Services Offered (comma separated)"],
  ["industries_served", "Industries Served (comma separated)"],
  ["service_locations", "Service Locations (comma separated)"],
  ["delivery_locations", "Delivery Locations (comma separated)"],
];

export default function CompanyProfile() {
  const { vendor, loading, reload } = useVendor();
  const { toast } = useToast();
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (vendor) setForm({ ...vendor });
  }, [vendor]);

  if (loading) return <div className="h-64 animate-pulse rounded-2xl bg-slate-200/60" />;
  if (!vendor) return <SectionCard><p className="p-8 text-center text-sm text-slate-500">No vendor profile found. Please register first.</p></SectionCard>;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async () => {
    if (!form.company_name || !form.contact_person) {
      toast({ title: "Company name and contact person are required.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {};
      Object.entries(form).forEach(([k, v]) => {
        if (["id", "created_date", "updated_date", "created_by_id", "created_by", "approval_status", "rejection_reason", "admin_remarks"].includes(k)) return;
        payload[k] = v;
      });
      await base44.entities.Vendor.update(vendor.id, payload);
      await logVendorAction("Profile update", "Vendor Company", vendor.company_name, "", "updated");
      toast({ title: "Profile saved", description: "Your company information has been updated." });
      reload();
    } catch (e) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const uploadLogo = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const res = await base44.integrations.Core.UploadPublicFile({ file });
      setForm({ ...form, logo_url: res.file_url });
      toast({ title: "Logo uploaded", description: "Remember to save your profile." });
    } catch (err) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    }
    e.target.value = "";
  };

  const completion = profileCompletion(vendor);
  const missing = missingProfileItems(vendor);

  return (
    <div>
      <PageHeader
        title="Company Profile"
        icon={Building2}
        subtitle="Your business information as verified by the FireLink team."
        actions={
          <Button onClick={save} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Changes
          </Button>
        }
      />

      {/* Completion */}
      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <SectionCard className="sm:col-span-2">
          <div className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-800">Profile {completion}% complete</p>
              <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${completion >= 80 ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                {completion >= 80 ? "Strong" : "Needs work"}
              </span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400" style={{ width: `${completion}%` }} />
            </div>
            {missing.length > 0 && (
              <p className="mt-2.5 text-xs text-slate-500">
                Missing: <span className="font-medium text-amber-600">{missing.join(", ")}</span>
              </p>
            )}
          </div>
        </SectionCard>
        <SectionCard>
          <div className="flex items-center gap-4 p-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100">
              {form.logo_url
                ? <Image src={form.logo_url} alt="Company logo" fittingType="fit" className="h-full w-full" />
                : <Building2 className="h-6 w-6 text-slate-400" />}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Company Logo</p>
              <label className="mt-1.5 inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800">
                <Upload className="h-3.5 w-3.5" /> Upload
                <input type="file" accept=".png,.jpg,.jpeg,.svg" className="hidden" onChange={uploadLogo} />
              </label>
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="space-y-5">
        <SectionCard title="Company Information">
          <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
            {FIELDS.company.map(([k, label, type]) => (
              <div key={k}>
                <Label>{label}</Label>
                <Input type={type || "text"} value={form[k] || ""} onChange={set(k)} className="mt-1.5 h-10" />
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Business Information">
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <div>
              <Label>Business Type</Label>
              <select value={form.business_type || "manufacturer"} onChange={set("business_type")} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm">
                {["manufacturer", "distributor", "reseller", "service_provider", "system_integrator"].map((b) => (
                  <option key={b} value={b}>{b.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Number of Employees</Label>
              <Input type="number" value={form.employees_count ?? ""} onChange={set("employees_count")} className="mt-1.5 h-10" />
            </div>
            {LIST_FIELDS.map(([k, label]) => (
              <div key={k} className="sm:col-span-2">
                <Label>{label}</Label>
                <Input
                  value={Array.isArray(form[k]) ? form[k].join(", ") : (form[k] || "")}
                  onChange={set(k)}
                  className="mt-1.5 h-10"
                />
              </div>
            ))}
            <div className="sm:col-span-2">
              <Label>Company Description</Label>
              <Textarea value={form.description || ""} onChange={set("description")} rows={3} className="mt-1.5" placeholder="Tell buyers about your company, expertise and certifications…" />
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Bank Details (for settlements)">
          <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
            {FIELDS.bank.map(([k, label]) => (
              <div key={k}>
                <Label>{label}</Label>
                <Input value={form[k] || ""} onChange={set(k)} className="mt-1.5 h-10" />
              </div>
            ))}
          </div>
        </SectionCard>

        <div className="flex justify-end">
          <Button onClick={save} disabled={saving} size="lg" className="bg-emerald-600 hover:bg-emerald-700">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}