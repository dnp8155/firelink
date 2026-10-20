// Role-aware index for the global search palette (⌘K).
// Each source searches one entity on the server — a simple case-insensitive
// regex on the fields people actually type — and knows where a hit opens.
// Sources are grouped per role so a search only queries what that role can see
// (row-level security still applies on top of this).

const escapeRegex = (value) => String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const like = (term) => ({ $regex: escapeRegex(term), $options: "i" });

const rupees = (value) => (value ? `₹${Number(value).toLocaleString("en-IN")}` : "");

const join = (...parts) => parts.filter(Boolean).join(" · ");

const productsSource = (pathFn, filter) => ({
  group: "Products", entity: "Product", icon: "Package",
  query: (term) => ({
    ...(filter || {}),
    $or: [{ name: like(term) }, { brand: like(term) }, { category: like(term) }, { sku: like(term) }],
  }),
  options: { limit: 4, fields: ["name", "brand", "category", "price", "image_url"] },
  title: (r) => r.name,
  subtitle: (r) => join(r.brand, r.category, rupees(r.price)),
  image: (r) => r.image_url,
  path: pathFn,
});

const ordersSource = (pathFn) => ({
  group: "Orders", entity: "Order", icon: "Truck",
  query: (term) => ({ $or: [{ order_number: like(term) }, { customer_name: like(term) }, { vendor_name: like(term) }] }),
  options: { limit: 4, fields: ["order_number", "customer_name", "vendor_name", "total", "status"] },
  title: (r) => r.order_number,
  subtitle: (r) => join(r.customer_name, r.vendor_name, r.status, rupees(r.total)),
  path: pathFn,
});

const assetsSource = (pathFn) => ({
  group: "Assets", entity: "Asset", icon: "Boxes",
  query: (term) => ({
    $or: [{ asset_code: like(term) }, { name: like(term) }, { site_name: like(term) }, { serial_number: like(term) }],
  }),
  options: { limit: 4, fields: ["asset_code", "name", "site_name", "condition", "next_inspection_date"] },
  title: (r) => `${r.asset_code} · ${r.name}`,
  subtitle: (r) => join(r.site_name, r.condition, r.next_inspection_date ? `next ${r.next_inspection_date}` : ""),
  path: pathFn,
});

const certificatesSource = (pathFn) => ({
  group: "Certificates", entity: "Certificate", icon: "Award",
  query: (term) => ({
    $or: [{ certificate_number: like(term) }, { title: like(term) }, { organization_name: like(term) }],
  }),
  options: { limit: 4, fields: ["certificate_number", "title", "organization_name", "status", "expiry_date"] },
  title: (r) => r.title || r.certificate_number,
  subtitle: (r) => join(r.certificate_number, r.organization_name, r.status),
  path: pathFn,
});

const serviceRequestsSource = (pathFn) => ({
  group: "Service requests", entity: "ServiceRequest", icon: "ClipboardList",
  query: (term) => ({
    $or: [{ request_number: like(term) }, { service_type: like(term) }, { asset_name: like(term) }, { site_name: like(term) }],
  }),
  options: { limit: 4, fields: ["request_number", "service_type", "asset_name", "site_name", "status"] },
  title: (r) => join(r.request_number || "Service request", r.service_type),
  subtitle: (r) => join(r.asset_name, r.site_name, r.status),
  path: pathFn,
});

const sitesSource = (pathFn) => ({
  group: "Sites", entity: "Site", icon: "MapPin",
  query: (term) => ({ $or: [{ name: like(term) }, { city: like(term) }, { address: like(term) }] }),
  options: { limit: 4, fields: ["name", "city", "state", "floors"] },
  title: (r) => r.name,
  subtitle: (r) => join(r.city, r.state),
  path: pathFn,
});

const nocSource = (pathFn) => ({
  group: "Fire NOC", entity: "NOC", icon: "Flame",
  query: (term) => ({ $or: [{ noc_number: like(term) }, { site_name: like(term) }, { authority: like(term) }] }),
  options: { limit: 4, fields: ["noc_number", "site_name", "authority", "status", "expiry_date"] },
  title: (r) => r.noc_number,
  subtitle: (r) => join(r.site_name, r.authority, r.status),
  path: pathFn,
});

const capaSource = (pathFn) => ({
  group: "CAPA", entity: "CAPA", icon: "AlertTriangle",
  query: (term) => ({ $or: [{ capa_number: like(term) }, { finding: like(term) }, { asset_name: like(term) }] }),
  options: { limit: 4, fields: ["capa_number", "finding", "severity", "status"] },
  title: (r) => r.capa_number,
  subtitle: (r) => join(r.severity, r.status, r.finding),
  path: pathFn,
});

const rfqsSource = (pathFn) => ({
  group: "RFQs", entity: "RFQ", icon: "FileText",
  query: (term) => ({ $or: [{ rfq_number: like(term) }, { title: like(term) }, { customer_name: like(term) }] }),
  options: { limit: 4, fields: ["rfq_number", "title", "customer_name", "status"] },
  title: (r) => join(r.rfq_number, r.title),
  subtitle: (r) => join(r.customer_name, r.status),
  path: pathFn,
});

const projectsSource = (pathFn) => ({
  group: "Engineering projects", entity: "EngineeringProject", icon: "FolderKanban",
  query: (term) => ({
    $or: [{ name: like(term) }, { client_name: like(term) }, { site_name: like(term) }, { city: like(term) }],
  }),
  options: { limit: 4, fields: ["name", "client_name", "site_name", "city", "status"] },
  title: (r) => r.name,
  subtitle: (r) => join(r.client_name, r.site_name, r.status),
  path: pathFn,
});

const vendorsSource = (pathFn) => ({
  group: "Vendors", entity: "Vendor", icon: "Store",
  query: (term) => ({ $or: [{ company_name: like(term) }, { trade_name: like(term) }, { city: like(term) }] }),
  options: { limit: 4, fields: ["company_name", "city", "business_category", "approval_status", "logo_url"] },
  title: (r) => r.company_name,
  subtitle: (r) => join(r.city, r.business_category, r.approval_status),
  image: (r) => r.logo_url,
  path: pathFn,
});

const organizationsSource = (pathFn) => ({
  group: "Organizations", entity: "Organization", icon: "Building2",
  query: (term) => ({ $or: [{ name: like(term) }, { city: like(term) }, { industry: like(term) }] }),
  options: { limit: 4, fields: ["name", "industry", "city", "plan"] },
  title: (r) => r.name,
  subtitle: (r) => join(r.industry, r.city, r.plan),
  path: pathFn,
});

const ADMIN_SOURCES = [
  vendorsSource(() => "/admin/vendors"),
  productsSource(() => "/admin/product-approvals"),
  ordersSource(() => "/admin/orders"),
  organizationsSource(() => "/admin/organizations"),
  serviceRequestsSource(() => "/admin/dashboard"),
  certificatesSource(() => "/admin/certificate-verification"),
];

const VENDOR_SOURCES = [
  productsSource(() => "/vendor/products"),
  ordersSource(() => "/vendor/orders"),
  rfqsSource(() => "/vendor/rfqs"),
  serviceRequestsSource(() => "/vendor/service-requests"),
  certificatesSource(() => "/vendor/certificates"),
];

export const SEARCH_SOURCES = {
  customer: [
    productsSource((r) => `/customer/marketplace/${r.id}`, { approval_status: "approved" }),
    ordersSource((r) => `/customer/orders/${r.id}`),
    assetsSource((r) => `/customer/assets/${r.id}`),
    certificatesSource(() => "/customer/certificates"),
    serviceRequestsSource(() => "/customer/service-requests"),
    {
      group: "Services", entity: "Service", icon: "Wrench",
      query: (term) => ({
        approval_status: "approved",
        $or: [{ name: like(term) }, { category: like(term) }, { service_type: like(term) }],
      }),
      options: { limit: 4, fields: ["name", "slug", "category", "price"] },
      title: (r) => r.name,
      subtitle: (r) => join(r.category, r.service_type, rupees(r.price)),
      path: (r) => `/services/${r.slug || r.id}`,
    },
  ],
  org_admin: [
    assetsSource(() => "/assets"),
    certificatesSource(() => "/certificates"),
    nocSource(() => "/fire-noc"),
    sitesSource(() => "/sites"),
    capaSource(() => "/capa"),
    ordersSource(() => "/orders"),
  ],
  vendor: VENDOR_SOURCES,
  vendor_admin: VENDOR_SOURCES,
  technician: [
    assetsSource(() => "/technician/inspections"),
    serviceRequestsSource(() => "/technician/dashboard"),
    certificatesSource(() => "/certificates"),
  ],
  engineer: [
    projectsSource(() => "/engineering/projects"),
    assetsSource(() => "/assets"),
    sitesSource(() => "/sites"),
    certificatesSource(() => "/certificates"),
  ],
  platform_admin: ADMIN_SOURCES,
  super_admin: ADMIN_SOURCES,
};