import { useLocation } from "react-router-dom";
import Seo from "@/components/Seo";
import { seoForPath } from "@/lib/seoPages";

// Applies per-route SEO defaults (titles, India-wide keywords, noindex for private
// screens) to every page that does not set its own tags. Public pages that render
// their own <Seo /> are skipped, so their copy is never overwritten.
export default function RouteSeo() {
  const { pathname } = useLocation();
  const meta = seoForPath(pathname);

  if (!meta) return null;

  return (
    <Seo
      title={meta.title}
      description={meta.description}
      keywords={meta.keywords}
      robots={meta.robots}
      path={pathname}
    />
  );
}