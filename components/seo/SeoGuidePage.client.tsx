"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { NavBar } from "@/components/navbar/NavBar";
import { Footer } from "@/components/footer/Footer";
import { GeoBlock } from "@/components/seo/GeoBlock";
import { SeoHeroBackground } from "@/components/seo/SeoHeroBackground";
import { SemanticBreadcrumbs } from "@/components/seo/SemanticBreadcrumbs";
import { EntityRelationshipHub } from "@/components/seo/EntityRelationshipHub";
import { DestinationIntelligencePanel } from "@/components/seo/DestinationIntelligencePanel";
import { SeoListingsGrid } from "@/components/seo/SeoListingsGrid.client";
import { useLanguage } from "@/contexts/LanguageContext";
import { guideTypeLabel } from "@/lib/seo/guide-api";
import type { SeoGuidePagePayload } from "@/lib/seo/types";
import type { StaysListing } from "@/lib/stays-types";
import { buildListingsQueryPath } from "@/lib/seo/seo-api";
import {
  deriveGuideEntityGraph,
  semanticBreadcrumbsForGuide,
} from "@/lib/seo/entity-graph";
import { toClientSeoHref } from "@/lib/seo/guide-links";

type Props = {
  page: SeoGuidePagePayload;
  listings: StaysListing[];
};

export function SeoGuidePageClient({ page, listings }: Props) {
  const { t, tf, locale, localePath } = useLanguage();
  const dest = page.destination;
  const hero = dest?.heroImageUrl ?? null;

  const listingsPath = dest
    ? localePath(buildListingsQueryPath(page.exploreFilters))
    : localePath("/listings");
  const entityGraph = React.useMemo(
    () => deriveGuideEntityGraph(page, listings),
    [page, listings],
  );

  return (
    <>
      <NavBar />
      <main>
        <section className="relative pt-[calc(72px+env(safe-area-inset-top))] min-h-[280px] sm:min-h-[340px] flex items-end overflow-hidden">
          {hero ? (
            <SeoHeroBackground src={hero} alt={dest!.name} />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-nexa-primary-soft to-nexa-bg" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-nexa-ink/70 via-nexa-ink/30 to-transparent" />
          <div className="relative z-layer-content max-w-[1280px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 pb-10 w-full">
            <SemanticBreadcrumbs
              items={semanticBreadcrumbsForGuide(page)}
              tone="light"
              className="mb-4"
            />
            <p className="text-xs uppercase tracking-wide text-white/70 mb-2">
              {guideTypeLabel(page.guideType, t)}
            </p>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold text-white max-w-3xl">
              {page.h1}
            </h1>
            {dest && (
              <p className="text-white/85 mt-3 max-w-2xl text-sm sm:text-base">
                {tf("seo.guideForCity", { city: dest.name })}
              </p>
            )}
          </div>
        </section>

        <section className="py-10 sm:py-14">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <article className="lg:col-span-2 prose prose-nexa max-w-none">
                <div
                  className="text-nexa-muted leading-relaxed space-y-4 [&>p]:text-base"
                  dangerouslySetInnerHTML={{ __html: page.bodyHtml }}
                />
                {page.cityGuideLink && (
                  <p className="not-prose mt-6">
                    <Link
                      href={toClientSeoHref(page.cityGuideLink.href, localePath)}
                      className="inline-flex items-center gap-1 text-nexa-primary font-medium hover:underline"
                    >
                      {page.cityGuideLink.label}
                      <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden />
                    </Link>
                  </p>
                )}
              </article>

              <aside className="space-y-6">
                {page.intelligence && dest && (
                  <DestinationIntelligencePanel
                    destinationName={dest.name}
                    intelligence={page.intelligence}
                    locale={locale}
                    bestTimeToVisit={dest.bestTimeToVisit}
                    labels={{
                      title: tf("seo.intelligenceForCity", { city: dest.name }),
                      verifiedStays: t("seo.verifiedStays"),
                      avgPrice: t("seo.avgPrice"),
                      cheapest: t("seo.cheapest"),
                      luxury: t("seo.luxuryStays"),
                      avgRating: t("seo.avgRating"),
                      topArea: t("seo.topArea"),
                      bestMonth: t("seo.bestTime"),
                      topAmenities: t("seo.topAmenities"),
                      perNight: t("seo.perNight"),
                    }}
                  />
                )}
                {dest && (
                  <Link
                    href={localePath(`/stays/${dest.slug}`)}
                    className="block rounded-2xl border border-nexa-border p-5 hover:border-nexa-primary transition-colors"
                  >
                    <h2 className="font-semibold text-nexa-ink">
                      {tf("seo.browseStaysIn", { city: dest.name })}
                    </h2>
                    <p className="text-sm text-nexa-muted mt-1">{t("seo.viewAll")}</p>
                  </Link>
                )}
              </aside>
            </div>
          </div>
        </section>

        {page.geoBlocks.length > 0 && (
          <section className="py-10 bg-nexa-bg/60">
            <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
              <h2 className="font-display text-2xl font-semibold text-nexa-ink mb-6">
                {t("seo.commonQuestions")}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {page.geoBlocks.map((block) => (
                  <GeoBlock key={block.question} question={block.question} answer={block.answer} />
                ))}
              </div>
            </div>
          </section>
        )}

        {dest && listings.length > 0 && (
          <section className="py-10 sm:py-14">
            <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
              <div className="flex items-end justify-between gap-4 mb-6">
                <h2 className="font-display text-2xl font-semibold text-nexa-ink">
                  {tf("seo.featuredInCity", { city: dest.name })}
                </h2>
                <Link href={listingsPath} className="text-sm text-nexa-primary hover:underline">
                  {t("seo.viewAll")}
                </Link>
              </div>
              <SeoListingsGrid
                listings={listings}
                city={dest.searchCity}
                emptyMessage={t("seo.noListingsYet")}
              />
            </div>
          </section>
        )}

        <section className="py-10 sm:py-14 border-t border-nexa-border/60">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
            <EntityRelationshipHub graph={entityGraph} />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
