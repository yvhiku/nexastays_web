"use client";

import React, { useEffect, useState } from "react";
import { Check, Download } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  canOfferInstallFromSettings,
  isIosSafari,
  isPwaMarkedInstalled,
  isStandaloneDisplay,
  markPwaInstalled,
} from "@/lib/pwa-engagement";
import {
  clearDeferredInstallPrompt,
  getDeferredInstallPrompt,
  subscribeDeferredInstallPrompt,
} from "@/lib/pwa-install-prompt";
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

  useEffect(() => {
    setIos(isIosSafari());
    const refresh = () => {
      setInstalled(isStandaloneDisplay() || isPwaMarkedInstalled());
      setHasDeferred(Boolean(getDeferredInstallPrompt()));
    };
    refresh();
    const unsub = subscribeDeferredInstallPrompt(refresh);
    const onInstalled = () => {
      markPwaInstalled();
      clearDeferredInstallPrompt();
      refresh();
      setShowGuide(false);
    };
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      unsub();
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const onInstallClick = async () => {
    if (ios) {
      setShowGuide(true);
      window.dispatchEvent(new Event("nexa-pwa-force-install-prompt"));
      return;
    }
    const promptEvent = getDeferredInstallPrompt();
    if (promptEvent) {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      clearDeferredInstallPrompt();
      if (choice.outcome === "accepted") {
        markPwaInstalled();
        setInstalled(true);
        setShowGuide(false);
      }
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
        onClick={onInstallClick}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-nexa-primary px-4 text-sm font-semibold text-white"
      >
        <Download className="h-4 w-4" aria-hidden />
        {t("pwa.appInstall")}
      </button>
      {showGuide && ios ? <InstallAppSheet variant="ios" showDismiss={false} /> : null}
    </section>
  );
}
