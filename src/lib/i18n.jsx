import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const LanguageContext = createContext(null);

// Translations for the most commonly visible UI strings.
// Start with navigation + page headers + common actions — expand as pages are translated.
const TRANSLATIONS = {
  // ---- Common ----
  "common.dashboard": { en: "Dashboard", hi: "डैशबोर्ड" },
  "common.search": { en: "Search", hi: "खोजें" },
  "common.save": { en: "Save", hi: "सहेजें" },
  "common.cancel": { en: "Cancel", hi: "रद्द करें" },
  "common.close": { en: "Close", hi: "बंद करें" },
  "common.add": { en: "Add", hi: "जोड़ें" },
  "common.edit": { en: "Edit", hi: "संपादित करें" },
  "common.delete": { en: "Delete", hi: "हटाएं" },
  "common.view": { en: "View", hi: "देखें" },
  "common.download": { en: "Download", hi: "डाउनलोड" },
  "common.loading": { en: "Loading…", hi: "लोड हो रहा है…" },
  "common.welcome": { en: "Welcome back", hi: "वापसी पर स्वागत है" },
  "common.logout": { en: "Log out", hi: "लॉग आउट" },
  "common.settings": { en: "Settings", hi: "सेटिंग्स" },
  "common.profile": { en: "Profile", hi: "प्रोफ़ाइल" },
  "common.notifications": { en: "Notifications", hi: "सूचनाएं" },
  "common.support": { en: "Support", hi: "सहायता" },

  // ---- Customer Nav ----
  "nav.marketplace": { en: "Marketplace", hi: "बाज़ार" },
  "nav.orders": { en: "Orders", hi: "ऑर्डर" },
  "nav.rfqs": { en: "RFQs", hi: "आरएफक्यू" },
  "nav.quotations": { en: "Quotations", hi: "कोटेशन" },
  "nav.assets": { en: "My Assets", hi: "मेरी संपत्ति" },
  "nav.qr_scanner": { en: "QR Scanner", hi: "क्यूआर स्कैनर" },
  "nav.certificates": { en: "Certificates", hi: "प्रमाणपत्र" },
  "nav.compliance": { en: "Compliance", hi: "अनुपालन" },
  "nav.fire_noc": { en: "Fire NOC", hi: "फायर एनओसी" },
  "nav.compliance_calendar": { en: "Compliance Calendar", hi: "अनुपालन कैलेंडर" },
  "nav.maintenance": { en: "Maintenance", hi: "रखरखाव" },
  "nav.service_requests": { en: "Service Requests", hi: "सेवा अनुरोध" },
  "nav.book_service": { en: "Book Service", hi: "सेवा बुक करें" },
  "nav.amc": { en: "AMC Plans", hi: "एएमसी प्लान" },
  "nav.fire_audit": { en: "Fire Audit", hi: "फायर ऑडिट" },
  "nav.jobs": { en: "Jobs", hi: "नौकरियां" },
  "nav.compare_vendors": { en: "Compare Vendors", hi: "विक्रेता तुलना" },
  "nav.documents": { en: "Documents", hi: "दस्तावेज़" },
  "nav.ai_assistant": { en: "AI Assistant", hi: "एआई सहायक" },
  "nav.wishlist": { en: "Wishlist", hi: "विशलिस्ट" },
  "nav.cart": { en: "Cart", hi: "कार्ट" },

  // ---- Vendor Nav ----
  "nav.vendor_dashboard": { en: "Dashboard", hi: "डैशबोर्ड" },
  "nav.products": { en: "Products", hi: "उत्पाद" },
  "nav.inventory": { en: "Inventory", hi: "इन्वेंट्री" },
  "nav.warehouses": { en: "Warehouses", hi: "गोदाम" },
  "nav.quotations_vendor": { en: "Quotations", hi: "कोटेशन" },
  "nav.shipments": { en: "Shipments", hi: "शिपमेंट" },
  "nav.returns": { en: "Returns", hi: "रिटर्न" },
  "nav.technicians": { en: "Technicians", hi: "तकनीशियन" },
  "nav.customers": { en: "Customers", hi: "ग्राहक" },
  "nav.team": { en: "Team", hi: "टीम" },
  "nav.payments": { en: "Payments", hi: "भुगतान" },
  "nav.settlements": { en: "Settlements", hi: "निपटान" },
  "nav.analytics": { en: "Analytics", hi: "एनालिटिक्स" },

  // ---- Page titles ----
  "title.vendor_dashboard": { en: "Vendor Dashboard", hi: "विक्रेता डैशबोर्ड" },
  "title.admin_dashboard": { en: "Admin Dashboard", hi: "एडमिन डैशबोर्ड" },
  "title.compliance_calendar": { en: "Compliance Calendar", hi: "अनुपालन कैलेंडर" },
  "title.assets": { en: "Assets", hi: "संपत्ति" },
  "title.orders": { en: "Orders", hi: "ऑर्डर" },

  // ---- Actions ----
  "action.add_product": { en: "Add Product", hi: "उत्पाद जोड़ें" },
  "action.register_asset": { en: "Register Asset", hi: "संपत्ति रजिस्टर करें" },
  "action.bulk_import": { en: "Bulk Import", hi: "बल्क इंपोर्ट" },
  "action.download_invoice": { en: "Download Invoice", hi: "इनवॉइस डाउनलोड" },
  "action.download_po": { en: "Download PO", hi: "पीओ डाउनलोड" },
  "action.check_expiry": { en: "Run Expiry Check", hi: "समाप्ति जांच चलाएं" },
};

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem("firelink_lang") || "en"; } catch { return "en"; }
  });

  useEffect(() => {
    try { localStorage.setItem("firelink_lang", lang); } catch { /* ignore */ }
  }, [lang]);

  const toggle = useCallback(() => setLang((l) => (l === "en" ? "hi" : "en")), []);

  const t = useCallback((key, fallback) => {
    const entry = TRANSLATIONS[key];
    if (!entry) return fallback || key;
    return entry[lang] || entry.en || fallback || key;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggle, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) return { lang: "en", setLang: () => {}, toggle: () => {}, t: (k, f) => f || k };
  return ctx;
}

// Convenience: translate a ROLE_NAV label using the "nav.*" key if it matches
export function useNavT() {
  const { t, lang } = useLanguage();
  return (label, navKey) => {
    if (!navKey) return label;
    const key = "nav." + navKey;
    const entry = TRANSLATIONS[key];
    if (!entry) return label;
    return entry[lang] || label;
  };
}

// Label-based translation map for nav items and common UI labels.
// Used by the sidebar so every role's nav is translated without per-item keys.
const LABEL_MAP = {
  "Dashboard": "डैशबोर्ड",
  "My Dashboard": "मेरा डैशबोर्ड",
  "Vendor Dashboard": "विक्रेता डैशबोर्ड",
  "Admin Dashboard": "एडमिन डैशबोर्ड",
  "System Dashboard": "सिस्टम डैशबोर्ड",
  "Engineering Dashboard": "इंजीनियरिंग डैशबोर्ड",
  "Org Dashboard": "संगठन डैशबोर्ड",
  "Marketplace": "बाज़ार",
  "Orders": "ऑर्डर",
  "My Orders": "मेरे ऑर्डर",
  "RFQs": "आरएफक्यू",
  "Quotations": "कोटेशन",
  "My Assets": "मेरी संपत्ति",
  "Assets": "संपत्ति",
  "QR Scanner": "क्यूआर स्कैनर",
  "Scan QR": "क्यूआर स्कैन",
  "Certificates": "प्रमाणपत्र",
  "Compliance": "अनुपालन",
  "Compliance Calendar": "अनुपालन कैलेंडर",
  "Fire NOC": "फायर एनओसी",
  "CAPA": "कैपा",
  "Maintenance": "रखरखाव",
  "Service Requests": "सेवा अनुरोध",
  "Book Service": "सेवा बुक करें",
  "Services": "सेवाएं",
  "AMC Plans": "एएमसी प्लान",
  "Fire Audit": "फायर ऑडिट",
  "Jobs": "नौकरियां",
  "My Jobs": "मेरे काम",
  "Compare Vendors": "विक्रेता तुलना",
  "Documents": "दस्तावेज़",
  "AI Assistant": "एआई सहायक",
  "AI Engineering Assistant": "एआई इंजीनियरिंग सहायक",
  "Wishlist": "विशलिस्ट",
  "Cart": "कार्ट",
  "Notifications": "सूचनाएं",
  "Support": "सहायता",
  "Profile": "प्रोफ़ाइल",
  "Profile & Settings": "प्रोफ़ाइल और सेटिंग्स",
  "Settings": "सेटिंग्स",
  "Reports": "रिपोर्ट",
  "Sites": "साइट्स",
  "Products": "उत्पाद",
  "Product Approvals": "उत्पाद अनुमोदन",
  "Inventory": "इन्वेंट्री",
  "Warehouses": "गोदाम",
  "Shipments": "शिपमेंट",
  "Returns": "रिटर्न",
  "Technicians": "तकनीशियन",
  "Customers": "ग्राहक",
  "Team": "टीम",
  "Payments": "भुगतान",
  "Settlements": "निपटान",
  "Analytics": "एनालिटिक्स",
  "Wallet": "वॉलेट",
  "Subscription": "सदस्यता",
  "Signature": "हस्ताक्षर",
  "Gen Certificate": "प्रमाणपत्र बनाएं",
  "Offers": "ऑफर",
  "Organization Profile": "संगठन प्रोफ़ाइल",
  "Company Profile": "कंपनी प्रोफ़ाइल",
  "Verification": "सत्यापन",
  "Organizations": "संगठन",
  "Vendors": "विक्रेता",
  "Disputes": "विवाद",
  "Support Tickets": "सहायता टिकट",
  "Audit Logs": "ऑडिट लॉग",
  "Categories": "श्रेणियां",
  "Commissions": "कमीशन",
  "Advertisements": "विज्ञापन",
  "Job Approvals": "नौकरी अनुमोदन",
  "Certificate Verify": "प्रमाणपत्र सत्यापन",
  "Revenue Model": "राजस्व मॉडल",
  "Roles & Permissions": "भूमिकाएं और अनुमतियां",
  "Feature Flags": "फ़ीचर फ़्लैग",
  "Integrations": "एकीकरण",
  "System Health": "सिस्टम स्वास्थ्य",
  "Projects": "परियोजनाएं",
  "Fire Load Calculator": "फायर लोड कैलकुलेटर",
  "Hydraulic Calculator": "हाइड्रोलिक कैलकुलेटर",
  "BOQ Generator": "बीओक्यू जनरेटर",
  "Inspections": "निरीक्षण",
};

// Hook: returns a function that translates any English label to the active language
export function useLabelT() {
  const { lang } = useLanguage();
  return (label) => {
    if (lang === "en") return label;
    if (!label) return label;
    return LABEL_MAP[label] || label;
  };
}