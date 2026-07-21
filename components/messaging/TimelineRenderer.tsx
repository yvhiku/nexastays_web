"use client";

import React from "react";
import { MessageBubble } from "./MessageBubble";
import type { ConversationPresentation, MessageDto, AttachmentDto } from "@/lib/messaging/messages-api";
import { selectGroupedMessages } from "@/lib/messaging/selectors/group-messages";
import { renderTimelineCard, resolveCardKind } from "./timeline/registry";

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
  "IMAGE",
  "FILE",
]);

type Props = {
  messages: MessageDto[];
  removedLabel: string;
  presentation: ConversationPresentation;
  localePath: (path: string) => string;
  onOpenGallery?: (attachments: AttachmentDto[], index: number) => void;
};

function dayKey(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (dayKey(iso) === dayKey(today.toISOString())) return "Today";
  if (dayKey(iso) === dayKey(yesterday.toISOString())) return "Yesterday";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function TimelineRenderer({
  messages,
  removedLabel,
  presentation,
  localePath,
  onOpenGallery,
}: Props) {
  const textMessages = messages.filter((m) => m.type === "TEXT");
  const mediaMessages = messages.filter((m) => m.type === "IMAGE" || m.type === "FILE");
  const groupedText = selectGroupedMessages(textMessages);
  const groupedMedia = selectGroupedMessages(mediaMessages);
  const allGroups = [...groupedText, ...groupedMedia].sort(
    (a, b) =>
      (a.messages[0]?.conversationSequence ?? 0) - (b.messages[0]?.conversationSequence ?? 0),
  );

  let lastDay = "";
  let lastIncomingSender: string | null = null;

  return (
    <div className="flex flex-col gap-4 py-2">
      {messages.map((message) => {
        const time = message.sentAt ?? message.createdAt;
        const dk = dayKey(time);
        const showDay = dk && dk !== lastDay;
        if (showDay) lastDay = dk;

        const dayDivider = showDay && time ? (
          <div key={`day-${dk}-${message.id}`} className="flex justify-center my-3">
            <span className="px-3 py-1 bg-[#f0eded] text-nexa-ink-3 text-[11px] font-bold rounded-full uppercase tracking-widest">
              {dayLabel(time)}
            </span>
          </div>
        ) : null;

        if (message.type === "TEXT" || message.type === "IMAGE" || message.type === "FILE") {
          const group = allGroups.find((g) => g.messages.some((m) => m.id === message.id));
          if (!group || group.messages[0]?.id !== message.id) {
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
              <MessageBubble
                group={{ ...group, showAvatar: group.showAvatar && !hideAvatar }}
                counterpartAvatar={presentation.avatar}
                counterpartName={presentation.title}
                removedLabel={removedLabel}
                onOpenGallery={onOpenGallery}
              />
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
              <div data-message-id={message.id}>
                {renderTimelineCard({
                  message,
                  localePath,
                  presentation,
                  coverUrl,
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
