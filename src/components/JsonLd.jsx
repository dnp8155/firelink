import { useEffect } from "react";

// Injects one JSON-LD block (object or array of nodes) for the current page and
// removes it on unmount. Renders nothing.
export default function JsonLd({ data }) {
  const json = data ? JSON.stringify(data) : "";

  useEffect(() => {
    if (!json) return undefined;
    const el = document.createElement("script");
    el.type = "application/ld+json";
    el.textContent = json;
    document.head.appendChild(el);
    return () => el.remove();
  }, [json]);

  return null;
}