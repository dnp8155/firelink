import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuthGate } from "@/hooks/useAuthGate";
import { Home, ShoppingBag, Wrench, ShoppingCart, User } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { label: "Home", to: "/", icon: Home },
  { label: "Shop", to: "/products", icon: ShoppingBag },
  { label: "Services", to: "/services", icon: Wrench },
  { label: "Cart", to: "/cart", icon: ShoppingCart },
  { label: "Account", to: "/select-role", authTo: "/login", icon: User },
];

export default function MobileBottomNav() {
  const { pathname } = useLocation();
  const { authed } = useAuthGate();

  return (
    <nav
      className="fixed inset-x-3 bottom-3 z-50 rounded-2xl border border-slate-200/70 bg-white/90 shadow-lg shadow-slate-900/10 backdrop-blur-md lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="grid grid-cols-5 py-1.5">
        {ITEMS.map((it) => {
          const Icon = it.icon;
          const to = it.authTo && !authed ? it.authTo : it.to;
          const active = pathname === it.to;
          return (
            <Link
              key={it.label}
              to={to}
              className={cn(
                "mx-1 flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[9px] font-semibold transition",
                active ? "bg-primary/10 text-primary" : "text-slate-500"
              )}
            >
              <Icon className="h-[18px] w-[18px]" />
              {it.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}