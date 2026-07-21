"use client";

import React from "react";
import { MessageBubble } from "./MessageBubble";
import { TimelineCard } from "./TimelineCard";
import type { ConversationPresentation, MessageDto } from "@/lib/messaging/messages-api";
import { selectGroupedMessages } from "@/lib/messaging/selectors/group-messages";
import {
  resolveCardKind,
  timelineCardRegistry,
  type CardKind,
} from "./timeline/registry";

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
]);

type Props = {
  messages: MessageDto[];
  removedLabel: string;
  presentation: ConversationPresentation;
  localePath: (path: string) => string;
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

export function TimelineRenderer({ messages, removedLabel, presentation, localePath }: Props) {
  const textMessages = messages.filter((m) => m.type === "TEXT");
  const groups = selectGroupedMessages(textMessages);
  let lastDay = "";

  return (
    <div className="flex flex-col gap-8 py-2">
      {messages.map((message) => {
        const time = message.sentAt ?? message.createdAt;
        const dk = dayKey(time);
        const showDay = dk && dk !== lastDay;
        if (showDay) lastDay = dk;

        const dayDivider = showDay && time ? (
          <div key={`day-${dk}-${message.id}`} className="flex justify-center my-4">
            <span className="px-3 py-1 bg-[#f0eded] text-nexa-ink-3 text-[11px] font-bold rounded-full uppercase tracking-widest">
              {dayLabel(time)}
            </span>
          </div>
        ) : null;

        if (message.type === "TEXT") {
          const group = groups.find((g) => g.messages.some((m) => m.id === message.id));
          if (!group || group.messages[0]?.id !== message.id) {
            return dayDivider;
          }
          return (
            <React.Fragment key={message.id}>
              {dayDivider}
              <MessageBubble
                group={group}
                counterpartAvatar={presentation.avatar}
                counterpartName={presentation.title}
                removedLabel={removedLabel}
              />
            </React.Fragment>
          );
        }

        if (CARD_TYPES.has(message.type) || message.isSystem || message.type.startsWith("SYSTEM")) {
          const kind = resolveCardKind(message) as CardKind | null;
          const Card = kind ? timelineCardRegistry[kind] : TimelineCard;
          const coverUrl =
            kind === "property"
              ? presentation.reservation.coverMedia?.url ?? null
              : null;

          return (
            <React.Fragment key={message.id}>
              {dayDivider}
              <Card
                message={message}
                localePath={localePath}
                presentation={presentation}
                coverUrl={coverUrl}
              />
            </React.Fragment>
          );
        }

        return dayDivider;
      })}
    </div>
  );
}
