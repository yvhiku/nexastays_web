"use client";

import React, { useState, useCallback } from "react";
import "@/components/host/portal/host-portal.css";
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
  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  return (
    <div className="host-portal flex min-h-screen">
      <div className="fixed inset-y-0 start-0 z-40 hidden md:block">
        <HostPortalSidebar />
      </div>

      <HostPortalMobileDrawer open={drawerOpen} onClose={closeDrawer} />

      <div className="flex min-h-screen min-w-0 flex-1 flex-col md:ms-64">
        <HostPortalTopBar onOpenDrawer={openDrawer} drawerOpen={drawerOpen} />
        <main className="flex min-h-0 flex-1 flex-col">{children}</main>
      </div>

      <HostPortalMobileBottomNav />
    </div>
  );
}
