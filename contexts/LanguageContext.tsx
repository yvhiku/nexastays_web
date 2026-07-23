"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Locale, Translations } from "@/lib/i18n";
import {
  LOCALES,
  DEFAULT_LOCALE,
  STORAGE_KEY,
  t as translate,
  formatMessage,
} from "@/lib/i18n";

const VALID_LOCALES = ["en", "fr", "ar"] as const;

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
  tf: (key: string, vars?: Record<string, string | number>) => string;
  isRtl: boolean;
  ready: boolean;
  localePath: (path: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

async function loadTranslations(locale: Locale): Promise<Translations> {
  try {
    const mod = await import(`@/lib/i18n/locales/${locale}.json`);
    return mod.default as unknown as Translations;
  } catch {
    const en = await import(`@/lib/i18n/locales/en.json`);
    return en.default as unknown as Translations;
  }
}

export function LanguageProvider({
  children,
  initialLocale,
  initialTranslations,
  initialFallbackTranslations,
}: {
  children: React.ReactNode;
  initialLocale: Locale;
  initialTranslations?: Translations | null;
  initialFallbackTranslations?: Translations | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [translations, setTranslations] = useState<Translations | null>(
    initialTranslations ?? null,
  );
  const [fallbackTranslations, setFallbackTranslations] = useState<Translations | null>(
    initialFallbackTranslations ?? initialTranslations ?? null,
  );
  const [ready, setReady] = useState(Boolean(initialTranslations));

  useEffect(() => {
    const valid = VALID_LOCALES.includes(initialLocale as (typeof VALID_LOCALES)[number]);
    if (valid && initialLocale !== locale) {
      setLocaleState(initialLocale as Locale);
    }
  }, [initialLocale]);

  useEffect(() => {
    if (initialTranslations && locale === initialLocale) {
      setTranslations(initialTranslations);
      setFallbackTranslations(initialFallbackTranslations ?? initialTranslations);
      setReady(true);
      return;
    }
    Promise.all([
      loadTranslations(locale),
      locale !== DEFAULT_LOCALE ? loadTranslations(DEFAULT_LOCALE) : Promise.resolve(null),
    ]).then(([current, fallback]) => {
      setTranslations(current);
      setFallbackTranslations(fallback ?? current);
      setReady(true);
    });
  }, [locale, initialLocale, initialTranslations, initialFallbackTranslations]);

  useEffect(() => {
    if (typeof window === "undefined" || !ready) return;
    const html = document.documentElement;
    const config = LOCALES.find((l) => l.code === locale);
    html.lang = locale;
    html.dir = config?.rtl ? "rtl" : "ltr";
  }, [locale, ready]);

  const setLocale = useCallback(
    (newLocale: Locale) => {
      if (newLocale === locale) return;
      setLocaleState(newLocale);
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, newLocale);
        document.cookie = `nexa_locale=${newLocale};path=/;max-age=${60 * 60 * 24 * 365}`;
      }
      const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, "") || "/";
      const newPath =
        pathWithoutLocale === "/"
          ? `/${newLocale}`
          : `/${newLocale}${pathWithoutLocale.startsWith("/") ? pathWithoutLocale : "/" + pathWithoutLocale}`;
      const qs =
        typeof window !== "undefined" ? window.location.search.replace(/^\?/, "") : "";
      router.push(qs ? `${newPath}?${qs}` : newPath);
    },
    [locale, pathname, router],
  );

  const localePath = useCallback(
    (path: string) => {
      const p = path.startsWith("/") ? path : `/${path}`;
      if (p === "/") return `/${locale}`;
      return `/${locale}${p}`;
    },
    [locale]
  );

  const t = useCallback(
    (key: string) => {
      const msg = translate(translations, key);
      if (msg === key && fallbackTranslations) {
        return translate(fallbackTranslations, key);
      }
      return msg;
    },
    [translations, fallbackTranslations]
  );

  const tf = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      let msg = translate(translations, key);
      if (msg === key && fallbackTranslations) {
        msg = translate(fallbackTranslations, key);
      }
      return formatMessage(msg, vars);
    },
    [translations, fallbackTranslations]
  );

  const config = LOCALES.find((l) => l.code === locale);
  const isRtl = config?.rtl ?? false;

  const value: LanguageContextValue = {
    locale,
    setLocale,
    t,
    tf,
    isRtl,
    ready,
    localePath,
  };

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}

export function useLocalePath() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLocalePath must be used within LanguageProvider");
  return ctx.localePath;
}
