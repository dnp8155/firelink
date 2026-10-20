// Canonical cart context lives in lib/state; re-exported here so that all
// migrated FireLink modules (which import from "@/lib/CartContext") share the
// single provider instance mounted in App.jsx.
export { CartProvider, useCart } from "@/lib/state/CartContext";