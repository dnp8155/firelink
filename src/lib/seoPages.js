// Central, India-focused SEO copy for FireLink.
//
// Public storefront pages set their own tags through <Seo /> — they are listed in
// SELF_MANAGED below and skipped here. This map supplies titles/descriptions for the
// authentication pages and marks the signed-in portals (customer, vendor, admin,
// technician, engineer) as noindex, so search engines index the storefront and the
// trust pages instead of thin, private screens.

export const SEO_BRAND = "FireLink";

export const INDIA_KEYWORDS = [
  "fire safety India",
  "fire safety equipment India",
  "fire extinguisher online India",
  "fire extinguisher price India",
  "fire alarm system India",
  "fire hydrant system India",
  "fire pump India",
  "fire fighting equipment India",
  "fire protection system India",
  "fire safety products India",
  "fire safety services India",
  "fire safety company India",
  "fire safety vendors India",
  "fire safety marketplace India",
  "AMC fire safety India",
  "fire audit India",
  "fire NOC India",
  "fire safety certificate India",
  "fire extinguisher refilling India",
  "buy fire extinguisher online India",
  "ISI certified fire equipment India",
  "best fire safety brands India",
];

export const INDIA_CITIES = [
  "Delhi", "Mumbai", "Bengaluru", "Hyderabad", "Chennai", "Kolkata", "Pune",
  "Ahmedabad", "Jaipur", "Lucknow", "Noida", "Gurugram", "Surat", "Indore",
  "Kochi", "Chandigarh", "Nagpur", "Coimbatore", "Vadodara", "Bhopal",
];

export const DEFAULT_KEYWORDS = INDIA_KEYWORDS.join(", ");

// One comma-separated keyword string: the page's own terms, the India-wide terms,
// plus city variants of the page's lead term (e.g. "Fire Extinguishers Delhi").
export function keywordList(...terms) {
  const own = terms
    .flat()
    .filter(Boolean)
    .map((t) => String(t).trim())
    .filter(Boolean);
  const lead = (own[0] || "fire safety").replace(/ India$/i, "");
  const cityTerms = INDIA_CITIES.slice(0, 8).map((city) => `${lead} ${city}`);
  return Array.from(new Set([...own, ...INDIA_KEYWORDS, ...cityTerms])).join(", ");
}

export function productKeywords(product = {}) {
  return keywordList(
    product.category ? `${product.category} India` : "fire safety equipment India",
    product.name,
    product.brand ? `${product.brand} fire safety equipment` : null,
    product.subcategory,
    product.fire_class ? `fire class ${product.fire_class} extinguisher` : null,
    "buy online in India",
    "price in India",
    "PAN India delivery"
  );
}

export function serviceKeywords(service = {}) {
  return keywordList(
    service.name ? `${service.name} India` : "fire safety services India",
    service.name,
    "fire safety service booking India",
    "certified fire safety engineers India",
    "AMC fire safety India"
  );
}

const NOINDEX = "noindex, nofollow";

// Authentication pages stay out of the index but still carry clear, keyword-aware copy.
const AUTH_SEO = {
  "/login": {
    title: "Sign In — FireLink Fire Safety Platform India",
    description: "Sign in to FireLink to manage fire safety orders, quotations, assets, AMC services, certificates and fire NOC compliance across India.",
    keywords: keywordList("FireLink login", "fire safety platform India", "fire safety account India"),
  },
  "/register": {
    title: "Create Your Free Account — FireLink India",
    description: "Create a free FireLink account to buy certified fire safety equipment, book services, track assets and manage fire NOC compliance anywhere in India.",
    keywords: keywordList("FireLink register", "fire safety account India", "buy fire safety equipment India"),
  },
  "/vendor/login": {
    title: "Vendor Sign In — Sell Fire Safety Products on FireLink",
    description: "Vendor sign in for FireLink — manage your fire safety catalogue, quotations, orders, deliveries and settlements across India.",
    keywords: keywordList("FireLink vendor login", "sell fire safety products India", "fire safety vendor portal India"),
  },
  "/vendor/register": {
    title: "Become a Fire Safety Vendor — FireLink India",
    description: "Register as a fire safety vendor on FireLink and reach buyers across India — list certified products and services, quote for enquiries and manage orders.",
    keywords: keywordList("fire safety vendor registration India", "sell fire extinguishers online India", "fire safety supplier India"),
  },
  "/forgot-password": {
    title: "Reset Your Password — FireLink India",
    description: "Reset the password for your FireLink fire safety account.",
    keywords: keywordList("FireLink password reset"),
  },
  "/reset-password": {
    title: "Set a New Password — FireLink India",
    description: "Choose a new password for your FireLink fire safety account.",
    keywords: keywordList("FireLink new password"),
  },
  "/select-role": {
    title: "Choose Your Role — FireLink India",
    description: "Choose how you use FireLink — buyer, vendor, technician or engineer.",
    keywords: keywordList("FireLink role selection"),
  },
};

// Signed-in screens: titled and kept out of the index.
const APP_SEO = {
  "/dashboard": "Customer Dashboard — Orders, Assets & Compliance | FireLink",
  "/cart": "Your Cart | FireLink",
  "/orders": "My Orders | FireLink",
  "/rfqs": "My Requests for Quotation | FireLink",
  "/assets": "Fire Safety Assets | FireLink",
  "/certificates": "Certificates & Fire NOC | FireLink",
  "/wishlist": "My Wishlist | FireLink",
  "/fire-noc": "Fire NOC Tracker | FireLink",
  "/compliance-calendar": "Fire Compliance Calendar | FireLink",
  "/renewals": "Renewal Center — Certificates & Fire NOC | FireLink",
  "/maintenance": "Maintenance & Service Requests | FireLink",
  "/notifications": "Notifications | FireLink",
  "/ai-assistant": "Fire Safety AI Assistant | FireLink",
  "/documents": "Documents | FireLink",
  "/support": "Support | FireLink",
  "/profile": "My Profile | FireLink",
  "/organization/dashboard": "Organization Dashboard | FireLink",
  "/sites": "Sites & Buildings | FireLink",
  "/compliance": "Compliance Overview | FireLink",
  "/capa": "CAPA — Corrective & Preventive Actions | FireLink",
  "/reports": "Compliance Reports | FireLink",
};

const PORTALS = [
  ["/vendor/", "Vendor Portal"],
  ["/customer/", "Customer Portal"],
  ["/organization/", "Organization Admin"],
  ["/technician/", "Technician Portal"],
  ["/engineering/", "Fire Engineering Suite"],
  ["/admin/", "Platform Admin Console"],
];

// Public pages that render their own <Seo /> — never overridden from here.
const SELF_MANAGED = ["/", "/about", "/contact", "/products", "/services", "/vendors", "/marketplace", "/verify"];

/**
 * SEO defaults for a route: an object for pages handled centrally, or null when the
 * page sets its own tags.
 */
export function seoForPath(pathname = "/") {
  const path = pathname.replace(/\/+$/, "") || "/";

  if (AUTH_SEO[path]) return { ...AUTH_SEO[path], robots: NOINDEX };
  if (APP_SEO[path]) return { title: APP_SEO[path], robots: NOINDEX };

  if (path.startsWith("/verify/")) {
    return {
      title: "Verify a Fire Safety Certificate or Asset — FireLink",
      description: "Check the authenticity of a fire safety certificate, fire NOC or asset registered on FireLink India.",
      keywords: keywordList("fire safety certificate verification India", "fire NOC verification India", "asset QR verification India"),
      robots: NOINDEX,
    };
  }

  if (SELF_MANAGED.includes(path) || SELF_MANAGED.some((p) => p !== "/" && path.startsWith(`${p}/`))) {
    return null;
  }

  const portal = PORTALS.find(([prefix]) => path.startsWith(prefix));
  return {
    title: portal ? `${portal[1]} — FireLink` : `${SEO_BRAND} — Fire Safety Platform for India`,
    robots: NOINDEX,
  };
}