"use client";

import { useEffect } from "react";
import { SwUpdateBanner } from "@/components/pwa/SwUpdateBanner";
import { PwaZoomLock } from "@/components/pwa/PwaZoomLock";
import { SearchShell } from "@/components/search/SearchShell.client";

/** Minimal PWA shell: bottom nav + SW updates only. */
export function PwaAppShellCore() {
  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" ||
      process.env.NEXT_PUBLIC_DISABLE_PWA === "true" ||
      !("serviceWorker" in navigator)
    ) {
      return;
    }
    void (async () => {
      await import("@/lib/pwa-sw-update").then((m) =>
        m.unregisterLegacyServiceWorkers(),
      );
      await navigator.serviceWorker.register("/nexa-sw.js", {
        scope: "/",
        updateViaCache: "none",
      });
    })();
  }, []);

  return (
    <>
      <PwaZoomLock />
      <SwUpdateBanner />
      <SearchShell />
    </>
  );
}
