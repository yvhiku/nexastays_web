"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
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
import type {
  HostListingSummary,
  HostVerificationStatus,
} from "@/lib/stays-types";
import { HostListingsPage } from "@/components/host/listings/HostListingsPage";
import { AppLoader } from "@/components/AppLoader";

export default function HostListingsIndexPage() {
  const { token } = useAuth();
  const { t, locale, localePath } = useLanguage();
  const [hostStatus, setHostStatus] = useState<HostVerificationStatus | null>(
    null,
  );
  const [gateLoading, setGateLoading] = useState(true);
  const [gateError, setGateError] = useState<string | null>(null);
  const [listings, setListings] = useState<HostListingSummary[]>([]);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [listingsError, setListingsError] = useState<string | null>(null);
  const [listingActionId, setListingActionId] = useState<string | null>(null);
  const [listingActionError, setListingActionError] = useState<string | null>(
    null,
  );

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
    setListingsError(null);
    getHostListings(token)
      .then(setListings)
      .catch((e) => {
        setListings([]);
        setListingsError(
          formatUserError(e) || t("hostPortal.listings.loadFailed"),
        );
      })
      .finally(() => setListingsLoading(false));
  }, [token, t]);

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
      setListingActionError(
        formatUserError(e) || t("hostDashboard.pauseFailed"),
      );
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
      setListingActionError(
        formatUserError(e) || t("hostDashboard.resumeFailed"),
      );
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
          <Link href={localePath("/host/dashboard")}>
            {t("hostPortal.nav.home")}
          </Link>
        </Button>
      </div>
    );
  }

  if ((hostStatus?.status ?? "") !== "APPROVED") {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <p className="mb-6 text-nexa-ink-3">
          {t("hostPortal.listings.notApproved")}
        </p>
        <Button asChild>
          <Link href={localePath("/host/dashboard")}>
            {t("hostPortal.nav.home")}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      {listingActionError ? (
        <ErrorAlert
          error={listingActionError}
          className="mb-4"
          compact
          onDismiss={() => setListingActionError(null)}
        />
      ) : null}

      <HostListingsPage
        listings={listings}
        loading={listingsLoading}
        error={listingsError}
        onRetry={refreshListings}
        t={t}
        locale={locale}
        localePath={localePath}
        listingActionId={listingActionId}
        onPause={(id) => void handlePause(id)}
        onResume={(id) => void handleResume(id)}
      />
    </div>
  );
}
