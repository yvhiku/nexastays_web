import { isStandaloneDisplay } from "@/lib/pwa-engagement";

const VIEWPORT_LOCK =
  "width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no, viewport-fit=cover";

/** Lock pinch/double-tap zoom in installed PWA (iOS home screen + Android standalone). */
export function applyPwaZoomLock(): () => void {
  if (typeof document === "undefined" || !isStandaloneDisplay()) {
    return () => {
      //
    };
  }

  const meta = document.querySelector('meta[name="viewport"]');
  const previousContent = meta?.getAttribute("content") ?? null;
  if (meta) {
    meta.setAttribute("content", VIEWPORT_LOCK);
  }
  document.documentElement.setAttribute("data-pwa-zoom-lock", "1");

  const preventGesture = (event: Event) => {
    event.preventDefault();
  };
  document.addEventListener("gesturestart", preventGesture, { passive: false });
  document.addEventListener("gesturechange", preventGesture, { passive: false });
  document.addEventListener("gestureend", preventGesture, { passive: false });

  return () => {
    if (meta && previousContent !== null) {
      meta.setAttribute("content", previousContent);
    }
    document.documentElement.removeAttribute("data-pwa-zoom-lock");
    document.removeEventListener("gesturestart", preventGesture);
    document.removeEventListener("gesturechange", preventGesture);
    document.removeEventListener("gestureend", preventGesture);
  };
}
