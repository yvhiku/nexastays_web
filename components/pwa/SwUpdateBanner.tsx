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

  const onUpdate = () => {
    waiting.postMessage({ type: "SKIP_WAITING" });
  };

  return (
    <div
      className="fixed inset-x-0 top-[calc(72px+env(safe-area-inset-top))] z-[70] flex justify-center px-3"
      role="status"
    >
      <div className="flex w-full max-w-lg items-center justify-between gap-3 rounded-2xl border border-nexa-line bg-nexa-ink px-4 py-3 text-white shadow-nexa-md">
        <p className="text-sm font-medium">{t("pwa.updateAvailable")}</p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            className="rounded-lg bg-white/15 px-3 py-1.5 text-xs font-semibold"
            onClick={() => setWaiting(null)}
          >
            {t("pwa.updateLater")}
          </button>
          <button
            type="button"
            className="rounded-lg bg-nexa-primary px-3 py-1.5 text-xs font-semibold"
            onClick={onUpdate}
          >
            {t("pwa.updateNow")}
          </button>
        </div>
      </div>
    </div>
  );
}
