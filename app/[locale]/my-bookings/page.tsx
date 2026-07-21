"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { NavBar } from "@/components/navbar/NavBar";
import { Footer } from "@/components/footer/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ErrorAlert } from "@/components/ui/Alert";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getGuestBookings, cancelBooking } from "@/lib/stays-api";
import { formatUserError } from "@/lib/errors";
import type { StaysBooking } from "@/lib/stays-types";
import {
  DEFAULT_BOOKING_FILTERS,
  filterAndSortBookings,
  countByTab,
  uniqueCities,
  type BookingTabId,
  type BookingFilters,
} from "@/lib/booking-lifecycle";
import { BookingTabs } from "@/components/bookings/BookingTabs";
import { BookingCard } from "@/components/bookings/BookingCard";
import { BookingFiltersPanel } from "@/components/bookings/BookingFiltersPanel";
import { BookingListSkeleton } from "@/components/bookings/BookingCardSkeleton";
import { CancelBookingDialog } from "@/components/bookings/CancelBookingDialog";
import { openConversationForBooking } from "@/lib/messaging/messages-api";
import {
  CalendarCheck,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

const PAGE_SIZE = 10;

function MyBookingsContent() {
  const { token } = useAuth();
  const { t, localePath } = useLanguage();
  const router = useRouter();
  const [bookings, setBookings] = useState<StaysBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<BookingTabId>("upcoming");
  const [draftFilters, setDraftFilters] = useState<BookingFilters>(DEFAULT_BOOKING_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<BookingFilters>(DEFAULT_BOOKING_FILTERS);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<StaysBooking | null>(null);
  const [messagingBookingId, setMessagingBookingId] = useState<string | null>(null);

  const handleMessageHost = useCallback(
    async (bookingId: string) => {
      if (!token) return;
      setMessagingBookingId(bookingId);
      setError(null);
      try {
        const conv = await openConversationForBooking(bookingId, token);
        router.push(localePath(`/inbox/${conv.conversation.id}`));
      } catch (e) {
        setError(formatUserError(e) || t("inbox.emptyBody"));
      } finally {
        setMessagingBookingId(null);
      }
    },
    [token, router, localePath, t],
  );

  const fetchBookings = useCallback(() => {
    if (!token) return;
    setLoading(true);
    setError(null);
    getGuestBookings(token)
      .then(setBookings)
      .catch((e) => setError(formatUserError(e) || t("myBookings.failedLoad")))
      .finally(() => setLoading(false));
  }, [token, t]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [activeTab, appliedFilters]);

  const tabCounts = useMemo(() => countByTab(bookings), [bookings]);
  const cities = useMemo(() => uniqueCities(bookings), [bookings]);

  const filteredBookings = useMemo(
    () => filterAndSortBookings(bookings, activeTab, appliedFilters),
    [bookings, activeTab, appliedFilters],
  );

  const visibleBookings = filteredBookings.slice(0, visibleCount);
  const hasMore = visibleCount < filteredBookings.length;

  const handleCancel = async (reason?: string) => {
    if (!token || !cancelTarget) return;
    const id = cancelTarget.id;
    setCancellingId(id);
    try {
      await cancelBooking(id, "guest", reason, token);
      setCancelTarget(null);
      fetchBookings();
    } catch (e) {
      setError(formatUserError(e) || t("myBookings.cancellationFailed"));
    } finally {
      setCancellingId(null);
    }
  };

  const tabSectionTitle: Record<BookingTabId, string> = {
    upcoming: t("myBookings.sections.upcoming"),
    current: t("myBookings.sections.current"),
    pending: t("myBookings.sections.pending"),
    completed: t("myBookings.sections.completed"),
    cancelled: t("myBookings.sections.cancelled"),
    all: t("myBookings.sections.all"),
  };

  const tabSectionDesc: Record<BookingTabId, string> = {
    upcoming: t("myBookings.sections.upcomingDesc"),
    current: t("myBookings.sections.currentDesc"),
    pending: t("myBookings.sections.pendingDesc"),
    completed: t("myBookings.sections.completedDesc"),
    cancelled: t("myBookings.sections.cancelledDesc"),
    all: t("myBookings.sections.allDesc"),
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
      <header className="mb-8">
        <h1 className="font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl font-bold text-nexa-ink tracking-tight">
          {t("myBookings.title")}
        </h1>
        <p className="text-nexa-ink-3 mt-2 max-w-2xl">{t("myBookings.subtitle")}</p>
      </header>

      {error && (
        <ErrorAlert
          error={error}
          className="mb-6"
          onDismiss={() => setError(null)}
        />
      )}

      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-nexa-ink-4"
            aria-hidden
          />
          <Input
            type="search"
            value={draftFilters.search}
            onChange={(e) => {
              const search = e.target.value;
              setDraftFilters((f) => ({ ...f, search }));
              setAppliedFilters((f) => ({ ...f, search }));
            }}
            placeholder={t("myBookings.searchPlaceholder")}
            className="pl-10 h-11 rounded-xl"
            aria-label={t("myBookings.searchPlaceholder")}
          />
        </div>
        <Button
          variant="outline"
          className="lg:hidden gap-2 h-11"
          onClick={() => setMobileFiltersOpen(true)}
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden />
          {t("myBookings.filterSort")}
        </Button>
      </div>

      <div className="mb-8">
        <BookingTabs
          activeTab={activeTab}
          counts={tabCounts}
          onChange={setActiveTab}
          t={t}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 items-start">
        <section
          id={`bookings-panel-${activeTab}`}
          role="tabpanel"
          aria-labelledby={`bookings-tab-${activeTab}`}
        >
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-nexa-ink">{tabSectionTitle[activeTab]}</h2>
            <p className="text-sm text-nexa-ink-3 mt-0.5">{tabSectionDesc[activeTab]}</p>
          </div>

          {loading ? (
            <BookingListSkeleton count={3} />
          ) : bookings.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-nexa-line bg-nexa-bg-1 p-12 text-center">
              <CalendarCheck className="h-14 w-14 text-nexa-ink-4 mx-auto mb-4" aria-hidden />
              <p className="text-nexa-ink font-medium">{t("myBookings.noBookingsYet")}</p>
              <p className="text-nexa-ink-3 text-sm mt-1">{t("myBookings.browseFirst")}</p>
              <Button asChild className="mt-4">
                <Link href={localePath("/listings")}>{t("myBookings.browseStays")}</Link>
              </Button>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="rounded-2xl border border-nexa-line bg-white p-10 text-center">
              {activeTab === "completed" &&
              !appliedFilters.search &&
              appliedFilters.status === "all" &&
              appliedFilters.city === "all" ? (
                <>
                  <CalendarCheck className="h-14 w-14 text-nexa-ink-4 mx-auto mb-4" aria-hidden />
                  <p className="text-nexa-ink font-medium">{t("myBookings.completedEmptyTitle")}</p>
                  <p className="text-nexa-ink-3 text-sm mt-1">{t("myBookings.completedEmptyBody")}</p>
                  <Button asChild className="mt-4">
                    <Link href={localePath("/listings")}>{t("myBookings.browseStays")}</Link>
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-nexa-ink font-medium">{t("myBookings.noResults")}</p>
                  <p className="text-nexa-ink-3 text-sm mt-1">{t("myBookings.noResultsHint")}</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                      setDraftFilters(DEFAULT_BOOKING_FILTERS);
                      setAppliedFilters(DEFAULT_BOOKING_FILTERS);
                    }}
                  >
                    {t("myBookings.clearFilters")}
                  </Button>
                </>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {visibleBookings.map((b) => (
                  <BookingCard
                    key={b.id}
                    booking={b}
                    localePath={localePath}
                    t={t}
                    onCancel={() => setCancelTarget(b)}
                    onMessageHost={handleMessageHost}
                    messagingBookingId={messagingBookingId}
                    cancelling={cancellingId === b.id}
                  />
                ))}
              </div>
              {hasMore && (
                <div className="mt-6 text-center">
                  <Button
                    variant="outline"
                    onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                  >
                    {t("myBookings.loadMore")}
                  </Button>
                </div>
              )}
            </>
          )}
        </section>

        <BookingFiltersPanel
          className="hidden lg:block"
          filters={draftFilters}
          cities={cities}
          onChange={(patch) => setDraftFilters((f) => ({ ...f, ...patch }))}
          onApply={() => setAppliedFilters({ ...draftFilters })}
          onClear={() => {
            setDraftFilters(DEFAULT_BOOKING_FILTERS);
            setAppliedFilters(DEFAULT_BOOKING_FILTERS);
          }}
          t={t}
        />
      </div>

      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label={t("common.close")}
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-white p-5 shadow-nexa-lg animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-nexa-ink">{t("myBookings.filterSort")}</h2>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="p-2 rounded-lg hover:bg-nexa-bg-1"
                aria-label={t("common.close")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <BookingFiltersPanel
              embedded
              filters={draftFilters}
              cities={cities}
              onChange={(patch) => setDraftFilters((f) => ({ ...f, ...patch }))}
              onApply={() => {
                setAppliedFilters({ ...draftFilters });
                setMobileFiltersOpen(false);
              }}
              onClear={() => {
                setDraftFilters(DEFAULT_BOOKING_FILTERS);
                setAppliedFilters(DEFAULT_BOOKING_FILTERS);
              }}
              t={t}
            />
          </div>
        </div>
      )}

      <CancelBookingDialog
        booking={cancelTarget}
        role="guest"
        open={!!cancelTarget}
        loading={!!cancellingId}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancel}
        t={t}
      />
    </div>
  );
}

export default function MyBookingsPage() {
  return (
    <>
      <NavBar />
      <main className="pt-[72px] min-h-screen bg-nexa-bg-1">
        <ProtectedRoute>
          <MyBookingsContent />
        </ProtectedRoute>
      </main>
      <Footer />
    </>
  );
}
