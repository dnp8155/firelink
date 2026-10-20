import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { PageHeader, SectionCard, KpiCard } from "@/components/ui-bits";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import { useToast } from "@/components/ui/use-toast";
import { useRole } from "@/lib/state/RoleContext";
import { Building2, User, Loader2, ShieldCheck, Mail, Phone, MapPin } from "lucide-react";

const EMPTY_ORG = { name: "", industry: "", contact_person: "", email: "", phone: "", gst_number: "", address: "", city: "" };

export default function Profile() {
  const { user, checkUserAuth } = useAuth();
  const { roleConfig } = useRole();
  const { toast } = useToast();
  const [contact, setContact] = useState({ phone: "", job_title: "", city: "" });
  const [org, setOrg] = useState(null);
  const [orgForm, setOrgForm] = useState(EMPTY_ORG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setContact({
      phone: user?.data?.phone || "",
      job_title: user?.data?.job_title || "",
      city: user?.data?.city || "",
    });
    (async () => {
      setLoading(true);
      if (user?.data?.organization_id) {
        try {
          const found = await base44.entities.Organization.get(user.data.organization_id);
          setOrg(found);
          setOrgForm({ ...EMPTY_ORG, ...found });
        } catch {
          setOrg(null);
        }
      }
      setLoading(false);
    })();
  }, [user?.id]);

  const saveContact = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await base44.auth.updateMe({ ...contact });
      await checkUserAuth();
      toast({ title: "Profile updated" });
    } catch (err) {
      toast({ title: "Could not update profile", description: err?.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const linkOrganization = async (record) => {
    await base44.auth.updateMe({ organization_id: record.id, organization_name: record.name });
    await checkUserAuth();
  };

  const createOrganization = async (e) => {
    e.preventDefault();
    if (!orgForm.name?.trim()) {
      toast({ title: "Organization name is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const created = await base44.entities.Organization.create({
        ...orgForm,
        name: orgForm.name.trim(),
        owner_id: user?.id || "",
        contact_person: orgForm.contact_person || user?.full_name || "",
        email: orgForm.email || user?.email || "",
      });
      await linkOrganization(created);
      setOrg(created);
      toast({ title: "Organization created and linked" });
    } catch (err) {
      toast({ title: "Could not create organization", description: err?.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const updateOrganization = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await base44.entities.Organization.update(org.id, orgForm);
      await linkOrganization(updated);
      setOrg(updated);
      toast({ title: "Organization updated" });
    } catch (err) {
      toast({ title: "Could not update organization", description: err?.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="Profile & Settings" subtitle="Your account details and organization profile." icon={User} />

      <div className="grid gap-5 lg:grid-cols-3">
        <SectionCard title="Account">
          <div className="space-y-3 px-5 py-4 text-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600"><User className="h-5 w-5" /></span>
              <div>
                <p className="font-semibold text-slate-900">{user?.full_name || "Your name"}</p>
                <p className="flex items-center gap-1 text-xs text-slate-500"><Mail className="h-3 w-3" /> {user?.email || "—"}</p>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
              <span className="text-xs text-slate-500">Active role</span>
              <StatusBadge status={roleConfig.label} tone="blue" />
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
              <span className="text-xs text-slate-500">Organization</span>
              <span className="text-xs font-medium text-slate-800">{user?.data?.organization_name || "Not linked"}</span>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Contact details">
          <form onSubmit={saveContact} className="space-y-3 px-5 py-4">
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} placeholder="+91 90000 00000" />
            </div>
            <div className="space-y-1.5">
              <Label>Job title</Label>
              <Input value={contact.job_title} onChange={(e) => setContact({ ...contact, job_title: e.target.value })} placeholder="Fire Safety Manager" />
            </div>
            <div className="space-y-1.5">
              <Label>City</Label>
              <Input value={contact.city} onChange={(e) => setContact({ ...contact, city: e.target.value })} />
            </div>
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save details"}</Button>
          </form>
        </SectionCard>

        <div className="lg:col-span-1">
          {loading ? (
            <SectionCard><div className="flex items-center justify-center py-16 text-slate-400"><Loader2 className="h-5 w-5 animate-spin" /></div></SectionCard>
          ) : org ? (
            <SectionCard title="Organization">
              <div className="space-y-3 px-5 py-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Building2 className="h-5 w-5" /></span>
                  <div>
                    <p className="font-semibold text-slate-900">{org.name}</p>
                    <p className="text-xs text-slate-500">{org.industry || "Industry not set"}</p>
                  </div>
                </div>
                <div className="space-y-1 text-xs text-slate-600">
                  {org.contact_person && <p className="flex items-center gap-1.5"><User className="h-3 w-3" /> {org.contact_person}</p>}
                  {org.phone && <p className="flex items-center gap-1.5"><Phone className="h-3 w-3" /> {org.phone}</p>}
                  {org.city && <p className="flex items-center gap-1.5"><MapPin className="h-3 w-3" /> {org.city}</p>}
                  <p className="flex items-center gap-1.5"><ShieldCheck className="h-3 w-3" /> Compliance score: {org.compliance_score ?? 0}%</p>
                </div>
              </div>
              <form onSubmit={updateOrganization} className="space-y-3 border-t border-slate-100 px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Edit organization</p>
                <div className="space-y-1.5">
                  <Label>Industry</Label>
                  <Input value={orgForm.industry || ""} onChange={(e) => setOrgForm({ ...orgForm, industry: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>GST number</Label>
                  <Input value={orgForm.gst_number || ""} onChange={(e) => setOrgForm({ ...orgForm, gst_number: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>City</Label>
                  <Input value={orgForm.city || ""} onChange={(e) => setOrgForm({ ...orgForm, city: e.target.value })} />
                </div>
                <Button type="submit" variant="outline" disabled={saving}>Update organization</Button>
              </form>
            </SectionCard>
          ) : (
            <SectionCard title="Create your organization">
              <form onSubmit={createOrganization} className="space-y-3 px-5 py-4">
                <p className="text-xs text-slate-500">
                  Linking an organization shares sites, assets, certificates and CAPA with your whole team.
                </p>
                <div className="space-y-1.5">
                  <Label>Organization name</Label>
                  <Input value={orgForm.name} onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })} placeholder="Patel Enterprises" />
                </div>
                <div className="space-y-1.5">
                  <Label>Industry</Label>
                  <Input value={orgForm.industry} onChange={(e) => setOrgForm({ ...orgForm, industry: e.target.value })} placeholder="Manufacturing" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Contact person</Label>
                    <Input value={orgForm.contact_person} onChange={(e) => setOrgForm({ ...orgForm, contact_person: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Phone</Label>
                    <Input value={orgForm.phone} onChange={(e) => setOrgForm({ ...orgForm, phone: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>City</Label>
                    <Input value={orgForm.city} onChange={(e) => setOrgForm({ ...orgForm, city: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>GST number</Label>
                    <Input value={orgForm.gst_number} onChange={(e) => setOrgForm({ ...orgForm, gst_number: e.target.value })} />
                  </div>
                </div>
                <Button type="submit" disabled={saving}>{saving ? "Creating…" : "Create organization"}</Button>
              </form>
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  );
}