"use client";

import React from "react";
import { InstallAppPrompt } from "@/components/pwa/InstallAppPrompt";
import { SwUpdateBanner } from "@/components/pwa/SwUpdateBanner";
import { MobileBottomNav } from "@/components/nav/MobileBottomNav";
import { PwaSplash } from "@/components/pwa/PwaSplash";
import { PwaWelcome } from "@/components/pwa/PwaWelcome";
import { MobileSearchProvider } from "@/components/search/MobileSearchProvider";
import { MobileSearchSheet } from "@/components/search/MobileSearchSheet";
import { SavedExperienceHost } from "@/components/saved/SavedExperienceHost";

/** Client shell: splash, welcome, install, SW updates, search sheet, saved UX, mobile nav. */
export function PwaAppShell() {
  return (
    <MobileSearchProvider>
      <PwaSplash />
      <PwaWelcome />
      <SwUpdateBanner />
      <InstallAppPrompt />
      <SavedExperienceHost />
      <MobileSearchSheet />
      <MobileBottomNav />
    </MobileSearchProvider>
  );
}
