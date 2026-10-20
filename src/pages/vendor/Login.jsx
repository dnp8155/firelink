import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Flame, Mail, Lock, Loader2, Eye, EyeOff, Store, ShieldCheck, ArrowRight } from "lucide-react";
import { LogoFull } from "@/components/Logo";

const FEATURES = [
  { icon: Store, text: "Sell to verified enterprise buyers" },
  { icon: ShieldCheck, text: "Manage products, orders & shipments" },
  { icon: ArrowRight, text: "Respond to RFQs and grow revenue" },
];

export default function VendorLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !/\S+@\S+\.\S+/.test(email)) { setError("Please enter a valid email address."); return; }
    if (!password) { setError("Please enter your password."); return; }
    setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      localStorage.setItem("fsc_active_role", "vendor");
      window.location.href = "/vendor/dashboard";
    } catch (err) {
      setError("Email or password is incorrect. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Left brand panel */}
      <div className="relative hidden w-2/5 flex-col justify-between overflow-hidden bg-slate-900 p-12 lg:flex">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-900" />
        <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-emerald-600/10 blur-3xl" />

        <Link to="/" className="relative flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-fire-gradient text-white shadow-lg"><Flame className="h-5 w-5" /></span>
          <span className="font-display text-xl font-extrabold tracking-tight text-white">FIRE<span className="text-amber-400">LINK</span></span>
        </Link>

        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white backdrop-blur">
            <Store className="h-3 w-3" /> Vendor Portal
          </span>
          <h1 className="font-display mt-4 text-3xl font-extrabold leading-tight text-white">
            Your marketplace, sales and service —<br />all in one workspace.
          </h1>
          <div className="mt-8 space-y-3">
            {FEATURES.map((f) => (
              <div key={f.text} className="flex items-center gap-2.5 text-sm text-slate-200">
                <f.icon className="h-4 w-4 text-emerald-400" /> {f.text}
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-xs text-slate-500">The Vendor Operating System of Fire & Safety Connect</p>
      </div>

      {/* Right form */}
      <div className="flex w-full items-center justify-center px-4 py-8 lg:w-3/5">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-8 flex items-center justify-center lg:hidden">
            <LogoFull className="h-11" />
          </Link>

          <h2 className="font-display text-2xl font-bold text-slate-900">Vendor Sign In</h2>
          <p className="mt-1 text-sm text-slate-500">Sign in to your vendor workspace.</p>

          {error && <div className="mt-4 rounded-lg bg-rose-50 px-3.5 py-2.5 text-sm font-medium text-rose-700 ring-1 ring-rose-200">{error}</div>}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="vemail">Work Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input id="vemail" type="email" autoFocus placeholder="sales@company.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 pl-10" />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="vpassword">Password</Label>
                <Link to="/forgot-password" className="text-xs font-medium text-primary hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input id="vpassword" type={showPwd ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 pl-10 pr-10" />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" aria-label="Toggle password">
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="h-12 w-full bg-emerald-600 font-semibold hover:bg-emerald-700" disabled={loading}>
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</> : "Sign In to Vendor Portal"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            New vendor?{" "}
            <Link to="/vendor/register" className="font-semibold text-emerald-600 hover:underline">Register your company</Link>
          </p>
          <p className="mt-2 text-center text-sm text-slate-500">
            Buying on FireLink?{" "}
            <Link to="/login" className="font-semibold text-primary hover:underline">Customer login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}