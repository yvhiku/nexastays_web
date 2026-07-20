"use client";

import { MobileSearchProvider } from "./MobileSearchProvider";
import { MobileSearchSheetLoader } from "./MobileSearchSheetLoader.client";
import { MobileBottomNav } from "@/components/nav/MobileBottomNav";

/** Scoped search provider for bottom nav + on-demand mobile search sheet. */
export function SearchShell() {
  return (
    <MobileSearchProvider>
      <MobileSearchSheetLoader />
      <MobileBottomNav />
    </MobileSearchProvider>
  );
}
