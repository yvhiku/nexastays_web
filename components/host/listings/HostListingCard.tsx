"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Eye, Pause, Pencil, Play } from "lucide-react";
import type { HostListingSummary } from "@/lib/stays-types";
import type { Locale } from "@/lib/i18n";
import {
  hostFacingStatusFallback,
  hostFacingStatusKey,
  listingCanPause,
  listingCanResume,
  listingCoverMediaUrl,
  listingDisplayTitle,
  listingHref,
  listingIsContinueSetup,
  listingIsPublic,
  listingNightlyAmount,
  listingStatusTone,
} from "@/lib/host-listings-center";
import { formatNightlyPrice } from "@/lib/format-money";
import { HostPortalCard } from "@/components/host/portal/HostPortalCard";
import { HostPortalStatusBadge } from "@/components/host/portal/HostPortalStatusBadge";
import { Button } from "@/components/ui/button";

type TranslateFn = (key: string) => string;

type Props = {
  listing: HostListingSummary;
  t: TranslateFn;
  locale: Locale;
  localePath: (path: string) => string;
  actionBusy: boolean;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
};

export function HostListingCard({
  listing,
  t,
  locale,
  localePath,
  actionBusy,
  onPause,
  onResume,
}: Props) {
  const router = useRouter();
  const [imgFailed, setImgFailed] = useState(false);
  const coverUrl = listingCoverMediaUrl(listing);
  const showImage = Boolean(coverUrl) && !imgFailed;
  const href = listingHref(listing, localePath);
  const title = listingDisplayTitle(
    listing,
    t("hostDashboard.untitledDraft"),
  );
  const city =
    listing.city?.trim() || t("hostDashboard.locationPending");
  const nightly = listingNightlyAmount(listing);
  const statusKey = hostFacingStatusKey(listing.status);
  const statusLabel =
    statusKey && t(statusKey) !== statusKey
      ? t(statusKey)
      : hostFacingStatusFallback(listing.status);
  const continueSetup = listingIsContinueSetup(listing.status);
  const completion =
    typeof listing.completion_percentage === "number" &&
    Number.isFinite(listing.completion_percentage) &&
    continueSetup
      ? Math.max(0, Math.min(100, Math.round(listing.completion_percentage)))
      : null;

  return (
    <HostPortalCard className="overflow-hidden transition-shadow hover:shadow-[var(--host-shadow-hover)]">
      <div className="relative aspect-[4/3] bg-[color:var(--host-primary-soft)]">
        {showImage && coverUrl ? (
          <Image
            src={coverUrl}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            onError={() => setImgFailed(true)}
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Building2
              className="h-12 w-12 text-[color:var(--host-primary)]/50"
              aria-hidden
            />
            <span className="sr-only">{t("hostPortal.listings.noImage")}</span>
          </div>
        )}
        <div className="absolute start-3 top-3">
          <HostPortalStatusBadge
            tone={listingStatusTone(listing.status)}
            pulse={listing.status === "LIVE" || listing.status === "APPROVED"}
          >
            {statusLabel}
          </HostPortalStatusBadge>
        </div>
      </div>

      <div className="space-y-3 p-4 sm:p-5">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-[color:var(--host-text)]">
            {title}
          </h3>
          <p className="truncate text-sm text-[color:var(--host-text-secondary)]">
            {city}
            {listing.listing_type?.trim()
              ? ` · ${listing.listing_type}`
              : null}
          </p>
          {nightly ? (
            <p className="mt-1 text-sm font-medium tabular-nums text-[color:var(--host-text)]">
              {formatNightlyPrice(
                nightly.amount,
                nightly.currency,
                locale,
                t("seo.perNight"),
              )}
            </p>
          ) : null}
          {completion != null ? (
            <p className="mt-1 text-xs text-[color:var(--host-muted)]">
              {t("hostPortal.listings.setupProgress").replace(
                "{pct}",
                String(completion),
              )}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {continueSetup ? (
            <Button
              size="sm"
              className="gap-1"
              onClick={() => router.push(href)}
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden />
              {t("hostPortal.listings.continueSetup")}
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="gap-1"
              onClick={() => router.push(href)}
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden />
              {t("hostDashboard.edit")}
            </Button>
          )}

          {listingIsPublic(listing.status) ? (
            <Button size="sm" variant="outline" className="gap-1" asChild>
              <Link href={localePath(`/listings/${listing.id}`)}>
                <Eye className="h-3.5 w-3.5" aria-hidden />
                {t("hostDashboard.view")}
              </Link>
            </Button>
          ) : null}

          {listingCanPause(listing.status) ? (
            <Button
              size="sm"
              variant="outline"
              className="gap-1"
              disabled={actionBusy}
              onClick={() => onPause(listing.id)}
            >
              <Pause className="h-3.5 w-3.5" aria-hidden />
              {actionBusy
                ? t("hostDashboard.pausing")
                : t("hostDashboard.pause")}
            </Button>
          ) : null}

          {listingCanResume(listing.status) ? (
            <Button
              size="sm"
              variant="outline"
              className="gap-1"
              disabled={actionBusy}
              onClick={() => onResume(listing.id)}
            >
              <Play className="h-3.5 w-3.5" aria-hidden />
              {actionBusy
                ? t("hostDashboard.resuming")
                : t("hostDashboard.resume")}
            </Button>
          ) : null}
        </div>
      </div>
    </HostPortalCard>
  );
}
