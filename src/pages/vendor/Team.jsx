import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useList } from "@/hooks/useList";
import { useVendor, logVendorAction, VENDOR_STAFF_ROLES } from "@/lib/vendor";
import { PageHeader, SectionCard, EmptyState } from "@/components/ui-bits";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { UserPlus, Loader2, ShieldCheck, Send, Trash2, Power } from "lucide-react";
import { cn } from "@/lib/utils";

const roleLabel = (key) => (VENDOR_STAFF_ROLES.find((r) => r.key === key) || {}).label || (key || "").replace(/_/g, " ");

export default function Team() {
  const { vendor } = useVendor();
  const { toast } = useToast();
  const staff = useList("VendorStaff", {}, "-created_date", 100);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("SALES_MANAGER");
  const [inviting, setInviting] = useState(false);

  const mine = staff.data.filter((s) => vendor && s.vendor_id === vendor.id);

  const invite = async (e) => {
    e.preventDefault();
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      toast({ title: "Please enter a valid email.", variant: "destructive" });
      return;
    }
    if (mine.some((s) => s.email === email && s.status !== "inactive")) {
      toast({ title: "This email is already on your team.", variant: "destructive" });
      return;
    }
    setInviting(true);
    try {
      await base44.users.inviteUser(email, "user");
      await base44.entities.VendorStaff.create({
        vendor_id: vendor.id, vendor_name: vendor.company_name,
        email, staff_role: role, status: "active",
      });
      await base44.functions
        .invoke("sync_vendor_staff", { email, vendor_id: vendor.id, staff_role: role })
        .catch(() => {});
      await logVendorAction("Team invite", "Vendor Team", email, "", role);
      toast({ title: "Invitation sent", description: `${email} has been invited as ${roleLabel(role)}. They'll see only their permitted modules.` });
      setEmail("");
      staff.reload();
    } catch (err) {
      toast({ title: "Invite failed", description: err.message, variant: "destructive" });
    } finally {
      setInviting(false);
    }
  };

  const changeRole = async (s, newRole) => {
    try {
      await base44.entities.VendorStaff.update(s.id, { staff_role: newRole });
      await base44.functions
        .invoke("sync_vendor_staff", { email: s.email, vendor_id: vendor.id, staff_role: newRole })
        .catch(() => {});
      toast({ title: "Role updated", description: `${s.email} is now ${roleLabel(newRole)}.` });
      staff.reload();
    } catch (e) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    }
  };

  const toggleStatus = async (s) => {
    try {
      const nextStatus = s.status === "active" ? "inactive" : "active";
      await base44.entities.VendorStaff.update(s.id, { status: nextStatus });
      await base44.functions
        .invoke("sync_vendor_staff", {
          email: s.email,
          vendor_id: vendor.id,
          staff_role: nextStatus === "active" ? s.staff_role : "",
        })
        .catch(() => {});
      staff.reload();
    } catch (e) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    }
  };

  const remove = async (s) => {
    try {
      await base44.entities.VendorStaff.delete(s.id);
      await base44.functions
        .invoke("sync_vendor_staff", { email: s.email, vendor_id: vendor.id, staff_role: "" })
        .catch(() => {});
      toast({ title: "Member removed", description: `${s.email} no longer has vendor portal access.` });
      staff.reload();
    } catch (e) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div>
      <PageHeader title="Team" icon={UserPlus} subtitle="Invite staff and control exactly which vendor modules each role can access." />

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard title="Invite Team Member" className="lg:col-span-1">
          <form onSubmit={invite} className="space-y-4 p-5">
            <div>
              <Label>Work Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="colleague@company.com" className="mt-1.5 h-10" />
            </div>
            <div>
              <Label>Staff Role</Label>
              <select value={role} onChange={(e) => setRole(e.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm">
                {VENDOR_STAFF_ROLES.filter((r) => r.key !== "VENDOR_ADMIN").map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
              </select>
            </div>
            <Button type="submit" disabled={inviting} className="w-full bg-emerald-600 hover:bg-emerald-700">
              {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send Invitation
            </Button>
            <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-slate-400">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Only the Vendor Admin can manage the team. Permissions are enforced across the portal — members see only their permitted modules.
            </p>
          </form>
        </SectionCard>

        <div className="space-y-4 lg:col-span-2">
          <SectionCard title={`Team Members (${mine.length})`}>
            {staff.loading ? (
              <div className="space-y-2 p-5">{[0, 1].map((i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />)}</div>
            ) : mine.length === 0 ? (
              <EmptyState icon={UserPlus} title="No team members yet" description="Invite staff above — each one signs in at the vendor login and sees only their permitted modules." />
            ) : (
              <div className="divide-y divide-slate-50">
                {mine.map((s) => (
                  <div key={s.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800">{s.email}</p>
                      <p className="text-[11px] text-slate-400">Added {s.created_date ? new Date(s.created_date).toLocaleDateString() : "—"}</p>
                    </div>
                    <StatusBadge status={s.status || "active"} tone={s.status === "inactive" ? "gray" : "green"} />
                    <select
                      value={s.staff_role}
                      onChange={(e) => changeRole(s, e.target.value)}
                      className="h-9 rounded-lg border border-slate-200 px-2.5 text-xs"
                    >
                      {VENDOR_STAFF_ROLES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
                    </select>
                    <button onClick={() => toggleStatus(s)} title={s.status === "inactive" ? "Reactivate" : "Deactivate"} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
                      <Power className="h-4 w-4" />
                    </button>
                    <button onClick={() => remove(s)} title="Remove" className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Staff Roles & Permissions">
            <div className="grid gap-3 p-5 sm:grid-cols-2">
              {VENDOR_STAFF_ROLES.map((r) => (
                <div key={r.key} className={cn("rounded-xl border p-4", role === r.key ? "border-emerald-300 bg-emerald-50/40" : "border-slate-200")}>
                  <p className="text-sm font-bold text-slate-800">{r.label}</p>
                  <ul className="mt-2 space-y-1">
                    {r.can.map((c) => (
                      <li key={c} className="flex items-start gap-1.5 text-xs text-slate-500">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-300" /> {c}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}