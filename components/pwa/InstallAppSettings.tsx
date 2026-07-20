"use client";

import React, { useEffect, useState } from "react";
import { Check, Download } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  canOfferInstallFromSettings,
  isIosSafari,
  isPwaMarkedInstalled,
  isStandaloneDisplay,
} from "@/lib/pwa-engagement";
import {
  getDeferredInstallPrompt,
  subscribeDeferredInstallPrompt,
} from "@/lib/pwa-install-prompt";
import {
  getInstallPhase,
  requestInstallPrompt,
  subscribeInstallPhase,
} from "@/lib/pwa-install-state";
import { InstallAppSheet } from "@/components/pwa/InstallAppSheet";

/**
 * Profile “App” row: Install App (opens platform UI) or Installed ✓.
 * Available even after the floating prompt was dismissed.
 */
export function InstallAppSettings() {
  const { t } = useLanguage();
  const [installed, setInstalled] = useState(false);
  const [hasDeferred, setHasDeferred] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [ios, setIos] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setIos(isIosSafari());
    const refresh = () => {
      const phase = getInstallPhase();
      setInstalled(
        isStandaloneDisplay() || isPwaMarkedInstalled() || phase === "INSTALLED",
      );
      setPending(phase === "PROMPTING" || phase === "ACCEPTED");
      setHasDeferred(Boolean(getDeferredInstallPrompt()) || phase === "CAN_INSTALL");
    };
    refresh();
    const unsubPrompt = subscribeDeferredInstallPrompt(refresh);
    const unsubPhase = subscribeInstallPhase(refresh);
    return () => {
      unsubPrompt();
      unsubPhase();
    };
  }, []);

  const onInstallClick = async () => {
    if (ios) {
      setShowGuide(true);
      window.dispatchEvent(new Event("nexa-pwa-force-install-prompt"));
      return;
    }
    setPending(true);
    const outcome = await requestInstallPrompt();
    setPending(false);
    if (outcome === "accepted") {
      // Wait for appinstalled → INSTALLED; ACCEPTED already reflected in UI.
      setShowGuide(false);
    }
  };

  if (installed) {
    return (
      <section className="rounded-2xl border border-nexa-line bg-nexa-bg-2/40 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-nexa-ink-4">
          {t("pwa.appSection")}
        </p>
        <div className="mt-2 flex items-center gap-2 text-sm font-medium text-nexa-ink">
          <Check className="h-4 w-4 text-green-600" aria-hidden />
          {t("pwa.appInstalled")}
        </div>
      </section>
    );
  }

  if (!canOfferInstallFromSettings()) return null;
  if (!ios && !hasDeferred) return null;

  return (
    <section className="space-y-3 rounded-2xl border border-nexa-line bg-nexa-bg-2/40 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-nexa-ink-4">
        {t("pwa.appSection")}
      </p>
      <button
        type="button"
        disabled={pending}
        onClick={() => void onInstallClick()}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-nexa-primary px-4 text-sm font-semibold text-white disabled:opacity-70"
      >
        <Download className="h-4 w-4" aria-hidden />
        {t("pwa.appInstall")}
      </button>
      {showGuide && ios ? <InstallAppSheet variant="ios" showDismiss={false} /> : null}
    </section>
  );
}
