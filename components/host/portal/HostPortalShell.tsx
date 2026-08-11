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
        <HostPortalTopBar onOpenDrawer={openDrawer} />
        <main className="flex-1 px-4 pb-24 pt-4 md:px-10 md:pb-10 md:pt-6">
          <div className="mx-auto w-full max-w-[1280px]">{children}</div>
        </main>
      </div>

      <HostPortalMobileBottomNav />
    </div>
  );
}
