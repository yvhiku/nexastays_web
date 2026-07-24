"use client";

import React, { useMemo } from "react";
import type { ConversationPresentation, MessageDto, AttachmentDto, ConversationPermissions } from "@/lib/messaging/messages-api";
import { selectGroupedMessages } from "@/lib/messaging/selectors/group-messages";
import { messageRendererRegistry, isRegistryMessageType } from "./MessageRendererRegistry";
import { renderTimelineCard, resolveCardKind } from "./timeline/registry";
import {
  selectTimelinePresentation,
} from "@/lib/messaging/selectors/timeline-presentation";
import { BookingLifecycleCard } from "./timeline/BookingLifecycleCard";
import { useLanguage } from "@/contexts/LanguageContext";

const CARD_TYPES = new Set([
  "SYSTEM_EVENT",
  "SYSTEM_NOTICE",
  "PROPERTY_CARD",
  "BOOKING_CARD",
  "CHECKIN_CARD",
  "WIFI_CARD",
  "LOCATION_CARD",
  "REVIEW_CARD",
  "PAYMENT_CARD",
  "AI_CARD",
]);

type Props = {
  messages: MessageDto[];
  removedLabel: string;
  presentation: ConversationPresentation;
  permissions?: ConversationPermissions;
  localePath: (path: string) => string;
  onOpenGallery?: (attachments: AttachmentDto[], index: number) => void;
  onRetryMediaUpload?: (clientMessageId: string) => void;
  uploadLabels?: {
    uploading: string;
    failed: string;
    retry: string;
  };
};

function dayKey(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function dayLabel(
  iso: string,
  locale: string,
  todayLabel: string,
  yesterdayLabel: string,
): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const weekday = d.toLocaleDateString(locale, { weekday: "long" });
  if (dayKey(iso) === dayKey(today.toISOString())) {
    return `${todayLabel} · ${weekday}`;
  }
  if (dayKey(iso) === dayKey(yesterday.toISOString())) {
    return `${yesterdayLabel} · ${weekday}`;
  }
  return d.toLocaleDateString(locale, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export function TimelineRenderer({
  messages,
  removedLabel,
  presentation,
  permissions,
  localePath,
  onOpenGallery,
  onRetryMediaUpload,
  uploadLabels,
}: Props) {
  const { t, locale } = useLanguage();
  const presentationItems = useMemo(
    () => selectTimelinePresentation(messages),
    [messages],
  );
  const groupedByFirstMessage = useMemo(() => {
    const bubbleMessages = messages.filter((message) =>
      isRegistryMessageType(message.type),
    );
    const index = new Map<string, ReturnType<typeof selectGroupedMessages>[number]>();
    for (const group of selectGroupedMessages(bubbleMessages)) {
      const firstId = group.messages[0]?.id;
      if (firstId) index.set(firstId, group);
    }
    return index;
  }, [messages]);

  let lastDay = "";
  let lastIncomingSender: string | null = null;

  return (
    <div className="flex flex-col gap-3 py-2">
      {presentationItems.map((item) => {
        const message = item.message;
        const time = message.sentAt ?? message.createdAt;
        const dk = dayKey(time);
        const showDay = dk && dk !== lastDay;
        if (showDay) lastDay = dk;

        const dayDivider = showDay && time ? (
          <div key={`day-${dk}-${message.id}`} className="my-5 flex justify-center">
            <span className="rounded-full border border-nexa-line/60 bg-nexa-bg-2/90 px-4 py-2 text-xs font-medium text-nexa-ink-3 shadow-[0_3px_10px_rgba(78,42,58,0.045)] backdrop-blur">
              {dayLabel(
                time,
                locale,
                t("inbox.timeline.today"),
                t("inbox.timeline.yesterday"),
              )}
            </span>
          </div>
        ) : null;

        if (item.kind === "booking-summary") {
          return (
            <React.Fragment key={message.id}>
              {dayDivider}
              <div data-message-id={message.id} className="px-0 py-3 sm:px-4">
                <BookingLifecycleCard
                  messages={item.sourceMessages}
                  presentation={presentation}
                  localePath={localePath}
                />
              </div>
            </React.Fragment>
          );
        }

        if (isRegistryMessageType(message.type)) {
          const group = groupedByFirstMessage.get(message.id);
          if (!group) {
            return dayDivider;
          }

          const hideAvatar =
            !group.isOwn &&
            lastIncomingSender === group.senderId &&
            message.type === "TEXT";
          if (!group.isOwn) lastIncomingSender = group.senderId;
          else lastIncomingSender = null;

          return (
            <React.Fragment key={message.id}>
              {dayDivider}
              {messageRendererRegistry.render({
                group: { ...group, showAvatar: group.showAvatar && !hideAvatar },
                message,
                counterpartAvatar: presentation.avatar,
                counterpartName: presentation.title,
                removedLabel,
                onOpenGallery,
                onRetryMediaUpload,
                uploadLabels,
              })}
            </React.Fragment>
          );
        }

        if (CARD_TYPES.has(message.type) || message.isSystem || message.type.startsWith("SYSTEM")) {
          const kind = resolveCardKind(message);
          const coverUrl =
            kind === "property" ? presentation.reservation.coverMedia?.url ?? null : null;

          return (
            <React.Fragment key={message.id}>
              {dayDivider}
              <div
                data-message-id={message.id}
                className="px-0 py-3 sm:px-4"
                style={{ contentVisibility: "auto", containIntrinsicSize: "132px" }}
              >
                {renderTimelineCard({
                  message,
                  localePath,
                  presentation,
                  coverUrl,
                  viewerRole:
                    permissions?.viewerRole ??
                    (permissions?.canReview ? "guest" : "host"),
                })}
              </div>
            </React.Fragment>
          );
        }

        return dayDivider;
      })}
    </div>
  );
}
