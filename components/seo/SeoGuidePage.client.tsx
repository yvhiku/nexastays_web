"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { NavBar } from "@/components/navbar/NavBar";
import { Footer } from "@/components/footer/Footer";
import { GeoBlock } from "@/components/seo/GeoBlock";
import { DestinationIntelligencePanel } from "@/components/seo/DestinationIntelligencePanel";
import { SeoListingsGrid } from "@/components/seo/SeoListingsGrid.client";
import { useLanguage } from "@/contexts/LanguageContext";
import { guideTypeLabel } from "@/lib/seo/guide-api";
import type { SeoGuidePagePayload } from "@/lib/seo/types";
import type { StaysListing } from "@/lib/stays-types";
import { DESTINATION_IMAGE_BLUR } from "@/lib/destination-assets";
import { buildListingsQueryPath } from "@/lib/seo/seo-api";

type Props = {
  page: SeoGuidePagePayload;
  listings: StaysListing[];
};

export function SeoGuidePageClient({ page, listings }: Props) {
  const { t, tf, localePath } = useLanguage();
  const dest = page.destination;
  const hero = dest?.heroImageUrl ?? null;

  const listingsPath = dest
    ? localePath(buildListingsQueryPath(page.exploreFilters))
    : localePath("/listings");

  return (
    <>
      <NavBar />
      <main>
        <section className="relative pt-[72px] min-h-[280px] sm:min-h-[340px] flex items-end overflow-hidden">
          {hero ? (
            <Image
              src={hero}
              alt={dest!.name}
              fill
              priority
              className="object-cover"
              placeholder="blur"
              blurDataURL={DESTINATION_IMAGE_BLUR}
              sizes="100vw"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-nexa-primary-soft to-nexa-bg" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-nexa-ink/70 via-nexa-ink/30 to-transparent" />
          <div className="relative z-10 max-w-[1280px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 pb-10 w-full">
            <nav aria-label="Breadcrumb" className="text-xs text-white/80 mb-4 flex flex-wrap gap-1">
              {page.breadcrumbs.map((crumb, i) => (
                <span key={crumb.path} className="inline-flex items-center gap-1">
                  {i > 0 && <span aria-hidden>/</span>}
                  {i < page.breadcrumbs.length - 1 ? (
                    <Link
                      href={localePath(crumb.path.replace(/^\/(en|fr|ar)/, "") || "/")}
                      className="hover:text-white"
                    >
                      {crumb.name === "Guides" ? t("seo.guidesHubHeading") : crumb.name}
                    </Link>
                  ) : (
                    <span className="text-white">{page.h1}</span>
                  )}
                </span>
              ))}
            </nav>
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
                      href={localePath(page.cityGuideLink.href.replace(/^\/(en|fr|ar)/, ""))}
                      className="text-nexa-primary font-medium hover:underline"
                    >
                      {page.cityGuideLink.label} →
                    </Link>
                  </p>
                )}
              </article>

              <aside className="space-y-6">
                {page.intelligence && dest && (
                  <DestinationIntelligencePanel
                    destinationName={dest.name}
                    intelligence={page.intelligence}
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

        {page.relatedGuides.length > 0 && (
          <section className="py-10 sm:py-14 border-t border-nexa-border/60">
            <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
              <h2 className="font-display text-2xl font-semibold text-nexa-ink mb-6">
                {t("seo.relatedGuides")}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {page.relatedGuides.map((guide) => (
                  <Link
                    key={guide.slug}
                    href={localePath(guide.href.replace(/^\/(en|fr|ar)/, ""))}
                    className="rounded-2xl border border-nexa-border p-5 hover:border-nexa-primary hover:shadow-nexa-card transition-all"
                  >
                    <p className="text-xs uppercase tracking-wide text-nexa-muted mb-1">
                      {guideTypeLabel(guide.guideType, t)}
                    </p>
                    <h3 className="font-semibold text-nexa-ink">{guide.title}</h3>
                    {guide.description && (
                      <p className="text-sm text-nexa-muted mt-2 line-clamp-2">{guide.description}</p>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
