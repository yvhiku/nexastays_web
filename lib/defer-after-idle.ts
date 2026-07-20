/** Schedule work after first paint using requestIdleCallback with a timeout fallback. */

export type IdleOptions = {
  timeoutMs?: number;
};

export function runAfterIdle(fn: () => void, options: IdleOptions = {}): void {
  if (typeof window === "undefined") return;
  const timeoutMs = options.timeoutMs ?? 3000;

  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(() => fn(), { timeout: timeoutMs });
    return;
  }

  globalThis.setTimeout(fn, Math.min(timeoutMs, 1500));
}

export function runAfterFirstPaint(fn: () => void, options: IdleOptions = {}): void {
  if (typeof window === "undefined") return;

  const run = () => runAfterIdle(fn, options);

  if (document.readyState === "complete") {
    run();
    return;
  }

  window.addEventListener("load", run, { once: true });
}
