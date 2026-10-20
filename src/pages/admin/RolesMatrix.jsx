import React, { useState } from "react";
import { PageHeader, SectionCard } from "@/components/ui-bits";
import { ROLES, PERMISSIONS, ROLE_NAV } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { ShoppingBag, Building2, Store, Wrench, Calculator, ShieldCheck, Crown, Check } from "lucide-react";

const ROLE_ICONS = { customer: ShoppingBag, org_admin: Building2, vendor: Store, vendor_admin: Store, technician: Wrench, engineer: Calculator, platform_admin: ShieldCheck, super_admin: Crown };
const ROLE_KEYS = Object.keys(ROLES);
const MODULES = Array.from(new Set(ROLE_KEYS.flatMap((r) => Object.keys(PERMISSIONS[r] || {})))).sort();
const title = (s) => String(s).replace(/_/g, " ");

export default function RolesMatrix() {
  const [selected, setSelected] = useState("platform_admin");
  const role = ROLES[selected] || ROLES.customer;
  const RoleIcon = ROLE_ICONS[selected] || ShieldCheck;
  const permissions = PERMISSIONS[selected] || {};
  const nav = ROLE_NAV[selected] || [];

  return (
    <div>
      <PageHeader title="Roles & Permissions" icon={ShieldCheck} subtitle="Who can see and change what across the platform." />

      <SectionCard title="Permission matrix" className="mb-4">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="sticky left-0 z-10 bg-white px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Module</th>
                {ROLE_KEYS.map((r) => (
                  <th key={r} className="px-3 py-3 text-center text-xs font-semibold text-slate-500">{ROLES[r].label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MODULES.map((m) => (
                <tr key={m} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                  <td className="sticky left-0 z-10 bg-white px-5 py-2.5 text-left text-sm capitalize text-slate-700">{title(m)}</td>
                  {ROLE_KEYS.map((r) => {
                    const actions = (PERMISSIONS[r] || {})[m];
                    return (
                      <td key={r} className="px-3 py-2.5 text-center">
                        {actions ? (
                          <span
                            title={`${ROLES[r].label}: ${actions.map(title).join(", ")}`}
                            className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700"
                          >
                            <Check className="h-3 w-3" />{actions.length}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <div className="mb-4 flex flex-wrap gap-2">
        {ROLE_KEYS.map((r) => {
          const Icon = ROLE_ICONS[r] || ShieldCheck;
          return (
            <button
              key={r}
              onClick={() => setSelected(r)}
              className={cn(
                "flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition",
                selected === r ? "border-primary/30 bg-primary/10 text-primary" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              )}
            >
              <Icon className="h-4 w-4" />
              {ROLES[r].label}
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard title={`${role.label} access`}>
          <div className="space-y-3 p-5">
            <div className="flex items-center gap-3">
              <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white", role.color)}>
                <RoleIcon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">{role.label}</p>
                <p className="text-xs text-slate-500">Starts at {role.home}</p>
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
              <p><span className="font-medium text-slate-800">{Object.keys(permissions).length}</span> modules · <span className="font-medium text-slate-800">{nav.length}</span> navigation screens</p>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Allowed actions" className="lg:col-span-2">
          {Object.keys(permissions).length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-400">No module permissions configured for this role.</p>
          ) : (
            <div className="divide-y divide-slate-50">
              {Object.entries(permissions).map(([m, actions]) => (
                <div key={m} className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center">
                  <p className="w-40 shrink-0 text-sm font-medium capitalize text-slate-800">{title(m)}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {actions.map((a) => (
                      <span key={a} className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium capitalize text-slate-600">{title(a)}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      <p className="mt-4 text-xs text-slate-400">Roles, navigation and permissions come from the platform role configuration, so this matrix always reflects live access rules.</p>
    </div>
  );
}