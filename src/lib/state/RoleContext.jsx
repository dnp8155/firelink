import React, { createContext, useContext, useState } from "react";
import { ROLES } from "@/lib/roles";

const RoleContext = createContext(null);

const STORAGE_KEY = "fsc_active_role";

export function RoleProvider({ children }) {
  const [activeRole, setActiveRoleState] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || "customer";
  });

  const setActiveRole = (role) => {
    setActiveRoleState(role);
    localStorage.setItem(STORAGE_KEY, role);
  };

  const roleConfig = ROLES[activeRole] || ROLES.customer;

  return (
    <RoleContext.Provider value={{ activeRole, setActiveRole, roleConfig }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
}