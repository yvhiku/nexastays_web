/** Service worker update helpers for SwUpdateBanner. */

const STALE_CACHE_HINTS = [
  "static-image",
  "image",
  "pages",
  "start-url",
  "nexa-offline",
  "google-fonts",
  "static-font",
  "workbox",
  // Removed in Phase F: it could contain authenticated API responses.
  "apis",
];

const APPLIED_BUILD_KEY = "nexa-sw-applied-build";
const DISMISSED_BUILD_KEY = "nexa-sw-dismissed-build";
const SW_SCRIPT_PATH = "/nexa-sw.js";

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
    const res = await fetch("/fallback-development.js", {
      cache: "no-store",
      signal: AbortSignal.timeout(3_000),
    });
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

/** Remove legacy next-pwa / workbox workers that block nexa-sw activation. */
export async function unregisterLegacyServiceWorkers(): Promise<number> {
  if (!("serviceWorker" in navigator)) return 0;
  const regs = await navigator.serviceWorker.getRegistrations();
  let removed = 0;
  for (const reg of regs) {
    const scriptUrl =
      reg.waiting?.scriptURL ??
      reg.installing?.scriptURL ??
      reg.active?.scriptURL ??
      "";
    const isNexaSw = scriptUrl.includes("nexa-sw.js");
    const isLegacy =
      scriptUrl.includes("workbox") ||
      (/\/sw\.js(\?|$)/.test(scriptUrl) && !scriptUrl.includes("nexa-sw.js"));
    if (!isNexaSw && isLegacy) {
      const ok = await reg.unregister();
      if (ok) removed += 1;
    }
  }
  return removed;
}

export async function clearStaleRuntimeCaches(): Promise<void> {
  if (typeof caches === "undefined") return;
  try {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((k) => STALE_CACHE_HINTS.some((h) => k.toLowerCase().includes(h)))
        .map((k) => caches.delete(k)),
    );
  } catch {
    /* ignore */
  }
}

/** Remove legacy caches that may contain authenticated API responses. */
export async function clearSensitiveRuntimeCaches(): Promise<void> {
  if (typeof caches === "undefined") return;
  try {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((key) => key.toLowerCase().includes("apis"))
        .map((key) => caches.delete(key)),
    );
  } catch {
    /* cache cleanup must never block authentication recovery */
  }
}

export function applyWaitingWorker(worker: ServiceWorker): void {
  worker.postMessage({ type: "SKIP_WAITING" });
}

/** Parse SW_BUILD_ID from the deployed nexa-sw.js (must not be cached). */
export async function fetchRemoteSwBuildId(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  try {
    const res = await fetch(SW_SCRIPT_PATH, {
      cache: "no-store",
      credentials: "same-origin",
    });
    if (!res.ok) return null;
    const text = await res.text();
    const match = text.match(/SW_BUILD_ID\s*=\s*["']([^"']+)["']/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

export function getAppliedSwBuildId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(APPLIED_BUILD_KEY);
  } catch {
    return null;
  }
}

export function markSwBuildApplied(buildId: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(APPLIED_BUILD_KEY, buildId);
    sessionStorage.removeItem(DISMISSED_BUILD_KEY);
  } catch {
    //
  }
}

export function dismissSwBuild(buildId: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(DISMISSED_BUILD_KEY, buildId);
  } catch {
    //
  }
}

export function isSwBuildDismissed(buildId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(DISMISSED_BUILD_KEY) === buildId;
  } catch {
    return false;
  }
}

export type SwUpdateApplyResult = "activated" | "timeout" | "none";

/**
 * Activate the waiting worker and wait for controllerchange (or timeout).
 */
export async function applyServiceWorkerUpdate(
  waiting: ServiceWorker,
  timeoutMs = 5_000,
): Promise<SwUpdateApplyResult> {
  if (!("serviceWorker" in navigator)) return "none";

  const remoteBuild = await fetchRemoteSwBuildId();
  if (remoteBuild) markSwBuildApplied(remoteBuild);

  return new Promise((resolve) => {
    let settled = false;
    const finish = (result: SwUpdateApplyResult) => {
      if (settled) return;
      settled = true;
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange,
      );
      resolve(result);
    };

    const onControllerChange = () => finish("activated");

    navigator.serviceWorker.addEventListener(
      "controllerchange",
      onControllerChange,
    );
    applyWaitingWorker(waiting);

    window.setTimeout(() => finish("timeout"), timeoutMs);
  });
}

export async function reloadAfterServiceWorkerUpdate(): Promise<void> {
  await clearStaleRuntimeCaches();
  window.location.reload();
}

export type WaitingListener = (worker: ServiceWorker | null) => void;

/** Watch registration for a waiting worker; returns cleanup. */
export function watchForWaiting(onWaiting: WaitingListener): () => void {
  if (!("serviceWorker" in navigator)) return () => undefined;

  let reg: ServiceWorkerRegistration | undefined;
  let cancelled = false;

  const shouldPromptForWaiting = async (
    worker: ServiceWorker | null | undefined,
  ): Promise<boolean> => {
    if (!worker || worker.state !== "installed") return false;
    if (!navigator.serviceWorker.controller) return false;

    const remoteBuild = await fetchRemoteSwBuildId();
    if (!remoteBuild) return true;

    const applied = getAppliedSwBuildId();
    if (applied === remoteBuild) {
      // Stale waiting worker from a failed prior update — activate silently once.
      applyWaitingWorker(worker);
      return false;
    }
    if (isSwBuildDismissed(remoteBuild)) return false;
    return true;
  };

  const trackWaiting = async (worker: ServiceWorker | null | undefined) => {
    if (cancelled) return;
    const prompt = await shouldPromptForWaiting(worker);
    onWaiting(prompt ? worker : null);
  };

  const onUpdateFound = () => {
    const sw = reg?.installing;
    if (!sw) return;
    sw.addEventListener("statechange", () => {
      if (sw.state === "installed") void trackWaiting(sw);
    });
  };

  void unregisterLegacyServiceWorkers().then(() => {
    if (cancelled) return;
    navigator.serviceWorker.ready.then((r) => {
      if (cancelled) return;
      reg = r;
      if (r.waiting) void trackWaiting(r.waiting);
      r.addEventListener("updatefound", onUpdateFound);
    });
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
    // Defer first check so mount hydration is not competing with update activation.
    window.setTimeout(tick, 3_000);
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
