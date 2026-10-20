import JsonLd from "@/components/JsonLd";
import { siteGraph } from "@/lib/schema";

// Site-wide structured data (organisation + website) — mounted once for every route.
const GRAPH = siteGraph();

export default function SiteSchema() {
  return <JsonLd data={GRAPH} />;
}