import React from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { StaysFeeProvider } from "@/contexts/StaysFeeContext";
import { PwaAppShell } from "@/components/pwa/PwaAppShell";
import { HeaderStateProvider } from "@/components/navbar/HeaderStateProvider.client";
import { getServerLocale, getLocaleBundle } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const locale = getServerLocale(params.locale) as Locale;
  const initialTranslations = getLocaleBundle(locale);
  const fallbackTranslations =
    locale === "en" ? initialTranslations : getLocaleBundle("en");

  return (
    <LanguageProvider
      initialLocale={locale}
      initialTranslations={initialTranslations}
      initialFallbackTranslations={fallbackTranslations}
    >
      <StaysFeeProvider>
        <AuthProvider>
          <HeaderStateProvider>
            <div className="pb-[calc(5.75rem+env(safe-area-inset-bottom))] md:pb-0">
              {children}
            </div>
            <PwaAppShell />
          </HeaderStateProvider>
        </AuthProvider>
      </StaysFeeProvider>
    </LanguageProvider>
  );
}
