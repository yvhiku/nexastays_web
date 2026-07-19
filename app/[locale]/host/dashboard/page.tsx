"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { NavBar } from "@/components/navbar/NavBar";
import { Button } from "@/components/ui/button";
import { Alert, ErrorAlert } from "@/components/ui/Alert";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { getHostVerification, getHostListings, getHostBookings, getHostStats, pauseHostListing, resumeHostListing, normalizeHostVerificationStatus, setHostAvailabilityBlock } from "@/lib/stays-api";
import { formatUserError } from "@/lib/errors";
import type { HostVerificationStatus, HostListingSummary, HostBooking, HostDashboardStats } from "@/lib/stays-types";
import { computeHostDashboardStats } from "@/lib/host-dashboard-stats";
import { HostKpiSection } from "@/components/host/HostKpiSection";
import { HostCalendarSyncPanel } from "@/components/host/HostCalendarSyncPanel";
import { AppLoader } from "@/components/AppLoader";
import {
  Home,
  PlusCircle,
  FileCheck,
  Clock,
  XCircle,
  LayoutDashboard,
  Building2,
  CalendarCheck,
  Pencil,
  Pause,
  Play,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";

function listingStatusClass(status: string): string {
  if (status === "LIVE" || status === "APPROVED") return "text-green-600";
  if (status === "PAUSED") return "text-orange-600";
  if (status === "SUBMITTED") return "text-amber-600";
  if (status === "DRAFT") return "text-nexa-primary";
  if (status === "REJECTED") return "text-red-600";
  return "text-nexa-ink-4";
}

function hostFacingStatus(status: string): string {
  if (status === "REJECTED") return "Needs Changes";
  if (status === "SUBMITTED") return "In review";
  if (status === "DRAFT") return "Draft";
  return status;
}

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

function HostDashboardContent() {
  const { token } = useAuth();
  const { t, tf, localePath } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [hostStatus, setHostStatus] = useState<HostVerificationStatus | null>(null);
  const [listings, setListings] = useState<HostListingSummary[]>([]);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [bookings, setBookings] = useState<HostBooking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [stats, setStats] = useState<HostDashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [listingActionId, setListingActionId] = useState<string | null>(null);
  const [listingActionError, setListingActionError] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState(
    () => searchParams.get("saved") === "1",
  );
  const [blockListingId, setBlockListingId] = useState("");
  const [blockFrom, setBlockFrom] = useState("");
  const [blockTo, setBlockTo] = useState("");
  const [blockAction, setBlockAction] = useState<"block" | "unblock">("block");
  const [blockSubmitting, setBlockSubmitting] = useState(false);
  const [blockMessage, setBlockMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    trackEvent("host_dashboard_viewed");
    setLoading(true);
    setError(null);
    getHostVerification(token)
      .then((s) => setHostStatus(normalizeHostVerificationStatus(s)))
      .catch((e) => setError(formatUserError(e) || t("hostDashboard.failedLoad")))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (searchParams.get("saved") !== "1") return;
    setSavedNotice(true);
    router.replace(localePath("/host/dashboard"), { scroll: false });
  }, [searchParams, router, localePath]);

  useEffect(() => {
    if (!token || (hostStatus?.status ?? "") !== "APPROVED") return;
    setListingsLoading(true);
    getHostListings(token)
      .then(setListings)
      .catch(() => setListings([]))
      .finally(() => setListingsLoading(false));
  }, [token, hostStatus?.status]);

  useEffect(() => {
    if (!token) return;
    setBookingsLoading(true);
    getHostBookings(token)
      .then(setBookings)
      .catch(() => setBookings([]))
      .finally(() => setBookingsLoading(false));
  }, [token]);

  useEffect(() => {
    if (!token || (hostStatus?.status ?? "") !== "APPROVED") return;

    let cancelled = false;
    setStatsLoading(true);

    getHostStats(token)
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch(() => {
        if (!cancelled) setStats(null);
      })
      .finally(() => {
        if (!cancelled) setStatsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token, hostStatus?.status]);

  useEffect(() => {
    if (
      !token ||
      (hostStatus?.status ?? "") !== "APPROVED" ||
      statsLoading ||
      stats !== null
    ) {
      return;
    }
    setStats(computeHostDashboardStats(bookings, listings));
  }, [token, hostStatus?.status, statsLoading, stats, bookings, listings]);

  const refreshListings = useCallback(() => {
    if (!token) return;
    setListingsLoading(true);
    getHostListings(token)
      .then(setListings)
      .catch(() => setListings([]))
      .finally(() => setListingsLoading(false));
  }, [token]);

  const handlePauseListing = async (id: string) => {
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

  const handleResumeListing = async (id: string) => {
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

  const handleAvailabilityBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !blockListingId || !blockFrom || !blockTo) return;
    setBlockSubmitting(true);
    setListingActionError(null);
    setBlockMessage(null);
    try {
      const result = await setHostAvailabilityBlock(
        blockListingId,
        { from: blockFrom, to: blockTo, is_blocked: blockAction === "block" },
        token,
      );
      setBlockMessage(
        blockAction === "block"
          ? tf("hostDashboard.blockedNights", { count: result.nights })
          : tf("hostDashboard.unblockedNights", { count: result.nights }),
      );
      trackEvent("host_calendar_updated", {
        listing_id: blockListingId,
        from: blockFrom,
        to: blockTo,
        action: blockAction,
        nights: result.nights,
      });
    } catch (err) {
      setListingActionError(
        formatUserError(err) || t("hostDashboard.availabilityUpdateFailed"),
      );
    } finally {
      setBlockSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <AppLoader />
      </div>
    );
  }

  const status = hostStatus?.status ?? "NOT_STARTED";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-nexa-ink flex items-center gap-2">
            <LayoutDashboard className="h-8 w-8 text-nexa-primary" />
            {t("hostDashboard.title")}
          </h1>
          <p className="text-nexa-ink-3 mt-1">
            {status === "APPROVED"
              ? t("hostDashboard.manageListings")
              : t("hostDashboard.applicationStatus")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={localePath("/")}>{t("hostDashboard.home")}</Link>
          </Button>
          {status === "APPROVED" && (
            <Button size="sm" asChild>
              <Link href={localePath("/host/listings/new")} className="flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                {t("hostDashboard.addListing")}
              </Link>
            </Button>
          )}
        </div>
      </div>

      {savedNotice && (
        <Alert
          variant="success"
          title={t("hostListingEdit.saved")}
          className="mb-6"
          onDismiss={() => setSavedNotice(false)}
        />
      )}

      {error && (
        <ErrorAlert
          error={error}
          className="mb-6"
          onDismiss={() => setError(null)}
        />
      )}

      {/* Status card */}
      <div className="rounded-2xl border border-nexa-line bg-white overflow-hidden mb-8">
        <div className="p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-nexa-ink mb-4">{t("hostDashboard.hostStatus")}</h2>
          {status === "NOT_STARTED" && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-nexa-ink-1 text-nexa-ink-4 shrink-0">
                <Building2 className="h-8 w-8" />
              </div>
              <div className="flex-1">
                <p className="text-nexa-ink font-medium">{t("hostDashboard.notAppliedYet")}</p>
                <p className="text-nexa-ink-3 text-sm mt-1">
                  {t("hostDashboard.completeApplication")}
                </p>
                <Button className="mt-4" asChild>
                  <Link href={localePath("/host")}>{t("hostDashboard.becomeHost")}</Link>
                </Button>
              </div>
            </div>
          )}

          {status === "PENDING" && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 text-amber-700 shrink-0">
                <Clock className="h-8 w-8" />
              </div>
              <div className="flex-1">
                <p className="text-nexa-ink font-medium">{t("hostDashboard.underReview")}</p>
                <p className="text-nexa-ink-3 text-sm mt-1">
                  {hostStatus?.message ?? t("hostDashboard.reviewMessage")}
                </p>
                <p className="text-nexa-ink-4 text-xs mt-2">
                  {t("hostDashboard.meanwhileBrowse")}
                </p>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={localePath("/listings")}>{t("hostDashboard.browseStays")}</Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={localePath("/profile")}>{t("common.profile")}</Link>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {status === "REJECTED" && (
            <div className="flex flex-col sm:flex-row sm:items-start gap-6">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-700 shrink-0">
                <XCircle className="h-8 w-8" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-nexa-ink font-medium">{t("hostDashboard.notApproved")}</p>
                <p className="text-nexa-ink-3 text-sm mt-1">
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
                  <Link href={localePath("/host")}>{t("hostDashboard.applyAgain")}</Link>
                </Button>
              </div>
            </div>
          )}

          {status === "APPROVED" && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-700 shrink-0">
                <FileCheck className="h-8 w-8" />
              </div>
              <div className="flex-1">
                <p className="text-nexa-ink font-medium">{t("hostDashboard.approvedHost")}</p>
                <p className="text-nexa-ink-3 text-sm mt-1">
                  {t("hostDashboard.addListingDesc")}
                </p>
                <Button className="mt-4" asChild>
                  <Link href={localePath("/host/listings/new")} className="flex items-center gap-2">
                    <PlusCircle className="h-4 w-4" />
                    {t("hostDashboard.addListing")}
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* KPI overview — approved hosts */}
      {status === "APPROVED" && (
        <HostKpiSection
          stats={stats ?? computeHostDashboardStats(bookings, listings)}
          t={t}
          loading={statsLoading && stats === null}
        />
      )}

      {status === "APPROVED" && listings.length > 0 && (
        <div className="rounded-2xl border border-nexa-line bg-white overflow-hidden mb-8">
          <form onSubmit={handleAvailabilityBlock} className="p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-nexa-ink mb-2 flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-nexa-primary" />
              {t("hostDashboard.calendarBlocking")}
            </h2>
            <p className="text-sm text-nexa-ink-3 mb-5">
              {t("hostDashboard.calendarBlockingDesc")}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr_1fr_auto] gap-3">
              <label className="text-sm">
                <span className="sr-only">{t("hostDashboard.listing")}</span>
                <select
                  value={blockListingId}
                  onChange={(e) => setBlockListingId(e.target.value)}
                  className="h-11 w-full rounded-xl border border-nexa-line bg-white px-3 text-sm text-nexa-ink"
                  required
                >
                  <option value="">{t("hostDashboard.selectListing")}</option>
                  {listings.map((listing) => (
                    <option key={listing.id} value={listing.id}>
                      {listing.title}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                <span className="sr-only">{t("hostDashboard.fromDate")}</span>
                <input
                  type="date"
                  value={blockFrom}
                  onChange={(e) => setBlockFrom(e.target.value)}
                  className="h-11 w-full rounded-xl border border-nexa-line px-3 text-sm text-nexa-ink"
                  required
                />
              </label>
              <label className="text-sm">
                <span className="sr-only">{t("hostDashboard.toDate")}</span>
                <input
                  type="date"
                  value={blockTo}
                  min={blockFrom || undefined}
                  onChange={(e) => setBlockTo(e.target.value)}
                  className="h-11 w-full rounded-xl border border-nexa-line px-3 text-sm text-nexa-ink"
                  required
                />
              </label>
              <label className="text-sm">
                <span className="sr-only">{t("hostDashboard.calendarAction")}</span>
                <select
                  value={blockAction}
                  onChange={(e) => setBlockAction(e.target.value === "unblock" ? "unblock" : "block")}
                  className="h-11 w-full rounded-xl border border-nexa-line bg-white px-3 text-sm text-nexa-ink"
                >
                  <option value="block">{t("hostDashboard.blockDates")}</option>
                  <option value="unblock">{t("hostDashboard.unblockDates")}</option>
                </select>
              </label>
              <Button type="submit" disabled={blockSubmitting} className="h-11">
                {blockSubmitting ? t("common.saving") : t("hostDashboard.updateCalendar")}
              </Button>
            </div>
            {blockMessage && (
              <p className="mt-3 text-sm text-green-700">{blockMessage}</p>
            )}
          </form>
        </div>
      )}

      {status === "APPROVED" && listings.length > 0 && token && (
        <HostCalendarSyncPanel
          listings={listings.map((l) => ({ id: l.id, title: l.title }))}
          token={token}
        />
      )}

      {/* Your bookings - for approved hosts */}
      {status === "APPROVED" && (
        <div className="rounded-2xl border border-nexa-line bg-white overflow-hidden mb-8">
          <div className="p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-nexa-ink mb-4 flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-nexa-primary" />
              {t("hostDashboard.yourBookings")}
            </h2>
            {bookingsLoading ? (
              <div className="py-12 text-center text-nexa-ink-4">{t("hostDashboard.loadingBookings")}</div>
            ) : bookings.length > 0 ? (
              <div className="space-y-4">
                {bookings.map((b) => (
                  <div
                    key={b.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border border-nexa-line hover:border-nexa-primary/30"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-nexa-ink">{b.listing?.title ?? t("hostDashboard.listing")}</p>
                      <p className="text-sm text-nexa-ink-3">
                        {b.guest_name ?? t("hostDashboard.guest")} · {b.checkin_date} – {b.checkout_date}
                      </p>
                      <p className="text-xs text-nexa-ink-4 mt-1">
                        Status: <span className={b.status === "CONFIRMED" ? "text-green-600" : "text-amber-600"}>{b.status}</span>
                        {b.total_paid != null && ` · ${b.total_paid} ${b.currency}`}
                      </p>
                    </div>
                    <Link href={localePath(`/bookings/${b.id}`)} className="text-sm text-nexa-primary font-medium shrink-0 hover:underline">
                      {t("hostDashboard.viewDetails")} →
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border-2 border-dashed border-nexa-line bg-nexa-bg-1 p-6 text-center">
                <CalendarCheck className="h-10 w-10 text-nexa-ink-4 mx-auto mb-2" />
                <p className="text-nexa-ink-3 text-sm">{t("hostDashboard.noBookingsYet")}</p>
                <p className="text-nexa-ink-4 text-xs mt-1">
                  {t("hostDashboard.bookingsAppearHere")}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Your listings - only for approved hosts */}
      {status === "APPROVED" && (
        <div className="rounded-2xl border border-nexa-line bg-white overflow-hidden">
          <div className="p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-nexa-ink mb-4">{t("hostDashboard.yourListings")}</h2>
            {listingActionError && (
              <ErrorAlert
                error={listingActionError}
                className="mb-4"
                compact
                onDismiss={() => setListingActionError(null)}
              />
            )}
            {listingsLoading ? (
              <div className="py-12 text-center text-nexa-ink-4">{t("hostDashboard.loadingListings")}</div>
            ) : listings.length > 0 ? (
              <div className="space-y-4">
                {listings.map((l) => {
                  const href = listingHref(l, localePath);
                  const pct = l.completion_percentage ?? 0;
                  const missingRequired = (l.missing ?? []).filter((m) => m.required);
                  return (
                    <div
                      key={l.id}
                      role="link"
                      tabIndex={0}
                      onClick={() => router.push(href)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          router.push(href);
                        }
                      }}
                      className={cn(
                        "cursor-pointer rounded-xl border border-nexa-line p-4 transition-colors",
                        "hover:border-nexa-primary/40 hover:bg-nexa-primary-soft/20",
                      )}
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-nexa-ink">
                            {l.title === "Untitled listing"
                              ? "Untitled draft"
                              : l.title}
                          </p>
                          <p className="text-sm text-nexa-ink-3">
                            {l.city?.trim() || "Location pending"} · {l.listing_type}
                          </p>
                          <p className="mt-1 text-xs text-nexa-ink-4">
                            {t("hostDashboard.status")}:{" "}
                            <span className={listingStatusClass(l.status)}>
                              {hostFacingStatus(l.status)}
                            </span>
                            {l.rate_plan &&
                              l.rate_plan.base_price > 0 &&
                              ` · ${l.rate_plan.base_price} ${l.rate_plan.currency}/night`}
                          </p>
                          {(l.status === "DRAFT" || l.status === "REJECTED") && (
                            <div className="mt-3">
                              <div className="mb-1 flex items-center justify-between text-xs text-nexa-ink-4">
                                <span>Listing complete</span>
                                <span className="tabular-nums font-semibold text-nexa-ink-2">
                                  {pct}%
                                </span>
                              </div>
                              <div className="h-1.5 overflow-hidden rounded-full bg-nexa-line">
                                <div
                                  className="h-full rounded-full bg-nexa-primary transition-all"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              {missingRequired.length > 0 && (
                                <p className="mt-2 text-xs text-nexa-ink-4">
                                  Still needed:{" "}
                                  {missingRequired.map((m) => m.label).join(", ")}
                                </p>
                              )}
                            </div>
                          )}
                          {l.status === "SUBMITTED" && (
                            <p className="mt-2 text-xs text-amber-700">
                              Review usually takes 1–2 business days.
                            </p>
                          )}
                          {l.status === "REJECTED" && (
                            <p className="mt-2 text-xs text-red-700">
                              Fix the items below and resubmit for review.
                            </p>
                          )}
                        </div>
                        <div
                          className="flex shrink-0 flex-wrap items-center gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {(l.status === "DRAFT" || l.status === "REJECTED") && (
                            <Button variant="outline" size="sm" asChild>
                              <Link href={href} className="flex items-center gap-1.5">
                                <Pencil className="h-3.5 w-3.5" />
                                {l.status === "REJECTED" ? "Fix & Resubmit" : "Continue"}
                              </Link>
                            </Button>
                          )}
                          {l.status !== "DRAFT" && l.status !== "REJECTED" && (
                            <Button variant="outline" size="sm" asChild>
                              <Link
                                href={localePath(`/host/listings/${l.id}/edit`)}
                                className="flex items-center gap-1.5"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                {t("hostDashboard.edit")}
                              </Link>
                            </Button>
                          )}
                          {listingCanPause(l.status) && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={listingActionId === l.id}
                              onClick={() => handlePauseListing(l.id)}
                              className="flex items-center gap-1.5"
                            >
                              <Pause className="h-3.5 w-3.5" />
                              {listingActionId === l.id
                                ? t("hostDashboard.pausing")
                                : t("hostDashboard.pause")}
                            </Button>
                          )}
                          {l.status === "PAUSED" && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={listingActionId === l.id}
                              onClick={() => handleResumeListing(l.id)}
                              className="flex items-center gap-1.5"
                            >
                              <Play className="h-3.5 w-3.5" />
                              {listingActionId === l.id
                                ? t("hostDashboard.resuming")
                                : t("hostDashboard.resume")}
                            </Button>
                          )}
                          {listingIsPublic(l.status) ? (
                            <Link
                              href={localePath(`/listings/${l.id}`)}
                              className="px-1 text-sm font-medium text-nexa-primary hover:underline"
                            >
                              {t("hostDashboard.view")} →
                            </Link>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <Button variant="outline" className="mt-2" asChild>
                  <Link href={localePath("/host/listings/new")} className="flex items-center gap-2">
                    <PlusCircle className="h-4 w-4" />
                    {t("hostDashboard.addAnotherListing")}
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="rounded-xl border-2 border-dashed border-nexa-line bg-nexa-bg-1 p-8 text-center">
                <Building2 className="h-12 w-12 text-nexa-ink-4 mx-auto mb-3" />
              <p className="text-nexa-ink font-medium">{t("hostDashboard.noListingsYet")}</p>
              <p className="text-nexa-ink-3 text-sm mt-1 max-w-sm mx-auto">
                {t("hostDashboard.addFirstProperty")}
              </p>
              <Button className="mt-4" asChild>
                <Link href={localePath("/host/listings/new")} className="flex items-center gap-2">
                  <PlusCircle className="h-4 w-4" />
                  {t("hostDashboard.addListing")}
                </Link>
              </Button>
            </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-8 flex justify-center">
        <Button variant="ghost" asChild>
          <Link href={localePath("/")} className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            {t("hostDashboard.backToHome")}
          </Link>
        </Button>
      </div>
    </div>
  );
}

export default function HostDashboardPage() {
  return (
    <>
      <NavBar />
      <main className="pt-[72px] min-h-screen bg-nexa-bg-1">
        <ProtectedRoute>
          <HostDashboardContent />
        </ProtectedRoute>
      </main>
    </>
  );
}
