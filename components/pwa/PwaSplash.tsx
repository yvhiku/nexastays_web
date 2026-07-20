"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { isStandaloneDisplay } from "@/lib/pwa-engagement";
import { PWA_LOGO } from "@/lib/pwa-assets";
import { cn } from "@/lib/utils";

const SPLASH_KEY = "nexa-pwa-splash-shown";
const MIN_MS = 500;
const MAX_MS = 1200;
const ENTER_MS = 300;

/** Adaptive splash: logo enter, min 500ms, hide when ready, max 1200ms. Once per standalone open. */
export function PwaSplash() {
  const [visible, setVisible] = useState(false);
  const [entered, setEntered] = useState(false);
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

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let enterTimer: number | null = null;
    if (reduce) {
      setEntered(true);
    } else {
      enterTimer = window.setTimeout(() => setEntered(true), 16);
    }

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
      if (enterTimer != null) window.clearTimeout(enterTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center bg-black transition-opacity duration-300",
        fading ? "opacity-0" : "opacity-100",
      )}
      aria-hidden
    >
      <div
        className={cn(
          "transition-[opacity,transform] ease-out",
          entered ? "scale-100 opacity-100" : "scale-[0.96] opacity-0",
        )}
        style={{ transitionDuration: `${ENTER_MS}ms` }}
      >
        <Image
          src={PWA_LOGO}
          alt=""
          width={96}
          height={96}
          priority
          className="h-24 w-24 object-contain"
        />
      </div>
    </div>
  );
}
