"use client";

import React from "react";
import { TimelineCard } from "../TimelineCard";
import type { MessageDto, ConversationPresentation } from "@/lib/messaging/messages-api";
import { getCardPayload } from "@/lib/messaging/message-payload";
import { SystemEventCard } from "./SystemEventCard";
import { BookingCard } from "./BookingCard";
import { PropertyCard } from "./PropertyCard";
import { CheckinCard } from "./CheckinCard";
import { WifiCard } from "./WifiCard";
import { ReviewCard } from "./ReviewCard";
import { LocationCard } from "./LocationCard";
import { PaymentCard } from "./PaymentCard";
import { AiCardStub } from "./AiCardStub";

export type CardKind =
  | "system"
  | "booking"
  | "property"
  | "wifi"
  | "checkin"
  | "payment"
  | "review"
  | "location"
  | "file"
  | "ai";

export type CardProps = {
  message: MessageDto;
  localePath: (path: string) => string;
  presentation?: ConversationPresentation;
  coverUrl?: string | null;
};

type CardComponent = React.ComponentType<CardProps>;

class TimelineRegistry {
  private readonly components = new Map<string, CardComponent>();

  register(kind: string, component: CardComponent): void {
    this.components.set(kind.toLowerCase(), component);
  }

  resolveKind(message: MessageDto): string | null {
    const payload = getCardPayload(message);
    if (payload?.kind) return payload.kind.toLowerCase();
    if (message.type === "SYSTEM_EVENT" || message.type.startsWith("SYSTEM")) return "system";
    if (message.type === "BOOKING_CARD") return "booking";
    if (message.type === "PROPERTY_CARD") return "property";
    if (message.type === "CHECKIN_CARD") return "checkin";
    if (message.type === "WIFI_CARD") return "wifi";
    if (message.type === "LOCATION_CARD") return "location";
    if (message.type === "REVIEW_CARD") return "review";
    if (message.type === "PAYMENT_CARD") return "payment";
    if (message.type === "AI_CARD") return "ai";
    return null;
  }

  render(props: CardProps): React.ReactNode {
    const kind = this.resolveKind(props.message);
    if (!kind) return null;
    const Component = this.components.get(kind) ?? TimelineCard;
    return <Component {...props} />;
  }
}

export const timelineRegistry = new TimelineRegistry();

timelineRegistry.register("system", SystemEventCard);
timelineRegistry.register("booking", BookingCard);
timelineRegistry.register("property", PropertyCard);
timelineRegistry.register("checkin", CheckinCard);
timelineRegistry.register("wifi", WifiCard);
timelineRegistry.register("review", ReviewCard);
timelineRegistry.register("location", LocationCard);
timelineRegistry.register("payment", PaymentCard);
timelineRegistry.register("file", TimelineCard);
timelineRegistry.register("ai", AiCardStub);

export function resolveCardKind(message: MessageDto): CardKind | null {
  const kind = timelineRegistry.resolveKind(message);
  return kind as CardKind | null;
}

export function renderTimelineCard(props: CardProps): React.ReactNode {
  return timelineRegistry.render(props);
}

/** @deprecated use timelineRegistry */
export const timelineCardRegistry = {
  system: SystemEventCard,
  booking: BookingCard,
  property: PropertyCard,
  wifi: WifiCard,
  checkin: CheckinCard,
  payment: PaymentCard,
  review: ReviewCard,
};
