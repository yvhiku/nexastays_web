"use client";

import React from "react";
import { Check, Download, Share2, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

type SheetProps = {
  variant: "ios" | "android";
  onInstall?: () => void;
  onDismiss?: () => void;
  showDismiss?: boolean;
  className?: string;
};

/** Shared branded install UI for floating prompt and Profile. */
export function InstallAppSheet({
  variant,
  onInstall,
  onDismiss,
  showDismiss = true,
  className,
}: SheetProps) {
  const { t } = useLanguage();

  return (
    <div
      className={cn(
        "rounded-2xl border border-nexa-line bg-white p-4 shadow-nexa-lg",
        className,
      )}
      role="dialog"
      aria-label={t("pwa.installTitle")}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-nexa-primary to-nexa-primary-dark text-lg font-bold text-white">
          N
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-nexa-ink">{t("pwa.installTitle")}</p>

          {variant === "ios" ? (
            <>
              <p className="mt-1 text-xs text-nexa-ink-3">{t("pwa.installIosSubtitle")}</p>
              <ol className="mt-3 space-y-1.5 text-xs font-medium text-nexa-ink-2">
                <li>1. {t("pwa.installIosStep1")}</li>
                <li>2. {t("pwa.installIosStep2")}</li>
              </ol>
              <div className="mt-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-nexa-bg-2 text-nexa-ink-2">
                <Share2 className="h-5 w-5" aria-hidden />
              </div>
            </>
          ) : (
            <>
              <p className="mt-1 text-xs text-nexa-ink-3">{t("pwa.installAndroidLead")}</p>
              <ul className="mt-3 space-y-1.5 text-xs text-nexa-ink-2">
                {(
                  [
                    "installBenefitNative",
                    "installBenefitFast",
                    "installBenefitOffline",
                    "installBenefitFullscreen",
                  ] as const
                ).map((key) => (
                  <li key={key} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-nexa-primary" aria-hidden />
                    <span>{t(`pwa.${key}`)}</span>
                  </li>
                ))}
              </ul>
              {onInstall ? (
                <button
                  type="button"
                  onClick={onInstall}
                  className="mt-4 inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-nexa-primary px-3 text-sm font-semibold text-white sm:w-auto"
                >
                  <Download className="h-4 w-4" aria-hidden />
                  {t("pwa.installCta")}
                </button>
              ) : null}
            </>
          )}

          {showDismiss && onDismiss ? (
            <button
              type="button"
              onClick={onDismiss}
              className="mt-3 inline-flex h-10 items-center rounded-xl px-1 text-sm font-medium text-nexa-ink-3"
            >
              {t("pwa.installLater")}
            </button>
          ) : null}
        </div>
        {showDismiss && onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-lg p-1 text-nexa-ink-4 hover:bg-nexa-bg-2"
            aria-label={t("common.close")}
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function InstallSuccessToast({ className }: { className?: string }) {
  const { t } = useLanguage();
  return (
    <div
      className={cn(
        "rounded-2xl border border-nexa-line bg-nexa-ink px-4 py-3 text-white shadow-nexa-md",
        className,
      )}
      role="status"
    >
      <p className="flex items-center gap-2 text-sm font-semibold">
        <Check className="h-4 w-4 text-green-300" aria-hidden />
        {t("pwa.installSuccessTitle")}
      </p>
      <p className="mt-1 text-xs text-white/75">{t("pwa.installSuccessBody")}</p>
    </div>
  );
}
