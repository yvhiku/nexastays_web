import React from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { StaysFeeProvider } from "@/contexts/StaysFeeContext";
import { PwaAppShell } from "@/components/pwa/PwaAppShell";
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
        <AuthProvider>
          <div className="pb-[calc(4.25rem+env(safe-area-inset-bottom))] md:pb-0">
            {children}
          </div>
          <PwaAppShell />
        </AuthProvider>
      </StaysFeeProvider>
    </LanguageProvider>
  );
}
