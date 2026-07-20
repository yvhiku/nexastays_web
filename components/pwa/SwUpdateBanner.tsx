"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";
import { PWA_ICONS } from "@/lib/pwa-assets";
import {
  applyWaitingWorker,
  clearStaleRuntimeCaches,
  pollForUpdates,
  watchForWaiting,
} from "@/lib/pwa-sw-update";
import { cn } from "@/lib/utils";

const FALLBACK_RELOAD_MS = 2000;

export function SwUpdateBanner() {
  const { t } = useLanguage();
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const [applying, setApplying] = useState(false);
  const reloading = useRef(false);

  useEffect(() => {
    const unwatch = watchForWaiting(setWaiting);
    const unpoll = pollForUpdates(60_000);

    const onControllerChange = () => {
      if (reloading.current) return;
      reloading.current = true;
      void clearStaleRuntimeCaches().finally(() => {
        window.location.reload();
      });
    };
    navigator.serviceWorker?.addEventListener("controllerchange", onControllerChange);

    return () => {
      unwatch();
      unpoll();
      navigator.serviceWorker?.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  const onUpdateNow = () => {
    if (!waiting || applying) return;
    setApplying(true);
    applyWaitingWorker(waiting);
    window.setTimeout(() => {
      if (reloading.current) return;
      reloading.current = true;
      void clearStaleRuntimeCaches().finally(() => {
        window.location.reload();
      });
    }, FALLBACK_RELOAD_MS);
  };

  if (!waiting) return null;

  return (
    <div
      className="fixed inset-x-0 top-[calc(72px+env(safe-area-inset-top))] z-[70] flex justify-center px-3"
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
              src={PWA_ICONS.icon192}
              alt=""
              width={40}
              height={40}
              className="h-full w-full object-contain"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-nexa-ink">{t("pwa.updateTitle")}</p>
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
                onClick={onUpdateNow}
              >
                {applying ? t("pwa.updateApplyingShort") : t("pwa.updateNow")}
              </button>
              {!applying ? (
                <button
                  type="button"
                  className="min-h-[44px] rounded-xl px-3 py-2 text-xs font-medium text-nexa-ink-3 active:scale-95"
                  onClick={() => setWaiting(null)}
                >
                  {t("pwa.updateDismiss")}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
