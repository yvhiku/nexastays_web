"use client";

import React, { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import "@/components/host/portal/host-portal.css";
import { useLanguage } from "@/contexts/LanguageContext";
import { HostPortalSidebar } from "@/components/host/portal/HostPortalSidebar";
import { HostPortalTopBar } from "@/components/host/portal/HostPortalTopBar";
import {
  HostPortalMobileBottomNav,
  HostPortalMobileDrawer,
} from "@/components/host/portal/HostPortalMobileNav";

type Props = {
  children: React.ReactNode;
};

/**
 * Portal chrome only. Content padding / full-bleed is owned by nested route layouts
 * (padded content group vs inbox bleed) — not by path detection here.
 */
export function HostPortalShell({ children }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { locale } = useLanguage();
  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  return (
    <div
      className={cn(
        "host-portal flex h-dvh min-h-0 overflow-hidden",
        locale === "ar" && "font-arabic",
      )}
    >
      <div className="fixed inset-y-0 start-0 z-40 hidden md:block">
        <HostPortalSidebar />
      </div>

      <HostPortalMobileDrawer open={drawerOpen} onClose={closeDrawer} />

      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden md:ms-64">
        <HostPortalTopBar onOpenDrawer={openDrawer} drawerOpen={drawerOpen} />
        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          {children}
        </main>
      </div>

      <HostPortalMobileBottomNav />
    </div>
  );
}
