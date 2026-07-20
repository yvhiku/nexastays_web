import React from "react";
import { Noto_Sans_Arabic } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { StaysFeeProvider } from "@/contexts/StaysFeeContext";
import { PwaAppShell } from "@/components/pwa/PwaAppShell";
import { HeaderStateProvider } from "@/components/navbar/HeaderStateProvider.client";
import { getServerLocale, getLocaleBundle } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n";

const notoArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  variable: "--font-arabic",
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: true,
});

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
            <div
              className={`pb-[calc(5.75rem+env(safe-area-inset-bottom))] md:pb-0${
                isRtl ? ` ${notoArabic.variable} font-arabic` : ""
              }`}
              dir={isRtl ? "rtl" : "ltr"}
            >
              {children}
            </div>
            <PwaAppShell />
          </HeaderStateProvider>
        </AuthProvider>
      </StaysFeeProvider>
    </LanguageProvider>
  );
}
