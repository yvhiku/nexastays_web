export const APP_LOCALES = ["en", "fr", "ar"] as const;
export type AppLocale = (typeof APP_LOCALES)[number];

/** True when path already starts with /en, /fr, or /ar */
export function hasLocalePrefix(path: string): boolean {
  return APP_LOCALES.some(
    (loc) => path === `/${loc}` || path.startsWith(`/${loc}/`),
  );
}

/**
 * Safe same-origin relative path for post-login redirects.
 * Rejects protocol-relative URLs, backslashes, and non-path values.
 */
export function isSafeAppPath(path: string): boolean {
  if (!path || typeof path !== "string") return false;
  const trimmed = path.trim();
  if (!trimmed.startsWith("/")) return false;
  if (trimmed.startsWith("//")) return false;
  if (trimmed.includes("\\")) return false;
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) return false;
  try {
    const url = new URL(trimmed, "https://nexa.local");
    if (url.origin !== "https://nexa.local") return false;
    if (url.username || url.password) return false;
  } catch {
    return false;
  }
  return true;
}

/** Prefix path with locale unless it already has one (avoids /en/en/...). */
export function resolveLocalizedPath(path: string, locale: string): string {
  if (!isSafeAppPath(path)) {
    return `/${locale}`;
  }
  const p = path.startsWith("/") ? path : `/${path}`;
  if (hasLocalePrefix(p)) return p;
  if (p === "/") return `/${locale}`;
  return `/${locale}${p}`;
}

export function localeFromPathname(pathname: string): AppLocale {
  const match = pathname.match(/^\/(en|fr|ar)(\/|$)/);
  return (match?.[1] as AppLocale | undefined) ?? "en";
}
