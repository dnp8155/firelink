import React, { useState, useEffect } from "react";
import { Outlet, Link, NavLink, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useVendor, profileCompletion, useVendorStaff, canAccess, moduleForPath } from "@/lib/vendor";
import { useLabelT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import Logo from "@/components/Logo";
import GlobalSearch from "@/components/GlobalSearch";
import VendorOrderPopup from "@/components/realtime/VendorOrderPopup";
import LanguageToggle from "@/components/LanguageToggle";
import {
  Bell, LayoutDashboard, Building2, ShieldCheck, Package, Boxes, Warehouse,
  FileText, ReceiptText, Truck, PackageCheck, Undo2, Wrench, Users, UserPlus, Award, FolderOpen, ClipboardList,
  CreditCard, IndianRupee, BarChart3, LifeBuoy, Settings, Menu, X, LogOut, AlertTriangle,
  CheckCircle2, Clock, ChevronDown,
} from "lucide-react";

const NAV_GROUPS = [
  {
    title: "Overview", items: [
      { key: "dashboard", label: "Dashboard", path: "/vendor/dashboard", icon: LayoutDashboard },
      { key: "company", label: "Company Profile", path: "/vendor/company", icon: Building2 },
      { key: "verification", label: "Verification", path: "/vendor/verification", icon: ShieldCheck },
    ],
  },
  {
    title: "Catalog & Stock", items: [
      { key: "products", label: "Products", path: "/vendor/products", icon: Package },
      { key: "inventory", label: "Inventory", path: "/vendor/inventory", icon: Boxes },
      { key: "warehouses", label: "Warehouses", path: "/vendor/warehouses", icon: Warehouse },
    ],
  },
  {
    title: "Sales", items: [
      { key: "rfqs", label: "RFQs", path: "/vendor/rfqs", icon: FileText },
      { key: "quotations", label: "Quotations", path: "/vendor/quotations", icon: ReceiptText },
      { key: "orders", label: "Orders", path: "/vendor/orders", icon: Truck },
      { key: "shipments", label: "Shipments", path: "/vendor/shipments", icon: PackageCheck },
      { key: "returns", label: "Returns", path: "/vendor/returns", icon: Undo2 },
    ],
  },
  {
    title: "Services & Business", items: [
      { key: "services", label: "Service Catalog", path: "/vendor/services", icon: ClipboardList },
      { key: "services", label: "Service Requests", path: "/vendor/service-requests", icon: Wrench },
      { key: "technicians", label: "Technicians", path: "/vendor/technicians", icon: Users },
      { key: "customers", label: "Customers", path: "/vendor/customers", icon: Users },
      { key: "certificates", label: "Certificates", path: "/vendor/certificates", icon: Award },
      { key: "documents", label: "Documents", path: "/vendor/documents", icon: FolderOpen },
      { key: "team", label: "Team", path: "/vendor/team", icon: UserPlus },
    ],
  },
  {
    title: "Finance", items: [
      { label: "Payments", path: "/vendor/payments", icon: CreditCard },
      { label: "Settlements", path: "/vendor/settlements", icon: IndianRupee },
      { label: "Analytics", path: "/vendor/analytics", icon: BarChart3 },
    ],
  },
  {
    title: "Support", items: [
      { label: "Support", path: "/vendor/support", icon: LifeBuoy },
      { label: "Notifications", path: "/vendor/notifications", icon: Bell },
      { label: "Settings", path: "/vendor/settings", icon: Settings },
    ],
  },
];

const MOBILE_NAV = [
  { label: "Home", path: "/vendor/dashboard", icon: LayoutDashboard },
  { label: "Products", path: "/vendor/products", icon: Package },
  { label: "Orders", path: "/vendor/orders", icon: Truck },
  { label: "RFQs", path: "/vendor/rfqs", icon: FileText },
];

const STATUS_BANNERS = {
  draft: {
    tone: "amber",
    icon: Clock,
    title: "Your vendor application is incomplete.",
    text: "Complete your company profile and upload the required documents, then submit for review.",
    cta: { label: "Complete Verification", to: "/vendor/verification" },
  },
  submitted: {
    tone: "blue",
    icon: Clock,
    title: "Your vendor application is under review.",
    text: "Our team is verifying your details and documents. This usually takes 2–3 business days.",
  },
  documents_required: {
    tone: "amber",
    icon: AlertTriangle,
    title: "Action required: additional documents needed.",
    text: "The admin team has requested documents or replacements. Open the Verification Center to respond.",
    cta: { label: "Open Verification Center", to: "/vendor/verification" },
  },
  under_review: {
    tone: "blue",
    icon: Clock,
    title: "Your vendor application is under review.",
    text: "Admin verification is in progress. You'll be notified once a decision is made.",
  },
  rejected: {
    tone: "red",
    icon: AlertTriangle,
    title: "Your vendor application was rejected.",
    text: "Review the admin remarks in the Verification Center, update your details and re-apply via support.",
    cta: { label: "Contact Support", to: "/vendor/support" },
  },
  suspended: {
    tone: "red",
    icon: AlertTriangle,
    title: "Your vendor account is currently suspended.",
    text: "Selling operations are locked. Contact FireLink support to resolve this.",
    cta: { label: "Contact Support", to: "/vendor/support" },
  },
};

const BANNER_STYLES = {
  blue: "bg-blue-50 text-blue-900 ring-blue-200",
  amber: "bg-amber-50 text-amber-900 ring-amber-200",
  red: "bg-rose-50 text-rose-900 ring-rose-200",
};

export default function VendorLayout() {
  const { user } = useAuth();
  const { vendor, loading } = useVendor();
  const { staffRole } = useVendorStaff(vendor, user);
  const location = useLocation();
  const activeModule = moduleForPath(location.pathname);
  const permitted = !staffRole || canAccess(staffRole, activeModule);
  const labelT = useLabelT();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    base44.entities.AppNotification.filter({ user_id: user.id }, "-created_date", 50)
      .then((list) => { if (alive) setUnread((list || []).filter((n) => !n.read).length); })
      .catch(() => {});
    return () => { alive = false; };
  }, [user]);

  const status = vendor ? vendor.approval_status : null;
  const banner = status && status !== "approved" ? STATUS_BANNERS[status] : null;

  const logout = () => {
    base44.auth.logout("/vendor/login");
  };

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2.5 border-b border-slate-800/60 px-5">
        <Logo className="h-12 w-12" />
        <div className="leading-tight">
          <p className="font-display text-base font-extrabold tracking-tight text-white">FIRE<span className="text-amber-400">LINK</span></p>
          <p className="text-[10px] font-medium uppercase tracking-wider text-emerald-400">Vendor Portal</p>
        </div>
        <button className="ml-auto text-slate-400 lg:hidden" onClick={() => setMenuOpen(false)}><X className="h-5 w-5" /></button>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
        {NAV_GROUPS.map((g) => (
          <div key={g.title} className={g.items.some((item) => canAccess(staffRole, item.key)) ? "" : "hidden"}>
            <p className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">{g.title}</p>
            <div className="space-y-0.5">
              {g.items.filter((item) => canAccess(staffRole, item.key)).map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition",
                      isActive ? "bg-emerald-500/15 text-emerald-300" : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                    )
                  }
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{labelT(item.label)}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-800/60 p-4">
        {vendor && (
          <div className="mb-3 rounded-xl bg-slate-800/60 p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-300">{vendor.company_name}</p>
              <span className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                status === "approved" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
              )}>
                {status === "approved" ? "Active" : (status || "").replace(/_/g, " ")}
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-700">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400" style={{ width: `${profileCompletion(vendor)}%` }} />
            </div>
            <p className="mt-1.5 text-[10px] text-slate-500">Profile {profileCompletion(vendor)}% complete</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100/70">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 bg-slate-900 lg:block">{sidebarContent}</aside>

      {/* Mobile drawer */}
      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-slate-900/60 lg:hidden" onClick={() => setMenuOpen(false)} />
          <aside className="fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 lg:hidden">{sidebarContent}</aside>
        </>
      )}

      {/* Main column */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur lg:px-6">
          <button className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => setMenuOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <GlobalSearch className="max-w-md flex-1 sm:max-w-xs" />
          <div className="ml-auto flex items-center gap-1.5">
            <Link to="/vendor/support" className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700" title="Help & Support">
              <LifeBuoy className="h-5 w-5" />
            </Link>
            <Link to="/vendor/notifications" className="relative rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700" title="Notifications">
              <Bell className="h-5 w-5" />
              {unread > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>
            <LanguageToggle />
            <div className="relative">
              <button
                onClick={() => setProfileOpen((o) => !o)}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-slate-100"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                  {(user?.full_name || user?.email || "V").charAt(0).toUpperCase()}
                </span>
                <span className="hidden text-left sm:block">
                  <p className="text-xs font-semibold text-slate-800 leading-tight">{vendor?.company_name || user?.full_name || "Vendor"}</p>
                  <p className="text-[10px] text-slate-500 leading-tight">{user?.email}</p>
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>
              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                    <Link to="/vendor/settings" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-3.5 py-2 text-sm text-slate-700 hover:bg-slate-50">
                      <Settings className="h-4 w-4" /> Settings
                    </Link>
                    <button onClick={logout} className="flex w-full items-center gap-2 px-3.5 py-2 text-sm text-rose-600 hover:bg-rose-50">
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Status banner */}
        {banner && !loading && (
          <div className={cn("flex flex-wrap items-center gap-3 px-4 py-2.5 ring-1 ring-inset lg:px-6", BANNER_STYLES[banner.tone])}>
            <banner.icon className="h-4 w-4 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{banner.title} <span className="font-normal opacity-80">— {banner.text}</span></p>
            </div>
            {banner.cta && (
              <Link to={banner.cta.to} className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800">
                {banner.cta.label}
              </Link>
            )}
          </div>
        )}

        {/* Page content */}
        <main className="px-4 py-6 pb-24 lg:px-6 lg:pb-8">
          {permitted ? <Outlet /> : (
            <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-500"><AlertTriangle className="h-6 w-6" /></div>
              <h3 className="text-sm font-bold text-slate-800">Access restricted</h3>
              <p className="mt-1 text-sm text-slate-500">
                Your staff role doesn't include the <span className="font-semibold">{activeModule}</span> module. Contact your vendor admin for access.
              </p>
            </div>
          )}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-slate-200 bg-white/95 backdrop-blur lg:hidden">
        {MOBILE_NAV.map((n) => (
          <NavLink key={n.path} to={n.path}
            className={({ isActive }) => cn("flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium", isActive ? "text-emerald-600" : "text-slate-500")}
          >
            <n.icon className="h-5 w-5" />
            {n.label}
          </NavLink>
        ))}
        <button onClick={() => setMenuOpen(true)} className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium text-slate-500">
          <Menu className="h-5 w-5" />
          More
        </button>
      </nav>

      {/* Real-time incoming order popup (Swiggy/Zomato style) */}
      <VendorOrderPopup />
    </div>
  );
}