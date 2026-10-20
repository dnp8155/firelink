// FireLink intro splash — FireLink branded, plays once per device, then reveals the app.
import React, { useState, useEffect } from "react";
import { Image } from "@/components/ui/image";
import { LOGO_URL } from "@/components/Logo";

const POSTER =
  "https://media.base44.com/images/public/6abbc1d2fd63cf6ad8c46672/556c08006_generated_image.png";
const STORAGE_KEY = "firelink_splash_shown";
const HOLD_MS = 2600;

export default function SplashScreen({ children }) {
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setShowSplash(true);
    } catch {
      setShowSplash(true);
    }
  }, []);

  useEffect(() => {
    if (!showSplash) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, "1");
      } catch {}
      setShowSplash(false);
    }, HOLD_MS);
    return () => clearTimeout(t);
  }, [showSplash]);

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {}
    setShowSplash(false);
  };

  if (!showSplash) return <>{children}</>;

  return (
    <>
      {children}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black">
        <Image
          src={POSTER}
          fittingType="fill"
          alt="Fire safety equipment — extinguishers, alarm panel and safety helmets"
          className="absolute inset-0 h-full w-full opacity-70"
        />
        <div className="relative flex flex-col items-center gap-5 px-6 text-center">
          <Image
            src={LOGO_URL}
            fittingType="fit"
            alt="FireLink"
            className="h-20 w-20 drop-shadow-lg"
          />
          <div>
            <p className="font-display text-3xl font-extrabold tracking-tight text-white">
              FIRE<span className="text-primary">LINK</span>
            </p>
            <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.25em] text-white/70">
              Everything fire &amp; safety. Connected.
            </p>
          </div>
        </div>
        <button
          onClick={dismiss}
          className="absolute bottom-6 right-6 rounded-full bg-white/10 px-5 py-2 text-sm font-medium text-white/70 backdrop-blur-sm transition hover:bg-white/20 hover:text-white"
        >
          Skip
        </button>
      </div>
    </>
  );
}