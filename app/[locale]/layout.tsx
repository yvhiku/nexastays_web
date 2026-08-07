import React from "react";
import { notoArabic } from "@/app/fonts/brand-fonts";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { StaysFeeProvider } from "@/contexts/StaysFeeContext";
import { PwaAppShell } from "@/components/pwa/PwaAppShell";
import { LocaleShell } from "@/components/layout/LocaleShell.client";
import { HeaderStateProvider } from "@/components/navbar/HeaderStateProvider.client";
import { SaveToastHost } from "@/components/ui/SaveToastHost";
import { getServerLocale, getLocaleBundle } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n";

export default async function LocaleLayout(
  props: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
  }
) {
  const params = await props.params;

  const {
    children
  } = props;

  const locale = getServerLocale(params.locale) as Locale;
  const initialTranslations = getLocaleBundle(locale);
  const fallbackTranslations =
    locale === "en" ? initialTranslations : getLocaleBundle("en");

  const isRtl = locale === "ar";

  return (
    <LanguageProvider
      initialLocale={locale}
      initialTranslations={initialTranslations}
      initialFallbackTranslations={fallbackTranslations}
    >
      <StaysFeeProvider>
        <AuthProvider>
          <HeaderStateProvider>
            <LocaleShell
              isRtl={isRtl}
              arabicFontClass={isRtl ? `${notoArabic.variable} font-arabic` : undefined}
            >
              {children}
            </LocaleShell>
            <SaveToastHost />
            <PwaAppShell />
          </HeaderStateProvider>
        </AuthProvider>
      </StaysFeeProvider>
    </LanguageProvider>
  );
}
