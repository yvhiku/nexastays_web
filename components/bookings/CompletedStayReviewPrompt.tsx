"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StarRatingDisplay } from "@/components/reviews/StarRatingSelector";
import { resolveReviewStatus } from "@/lib/booking-lifecycle";
import { trackEvent } from "@/lib/analytics";
import type { StaysBooking } from "@/lib/stays-types";
import { cn } from "@/lib/utils";

type Variant = "card" | "detail";

type Props = {
  booking: StaysBooking;
  localePath: (path: string) => string;
  t: (key: string) => string;
  variant?: Variant;
  className?: string;
};

/**
 * Post-stay review prompt — ELIGIBLE / REVIEWED / BLOCKED.
 * Shared by BookingCard and booking detail.
 */
export function CompletedStayReviewPrompt({
  booking,
  localePath,
  t,
  variant = "card",
  className,
}: Props) {
  const status = resolveReviewStatus(booking);
  const reviewHref = localePath(`/bookings/${booking.id}/review`);
  const seenRef = useRef(false);
  const isDetail = variant === "detail";

  useEffect(() => {
    if (status !== "ELIGIBLE" || seenRef.current) return;
    seenRef.current = true;
    trackEvent("review_prompt_seen", {
      bookingId: booking.id,
      surface: variant,
    });
  }, [status, booking.id, variant]);

  if (status === "NONE") return null;

  if (status === "BLOCKED") {
    return (
      <div
        className={cn(
          "rounded-xl border border-nexa-line/50 bg-nexa-bg-2/40 px-3 py-2.5",
          isDetail && "px-4 py-4",
          className,
        )}
      >
        <p className="text-xs text-nexa-ink-4 leading-snug">
          {booking.review_blocked_reason === "OWN_LISTING"
            ? t("myBookings.reviewBlockedOwn")
            : t("myBookings.reviewUnavailable")}
        </p>
      </div>
    );
  }

  if (status === "REVIEWED") {
    const rating = booking.review_rating ?? 5;
    return (
      <div
        className={cn(
          "rounded-xl border border-green-200/80 bg-green-50/80 px-3 py-3",
          isDetail && "px-5 py-5",
          className,
        )}
      >
        <div className="flex flex-wrap items-center gap-2 mb-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 border border-green-200 px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-wide text-green-800">
            {t("myBookings.badgeReviewed")}
          </span>
          <StarRatingDisplay rating={rating} size="sm" />
        </div>
        <p className={cn("font-semibold text-nexa-ink", isDetail ? "text-lg" : "text-sm")}>
          {t("myBookings.reviewedTitle")}
        </p>
        <p className={cn("text-nexa-ink-3 mt-0.5", isDetail ? "text-sm" : "text-xs")}>
          {t("myBookings.reviewedBody")}
        </p>
        <Button
          asChild
          size={isDetail ? "default" : "sm"}
          className={cn("mt-3 gap-1.5", !isDetail && "h-8 text-xs")}
          onClick={() =>
            trackEvent("review_cta_clicked", {
              bookingId: booking.id,
              action: "view",
              surface: variant,
            })
          }
        >
          <Link href={reviewHref}>
            <Star className="h-3.5 w-3.5" aria-hidden />
            {t("myBookings.viewReview")}
          </Link>
        </Button>
      </div>
    );
  }

  // ELIGIBLE
  return (
    <div
      className={cn(
        "rounded-xl border border-nexa-primary/25 bg-nexa-primary-soft/50 px-3 py-3",
        isDetail && "px-5 py-5",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2 mb-1.5">
        <span className="inline-flex items-center gap-1 rounded-full bg-nexa-primary/15 border border-nexa-primary/30 px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-wide text-nexa-primary">
          {t("myBookings.badgeNeedsReview")}
        </span>
        <StarRatingDisplay rating={0} size="sm" />
      </div>
      <p className={cn("font-semibold text-nexa-ink", isDetail ? "text-lg" : "text-sm")}>
        {isDetail ? t("myBookings.stayCompleteTitle") : t("myBookings.eligibleTitle")}
      </p>
      <p className={cn("text-nexa-ink-3 mt-0.5", isDetail ? "text-sm" : "text-xs")}>
        {t("myBookings.eligibleBody")}
      </p>
      <Button
        asChild
        size={isDetail ? "default" : "sm"}
        className={cn("mt-3 gap-1.5", !isDetail && "h-8 text-xs")}
        onClick={() =>
          trackEvent("review_cta_clicked", {
            bookingId: booking.id,
            action: "leave",
            surface: variant,
          })
        }
      >
        <Link href={reviewHref}>
          <Star className="h-3.5 w-3.5" aria-hidden />
          {t("myBookings.leaveReview")}
        </Link>
      </Button>
    </div>
  );
}
