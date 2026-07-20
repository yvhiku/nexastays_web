"use client";

import { PwaAppShellCore } from "@/components/pwa/PwaAppShellCore";
import { PwaAppShellEnhanced } from "@/components/pwa/PwaAppShellEnhanced.client";

/** Client shell split: core nav immediately, enhanced features after idle. */
export function PwaAppShell() {
  return (
    <>
      <PwaAppShellCore />
      <PwaAppShellEnhanced />
    </>
  );
}
