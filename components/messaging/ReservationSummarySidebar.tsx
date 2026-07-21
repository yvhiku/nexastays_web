"use client";

import React, { useEffect, useState } from "react";
import { Calendar, ExternalLink, MapPin, Users } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { getConversation, type ConversationDetail } from "@/lib/messaging/messages-api";
import { executeCardAction } from "@/lib/messaging/actions/registry";

type Props = {
  conversationId: string;
};

function formatDateRange(checkin: string, checkout: string): string {
  try {
    const inD = new Date(checkin);
    const outD = new Date(checkout);
    const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };
    return `${inD.toLocaleDateString(undefined, opts)} – ${outD.toLocaleDateString(undefined, opts)}`;
  } catch {
    return `${checkin} – ${checkout}`;
  }
}

export function ReservationSummarySidebar({ conversationId }: Props) {
  const { token } = useAuth();
  const { t, localePath } = useLanguage();
  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoading(true);
    void getConversation(conversationId, token)
      .then((detail) => {
        if (!cancelled) setConversation(detail);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [conversationId, token]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-nexa-primary" />
      </div>
    );
  }

  if (!conversation) return null;

  const { presentation } = conversation;
  const reservation = presentation.reservation;
  const coverUrl = reservation.coverMedia?.url ?? null;
  const bookingId = reservation.bookingId;
  const locationLine = [reservation.addressDisplay, reservation.city, reservation.country]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto bg-white p-6">
      <h2 className="mb-4 font-[family-name:var(--font-playfair)] text-xl font-semibold text-nexa-ink">
        {t("inbox.reservationSummary")}
      </h2>

      {coverUrl ? (
        <div className="mb-6 overflow-hidden rounded-2xl shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={coverUrl} alt="" className="h-56 w-full object-cover" />
        </div>
      ) : null}

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-nexa-ink">{presentation.listing.title}</h3>
          {presentation.listing.city ? (
            <p className="mt-1 text-sm text-nexa-ink-3">{presentation.listing.city}</p>
          ) : null}
        </div>

        <section className="space-y-4">
          <div className="flex items-start gap-3">
            <Calendar className="mt-0.5 h-5 w-5 shrink-0 text-nexa-primary" aria-hidden />
            <div>
              <h4 className="text-sm font-semibold text-nexa-ink">{t("inbox.duration")}</h4>
              <p className="text-sm text-nexa-ink-3">
                {formatDateRange(reservation.checkinDate, reservation.checkoutDate)}
              </p>
            </div>
          </div>

          {locationLine ? (
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-nexa-primary" aria-hidden />
              <div>
                <h4 className="text-sm font-semibold text-nexa-ink">{t("inbox.location")}</h4>
                <p className="text-sm text-nexa-ink-3">{locationLine}</p>
              </div>
            </div>
          ) : null}

          <div className="flex items-start gap-3">
            <Users className="mt-0.5 h-5 w-5 shrink-0 text-nexa-primary" aria-hidden />
            <div>
              <h4 className="text-sm font-semibold text-nexa-ink">{t("inbox.guests")}</h4>
              <p className="text-sm text-nexa-ink-3">
                {reservation.guestCount} {t("inbox.guests")}
              </p>
            </div>
          </div>
        </section>

        {presentation.statusChip ? (
          <div className="rounded-xl border border-[#e0bfc1]/30 bg-[#f6f3f2] px-4 py-3">
            <span className="text-xs font-bold uppercase tracking-wider text-nexa-primary">
              {presentation.statusChip}
            </span>
          </div>
        ) : null}
      </div>

      {bookingId ? (
        <div className="mt-8 space-y-3">
          <button
            type="button"
            onClick={() =>
              executeCardAction(
                {
                  id: "view_booking_sidebar",
                  label: t("inbox.viewDetails"),
                  type: "OPEN_BOOKING",
                  url: `/bookings/${bookingId}`,
                },
                { localePath },
              )
            }
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-nexa-primary py-3 text-sm font-bold text-nexa-primary transition-colors hover:bg-nexa-primary/5"
          >
            {t("inbox.viewDetails")}
            <ExternalLink className="h-4 w-4" aria-hidden />
          </button>
        </div>
      ) : null}
    </div>
  );
}
