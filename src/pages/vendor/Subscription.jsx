import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useVendor } from "@/lib/vendor";
import { PageHeader } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Check, Crown, Sparkles, Loader2, Gem, ShieldCheck } from "lucide-react";

const TIERS = [
  {
    tier: "free",
    name: "Free",
    price: 0,
    duration_months: 12,
    product_limit: 20,
    service_limit: 5,
    features: ["20 Products", "5 Services", "Basic Listing"],
    search_priority: 0,
    highlight_color: "slate",
    popular: false,
    display_order: 1,
  },
  {
    tier: "silver",
    name: "Silver",
    price: 4999,
    duration_months: 12,
    product_limit: -1,
    service_limit: -1,
    features: ["Unlimited Products", "Unlimited Services", "Priority Search", "Certificate"],
    search_priority: 5,
    highlight_color: "slate",
    popular: true,
    display_order: 2,
  },
  {
    tier: "gold",
    name: "Gold",
    price: 9999,
    duration_months: 12,
    product_limit: -1,
    service_limit: -1,
    features: ["Top Ranking", "Lead Priority", "Unlimited Quotation", "Analytics", "Ads Free"],
    search_priority: 10,
    highlight_color: "amber",
    popular: false,
    display_order: 3,
  },
];

const TIER_ICON = { free: ShieldCheck, silver: Gem, gold: Crown };
const TIER_STYLE = {
  free: { ring: "border-slate-200", badge: "bg-slate-100 text-slate-600", btn: "border-slate-300 text-slate-700 hover:bg-slate-50" },
  silver: { ring: "border-slate-300 ring-2 ring-slate-200", badge: "bg-slate-200 text-slate-700", btn: "bg-slate-800 text-white hover:bg-slate-900" },
  gold: { ring: "border-amber-300 ring-2 ring-amber-200", badge: "bg-amber-100 text-amber-700", btn: "bg-fire-gradient text-white" },
};

export default function Subscription() {
  const { toast } = useToast();
  const { vendor, loading: vendorLoading, reload: reloadVendor } = useVendor();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await base44.entities.VendorPlan.filter({}, { sort: "display_order", limit: 10 });
        const list = res?.items || res || [];
        setPlans(list.length ? list : TIERS);
      } catch (e) {
        setPlans(TIERS);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const upgrade = async (plan) => {
    if (!vendor || plan.tier === vendor.subscription_tier) return;
    if (plan.price > 0) {
      toast({ title: "Payment required", description: `Upgrade to ${plan.name} (₹${plan.price.toLocaleString()}/yr). Payment integration coming soon — contact admin to activate.` });
      return;
    }
    setUpgrading(plan.tier);
    try {
      const expires = new Date();
      expires.setFullYear(expires.getFullYear() + 1);
      await base44.entities.Vendor.update(vendor.id, {
        subscription_tier: plan.tier,
        subscription_expires: expires.toISOString().split("T")[0],
      });
      toast({ title: `Switched to ${plan.name} plan` });
      reloadVendor();
    } catch (e) {
      toast({ title: "Upgrade failed", description: e.message, variant: "destructive" });
    } finally {
      setUpgrading(null);
    }
  };

  if (loading || vendorLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const currentTier = vendor?.subscription_tier || "free";

  return (
    <div>
      <PageHeader
        title="Subscription & Membership"
        subtitle="Upgrade your plan to unlock more products, services and visibility."
        icon={Crown}
        actions={
          vendor && (
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm">
              <span className="text-slate-500">Current:</span>
              <span className="font-semibold capitalize text-slate-900">{currentTier}</span>
            </div>
          )
        }
      />

      {vendor?.subscription_expires && (
        <div className="mb-5 flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-700">
          <Sparkles className="h-4 w-4" />
          Your {currentTier} plan is active until {vendor.subscription_expires}.
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {[...plans].sort((a, b) => (a.display_order || 0) - (b.display_order || 0)).map((plan) => {
          const Icon = TIER_ICON[plan.tier] || ShieldCheck;
          const style = TIER_STYLE[plan.tier] || TIER_STYLE.free;
          const isCurrent = plan.tier === currentTier;
          return (
            <div
              key={plan.id || plan.tier}
              className={`relative flex flex-col rounded-2xl border bg-white p-6 shadow-sm transition hover:shadow-md ${style.ring}`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-fire-gradient px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow">
                  Most Popular
                </span>
              )}
              <div className="flex items-center gap-3">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${style.badge}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{plan.name}</h3>
                  <p className="text-xs text-slate-500">{plan.duration_months} months</p>
                </div>
              </div>

              <div className="mt-4">
                <span className="text-3xl font-bold text-slate-900">₹{(plan.price || 0).toLocaleString()}</span>
                <span className="text-sm text-slate-400">/year</span>
              </div>

              <ul className="mt-5 flex-1 space-y-2.5">
                {[...new Set([
                  ...(plan.features || []),
                  ...(plan.product_limit === -1 ? ["Unlimited Products"] : []),
                  ...(plan.service_limit === -1 ? ["Unlimited Services"] : []),
                ])].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-700">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    {f}
                  </li>
                ))}
              </ul>

              <div className="mt-6">
                {isCurrent ? (
                  <Button disabled className="w-full bg-emerald-600 text-white">
                    <Check className="h-4 w-4" /> Current Plan
                  </Button>
                ) : (
                  <Button
                    onClick={() => upgrade(plan)}
                    disabled={upgrading === plan.tier}
                    variant={plan.price > 0 ? "default" : "outline"}
                    className={`w-full ${style.btn}`}
                  >
                    {upgrading === plan.tier ? <Loader2 className="h-4 w-4 animate-spin" /> : plan.price > 0 ? `Upgrade to ${plan.name}` : "Choose Free"}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}