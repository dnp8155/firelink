import React from "react";
import Hero from "@/components/landing/Hero";
import Categories from "@/components/landing/Categories";
import FeaturedProducts from "@/components/landing/FeaturedProducts";
import ServicesSolutions from "@/components/landing/ServicesSolutions";
import WhyConnect from "@/components/landing/WhyConnect";
import AssetQr from "@/components/landing/AssetQr";
import ComplianceAi from "@/components/landing/ComplianceAi";
import VendorsSection from "@/components/landing/VendorsSection";
import Resources from "@/components/landing/Resources";
import Seo from "@/components/Seo";
import JsonLd from "@/components/JsonLd";
import FaqSection from "@/components/FaqSection";
import { keywordList } from "@/lib/seoPages";
import { webPageSchema, graph } from "@/lib/schema";
import { HOME_FAQS } from "@/lib/faqs";

const TITLE = "FireLink — Fire Safety Equipment &amp; Services Online in India";
const DESCRIPTION =
  "Buy ISI/BIS-certified fire safety equipment online in India — extinguishers, alarms, hydrants, pumps and PPE from verified vendors, with AMC, fire NOC compliance, asset QR tracking and expert support.";

export default function PublicLanding() {
  return (
    <div>
      <Seo
        title={TITLE}
        description={DESCRIPTION}
        keywords={keywordList("fire safety equipment India", "buy fire extinguisher online India", "fire safety products India", "fire safety services India", "fire protection system India")}
        path="/"
      />
      <JsonLd
        data={graph(
          webPageSchema({
            type: "WebPage",
            name: "FireLink — Fire Safety Equipment & Services Online in India",
            description: DESCRIPTION,
            path: "/",
          })
        )}
      />
      <Hero />
      <Categories />
      <FeaturedProducts />
      <ServicesSolutions />
      <WhyConnect />
      <AssetQr />
      <ComplianceAi />
      <VendorsSection />
      <Resources />
      <FaqSection
        title="Fire safety in India — your questions answered"
        subtitle="Licensing, refilling, AMC and buying certified equipment, answered."
        items={HOME_FAQS}
      />
    </div>
  );
}