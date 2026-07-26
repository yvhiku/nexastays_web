"use client";

import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import type {
  ConversationPresentation,
  MessageDto,
} from "@/lib/messaging/messages-api";
import { getCardPayload } from "@/lib/messaging/message-payload";
import {
  executeCardAction,
  type CardAction,
} from "@/lib/messaging/actions/registry";
import {
  BookingTimelineCard,
  type BookingTimelineStatus,
} from "./BookingTimelineCard";

type Props = {
  messages: MessageDto[];
  presentation: ConversationPresentation;
  localePath: (path: string) => string;
  viewerRole?: "guest" | "host";
};

function actionsFrom(messages: MessageDto[]): CardAction[] {
  const actions = messages.flatMap((message) => {
    const payload = getCardPayload(message);
    const metadata = message.metadata as { actions?: CardAction[] };
    return payload?.actions ?? metadata.actions ?? [];
  });
  return Array.from(new Map(actions.map((action) => [action.id, action])).values());
}

function resolveStatus(
  messages: MessageDto[],
  statusChip: string | null,
): BookingTimelineStatus {
  const text = [
    statusChip,
    ...messages.flatMap((message) => {
      const payload = getCardPayload(message);
      return [payload?.title, payload?.body, message.body];
    }),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  if (/cancel|annul|ملغ/.test(text)) return "cancelled";
  if (/complete|termin|achev|مكتمل|اكتمل/.test(text)) return "completed";
  if (/pending|await|attente|قيد|انتظار/.test(text)) return "pending";
  if (/confirm|confirmed|confirmé|مؤكد|تأكيد/.test(text)) return "confirmed";
  return "neutral";
}

export function BookingLifecycleCard({
  messages,
  presentation,
  localePath,
  viewerRole,
}: Props) {
  const { t, locale } = useLanguage();
  const reservation = presentation.reservation;
  const bookingId = reservation.bookingId;
  const sourceActions = actionsFrom(messages);
  const fallbackAction: CardAction | undefined = bookingId
    ? {
        id: "view_booking_timeline",
        label: t("inbox.context.viewBooking"),
        type: "OPEN_BOOKING",
        url: `/bookings/${bookingId}`,
      }
    : undefined;
  const viewBooking: CardAction | undefined =
    sourceActions.find((action) =>
      [action.id, action.type, action.url].some((value) =>
        typeof value === "string" && value.toLowerCase().includes("booking"),
      ),
    ) ?? fallbackAction;
  const status = resolveStatus(messages, presentation.statusChip);
  const statusLabel =
    status === "confirmed"
      ? t("inbox.timeline.bookingConfirmed")
      : status === "pending"
        ? t("inbox.timeline.bookingPending")
        : status === "cancelled"
          ? t("inbox.timeline.bookingCancelled")
          : status === "completed"
            ? t("inbox.timeline.bookingCompleted")
            : presentation.statusChip || t("inbox.timeline.bookingStatus");
  const lifecycleText = `${presentation.statusChip ?? ""} ${statusLabel}`.toLowerCase();
  const currentStep =
    status === "completed"
      ? 2
      : /check.?in|checked.?in|active|arriv/.test(lifecycleText)
        ? 1
        : 0;
  const location = [reservation.city, reservation.country]
    .filter((value, index, values): value is string =>
      Boolean(value && values.indexOf(value) === index),
    )
    .join(", ");
  const host =
    viewerRole === "guest" && presentation.counterpart.displayName
      ? {
          name: presentation.counterpart.displayName,
          avatar: presentation.avatar,
          rating: presentation.counterpart.rating,
        }
      : undefined;
  const bookedAt = messages[0]?.sentAt ?? messages[0]?.createdAt;

  return (
    <BookingTimelineCard
      booking={{
        propertyName: presentation.listing.title || reservation.listingTitle,
        cover: reservation.coverMedia,
        location: location || undefined,
        checkIn: reservation.checkinDate,
        checkOut: reservation.checkoutDate,
        guests: reservation.guestCount,
        reservationCode: reservation.bookingReference ?? undefined,
        bookedAt,
        host,
      }}
      status={status}
      statusLabel={statusLabel}
      statusDescription={
        status === "confirmed"
          ? t("inbox.timeline.bookingConfirmedBody")
          : undefined
      }
      labels={{
        fallbackPropertyName: t("inbox.timeline.yourReservation"),
        imageFallback: t("inbox.timeline.propertyImage"),
        retryImage: t("inbox.timeline.retryImage"),
        viewReservation: t("inbox.viewReservation"),
        reservation: t("inbox.timeline.reservation"),
        booked: t("inbox.timeline.booked"),
        host: t("inbox.timeline.host"),
        dates: t("inbox.timeline.dates"),
        nightsHeading: t("inbox.timeline.nightsHeading"),
        nights: (count) =>
          t("inbox.timeline.nightCount").replace("{count}", String(count)),
        guestsHeading: t("inbox.timeline.guestsHeading"),
        guests: (count) =>
          t("inbox.timeline.guestCount").replace("{count}", String(count)),
        location: t("inbox.timeline.location"),
        progress: t("inbox.timeline.bookingProgress"),
        progressSteps: [
          t("inbox.timeline.progressConfirmed"),
          t("inbox.timeline.progressCheckin"),
          t("inbox.timeline.progressCheckout"),
          t("inbox.timeline.progressReview"),
        ],
      }}
      locale={locale}
      currentStep={currentStep}
      onOpenBooking={
        viewBooking
          ? () => executeCardAction(viewBooking, { localePath })
          : undefined
      }
    />
  );
}
