"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { NavBar } from "@/components/navbar/NavBar";
import { Footer } from "@/components/footer/Footer";
import { Button } from "@/components/ui/button";
import { GeoBlock } from "@/components/seo/GeoBlock";
import { DestinationIntelligencePanel } from "@/components/seo/DestinationIntelligencePanel";
import {
  SeoInternalLinkGrid,
  SeoListingsGrid,
} from "@/components/seo/SeoListingsGrid.client";
import { useLanguage } from "@/contexts/LanguageContext";
import type { SeoPagePayload } from "@/lib/seo/types";
import type { StaysListing } from "@/lib/stays-types";
import { DESTINATION_IMAGE_BLUR } from "@/lib/destination-assets";
import { buildListingsQueryPath } from "@/lib/seo/seo-api";

type Props = {
  page: SeoPagePayload;
  listings: StaysListing[];
};

export function SeoLandingPageClient({ page, listings }: Props) {
  const { t, tf, localePath } = useLanguage();
  const dest = page.destination;
  const hero = dest?.heroImageUrl ?? null;
  const introKey = dest ? `explore.cities.${dest.slug}.subtitle` : "";
  const intro =
    introKey && t(introKey) !== introKey
      ? t(introKey)
      : page.description.split(".")[0] + ".";

  const listingsPath = localePath(buildListingsQueryPath(page.exploreFilters));
  const featuredTitle = dest
    ? tf("seo.featuredInCity", { city: dest.name })
    : page.filterLabel
      ? tf("seo.featuredForFilter", { filter: page.filterLabel })
      : page.h1;

  const intelligenceTitle = dest
    ? tf("seo.intelligenceForCity", { city: dest.name })
    : t("seo.intelligenceGeneric");

  return (
    <>
      <NavBar />
      <main>
        <section className="relative pt-[72px] min-h-[320px] sm:min-h-[380px] flex items-end overflow-hidden">
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
                    <Link href={localePath(crumb.path.replace(/^\/(en|fr|ar)/, "") || "/")} className="hover:text-white">
                      {crumb.name}
                    </Link>
                  ) : (
                    <span className="text-white">{crumb.name}</span>
                  )}
                </span>
              ))}
            </nav>
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-semibold text-white max-w-3xl">
              {page.h1}
            </h1>
            <p className="text-white/85 mt-3 max-w-2xl text-base sm:text-lg">{intro}</p>
            <div className="mt-6">
              <Button asChild size="lg">
                <Link href={listingsPath}>{t("seo.browseListings")}</Link>
              </Button>
            </div>
          </div>
        </section>

        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-12 sm:py-16">
          <DestinationIntelligencePanel
            destinationName={dest?.name ?? page.filterLabel ?? "Morocco"}
            intelligence={page.intelligence}
            bestTimeToVisit={dest?.bestTimeToVisit ?? null}
            labels={{
              title: intelligenceTitle,
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

          <section className="mt-12">
            <div className="flex items-end justify-between gap-4 mb-6">
              <h2 className="font-display text-xl sm:text-2xl font-semibold text-nexa-ink">
                {featuredTitle}
              </h2>
              <Link
                href={listingsPath}
                className="text-sm font-medium text-nexa-primary hover:underline shrink-0"
              >
                {t("seo.viewAll")}
              </Link>
            </div>
            <SeoListingsGrid
              listings={listings}
              city={page.exploreFilters.city ?? ""}
              emptyMessage={t("seo.noListingsYet")}
            />
          </section>

          {page.geoBlocks.length > 0 && (
            <section className="mt-12">
              <h2 className="font-display text-xl font-semibold text-nexa-ink mb-5">
                {t("seo.commonQuestions")}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {page.geoBlocks.map((block) => (
                  <GeoBlock key={block.question} question={block.question} answer={block.answer} />
                ))}
              </div>
            </section>
          )}

          {page.nearbyDestinations.length > 0 && (
            <SeoInternalLinkGrid
              title={t("seo.nearbyDestinations")}
              links={page.nearbyDestinations.map((d) => ({
                href: `/${page.locale}/stays/${d.slug}`,
                label: d.name,
              }))}
            />
          )}

          {(page.relatedDestinations ?? []).length > 0 && (
            <SeoInternalLinkGrid
              title={t("seo.relatedDestinations")}
              links={(page.relatedDestinations ?? []).map((d) => ({
                href: d.href,
                label: d.name,
              }))}
            />
          )}

          {(page.neighborhoodLinks ?? []).length > 0 && (
            <SeoInternalLinkGrid
              title={t("seo.neighborhoods")}
              links={(page.neighborhoodLinks ?? []).map((l) => ({
                href: l.href,
                label: l.label,
              }))}
            />
          )}

          {page.propertyTypeLinks.length > 0 && (
            <SeoInternalLinkGrid
              title={t("seo.propertyTypes")}
              links={page.propertyTypeLinks.map((l) => ({
                href: l.href,
                label: l.label,
              }))}
            />
          )}

          {page.amenityLinks.length > 0 && (
            <SeoInternalLinkGrid
              title={t("seo.amenities")}
              links={page.amenityLinks.map((l) => ({
                href: l.href,
                label: l.label,
              }))}
            />
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

/** @deprecated use SeoLandingPageClient */
export const SeoCityPageClient = SeoLandingPageClient;
