import React from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

const TONES = {
  primary: "bg-primary/10 text-primary",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  sky: "bg-sky-50 text-sky-600",
  violet: "bg-violet-50 text-violet-600",
  teal: "bg-teal-50 text-teal-600",
  rose: "bg-rose-50 text-rose-600",
  slate: "bg-slate-100 text-slate-500",
};

export default function PanelRow({ icon: Icon, tone = "slate", title, meta, trailing, href, className }) {
  const Wrapper = href ? Link : "div";
  const props = href ? { to: href } : {};
  return (
    <Wrapper
      {...props}
      className={cn(
        "flex items-center gap-3 px-5 py-3 transition",
        href && "hover:bg-muted/50",
        className
      )}
    >
      {Icon && (
        <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", TONES[tone] || TONES.slate)}>
          <Icon className="h-4 w-4" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{title}</p>
        {meta && <p className="truncate text-xs text-muted-foreground">{meta}</p>}
      </div>
      {trailing}
      {href && <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60" />}
    </Wrapper>
  );
}