import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";

// Required & optional verification documents for a vendor application
export const VENDOR_DOC_TYPES = [
  { key: "gst_certificate", label: "GST Certificate", required: true },
  { key: "pan", label: "PAN Card", required: true },
  { key: "company_registration", label: "Company Registration", required: true },
  { key: "address_proof", label: "Address Proof", required: true },
  { key: "bank_proof", label: "Bank Proof / Cancelled Cheque", required: true },
  { key: "signatory_id", label: "Authorized Signatory ID", required: true },
  { key: "msme_certificate", label: "MSME Certificate", required: false },
  { key: "manufacturer_authorization", label: "Manufacturer Authorization", required: false },
  { key: "iso_certificate", label: "ISO Certificate", required: false },
  { key: "product_certification", label: "Product Certifications", required: false },
  { key: "fire_safety_certification", label: "Fire & Safety Certification", required: false },
];

export function docLabel(type) {
  const d = VENDOR_DOC_TYPES.find((x) => x.key === type);
  return d ? d.label : (type || "").replace(/_/g, " ");
}

// Hook: resolves the current user's vendor record (by owner, staff membership, profile link, or email match)
export function useVendor() {
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const me = await base44.auth.me().catch(() => null);
      let v = null;
      if (me) {
        const byOwner = await base44.entities.Vendor.filter({ owner_id: me.id }, "-created_date", 5).catch(() => []);
        if (byOwner && byOwner.length) v = byOwner[0];
        const linkedId = me.data?.vendor_id || me.vendor_id;
        if (!v && linkedId) {
          v = await base44.entities.Vendor.get(linkedId).catch(() => null);
        }
        if (!v && me.email) {
          const byEmail = await base44.entities.Vendor.filter({ email: me.email }, "-created_date", 5).catch(() => []);
          if (byEmail && byEmail.length) v = byEmail[0];
        }
        // Vendor staff: resolve the parent vendor through the VendorStaff record
        let staffRole = null;
        if (!v && me.email) {
          const staff = await base44.entities.VendorStaff.filter({ email: me.email }, "-created_date", 20).catch(() => []);
          const rec = (staff || []).find((s) => s.status !== "inactive");
          if (rec) {
            staffRole = rec.staff_role || null;
            v = await base44.entities.Vendor.get(rec.vendor_id).catch(() => null);
          }
        }
        // Persist vendor_id + sub-role on the user record so tenant-scoped RLS rules apply
        if (v) {
          const linked2 = me.vendor_id || me.data?.vendor_id;
          const linkedRole = me.staff_role || me.data?.staff_role || null;
          if (linked2 !== v.id || !linkedRole) {
            base44.functions
              .invoke("sync_vendor_staff", {
                email: me.email,
                vendor_id: v.id,
                staff_role: staffRole || "VENDOR_ADMIN",
              })
              .catch(() => {});
          }
        }
      }
      setVendor(v);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  return { vendor, loading, reload: load };
}

// Profile completion score (0–100)
export function profileCompletion(vendor) {
  if (!vendor) return 0;
  const checks = [
    vendor.company_name, vendor.trade_name, vendor.business_type, vendor.registration_number,
    vendor.gst_number, vendor.pan_number, vendor.email, vendor.phone, vendor.address, vendor.city,
    (vendor.categories || []).length, (vendor.brands || []).length,
    (vendor.services_offered || []).length, (vendor.service_locations || []).length,
    vendor.bank_name, vendor.account_holder, vendor.account_number, vendor.ifsc_code,
    vendor.description, vendor.logo_url, vendor.website,
  ];
  const filled = checks.filter(Boolean).length;
  return Math.round((filled / checks.length) * 100);
}

export function missingProfileItems(vendor) {
  if (!vendor) return [];
  const items = [
    ["Trade Name", vendor.trade_name], ["Business Type", vendor.business_type],
    ["Registration Number", vendor.registration_number], ["GST Number", vendor.gst_number],
    ["PAN", vendor.pan_number], ["Website", vendor.website], ["Description", vendor.description],
    ["Logo", vendor.logo_url], ["Categories", (vendor.categories || []).length],
    ["Brands", (vendor.brands || []).length], ["Services Offered", (vendor.services_offered || []).length],
    ["Service Locations", (vendor.service_locations || []).length],
    ["Bank Name", vendor.bank_name], ["Account Holder", vendor.account_holder],
    ["Account Number", vendor.account_number], ["IFSC", vendor.ifsc_code],
  ];
  return items.filter(([, v]) => !v).map(([k]) => k);
}

// Lightweight audit trail for vendor-side critical actions
export async function logVendorAction(action, module, entityId, before, after) {
  try {
    const me = await base44.auth.me().catch(() => null);
    await base44.entities.AuditLog.create({
      user_name: (me && (me.full_name || me.email)) || "Vendor",
      user_id: (me && me.id) || "",
      action, module: module || "Vendor Portal",
      entity_id: entityId || "", before_value: before || "", after_value: after || "",
    });
  } catch { /* audit is best-effort */ }
}

export const VENDOR_STAGES = [
  { key: "submitted", label: "Application Submitted" },
  { key: "documents", label: "Documents Review" },
  { key: "verification", label: "Admin Verification" },
  { key: "approval", label: "Approval" },
  { key: "activation", label: "Marketplace Activation" },
];

export function stageIndex(status) {
  switch (status) {
    case "submitted": case "draft": return 0;
    case "documents_required": return 1;
    case "under_review": return 2;
    case "approved": return 4;
    case "rejected": case "suspended": return 2;
    default: return 0;
  }
}

// ---------------- Vendor staff roles & granular permissions ----------------
export const VENDOR_STAFF_ROLES = [
  { key: "VENDOR_ADMIN", label: "Vendor Admin", modules: ["*"], can: ["Full access to all vendor modules, team & settings"] },
  { key: "SALES_MANAGER", label: "Sales Manager", modules: ["dashboard", "rfqs", "quotations", "orders", "shipments", "customers", "notifications", "support"], can: ["Manage RFQs, quotations & orders", "View customers"] },
  { key: "PRODUCT_MANAGER", label: "Product Manager", modules: ["dashboard", "products", "analytics", "notifications"], can: ["Create, edit & submit products", "View analytics"] },
  { key: "INVENTORY_MANAGER", label: "Inventory Manager", modules: ["dashboard", "inventory", "warehouses", "notifications"], can: ["Manage inventory & warehouses"] },
  { key: "ORDER_MANAGER", label: "Order Manager", modules: ["dashboard", "orders", "shipments", "returns", "notifications"], can: ["Process orders, shipments & returns"] },
  { key: "SERVICE_MANAGER", label: "Service Manager", modules: ["dashboard", "services", "technicians", "notifications"], can: ["Manage service requests & technicians"] },
  { key: "FINANCE_USER", label: "Finance User", modules: ["dashboard", "payments", "settlements", "analytics"], can: ["View payments, settlements & analytics"] },
  { key: "VIEW_ONLY", label: "View Only", modules: ["dashboard", "analytics"], can: ["Read-only dashboards & reports"] },
];

export function canAccess(roleKey, moduleKey) {
  if (!moduleKey) return true;
  const role = VENDOR_STAFF_ROLES.find((r) => r.key === roleKey);
  if (!role) return true; // no staff record → vendor owner / full access
  return role.modules.includes("*") || role.modules.includes(moduleKey);
}

export function moduleForPath(path) {
  const seg = (path || "").replace("/vendor/", "").split("/")[0];
  const map = {
    dashboard: "dashboard", company: "company", verification: "verification",
    products: "products", inventory: "inventory", warehouses: "warehouses",
    rfqs: "rfqs", quotations: "quotations", orders: "orders", shipments: "shipments",
    returns: "returns", services: "services", "service-requests": "services",
    technicians: "technicians", customers: "customers", certificates: "certificates",
    documents: "documents", team: "team", payments: "payments", settlements: "settlements",
    analytics: "analytics", support: "support", notifications: "notifications", settings: "settings",
  };
  return map[seg] || "dashboard";
}

// Hook: resolves the current user's staff role within their vendor organization
export function useVendorStaff(vendor, user) {
  const [staffRole, setStaffRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    if (!vendor || !user) { setStaffRole(null); setLoading(false); return () => { alive = false; }; }
    if (vendor.owner_id === user.id || vendor.created_by_id === user.id) {
      setStaffRole("VENDOR_ADMIN");
      // Mirror the sub-role onto the user record so server-side rules allow vendor writes
      base44.functions
        .invoke("sync_vendor_staff", { email: user.email, vendor_id: vendor.id, staff_role: "VENDOR_ADMIN" })
        .catch(() => {});
      setLoading(false);
      return () => { alive = false; };
    }
    setLoading(true);
    base44.entities.VendorStaff.filter({ vendor_id: vendor.id }, "-created_date", 20)
      .then((list) => {
        if (!alive) return;
        const rec = (list || []).find((s) => s.email === user.email && s.status !== "inactive");
        setStaffRole(rec ? rec.staff_role : null);
        if (rec) {
          // Mirror the assigned sub-role onto the user record for server-side enforcement
          base44.functions
            .invoke("sync_vendor_staff", { email: user.email, vendor_id: vendor.id, staff_role: rec.staff_role })
            .catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [vendor && vendor.id, user && user.id]);

  return { staffRole, loading };
}