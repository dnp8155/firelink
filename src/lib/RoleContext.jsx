// Canonical role context lives in lib/state; re-exported here so that all
// migrated FireLink modules (which import from "@/lib/RoleContext") share the
// single provider instance mounted in App.jsx.
export { RoleProvider, useRole } from "@/lib/state/RoleContext";