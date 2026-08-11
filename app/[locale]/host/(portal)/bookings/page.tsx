"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  exportHostBookingsCsv,
  getHostBookings,
  getHostListings,
  getHostVerification,
  normalizeHostVerificationStatus,
} from "@/lib/stays-api";
import { formatUserError } from "@/lib/errors";
import type {
  HostBooking,
  HostListingSummary,
  HostVerificationStatus,
} from "@/lib/stays-types";
import { HostBookingsPage } from "@/components/host/bookings/HostBookingsPage";
import {
  isHostBookingFilterId,
  type HostBookingFilterId,
} from "@/lib/host-booking-center";
import { AppLoader } from "@/components/AppLoader";

function parseBookingFilter(raw: string | null): HostBookingFilterId {
  if (raw && isHostBookingFilterId(raw)) return raw;
  return "all";
}

export default function HostBookingsRoutePage() {
  const { token } = useAuth();
  const { t, locale, localePath } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [hostStatus, setHostStatus] = useState<HostVerificationStatus | null>(
    null,
  );
  const [gateLoading, setGateLoading] = useState(true);
  const [gateError, setGateError] = useState<string | null>(null);
  const [listings, setListings] = useState<HostListingSummary[]>([]);
  const [bookings, setBookings] = useState<HostBooking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  const [bookingFilter, setBookingFilter] = useState<HostBookingFilterId>(() =>
    parseBookingFilter(searchParams.get("filter")),
  );
  const [exportPeriod, setExportPeriod] = useState<
    "last_30_days" | "this_year" | "all" | "custom"
  >("all");
  const [exportFrom, setExportFrom] = useState("");
  const [exportTo, setExportTo] = useState("");
  const [exportListingId, setExportListingId] = useState("");
  const [exportStatus, setExportStatus] = useState("");
  const [exportSubmitting, setExportSubmitting] = useState(false);

  useEffect(() => {
    setBookingFilter(parseBookingFilter(searchParams.get("filter")));
  }, [searchParams]);

  const handleFilterChange = useCallback(
    (next: HostBookingFilterId) => {
      setBookingFilter(next);
      const params = new URLSearchParams(searchParams.toString());
      if (next === "all") params.delete("filter");
      else params.set("filter", next);
      const q = params.toString();
      router.replace(
        localePath(`/host/bookings${q ? `?${q}` : ""}`),
        { scroll: false },
      );
    },
    [localePath, router, searchParams],
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

  const loadBookings = useCallback(async () => {
    if (!token) return;
    setBookingsLoading(true);
    setBookingsError(null);
    try {
      const rows = await getHostBookings(token);
      setBookings(rows);
    } catch (e) {
      setBookings([]);
      setBookingsError(
        formatUserError(e) || t("hostDashboard.bookingsLoadFailed"),
      );
    } finally {
      setBookingsLoading(false);
    }
  }, [token, t]);

  useEffect(() => {
    if ((hostStatus?.status ?? "") !== "APPROVED" || !token) return;
    void loadBookings();
    getHostListings(token)
      .then(setListings)
      .catch(() => setListings([]));
  }, [hostStatus?.status, token, loadBookings]);

  const handleExportBookingsCsv = async () => {
    if (!token) return;
    setExportSubmitting(true);
    try {
      await exportHostBookingsCsv(token, {
        period: exportPeriod,
        from: exportPeriod === "custom" ? exportFrom || undefined : undefined,
        to: exportPeriod === "custom" ? exportTo || undefined : undefined,
        listing_id: exportListingId || undefined,
        status: exportStatus || undefined,
      });
    } catch (e) {
      setBookingsError(
        formatUserError(e) || t("hostDashboard.exportCsvFailed"),
      );
    } finally {
      setExportSubmitting(false);
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
        <p className="mb-6 text-nexa-ink-3">{t("hostAnalytics.notApproved")}</p>
        <Button asChild>
          <Link href={localePath("/host/dashboard")}>
            {t("hostPortal.nav.home")}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <HostBookingsPage
      bookings={bookings}
      listings={listings}
      loading={bookingsLoading}
      error={bookingsError}
      onRetry={() => void loadBookings()}
      filter={bookingFilter}
      onFilterChange={handleFilterChange}
      t={t}
      locale={locale}
      localePath={localePath}
      token={token}
      exportState={{
        period: exportPeriod,
        from: exportFrom,
        to: exportTo,
        listingId: exportListingId,
        status: exportStatus,
      }}
      onExportStateChange={(patch) => {
        if (patch.period != null) setExportPeriod(patch.period);
        if (patch.from != null) setExportFrom(patch.from);
        if (patch.to != null) setExportTo(patch.to);
        if (patch.listingId != null) setExportListingId(patch.listingId);
        if (patch.status != null) setExportStatus(patch.status);
      }}
      onExportCsv={() => void handleExportBookingsCsv()}
      exportSubmitting={exportSubmitting}
    />
  );
}
