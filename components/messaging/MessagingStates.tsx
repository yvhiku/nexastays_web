"use client";

import React from "react";
import {
  KeyRound,
  MapPin,
  MessageCircle,
  SearchX,
  Sparkles,
} from "lucide-react";
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
      <div className="flex h-14 w-14 items-center justify-center rounded-messaging-card border border-nexa-line bg-white text-nexa-ink-3 shadow-messaging-2">
        <Icon className="h-6 w-6" />
      </div>
      <h2 className="mt-4 font-display text-xl font-semibold text-nexa-ink">{title}</h2>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-nexa-ink-2">{body}</p>
    </div>
  );
}

export function ConversationEmptyState({
  title,
  body,
  className,
}: {
  title: string;
  body: string;
  className?: string;
}) {
  const { t } = useLanguage();
  const prompts = [
    { icon: KeyRound, label: t("inbox.context.checkin") },
    { icon: MapPin, label: t("inbox.location") },
    { icon: MessageCircle, label: t("inbox.contactSupport") },
  ];

  return (
    <div
      className={cn(
        "flex flex-1 flex-col items-center justify-center px-6 py-14 text-center",
        className,
      )}
    >
      <div className="relative">
        <span
          className="absolute inset-0 scale-125 rounded-full bg-nexa-primary/10 blur-2xl"
          aria-hidden
        />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-messaging-panel border border-nexa-line bg-white text-nexa-ink-3 shadow-messaging-2">
          <MessageCircle className="h-8 w-8" aria-hidden />
          <span className="absolute -end-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-white text-nexa-primary shadow-md">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
          </span>
        </div>
      </div>
      <h2 className="mt-6 font-display text-[24px] font-semibold text-nexa-ink">
        {title}
      </h2>
      <p className="mt-2 max-w-sm text-sm leading-6 text-nexa-ink-2">{body}</p>
      <div
        className="mt-6 flex max-w-md flex-wrap justify-center gap-2"
        aria-hidden
      >
        {prompts.map(({ icon: Icon, label }) => (
          <span
            key={label}
            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-nexa-line bg-white px-3 text-xs font-semibold text-nexa-ink-3 shadow-messaging-1"
          >
            <Icon className="h-3.5 w-3.5 text-nexa-primary" />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function ConversationSkeleton() {
  const { t } = useLanguage();
  return (
    <div className="flex h-full min-w-0 flex-col bg-[linear-gradient(180deg,#fdfbfc,#fbf5f8)]" aria-label={t("inbox.loadingConversation")} aria-busy="true">
      <span className="sr-only" role="status">{t("inbox.loadingConversation")}</span>
      <div className="flex h-20 items-center gap-3 border-b border-nexa-line bg-white/95 px-4 shadow-messaging-1" aria-hidden>
        <div className="h-12 w-12 animate-pulse rounded-full bg-[linear-gradient(110deg,#f8e9ee,#fff5f7,#f8e9ee)] motion-reduce:animate-none" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-3.5 w-36 animate-pulse rounded-full bg-nexa-bg-2 motion-reduce:animate-none" />
          <div className="h-2.5 w-52 max-w-[70%] animate-pulse rounded-full bg-nexa-bg-2/80 motion-reduce:animate-none" />
          <div className="h-2 w-28 animate-pulse rounded-full bg-nexa-bg-2/60 motion-reduce:animate-none" />
        </div>
        <div className="flex gap-2">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-10 w-10 animate-pulse rounded-full bg-nexa-bg-2/80 motion-reduce:animate-none" />
          ))}
        </div>
      </div>
      <div className="mx-auto flex w-full max-w-[920px] flex-1 flex-col justify-end gap-4 overflow-hidden p-5" aria-hidden>
        <div className="ms-10 aspect-[16/10] w-[min(58%,320px)] animate-pulse rounded-messaging-bubble border border-nexa-line bg-[linear-gradient(110deg,#f8e9ee_20%,#fff5f7_42%,#f8e9ee_64%)] shadow-messaging-1 motion-reduce:animate-none" />
        {[48, 64, 42].map((width, index) => (
          <div
            key={width}
            className={cn(
              "h-12 animate-pulse rounded-messaging-bubble border border-nexa-line bg-nexa-bg-2/80 shadow-messaging-1 motion-reduce:animate-none",
              index % 2 ? "self-end" : "self-start",
            )}
            style={{ width: `${width}%` }}
          />
        ))}
        <div className="flex w-[min(70%,340px)] items-center gap-3 rounded-messaging-bubble border border-nexa-line bg-white/80 p-3 shadow-messaging-1">
          <div className="h-12 w-12 animate-pulse rounded-2xl bg-nexa-primary-soft motion-reduce:animate-none" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3 w-4/5 animate-pulse rounded-full bg-nexa-bg-2 motion-reduce:animate-none" />
            <div className="h-2.5 w-2/5 animate-pulse rounded-full bg-nexa-bg-2/70 motion-reduce:animate-none" />
          </div>
        </div>
      </div>
      <div className="m-4 h-14 animate-pulse rounded-messaging-composer border border-nexa-line bg-white shadow-messaging-2 motion-reduce:animate-none" aria-hidden />
    </div>
  );
}

export function ContextPanelSkeleton() {
  const { t } = useLanguage();
  return (
    <div className="h-full space-y-6 bg-[linear-gradient(180deg,#fffafb,#fdf5f8)] p-6" aria-label={t("inbox.loadingContext")} aria-busy="true">
      <span className="sr-only" role="status">{t("inbox.loadingContext")}</span>
      <div className="h-4 w-32 animate-pulse rounded bg-nexa-bg-2 motion-reduce:animate-none" aria-hidden />
      <div className="aspect-[16/9] animate-pulse rounded-3xl bg-[linear-gradient(110deg,#f8e9ee,#fff5f7,#f8e9ee)] motion-reduce:animate-none" aria-hidden />
      <div className="h-5 w-48 animate-pulse rounded bg-nexa-bg-2 motion-reduce:animate-none" aria-hidden />
      <div className="h-3 w-full animate-pulse rounded bg-nexa-bg-2 motion-reduce:animate-none" aria-hidden />
      <div className="h-3 w-3/4 animate-pulse rounded bg-nexa-bg-2 motion-reduce:animate-none" aria-hidden />
    </div>
  );
}
