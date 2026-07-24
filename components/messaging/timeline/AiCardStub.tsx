"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import { getCardPayload } from "@/lib/messaging/message-payload";
import type { CardProps } from "./registry";
import { CompactTimelineMilestone } from "./CompactTimelineMilestone";

/** Compact compatibility renderer for an explicitly supplied AI timeline payload. */
export function AiCardStub({ message, localePath }: CardProps) {
  const payload = getCardPayload(message);
  const meta = message.metadata as { title?: string; body?: string };
  const title = payload?.title ?? meta.title;
  const body = payload?.body ?? meta.body;
  if (!title && !body) return null;

  return (
    <CompactTimelineMilestone
      icon={Sparkles}
      title={title ?? body ?? ""}
      body={title ? body : undefined}
      time={message.sentAt ?? message.createdAt}
      action={payload?.actions?.[0]}
      localePath={localePath}
      tone="support"
    />
  );
}
