import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import DocUploadField from "@/components/vendor/DocUploadField";
import { VENDOR_DOC_TYPES } from "@/lib/vendor";
import { cn } from "@/lib/utils";
import {
  Flame, Mail, Loader2, ArrowRight, ArrowLeft, ShieldCheck, CheckCircle2, AlertCircle,
  Building2, Boxes, Landmark, FileText, ClipboardCheck, Store,
} from "lucide-react";
import Logo, { LogoFull } from "@/components/Logo";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const STEPS = ["Company", "Business", "Banking", "Documents", "Review"];
const STEP_ICONS = [Building2, Boxes, Landmark, FileText, ClipboardCheck];
const CATEGORIES = ["Extinguishers", "Fire Detectors", "Sprinklers", "Hose & Reels", "Pumps", "Signage", "PPE", "Gas Detection", "Fire Suppression", "Installation", "AMC", "Audit"];
const SERVICE_OPTIONS = ["Fire Safety Audit", "Extinguisher Service", "Fire Alarm Maintenance", "Hydrant Maintenance", "Sprinkler Maintenance", "Fire Pump Maintenance", "AMC", "Installation", "Commissioning", "Fire NOC Assistance"];
const INDUSTRIES = ["Manufacturing", "Healthcare", "Hospitality", "Education", "IT / Offices", "Retail", "Real Estate", "Oil & Gas", "Government"];
const BIZ_TYPES = ["manufacturer", "distributor", "reseller", "service_provider", "system_integrator"];
const VENDOR_TYPES = ["Sales", "Sales & Service", "Service"];
const BUSINESS_CATEGORIES = [{ key: "B2B", label: "B+B (Business to Business)" }, { key: "B2C", label: "B+C (Business to Consumer)" }];

const F = ({ children, label, ...props }) => (
  <div><Label>{label}</Label><Input className="h-11" {...props}>{children}</Input></div>
);

export default function VendorRegister() {
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [form, setForm] = useState({
    company_name: "", trade_name: "", business_type: "manufacturer", business_category: "B2B", vendor_type: "Sales", registration_number: "",
    gst_number: "", pan_number: "", msme_number: "", year_established: "", website: "",
    email: "", password: "", contact_person: "", phone: "", address: "", city: "", state: "", pincode: "",
    categories: [], brands: "", services_offered: [], industries_served: [],
    service_locations: "", delivery_locations: "", employees_count: "",
    bank_name: "", account_holder: "", account_number: "", ifsc_code: "",
  });
  const [docs, setDocs] = useState({});

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const toggle = (k, v) => setForm((f) => ({
    ...f,
    [k]: (f[k] || []).includes(v) ? f[k].filter((x) => x !== v) : [...(f[k] || []), v],
  }));
  const setDoc = (key, val) => setDocs((d) => ({ ...d, [key]: val }));

  const mandatoryMissing = VENDOR_DOC_TYPES.filter((d) => d.required && !docs[d.key]);

  const validate = () => {
    if (step === 0) {
      if (!form.company_name) return "Please enter your legal company name.";
      if (!form.contact_person) return "Please enter the contact person.";
      if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) return "Please enter a valid login email.";
      if (!form.password || form.password.length < 6) return "Password must be at least 6 characters.";
      if (!form.gst_number) return "Please enter your GST number.";
    }
    if (step === 2) {
      if (!form.bank_name || !form.account_number || !form.ifsc_code) return "Please complete your bank details.";
    }
    if (step === 3) {
      if (mandatoryMissing.length) return `Please upload all mandatory documents: ${mandatoryMissing.map((d) => d.label).join(", ")}.`;
    }
    return null;
  };

  const next = () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError("");
    setStep((s) => s + 1);
  };
  const back = () => { setError(""); setStep((s) => Math.max(0, s - 1)); };

  const submitApplication = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError("");
    setLoading(true);
    try {
      await base44.auth.register({ email: form.email, password: form.password });
      setStep(5); // OTP screen
    } catch (e) {
      setError(e.message || "Registration failed. This email may already be registered.");
    } finally {
      setLoading(false);
    }
  };

  const verify = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await base44.auth.verifyOtp({ email: form.email, otpCode });
      if (!result || !result.access_token) throw new Error("Verification failed.");
      base44.auth.setToken(result.access_token);
      await createVendorProfile();
      setStep(6);
    } catch (e) {
      setError(e.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  const createVendorProfile = async () => {
    const me = await base44.auth.me();
    const vendor = await base44.entities.Vendor.create({
      ...form,
      business_category: form.business_category,
      vendor_type: form.vendor_type,
      year_established: form.year_established ? Number(form.year_established) : null,
      employees_count: form.employees_count ? Number(form.employees_count) : 0,
      brands: form.brands ? form.brands.split(",").map((s) => s.trim()).filter(Boolean) : [],
      service_locations: form.service_locations ? form.service_locations.split(",").map((s) => s.trim()).filter(Boolean) : [],
      delivery_locations: form.delivery_locations ? form.delivery_locations.split(",").map((s) => s.trim()).filter(Boolean) : [],
      industries_served: form.industries_served || [],
      approval_status: "submitted",
      rating: 0,
      revenue: 0,
      owner_id: me.id,
    });
    for (const [docType, d] of Object.entries(docs)) {
      if (!d || !d.file_uri) continue;
      await base44.entities.VendorDocument.create({
        vendor_id: vendor.id,
        doc_type: docType,
        name: d.name,
        file_url: d.file_uri,
        status: "uploaded",
      }).catch(() => {});
    }
    await base44.auth.updateMe({ vendor_id: vendor.id, full_name: form.contact_person }).catch(() => {});
    localStorage.setItem("fsc_active_role", "vendor");
  };

  const resend = async () => {
    try { await base44.auth.resendOtp(form.email); toast({ title: "Code sent", description: "Check your email." }); }
    catch (e) { setError(e.message); }
  };

  // ---- OTP step ----
  if (step === 5) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                <Mail className="h-7 w-7" />
              </div>
              <h1 className="font-display text-xl font-bold text-slate-900">Verify your email</h1>
              <p className="mt-1 text-sm text-slate-500">We sent a 6-digit code to {form.email} to secure your vendor account.</p>
            </div>
            {error && <div className="mb-4 rounded-lg bg-rose-50 px-3.5 py-2.5 text-sm font-medium text-rose-700 ring-1 ring-rose-200">{error}</div>}
            <div className="mb-6 flex justify-center">
              <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode} autoFocus autoComplete="one-time-code">
                <InputOTPGroup>{[0, 1, 2, 3, 4, 5].map((i) => <InputOTPSlot key={i} index={i} />)}</InputOTPGroup>
              </InputOTP>
            </div>
            <Button onClick={verify} className="h-12 w-full bg-emerald-600 font-semibold hover:bg-emerald-700" disabled={loading || otpCode.length < 6}>
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Verifying…</> : "Verify & Submit Application"}
            </Button>
            <p className="mt-4 text-center text-sm text-slate-500">
              Didn't receive the code? <button onClick={resend} className="font-semibold text-primary hover:underline">Resend OTP</button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ---- Success step ----
  if (step === 6) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-lg text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Application Submitted!</h1>
          <p className="mt-2 text-sm text-slate-500">
            Your vendor application is now under review. Our team will verify your documents and get back within 2–3 business days.
          </p>
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 text-left">
            <h3 className="mb-3 text-sm font-bold text-slate-800">What happens next?</h3>
            {["Application Submitted", "Documents Review", "Admin Verification", "Approval", "Marketplace Activation"].map((s, i) => (
              <div key={s} className="flex items-center gap-3 py-1.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-[11px] font-bold text-emerald-600">{i + 1}</span>
                <p className="text-sm text-slate-700">{s}</p>
              </div>
            ))}
          </div>
          <Button onClick={() => (window.location.href = "/vendor/dashboard")} className="mt-6 h-12 bg-emerald-600 px-8 font-semibold hover:bg-emerald-700">
            Go to Vendor Dashboard <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // ---- Steps 0–4 ----
  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Left panel */}
      <div className="relative hidden w-2/5 flex-col justify-between overflow-hidden bg-slate-900 p-12 lg:flex">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-900" />
        <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-emerald-600/10 blur-3xl" />
        <Link to="/" className="relative flex items-center gap-2.5">
          <Logo className="h-10 w-10" />
          <span className="font-display text-xl font-extrabold tracking-tight text-white">FIRE<span className="text-amber-400">LINK</span></span>
        </Link>
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white backdrop-blur">
            <Store className="h-3 w-3" /> Vendor Registration
          </span>
          <h1 className="font-display mt-4 text-3xl font-extrabold leading-tight text-white">Build your fire & safety business on FireLink.</h1>
          <div className="mt-8 space-y-3">
            {["Reach verified enterprise buyers", "Manage catalog, orders & shipments", "Respond to RFQs, quotes & service jobs", "Track settlements & analytics"].map((t) => (
              <div key={t} className="flex items-center gap-2.5 text-sm text-slate-200">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" /> {t}
              </div>
            ))}
          </div>
        </div>
        <div className="relative rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <p className="flex items-start gap-2 text-xs text-amber-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            Vendor accounts require admin approval. You can complete your profile and upload documents while your application is under review.
          </p>
        </div>
      </div>

      {/* Right form */}
      <div className="flex w-full items-center justify-center px-4 py-8 lg:w-3/5">
        <div className="w-full max-w-2xl">
          <Link to="/" className="mb-6 flex items-center justify-center lg:hidden">
            <LogoFull className="h-11" />
          </Link>

          {/* Stepper */}
          <div className="mb-6 flex items-center gap-1.5">
            {STEPS.map((s, i) => {
              const Icon = STEP_ICONS[i];
              return (
                <React.Fragment key={s}>
                  <div className={cn("flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold", i === step ? "bg-emerald-600 text-white" : i < step ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400")}>
                    <Icon className="h-3 w-3" /> <span className="hidden sm:inline">{s}</span>
                  </div>
                  {i < STEPS.length - 1 && <div className={cn("h-0.5 flex-1", i < step ? "bg-emerald-300" : "bg-slate-200")} />}
                </React.Fragment>
              );
            })}
          </div>

          {error && <div className="mb-4 rounded-lg bg-rose-50 px-3.5 py-2.5 text-sm font-medium text-rose-700 ring-1 ring-rose-200">{error}</div>}

          {/* STEP 1 — COMPANY */}
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="font-display text-xl font-bold text-slate-900">Company Information</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <F label="Legal Company Name *" value={form.company_name} onChange={set("company_name")} placeholder="SafeGuard Fire Systems Pvt. Ltd." />
                <F label="Trade Name" value={form.trade_name} onChange={set("trade_name")} placeholder="SafeGuard" />
                <div>
                  <Label>Business Type</Label>
                  <select value={form.business_type} onChange={set("business_type")} className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm">
                    {BIZ_TYPES.map((b) => <option key={b} value={b}>{b.replace(/_/g, " ")}</option>)}
                  </select>
                </div>
                <F label="Company Registration No." value={form.registration_number} onChange={set("registration_number")} placeholder="U29299MH2012PTC…" />
                <F label="GST Number *" value={form.gst_number} onChange={set("gst_number")} placeholder="27AAAAA0000A1Z5" />
                <F label="PAN" value={form.pan_number} onChange={set("pan_number")} placeholder="AAAPA1234A" />
                <F label="MSME Number" value={form.msme_number} onChange={set("msme_number")} placeholder="UDYAM-…" />
                <F label="Year Established" type="number" value={form.year_established} onChange={set("year_established")} placeholder="2012" />
                <F label="Website" value={form.website} onChange={set("website")} placeholder="https://…" />
                <F label="Company Email *" type="email" value={form.email} onChange={set("email")} placeholder="sales@company.com" />
                <F label="Contact Person *" value={form.contact_person} onChange={set("contact_person")} placeholder="Full name" />
                <F label="Phone" value={form.phone} onChange={set("phone")} placeholder="+91 98765 43210" />
                <F label="Password *" type="password" value={form.password} onChange={set("password")} placeholder="Min. 6 characters" />
              </div>
              <F label="Address" value={form.address} onChange={set("address")} placeholder="Full registered address" />
              <div className="grid grid-cols-3 gap-3">
                <F label="City" value={form.city} onChange={set("city")} placeholder="Mumbai" />
                <F label="State" value={form.state} onChange={set("state")} placeholder="Maharashtra" />
                <F label="Pincode" value={form.pincode} onChange={set("pincode")} placeholder="400001" />
              </div>
            </div>
          )}

          {/* STEP 2 — BUSINESS */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="font-display text-xl font-bold text-slate-900">Business Information</h2>
              <div>
                <Label>Business Category</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {BUSINESS_CATEGORIES.map((c) => (
                    <button key={c.key} type="button" onClick={() => setForm({ ...form, business_category: c.key })}
                      className={cn("rounded-lg border px-4 py-2 text-sm font-medium transition", form.business_category === c.key ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300")}>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Vendor Type</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {VENDOR_TYPES.map((t) => (
                    <button key={t} type="button" onClick={() => setForm({ ...form, vendor_type: t })}
                      className={cn("rounded-lg border px-4 py-2 text-sm font-medium transition", form.vendor_type === t ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300")}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Product Categories</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => (
                    <button key={c} type="button" onClick={() => toggle("categories", c)}
                      className={cn("rounded-lg border px-3 py-1.5 text-xs font-medium transition", form.categories.includes(c) ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300")}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Brands (comma separated)</Label>
                <Input className="mt-2 h-11" value={form.brands} onChange={set("brands")} placeholder="Agni, Safex, Aero…" />
              </div>
              <div>
                <Label>Services Offered</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {SERVICE_OPTIONS.map((s) => (
                    <button key={s} type="button" onClick={() => toggle("services_offered", s)}
                      className={cn("rounded-lg border px-3 py-1.5 text-xs font-medium transition", form.services_offered.includes(s) ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300")}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Industries Served</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {INDUSTRIES.map((s) => (
                    <button key={s} type="button" onClick={() => toggle("industries_served", s)}
                      className={cn("rounded-lg border px-3 py-1.5 text-xs font-medium transition", form.industries_served.includes(s) ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300")}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <F label="Service Locations (comma separated)" value={form.service_locations} onChange={set("service_locations")} placeholder="Mumbai, Pune, Nashik" />
                <F label="Delivery Locations (comma separated)" value={form.delivery_locations} onChange={set("delivery_locations")} placeholder="Maharashtra, Gujarat, Goa" />
                <F label="Number of Employees" type="number" value={form.employees_count} onChange={set("employees_count")} placeholder="25" />
              </div>
            </div>
          )}

          {/* STEP 3 — BANKING */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-display text-xl font-bold text-slate-900">Banking Details</h2>
              <p className="text-sm text-slate-500">Used for settlements. Your bank proof document will be uploaded in the next step.</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <F label="Bank Name *" value={form.bank_name} onChange={set("bank_name")} placeholder="HDFC Bank" />
                <F label="Account Holder Name *" value={form.account_holder} onChange={set("account_holder")} placeholder="SafeGuard Fire Systems Pvt. Ltd." />
                <F label="Account Number *" value={form.account_number} onChange={set("account_number")} placeholder="50100XXXXXXXX" />
                <F label="IFSC *" value={form.ifsc_code} onChange={set("ifsc_code")} placeholder="HDFC0001234" />
              </div>
            </div>
          )}

          {/* STEP 4 — DOCUMENTS */}
          {step === 3 && (
            <div className="space-y-3">
              <h2 className="font-display text-xl font-bold text-slate-900">Verification Documents</h2>
              <p className="text-sm text-slate-500">Mandatory documents (marked *) are required to submit your application. Files are stored securely and are visible only to you and FireLink admins.</p>
              {VENDOR_DOC_TYPES.map((d) => (
                <DocUploadField key={d.key} label={d.label} required={d.required} doc={docs[d.key] || null} onUploaded={(val) => setDoc(d.key, val)} />
              ))}
            </div>
          )}

          {/* STEP 5 — REVIEW */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="font-display text-xl font-bold text-slate-900">Review & Submit</h2>
              {[
                ["Company", [form.company_name, form.business_type && `Type: ${form.business_type.replace(/_/g, " ")}`, form.business_category && `Category: ${form.business_category}`, form.vendor_type && `Vendor: ${form.vendor_type}`, form.gst_number && `GST: ${form.gst_number}`, form.pan_number && `PAN: ${form.pan_number}`, form.email]],
                ["Business", [`${(form.categories || []).length} categories`, `${(form.services_offered || []).length} services`, form.service_locations && `Service areas: ${form.service_locations}`]],
                ["Banking", [form.bank_name, form.account_holder, form.account_number ? `A/C ••${form.account_number.slice(-4)}` : "", form.ifsc_code]],
                ["Documents", [...VENDOR_DOC_TYPES.filter((d) => docs[d.key]).map((d) => `${d.label} ✓`), ...mandatoryMissing.map((d) => `${d.label} — MISSING`)]],
              ].map(([title, rows]) => (
                <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5">
                  <h4 className="text-sm font-bold text-slate-800">{title}</h4>
                  <div className="mt-2 space-y-1">
                    {rows.filter(Boolean).map((r, i) => (
                      <p key={i} className={cn("text-sm", String(r).includes("MISSING") ? "text-rose-600" : "text-slate-600")}>{r}</p>
                    ))}
                  </div>
                </div>
              ))}
              <div className="flex items-start gap-2 rounded-xl bg-emerald-50 p-4 text-xs text-emerald-800 ring-1 ring-emerald-200">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                By submitting, you confirm the information is accurate. Your account will be created immediately, but selling is enabled only after admin approval.
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between">
            <Button variant="outline" onClick={back} disabled={step === 0 || loading} className="h-11">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            {step < 4 ? (
              <Button onClick={next} className="h-11 bg-emerald-600 font-semibold hover:bg-emerald-700">
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={submitApplication} disabled={loading} className="h-11 bg-emerald-600 px-6 font-semibold hover:bg-emerald-700">
                {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating account…</> : <>Submit Vendor Application <ArrowRight className="h-4 w-4" /></>}
              </Button>
            )}
          </div>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have a vendor account? <Link to="/vendor/login" className="font-semibold text-emerald-600 hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}