"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, MessageCircle } from "lucide-react";
import type { HostBooking } from "@/lib/stays-types";
import {
  classifyHostBookingUrgency,
  hostBookingAmountDisplay,
  hostBookingNights,
  toBookingDateYmd,
  type HostBookingUrgency,
} from "@/lib/host-booking-center";
import { formatHostCurrency } from "@/lib/host-dashboard-stats";
import type { Locale } from "@/lib/i18n";
import {
  HostBookingStatusBadge,
  HostBookingUrgencyBadge,
} from "@/components/host/HostBookingStatusBadge";
import { HostPortalCard } from "@/components/host/portal/HostPortalCard";
import { Button } from "@/components/ui/button";
import { openConversationForBooking } from "@/lib/messaging/messages-api";
import { cn } from "@/lib/utils";

type TranslateFn = (key: string) => string;

type Props = {
  booking: HostBooking;
  todayYmd: string;
  tomorrowYmd: string;
  t: TranslateFn;
  locale: Locale;
  localePath: (path: string) => string;
  token: string | null;
};

export function HostBookingCard({
  booking,
  todayYmd,
  tomorrowYmd,
  t,
  locale,
  localePath,
  token,
}: Props) {
  const router = useRouter();
  const [messaging, setMessaging] = useState(false);
  const [messageFailed, setMessageFailed] = useState(false);

  const urgency: HostBookingUrgency = classifyHostBookingUrgency(
    booking,
    todayYmd,
    tomorrowYmd,
  );
  const nights = hostBookingNights(booking);
  const amount = hostBookingAmountDisplay(booking);
  const checkin = toBookingDateYmd(booking.checkin_date);
  const checkout = toBookingDateYmd(booking.checkout_date);
  const href = localePath(`/bookings/${booking.id}`);
  const guest = booking.guest_name?.trim() || t("hostDashboard.guest");
  const property = booking.listing?.title ?? t("hostDashboard.listing");
  const city = booking.listing?.city?.trim() || null;
  const reference = booking.booking_reference?.trim() || null;

  const amountLabel =
    amount.kind === "payout"
      ? t("hostDashboard.bookingAmountHostEarnings")
      : amount.kind === "total_paid"
        ? t("hostDashboard.bookingAmountTotalPaid")
        : null;

  const todayOps =
    urgency === "checkin_today" || urgency === "checkout_today";

  const handleMessage = async () => {
    if (!token) return;
    setMessaging(true);
    setMessageFailed(false);
    try {
      const conv = await openConversationForBooking(booking.id, token);
      router.push(localePath(`/inbox/${conv.conversation.id}`));
    } catch {
      setMessageFailed(true);
    } finally {
      setMessaging(false);
    }
  };

  return (
    <article data-urgency={urgency}>
      <HostPortalCard
        className={cn(
          "p-4 sm:p-5 transition-shadow hover:shadow-[var(--host-shadow-hover)]",
          todayOps && "border-[color:var(--host-primary)]/35",
        )}
      >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch lg:justify-between">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <HostBookingUrgencyBadge urgency={urgency} t={t} />
            <HostBookingStatusBadge status={booking.status} t={t} />
            {reference ? (
              <span className="text-xs tabular-nums text-[color:var(--host-muted)]">
                {reference}
              </span>
            ) : null}
          </div>

          <div className="grid gap-1 sm:grid-cols-2 sm:gap-4">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-[color:var(--host-muted)]">
                {t("hostPortal.bookings.guestLabel")}
              </p>
              <h3 className="truncate font-semibold text-[color:var(--host-text)]">
                {guest}
              </h3>
              {booking.guest_count > 0 ? (
                <p className="text-sm text-[color:var(--host-text-secondary)]">
                  {t("hostPortal.bookings.guestCount").replace(
                    "{count}",
                    String(booking.guest_count),
                  )}
                </p>
              ) : null}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-[color:var(--host-muted)]">
                {t("hostPortal.bookings.propertyLabel")}
              </p>
              <p className="truncate font-medium text-[color:var(--host-text)]">
                {property}
              </p>
              {city ? (
                <p className="truncate text-sm text-[color:var(--host-text-secondary)]">
                  {city}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-end justify-between gap-3">
            <p className="text-sm tabular-nums text-[color:var(--host-text)]">
              <span className="font-medium">{checkin}</span>
              <span
                className="mx-1.5 inline-block text-[color:var(--host-muted)] rtl:rotate-180"
                aria-hidden
              >
                →
              </span>
              <span className="font-medium">{checkout}</span>
              {nights > 0 ? (
                <span className="ms-2 text-xs text-[color:var(--host-muted)]">
                  {t("hostDashboard.bookingNights").replace(
                    "{count}",
                    String(nights),
                  )}
                </span>
              ) : null}
            </p>

            {amount.amount != null && amountLabel ? (
              <p className="text-sm text-[color:var(--host-text-secondary)]">
                <span className="text-[color:var(--host-muted)]">
                  {amountLabel}:{" "}
                </span>
                <span className="font-semibold tabular-nums text-[color:var(--host-text)]">
                  {formatHostCurrency(amount.amount, booking.currency, locale)}
                </span>
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col lg:items-stretch">
          <Button asChild className="h-10">
            <Link
              href={href}
              className="inline-flex items-center justify-center gap-1.5"
            >
              {t("hostDashboard.viewBooking")}
              <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden />
            </Link>
          </Button>
          {token && !messageFailed ? (
            <Button
              type="button"
              variant="outline"
              className="h-10"
              disabled={messaging}
              onClick={() => void handleMessage()}
            >
              <MessageCircle className="h-4 w-4" aria-hidden />
              {messaging
                ? t("inbox.opening")
                : t("hostBooking.messageGuest")}
            </Button>
          ) : null}
        </div>
      </div>
      </HostPortalCard>
    </article>
  );
}
