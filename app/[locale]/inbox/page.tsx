"use client";

import React from "react";
import { MessageCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

/** Desktop center placeholder when no conversation is selected. Mobile shows list only. */
export default function InboxPage() {
  const { t } = useLanguage();

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col items-center justify-center px-8 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-nexa-primary-soft">
        <MessageCircle className="h-8 w-8 text-nexa-primary" />
      </div>
      <p className="font-[family-name:var(--font-playfair)] text-xl font-semibold text-nexa-ink">
        {t("inbox.selectConversation")}
      </p>
      <p className="mt-2 max-w-sm text-sm text-nexa-ink-4">{t("inbox.selectConversationBody")}</p>
    </div>
  );
}
