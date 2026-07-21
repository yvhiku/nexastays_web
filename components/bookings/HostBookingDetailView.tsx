"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Calendar,
  CalendarDays,
  ChevronRight,
  Download,
  MapPin,
  MessageCircle,
  Phone,
  Printer,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ListingHeroGallery } from "@/components/listing/ListingHeroGallery";
import { bookingNights } from "@/lib/booking-dates";
import {
  canCancelBooking,
  lifecycleBadgeClasses,
  resolveBookingLifecycle,
} from "@/lib/booking-lifecycle";
import type { StaysBooking } from "@/lib/stays-types";
import { cn } from "@/lib/utils";
import { openConversationForBooking } from "@/lib/messaging/messages-api";
import { useAuth } from "@/contexts/AuthContext";

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(value?: string | null): string | null {
  if (!value?.trim()) return null;
  const [h, m] = value.split(":");
  if (!h) return value;
  const hour = parseInt(h, 10);
  const suffix = hour >= 12 ? "PM" : "AM";
  const display = hour % 12 || 12;
  return `${display}:${m ?? "00"} ${suffix}`;
}

function primaryOccupant(booking: StaysBooking) {
  const list = booking.occupants ?? [];
  return (
    list.find((o) => o.is_primary) ??
    list.find((o) => o.full_name?.trim()) ??
    list[0] ??
    null
  );
}

function hostPayout(booking: StaysBooking): number {
  if (booking.payout_amount != null) return booking.payout_amount;
  return Math.max(0, booking.total_subtotal - (booking.host_fee ?? 0));
}

interface HostBookingDetailViewProps {
  booking: StaysBooking;
  t: (key: string) => string;
  tf: (key: string, vars: Record<string, string | number>) => string;
  localePath: (path: string) => string;
  onCancel?: () => void;
  cancelling?: boolean;
}

export function HostBookingDetailView({
  booking,
  t,
  tf,
  localePath,
  onCancel,
  cancelling = false,
}: HostBookingDetailViewProps) {
  const router = useRouter();
  const { token } = useAuth();
  const [messaging, setMessaging] = useState(false);

  const handleMessageGuest = async () => {
    if (!token) return;
    setMessaging(true);
    try {
      const conv = await openConversationForBooking(booking.id, token);
      router.push(localePath(`/inbox/${conv.id}`));
    } finally {
      setMessaging(false);
    }
  };

  const lifecycle = resolveBookingLifecycle(booking);
  const lifecycleKey = `myBookings.lifecycle.${lifecycle}`;
  const lifecycleLabel = t(lifecycleKey) !== lifecycleKey ? t(lifecycleKey) : lifecycle;
  const nights = bookingNights(booking.checkin_date, booking.checkout_date);
  const payout = hostPayout(booking);
  const guest = primaryOccupant(booking);
  const guestName =
    booking.guest_name?.trim() ||
    guest?.full_name?.trim() ||
    t("hostBooking.guest");
  const guestPhone = booking.guest_phone?.trim() || guest?.phone?.trim() || "";
  const guestEmail = guest?.email?.trim() || "";
  const guestId = guest?.id_number?.trim() || "";

  const checkinTime = formatTime(booking.listing?.checkin_time);
  const checkoutTime = formatTime(booking.listing?.checkout_time);

  const photoMedia = useMemo(
    () => booking.listing?.media?.filter((m) => m.kind === "PHOTO") ?? [],
    [booking.listing?.media],
  );

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-8 py-10 sm:py-12">
      <nav className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-nexa-ink-4 mb-2">
        <Link href={localePath("/host/dashboard")} className="hover:text-nexa-primary transition-colors">
          {t("nav.hostDashboard")}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        <span>{t("hostBooking.breadcrumb")}</span>
      </nav>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 sm:mb-10">
        <div>
          <Link
            href={localePath("/host/dashboard")}
            className="inline-flex items-center gap-2 text-sm text-nexa-ink-3 hover:text-nexa-primary mb-4 transition-colors md:hidden"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {t("hostBooking.backToDashboard")}
          </Link>
          <h1 className="font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl font-bold text-nexa-ink">
            {t("hostBooking.title")}
          </h1>
          <p className="text-sm text-nexa-ink-4 mt-1 font-mono">{booking.id}</p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium border",
              lifecycleBadgeClasses(lifecycle),
            )}
          >
            <span className="h-2 w-2 rounded-full bg-current opacity-70" />
            {lifecycleLabel}
          </span>
          <button
            type="button"
            onClick={() => window.print()}
            className="p-2 rounded-full hover:bg-nexa-bg-2 text-nexa-ink-4 transition-colors"
            aria-label={t("hostBooking.print")}
          >
            <Printer className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Guest information */}
          <section className="bg-white/80 backdrop-blur-xl rounded-[24px] border border-nexa-line/60 p-6 sm:p-8 shadow-nexa-card">
            <h2 className="font-[family-name:var(--font-playfair)] text-xl sm:text-2xl font-semibold text-nexa-ink mb-6">
              {t("hostBooking.guestInformation")}
            </h2>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="relative shrink-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-nexa-primary-soft border-2 border-nexa-primary/30 flex items-center justify-center text-2xl font-semibold text-nexa-primary">
                  {guestName.charAt(0).toUpperCase()}
                </div>
                <span className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow-sm">
                  <BadgeCheck className="h-5 w-5 text-green-600" />
                </span>
              </div>
              <div className="flex-grow min-w-0">
                <h3 className="text-lg font-semibold text-nexa-ink mb-1">{guestName}</h3>
                <p className="text-sm text-nexa-ink-3 mb-1">
                  {t("hostBooking.identityVerified")}
                  {guestId ? ` · ${t("hostBooking.guestId")}: ${guestId}` : ""}
                </p>
                {guestEmail && (
                  <p className="text-sm text-nexa-ink-4 mb-4">{guestEmail}</p>
                )}
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    className="rounded-full gap-2"
                    disabled={messaging}
                    onClick={() => void handleMessageGuest()}
                  >
                    <MessageCircle className="h-4 w-4" />
                    {messaging ? t("inbox.opening") : t("hostBooking.messageGuest")}
                  </Button>
                  {guestPhone && (
                    <Button asChild variant="outline" className="rounded-full gap-2">
                      <a href={`tel:${guestPhone.replace(/\s/g, "")}`}>
                        <Phone className="h-4 w-4" />
                        {t("hostBooking.callGuest")}
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {(booking.occupants?.length ?? 0) > 1 && (
              <div className="mt-6 pt-6 border-t border-nexa-line/60">
                <p className="text-xs font-semibold uppercase tracking-wide text-nexa-ink-4 mb-3">
                  {t("hostBooking.allGuests")}
                </p>
                <ul className="space-y-2">
                  {booking.occupants!.map((o, i) => (
                    <li key={i} className="text-sm text-nexa-ink">
                      <span className="font-medium">{o.full_name}</span>
                      {o.id_number && (
                        <span className="text-nexa-ink-4"> · ID: {o.id_number}</span>
                      )}
                      {o.is_primary && (
                        <span className="ml-2 text-xs text-nexa-primary font-medium">
                          ({t("hostBooking.primaryGuest")})
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* Stay details */}
          <section className="bg-white/80 backdrop-blur-xl rounded-[24px] border border-nexa-line/60 p-6 sm:p-8 shadow-nexa-card">
            <div className="flex justify-between items-start mb-6">
              <h2 className="font-[family-name:var(--font-playfair)] text-xl sm:text-2xl font-semibold text-nexa-ink">
                {t("hostBooking.stayDetails")}
              </h2>
              {booking.listing && (
                <Link
                  href={localePath(`/host/listings/${booking.listing.id}/edit`)}
                  className="text-sm font-medium text-nexa-primary hover:underline shrink-0"
                >
                  {t("hostBooking.viewListing")}
                </Link>
              )}
            </div>

            {booking.listing && photoMedia.length > 0 && (
              <div className="mb-6 rounded-2xl overflow-hidden max-h-48">
                <ListingHeroGallery
                  listingId={booking.listing.id}
                  media={photoMedia}
                  alt={booking.listing.title}
                />
              </div>
            )}

            <div className="mb-8 pb-8 border-b border-nexa-line/60">
              <h3 className="text-lg font-semibold text-nexa-ink mb-1">
                {booking.listing?.title ?? "—"}
              </h3>
              <p className="text-sm text-nexa-ink-3 flex items-center gap-1.5">
                <MapPin className="h-4 w-4 shrink-0" aria-hidden />
                {booking.listing?.city ?? "—"}
              </p>
              <div className="flex items-center gap-4 mt-4 text-sm text-nexa-ink-3">
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  {tf("hostBooking.guestCount", { count: booking.guest_count })}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-nexa-bg-1 p-5 rounded-2xl flex items-center gap-4">
                <div className="p-3 bg-white rounded-full shadow-sm text-nexa-primary">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-nexa-ink-4">
                    {t("hostBooking.checkIn")}
                  </p>
                  <p className="font-semibold text-nexa-ink">
                    {formatDate(booking.checkin_date)}
                  </p>
                  {checkinTime && (
                    <p className="text-sm text-nexa-ink-4">
                      {tf("hostBooking.afterTime", { time: checkinTime })}
                    </p>
                  )}
                </div>
              </div>
              <div className="bg-nexa-bg-1 p-5 rounded-2xl flex items-center gap-4">
                <div className="p-3 bg-white rounded-full shadow-sm text-nexa-primary">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-nexa-ink-4">
                    {t("hostBooking.checkOut")}
                  </p>
                  <p className="font-semibold text-nexa-ink">
                    {formatDate(booking.checkout_date)}
                  </p>
                  {checkoutTime && (
                    <p className="text-sm text-nexa-ink-4">
                      {tf("hostBooking.beforeTime", { time: checkoutTime })}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {booking.listing?.address && (
              <div className="mt-6 p-4 rounded-xl bg-nexa-bg-1 border border-nexa-line/40">
                <p className="text-xs font-semibold uppercase tracking-wide text-nexa-ink-4 mb-1">
                  {t("bookings.propertyLocation")}
                </p>
                <p className="text-sm text-nexa-ink">{booking.listing.address}</p>
              </div>
            )}
          </section>
        </div>

        {/* Payout sidebar */}
        <aside className="lg:col-span-4">
          <div className="lg:sticky lg:top-28 bg-white/80 backdrop-blur-xl rounded-[24px] border border-nexa-primary/10 p-6 sm:p-8 shadow-nexa-card">
            <h2 className="font-[family-name:var(--font-playfair)] text-xl sm:text-2xl font-semibold text-nexa-ink mb-6">
              {t("hostBooking.payoutSummary")}
            </h2>
            <div className="space-y-3 text-sm mb-6">
              {nights > 0 && (
                <div className="flex justify-between text-nexa-ink-3">
                  <span>
                    {tf("hostBooking.nightsLine", {
                      nights,
                      currency: booking.currency,
                    })}
                  </span>
                  <span className="text-nexa-ink font-medium">
                    {booking.total_subtotal} {booking.currency}
                  </span>
                </div>
              )}
              {booking.host_fee > 0 && (
                <div className="flex justify-between text-nexa-ink-3">
                  <span>{t("hostBooking.serviceFee")}</span>
                  <span className="text-nexa-ink font-medium">
                    -{booking.host_fee} {booking.currency}
                  </span>
                </div>
              )}
            </div>
            <div className="pt-5 border-t border-nexa-line/60 mb-6">
              <div className="flex justify-between items-center">
                <span className="font-[family-name:var(--font-playfair)] text-lg font-semibold text-nexa-ink">
                  {t("hostBooking.totalPayout")}
                </span>
                <span className="font-[family-name:var(--font-playfair)] text-lg font-semibold text-nexa-primary">
                  {payout.toFixed(2)} {booking.currency}
                </span>
              </div>
              {paidStatuses.has(booking.status) && (
                <p className="text-xs text-nexa-ink-4 mt-2 text-right">
                  {tf("hostBooking.expectedPayout", {
                    date: formatDate(booking.checkin_date),
                  })}
                </p>
              )}
            </div>
            <div className="space-y-3">
              {canCancelBooking(booking) && onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full rounded-2xl border-red-200 text-red-600 hover:bg-red-50"
                  disabled={cancelling}
                  onClick={onCancel}
                >
                  {cancelling ? t("myBookings.cancelling") : t("myBookings.cancelBooking")}
                </Button>
              )}
              <Button
                variant="outline"
                className="w-full rounded-2xl gap-2"
                onClick={() => window.print()}
              >
                <Download className="h-4 w-4" />
                {t("bookings.downloadInvoice")}
              </Button>
            </div>
            <div className="mt-6 flex items-start gap-3 p-4 bg-nexa-bg-1 rounded-2xl">
              <BadgeCheck className="h-5 w-5 text-nexa-primary shrink-0 mt-0.5" />
              <p className="text-sm text-nexa-ink-3 leading-relaxed">
                {t("hostBooking.payoutHint")}
              </p>
            </div>
          </div>
        </aside>
      </div>

      <div className="mt-8 hidden md:block">
        <Button variant="outline" asChild>
          <Link href={localePath("/host/dashboard")}>{t("hostBooking.backToDashboard")}</Link>
        </Button>
      </div>
    </div>
  );
}

const paidStatuses = new Set(["CONFIRMED", "CHECKED_IN", "COMPLETED"]);
