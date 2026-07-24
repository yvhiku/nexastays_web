"use client";

import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { MessagingEmptyState } from "@/components/messaging/MessagingStates";

/** Desktop center placeholder when no conversation is selected. Mobile shows list only. */
export default function InboxPage() {
  const { t } = useLanguage();

  return (
    <MessagingEmptyState
      title={t("inbox.selectConversation")}
      body={t("inbox.selectConversationBody")}
    />
  );
}
