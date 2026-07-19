"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Download, Share2, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  dismissInstallPrompt,
  isIosSafari,
  isStandaloneDisplay,
  shouldShowInstallPrompt,
} from "@/lib/pwa-engagement";
import { cn } from "@/lib/utils";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallAppPrompt() {
  const { t } = useLanguage();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [iosTip, setIosTip] = useState(false);

  const evaluate = useCallback(() => {
    if (isStandaloneDisplay()) {
      setVisible(false);
      return;
    }
    if (!shouldShowInstallPrompt()) {
      setVisible(false);
      return;
    }
    if (deferred) {
      setVisible(true);
      setIosTip(false);
      return;
    }
    if (isIosSafari()) {
      setIosTip(true);
      setVisible(true);
    }
  }, [deferred]);

  useEffect(() => {
    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBip);
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  useEffect(() => {
    evaluate();
    const id = window.setInterval(evaluate, 8000);
    return () => window.clearInterval(id);
  }, [evaluate]);

  if (!visible) return null;

  const onInstall = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setVisible(false);
  };

  const onDismiss = () => {
    dismissInstallPrompt();
    setVisible(false);
  };

  return (
    <div
      className={cn(
        "fixed inset-x-0 z-[60] px-3 md:px-6",
        "bottom-[calc(4.5rem+env(safe-area-inset-bottom))] md:bottom-6",
      )}
      role="dialog"
      aria-label={t("pwa.installTitle")}
    >
      <div className="mx-auto max-w-md rounded-2xl border border-nexa-line bg-white p-4 shadow-nexa-lg">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-nexa-primary to-nexa-primary-dark text-lg font-bold text-white">
            N
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-nexa-ink">{t("pwa.installTitle")}</p>
            <p className="mt-0.5 text-xs text-nexa-ink-3">
              {iosTip ? t("pwa.installIosHint") : t("pwa.installBody")}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {!iosTip && deferred && (
                <button
                  type="button"
                  onClick={onInstall}
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-nexa-primary px-3 text-sm font-semibold text-white"
                >
                  <Download className="h-4 w-4" aria-hidden />
                  {t("pwa.installCta")}
                </button>
              )}
              {iosTip && (
                <span className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-nexa-bg-2 px-3 text-xs font-medium text-nexa-ink-2">
                  <Share2 className="h-3.5 w-3.5" aria-hidden />
                  {t("pwa.installIosSteps")}
                </span>
              )}
              <button
                type="button"
                onClick={onDismiss}
                className="inline-flex h-10 items-center rounded-xl px-3 text-sm font-medium text-nexa-ink-3"
              >
                {t("pwa.installLater")}
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-lg p-1 text-nexa-ink-4 hover:bg-nexa-bg-2"
            aria-label={t("common.close")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
