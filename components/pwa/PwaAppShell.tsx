"use client";

import React from "react";
import { InstallAppPrompt } from "@/components/pwa/InstallAppPrompt";
import { SwUpdateBanner } from "@/components/pwa/SwUpdateBanner";
import { MobileBottomNav } from "@/components/nav/MobileBottomNav";
import { PwaSplash } from "@/components/pwa/PwaSplash";
import { MobileSearchProvider } from "@/components/search/MobileSearchProvider";
import { MobileSearchSheet } from "@/components/search/MobileSearchSheet";
import { SavedExperienceHost } from "@/components/saved/SavedExperienceHost";
import { ProductGuidanceProvider } from "@/components/guidance/ProductGuidanceProvider";

/** Client shell: splash, guidance, install, SW updates, search sheet, saved UX, mobile nav. */
export function PwaAppShell() {
  return (
    <MobileSearchProvider>
      <ProductGuidanceProvider>
        <PwaSplash />
        <SwUpdateBanner />
        <InstallAppPrompt />
        <SavedExperienceHost />
        <MobileSearchSheet />
        <MobileBottomNav />
      </ProductGuidanceProvider>
    </MobileSearchProvider>
  );
}
