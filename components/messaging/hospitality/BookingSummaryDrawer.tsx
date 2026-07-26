"use client";

import React from "react";
import type { ConversationDetail } from "@/lib/messaging/messages-api";
import { BookingStatusBanner } from "./BookingStatusBanner";
import { HostProfileCard } from "./HostProfileCard";
import { PropertyMiniCard } from "./PropertyMiniCard";
import { TripEssentials } from "./TripEssentials";
import { MilestoneCelebration } from "../polish/MilestoneCelebration";
import { deriveJourneyIndex } from "./journey";
import { useLanguage } from "@/contexts/LanguageContext";

export function BookingSummaryDrawer({
  conversation,
}: {
  conversation: ConversationDetail;
}) {
  const { t } = useLanguage();
  const stage = deriveJourneyIndex(conversation);
  return (
    <div className="space-y-5">
      {stage === 1 || stage === 5 ? (
        <MilestoneCelebration
          title={t(
            stage === 5
              ? "inbox.phase15.welcome.completed.title"
              : "inbox.phase15.welcome.confirmed.title",
          )}
          body={t(
            stage === 5
              ? "inbox.phase15.welcome.completed.body"
              : "inbox.phase15.welcome.confirmed.body",
          )}
        />
      ) : (
        <BookingStatusBanner conversation={conversation} />
      )}
      <PropertyMiniCard conversation={conversation} />
      <TripEssentials conversation={conversation} />
      <HostProfileCard conversation={conversation} />
    </div>
  );
}
