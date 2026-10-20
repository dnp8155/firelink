import React from "react";
import { Outlet, Navigate } from "react-router-dom";
import { useRole } from "@/lib/state/RoleContext";
import { useAuth } from "@/lib/AuthContext";
import { ROLES } from "@/lib/roles";

// Layout route that only renders child routes for the given roles.
// Platform admin roles (platform_admin / super_admin) are additionally
// verified against the SERVER-side user record — a client-side role
// switch alone must never unlock admin areas.
const PLATFORM_ROLES = ["platform_admin", "super_admin"];

export default function RoleGate({ allowed = [] }) {
  const { activeRole } = useRole();
  const { user } = useAuth();
  const isPlatformAdmin = user?.role === "admin";

  const effectiveAllowed = allowed.filter(
    (r) => !PLATFORM_ROLES.includes(r) || isPlatformAdmin
  );

  if (effectiveAllowed.includes(activeRole)) return <Outlet />;
  return <Navigate to={ROLES[activeRole]?.home || "/dashboard"} replace />;
}