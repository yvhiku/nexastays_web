"use client";

import React, { memo, useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { getListingMediaUrl } from "@/lib/stays-api";
import type { StaysBooking } from "@/lib/stays-types";
import {
  resolveBookingLifecycle,
  lifecycleBadgeClasses,
  canCancelBooking,
  canComplainBooking,
  canReviewBooking,
  getPaymentExpiresAt,
} from "@/lib/booking-lifecycle";
import {
  ChevronRight,
  MapPin,
  XCircle,
  MessageCircle,
  Navigation,
  Phone,
  Star,
  RotateCcw,
  CreditCard,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PLACEHOLDER =
  "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=600&q=80";

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function PaymentCountdown({ expiresAt }: { expiresAt: string }) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    const tick = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setRemaining("00:00");
        return;
      }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setRemaining(`${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return (
    <span className="text-xs font-medium text-orange-700" aria-live="polite">
      {remaining}
    </span>
  );
}

export interface BookingCardProps {
  booking: StaysBooking;
  localePath: (path: string) => string;
  t: (key: string) => string;
  onCancel?: (id: string) => void;
  cancelling?: boolean;
}

function BookingCardComponent({
  booking,
  localePath,
  t,
  onCancel,
  cancelling,
}: BookingCardProps) {
  const lifecycle = resolveBookingLifecycle(booking);
  const photo = booking.listing?.media?.find((m) => m.kind === "PHOTO");
  const imageSrc =
    photo && booking.listing
      ? getListingMediaUrl(booking.listing.id, photo.asset_id)
      : PLACEHOLDER;

  const detailHref = localePath(`/bookings/${booking.id}`);
  const listingHref = booking.listing
    ? localePath(`/listings/${booking.listing.id}`)
    : localePath("/listings");

  const price = booking.total_paid ?? booking.total_subtotal;
  const expiresAt =
    booking.payment_expires_at ??
    (booking.created_at ? getPaymentExpiresAt(booking.created_at).toISOString() : null);

  const statusLabel = useMemo(() => {
    const key = `myBookings.lifecycle.${lifecycle}`;
    const translated = t(key);
    return translated !== key ? translated : lifecycle.replace(/_/g, " ");
  }, [lifecycle, t]);

  return (
    <article
      className="group rounded-2xl border border-nexa-line/70 bg-white shadow-nexa-card overflow-hidden transition-all duration-300 hover:shadow-nexa-md hover:border-nexa-line"
      aria-label={`${booking.listing?.title ?? t("bookings.listing")} — ${statusLabel}`}
    >
      <div className="flex flex-col lg:flex-row">
        <div className="relative w-full lg:w-[220px] xl:w-[260px] shrink-0 aspect-[4/3] lg:aspect-auto lg:min-h-[200px]">
          <Image
            src={imageSrc}
            alt={booking.listing?.title ?? t("bookings.listing")}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 260px"
            unoptimized
          />
        </div>

        <div className="flex flex-1 flex-col sm:flex-row min-w-0">
          <div className="flex-1 p-5 sm:p-6 min-w-0">
            <div className="flex flex-wrap items-start gap-2 mb-2">
              <h3 className="font-semibold text-lg text-nexa-ink truncate flex-1 min-w-0">
                {booking.listing?.title ?? t("bookings.listing")}
              </h3>
              <span
                className={cn(
                  "inline-flex px-2.5 py-1 rounded-full text-[0.7rem] font-semibold uppercase tracking-wide border",
                  lifecycleBadgeClasses(lifecycle),
                )}
              >
                {statusLabel}
              </span>
            </div>

            <p className="text-sm text-nexa-ink-4 flex items-center gap-1.5">
              <MapPin className="h-4 w-4 shrink-0" aria-hidden />
              {booking.listing?.city ?? "—"}
            </p>

            <p className="text-sm text-nexa-ink-3 mt-2">
              {formatDate(booking.checkin_date)} – {formatDate(booking.checkout_date)} ·{" "}
              {booking.guest_count}{" "}
              {booking.guest_count === 1 ? t("myBookings.guest") : t("myBookings.guests")}
            </p>

            <p className="text-base font-semibold text-nexa-ink mt-3">
              {price} {booking.currency}
            </p>

            {lifecycle === "PENDING_PAYMENT" && expiresAt && (
              <p className="text-xs text-orange-700 mt-2 flex items-center gap-2">
                <CreditCard className="h-3.5 w-3.5" aria-hidden />
                {t("myBookings.paymentExpires")} <PaymentCountdown expiresAt={expiresAt} />
              </p>
            )}

            {booking.payment_failed && (
              <p className="text-xs text-red-600 mt-2 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                {t("myBookings.paymentFailed")}
              </p>
            )}
          </div>

          <div className="flex sm:flex-col gap-2 p-5 sm:p-6 sm:pl-0 lg:pl-0 lg:pr-6 lg:justify-center border-t sm:border-t-0 border-nexa-line/50 shrink-0">
            {lifecycle === "UPCOMING" && (
              <>
                <Button size="sm" asChild className="gap-1">
                  <Link href={detailHref}>
                    {t("myBookings.viewDetails")} <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
                {canCancelBooking(booking) && onCancel && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50 gap-1"
                    onClick={() => onCancel(booking.id)}
                    disabled={cancelling}
                  >
                    <XCircle className="h-4 w-4" />
                    {cancelling ? t("myBookings.cancelling") : t("myBookings.cancelBooking")}
                  </Button>
                )}
                {canComplainBooking(booking) && (
                  <Button size="sm" variant="outline" asChild className="gap-1">
                    <Link href={`/contact?booking=${booking.id}`}>
                      <MessageCircle className="h-4 w-4" />
                      {t("myBookings.reportIssue")}
                    </Link>
                  </Button>
                )}
              </>
            )}

            {lifecycle === "ACTIVE" && (
              <>
                <Button size="sm" asChild className="gap-1">
                  <Link href={detailHref}>{t("myBookings.openStay")}</Link>
                </Button>
                <Button size="sm" variant="outline" asChild className="gap-1">
                  <Link href={detailHref}>
                    <Navigation className="h-4 w-4" />
                    {t("myBookings.getDirections")}
                  </Link>
                </Button>
                <Button size="sm" variant="outline" asChild className="gap-1">
                  <Link href={detailHref}>
                    <Phone className="h-4 w-4" />
                    {t("myBookings.contactHost")}
                  </Link>
                </Button>
              </>
            )}

            {lifecycle === "PENDING_PAYMENT" && (
              <>
                <Button size="sm" asChild className="gap-1">
                  <Link href={detailHref}>
                    {t("myBookings.completePayment")} <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
                {canCancelBooking(booking) && onCancel && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => onCancel(booking.id)}
                    disabled={cancelling}
                  >
                    {t("myBookings.cancelBooking")}
                  </Button>
                )}
                <Button size="sm" variant="outline" asChild>
                  <Link href={detailHref}>{t("myBookings.viewDetails")}</Link>
                </Button>
              </>
            )}

            {lifecycle === "COMPLETED" && (
              <>
                <Button size="sm" variant="outline" asChild className="gap-1">
                  <Link href={detailHref}>
                    <FileText className="h-4 w-4" />
                    {t("myBookings.viewReceipt")}
                  </Link>
                </Button>
                {canReviewBooking(booking) && (
                  <Button size="sm" variant="outline" asChild className="gap-1">
                    <Link href={`${detailHref}#review`}>
                      <Star className="h-4 w-4" />
                      {t("myBookings.leaveReview")}
                    </Link>
                  </Button>
                )}
                <Button size="sm" asChild className="gap-1">
                  <Link href={listingHref}>
                    <RotateCcw className="h-4 w-4" />
                    {t("myBookings.bookAgain")}
                  </Link>
                </Button>
              </>
            )}

            {(lifecycle === "CANCELLED" || lifecycle === "EXPIRED") && (
              <>
                <Button size="sm" asChild className="gap-1">
                  <Link href={listingHref}>
                    <RotateCcw className="h-4 w-4" />
                    {t("myBookings.bookAgain")}
                  </Link>
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <Link href={detailHref}>{t("myBookings.viewDetails")}</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <footer className="px-5 sm:px-6 py-3 bg-nexa-bg-1/80 border-t border-nexa-line/50 flex flex-wrap gap-x-6 gap-y-1 text-xs text-nexa-ink-4">
        <span>
          {t("myBookings.bookingId")}: <span className="font-mono text-nexa-ink-3">{booking.id.slice(0, 8)}…</span>
        </span>
        {booking.created_at && (
          <span>
            {t("myBookings.bookedOn")} {formatDate(booking.created_at)}
          </span>
        )}
        <span>
          {t("myBookings.total")}: {price} {booking.currency}
        </span>
      </footer>
    </article>
  );
}

export const BookingCard = memo(BookingCardComponent);
