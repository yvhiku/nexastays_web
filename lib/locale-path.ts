export const APP_LOCALES = ["en", "fr", "ar"] as const;
export type AppLocale = (typeof APP_LOCALES)[number];

/** True when path already starts with /en, /fr, or /ar */
export function hasLocalePrefix(path: string): boolean {
  return APP_LOCALES.some(
    (loc) => path === `/${loc}` || path.startsWith(`/${loc}/`),
  );
}

/** Prefix path with locale unless it already has one (avoids /en/en/...). */
export function resolveLocalizedPath(path: string, locale: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (hasLocalePrefix(p)) return p;
  if (p === "/") return `/${locale}`;
  return `/${locale}${p}`;
}

export function localeFromPathname(pathname: string): AppLocale {
  const match = pathname.match(/^\/(en|fr|ar)(\/|$)/);
  return (match?.[1] as AppLocale | undefined) ?? "en";
}
