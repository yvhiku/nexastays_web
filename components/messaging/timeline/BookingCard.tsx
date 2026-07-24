"use client";

import React from "react";
import { CalendarCheck } from "lucide-react";
import type { CardAction } from "@/lib/messaging/actions/registry";
import { getCardPayload } from "@/lib/messaging/message-payload";
import type { CardProps } from "./registry";
import { CompactTimelineMilestone } from "./CompactTimelineMilestone";

export function BookingCard({ message, localePath }: CardProps) {
  const payload = getCardPayload(message);
  const meta = message.metadata as {
    title?: string;
    body?: string;
    actions?: CardAction[];
  };

  return (
    <CompactTimelineMilestone
      icon={CalendarCheck}
      title={payload?.title ?? meta.title ?? "Booking"}
      body={payload?.body ?? meta.body}
      time={message.sentAt ?? message.createdAt}
      action={(payload?.actions ?? meta.actions ?? [])[0]}
      localePath={localePath}
    />
  );
}
