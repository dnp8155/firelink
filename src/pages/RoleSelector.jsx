import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { useRole } from "@/lib/state/RoleContext";
import { ROLES } from "@/lib/roles";
import RoleOptionCard from "@/components/app/RoleOptionCard";
import { LogoFull } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { ArrowRight, LogOut, ShieldCheck } from "lucide-react";

const HINTS = {
  customer: "Buy equipment, track your assets, certificates and compliance.",
  org_admin: "Run sites, assets, compliance, CAPA and reports for your organization.",
  vendor: "Sell products and services, manage orders, RFQs and quotations.",
  vendor_admin: "Full vendor control — team, inventory, finance and settlements.",
  technician: "Your assigned jobs, QR scans and inspection checklists.",
  engineer: "Design projects, fire load and hydraulic calculations, BOQs and reports.",
  platform_admin: "Approve vendors and listings, run orders, support and payouts.",
  super_admin: "System health, roles, integrations, feature flags and revenue.",
};

export default function RoleSelector() {
  const { user, logout } = useAuth();
  const { activeRole, setActiveRole } = useRole();
  const navigate = useNavigate();

  // Platform admin workspaces are only offered to real platform admins.
  const entries = Object.entries(ROLES).filter(
    ([key]) => !["platform_admin", "super_admin"].includes(key) || user?.role === "admin"
  );
  const current = ROLES[activeRole] || ROLES.customer;

  const choose = (key) => {
    setActiveRole(key);
    navigate(ROLES[key].home);
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-5 py-4">
          <LogoFull className="h-10" />
          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Fire Safety Platform</p>
          <button
            onClick={() => logout()}
            className="ml-auto flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            <LogOut className="h-3.5 w-3.5" /> Log out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-10">
        <p className="text-xs font-semibold uppercase tracking-wider text-rose-600">Choose your workspace</p>
        <h1 className="mt-2 font-heading text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {user?.full_name ? `Welcome, ${user.full_name}` : "Welcome to FireLink"}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
          One sign-in, many workspaces. Pick the role you want to work in — the screens, data and actions follow your
          choice, and you can switch anytime from the header.
        </p>
        {user?.email && <p className="mt-1 text-xs text-slate-400">Signed in as {user.email}</p>}

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {entries.map(([key, r]) => (
            <RoleOptionCard
              key={key}
              roleKey={key}
              label={r.label}
              icon={r.icon}
              color={r.color}
              hint={HINTS[key]}
              active={key === activeRole}
              onSelect={choose}
            />
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-600">Continue where you left off</p>
          <Button className="ml-auto" onClick={() => navigate(current.home)}>
            Go to {current.label} <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {user?.role === "admin" && (
          <p className="mt-4 flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5" /> Platform admin workspaces are available for your account.
          </p>
        )}
      </main>
    </div>
  );
}