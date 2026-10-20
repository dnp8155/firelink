import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { PageHeader, SectionCard } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { Save, User, Building2, Bell, ShieldCheck, ArrowRight } from "lucide-react";

const PREFS = [
  ["order", "Order & shipment updates"],
  ["compliance", "Compliance & certificate alerts"],
  ["service", "Maintenance & service reminders"],
  ["marketing", "Product updates & offers"],
];

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({ phone: "", designation: "", company_name: "", gst_number: "", industry: "", city: "" });
  const [prefs, setPrefs] = useState({ order: true, compliance: true, service: true, marketing: false });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me();
        setForm((f) => ({ ...f, phone: me?.phone || "", designation: me?.designation || "", company_name: me?.company_name || "", gst_number: me?.gst_number || "", industry: me?.industry || "", city: me?.city || "" }));
        setPrefs((p) => ({ ...p, ...(me?.notif_prefs || {}) }));
      } catch {}
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe({ ...form, notif_prefs: prefs });
      toast({ title: "Settings saved", description: "Your preferences have been updated." });
    } catch (e) {
      toast({ title: "Could not save", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Settings" subtitle="Manage your profile, company details and notification preferences." icon={ShieldCheck} />

      <div className="space-y-4">
        <SectionCard title="Personal Information">
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input value={user?.full_name || ""} disabled />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={user?.email || ""} disabled />
            </div>
            <div className="space-y-1.5">
              <Label>Mobile Number</Label>
              <Input value={form.phone} onChange={set("phone")} placeholder="+91 98765 43210" />
            </div>
            <div className="space-y-1.5">
              <Label>Designation</Label>
              <Input value={form.designation} onChange={set("designation")} placeholder="e.g. Facility Manager" />
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Company Information">
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Company Name</Label>
              <Input value={form.company_name} onChange={set("company_name")} placeholder="e.g. Patel Enterprises" />
            </div>
            <div className="space-y-1.5">
              <Label>GST Number</Label>
              <Input value={form.gst_number} onChange={set("gst_number")} placeholder="27AAAAA0000A1Z5" />
            </div>
            <div className="space-y-1.5">
              <Label>Industry</Label>
              <Input value={form.industry} onChange={set("industry")} placeholder="e.g. Manufacturing" />
            </div>
            <div className="space-y-1.5">
              <Label>City</Label>
              <Input value={form.city} onChange={set("city")} placeholder="e.g. Ahmedabad" />
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Notification Preferences">
          <div className="space-y-4 p-5">
            {PREFS.map(([key, label]) => (
              <label key={key} className="flex items-center justify-between text-sm font-medium text-slate-700">
                {label}
                <Switch checked={!!prefs[key]} onCheckedChange={(v) => setPrefs({ ...prefs, [key]: v })} />
              </label>
            ))}
          </div>
        </SectionCard>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link to="/forgot-password" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900">
            <ShieldCheck className="h-4 w-4" /> Change password <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Button onClick={save} disabled={saving} className="font-semibold">
            <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}