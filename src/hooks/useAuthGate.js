import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { stashPendingAction } from "@/lib/pendingAction";

/**
 * Auth gate for public pages: lets anonymous visitors browse freely and only
 * asks for login when a personal action (cart, quote, wishlist, booking) is attempted.
 * The intended action is stashed so it can auto-complete after login.
 */
export function useAuthGate() {
  const [authed, setAuthed] = useState(null);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    base44.auth.isAuthenticated().then(setAuthed).catch(() => setAuthed(false));
  }, []);

  const gate = ({ action, payload, message: msg, run }) => {
    if (authed) {
      if (run) run();
      return true;
    }
    if (action) stashPendingAction({ type: action, payload });
    setMessage(msg || "Sign in or create an account to continue.");
    setOpen(true);
    return false;
  };

  return { authed, open, setOpen, message, gate };
}