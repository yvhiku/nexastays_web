"use client";

import { SwUpdateBanner } from "@/components/pwa/SwUpdateBanner";
import { SearchShell } from "@/components/search/SearchShell.client";

/** Minimal PWA shell: bottom nav + SW updates only. */
export function PwaAppShellCore() {
  return (
    <>
      <SwUpdateBanner />
      <SearchShell />
    </>
  );
}
