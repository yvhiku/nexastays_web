"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Pencil, Pause, Play, PlusCircle, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "@/components/ui/Alert";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  getHostListings,
  getHostVerification,
  normalizeHostVerificationStatus,
  pauseHostListing,
  resumeHostListing,
} from "@/lib/stays-api";
import { formatUserError } from "@/lib/errors";
import type { HostListingSummary, HostVerificationStatus } from "@/lib/stays-types";
import { HostPortalPageHeader } from "@/components/host/portal/HostPortalPageHeader";
import { HostPortalCard } from "@/components/host/portal/HostPortalCard";
import { AppLoader } from "@/components/AppLoader";
import { cn } from "@/lib/utils";
import { formatNightlyPrice } from "@/lib/format-money";

function listingHref(
  listing: HostListingSummary,
  localePath: (path: string) => string,
): string {
  if (listing.status === "DRAFT" || listing.status === "REJECTED") {
    return localePath(`/host/listings/new?draft=${listing.id}`);
  }
  return localePath(`/host/listings/${listing.id}/edit`);
}

function listingIsPublic(status: string): boolean {
  return status === "LIVE" || status === "APPROVED";
}

function listingCanPause(status: string): boolean {
  return status === "LIVE" || status === "APPROVED";
}

function hostFacingStatus(status: string): string {
  if (status === "REJECTED") return "Needs Changes";
  if (status === "SUBMITTED") return "In review";
  if (status === "DRAFT") return "Draft";
  return status;
}

export default function HostListingsIndexPage() {
  const { token } = useAuth();
  const { t, locale, localePath } = useLanguage();
  const router = useRouter();
  const [hostStatus, setHostStatus] = useState<HostVerificationStatus | null>(null);
  const [gateLoading, setGateLoading] = useState(true);
  const [gateError, setGateError] = useState<string | null>(null);
  const [listings, setListings] = useState<HostListingSummary[]>([]);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [listingActionId, setListingActionId] = useState<string | null>(null);
  const [listingActionError, setListingActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    setGateLoading(true);
    getHostVerification(token)
      .then((s) => setHostStatus(normalizeHostVerificationStatus(s)))
      .catch((e) =>
        setGateError(formatUserError(e) || t("hostDashboard.failedLoad")),
      )
      .finally(() => setGateLoading(false));
  }, [token, t]);

  const refreshListings = useCallback(() => {
    if (!token) return;
    setListingsLoading(true);
    getHostListings(token)
      .then(setListings)
      .catch(() => setListings([]))
      .finally(() => setListingsLoading(false));
  }, [token]);

  useEffect(() => {
    if ((hostStatus?.status ?? "") !== "APPROVED") return;
    refreshListings();
  }, [hostStatus?.status, refreshListings]);

  const handlePause = async (id: string) => {
    if (!token) return;
    setListingActionId(id);
    setListingActionError(null);
    try {
      await pauseHostListing(id, token);
      refreshListings();
    } catch (e) {
      setListingActionError(formatUserError(e) || t("hostDashboard.pauseFailed"));
    } finally {
      setListingActionId(null);
    }
  };

  const handleResume = async (id: string) => {
    if (!token) return;
    setListingActionId(id);
    setListingActionError(null);
    try {
      await resumeHostListing(id, token);
      refreshListings();
    } catch (e) {
      setListingActionError(formatUserError(e) || t("hostDashboard.resumeFailed"));
    } finally {
      setListingActionId(null);
    }
  };

  if (gateLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <AppLoader />
      </div>
    );
  }

  if (gateError) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <p className="mb-6 text-nexa-ink-3">{gateError}</p>
        <Button asChild>
          <Link href={localePath("/host/dashboard")}>{t("hostPortal.nav.home")}</Link>
        </Button>
      </div>
    );
  }

  if ((hostStatus?.status ?? "") !== "APPROVED") {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <p className="mb-6 text-nexa-ink-3">{t("hostAnalytics.notApproved")}</p>
        <Button asChild>
          <Link href={localePath("/host/dashboard")}>{t("hostPortal.nav.home")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <HostPortalPageHeader
        title={t("hostPortal.listingsTitle")}
        description={t("hostPortal.listingsSubtitle")}
        actions={
          <Button size="sm" asChild>
            <Link href={localePath("/host/listings/new")} className="inline-flex items-center gap-2">
              <PlusCircle className="h-4 w-4" aria-hidden />
              {t("hostPortal.nav.listNewProperty")}
            </Link>
          </Button>
        }
      />

      {listingActionError ? (
        <ErrorAlert
          error={listingActionError}
          className="mb-4"
          compact
          onDismiss={() => setListingActionError(null)}
        />
      ) : null}

      {listingsLoading ? (
        <div className="py-16 text-center text-nexa-ink-4">
          {t("hostDashboard.loadingListings")}
        </div>
      ) : listings.length === 0 ? (
        <HostPortalCard className="p-8 text-center">
          <Building2 className="mx-auto mb-3 h-10 w-10 text-nexa-primary" aria-hidden />
          <p className="mb-4 text-nexa-ink-3">{t("hostDashboard.noListingsYet")}</p>
          <Button asChild>
            <Link href={localePath("/host/listings/new")}>
              {t("hostPortal.nav.listNewProperty")}
            </Link>
          </Button>
        </HostPortalCard>
      ) : (
        <ul className="space-y-3">
          {listings.map((l) => {
            const href = listingHref(l, localePath);
            return (
              <li key={l.id}>
                <HostPortalCard className="p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-nexa-ink">
                        {l.title === "Untitled listing"
                          ? t("hostDashboard.untitledDraft")
                          : l.title}
                      </p>
                      <p className="text-sm text-nexa-ink-3">
                        {l.city?.trim() || t("hostDashboard.locationPending")} ·{" "}
                        {hostFacingStatus(l.status)}
                        {l.rate_plan && l.rate_plan.base_price > 0
                          ? ` · ${formatNightlyPrice(
                              l.rate_plan.base_price,
                              l.rate_plan.currency || "MAD",
                              locale,
                              t("seo.perNight"),
                            )}`
                          : null}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        onClick={() => router.push(href)}
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden />
                        {t("hostDashboard.edit")}
                      </Button>
                      {listingIsPublic(l.status) ? (
                        <Button size="sm" variant="outline" className="gap-1" asChild>
                          <Link href={localePath(`/listings/${l.id}`)}>
                            <Eye className="h-3.5 w-3.5" aria-hidden />
                            {t("hostDashboard.view")}
                          </Link>
                        </Button>
                      ) : null}
                      {listingCanPause(l.status) ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          disabled={listingActionId === l.id}
                          onClick={() => void handlePause(l.id)}
                        >
                          <Pause className="h-3.5 w-3.5" aria-hidden />
                          {t("hostDashboard.pause")}
                        </Button>
                      ) : null}
                      {l.status === "PAUSED" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className={cn("gap-1")}
                          disabled={listingActionId === l.id}
                          onClick={() => void handleResume(l.id)}
                        >
                          <Play className="h-3.5 w-3.5" aria-hidden />
                          {t("hostDashboard.resume")}
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </HostPortalCard>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
