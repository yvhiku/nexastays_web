"use client";

import React from "react";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import type {
  HostBooking,
  HostDashboardAggregate,
  HostListingSummary,
  HostReview,
} from "@/lib/stays-types";
import type { Locale } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { HostDashboardWelcome } from "@/components/host/dashboard/HostDashboardWelcome";
import { HostDashboardKpiRow } from "@/components/host/dashboard/HostDashboardKpiRow";
import { HostDashboardQuickLinks } from "@/components/host/dashboard/HostDashboardQuickLinks";
import { HostDashboardRecentReviews } from "@/components/host/dashboard/HostDashboardRecentReviews";
import { HostTodaySection } from "@/components/host/HostTodaySection";
import { HostUpcomingSection } from "@/components/host/HostUpcomingSection";
import { HostPayoutStatus } from "@/components/host/HostPayoutStatus";
import { HostDashboardHero } from "@/components/host/HostDashboardHero";
import { HostBusinessSnapshot } from "@/components/host/HostBusinessSnapshot";
import { HostCalendarSyncPanel } from "@/components/host/HostCalendarSyncPanel";
import { HostDashboardTools } from "@/components/host/dashboard/HostDashboardTools";
import { ErrorAlert } from "@/components/ui/Alert";

type TranslateFn = (key: string) => string;

export type HostDashboardHomeProps = {
  hostName: string;
  dashboard: HostDashboardAggregate | null;
  dashboardLoading: boolean;
  dashboardError: string | null;
  onRetryDashboard: () => void;
  bookings: HostBooking[];
  bookingsLoading: boolean;
  bookingsError?: string | null;
  onRetryBookings?: () => void;
  listings: HostListingSummary[];
  recentReviews: HostReview[];
  recentReviewsLoading: boolean;
  recentReviewsError?: string | null;
  onRetryRecentReviews?: () => void;
  token: string;
  t: TranslateFn;
  locale: Locale;
  localePath: (path: string) => string;
  tools?: React.ReactNode;
};

export function HostDashboardHome({
  hostName,
  dashboard,
  dashboardLoading,
  dashboardError,
  onRetryDashboard,
  bookings,
  bookingsLoading,
  bookingsError,
  onRetryBookings,
  listings,
  recentReviews,
  recentReviewsLoading,
  recentReviewsError,
  onRetryRecentReviews,
  token,
  t,
  locale,
  localePath,
  tools,
}: HostDashboardHomeProps) {
  return (
    <div className="pb-4">
      <HostDashboardWelcome
        hostName={hostName}
        asOf={dashboard?.as_of ?? null}
        timezone={dashboard?.timezone ?? null}
        t={t}
        actions={
          <Button size="sm" asChild>
            <Link
              href={localePath("/host/listings/new")}
              className="inline-flex items-center gap-2"
            >
              <PlusCircle className="h-4 w-4" aria-hidden />
              {t("hostPortal.nav.listNewProperty")}
            </Link>
          </Button>
        }
      />

      {dashboardError ? (
        <ErrorAlert
          error={dashboardError}
          className="mb-6"
          action={
            <button
              type="button"
              className="text-sm font-medium text-nexa-primary underline"
              onClick={onRetryDashboard}
            >
              {t("hostDashboard.retryDashboard")}
            </button>
          }
        />
      ) : null}

      <HostDashboardKpiRow
        dashboard={dashboard}
        loading={dashboardLoading}
        t={t}
        locale={locale}
        localePath={localePath}
      />

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <HostTodaySection
            dashboard={dashboard}
            loading={dashboardLoading}
            t={t}
            localePath={localePath}
          />
          <HostUpcomingSection
            dashboard={dashboard}
            bookings={bookings}
            bookingsLoading={bookingsLoading}
            bookingsError={bookingsError}
            onRetryBookings={onRetryBookings}
            loading={dashboardLoading}
            t={t}
            localePath={localePath}
          />
        </div>
        <div className="space-y-6">
          <HostPayoutStatus
            dashboard={dashboard}
            loading={dashboardLoading}
            t={t}
            locale={locale}
          />
          <HostDashboardHero
            dashboard={dashboard}
            loading={dashboardLoading}
            t={t}
            locale={locale}
            localePath={localePath}
          />
        </div>
      </div>

      <HostBusinessSnapshot
        dashboard={dashboard}
        loading={dashboardLoading}
        t={t}
        locale={locale}
        localePath={localePath}
      />

      <HostDashboardRecentReviews
        reviews={recentReviews}
        loading={recentReviewsLoading}
        error={recentReviewsError}
        onRetry={onRetryRecentReviews}
        t={t}
        locale={locale}
        localePath={localePath}
      />

      {(listings.length > 0 && token) || tools ? (
        <HostDashboardTools
          title={t("hostPortal.dashboard.toolsTitle")}
          description={t("hostPortal.dashboard.toolsDesc")}
        >
          {listings.length > 0 && token ? (
            <HostCalendarSyncPanel
              listings={listings.map((l) => ({ id: l.id, title: l.title }))}
              token={token}
              t={t}
            />
          ) : null}
          {tools}
        </HostDashboardTools>
      ) : null}

      <HostDashboardQuickLinks t={t} localePath={localePath} />
    </div>
  );
}
