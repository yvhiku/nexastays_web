"use client";

import { useEffect } from "react";
import { SwUpdateBanner } from "@/components/pwa/SwUpdateBanner";
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
    void navigator.serviceWorker.register("/nexa-sw.js", { scope: "/" });
  }, []);

  return (
    <>
      <SwUpdateBanner />
      <SearchShell />
    </>
  );
}
