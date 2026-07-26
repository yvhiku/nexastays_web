"use client";

import React from "react";
import { ArrowRight, Hash } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import type { SignedMedia } from "@/lib/messaging/messages-api";
import { BookingHero } from "./BookingHero";
import { BookingHostPreview } from "./BookingHostPreview";
import { BookingProgress } from "./BookingProgress";
import {
  BookingSummaryGrid,
  type BookingSummaryItem,
} from "./BookingSummaryGrid";
import { BookingStatusBanner } from "./BookingStatusBanner";

export type BookingTimelineStatus =
  | "confirmed"
  | "pending"
  | "cancelled"
  | "completed"
  | "neutral";

export interface BookingSummary {
  propertyName?: string;
  cover?: SignedMedia | null;
  location?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  reservationCode?: string;
  bookedAt?: string;
  host?: {
    name: string;
    avatar?: SignedMedia | null;
    rating?: number | null;
  };
}

type Labels = {
  fallbackPropertyName: string;
  imageFallback: string;
  retryImage: string;
  viewReservation: string;
  reservation: string;
  booked: string;
  host: string;
  dates: string;
  nights: (count: number) => string;
  nightsHeading: string;
  guests: (count: number) => string;
  guestsHeading: string;
  location: string;
  progress: string;
  progressSteps: string[];
};

interface BookingTimelineCardProps {
  booking: BookingSummary;
  status: BookingTimelineStatus;
  statusLabel: string;
  statusDescription?: string;
  labels: Labels;
  locale: string;
  currentStep: number;
  onOpenBooking?: () => void;
}

function parseDateOnly(value?: string): Date | null {
  if (!value) return null;
  const date = new Date(`${value.slice(0, 10)}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function localizedDateRange(
  checkIn: string | undefined,
  checkOut: string | undefined,
  locale: string,
): string | null {
  const start = parseDateOnly(checkIn);
  const end = parseDateOnly(checkOut);
  if (!start || !end) return null;
  const formatter = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
  });
  const formatRange = (
    formatter as Intl.DateTimeFormat & {
      formatRange?: (startDate: Date, endDate: Date) => string;
    }
  ).formatRange;
  return typeof formatRange === "function"
    ? formatRange.call(formatter, start, end)
    : `${formatter.format(start)} – ${formatter.format(end)}`;
}

function nightsBetween(checkIn?: string, checkOut?: string): number | null {
  const start = parseDateOnly(checkIn);
  const end = parseDateOnly(checkOut);
  if (!start || !end) return null;
  const nights = Math.round((end.getTime() - start.getTime()) / 86_400_000);
  return nights > 0 ? nights : null;
}

export function BookingTimelineCard({
  booking,
  status,
  statusLabel,
  statusDescription,
  labels,
  locale,
  currentStep,
  onOpenBooking,
}: BookingTimelineCardProps) {
  const reduceMotion = useReducedMotion();
  const propertyName =
    booking.propertyName?.trim() || labels.fallbackPropertyName;
  const dates = localizedDateRange(booking.checkIn, booking.checkOut, locale);
  const nights = nightsBetween(booking.checkIn, booking.checkOut);
  const guestCount =
    typeof booking.guests === "number" && booking.guests > 0
      ? booking.guests
      : null;
  const summaryItems: BookingSummaryItem[] = [
    ...(dates ? [{ id: "dates" as const, label: labels.dates, value: dates }] : []),
    ...(nights
      ? [{
          id: "nights" as const,
          label: labels.nightsHeading,
          value: labels.nights(nights),
        }]
      : []),
    ...(guestCount
      ? [{
          id: "guests" as const,
          label: labels.guestsHeading,
          value: labels.guests(guestCount),
        }]
      : []),
    ...(booking.location
      ? [{
          id: "location" as const,
          label: labels.location,
          value: booking.location,
        }]
      : []),
  ];
  const bookedLabel = booking.bookedAt
    ? new Date(booking.bookedAt).toLocaleDateString(locale, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <div className="relative mx-auto w-full max-w-[560px] px-3 sm:px-0">
      <span
        className="absolute inset-y-[-16px] start-1/2 hidden w-px -translate-x-1/2 bg-[linear-gradient(transparent,rgba(181,151,164,0.32),transparent)] sm:block"
        aria-hidden
      />
      <motion.article
        role="article"
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={reduceMotion ? undefined : { y: -1 }}
        transition={{ duration: reduceMotion ? 0 : 0.2, ease: "easeOut" }}
        className="relative overflow-hidden rounded-[20px] border border-nexa-line/90 bg-white shadow-messaging-1 transition-shadow duration-messaging-hover hover:shadow-messaging-2 motion-reduce:transition-none"
        style={{ contentVisibility: "auto", containIntrinsicSize: "560px" }}
      >
        <BookingHero
          cover={booking.cover}
          propertyName={propertyName}
          fallbackLabel={labels.imageFallback}
          retryLabel={labels.retryImage}
        />

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduceMotion ? 0 : 0.04, duration: 0.2 }}
          className="space-y-5 p-5 max-[419px]:space-y-4 max-[419px]:p-4"
        >
          <BookingStatusBanner
            status={status}
            label={statusLabel}
            description={statusDescription}
          />

          <section>
            <h3 className="text-lg font-semibold leading-6 text-nexa-ink">
              {propertyName}
            </h3>
            {booking.location ? (
              <p className="mt-1 text-sm text-nexa-ink-3">{booking.location}</p>
            ) : null}
          </section>

          <BookingSummaryGrid items={summaryItems} />

          <div className="border-y border-nexa-line/70 py-4">
            <BookingProgress
              labels={labels.progressSteps}
              currentStep={currentStep}
              ariaLabel={labels.progress}
            />
          </div>

          {booking.host ? (
            <BookingHostPreview
              label={labels.host}
              name={booking.host.name}
              avatar={booking.host.avatar}
              rating={booking.host.rating}
            />
          ) : null}

          {booking.reservationCode || bookedLabel || onOpenBooking ? (
            <motion.footer
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: reduceMotion ? 0 : 0.08, duration: 0.2 }}
              className="flex flex-wrap items-end justify-between gap-4 border-t border-nexa-line/70 pt-4"
            >
              <div className="min-w-0 space-y-1 text-xs font-medium text-nexa-ink-4">
                {booking.reservationCode ? (
                  <p className="flex min-w-0 items-center gap-1.5">
                    <Hash className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    <span className="truncate">
                      {labels.reservation} {booking.reservationCode}
                    </span>
                  </p>
                ) : null}
                {bookedLabel ? (
                  <p>
                    {labels.booked} {bookedLabel}
                  </p>
                ) : null}
              </div>

              {onOpenBooking ? (
                <motion.button
                  type="button"
                  whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                  onClick={onOpenBooking}
                  className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-nexa-primary/35 bg-white px-4 text-sm font-semibold text-nexa-primary shadow-[0_2px_7px_rgba(232,80,122,0.06)] transition-[background-color,border-color,box-shadow] duration-messaging-hover hover:border-nexa-primary/55 hover:bg-nexa-primary-soft hover:shadow-nexa-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-primary/40 focus-visible:ring-offset-2 max-[419px]:w-full"
                >
                  {labels.viewReservation}
                  <ArrowRight
                    className="h-4 w-4 transition-transform duration-messaging-hover group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
                    aria-hidden
                  />
                </motion.button>
              ) : null}
            </motion.footer>
          ) : null}
        </motion.div>
      </motion.article>
    </div>
  );
}
