"use client";

import React from "react";
import { BadgeCheck } from "lucide-react";
import type { CardProps } from "./registry";
import { CompactTimelineMilestone } from "./CompactTimelineMilestone";

export function SystemEventCard({ message, localePath }: CardProps) {
  const time = message.sentAt ?? message.createdAt;
  return (
    <CompactTimelineMilestone
      icon={BadgeCheck}
      title={message.body ?? "Update"}
      time={time}
      localePath={localePath}
    />
  );
}
