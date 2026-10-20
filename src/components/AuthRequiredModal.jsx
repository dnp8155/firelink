import React from "react";
import { Link } from "react-router-dom";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LogIn, UserPlus, ArrowRight } from "lucide-react";
import Logo from "@/components/Logo";

export default function AuthRequiredModal({ open, onClose, message }) {
  const here = window.location.pathname + window.location.search;
  const to = (path) => `${path}?returnTo=${encodeURIComponent(here)}`;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md overflow-hidden p-0">
        <div className="h-1.5 bg-primary" />
        <div className="p-6">
          <Logo className="mb-4 h-12 w-12 shrink-0 rounded-none" />
          <DialogHeader className="space-y-1.5 text-left">
            <DialogTitle className="font-display text-xl font-bold text-slate-900">Create your free account</DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              {message || "Sign in or create an account to continue."}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 space-y-2.5">
            <Button asChild className="h-11 w-full text-sm font-semibold">
              <Link to={to("/login")}><LogIn className="h-4 w-4" /> Login</Link>
            </Button>
            <Button asChild variant="outline" className="h-11 w-full text-sm font-semibold">
              <Link to={to("/register")}><UserPlus className="h-4 w-4" /> Create Account</Link>
            </Button>
          </div>
          <button
            onClick={onClose}
            className="mt-4 flex w-full items-center justify-center gap-1 text-sm font-medium text-slate-500 transition hover:text-slate-800"
          >
            Continue Browsing <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}