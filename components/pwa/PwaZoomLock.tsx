"use client";

import { useEffect } from "react";
import { applyPwaZoomLock } from "@/lib/pwa-zoom-lock";

/** Disable pinch/double-tap zoom when the app runs as an installed PWA. */
export function PwaZoomLock() {
  useEffect(() => applyPwaZoomLock(), []);
  return null;
}
