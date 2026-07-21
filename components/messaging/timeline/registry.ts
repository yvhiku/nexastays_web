"use client";

import React from "react";
import { TimelineCard } from "../TimelineCard";
import type { MessageDto } from "@/lib/messaging/messages-api";
import { SystemEventCard } from "./SystemEventCard";
import { BookingCard } from "./BookingCard";
import { PropertyCard } from "./PropertyCard";
import type { ConversationPresentation } from "@/lib/messaging/messages-api";

export type CardKind =
  | "system"
  | "booking"
  | "property"
  | "wifi"
  | "checkin"
  | "payment"
  | "review";

export type CardProps = {
  message: MessageDto;
  localePath: (path: string) => string;
  presentation?: ConversationPresentation;
  coverUrl?: string | null;
};

export const timelineCardRegistry = {
  system: SystemEventCard,
  booking: BookingCard,
  property: PropertyCard,
  wifi: TimelineCard,
  checkin: TimelineCard,
  payment: TimelineCard,
  review: TimelineCard,
} satisfies Record<CardKind, React.ComponentType<CardProps>>;

export function resolveCardKind(message: MessageDto): CardKind | null {
  const meta = message.metadata as { kind?: string };
  const kind = (meta.kind ?? "").toLowerCase();
  if (kind && kind in timelineCardRegistry) return kind as CardKind;
  if (message.type === "SYSTEM_EVENT" || message.type.startsWith("SYSTEM")) return "system";
  if (message.type === "BOOKING_CARD") return "booking";
  if (message.type === "PROPERTY_CARD") return "property";
  return null;
}
