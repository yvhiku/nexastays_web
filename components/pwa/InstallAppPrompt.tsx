"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  dismissInstallPrompt,
  isIosSafari,
  isPwaMarkedInstalled,
  isStandaloneDisplay,
  markPwaInstalled,
  shouldShowInstallPrompt,
} from "@/lib/pwa-engagement";
import {
  bindBeforeInstallPromptCapture,
  clearDeferredInstallPrompt,
  getDeferredInstallPrompt,
  subscribeDeferredInstallPrompt,
} from "@/lib/pwa-install-prompt";
import { cn } from "@/lib/utils";
import { InstallAppSheet, InstallSuccessToast } from "@/components/pwa/InstallAppSheet";

/**
 * Floating install prompt:
 * - standalone / installed → nothing
 * - iOS Safari (+ eligible) → Share → Add to Home Screen
 * - beforeinstallprompt (+ eligible) → Android Install App
 * - else → nothing
 */
export function InstallAppPrompt() {
  const [, setDeferredTick] = useState(0);
  const [visible, setVisible] = useState(false);
  const [variant, setVariant] = useState<"ios" | "android" | null>(null);
  const [success, setSuccess] = useState(false);

  const evaluate = useCallback(() => {
    if (isStandaloneDisplay() || isPwaMarkedInstalled()) {
      setVisible(false);
      setVariant(null);
      return;
    }
    if (!shouldShowInstallPrompt()) {
      setVisible(false);
      setVariant(null);
      return;
    }
    if (isIosSafari()) {
      setVariant("ios");
      setVisible(true);
      return;
    }
    if (getDeferredInstallPrompt()) {
      setVariant("android");
      setVisible(true);
      return;
    }
    setVisible(false);
    setVariant(null);
  }, []);

  useEffect(() => {
    const unbind = bindBeforeInstallPromptCapture();
    const unsub = subscribeDeferredInstallPrompt(() => {
      setDeferredTick((n) => n + 1);
      evaluate();
    });
    const onInstalled = () => {
      markPwaInstalled();
      clearDeferredInstallPrompt();
      setVisible(false);
      setVariant(null);
      setSuccess(true);
    };
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      unbind();
      unsub();
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [evaluate]);

  useEffect(() => {
    if (!success) return;
    const id = window.setTimeout(() => setSuccess(false), 3500);
    return () => window.clearTimeout(id);
  }, [success]);

  useEffect(() => {
    evaluate();
    const id = window.setInterval(evaluate, 8000);
    return () => window.clearInterval(id);
  }, [evaluate]);

  useEffect(() => {
    const onForce = () => {
      if (isStandaloneDisplay() || isPwaMarkedInstalled()) return;
      if (isIosSafari()) {
        setVariant("ios");
        setVisible(true);
        return;
      }
      if (getDeferredInstallPrompt()) {
        setVariant("android");
        setVisible(true);
      }
    };
    window.addEventListener("nexa-pwa-force-install-prompt", onForce);
    return () => window.removeEventListener("nexa-pwa-force-install-prompt", onForce);
  }, []);

  const onInstall = async () => {
    const promptEvent = getDeferredInstallPrompt();
    if (!promptEvent) return;
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    clearDeferredInstallPrompt();
    setVisible(false);
    if (choice.outcome === "accepted") {
      markPwaInstalled();
      setSuccess(true);
    }
  };

  const onDismiss = () => {
    dismissInstallPrompt();
    setVisible(false);
  };

  const shellClass = cn(
    "fixed inset-x-0 z-[60] px-3 md:px-6",
    "bottom-[calc(4.5rem+env(safe-area-inset-bottom))] md:bottom-6",
  );

  if (success) {
    return (
      <div className={shellClass}>
        <div className="mx-auto max-w-md">
          <InstallSuccessToast />
        </div>
      </div>
    );
  }

  if (!visible || !variant) return null;

  return (
    <div className={shellClass}>
      <div className="mx-auto max-w-md">
        <InstallAppSheet
          variant={variant}
          onInstall={variant === "android" ? onInstall : undefined}
          onDismiss={onDismiss}
        />
      </div>
    </div>
  );
}
