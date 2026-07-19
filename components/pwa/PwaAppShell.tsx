"use client";

import React from "react";
import { InstallAppPrompt } from "@/components/pwa/InstallAppPrompt";
import { SwUpdateBanner } from "@/components/pwa/SwUpdateBanner";
import { MobileBottomNav } from "@/components/nav/MobileBottomNav";

/** Client shell: install prompt, SW updates, mobile bottom navigation. */
export function PwaAppShell() {
  return (
    <>
      <SwUpdateBanner />
      <InstallAppPrompt />
      <MobileBottomNav />
    </>
  );
}
