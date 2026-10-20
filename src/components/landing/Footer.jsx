import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Logo from "@/components/Logo";
import { Image } from "@/components/ui/image";

const DEVELOPER_URL =
  "https://media.base44.com/images/public/6aa4425cbf7ee7adfbdf102e/c6cd5d762_generated_image.png";

const BANNER_URL =
  "https://media.base44.com/images/public/6aa4425cbf7ee7adfbdf102e/d6d1d5381_ChatGPTImageSep12202602_28_49AM.png";

const COLS = [
  {
    title: "Products",
    links: [
      ["Fire Extinguishers", "/products"],
      ["Fire Alarm", "/products"],
      ["Hydrant", "/products"],
      ["Sprinklers", "/products"],
      ["Fire Pumps", "/products"],
      ["PPE", "/products"],
      ["Gas Detection", "/products"],
      ["Fire Suppression", "/products"],
    ],
  },
  {
    title: "Services",
    links: [
      ["Inspection", "/services"],
      ["AMC", "/services"],
      ["Maintenance", "/services"],
      ["Fire NOC", "/services"],
      ["Fire Safety Audit", "/services"],
      ["Installation", "/services"],
      ["Testing", "/services"],
    ],
  },
  {
    title: "Platform",
    links: [
      ["Asset Management", "/assets"],
      ["Compliance", "/compliance"],
      ["RFQ", "/rfqs"],
      ["AI Assistant", "/ai-assistant"],
      ["Vendor Network", "/vendors"],
    ],
  },
  {
    title: "Company",
    links: [
      ["About Us", "/about"],
      ["Contact Us", "/contact"],
      ["Vendors", "/vendors"],
      ["Login", "/login"],
      ["Create Account", "/register"],
    ],
  },
];

const LEGAL = ["Privacy Policy", "Terms", "Refund Policy", "Shipping Policy", "Vendor Terms"];

export default function Footer() {
  return (
    <>
      <img
        src={BANNER_URL}
        alt="FireLink — fire and safety industrial skyline"
        className="block w-full"
        loading="lazy"
      />
      <footer className="bg-slate-900 text-slate-300">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
            <div className="col-span-2 sm:col-span-3 lg:col-span-1">
              <div className="flex items-center gap-2.5">
                <Logo className="h-20 w-20" />
                <span className="font-display text-lg font-extrabold tracking-tight text-white">
                  FIRE<span className="text-primary">LINK</span>
                </span>
              </div>
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">
                Everything Fire & Safety. Connected. A premium ecosystem for certified products,
                professional services, asset management and compliance.
              </p>
              <Button asChild className="mt-6 h-10 font-semibold shadow-lg shadow-red-900/40">
                <Link to="/register">Become a Vendor <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </div>

            {COLS.map((col) => (
              <div key={col.title}>
                <h4 className="text-sm font-semibold uppercase tracking-wider text-white">{col.title}</h4>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map(([label, to]) => (
                    <li key={label}>
                      <Link to={to} className="text-sm text-slate-400 transition hover:text-white">
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-t border-slate-800 pt-6 sm:justify-start sm:gap-x-6">
            {LEGAL.map((l) => (
              <span key={l} className="text-xs text-slate-500">{l}</span>
            ))}
          </div>
          <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              © {new Date().getFullYear()} FIRELINK — Everything Fire & Safety. Connected.
            </p>
            <div className="flex items-center gap-2.5">
              <span className="text-xs uppercase tracking-widest text-slate-500">Developed by</span>
              <a
                href="https://brightlooptechnology.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-opacity hover:opacity-80"
              >
                <Image
                  src={DEVELOPER_URL}
                  alt="BrightLoop Technology"
                  fittingType="fill"
                  focalPointX={0.5}
                  focalPointY={0.5}
                  className="h-10 w-40"
                />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}