import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthGate } from "@/hooks/useAuthGate";
import { Button } from "@/components/ui/button";
import { Search, Heart, ShoppingCart, Menu, X, LayoutDashboard, Store } from "lucide-react";
import { LogoFull } from "@/components/Logo";

const NAV = [
  { label: "Products", to: "/products" },
  { label: "Services", to: "/services" },
  { label: "Solutions", to: "/#solutions" },
  { label: "Compliance", to: "/#compliance" },
  { label: "Resources", to: "/#resources" },
  { label: "Verify", to: "/verify" },
  { label: "About Us", to: "/about" },
  { label: "Contact", to: "/contact" },
];

export default function PublicHeader() {
  const { authed } = useAuthGate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  const submitSearch = (e) => {
    e.preventDefault();
    if (!q.trim()) return;
    setMenuOpen(false);
    navigate(`/products?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex shrink-0 items-center gap-3">
          <LogoFull className="h-11" />
          <span className="hidden text-[10px] font-medium uppercase tracking-widest text-slate-400 sm:block">
            Fire & Safety
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((n) => {
            const cls = "rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900";
            return n.to.includes("#") ? (
              <a key={n.label} href={n.to} className={cls}>{n.label}</a>
            ) : (
              <Link key={n.label} to={n.to} className={cls}>{n.label}</Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1.5">
          <form onSubmit={submitSearch} className="hidden md:block">
            <div className="flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 transition focus-within:border-primary/40 focus-within:bg-white">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search products…"
                className="w-32 bg-transparent pl-2 text-sm text-slate-700 outline-none lg:w-44"
              />
            </div>
          </form>
          <Link
            to="/wishlist"
            title="Wishlist"
            className="hidden h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 sm:flex"
          >
            <Heart className="h-4 w-4" />
          </Link>
          <Link
            to="/cart"
            title="Cart"
            className="hidden h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 sm:flex"
          >
            <ShoppingCart className="h-4 w-4" />
          </Link>

          {authed === true && (
            <Button asChild size="sm" className="ml-1 font-semibold">
              <Link to="/select-role"><LayoutDashboard className="h-4 w-4" /> Dashboard</Link>
            </Button>
          )}
          {authed === false && (
            <div className="hidden items-center gap-1.5 sm:flex">
              <Link to="/vendor/register" className="hidden text-xs font-medium text-slate-500 transition hover:text-slate-900 sm:block">Become a Vendor</Link>
              <Button asChild variant="ghost" size="sm" className="font-medium">
                <Link to="/login">Login</Link>
              </Button>
              <Button asChild size="sm" className="font-semibold">
                <Link to="/register">Create Account</Link>
              </Button>
            </div>
          )}

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-50 lg:hidden"
            aria-label="Menu"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-slate-100 bg-white px-4 py-4 lg:hidden">
          <form onSubmit={submitSearch} className="mb-3">
            <div className="flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-2">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search products…"
                className="w-full bg-transparent pl-2 text-sm text-slate-700 outline-none"
              />
            </div>
          </form>
          <nav className="grid gap-1">
            {NAV.map((n) => {
              const cls = "rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50";
              return n.to.includes("#") ? (
                <a key={n.label} href={n.to} onClick={() => setMenuOpen(false)} className={cls}>{n.label}</a>
              ) : (
                <Link key={n.label} to={n.to} onClick={() => setMenuOpen(false)} className={cls}>{n.label}</Link>
              );
            })}
          </nav>
          {authed === false && (
            <>
              <Link
                to="/vendor/register"
                onClick={() => setMenuOpen(false)}
                className="mt-3 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                <Store className="h-4 w-4 text-primary" /> Become a Vendor
              </Link>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button asChild variant="outline" size="sm"><Link to="/login">Login</Link></Button>
                <Button asChild size="sm"><Link to="/register">Create Account</Link></Button>
              </div>
            </>
          )}
        </div>
      )}
    </header>
  );
}