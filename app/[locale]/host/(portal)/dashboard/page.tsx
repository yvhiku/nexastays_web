"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { NexaSelect } from "@/components/ui/NexaSelect";
import { DatePicker } from "@/components/ui/DatePicker";
import { Alert, ErrorAlert } from "@/components/ui/Alert";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  getHostVerification,
  getHostListings,
  getHostBookings,
  getHostDashboard,
  getHostReviews,
  normalizeHostVerificationStatus,
  setHostAvailabilityBlock,
} from "@/lib/stays-api";
import { formatUserError } from "@/lib/errors";
import { showSaveToast } from "@/lib/save-toast";
import type {
  HostVerificationStatus,
  HostListingSummary,
  HostBooking,
  HostDashboardAggregate,
  HostReview,
} from "@/lib/stays-types";
import { HostDashboardHome } from "@/components/host/dashboard/HostDashboardHome";
import { AppLoader } from "@/components/AppLoader";
import {
  Home,
  PlusCircle,
  FileCheck,
  Clock,
  XCircle,
  Building2,
  CalendarCheck,
} from "lucide-react";
import { trackEvent } from "@/lib/analytics";

function HostDashboardContent() {
  const { token, user } = useAuth();
  const { t, tf, locale, localePath } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [hostStatus, setHostStatus] = useState<HostVerificationStatus | null>(null);
  const [listings, setListings] = useState<HostListingSummary[]>([]);
  const [bookings, setBookings] = useState<HostBooking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [dashboard, setDashboard] = useState<HostDashboardAggregate | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [recentReviews, setRecentReviews] = useState<HostReview[]>([]);
  const [recentReviewsLoading, setRecentReviewsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [blockListingId, setBlockListingId] = useState("");
  const [blockFrom, setBlockFrom] = useState("");
  const [blockTo, setBlockTo] = useState("");
  const [blockAction, setBlockAction] = useState<"block" | "unblock">("block");
  const [blockSubmitting, setBlockSubmitting] = useState(false);
  const [blockMessage, setBlockMessage] = useState<string | null>(null);
  const [blockError, setBlockError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    trackEvent("host_dashboard_viewed");
    void import("@/lib/pwa-engagement").then((m) => m.markPwaHostDashboardOpen());
    setLoading(true);
    setError(null);
    getHostVerification(token)
      .then((s) => {
        const normalized = normalizeHostVerificationStatus(s);
        setHostStatus(normalized);
        if (normalized.status === "APPROVED") {
          void import("@/lib/pwa-engagement").then((m) => m.markPwaHostApproved());
        }
      })
      .catch((e) => setError(formatUserError(e) || t("hostDashboard.failedLoad")))
      .finally(() => setLoading(false));
  }, [token, t]);

  useEffect(() => {
    if (searchParams.get("saved") !== "1") return;
    router.replace(localePath("/host/dashboard"), { scroll: false });
  }, [searchParams, router, localePath]);

  useEffect(() => {
    if (loading) return;
    const hash =
      typeof window !== "undefined" ? window.location.hash.replace(/^#/, "") : "";
    if (hash === "host-bookings") {
      router.replace(localePath("/host/bookings"));
      return;
    }
    if (hash === "host-listings") {
      router.replace(localePath("/host/listings"));
      return;
    }
    if (hash !== "host-calendar-sync") return;
    const id = window.setTimeout(() => {
      const el = document.getElementById(hash);
      if (el instanceof HTMLDetailsElement) el.open = true;
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
    return () => window.clearTimeout(id);
  }, [loading, router, localePath]);

  useEffect(() => {
    if (!token || (hostStatus?.status ?? "") !== "APPROVED") return;
    getHostListings(token)
      .then(setListings)
      .catch(() => setListings([]));
  }, [token, hostStatus?.status]);

  const loadBookings = useCallback(() => {
    if (!token || (hostStatus?.status ?? "") !== "APPROVED") return;
    setBookingsLoading(true);
    getHostBookings(token)
      .then(setBookings)
      .catch(() => setBookings([]))
      .finally(() => setBookingsLoading(false));
  }, [token, hostStatus?.status]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const loadDashboard = useCallback(() => {
    if (!token || (hostStatus?.status ?? "") !== "APPROVED") return;
    setDashboardLoading(true);
    setDashboardError(null);
    getHostDashboard(token)
      .then(setDashboard)
      .catch((e) => {
        setDashboard(null);
        setDashboardError(
          formatUserError(e) || t("hostDashboard.dashboardLoadFailed"),
        );
      })
      .finally(() => setDashboardLoading(false));
  }, [token, hostStatus?.status, t]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (!token || (hostStatus?.status ?? "") !== "APPROVED") return;
    setRecentReviewsLoading(true);
    getHostReviews(token, { page: 1, limit: 3 })
      .then((res) => setRecentReviews(res.reviews ?? []))
      .catch(() => setRecentReviews([]))
      .finally(() => setRecentReviewsLoading(false));
  }, [token, hostStatus?.status]);

  const handleAvailabilityBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !blockListingId || !blockFrom || !blockTo) return;
    setBlockSubmitting(true);
    setBlockError(null);
    setBlockMessage(null);
    try {
      const result = await setHostAvailabilityBlock(
        blockListingId,
        { from: blockFrom, to: blockTo, is_blocked: blockAction === "block" },
        token,
      );
      const message =
        blockAction === "block"
          ? tf("hostDashboard.blockedNights", { count: result.nights })
          : tf("hostDashboard.unblockedNights", { count: result.nights });
      setBlockMessage(message);
      showSaveToast(t("common.changesSaved"));
      trackEvent("host_calendar_updated", {
        listing_id: blockListingId,
        from: blockFrom,
        to: blockTo,
        action: blockAction,
        nights: result.nights,
      });
    } catch (err) {
      setBlockError(
        formatUserError(err) || t("hostDashboard.availabilityUpdateFailed"),
      );
    } finally {
      setBlockSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <AppLoader />
      </div>
    );
  }

  const status = hostStatus?.status ?? "NOT_STARTED";

  if (status === "APPROVED" && token) {
    const hostName =
      user?.full_name?.trim() || t("hostPortal.profileFallback");

    const tools =
      listings.length > 0 ? (
        <div>
          <form onSubmit={handleAvailabilityBlock}>
            <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold text-[color:var(--host-text)]">
              <CalendarCheck
                className="h-5 w-5 text-[color:var(--host-primary)]"
                aria-hidden
              />
              {t("hostDashboard.calendarBlocking")}
            </h2>
            <p className="mb-5 text-sm text-[color:var(--host-text-secondary)]">
              {t("hostDashboard.calendarBlockingDesc")}
            </p>
            {blockError ? (
              <ErrorAlert
                error={blockError}
                className="mb-4"
                compact
                onDismiss={() => setBlockError(null)}
              />
            ) : null}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.5fr_1fr_1fr_1fr_auto]">
              <NexaSelect
                variant="field"
                value={blockListingId}
                onChange={setBlockListingId}
                aria-label={t("hostDashboard.listing")}
                options={[
                  { value: "", label: t("hostDashboard.selectListing") },
                  ...listings.map((listing) => ({
                    value: listing.id,
                    label: listing.title,
                  })),
                ]}
              />
              <DatePicker
                variant="field"
                value={blockFrom}
                onChange={setBlockFrom}
                aria-label={t("hostDashboard.fromDate")}
                placeholder={t("hostDashboard.fromDate")}
              />
              <DatePicker
                variant="field"
                value={blockTo}
                onChange={setBlockTo}
                min={blockFrom || undefined}
                aria-label={t("hostDashboard.toDate")}
                placeholder={t("hostDashboard.toDate")}
              />
              <NexaSelect
                variant="field"
                value={blockAction}
                onChange={(v) => setBlockAction(v as "block" | "unblock")}
                aria-label={t("hostDashboard.calendarAction")}
                options={[
                  { value: "block", label: t("hostDashboard.blockDates") },
                  { value: "unblock", label: t("hostDashboard.unblockDates") },
                ]}
              />
              <Button type="submit" disabled={blockSubmitting} className="h-11">
                {blockSubmitting
                  ? t("common.saving")
                  : t("hostDashboard.updateCalendar")}
              </Button>
            </div>
            {blockMessage ? (
              <p className="mt-3 text-sm text-emerald-700">{blockMessage}</p>
            ) : null}
          </form>
        </div>
      ) : null;

    return (
      <HostDashboardHome
        hostName={hostName}
        dashboard={dashboard}
        dashboardLoading={dashboardLoading}
        dashboardError={dashboardError}
        onRetryDashboard={loadDashboard}
        bookings={bookings}
        bookingsLoading={bookingsLoading}
        listings={listings}
        recentReviews={recentReviews}
        recentReviewsLoading={recentReviewsLoading}
        token={token}
        t={t}
        locale={locale}
        localePath={localePath}
        tools={tools}
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl py-4">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-nexa-ink sm:text-3xl">
          {t("hostDashboard.title")}
        </h1>
        <p className="mt-1 text-nexa-ink-3">
          {t("hostDashboard.applicationStatus")}
        </p>
      </div>

      {error ? (
        <ErrorAlert
          error={error}
          className="mb-6"
          onDismiss={() => setError(null)}
        />
      ) : null}

      <div className="mb-8 overflow-hidden rounded-2xl border border-nexa-line bg-white">
        <div className="p-6 sm:p-8">
          <h2 className="mb-4 text-lg font-semibold text-nexa-ink">
            {t("hostDashboard.hostStatus")}
          </h2>
          {status === "NOT_STARTED" && (
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-nexa-ink-1 text-nexa-ink-4">
                <Building2 className="h-8 w-8" aria-hidden />
              </div>
              <div className="flex-1">
                <p className="font-medium text-nexa-ink">
                  {t("hostDashboard.notAppliedYet")}
                </p>
                <p className="mt-1 text-sm text-nexa-ink-3">
                  {t("hostDashboard.completeApplication")}
                </p>
                <Button className="mt-4" asChild>
                  <Link href={localePath("/host")}>
                    {t("hostDashboard.becomeHost")}
                  </Link>
                </Button>
              </div>
            </div>
          )}

          {status === "PENDING" && (
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                <Clock className="h-8 w-8" aria-hidden />
              </div>
              <div className="flex-1">
                <p className="font-medium text-nexa-ink">
                  {t("hostDashboard.underReview")}
                </p>
                <p className="mt-1 text-sm text-nexa-ink-3">
                  {hostStatus?.message ?? t("hostDashboard.reviewMessage")}
                </p>
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={localePath("/listings")}>
                      {t("hostDashboard.browseStays")}
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={localePath("/profile")}>{t("common.profile")}</Link>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {status === "REJECTED" && (
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700">
                <XCircle className="h-8 w-8" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-nexa-ink">
                  {t("hostDashboard.notApproved")}
                </p>
                <p className="mt-1 text-sm text-nexa-ink-3">
                  {t("hostDashboard.reapplyMessage")}
                </p>
                <div className="mt-4">
                  <Alert
                    variant="warning"
                    title={t("hostDashboard.rejectionReasonLabel")}
                  >
                    <span className="whitespace-pre-wrap">
                      {hostStatus?.rejection_reason?.trim() ||
                        t("hostDashboard.reapplyMessage")}
                    </span>
                  </Alert>
                </div>
                <Button className="mt-4" asChild>
                  <Link href={localePath("/host")}>
                    {t("hostDashboard.applyAgain")}
                  </Link>
                </Button>
              </div>
            </div>
          )}

          {status !== "NOT_STARTED" &&
          status !== "PENDING" &&
          status !== "REJECTED" ? (
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
                <FileCheck className="h-8 w-8" aria-hidden />
              </div>
              <div className="flex-1">
                <p className="font-medium text-nexa-ink">
                  {t("hostDashboard.approvedHost")}
                </p>
                <Button className="mt-4" asChild>
                  <Link
                    href={localePath("/host/listings/new")}
                    className="inline-flex items-center gap-2"
                  >
                    <PlusCircle className="h-4 w-4" aria-hidden />
                    {t("hostDashboard.addListing")}
                  </Link>
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex justify-center">
        <Button variant="ghost" asChild>
          <Link href={localePath("/")} className="inline-flex items-center gap-2">
            <Home className="h-4 w-4" aria-hidden />
            {t("hostDashboard.backToHome")}
          </Link>
        </Button>
      </div>
    </div>
  );
}

export default function HostDashboardPage() {
  return <HostDashboardContent />;
}
