import Link from "next/link";
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

export const revalidate = 3600;

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
  const { locale: localeParam } = await params;
  const locale = getServerLocale(localeParam) as Locale;
  const { t } = getServerTranslations(locale);

  return (
    <>
      <NavBar />
      <Suspense fallback={null}><HomeEntryRouter /></Suspense>
          <main>
            <section className="nexa-guest-main max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-12 pt-8">
              <p className="text-nexa-muted max-w-3xl">{t("seo.brandDefinition")}</p>
              <nav className="flex flex-wrap gap-5 mt-3 text-nexa-primary" aria-label={t("seo.moroccoHub")}>
                <Link href={`/${locale}/stays`}>{t("seo.moroccoHub")}</Link>
                <Link href={`/${locale}/guides`}>{t("seo.destinationGuides")}</Link>
              </nav>
            </section>
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

    </>
  );
}
