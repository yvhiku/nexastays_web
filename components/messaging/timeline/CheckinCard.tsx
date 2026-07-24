"use client";

import React from "react";
import { KeyRound } from "lucide-react";
import type { CardAction } from "@/lib/messaging/actions/registry";
import { getCardPayload } from "@/lib/messaging/message-payload";
import type { CardProps } from "./registry";
import { CompactTimelineMilestone } from "./CompactTimelineMilestone";

function cardMeta(message: CardProps["message"]) {
  const payload = getCardPayload(message);
  return {
    title: payload?.title ?? (message.metadata as { title?: string }).title ?? "Check-in",
    body: payload?.body ?? (message.metadata as { body?: string }).body,
    actions: payload?.actions ?? (message.metadata as { actions?: CardAction[] }).actions ?? [],
    snapshot: payload?.snapshot ?? (message.metadata as { snapshot?: Record<string, unknown> }).snapshot,
  };
}

export function CheckinCard({ message, localePath }: CardProps) {
  const meta = cardMeta(message);
  const checkInTime = meta.snapshot?.checkInTime as string | undefined;

  return (
    <CompactTimelineMilestone
      icon={KeyRound}
      title={meta.title}
      body={checkInTime ?? meta.body}
      time={message.sentAt ?? message.createdAt}
      action={meta.actions[0]}
      localePath={localePath}
      tone="checkin"
      size="featured"
    />
  );
}
