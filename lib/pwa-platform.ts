/** Android Chrome / WebView detection for install UX (not iOS). */
export function isAndroidBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android/i.test(navigator.userAgent);
}

/** True when the browser exposes the native install prompt API. */
export function hasNativeInstallPrompt(): boolean {
  if (typeof window === "undefined") return false;
  return "onbeforeinstallprompt" in window;
}

/** Service worker support — required for a full PWA install (not a browser shortcut). */
export function supportsServiceWorker(): boolean {
  if (typeof window === "undefined") return false;
  return "serviceWorker" in navigator;
}
