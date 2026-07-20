"use client";

import { useEffect } from "react";
import { bindNexaDebug } from "@/lib/nexa-debug";
import { recoverBrokenDevServiceWorker } from "@/lib/pwa-sw-update";

/** Mounts `window.NexaDebug.reset()` for QA / first-run restores. */
export function NexaDebugBoot() {
  useEffect(() => {
    void recoverBrokenDevServiceWorker();
    return bindNexaDebug();
  }, []);
  return null;
}
