"use client";

import React from "react";
import Link from "next/link";
import { NavBar } from "@/components/navbar/NavBar";
import { Footer } from "@/components/footer/Footer";
import { DestinationIntelligencePanel } from "@/components/seo/DestinationIntelligencePanel";
import { SeoInternalLinkGrid } from "@/components/seo/SeoListingsGrid.client";
import { SeoLandingHero } from "@/components/seo/landing/SeoLandingHero";
import { SeoLandingProfile } from "@/components/seo/landing/SeoLandingProfile";
import { SeoLandingAtAGlance } from "@/components/seo/landing/SeoLandingAtAGlance";
import { SeoLandingFacts } from "@/components/seo/landing/SeoLandingFacts";
import {
  SeoLandingAudience,
  SeoLandingHighlights,
  SeoLandingKeyValueSection,
  SeoLandingSeasonal,
  SeoLandingTravelersLove,
  SeoLandingWhyStay,
} from "@/components/seo/landing/SeoLandingSections";
import {
  SeoLandingListings,
} from "@/components/seo/landing/SeoLandingListings";
import { SeoLandingPoiCards } from "@/components/seo/landing/SeoLandingPoiCards";
import { SeoLandingComparisonTable } from "@/components/seo/landing/SeoLandingComparisonTable";
import { SeoLandingFaq } from "@/components/seo/landing/SeoLandingFaq";
import { SeoLandingClosingCta } from "@/components/seo/landing/SeoLandingClosingCta";
import { areaLabel, formatLastmod } from "@/components/seo/landing/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import type { SeoPagePayload } from "@/lib/seo/types";
import type { StaysListing } from "@/lib/stays-types";
import { buildListingsQueryPath } from "@/lib/seo/seo-api";

type Props = {
  page: SeoPagePayload;
  listings: StaysListing[];
};

export function SeoLandingPageClient({ page, listings }: Props) {
  const { t, tf, localePath } = useLanguage();
  const dest = page.destination;
  const blocks = page.contentBlocks;
  const area = areaLabel(page);
  const listingsPath = localePath(buildListingsQueryPath(page.exploreFilters));

  const introKey = dest ? `explore.cities.${dest.slug}.subtitle` : "";
  const heroIntro =
    blocks?.hero_intro ??
    (introKey && t(introKey) !== introKey ? t(introKey) : page.description.split(".")[0] + ".");

  const intelligenceTitle = dest
    ? tf("seo.intelligenceForCity", { city: dest.name })
    : t("seo.intelligenceGeneric");

  const editorialFaq = blocks?.faq?.map((f) => ({ question: f.question, answer: f.answer })) ?? [];
  const displayFaq =
    editorialFaq.length > 0
      ? editorialFaq
      : page.faq.filter((f) => !f.statKey);

  return (
    <>
      <NavBar />
      <main>
        <SeoLandingHero page={page} listingsPath={listingsPath} heroIntro={heroIntro} />

        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-10 sm:py-14 space-y-10 sm:space-y-12">
          {blocks?.quick_facts && (
            <SeoLandingProfile
              title={t("seo.neighborhoodProfile")}
              facts={blocks.quick_facts}
              labels={{
                atmosphere: t("seo.profileAtmosphere"),
                budget: t("seo.profileBudget"),
                families: t("seo.profileFamilies"),
                nightlife: t("seo.profileNightlife"),
                shopping: t("seo.profileShopping"),
                walkability: t("seo.profileWalkability"),
                remoteWork: t("seo.profileRemoteWork"),
                culture: t("seo.profileCulture"),
                luxury: t("seo.profileLuxury"),
              }}
            />
          )}

          {blocks?.at_a_glance && blocks.at_a_glance.length > 0 && (
            <SeoLandingAtAGlance title={t("seo.atAGlance")} items={blocks.at_a_glance} />
          )}

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
              topPropertyType: t("seo.topPropertyType"),
              verifiedPercent: t("seo.verifiedPercent"),
              perNight: t("seo.perNight"),
            }}
          />

          <SeoLandingFacts
            title={t("seo.neighborhoodFacts")}
            intelligence={page.intelligence}
            editorialFacts={blocks?.editorial_facts}
            labels={{
              avgPrice: t("seo.avgPrice"),
              topPropertyType: t("seo.topPropertyType"),
              verifiedPercent: t("seo.verifiedPercent"),
              avgRating: t("seo.avgRating"),
              listingCount: t("seo.verifiedStays"),
              perNight: t("seo.perNight"),
            }}
          />

          {blocks?.why_stay_here && (
            <SeoLandingWhyStay title={tf("seo.whyStayIn", { area })} body={blocks.why_stay_here} />
          )}

          {blocks?.highlights && (
            <SeoLandingHighlights title={t("seo.highlights")} items={blocks.highlights} />
          )}

          {blocks?.local_tips && (
            <SeoLandingTravelersLove title={t("seo.travelersLove")} tips={blocks.local_tips} />
          )}

          {(blocks?.ideal_for?.length || blocks?.pros?.length || blocks?.cons?.length) && (
            <SeoLandingAudience
              title={t("seo.whoIsItFor")}
              idealFor={blocks.ideal_for}
              pros={blocks.pros}
              cons={blocks.cons}
              avoidIf={blocks.avoid_if}
              labels={{
                idealFor: t("seo.idealFor"),
                pros: t("seo.pros"),
                cons: t("seo.cons"),
                avoidIf: t("seo.avoidIf"),
              }}
            />
          )}

          <SeoLandingListings
            title={tf("seo.availableStaysIn", { area })}
            subline={tf("seo.listingsSubline", {
              count: String(page.intelligence.listingCount),
              updated: formatLastmod(page.lastmod, page.locale),
            })}
            listings={listings}
            city={page.exploreFilters.city ?? ""}
            emptyMessage={t("seo.noListingsYet")}
            sortLabels={{
              recommended: t("seo.sortRecommended"),
              price: t("seo.sortPrice"),
              rating: t("seo.sortRating"),
              newest: t("seo.sortNewest"),
            }}
            locale={page.locale}
          />

          {blocks?.travel_tips && (
            <SeoLandingKeyValueSection title={t("seo.travelTips")} items={blocks.travel_tips} />
          )}

          {blocks?.transport && (
            <SeoLandingKeyValueSection title={t("seo.gettingAround")} items={blocks.transport} />
          )}

          {blocks?.seasonal_notes && (
            <SeoLandingSeasonal title={t("seo.typicalWeather")} notes={blocks.seasonal_notes} />
          )}

          {blocks?.nearby_poi && (
            <SeoLandingPoiCards
              title={tf("seo.nearbyAttractions", { area })}
              items={blocks.nearby_poi}
              localePath={localePath}
              defaultCta={t("seo.browseStaysNearby")}
            />
          )}

          {blocks?.comparison && (
            <SeoLandingComparisonTable
              comparison={blocks.comparison}
              leftLabel={area}
              title={tf("seo.comparisonTitle", { area, vs: blocks.comparison.vs })}
              localePath={localePath}
            />
          )}

          <SeoLandingFaq title={t("seo.commonQuestions")} items={displayFaq} />

          {(page.neighborhoodLinks ?? []).length > 0 && (
            <SeoInternalLinkGrid
              title={t("seo.neighborhoods")}
              links={(page.neighborhoodLinks ?? []).map((l) => ({
                href: l.href,
                label: l.label,
              }))}
            />
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

          {page.propertyTypeLinks.length > 0 && (
            <SeoInternalLinkGrid
              title={t("seo.propertyTypes")}
              links={page.propertyTypeLinks.map((l) => ({ href: l.href, label: l.label }))}
            />
          )}

          {page.amenityLinks.length > 0 && (
            <SeoInternalLinkGrid
              title={t("seo.amenities")}
              links={page.amenityLinks.map((l) => ({ href: l.href, label: l.label }))}
            />
          )}

          {((page.relatedGuides ?? []).length > 0 || page.cityGuideLink) && (
            <section className="mt-10">
              <h2 className="font-display text-lg font-semibold text-nexa-ink mb-4">
                {t("seo.guidesHubHeading")}
              </h2>
              <div className="flex flex-wrap gap-2">
                {page.cityGuideLink && (
                  <Link
                    href={localePath(page.cityGuideLink.href.replace(/^\/(en|fr|ar)/, ""))}
                    className="inline-flex items-center rounded-full border border-nexa-border px-4 py-2 text-sm font-medium text-nexa-ink hover:border-nexa-primary hover:text-nexa-primary transition-colors"
                  >
                    {page.cityGuideLink.label}
                  </Link>
                )}
                {(page.relatedGuides ?? [])
                  .filter((g) => g.slug !== page.cityGuideLink?.slug)
                  .map((g) => (
                    <Link
                      key={g.slug}
                      href={localePath(g.href.replace(/^\/(en|fr|ar)/, ""))}
                      className="inline-flex items-center rounded-full border border-nexa-border px-4 py-2 text-sm font-medium text-nexa-ink hover:border-nexa-primary hover:text-nexa-primary transition-colors"
                    >
                      {g.title}
                    </Link>
                  ))}
              </div>
            </section>
          )}

          <SeoLandingClosingCta
            title={tf("seo.closingCtaTitle", { area })}
            body={t("seo.closingCtaBody")}
            listingsPath={listingsPath}
            ctaLabel={t("seo.browseListings")}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}

/** @deprecated use SeoLandingPageClient */
export const SeoCityPageClient = SeoLandingPageClient;
