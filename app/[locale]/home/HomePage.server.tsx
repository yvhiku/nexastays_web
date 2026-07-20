import { Suspense } from "react";
import { NavBar } from "@/components/navbar/NavBar";
import { FooterSection } from "@/components/footer/Footer.server";
import { getServerLocale, getServerTranslations } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n";
import { HeroSection } from "./sections/hero/Hero.server";
import { SearchPreview } from "./sections/search/SearchPreview.server";
import { SearchHomeGate } from "./sections/search/SearchHomeGate.client";
import { MarketingSections } from "./Marketing.server";
import { DeferredHomeClient } from "./Deferred.client";

export const revalidate = 3600;

type Props = {
  params: { locale: string };
};

export default async function HomePage({ params }: Props) {
  const locale = getServerLocale(params.locale) as Locale;
  const { t } = getServerTranslations(locale);

  return (
    <>
      <NavBar />
      <main>
        <HeroSection locale={locale} />
        <SearchHomeGate>
          <SearchPreview t={t} />
        </SearchHomeGate>
        <Suspense fallback={null}>
          <DeferredHomeClient />
        </Suspense>
        <MarketingSections locale={locale} />
      </main>
      <FooterSection locale={locale} />
    </>
  );
}
