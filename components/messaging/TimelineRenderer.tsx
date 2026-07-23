"use client";

import React from "react";
import type { ConversationPresentation, MessageDto, AttachmentDto, ConversationPermissions } from "@/lib/messaging/messages-api";
import { selectGroupedMessages } from "@/lib/messaging/selectors/group-messages";
import { messageRendererRegistry, isRegistryMessageType } from "./MessageRendererRegistry";
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
  permissions,
  localePath,
  onOpenGallery,
  onRetryMediaUpload,
  uploadLabels,
}: Props) {
  const bubbleMessages = messages.filter((m) => isRegistryMessageType(m.type));
  const grouped = selectGroupedMessages(bubbleMessages);

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

        if (isRegistryMessageType(message.type)) {
          const group = grouped.find((g) => g.messages.some((m) => m.id === message.id));
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
              <div data-message-id={message.id}>
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
