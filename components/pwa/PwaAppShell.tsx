"use client";

import React from "react";
import { InstallAppPrompt } from "@/components/pwa/InstallAppPrompt";
import { SwUpdateBanner } from "@/components/pwa/SwUpdateBanner";
import { MobileBottomNav } from "@/components/nav/MobileBottomNav";
import { PwaSplash } from "@/components/pwa/PwaSplash";
import { PwaWelcome } from "@/components/pwa/PwaWelcome";

/** Client shell: splash, welcome, install, SW updates, mobile bottom nav. */
export function PwaAppShell() {
  return (
    <>
      <PwaSplash />
      <PwaWelcome />
      <SwUpdateBanner />
      <InstallAppPrompt />
      <MobileBottomNav />
    </>
  );
}
