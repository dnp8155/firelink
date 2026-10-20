import React from "react";
import { useLanguage } from "@/lib/i18n";
import { Languages } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LanguageToggle({ className }) {
  const { lang, toggle } = useLanguage();
  return (
    <button
      onClick={toggle}
      className={cn(
        "flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold transition hover:bg-slate-50",
        className
      )}
      title={lang === "en" ? "हिंदी में बदलें" : "Switch to English"}
    >
      <Languages className="h-3.5 w-3.5 text-slate-500" />
      <span className={lang === "en" ? "text-slate-600" : "text-rose-600"}>EN</span>
      <span className="text-slate-300">|</span>
      <span className={lang === "hi" ? "text-rose-600" : "text-slate-600"}>हि</span>
    </button>
  );
}