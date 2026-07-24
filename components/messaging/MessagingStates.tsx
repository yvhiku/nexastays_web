"use client";

import React from "react";
import { MessageCircle, SearchX } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

export function MessagingEmptyState({
  title,
  body,
  search = false,
  className,
}: {
  title: string;
  body: string;
  search?: boolean;
  className?: string;
}) {
  const Icon = search ? SearchX : MessageCircle;
  return (
    <div className={cn("flex flex-1 flex-col items-center justify-center px-6 py-12 text-center", className)}>
      <div className="flex h-14 w-14 items-center justify-center rounded-3xl border border-nexa-primary/15 bg-[linear-gradient(145deg,#fff,#fce7ec)] text-nexa-primary shadow-[0_10px_24px_rgba(232,80,122,0.13)]">
        <Icon className="h-6 w-6" />
      </div>
      <h2 className="mt-4 font-display text-xl font-semibold text-nexa-ink">{title}</h2>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-nexa-ink-2">{body}</p>
    </div>
  );
}

export function ConversationSkeleton() {
  const { t } = useLanguage();
  return (
    <div className="flex h-full flex-col bg-[linear-gradient(180deg,#fdfbfc,#fbf5f8)]" aria-label={t("inbox.loadingConversation")} aria-busy="true">
      <div className="flex h-16 items-center gap-3 border-b border-nexa-primary/10 bg-white/95 px-4 shadow-[0_8px_24px_rgba(91,45,66,0.05)]">
        <div className="h-10 w-10 animate-pulse rounded-full bg-nexa-bg-2" />
        <div className="space-y-2">
          <div className="h-3 w-32 animate-pulse rounded bg-nexa-bg-2" />
          <div className="h-2.5 w-20 animate-pulse rounded bg-nexa-bg-2" />
        </div>
      </div>
      <div className="flex flex-1 flex-col justify-end gap-3 p-5">
        {[44, 64, 52, 72].map((width, index) => (
          <div
            key={width}
            className={cn(
              "h-12 animate-pulse rounded-3xl bg-nexa-bg-2",
              index % 2 ? "self-end" : "self-start",
            )}
            style={{ width: `${width}%` }}
          />
        ))}
      </div>
      <div className="m-4 h-12 animate-pulse rounded-full bg-nexa-bg-2" />
    </div>
  );
}

export function ContextPanelSkeleton() {
  const { t } = useLanguage();
  return (
    <div className="h-full space-y-6 bg-[linear-gradient(180deg,#fffafb,#fdf5f8)] p-6" aria-label={t("inbox.loadingContext")} aria-busy="true">
      <div className="h-4 w-32 animate-pulse rounded bg-nexa-bg-2" />
      <div className="aspect-[16/9] animate-pulse rounded-3xl bg-nexa-bg-2" />
      <div className="h-5 w-48 animate-pulse rounded bg-nexa-bg-2" />
      <div className="h-3 w-full animate-pulse rounded bg-nexa-bg-2" />
      <div className="h-3 w-3/4 animate-pulse rounded bg-nexa-bg-2" />
    </div>
  );
}
