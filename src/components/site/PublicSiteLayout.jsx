import React from "react";
import { Outlet } from "react-router-dom";
import PublicHeader from "@/components/landing/PublicHeader";
import Footer from "@/components/landing/Footer";
import MobileBottomNav from "@/components/landing/MobileBottomNav";

export default function PublicSiteLayout() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background pb-24 lg:pb-0">
      <PublicHeader />
      <main className="min-h-[70vh]">
        <Outlet />
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}