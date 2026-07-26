"use client";

import React from "react";
import { MessageCircle, Sparkles } from "lucide-react";
import type { ConversationDetail } from "@/lib/messaging/messages-api";
import { UserAvatar } from "@/components/avatar/UserAvatar";
import { ProgressiveImage } from "../ProgressiveImage";
import { useLanguage } from "@/contexts/LanguageContext";
import { deriveJourneyIndex } from "../hospitality/journey";

export function ConversationWelcomeCard({
  conversation,
}: {
  conversation: ConversationDetail;
}) {
  const { t } = useLanguage();
  const stage = ["inquiry", "confirmed", "checkin", "stay", "completed", "completed"][
    deriveJourneyIndex(conversation)
  ] ?? "inquiry";
  const suggestions = [
    t("inbox.phase15.suggestions.amenities"),
    t("inbox.phase15.suggestions.arrival"),
    t("inbox.phase15.suggestions.local"),
  ];

  return (
    <section className="mx-auto flex min-h-[360px] max-w-xl flex-col items-center justify-center px-4 py-10 text-center">
      <div className="relative flex items-end">
        <div className="h-24 w-32 overflow-hidden rounded-[26px] border-4 border-white bg-nexa-bg shadow-messaging-3">
          <ProgressiveImage
            src={conversation.presentation.reservation.coverMedia?.url ?? null}
            alt={conversation.presentation.listing.title}
            className="h-full w-full"
          />
        </div>
        <UserAvatar
          name={conversation.presentation.title}
          media={conversation.presentation.avatar}
          size="lg"
          className="-ms-5 border-4 border-white shadow-messaging-2"
        />
      </div>
      <span className="mt-5 inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-nexa-primary-soft text-nexa-primary">
        <Sparkles className="h-4 w-4" aria-hidden />
      </span>
      <h2 className="mt-3 font-display text-2xl font-semibold text-nexa-ink">
        {t(`inbox.phase15.welcome.${stage}.title`)}
      </h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-nexa-ink-2">
        {t(`inbox.phase15.welcome.${stage}.body`)}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {suggestions.map((suggestion) => (
          <span
            key={suggestion}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-nexa-line bg-white px-3 text-xs font-semibold text-nexa-ink-3 shadow-messaging-1"
          >
            <MessageCircle className="h-3.5 w-3.5 text-nexa-primary" aria-hidden />
            {suggestion}
          </span>
        ))}
      </div>
    </section>
  );
}
