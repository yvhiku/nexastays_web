import React from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { StaysFeeProvider } from "@/contexts/StaysFeeContext";
import type { Locale } from "@/lib/i18n";

const VALID_LOCALES = ["en", "fr", "ar"] as const;

export default function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const locale = (VALID_LOCALES.includes(params.locale as (typeof VALID_LOCALES)[number])
    ? params.locale
    : "en") as Locale;

  return (
    <LanguageProvider initialLocale={locale}>
      <StaysFeeProvider>
        <AuthProvider>{children}</AuthProvider>
      </StaysFeeProvider>
    </LanguageProvider>
  );
}
