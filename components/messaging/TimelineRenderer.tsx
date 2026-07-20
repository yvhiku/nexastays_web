"use client";

import React from "react";
import { TextBubble } from "./TextBubble";
import { TimelineCard } from "./TimelineCard";
import type { MessageDto } from "@/lib/messaging/messages-api";

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
};

export function TimelineRenderer({ messages, removedLabel }: Props) {
  return (
    <div className="flex flex-col gap-3 py-2">
      {messages.map((message) => {
        if (message.type === "TEXT") {
          const deleted = Boolean((message.metadata as { deletedAt?: string }).deletedAt);
          return (
            <TextBubble
              key={message.id}
              message={message}
              removedLabel={deleted ? removedLabel : undefined}
            />
          );
        }

        if (CARD_TYPES.has(message.type)) {
          return <TimelineCard key={message.id} message={message} />;
        }

        if (message.isSystem || message.type.startsWith("SYSTEM")) {
          return <TimelineCard key={message.id} message={message} />;
        }

        return null;
      })}
    </div>
  );
}
