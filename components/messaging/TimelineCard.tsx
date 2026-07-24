"use client";

import React from "react";
import {
  BadgeCheck,
  CalendarCheck,
  CreditCard,
  KeyRound,
  MapPin,
  Star,
  Wifi,
} from "lucide-react";
import type { MessageDto } from "@/lib/messaging/messages-api";
import type { CardAction } from "@/lib/messaging/actions/registry";
import { getCardPayload } from "@/lib/messaging/message-payload";
import { CompactTimelineMilestone } from "./timeline/CompactTimelineMilestone";
import type { MilestoneTone } from "./timeline/CompactTimelineMilestone";

function iconForKind(kind?: string, type?: string) {
  const value = (kind ?? type ?? "").toLowerCase();
  if (value.includes("wifi")) return Wifi;
  if (value.includes("checkin") || value.includes("key")) return KeyRound;
  if (value.includes("location") || value.includes("map")) return MapPin;
  if (value.includes("review") || value.includes("star")) return Star;
  if (value.includes("payment") || value.includes("pay")) return CreditCard;
  if (value.includes("booking") || value.includes("confirmed")) return CalendarCheck;
  return BadgeCheck;
}

function toneForKind(kind?: string, type?: string): MilestoneTone {
  const value = (kind ?? type ?? "").toLowerCase();
  if (value.includes("checkin") || value.includes("location") || value.includes("wifi")) return "checkin";
  if (value.includes("checkout")) return "checkout";
  if (value.includes("review")) return "review";
  if (value.includes("payment") || value.includes("pay")) return "payment";
  if (value.includes("support") || value.includes("dispute") || value.includes("ai")) return "support";
  if (value.includes("booking") || value.includes("property") || value.includes("confirmed")) return "booking";
  return "neutral";
}

type Props = {
  message: MessageDto;
  localePath?: (path: string) => string;
};

export function TimelineCard({ message, localePath = (path) => path }: Props) {
  const payload = getCardPayload(message);
  const meta = (message.metadata ?? {}) as {
    kind?: string;
    title?: string;
    body?: string;
    actions?: CardAction[];
  };

  return (
    <CompactTimelineMilestone
      icon={iconForKind(payload?.kind ?? meta.kind, message.type)}
      title={payload?.title ?? meta.title ?? message.body ?? "Update"}
      body={payload?.body ?? meta.body}
      time={message.sentAt ?? message.createdAt}
      action={(payload?.actions ?? meta.actions ?? [])[0]}
      localePath={localePath}
      tone={toneForKind(payload?.kind ?? meta.kind, message.type)}
    />
  );
}
