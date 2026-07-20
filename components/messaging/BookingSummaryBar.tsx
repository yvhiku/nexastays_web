"use client";

import React, { useEffect, useState } from "react";
import { Calendar, ChevronDown, ChevronUp, MapPin, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReservationSnapshot } from "@/lib/messaging/messages-api";
import { lifecycleBadgeClasses } from "@/lib/booking-lifecycle";
import type { BookingLifecycle } from "@/lib/stays-types";

type Props = {
  snapshot: ReservationSnapshot;
  bookingStatus?: string | null;
  statusLabels: Record<string, string>;
  labels: {
    guests: string;
    checkIn: string;
    checkOut: string;
    showDetails: string;
    hideDetails: string;
  };
};

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function mapBookingStatusChip(status?: string | null): BookingLifecycle | null {
  if (!status) return null;
  const s = status.toUpperCase();
  if (s === "CANCELLED" || s === "CANCELLED_BY_HOST" || s === "CANCELLED_BY_GUEST") return "CANCELLED";
  if (s === "EXPIRED") return "EXPIRED";
  if (s === "PAYMENT_PENDING" || s === "INITIATED") return "PENDING_PAYMENT";
  if (s === "COMPLETED") return "COMPLETED";
  if (s === "CONFIRMED" || s === "CHECKED_IN") return "ACTIVE";
  return null;
}

export function BookingSummaryBar({ snapshot, bookingStatus, statusLabels, labels }: Props) {
  const [expanded, setExpanded] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setCollapsed(window.scrollY > 48);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const lifecycle = mapBookingStatusChip(bookingStatus);
  const statusKey = lifecycle ? `myBookings.lifecycle.${lifecycle}` : null;
  const statusLabel =
    statusKey && statusLabels[statusKey] ? statusLabels[statusKey] : bookingStatus ?? "";

  return (
    <div
      className={cn(
        "sticky top-0 z-20 border-b border-nexa-line/60 bg-white/95 backdrop-blur-md transition-all duration-200",
        collapsed && !expanded ? "shadow-sm" : "",
      )}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-start min-h-[52px]"
        aria-expanded={expanded}
      >
        {snapshot.primaryPhotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={snapshot.primaryPhotoUrl}
            alt=""
            className="w-10 h-10 rounded-lg object-cover shrink-0 border border-nexa-line/50"
          />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-nexa-primary-soft shrink-0 flex items-center justify-center text-nexa-primary text-xs font-bold">
            {snapshot.listingTitle.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-nexa-ink truncate">{snapshot.listingTitle}</p>
          {!expanded && snapshot.addressDisplay ? (
            <p className="text-xs text-nexa-ink-4 truncate">{snapshot.addressDisplay}</p>
          ) : null}
        </div>
        {statusLabel ? (
          <span
            className={cn(
              "shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border",
              lifecycle ? lifecycleBadgeClasses(lifecycle) : "bg-nexa-bg-2 text-nexa-ink-3 border-nexa-line",
            )}
          >
            {statusLabel}
          </span>
        ) : null}
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-nexa-ink-4 shrink-0" aria-hidden />
        ) : (
          <ChevronDown className="h-4 w-4 text-nexa-ink-4 shrink-0" aria-hidden />
        )}
      </button>

      {expanded ? (
        <div className="px-4 pb-3 grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2 text-nexa-ink-3 bg-nexa-bg-1 rounded-xl px-3 py-2">
            <Calendar className="h-3.5 w-3.5 text-nexa-primary shrink-0" />
            <span>
              {labels.checkIn} {formatDate(snapshot.checkinDate)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-nexa-ink-3 bg-nexa-bg-1 rounded-xl px-3 py-2">
            <Calendar className="h-3.5 w-3.5 text-nexa-primary shrink-0" />
            <span>
              {labels.checkOut} {formatDate(snapshot.checkoutDate)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-nexa-ink-3 bg-nexa-bg-1 rounded-xl px-3 py-2">
            <Users className="h-3.5 w-3.5 text-nexa-primary shrink-0" />
            <span>
              {snapshot.guestCount} {labels.guests}
            </span>
          </div>
          {snapshot.addressDisplay ? (
            <div className="flex items-center gap-2 text-nexa-ink-3 bg-nexa-bg-1 rounded-xl px-3 py-2 col-span-2">
              <MapPin className="h-3.5 w-3.5 text-nexa-primary shrink-0" />
              <span className="truncate">{snapshot.addressDisplay}</span>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
