"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { buttonVariants } from "@/components/ui/button";
import { SeoTrustSignals } from "@/components/seo/landing/SeoTrustSignals";
import { useLanguage } from "@/contexts/LanguageContext";
import type { SeoPagePayload } from "@/lib/seo/types";
import { DESTINATION_IMAGE_BLUR } from "@/lib/destination-assets";
import { areaLabel } from "@/components/seo/landing/utils";

type Props = {
  page: SeoPagePayload;
  listingsPath: string;
  heroIntro: string;
};

export function SeoLandingHero({ page, listingsPath, heroIntro }: Props) {
  const { t, tf, localePath } = useLanguage();
  const dest = page.destination;
  const hero = dest?.heroImageUrl ?? null;
  const area = areaLabel(page);
  const intel = page.intelligence;
  const badge = page.contentBlocks?.quick_facts?.atmosphere;

  const displayTitle =
    page.neighborhood && dest
      ? tf("seo.stayInArea", { area: page.neighborhood.name, city: dest.name })
      : page.h1;

  return (
    <section className="relative pt-[72px] min-h-[360px] sm:min-h-[420px] flex items-end overflow-hidden">
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
      <div className="absolute inset-0 bg-gradient-to-t from-nexa-ink/80 via-nexa-ink/40 to-transparent" />
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
                  {crumb.name === "Morocco Stays" ? t("seo.moroccoStays") : crumb.name}
                </Link>
              ) : (
                <span className="text-white">{crumb.name}</span>
              )}
            </span>
          ))}
        </nav>
        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-semibold text-white max-w-3xl">
          {displayTitle}
        </h1>
        <p className="text-white/90 mt-3 max-w-2xl text-base sm:text-lg leading-relaxed">{heroIntro}</p>
        {badge && (
          <p className="mt-3 text-sm text-white/80 font-medium">
            {badge} {t("seo.neighborhoodLabel")}
            {intel.avgRating != null && (
              <span className="ml-2">
                · {formatStars(intel.avgRating)} {intel.avgRating.toFixed(1)}
              </span>
            )}
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/85">
          {intel.listingCount > 0 && (
            <span>
              {intel.listingCount} {t("seo.verifiedStays").toLowerCase()}
              {intel.avgNightlyPrice != null &&
                ` · ${t("seo.avgPrice").toLowerCase()} ${intel.avgNightlyPrice} ${intel.currency}${t("seo.perNight")}`}
            </span>
          )}
        </div>
        <div className="mt-4">
          <SeoTrustSignals compact />
        </div>
        <div className="mt-6">
          <Link
            href={listingsPath}
            prefetch={false}
            className={buttonVariants({ size: "lg" })}
          >
            {t("seo.browseListings")}
          </Link>
        </div>
      </div>
    </section>
  );
}

function formatStars(rating: number): string {
  const full = Math.round(rating);
  return "★".repeat(Math.min(5, full));
}
