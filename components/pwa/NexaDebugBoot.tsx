"use client";

import { useEffect } from "react";
import { bindNexaDebug } from "@/lib/nexa-debug";

/** Mounts `window.NexaDebug.reset()` for QA / first-run restores. */
export function NexaDebugBoot() {
  useEffect(() => bindNexaDebug(), []);
  return null;
}
