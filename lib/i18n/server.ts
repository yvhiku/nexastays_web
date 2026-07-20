import type { Locale, Translations } from "@/lib/i18n";
import { DEFAULT_LOCALE, t as translate, formatMessage } from "@/lib/i18n";
import en from "@/lib/i18n/locales/en.json";
import fr from "@/lib/i18n/locales/fr.json";
import ar from "@/lib/i18n/locales/ar.json";

const VALID_LOCALES = ["en", "fr", "ar"] as const;

const LOCALE_BUNDLES: Record<Locale, Translations> = {
  en: en as Translations,
  fr: fr as Translations,
  ar: ar as Translations,
};

export function getLocaleBundle(locale: Locale): Translations {
  return LOCALE_BUNDLES[locale] ?? LOCALE_BUNDLES[DEFAULT_LOCALE];
}

export function getServerLocale(raw: string | undefined): Locale {
  if (raw && VALID_LOCALES.includes(raw as (typeof VALID_LOCALES)[number])) {
    return raw as Locale;
  }
  return DEFAULT_LOCALE;
}

export type ServerT = (key: string) => string;

export type ServerTranslations = {
  locale: Locale;
  isRtl: boolean;
  t: ServerT;
  tf: (key: string, vars?: Record<string, string | number>) => string;
  localePath: (path: string) => string;
};

export function getServerTranslations(locale: Locale): ServerTranslations {
  const current = LOCALE_BUNDLES[locale] ?? LOCALE_BUNDLES[DEFAULT_LOCALE];
  const fallback = LOCALE_BUNDLES[DEFAULT_LOCALE];

  const t: ServerT = (key: string) => {
    const msg = translate(current, key);
    if (msg === key) return translate(fallback, key);
    return msg;
  };

  const tf = (key: string, vars?: Record<string, string | number>) =>
    formatMessage(t(key), vars);

  const localePath = (path: string) => {
    const p = path.startsWith("/") ? path : `/${path}`;
    if (p === "/") return `/${locale}`;
    return `/${locale}${p}`;
  };

  return {
    locale,
    isRtl: locale === "ar",
    t,
    tf,
    localePath,
  };
}

/** Rich text for server components ({em} tags, newlines). */
export function renderRichText(text: string): string {
  return formatMessage(text);
}
