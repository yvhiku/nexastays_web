"use client";

import React, { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Share2, Home, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProductGuidanceOptional } from "@/components/guidance/ProductGuidanceProvider";
import { BottomSheet } from "@/components/mobile/BottomSheet";
import { SheetHeader } from "@/components/mobile/SheetHeader";
import {
  isIosSafari,
  isPwaMarkedInstalled,
  isStandaloneDisplay,
} from "@/lib/pwa-engagement";
import { isAndroidBrowser } from "@/lib/pwa-platform";
import {
  getInstallPhase,
  noteInstallPromptShown,
  requestInstallPrompt,
  subscribeInstallPhase,
} from "@/lib/pwa-install-state";
import { getDeferredInstallPrompt } from "@/lib/pwa-install-prompt";
import { PWA_ICONS, PWA_LOGO } from "@/lib/pwa-assets";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const BANNER_H_PX = 56;
const DISMISS_KEY = "nexa-get-app-banner-dismissed-until";
const DISMISS_MS = 7 * 24 * 60 * 60 * 1000;

function isBannerDismissed(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const until = Number(raw);
    return Number.isFinite(until) && Date.now() < until;
  } catch {
    return false;
  }
}

function dismissBanner() {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_MS));
  } catch {
    /* ignore */
  }
}

/** Cleared by NexaDebug.reset via engagement reset helper. */
export function clearGetAppBannerDismiss() {
  try {
    localStorage.removeItem(DISMISS_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Airbnb-style “Get the app” smart banner (mobile browser only).
 * Android → native install SM; iOS → Share / Add to Home Screen sheet.
 */
export function GetAppBanner() {
  const { t } = useLanguage();
  const guidance = useProductGuidanceOptional();
  const [visible, setVisible] = useState(false);
  const [iosSheet, setIosSheet] = useState(false);
  const [androidHelp, setAndroidHelp] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ios, setIos] = useState(false);

  const evaluate = useCallback(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(min-width: 768px)").matches) {
      setVisible(false);
      return;
    }
    if (isStandaloneDisplay() || isPwaMarkedInstalled()) {
      setVisible(false);
      return;
    }
    if (getInstallPhase() === "INSTALLED" || getInstallPhase() === "ACCEPTED") {
      setVisible(false);
      return;
    }
    if (isBannerDismissed()) {
      setVisible(false);
      return;
    }
    // Don’t stack over the in-flow install tip
    if (guidance?.activeGuideId === "install_app" || guidance?.activeGuideId === "install_success") {
      setVisible(false);
      return;
    }
    setIos(isIosSafari());
    setVisible(true);
  }, [guidance?.activeGuideId]);

  useEffect(() => {
    evaluate();
    const unsub = subscribeInstallPhase(evaluate);
    const onResize = () => evaluate();
    window.addEventListener("resize", onResize);
    window.addEventListener("nexa-pwa-engagement-changed", evaluate);
    window.addEventListener("nexa-debug-reset", evaluate);
    return () => {
      unsub();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("nexa-pwa-engagement-changed", evaluate);
      window.removeEventListener("nexa-debug-reset", evaluate);
    };
  }, [evaluate]);

  useEffect(() => {
    const root = document.documentElement;
    if (visible) {
      root.style.setProperty(
        "--nexa-app-banner-h",
        `calc(${BANNER_H_PX}px + env(safe-area-inset-top, 0px))`,
      );
      root.dataset.nexaAppBanner = "1";
    } else {
      root.style.setProperty("--nexa-app-banner-h", "0px");
      delete root.dataset.nexaAppBanner;
    }
    return () => {
      root.style.setProperty("--nexa-app-banner-h", "0px");
      delete root.dataset.nexaAppBanner;
    };
  }, [visible]);

  const onDismiss = () => {
    dismissBanner();
    setVisible(false);
    setIosSheet(false);
    setAndroidHelp(false);
    trackEvent("install_prompt_cancelled", { source: "get_app_banner" });
  };

  const onUseApp = async () => {
    noteInstallPromptShown();
    trackEvent("install_prompt_clicked", { source: "get_app_banner" });

    if (ios || isIosSafari()) {
      setIosSheet(true);
      return;
    }

    // Android / Chromium: native install flow
    if (getDeferredInstallPrompt() || isAndroidBrowser()) {
      setBusy(true);
      const outcome = await requestInstallPrompt();
      setBusy(false);
      if (outcome === "accepted") {
        setVisible(false);
        return;
      }
      if (outcome === "unavailable" || outcome === "failed") {
        setAndroidHelp(true);
      }
      return;
    }

    setAndroidHelp(true);
  };

  if (!visible) return null;

  return (
    <>
      <div
        className={cn(
          "fixed inset-x-0 top-0 z-[60] md:hidden",
          "border-b border-nexa-line bg-white",
          "pt-[env(safe-area-inset-top)]",
        )}
        role="region"
        aria-label={t("pwa.getAppTitle")}
      >
        <div
          className="flex h-[56px] items-center gap-2 px-2.5 sm:px-3"
          style={{ minHeight: BANNER_H_PX }}
        >
          <button
            type="button"
            onClick={onDismiss}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-nexa-ink-4 hover:bg-nexa-bg-2 active:scale-95"
            aria-label={t("common.close")}
          >
            <X className="h-4 w-4" strokeWidth={2.5} />
          </button>

          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-nexa-line bg-white shadow-sm">
            <Image
              src={PWA_ICONS.icon192}
              alt=""
              width={40}
              height={40}
              className="h-full w-full object-contain p-1"
            />
          </div>

          <div className="min-w-0 flex-1 pe-1">
            <p className="truncate text-sm font-semibold leading-tight text-nexa-ink">
              {t("pwa.getAppTitle")}
            </p>
            <p className="truncate text-xs leading-tight text-nexa-ink-3">
              {t("pwa.getAppSubtitle")}
            </p>
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={() => void onUseApp()}
            className={cn(
              "shrink-0 rounded-full bg-nexa-primary px-4 py-2 text-xs font-semibold text-white",
              "hover:bg-nexa-primary-dark active:scale-95 disabled:opacity-70",
            )}
          >
            {busy ? t("common.loading") : t("pwa.getAppCta")}
          </button>
        </div>
      </div>

      <BottomSheet open={iosSheet} onOpenChange={setIosSheet} ariaLabel={t("pwa.installIosSubtitle")} zIndexClassName="z-[80]">
        <SheetHeader title={t("pwa.getAppTitle")} onClose={() => setIosSheet(false)} />
        <p className="mb-4 text-sm text-nexa-ink-3">{t("pwa.installIosSubtitle")}</p>
        <ol className="mb-4 space-y-3">
          <li className="flex items-start gap-3 rounded-xl border border-nexa-line bg-nexa-bg-2/50 p-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
              <Share2 className="h-5 w-5 text-nexa-primary" aria-hidden />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-nexa-ink-4">1</p>
              <p className="text-sm font-medium text-nexa-ink">{t("pwa.installIosStep1")}</p>
            </div>
          </li>
          <li className="flex items-start gap-3 rounded-xl border border-nexa-line bg-nexa-bg-2/50 p-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
              <Home className="h-5 w-5 text-nexa-primary" aria-hidden />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-nexa-ink-4">2</p>
              <p className="text-sm font-medium text-nexa-ink">{t("pwa.installIosStep2")}</p>
            </div>
          </li>
        </ol>
        <div className="mb-2 flex justify-center">
          <div className="relative h-14 w-14 overflow-hidden rounded-2xl border border-nexa-line">
            <Image src={PWA_LOGO} alt="" fill sizes="56px" className="object-contain p-1" />
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIosSheet(false)}
          className="mt-2 flex h-12 w-full items-center justify-center rounded-xl bg-nexa-primary text-sm font-semibold text-white active:scale-[0.99]"
        >
          {t("common.gotIt")}
        </button>
      </BottomSheet>

      <BottomSheet
        open={androidHelp}
        onOpenChange={setAndroidHelp}
        ariaLabel={t("pwa.installAndroidLead")}
        zIndexClassName="z-[80]"
      >
        <SheetHeader title={t("pwa.getAppTitle")} onClose={() => setAndroidHelp(false)} />
        <p className="mb-3 text-sm text-nexa-ink-3">{t("pwa.androidMenuHint")}</p>
        <button
          type="button"
          onClick={() => {
            setAndroidHelp(false);
            window.dispatchEvent(new Event("nexa-guidance-install-eligible"));
          }}
          className="mb-2 flex h-12 w-full items-center justify-center rounded-xl bg-nexa-primary text-sm font-semibold text-white"
        >
          {t("pwa.installCta")}
        </button>
        <button
          type="button"
          onClick={() => setAndroidHelp(false)}
          className="flex h-11 w-full items-center justify-center rounded-xl text-sm font-medium text-nexa-ink-3"
        >
          {t("pwa.installNotNow")}
        </button>
      </BottomSheet>
    </>
  );
}
