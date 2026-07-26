"use client";

import React from "react";
import { Wifi } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { CardProps } from "./registry";
import { CompactTimelineMilestone } from "./CompactTimelineMilestone";

/**
 * Wi-Fi credentials are intentionally never rendered in the timeline.
 * Sensitive values remain confined to gated stay context surfaces.
 */
export function WifiCard({ message, localePath }: CardProps) {
  const { t } = useLanguage();
  return (
    <CompactTimelineMilestone
      icon={Wifi}
      title={t("inbox.timeline.wifiAvailable")}
      body={t("inbox.timeline.wifiSecure")}
      time={message.sentAt ?? message.createdAt}
      localePath={localePath}
      tone="checkin"
    />
  );
}
