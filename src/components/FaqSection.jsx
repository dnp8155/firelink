import React from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import JsonLd from "@/components/JsonLd";
import { faqSchema } from "@/lib/schema";

// Visible question-and-answer block, plus the matching FAQPage structured data so
// search engines and AI answer engines can quote these answers directly.
export default function FaqSection({
  title = "Frequently asked questions",
  subtitle,
  items = [],
  id = "faq",
}) {
  if (!items.length) return null;

  return (
    <section id={id} className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <JsonLd data={{ "@context": "https://schema.org", ...faqSchema(items) }} />

      <div className="flex items-center gap-2">
        <HelpCircle className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold text-slate-700">Answers</span>
      </div>
      <h2 className="font-display mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
        {title}
      </h2>
      {subtitle && <p className="mt-3 text-lg text-slate-600">{subtitle}</p>}

      <div className="mt-8 divide-y divide-slate-200 border-y border-slate-200">
        {items.map((faq) => (
          <details key={faq.q} className="group py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 [&::-webkit-details-marker]:hidden">
              <h3 className="text-base font-semibold text-slate-900">{faq.q}</h3>
              <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition group-open:rotate-180" />
            </summary>
            <p className="mt-2 pr-6 text-sm leading-relaxed text-slate-600">{faq.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}