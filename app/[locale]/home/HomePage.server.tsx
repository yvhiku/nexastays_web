import { Suspense } from "react";
import { NavBar } from "@/components/navbar/NavBar";
import { FooterSection } from "@/components/footer/Footer.server";
import { getServerLocale, getServerTranslations } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n";
import { HeroSection } from "./sections/hero/Hero.server";
import { DestinationsSection } from "./sections/destinations/Destinations.server";
import { SearchPreview } from "./sections/search/SearchPreview.server";
import { SearchHomeGate } from "./sections/search/SearchHomeGate.client";
import { MarketingSections } from "./Marketing.server";
import { DeferredHomeClient } from "./Deferred.client";
import { HomeEntryRouter } from "./HomeEntryRouter.client";
import { CompactHomeMarketing } from "./CompactHomeMarketing.client";

function HomeEntryFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center pt-[72px]">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-nexa-primary border-t-transparent" />
    </div>
  );
}

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
      <Suspense fallback={<HomeEntryFallback />}>
        <HomeEntryRouter>
          <main>
            <HeroSection
              locale={locale}
              embedSearch={
                <Suspense fallback={<SearchPreview t={t} variant="hero" />}>
                  <SearchHomeGate variant="hero">
                    <SearchPreview t={t} variant="hero" />
                  </SearchHomeGate>
                </Suspense>
              }
              afterSearch={<DestinationsSection locale={locale} variant="afterSearch" />}
            />
            <div className="lg:hidden">
              <Suspense fallback={<SearchPreview t={t} />}>
                <SearchHomeGate>
                  <SearchPreview t={t} />
                </SearchHomeGate>
              </Suspense>
            </div>
            <div className="lg:hidden">
              <DestinationsSection locale={locale} variant="afterSearch" />
            </div>
            <Suspense fallback={null}>
              <DeferredHomeClient />
            </Suspense>
            <CompactHomeMarketing>
              <MarketingSections locale={locale} />
            </CompactHomeMarketing>
          </main>
          <FooterSection locale={locale} />
        </HomeEntryRouter>
      </Suspense>
    </>
  );
}
