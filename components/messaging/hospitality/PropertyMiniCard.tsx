"use client";

import React from "react";
import { ArrowUpRight, Home, MapPin, Users } from "lucide-react";
import type { ConversationDetail } from "@/lib/messaging/messages-api";
import { ProgressiveImage } from "../ProgressiveImage";
import { useLanguage } from "@/contexts/LanguageContext";

export function PropertyMiniCard({
  conversation,
}: {
  conversation: ConversationDetail;
}) {
  const { t, localePath } = useLanguage();
  const { presentation } = conversation;
  const listingId =
    presentation.reservation.listingId ?? conversation.conversation.listingId;
  const content = (
    <>
      <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-nexa-bg">
        <ProgressiveImage
          src={presentation.reservation.coverMedia?.url ?? null}
          alt={presentation.listing.title}
          className="h-full w-full"
        />
      </div>
      <div className="min-w-0 flex-1 py-1">
        <p className="line-clamp-2 font-display text-base font-semibold leading-5 text-nexa-ink">
          {presentation.listing.title}
        </p>
        {presentation.listing.city ? (
          <p className="mt-1 flex items-center gap-1 text-xs text-nexa-ink-3">
            <MapPin className="h-3.5 w-3.5 text-nexa-primary" aria-hidden />
            {presentation.listing.city}
          </p>
        ) : null}
        <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-semibold text-nexa-ink-3">
          <span className="inline-flex items-center gap-1">
            <Home className="h-3 w-3" aria-hidden />
            {t("inbox.phase14.property")}
          </span>
          {presentation.reservation.guestCount > 0 ? (
            <span className="inline-flex items-center gap-1">
              <Users className="h-3 w-3" aria-hidden />
              {presentation.reservation.guestCount}
            </span>
          ) : null}
        </div>
      </div>
      {listingId ? (
        <ArrowUpRight className="h-4 w-4 shrink-0 text-nexa-primary rtl:-scale-x-100" aria-hidden />
      ) : null}
    </>
  );

  const className =
    "flex min-w-0 items-center gap-3 rounded-2xl border border-nexa-line/70 bg-white p-3 text-start shadow-messaging-1 transition-[box-shadow,transform] hover:-translate-y-px hover:shadow-messaging-2 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-primary/45";
  return listingId ? (
    <a
      href={localePath(`/listings/${listingId}`)}
      className={className}
      aria-label={`${t("inbox.phase14.viewProperty")}: ${presentation.listing.title}`}
    >
      {content}
    </a>
  ) : (
    <div className={className}>{content}</div>
  );
}
