"use client";

import React, { useEffect, useState } from "react";
import { isStandaloneDisplay } from "@/lib/pwa-engagement";
import { cn } from "@/lib/utils";

const SPLASH_KEY = "nexa-pwa-splash-shown";
const MIN_MS = 500;
const MAX_MS = 1200;

/** Adaptive splash: min 500ms, hide when ready, max 1200ms. Once per standalone open. */
export function PwaSplash() {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (!isStandaloneDisplay()) return;
    try {
      if (sessionStorage.getItem(SPLASH_KEY) === "1") return;
      sessionStorage.setItem(SPLASH_KEY, "1");
    } catch {
      /* ignore */
    }
    setVisible(true);
    const started = Date.now();
    let hidden = false;

    const hide = () => {
      if (hidden) return;
      hidden = true;
      setFading(true);
      window.setTimeout(() => setVisible(false), 280);
    };

    const tryHide = () => {
      const elapsed = Date.now() - started;
      if (elapsed >= MIN_MS) hide();
      else window.setTimeout(hide, MIN_MS - elapsed);
    };

    const onReady = () => {
      requestAnimationFrame(() => requestAnimationFrame(tryHide));
    };

    if (document.readyState === "complete") onReady();
    else window.addEventListener("load", onReady);

    const maxTimer = window.setTimeout(hide, MAX_MS);

    return () => {
      window.removeEventListener("load", onReady);
      window.clearTimeout(maxTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-300",
        "bg-gradient-to-br from-[#FDFBFC] via-[#F8F2F5] to-[#FDF0F3]",
        fading ? "opacity-0" : "opacity-100",
      )}
      aria-hidden
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-[22px] bg-gradient-to-br from-nexa-primary to-nexa-primary-dark text-4xl font-bold text-white shadow-nexa-md">
        N
      </div>
    </div>
  );
}
