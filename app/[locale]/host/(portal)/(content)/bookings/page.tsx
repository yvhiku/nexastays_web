"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  exportHostBookingsCsv,
  getHostListingOptions,
  getHostVerification,
  normalizeHostVerificationStatus,
  type HostListingOption,
} from "@/lib/stays-api";
import { formatUserError } from "@/lib/errors";
import type { HostVerificationStatus } from "@/lib/stays-types";
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
  const [listingOptions, setListingOptions] = useState<HostListingOption[]>(
    [],
  );
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
  const [exportError, setExportError] = useState<string | null>(null);

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
      router.replace(localePath(`/host/bookings${q ? `?${q}` : ""}`), {
        scroll: false,
      });
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

  useEffect(() => {
    if ((hostStatus?.status ?? "") !== "APPROVED" || !token) return;
    getHostListingOptions(token)
      .then(setListingOptions)
      .catch(() => setListingOptions([]));
  }, [hostStatus?.status, token]);

  const handleExportBookingsCsv = async () => {
    if (!token) return;
    setExportSubmitting(true);
    setExportError(null);
    try {
      await exportHostBookingsCsv(token, {
        period: exportPeriod,
        from: exportPeriod === "custom" ? exportFrom || undefined : undefined,
        to: exportPeriod === "custom" ? exportTo || undefined : undefined,
        listing_id: exportListingId || undefined,
        status: exportStatus || undefined,
      });
    } catch (e) {
      setExportError(
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
    <>
      {exportError ? (
        <p className="mb-3 text-sm text-red-800">{exportError}</p>
      ) : null}
      <HostBookingsPage
        listingOptions={listingOptions}
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
    </>
  );
}
