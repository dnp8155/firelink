import { useEffect } from "react";
import { DEFAULT_KEYWORDS } from "@/lib/seoPages";

// Canonical origin of the published site (used for canonical + share URLs).
export const SEO_ORIGIN = "https://firelinkpo.base44.app";
export const SEO_SITE = "FireLink";
export const SEO_IMAGE =
  "https://media.base44.com/images/public/6aa4425cbf7ee7adfbdf102e/bfe0fc2c4_generated_image.png";

export const DEFAULT_DESCRIPTION =
  "Buy ISI/BIS-certified fire safety equipment online in India — extinguishers, alarms, hydrants, pumps and PPE from verified vendors, with AMC, fire NOC compliance, asset QR tracking and expert support.";

export const DEFAULT_ROBOTS =
  "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";

function setMeta(attr, key, content) {
  if (!content) return;
  const selector = `meta[${attr}="${key}"]`;
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

/**
 * Per-page SEO tags: title, description, India-wide keywords, canonical, robots,
 * Open Graph, Twitter card and optional JSON-LD structured data. Renders nothing.
 */
export default function Seo({
  title,
  description,
  path,
  image,
  type = "website",
  jsonLd,
  keywords,
  robots = DEFAULT_ROBOTS,
}) {
  const desc = description || DEFAULT_DESCRIPTION;
  const url = SEO_ORIGIN + (path || "/");

  useEffect(() => {
    if (title) document.title = title;
    setCanonical(url);
    setMeta("name", "description", desc);
    setMeta("name", "keywords", keywords || DEFAULT_KEYWORDS);
    setMeta("name", "robots", robots);
    setMeta("name", "content-language", "en-IN");
    setMeta("name", "geo.region", "IN");
    setMeta("name", "geo.placename", "India");
    setMeta("property", "og:type", type);
    setMeta("property", "og:title", title || SEO_SITE);
    setMeta("property", "og:description", desc);
    setMeta("property", "og:url", url);
    setMeta("property", "og:image", image || SEO_IMAGE);
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", title || SEO_SITE);
    setMeta("name", "twitter:description", desc);
    setMeta("name", "twitter:image", image || SEO_IMAGE);
  }, [title, desc, url, image, type, keywords, robots]);

  const schema = jsonLd ? JSON.stringify(jsonLd) : "";
  useEffect(() => {
    if (!schema) return undefined;
    const el = document.createElement("script");
    el.type = "application/ld+json";
    el.textContent = schema;
    document.head.appendChild(el);
    return () => el.remove();
  }, [schema]);

  return null;
}