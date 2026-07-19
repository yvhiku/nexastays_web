"use client";

import React, { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  isPwaWelcomeSeen,
  isStandaloneDisplay,
  markPwaInstalled,
  markPwaWelcomeSeen,
} from "@/lib/pwa-engagement";

/** One-time welcome after opening the installed / standalone app. */
export function PwaWelcome() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isStandaloneDisplay()) return;
    if (isPwaWelcomeSeen()) return;
    markPwaInstalled();
    setOpen(true);
  }, []);

  if (!open) return null;

  const onContinue = () => {
    markPwaWelcomeSeen();
    setOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div
        className="w-full max-w-md rounded-2xl border border-nexa-line bg-white p-6 shadow-nexa-lg"
        role="dialog"
        aria-label={t("pwa.welcomeTitle")}
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-nexa-primary to-nexa-primary-dark text-2xl font-bold text-white">
          N
        </div>
        <h2 className="text-center text-lg font-semibold text-nexa-ink">{t("pwa.welcomeTitle")}</h2>
        <ul className="mt-4 space-y-2 text-sm text-nexa-ink-2">
          {(
            ["welcomeBenefitFast", "welcomeBenefitOffline", "welcomeBenefitWishlist"] as const
          ).map((key) => (
            <li key={key} className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-nexa-primary" aria-hidden />
              {t(`pwa.${key}`)}
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={onContinue}
          className="mt-6 flex h-12 w-full items-center justify-center rounded-xl bg-nexa-primary text-sm font-semibold text-white"
        >
          {t("pwa.welcomeContinue")}
        </button>
      </div>
    </div>
  );
}
