"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  isIosSafari,
  isPwaMarkedInstalled,
  isStandaloneDisplay,
  shouldShowInstallPrompt,
} from "@/lib/pwa-engagement";
import {
  bindBeforeInstallPromptCapture,
  clearDeferredInstallPrompt,
  getDeferredInstallPrompt,
  subscribeDeferredInstallPrompt,
} from "@/lib/pwa-install-prompt";
import { useProductGuidanceOptional } from "@/components/guidance/ProductGuidanceProvider";
import { isGuideFinished } from "@/lib/guidance-storage";

/**
 * Eligibility watcher — displays via ProductGuidanceProvider queue (install_app).
 */
export function InstallAppPrompt() {
  const guidance = useProductGuidanceOptional();
  const [, setTick] = useState(0);

  const evaluate = useCallback(() => {
    if (isStandaloneDisplay() || isPwaMarkedInstalled()) return;
    if (isGuideFinished("install_app") || isGuideFinished("install_success")) return;
    if (!shouldShowInstallPrompt()) return;
    if (isIosSafari()) {
      window.dispatchEvent(new Event("nexa-guidance-install-eligible"));
      return;
    }
    if (getDeferredInstallPrompt()) {
      window.dispatchEvent(new Event("nexa-guidance-install-eligible"));
    }
  }, []);

  useEffect(() => {
    const unbind = bindBeforeInstallPromptCapture();
    const unsub = subscribeDeferredInstallPrompt(() => {
      setTick((n) => n + 1);
      evaluate();
    });
    const onEngagement = () => evaluate();
    const onInstalled = () => {
      clearDeferredInstallPrompt();
      window.dispatchEvent(new Event("nexa-guidance-install-success"));
    };
    window.addEventListener("appinstalled", onInstalled);
    window.addEventListener("nexa-pwa-engagement-changed", onEngagement);
    window.addEventListener("nexa-pwa-force-install-prompt", evaluate);
    return () => {
      unbind();
      unsub();
      window.removeEventListener("appinstalled", onInstalled);
      window.removeEventListener("nexa-pwa-engagement-changed", onEngagement);
      window.removeEventListener("nexa-pwa-force-install-prompt", evaluate);
    };
  }, [evaluate]);

  useEffect(() => {
    evaluate();
    const id = window.setInterval(evaluate, 8000);
    return () => window.clearInterval(id);
  }, [evaluate]);

  // Prefer direct enqueue when provider is available
  useEffect(() => {
    if (!guidance) return;
    if (isStandaloneDisplay() || isPwaMarkedInstalled()) return;
    if (!shouldShowInstallPrompt()) return;
    if (isIosSafari() || getDeferredInstallPrompt()) {
      guidance.enqueueGuide("install_app");
    }
  }, [guidance, evaluate]);

  return null;
}
