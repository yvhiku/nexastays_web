"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";
import { PWA_LOGO } from "@/lib/pwa-assets";
import {
  applyServiceWorkerUpdate,
  dismissSwBuild,
  fetchRemoteSwBuildId,
  pollForUpdates,
  reloadAfterServiceWorkerUpdate,
  watchForWaiting,
} from "@/lib/pwa-sw-update";
import { isKycFlowActive } from "@/lib/registration-step-store";
import { cn } from "@/lib/utils";
import { OverlayPortal } from "@/components/ui/OverlayPortal";

export function SwUpdateBanner() {
  const { t } = useLanguage();
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const [applying, setApplying] = useState(false);
  const reloading = useRef(false);

  const safeReload = () => {
    if (reloading.current) return;
    if (isKycFlowActive()) return;
    if (window.location.pathname.includes("/registration")) return;
    reloading.current = true;
    void reloadAfterServiceWorkerUpdate();
  };

  useEffect(() => {
    const unwatch = watchForWaiting(setWaiting);
    const unpoll = pollForUpdates(60_000);

    const onControllerChange = () => safeReload();
    navigator.serviceWorker?.addEventListener("controllerchange", onControllerChange);

    return () => {
      unwatch();
      unpoll();
      navigator.serviceWorker?.removeEventListener(
        "controllerchange",
        onControllerChange,
      );
    };
  }, []);

  const onUpdateNow = async () => {
    if (!waiting || applying) return;
    setApplying(true);
    try {
      const result = await applyServiceWorkerUpdate(waiting);
      if (result === "activated" || result === "timeout") {
        safeReload();
      } else {
        setApplying(false);
      }
    } catch {
      setApplying(false);
    }
  };

  const onDismiss = async () => {
    const buildId = await fetchRemoteSwBuildId();
    if (buildId) dismissSwBuild(buildId);
    setWaiting(null);
  };

  if (!waiting) return null;

  return (
    <OverlayPortal layer="toast">
      <div
        className="fixed inset-x-0 z-layer-toast flex justify-center px-3 nexa-sw-update-banner"
        role="status"
        aria-live="polite"
      >
        <div
          className={cn(
            "w-full max-w-md rounded-2xl border border-nexa-line bg-white/95 p-4 shadow-nexa-lg backdrop-blur-md",
            "animate-in fade-in zoom-in-95 duration-200",
          )}
        >
          <div className="flex items-start gap-3">
            <div className="relative h-10 w-10 shrink-0 overflow-hidden">
              <Image
                src={PWA_LOGO}
                alt=""
                width={40}
                height={40}
                className="h-full w-full object-contain"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-nexa-ink">
                {t("pwa.updateTitle")}
              </p>
              <p className="mt-0.5 text-xs text-nexa-ink-3">
                {applying ? t("pwa.updateApplying") : t("pwa.updateBody")}
              </p>
              {applying ? (
                <p className="mt-1 text-[11px] leading-snug text-nexa-ink-4">
                  {t("pwa.updateIconTip")}
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={applying}
                  className="min-h-[44px] rounded-xl bg-nexa-primary px-4 py-2 text-xs font-semibold text-white active:scale-95 disabled:opacity-70"
                  onClick={() => void onUpdateNow()}
                >
                  {applying ? t("pwa.updateApplyingShort") : t("pwa.updateNow")}
                </button>
                {!applying ? (
                  <button
                    type="button"
                    className="min-h-[44px] rounded-xl px-3 py-2 text-xs font-medium text-nexa-ink-3 active:scale-95"
                    onClick={() => void onDismiss()}
                  >
                    {t("pwa.updateDismiss")}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </OverlayPortal>
  );
}
