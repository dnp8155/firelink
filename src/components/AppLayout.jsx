import React, { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useRole } from "@/lib/state/RoleContext";
import { ROLE_NAV, ROLES } from "@/lib/roles";
import { getIcon } from "@/lib/icons";
import { useAuth } from "@/lib/AuthContext";
import { useLabelT } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import {
  Menu, X, Bell, ChevronDown, LogOut, ChevronRight, User,
} from "lucide-react";
import { LogoFull } from "@/components/Logo";
import AdminApprovalPopup from "@/components/realtime/AdminApprovalPopup";
import LanguageToggle from "@/components/LanguageToggle";
import GlobalSearch from "@/components/GlobalSearch";

function Sidebar({ open, onClose }) {
  const { activeRole, roleConfig } = useRole();
  const location = useLocation();
  const nav = ROLE_NAV[activeRole] || [];
  const labelT = useLabelT();

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" onClick={onClose} />}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-[#F9F9F9] transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center gap-2.5 border-b border-slate-100 px-5">
          <div className="leading-tight">
            <LogoFull className="h-9" />
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Fire Safety Platform</p>
          </div>
          <button className="ml-auto lg:hidden" onClick={onClose}>
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        <div className="px-3 py-3">
          <div className={cn("flex items-center gap-2.5 rounded-xl bg-gradient-to-r px-3 py-2.5 text-white shadow-sm", roleConfig.color)}>
            {React.createElement(getIcon(roleConfig.icon), { className: "h-4 w-4" })}
            <span className="text-xs font-semibold">{roleConfig.label}</span>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
          {nav.map((item) => {
            const Icon = getIcon(item.icon);
            const active = location.pathname === item.path || (item.path !== "/dashboard" && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                  active ? "bg-rose-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <Icon className={cn("h-4 w-4", active ? "text-white" : "text-slate-400")} />
                {labelT(item.label)}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-100 p-3">
          <Link to="/profile" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
            <User className="h-4 w-4 text-slate-400" />
            Profile & Settings
          </Link>
        </div>
      </aside>
    </>
  );
}

function Breadcrumbs() {
  const location = useLocation();
  const { activeRole } = useRole();
  const nav = ROLE_NAV[activeRole] || [];
  const segments = location.pathname.split("/").filter(Boolean);
  const crumbs = [];
  let current = "";
  for (const seg of segments) {
    current += "/" + seg;
    const match = nav.find((n) => n.path === current);
    crumbs.push({ label: match ? match.label : seg.replace(/-/g, " "), path: current });
  }
  return (
    <nav className="flex items-center gap-1.5 text-xs text-slate-500">
      <Link to={ROLES[activeRole].home} className="capitalize hover:text-slate-900">Home</Link>
      {crumbs.map((c, i) => (
        <span key={c.path} className="flex items-center gap-1.5">
          <ChevronRight className="h-3 w-3 text-slate-300" />
          <span className={cn("capitalize", i === crumbs.length - 1 ? "font-medium text-slate-700" : "hover:text-slate-900")}>{c.label}</span>
        </span>
      ))}
    </nav>
  );
}

function RoleSwitcher() {
  const { activeRole, setActiveRole } = useRole();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const roleConfig = ROLES[activeRole];
  // Platform admin roles are only offered to real platform admins (server-side role)
  const roleEntries = Object.entries(ROLES).filter(
    ([key]) => !["platform_admin", "super_admin"].includes(key) || user?.role === "admin"
  );
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm hover:bg-slate-50"
      >
        {React.createElement(getIcon(roleConfig.icon), { className: "h-4 w-4 text-slate-500" })}
        <span className="hidden font-medium text-slate-700 md:inline">{roleConfig.label}</span>
        <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-20 mt-1 w-60 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
            <p className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Switch Role</p>
            {roleEntries.map(([key, r]) => (
              <button
                key={key}
                onClick={() => { setActiveRole(key); navigate(r.home); setOpen(false); }}
                className={cn("flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-slate-50", key === activeRole && "bg-orange-50 text-orange-700")}
              >
                {React.createElement(getIcon(r.icon), { className: "h-4 w-4 text-slate-400" })}
                {r.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  // The vendor portal and the role selector render their own full-page chrome —
  // don't double-wrap them with the AppLayout sidebar/header.
  if (location.pathname.startsWith("/vendor/") || location.pathname === "/select-role") {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white px-4 sm:px-6">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5 text-slate-600" />
          </button>
          <div className="ml-auto flex items-center gap-1.5">
            <GlobalSearch className="mr-1 w-auto sm:w-48 lg:w-60" />
            <Link to="/notifications" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" title="Notifications">
              <Bell className="h-5 w-5" />
            </Link>
            <LanguageToggle />
            <div className="mx-1 h-6 w-px bg-slate-200" />
            <RoleSwitcher />
            <button
              onClick={() => logout()}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              title="Log out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="px-4 pt-4 sm:px-6">
          <Breadcrumbs />
        </div>

        <main key={location.pathname} className="animate-in fade-in px-4 py-5 sm:px-6">
          <Outlet />
        </main>
      </div>

      {/* Real-time approval popup for admins */}
      <AdminApprovalPopup />
    </div>
  );
}