// Structured data (JSON-LD) builders for FireLink.
//
// Search engines and AI answer engines use this to understand who FireLink is,
// what it sells, where it operates (India) and which questions its pages answer.
import { SEO_ORIGIN, SEO_SITE, SEO_IMAGE, DEFAULT_DESCRIPTION } from "@/components/Seo";

export const ORG_ID = `${SEO_ORIGIN}/#organization`;
export const SITE_ID = `${SEO_ORIGIN}/#website`;
export const ORG_NAME = "FireLink";
export const ORG_BUILDER = "BrightLoop Technology";

const absolute = (path = "/") => `${SEO_ORIGIN}${path}`;

// Site-wide identity: the organisation and the website (rendered on every page).
export function organizationSchema() {
  return {
    "@type": ["Organization", "OnlineStore"],
    "@id": ORG_ID,
    name: ORG_NAME,
    url: absolute("/"),
    logo: SEO_IMAGE,
    image: SEO_IMAGE,
    description: DEFAULT_DESCRIPTION,
    founder: { "@type": "Organization", name: ORG_BUILDER },
    areaServed: { "@type": "Country", name: "India" },
    knowsLanguage: ["en-IN", "hi-IN"],
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        url: absolute("/contact"),
        availableLanguage: ["en", "hi"],
        areaServed: "IN",
      },
    ],
  };
}

export function websiteSchema() {
  return {
    "@type": "WebSite",
    "@id": SITE_ID,
    url: absolute("/"),
    name: SEO_SITE,
    inLanguage: "en-IN",
    publisher: { "@id": ORG_ID },
  };
}

export function siteGraph() {
  return graph(organizationSchema(), websiteSchema());
}

// Combines several schema nodes into one JSON-LD block for a page.
export function graph(...nodes) {
  return { "@context": "https://schema.org", "@graph": nodes.flat().filter(Boolean) };
}

export function breadcrumbSchema(items = []) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.filter(Boolean).map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.path ? absolute(item.path) : undefined,
    })),
  };
}

export function webPageSchema({ type = "WebPage", name, description, path }) {
  return {
    "@type": type,
    name,
    description,
    url: absolute(path),
    inLanguage: "en-IN",
    isPartOf: { "@id": SITE_ID },
    about: { "@id": ORG_ID },
  };
}

export function itemListSchema({ name, path, items = [], type = "ListItem" }) {
  return {
    "@type": "ItemList",
    name,
    url: absolute(path),
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      "@type": type,
      position: index + 1,
      ...(item.path ? { url: absolute(item.path) } : {}),
      name: item.name,
    })),
  };
}

// Answer-engine content: the visible FAQ block on a page, in schema form.
export function faqSchema(faqs = []) {
  return {
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };
}

function productProperties(product = {}) {
  return [
    ["Fire class", product.fire_class],
    ["Extinguishing agent", product.extinguishing_agent],
    ["Capacity", product.capacity],
    ["Operating pressure", product.operating_pressure],
    ["Discharge range", product.discharge_range],
    ["Temperature range", product.temperature_range],
    ["Installation type", product.installation_type],
    ["Application area", product.application_area],
    ["Applicable standards", product.applicable_standards],
    ["Warranty (months)", product.warranty_months || null],
    ["Country of origin", product.country_of_origin],
    ["HSN code", product.hsn_code],
  ]
    .filter(([, value]) => value)
    .map(([name, value]) => ({ "@type": "PropertyValue", name, value: String(value) }));
}

export function productSchema(product = {}, path) {
  const url = absolute(path);
  const inStock = Number(product.stock) > 0;

  return {
    "@type": "Product",
    "@id": `${url}#product`,
    name: product.name,
    sku: product.sku,
    category: product.category,
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    manufacturer: product.manufacturer ? { "@type": "Organization", name: product.manufacturer } : undefined,
    image: product.image_url ? [product.image_url] : undefined,
    description:
      product.description ||
      `${product.name} — ${product.category || "fire safety equipment"} available across India from a verified FireLink vendor.`,
    offers: {
      "@type": "Offer",
      url,
      price: product.price,
      priceCurrency: "INR",
      availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: product.vendor_name ? { "@type": "Organization", name: product.vendor_name } : undefined,
    },
    aggregateRating: product.reviews_count
      ? { "@type": "AggregateRating", ratingValue: product.rating || 0, reviewCount: product.reviews_count }
      : undefined,
    additionalProperty: productProperties(product),
  };
}

export function serviceSchema(service = {}, path) {
  const url = absolute(path);

  return {
    "@type": "Service",
    "@id": `${url}#service`,
    name: service.name,
    serviceType: service.name,
    description: service.long || service.short,
    url,
    areaServed: { "@type": "Country", name: "India" },
    provider: { "@id": ORG_ID, "@type": "Organization", name: ORG_NAME, url: absolute("/") },
    offers: { "@type": "Offer", url, priceCurrency: "INR", availability: "https://schema.org/InStock" },
  };
}