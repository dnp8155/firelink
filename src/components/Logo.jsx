import React from "react";
import { Image } from "@/components/ui/image";
import { cn } from "@/lib/utils";

// Compact square brand mark — used wherever only the icon is shown.
export const LOGO_URL =
  "https://media.base44.com/images/public/6abbc1d2fd63cf6ad8c46672/82422f3e0_fre-Edited.png";

// Full lockup (mark + FireLink wordmark) for the main brand spots.
export const LOGO_FULL_URL =
  "https://media.base44.com/images/public/6abbc1d2fd63cf6ad8c46672/574924429_Untitleddesign2.png";

export default function Logo({ className }) {
  return (
    <span className={cn("block shrink-0 overflow-hidden rounded-none", className)}>
      <Image src={LOGO_URL} alt="FIRELINK" fittingType="fit" className="h-full w-full" />
    </span>
  );
}

export function LogoFull({ className }) {
  return (
    <Image
      src={LOGO_FULL_URL}
      alt="FireLink"
      fittingType="fit"
      originWidth={1008}
      originHeight={417}
      className={cn("shrink-0", className)}
    />
  );
}