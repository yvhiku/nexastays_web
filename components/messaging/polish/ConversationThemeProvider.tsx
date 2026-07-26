"use client";

import React from "react";
import type { ConversationDetail } from "@/lib/messaging/messages-api";
import { deriveJourneyIndex } from "../hospitality/journey";

const themes = ["inquiry", "confirmed", "checkin", "stay", "completed", "review"] as const;

export function ConversationThemeProvider({
  conversation,
  children,
}: {
  conversation: ConversationDetail;
  children: React.ReactNode;
}) {
  const theme = themes[deriveJourneyIndex(conversation)] ?? "inquiry";
  return (
    <div className="contents" data-conversation-theme={theme}>
      {children}
    </div>
  );
}
