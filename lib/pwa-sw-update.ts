/** Service worker update helpers for SwUpdateBanner. */

const IMAGE_CACHE_HINTS = ["static-image", "image", "pages", "start-url"];

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
