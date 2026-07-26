"use client";

import React from "react";
import { CheckCircle2, Clock3, KeyRound, Star } from "lucide-react";
import type { ConversationDetail } from "@/lib/messaging/messages-api";
import { useLanguage } from "@/contexts/LanguageContext";
import { deriveJourneyIndex } from "./journey";

export function BookingStatusBanner({
  conversation,
}: {
  conversation: ConversationDetail;
}) {
  const { t } = useLanguage();
  const index = deriveJourneyIndex(conversation);
  if (!conversation.conversation.bookingId) return null;
  const states = [
    { key: "inquiry", Icon: Clock3 },
    { key: "confirmed", Icon: CheckCircle2 },
    { key: "checkin", Icon: KeyRound },
    { key: "stay", Icon: KeyRound },
    { key: "checkout", Icon: CheckCircle2 },
    { key: "review", Icon: Star },
  ] as const;
  const state = states[index] ?? states[1];
  return (
    <div
      className="flex min-h-11 items-center gap-2 rounded-2xl border border-nexa-primary/12 bg-nexa-primary-soft/65 px-3 text-xs font-bold text-nexa-primary"
      role="status"
    >
      <state.Icon className="h-4 w-4 shrink-0" aria-hidden />
      {t(`inbox.phase14.status.${state.key}`)}
    </div>
  );
}
