"use client";

import React from "react";
import { CreditCard } from "lucide-react";
import type { CardAction } from "@/lib/messaging/actions/registry";
import { getCardPayload } from "@/lib/messaging/message-payload";
import type { CardProps } from "./registry";
import { CompactTimelineMilestone } from "./CompactTimelineMilestone";

export function PaymentCard({ message, localePath }: CardProps) {
  const payload = getCardPayload(message);
  const meta = message.metadata as { title?: string; body?: string; actions?: CardAction[] };
  const title = payload?.title ?? meta.title ?? "Payment";
  const body = payload?.body ?? meta.body;
  const actions = payload?.actions ?? meta.actions ?? [];

  return (
    <CompactTimelineMilestone
      icon={CreditCard}
      title={title}
      body={body}
      time={message.sentAt ?? message.createdAt}
      action={actions[0]}
      localePath={localePath}
      tone="payment"
    />
  );
}
