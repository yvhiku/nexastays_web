"use client";

import React from "react";
import { MapPin } from "lucide-react";
import type { CardAction } from "@/lib/messaging/actions/registry";
import { getCardPayload } from "@/lib/messaging/message-payload";
import type { CardProps } from "./registry";
import { CompactTimelineMilestone } from "./CompactTimelineMilestone";

export function LocationCard({ message, localePath }: CardProps) {
  const payload = getCardPayload(message);
  const meta = message.metadata as {
    title?: string;
    body?: string;
    actions?: CardAction[];
  };

  return (
    <CompactTimelineMilestone
      icon={MapPin}
      title={payload?.title ?? meta.title ?? "Location"}
      body={payload?.body ?? meta.body}
      time={message.sentAt ?? message.createdAt}
      action={(payload?.actions ?? meta.actions ?? [])[0]}
      localePath={localePath}
    />
  );
}
