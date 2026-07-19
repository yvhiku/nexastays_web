"use client";

import React, { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

export function SwUpdateBanner() {
  const { t } = useLanguage();
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    let reg: ServiceWorkerRegistration | undefined;
    let cancelled = false;

    const trackWaiting = (worker: ServiceWorker | null | undefined) => {
      if (!worker || cancelled) return;
      if (worker.state === "installed" && navigator.serviceWorker.controller) {
        setWaiting(worker);
      }
    };

    const onUpdateFound = () => {
      const sw = reg?.installing;
      if (!sw) return;
      sw.addEventListener("statechange", () => trackWaiting(sw));
    };

    navigator.serviceWorker.ready.then((r) => {
      if (cancelled) return;
      reg = r;
      if (r.waiting) trackWaiting(r.waiting);
      r.addEventListener("updatefound", onUpdateFound);
    });

    const onControllerChange = () => {
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    return () => {
      cancelled = true;
      reg?.removeEventListener("updatefound", onUpdateFound);
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  if (!waiting) return null;

  return (
    <div
      className="fixed inset-x-0 top-[calc(72px+env(safe-area-inset-top))] z-[70] flex justify-center px-3"
      role="status"
    >
      <div className="w-full max-w-md rounded-2xl border border-nexa-line bg-white p-4 shadow-nexa-lg">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-nexa-primary to-nexa-primary-dark text-sm font-bold text-white">
            N
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-nexa-ink">{t("pwa.updateTitle")}</p>
            <p className="mt-0.5 text-xs text-nexa-ink-3">{t("pwa.updateBody")}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-xl bg-nexa-primary px-4 py-2 text-xs font-semibold text-white"
                onClick={() => waiting.postMessage({ type: "SKIP_WAITING" })}
              >
                {t("pwa.updateNow")}
              </button>
              <button
                type="button"
                className="rounded-xl px-3 py-2 text-xs font-medium text-nexa-ink-3"
                onClick={() => setWaiting(null)}
              >
                {t("pwa.updateDismiss")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
