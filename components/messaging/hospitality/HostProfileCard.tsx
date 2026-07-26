"use client";

import React from "react";
import { BadgeCheck, Star } from "lucide-react";
import type { ConversationDetail } from "@/lib/messaging/messages-api";
import { UserAvatar } from "@/components/avatar/UserAvatar";
import { useLanguage } from "@/contexts/LanguageContext";

export function HostProfileCard({
  conversation,
}: {
  conversation: ConversationDetail;
}) {
  const { t } = useLanguage();
  if (conversation.permissions.viewerRole === "host") return null;
  const host = conversation.presentation.counterpart;
  return (
    <section
      className="flex items-center gap-3 rounded-2xl border border-nexa-line/70 bg-[linear-gradient(145deg,#fff,#fbf6f8)] p-4 shadow-messaging-1"
      aria-label={t("inbox.phase14.host")}
    >
      <UserAvatar
        name={host.displayName}
        media={conversation.presentation.avatar}
        size="lg"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-base font-semibold text-nexa-ink">
          {host.displayName}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-semibold text-nexa-ink-3">
          {host.verified ? (
            <span className="inline-flex items-center gap-1 text-nexa-primary">
              <BadgeCheck className="h-4 w-4" aria-hidden />
              {t("inbox.phase14.verified")}
            </span>
          ) : null}
          {host.rating != null ? (
            <span className="inline-flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-current text-amber-500" aria-hidden />
              {host.rating}
            </span>
          ) : null}
        </div>
      </div>
    </section>
  );
}
