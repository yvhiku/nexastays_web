"use client";

import React from "react";
import {
  BadgeCheck,
  CalendarCheck,
  CircleDollarSign,
  KeyRound,
  LifeBuoy,
  LogOut,
  Star,
  type LucideIcon,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { CardProps } from "./registry";
import {
  CompactTimelineMilestone,
  type MilestoneTone,
} from "./CompactTimelineMilestone";

type Presentation = {
  tone: MilestoneTone;
  icon: LucideIcon;
  titleKey?: string;
  bodyKey?: string;
};

function eventPresentation(message: CardProps["message"]): Presentation {
  const text = `${message.type} ${message.body ?? ""}`.toLowerCase();
  if (text.includes("checkout") || text.includes("check-out")) {
    return {
      tone: "checkout",
      icon: LogOut,
      titleKey: "inbox.timeline.checkoutTitle",
      bodyKey: "inbox.timeline.checkoutBody",
    };
  }
  if (text.includes("review")) {
    return {
      tone: "review",
      icon: Star,
      titleKey: "inbox.timeline.reviewTitle",
      bodyKey: "inbox.timeline.reviewBody",
    };
  }
  if (text.includes("payment") || text.includes("payout")) {
    return {
      tone: "payment",
      icon: CircleDollarSign,
      titleKey: "inbox.timeline.paymentTitle",
      bodyKey: "inbox.timeline.paymentBody",
    };
  }
  if (text.includes("checkin") || text.includes("check-in") || text.includes("arrival")) {
    return {
      tone: "checkin",
      icon: KeyRound,
      titleKey: "inbox.timeline.checkinTitle",
      bodyKey: "inbox.timeline.checkinBody",
    };
  }
  if (text.includes("support") || text.includes("dispute")) {
    return {
      tone: "support",
      icon: LifeBuoy,
      titleKey: "inbox.timeline.supportTitle",
      bodyKey: "inbox.timeline.supportBody",
    };
  }
  if (text.includes("booking") || text.includes("confirmed") || text.includes("reservation")) {
    return {
      tone: "booking",
      icon: CalendarCheck,
      titleKey: "inbox.timeline.bookingTitle",
      bodyKey: "inbox.timeline.bookingBody",
    };
  }
  return { tone: "neutral", icon: BadgeCheck };
}

export function SystemEventCard({ message, localePath }: CardProps) {
  const { t } = useLanguage();
  const presentation = eventPresentation(message);
  const title = presentation.titleKey
    ? t(presentation.titleKey)
    : message.body ?? t("inbox.timeline.updateTitle");
  const body = presentation.bodyKey ? t(presentation.bodyKey) : undefined;

  return (
    <CompactTimelineMilestone
      icon={presentation.icon}
      title={title}
      body={body}
      time={message.sentAt ?? message.createdAt}
      localePath={localePath}
      tone={presentation.tone}
    />
  );
}
