/** Service worker update helpers for SwUpdateBanner. */

const IMAGE_CACHE_HINTS = ["static-image", "image", "pages", "start-url"];

/** Unregister all service workers (dev/QA recovery). */
export async function unregisterAllServiceWorkers(): Promise<number> {
  if (!("serviceWorker" in navigator)) return 0;
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.all(regs.map((r) => r.unregister()));
  return regs.length;
}

/**
 * Dev-only: if the PWA fallback script is HTML (broken .next / stale SW), unregister and reload once.
 */
export async function recoverBrokenDevServiceWorker(): Promise<void> {
  if (process.env.NODE_ENV !== "development") return;
  if (!("serviceWorker" in navigator)) return;
  if (sessionStorage.getItem("nexa-sw-recovery") === "1") return;

  let broken = false;
  try {
    const res = await fetch("/fallback-development.js", { cache: "no-store" });
    const contentType = res.headers.get("content-type") ?? "";
    broken = !res.ok || !contentType.includes("javascript");
  } catch {
    broken = true;
  }

  if (!broken) return;

  const removed = await unregisterAllServiceWorkers();
  if (removed === 0) return;

  sessionStorage.setItem("nexa-sw-recovery", "1");
  window.location.reload();
}

export async function clearStaleRuntimeCaches(): Promise<void> {
  if (typeof caches === "undefined") return;
  try {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((k) => IMAGE_CACHE_HINTS.some((h) => k.toLowerCase().includes(h)))
        .map((k) => caches.delete(k)),
    );
  } catch {
    /* ignore */
  }
}

export function applyWaitingWorker(worker: ServiceWorker): void {
  worker.postMessage({ type: "SKIP_WAITING" });
}

export type WaitingListener = (worker: ServiceWorker | null) => void;

/** Watch registration for a waiting worker; returns cleanup. */
export function watchForWaiting(onWaiting: WaitingListener): () => void {
  if (!("serviceWorker" in navigator)) return () => undefined;

  let reg: ServiceWorkerRegistration | undefined;
  let cancelled = false;

  const trackWaiting = (worker: ServiceWorker | null | undefined) => {
    if (cancelled) return;
    if (worker && worker.state === "installed" && navigator.serviceWorker.controller) {
      onWaiting(worker);
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

  return () => {
    cancelled = true;
    reg?.removeEventListener("updatefound", onUpdateFound);
  };
}

/** Poll for SW updates while tab is visible. */
export function pollForUpdates(intervalMs = 60_000): () => void {
  if (!("serviceWorker" in navigator)) return () => undefined;

  let timer: number | null = null;

  const tick = () => {
    navigator.serviceWorker.ready
      .then((r) => r.update())
      .catch(() => undefined);
  };

  const start = () => {
    if (timer != null) return;
    tick();
    timer = window.setInterval(tick, intervalMs);
  };

  const stop = () => {
    if (timer != null) {
      window.clearInterval(timer);
      timer = null;
    }
  };

  const onVis = () => {
    if (document.visibilityState === "visible") {
      tick();
      start();
    } else {
      stop();
    }
  };

  start();
  document.addEventListener("visibilitychange", onVis);
  return () => {
    stop();
    document.removeEventListener("visibilitychange", onVis);
  };
}
