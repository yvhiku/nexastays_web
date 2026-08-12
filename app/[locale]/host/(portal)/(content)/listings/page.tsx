"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "@/components/ui/Alert";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  getHostVerification,
  normalizeHostVerificationStatus,
  pauseHostListing,
  resumeHostListing,
} from "@/lib/stays-api";
import { formatUserError } from "@/lib/errors";
import type { HostVerificationStatus } from "@/lib/stays-types";
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
  const [listingActionId, setListingActionId] = useState<string | null>(null);
  const [listingActionError, setListingActionError] = useState<string | null>(
    null,
  );
  const [refreshKey, setRefreshKey] = useState(0);

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

  const bumpRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const handlePause = async (id: string) => {
    if (!token) return;
    setListingActionId(id);
    setListingActionError(null);
    try {
      await pauseHostListing(id, token);
      bumpRefresh();
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
      bumpRefresh();
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
    <>
      {listingActionError ? (
        <ErrorAlert
          error={listingActionError}
          className="mb-4"
          onDismiss={() => setListingActionError(null)}
        />
      ) : null}
      <HostListingsPage
        t={t}
        locale={locale}
        localePath={localePath}
        token={token}
        listingActionId={listingActionId}
        onPause={(id) => void handlePause(id)}
        onResume={(id) => void handleResume(id)}
        refreshKey={refreshKey}
      />
    </>
  );
}
