import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useVendor, logVendorAction } from "@/lib/vendor";
import { PageHeader, SectionCard } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Settings as SettingsIcon, Save, Loader2, Bell, Mail, Lock, Landmark, FileCheck } from "lucide-react";

const NOTIF_EVENTS = [
  ["New RFQ received", true],
  ["New order received", true],
  ["Order cancellation", true],
  ["Return request", true],
  ["Product approval result", true],
  ["Payment & settlement", true],
  ["Document expiry reminders", true],
  ["Support responses", true],
];

export default function Settings() {
  const { vendor, reload } = useVendor();
  const { toast } = useToast();
  const [bank, setBank] = useState({ bank_name: "", account_holder: "", account_number: "", ifsc_code: "" });
  const [tax, setTax] = useState({ gst_number: "", pan_number: "", msme_number: "" });
  const [notifs, setNotifs] = useState(NOTIF_EVENTS.map(([, v]) => v));
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (vendor) {
      setBank({ bank_name: vendor.bank_name || "", account_holder: vendor.account_holder || "", account_number: vendor.account_number || "", ifsc_code: vendor.ifsc_code || "" });
      setTax({ gst_number: vendor.gst_number || "", pan_number: vendor.pan_number || "", msme_number: vendor.msme_number || "" });
    }
  }, [vendor]);

  const save = async () => {
    setSaving(true);
    try {
      await base44.entities.Vendor.update(vendor.id, { ...bank, ...tax });
      await logVendorAction("Settings update", "Vendor Settings", vendor.company_name, "", "banking/tax updated");
      toast({ title: "Settings saved" });
      reload();
    } catch (e) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const sendReset = async () => {
    setSending(true);
    try {
      const me = await base44.auth.me();
      await base44.auth.resetPasswordRequest(me.email);
      toast({ title: "Password reset email sent", description: "Check your inbox to change your password." });
    } catch (e) {
      toast({ title: "Could not send email", description: e.message, variant: "destructive" });
    } finally { setSending(false); }
  };

  if (!vendor) return <SectionCard><p className="p-8 text-center text-sm text-slate-500">No vendor profile found.</p></SectionCard>;

  return (
    <div>
      <PageHeader title="Vendor Settings" icon={SettingsIcon} subtitle="Banking, tax, notifications and security for your vendor workspace."
        actions={
          <Button onClick={save} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Changes
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard title="Banking & Settlements">
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            {[
              ["bank_name", "Bank Name", bank, setBank],
              ["account_holder", "Account Holder", bank, setBank],
              ["account_number", "Account Number", bank, setBank],
              ["ifsc_code", "IFSC Code", bank, setBank],
            ].map(([k, label, state, setter]) => (
              <div key={k}>
                <Label><Landmark className="mr-1 inline h-3 w-3" />{label}</Label>
                <Input value={state[k]} onChange={(e) => setter({ ...state, [k]: e.target.value })} className="mt-1.5 h-10" />
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Tax Information">
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            {[
              ["gst_number", "GST Number", tax, setTax],
              ["pan_number", "PAN", tax, setTax],
              ["msme_number", "MSME Number", tax, setTax],
            ].map(([k, label, state, setter]) => (
              <div key={k}>
                <Label><FileCheck className="mr-1 inline h-3 w-3" />{label}</Label>
                <Input value={state[k]} onChange={(e) => setter({ ...state, [k]: e.target.value })} className="mt-1.5 h-10" />
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Notifications">
          <div className="space-y-2 p-5">
            {NOTIF_EVENTS.map(([label], i) => (
              <label key={label} className="flex items-center justify-between rounded-lg px-1 py-1.5">
                <span className="flex items-center gap-2 text-sm text-slate-700">
                  <Bell className="h-3.5 w-3.5 text-slate-400" /> {label}
                </span>
                <input
                  type="checkbox"
                  checked={notifs[i]}
                  onChange={() => setNotifs(notifs.map((n, j) => (j === i ? !n : n)))}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
              </label>
            ))}
            <p className="pt-1 text-[11px] text-slate-400">In-app notifications are always available. Email alerts follow these preferences.</p>
          </div>
        </SectionCard>

        <SectionCard title="Security">
          <div className="space-y-3 p-5">
            <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold text-slate-800"><Lock className="h-4 w-4 text-slate-400" /> Change Password</p>
                <p className="mt-0.5 text-xs text-slate-500">We'll email a secure reset link to your login email.</p>
              </div>
              <Button variant="outline" size="sm" onClick={sendReset} disabled={sending}>
                {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />} Send Email
              </Button>
            </div>
            <div className="rounded-xl bg-slate-50 p-4 text-xs text-slate-500">
              Your data is isolated to your vendor organization. Sessions are managed by the FireLink platform — signing out from the profile menu revokes this device's session.
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}