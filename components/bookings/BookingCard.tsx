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
  resolveReviewStatus,
  getPaymentExpiresAt,
} from "@/lib/booking-lifecycle";
import { formatLocalDateOnly } from "@/lib/booking-dates";
import { CompletedStayReviewPrompt } from "@/components/bookings/CompletedStayReviewPrompt";
import {
  ChevronRight,
  MapPin,
  MessageCircle,
  Navigation,
  RotateCcw,
  CreditCard,
  FileText,
  AlertTriangle,
  Calendar,
  Users,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PLACEHOLDER =
  "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=400&q=80";

function formatDate(value: string): string {
  // Stay nights are YYYY-MM-DD; created_at is a full timestamp.
  if (/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    return formatLocalDateOnly(value);
  }
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
    <span className="text-[0.7rem] font-medium text-orange-700" aria-live="polite">
      {remaining}
    </span>
  );
}

export interface BookingCardProps {
  booking: StaysBooking;
  localePath: (path: string) => string;
  t: (key: string) => string;
  onCancel?: (id: string) => void;
  onMessageHost?: (bookingId: string) => void;
  messagingBookingId?: string | null;
  cancelling?: boolean;
}

function BookingCardComponent({
  booking,
  localePath,
  t,
  onCancel,
  onMessageHost,
  messagingBookingId,
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
  const contactHref = localePath(`/contact?booking=${booking.id}`);

  const price = booking.total_paid ?? booking.total_subtotal;
  const expiresAt =
    booking.payment_expires_at ??
    (booking.created_at ? getPaymentExpiresAt(booking.created_at).toISOString() : null);

  const statusLabel = useMemo(() => {
    const key = `myBookings.lifecycle.${lifecycle}`;
    const translated = t(key);
    return translated !== key ? translated : lifecycle.replace(/_/g, " ");
  }, [lifecycle, t]);

  const actionBtnClass = "h-8 px-3 text-xs font-semibold rounded-lg";

  return (
    <article
      className="group rounded-xl border border-nexa-line/60 bg-white shadow-sm overflow-hidden transition-all duration-200 hover:shadow-nexa-card hover:border-nexa-line"
      aria-label={`${booking.listing?.title ?? t("bookings.listing")} — ${statusLabel}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-stretch">
        {/* Image — compact left strip */}
        <div className="relative w-full sm:w-[148px] md:w-[160px] shrink-0 h-[120px] sm:h-auto sm:min-h-[132px]">
          <Image
            src={imageSrc}
            alt={booking.listing?.title ?? t("bookings.listing")}
            fill
            className="object-cover sm:rounded-l-xl"
            sizes="(max-width: 640px) 100vw, 160px"
            unoptimized
          />
        </div>

        {/* Middle — details */}
        <div className="flex flex-1 flex-col min-w-0 border-b sm:border-b-0 sm:border-r border-nexa-line/40">
          <div className="flex-1 px-4 py-3 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-semibold text-[0.95rem] leading-snug text-nexa-ink line-clamp-2 flex-1 min-w-0">
                {booking.listing?.title ?? t("bookings.listing")}
              </h3>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span
                  className={cn(
                    "inline-flex px-2 py-0.5 rounded-full text-[0.62rem] font-bold uppercase tracking-wide border whitespace-nowrap",
                    lifecycleBadgeClasses(lifecycle),
                  )}
                >
                  {statusLabel}
                </span>
                {lifecycle === "COMPLETED" && resolveReviewStatus(booking) === "ELIGIBLE" && (
                  <span className="inline-flex px-2 py-0.5 rounded-full text-[0.62rem] font-bold uppercase tracking-wide border border-nexa-primary/30 bg-nexa-primary/10 text-nexa-primary whitespace-nowrap">
                    {t("myBookings.badgeNeedsReview")}
                  </span>
                )}
                {lifecycle === "COMPLETED" && resolveReviewStatus(booking) === "REVIEWED" && (
                  <span className="inline-flex px-2 py-0.5 rounded-full text-[0.62rem] font-bold uppercase tracking-wide border border-green-200 bg-green-50 text-green-800 whitespace-nowrap">
                    {t("myBookings.badgeReviewed")}
                  </span>
                )}
                <span className="text-sm font-bold text-nexa-ink whitespace-nowrap">
                  {price} {booking.currency}
                </span>
              </div>
            </div>

            <p className="text-xs text-nexa-ink-4 flex items-center gap-1">
              <MapPin className="h-3 w-3 shrink-0" aria-hidden />
              <span className="truncate">{booking.listing?.city ?? "—"}, Morocco</span>
            </p>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-nexa-ink-3">
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3 w-3 shrink-0 text-nexa-ink-4" aria-hidden />
                {formatDate(booking.checkin_date)} – {formatDate(booking.checkout_date)}
              </span>
              <span className="inline-flex items-center gap-1">
                <Users className="h-3 w-3 shrink-0 text-nexa-ink-4" aria-hidden />
                {booking.guest_count}{" "}
                {booking.guest_count === 1 ? t("myBookings.guest") : t("myBookings.guests")}
              </span>
            </div>

            {lifecycle === "PENDING_PAYMENT" && expiresAt && (
              <p className="text-[0.7rem] text-orange-700 mt-1.5 flex items-center gap-1.5">
                <CreditCard className="h-3 w-3" aria-hidden />
                {t("myBookings.paymentExpires")} <PaymentCountdown expiresAt={expiresAt} />
              </p>
            )}

            {booking.payment_failed && (
              <p className="text-[0.7rem] text-red-600 mt-1 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" aria-hidden />
                {t("myBookings.paymentFailed")}
              </p>
            )}

            {lifecycle === "COMPLETED" && (
              <CompletedStayReviewPrompt
                booking={booking}
                localePath={localePath}
                t={t}
                variant="card"
                className="mt-2.5"
              />
            )}
          </div>

          {/* Mobile actions — horizontal row */}
          <div className="flex sm:hidden flex-wrap gap-2 px-4 pb-3">
            <BookingCardActions
              lifecycle={lifecycle}
              booking={booking}
              detailHref={detailHref}
              listingHref={listingHref}
              contactHref={contactHref}
              t={t}
              onCancel={onCancel}
              onMessageHost={onMessageHost}
              messaging={messagingBookingId === booking.id}
              cancelling={cancelling}
              btnClass={actionBtnClass}
              horizontal
            />
          </div>
        </div>

        {/* Desktop actions — compact vertical stack */}
        <div className="hidden sm:flex flex-col justify-center gap-1.5 px-3 py-3 shrink-0 w-[148px] md:w-[156px] bg-nexa-bg-1/30">
          <BookingCardActions
            lifecycle={lifecycle}
            booking={booking}
            detailHref={detailHref}
            listingHref={listingHref}
            contactHref={contactHref}
            t={t}
            onCancel={onCancel}
            onMessageHost={onMessageHost}
            messaging={messagingBookingId === booking.id}
            cancelling={cancelling}
            btnClass={cn(actionBtnClass, "w-full justify-center")}
            horizontal={false}
          />
        </div>
      </div>

      <footer className="px-4 py-2 bg-nexa-bg-1/60 border-t border-nexa-line/40 flex flex-wrap items-center justify-between gap-x-4 gap-y-0.5 text-[0.7rem] text-nexa-ink-4">
        <span>
          {t("myBookings.bookingId")}:{" "}
          <span className="font-mono text-nexa-ink-3">#{booking.id.slice(0, 8).toUpperCase()}</span>
        </span>
        {booking.created_at && (
          <span>
            {t("myBookings.bookedOn")} {formatDate(booking.created_at)}
          </span>
        )}
        <span className="font-semibold text-nexa-ink-3">
          {t("myBookings.total")}: {price} {booking.currency}
        </span>
      </footer>
    </article>
  );
}

interface BookingCardActionsProps {
  lifecycle: ReturnType<typeof resolveBookingLifecycle>;
  booking: StaysBooking;
  detailHref: string;
  listingHref: string;
  contactHref: string;
  t: (key: string) => string;
  onCancel?: (id: string) => void;
  onMessageHost?: (bookingId: string) => void;
  messaging?: boolean;
  cancelling?: boolean;
  btnClass: string;
  horizontal: boolean;
}

function BookingCardActions({
  lifecycle,
  booking,
  detailHref,
  listingHref,
  contactHref,
  t,
  onCancel,
  onMessageHost,
  messaging,
  cancelling,
  btnClass,
  horizontal,
}: BookingCardActionsProps) {
  const wrap = horizontal ? "contents" : "flex flex-col gap-1.5 w-full";

  const primary = (label: string, href: string, icon?: React.ReactNode) => (
    <Button size="sm" asChild className={cn(btnClass, "gap-1")}>
      <Link href={href}>
        {label}
        {icon ?? <ChevronRight className="h-3 w-3" />}
      </Link>
    </Button>
  );

  const outline = (
    label: string,
    opts: { href?: string; onClick?: () => void; className?: string; icon?: React.ReactNode },
  ) => {
    const cls = cn(btnClass, "gap-1", opts.className);
    if (opts.href) {
      return (
        <Button size="sm" variant="outline" asChild className={cls}>
          <Link href={opts.href}>
            {opts.icon}
            {label}
          </Link>
        </Button>
      );
    }
    return (
      <Button
        size="sm"
        variant="outline"
        className={cls}
        onClick={opts.onClick}
        disabled={cancelling}
      >
        {opts.icon}
        {label}
      </Button>
    );
  };

  const reportIssue =
    canComplainBooking(booking) &&
    outline(t("myBookings.reportIssue"), {
      href: contactHref,
      icon: <MessageCircle className="h-3 w-3" />,
    });

  return (
    <div className={wrap}>
      {lifecycle === "UPCOMING" && (
        <>
          {primary(t("myBookings.viewDetails"), detailHref)}
          {canCancelBooking(booking) && onCancel &&
            outline(cancelling ? t("myBookings.cancelling") : t("myBookings.cancelBooking"), {
              onClick: () => onCancel(booking.id),
              className: "text-red-600 border-red-200 hover:bg-red-50",
              icon: <XCircle className="h-3 w-3" />,
            })}
          {reportIssue}
        </>
      )}

      {lifecycle === "ACTIVE" && (
        <>
          {primary(t("myBookings.openStay"), detailHref)}
          {outline(t("myBookings.getDirections"), {
            href: detailHref,
            icon: <Navigation className="h-3 w-3" />,
          })}
          {outline(
            messaging ? t("bookings.processing") : t("myBookings.contactHost"),
            {
              onClick: onMessageHost ? () => onMessageHost(booking.id) : undefined,
              href: onMessageHost ? undefined : detailHref,
              icon: <MessageCircle className="h-3 w-3" />,
              className: messaging ? "opacity-70 pointer-events-none" : undefined,
            },
          )}
          {reportIssue}
        </>
      )}

      {lifecycle === "PENDING_PAYMENT" && (
        <>
          {primary(t("myBookings.completePayment"), detailHref)}
          {canCancelBooking(booking) && onCancel &&
            outline(t("myBookings.cancelBooking"), {
              onClick: () => onCancel(booking.id),
              className: "text-red-600 border-red-200 hover:bg-red-50",
            })}
          {outline(t("myBookings.viewDetails"), { href: detailHref })}
        </>
      )}

      {lifecycle === "COMPLETED" && (
        <>
          {outline(t("myBookings.bookAgain"), {
            href: listingHref,
            icon: <RotateCcw className="h-3 w-3" />,
          })}
          {outline(t("myBookings.viewReceipt"), {
            href: detailHref,
            icon: <FileText className="h-3 w-3" />,
          })}
          {reportIssue}
        </>
      )}

      {(lifecycle === "CANCELLED" || lifecycle === "EXPIRED") && (
        <>
          {primary(t("myBookings.bookAgain"), listingHref, <RotateCcw className="h-3 w-3" />)}
          {outline(t("myBookings.viewDetails"), { href: detailHref })}
        </>
      )}
    </div>
  );
}

export const BookingCard = memo(BookingCardComponent);
