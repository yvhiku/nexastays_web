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

type Props = {
  page: SeoPagePayload;
  listings: StaysListing[];
};

export function SeoCityPageClient({ page, listings }: Props) {
  const { t, tf, localePath } = useLanguage();
  const hero = page.destination.heroImageUrl;
  const introKey = `explore.cities.${page.destination.slug}.subtitle`;
  const intro =
    t(introKey) !== introKey
      ? t(introKey)
      : t("explore.cityGenericSubtitle");

  return (
    <>
      <NavBar />
      <main>
        <section className="relative pt-[72px] min-h-[320px] sm:min-h-[380px] flex items-end overflow-hidden">
          {hero ? (
            <Image
              src={hero}
              alt={page.destination.name}
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
                <Link
                  href={localePath(
                    `/listings?city=${encodeURIComponent(page.destination.searchCity)}`,
                  )}
                >
                  {t("seo.browseListings")}
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-12 sm:py-16">
          <DestinationIntelligencePanel
            destinationName={page.destination.name}
            intelligence={page.intelligence}
            bestTimeToVisit={page.destination.bestTimeToVisit}
            labels={{
              title: t("seo.intelligenceTitle"),
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
                {tf("seo.featuredInCity", { city: page.destination.name })}
              </h2>
              <Link
                href={localePath(
                  `/listings?city=${encodeURIComponent(page.destination.searchCity)}`,
                )}
                className="text-sm font-medium text-nexa-primary hover:underline shrink-0"
              >
                {t("seo.viewAll")}
              </Link>
            </div>
            <SeoListingsGrid
              listings={listings}
              city={page.destination.searchCity}
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

          <SeoInternalLinkGrid
            title={t("seo.nearbyDestinations")}
            links={page.nearbyDestinations.map((d) => ({
              href: `/${page.locale}/stays/${d.slug}`,
              label: d.name,
            }))}
          />

          <SeoInternalLinkGrid
            title={t("seo.propertyTypes")}
            links={page.propertyTypeLinks.map((l) => ({
              href: l.href,
              label: l.label,
            }))}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
