"use client";

import React from "react";
import Link from "next/link";
import {
  BadgeCheck,
  CalendarCheck,
  FileText,
  Home,
  Image as ImageIcon,
  MessageCircle,
  Mic,
  Paperclip,
  UserRound,
  Headphones,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/avatar/UserAvatar";
import { useLanguage } from "@/contexts/LanguageContext";
import type { ConversationListResponse } from "@/lib/messaging/messages-api";
import {
  resolveInboxPreview,
  type OptimisticInboxEntry,
} from "@/lib/messaging/inbox-optimistic";
import { resolveRoleAwareInboxPreview } from "@/lib/messaging/inbox-preview";

type Props = {
  item: ConversationListResponse;
  href: string;
  optimistic?: OptimisticInboxEntry | null;
  isActive?: boolean;
};

function startOfDay(timestamp: number): number {
  const date = new Date(timestamp);
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  ).getTime();
}

function formatRelativeTime(
  iso: string | null,
  locale: string,
  optimisticAt?: number | null,
): string {
  const timestamp = optimisticAt ?? (iso ? new Date(iso).getTime() : 0);
  if (!timestamp) return "";
  const diff = Math.max(0, Date.now() - timestamp);
  const minutes = Math.floor(diff / 60_000);
  const relative = new Intl.RelativeTimeFormat(locale, {
    numeric: "auto",
    style: "narrow",
  });
  if (minutes < 1) return relative.format(0, "second");
  if (minutes < 60) {
    return new Intl.NumberFormat(locale, {
      style: "unit",
      unit: "minute",
      unitDisplay: "narrow",
    }).format(minutes);
  }

  const hours = Math.floor(minutes / 60);
  if (startOfDay(timestamp) === startOfDay(Date.now())) {
    return new Intl.NumberFormat(locale, {
      style: "unit",
      unit: "hour",
      unitDisplay: "narrow",
    }).format(hours);
  }

  const dayDifference = Math.round(
    (startOfDay(timestamp) - startOfDay(Date.now())) / 86_400_000,
  );
  if (dayDifference === -1) return relative.format(-1, "day");
  if (dayDifference > -7) {
    return new Date(timestamp).toLocaleDateString(locale, {
      weekday: "short",
    });
  }
  return new Date(timestamp).toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
  });
}

function compactDateRange(
  checkin: string,
  checkout: string,
  locale: string,
): string {
  if (!checkin || !checkout) return "";
  const start = new Date(`${checkin.slice(0, 10)}T12:00:00`);
  const end = new Date(`${checkout.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "";
  const format = new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
  });
  return `${format.format(start)} – ${format.format(end)}`;
}

function statusTone(label: string): string {
  const normalized = label.toLowerCase();
  if (normalized.includes("cancel")) {
    return "border-red-200/70 bg-red-50 text-red-700";
  }
  if (normalized.includes("payment") || normalized.includes("pay")) {
    return "border-orange-200/70 bg-orange-50 text-orange-700";
  }
  if (
    normalized.includes("check-in") ||
    normalized.includes("checked in") ||
    normalized.includes("arrival")
  ) {
    return "border-sky-200/70 bg-sky-50 text-sky-700";
  }
  if (
    normalized.includes("complete") ||
    normalized.includes("checkout") ||
    normalized.includes("checked out")
  ) {
    return "border-emerald-200/70 bg-emerald-50 text-emerald-700";
  }
  if (normalized.includes("archive")) {
    return "border-slate-200/80 bg-slate-50 text-slate-600";
  }
  if (normalized.includes("support")) {
    return "border-nexa-primary/15 bg-nexa-primary-soft text-nexa-primary";
  }
  if (normalized.includes("upcoming") || normalized.includes("pending")) {
    return "border-violet-200/70 bg-violet-50 text-violet-700";
  }
  return "border-nexa-primary/15 bg-nexa-primary-soft text-nexa-primary";
}

function previewIcon(preview: string): LucideIcon | null {
  const normalized = preview.toLowerCase();
  if (/(photo|image|picture)/.test(normalized)) return ImageIcon;
  if (/(voice|audio)/.test(normalized)) return Mic;
  if (/(file|pdf|document)/.test(normalized)) return FileText;
  if (/(attachment)/.test(normalized)) return Paperclip;
  if (
    /(booking|reservation|check-in|checkout|payment|review)/.test(normalized)
  ) {
    return CalendarCheck;
  }
  return null;
}

function ConversationRowInner({
  item,
  href,
  optimistic,
  isActive = false,
}: Props) {
  const { t, locale } = useLanguage();
  const { presentation, sync, lastMessage, permissions, conversation } = item;
  const unread = sync.unreadCount > 0;
  const viewerRole =
    permissions.viewerRole ?? (permissions.canReview ? "guest" : "host");
  const preview = resolveRoleAwareInboxPreview(
    resolveInboxPreview(lastMessage.preview, lastMessage.at, optimistic),
    viewerRole,
  );
  const PreviewIcon = previewIcon(preview);
  const timeLabel = formatRelativeTime(
    lastMessage.at,
    locale,
    optimistic?.at ?? null,
  );
  const dateRange = compactDateRange(
    presentation.reservation.checkinDate,
    presentation.reservation.checkoutDate,
    locale,
  );
  const archived =
    conversation.visibility === "ARCHIVED" ||
    conversation.messagingState === "ARCHIVED";
  const statusLabel =
    presentation.statusChip ??
    (archived ? t("inbox.filters.archived") : null);
  const usesPropertyFallback =
    !presentation.avatar && Boolean(presentation.reservation.coverMedia);
  const avatarMedia =
    presentation.avatar ?? presentation.reservation.coverMedia;
  const counterpartLabel =
    conversation.type === "SUPPORT"
      ? t("inbox.filters.support")
      : viewerRole === "host"
        ? t("inbox.guestRole")
        : presentation.counterpart.verified
          ? t("inbox.verifiedHostRole")
          : t("inbox.hostRole");
  const RoleIcon =
    conversation.type === "SUPPORT"
      ? Headphones
      : usesPropertyFallback
        ? Home
        : presentation.counterpart.verified
          ? BadgeCheck
          : viewerRole === "host"
            ? UserRound
            : Home;

  return (
    <Link
      href={href}
      data-conversation-row
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "group relative mx-2 flex min-h-24 min-w-0 cursor-pointer items-start gap-3 overflow-hidden rounded-messaging-card border px-3 py-3 transition-[background-color,border-color,box-shadow,transform] duration-messaging-hover motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-nexa-primary/50 active:duration-messaging-press",
        isActive
          ? "border-nexa-primary/20 bg-[linear-gradient(135deg,#fff_0%,#fdf0f3_100%)] shadow-messaging-2"
          : unread
            ? "border-nexa-primary/10 bg-white shadow-messaging-1 hover:-translate-y-px hover:border-nexa-primary/20 hover:shadow-messaging-2"
            : "border-nexa-line/70 bg-white/80 shadow-messaging-1 hover:-translate-y-px hover:border-nexa-line hover:bg-white hover:shadow-messaging-2 active:translate-y-0",
      )}
    >
      {isActive || unread ? (
        <span
          className={cn(
            "absolute inset-y-3 start-0 w-1 rounded-e-full",
            isActive ? "bg-nexa-primary" : "bg-nexa-primary/65",
          )}
          aria-hidden
        />
      ) : null}

      <div className="relative shrink-0">
        <UserAvatar
          name={presentation.title}
          media={avatarMedia}
          size="lg"
          className="ring-2 ring-white shadow-messaging-1"
        />
        <span
          className="absolute -bottom-1 -end-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-nexa-primary-soft text-nexa-primary shadow-sm"
          title={counterpartLabel}
        >
          <RoleIcon className="h-2.5 w-2.5" aria-hidden />
          <span className="sr-only">{counterpartLabel}</span>
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <p
            className={cn(
              "min-w-0 flex-1 truncate text-[14px] leading-5",
              unread
                ? "font-bold text-nexa-ink"
                : "font-semibold text-nexa-ink",
            )}
          >
            {presentation.title}
          </p>
          {timeLabel ? (
            <time
              dateTime={lastMessage.at ?? undefined}
              className="shrink-0 text-[10px] font-medium tabular-nums text-nexa-ink-4"
            >
              {timeLabel}
            </time>
          ) : null}
        </div>

        <div className="mt-0.5 flex min-w-0 items-center gap-1.5">
          <Home
            className="h-3 w-3 shrink-0 text-nexa-primary/75"
            aria-hidden
          />
          <p className="min-w-0 flex-1 truncate text-[11px] font-semibold text-nexa-ink-2">
            {presentation.listing.title}
          </p>
        </div>

        <div className="mt-1.5 flex min-w-0 items-center gap-1.5">
          {PreviewIcon ? (
            <PreviewIcon
              className="h-3.5 w-3.5 shrink-0 text-nexa-primary/75"
              aria-hidden
            />
          ) : (
            <MessageCircle
              className="h-3.5 w-3.5 shrink-0 text-nexa-ink-4/70"
              aria-hidden
            />
          )}
          <p
            className={cn(
              "min-w-0 flex-1 truncate text-[12px] leading-4",
              unread ? "font-semibold text-nexa-ink" : "text-nexa-ink-3",
            )}
          >
            {preview}
          </p>
          {unread ? (
            <span
              className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-nexa-primary px-1.5 text-[9px] font-bold text-white shadow-messaging-1"
              aria-label={`${sync.unreadCount} ${t("inbox.sections.unread")}`}
            >
              {sync.unreadCount > 99 ? "99+" : sync.unreadCount}
            </span>
          ) : null}
        </div>

        {dateRange || statusLabel ? (
          <div className="mt-2 flex min-w-0 flex-wrap items-center gap-1.5">
            {dateRange ? (
              <span className="truncate text-[10px] font-medium text-nexa-ink-4">
                {dateRange}
              </span>
            ) : null}
            {dateRange && statusLabel ? (
              <span className="text-nexa-line" aria-hidden>
                ·
              </span>
            ) : null}
            {statusLabel ? (
              <span
                className={cn(
                  "max-w-full truncate rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.07em]",
                  statusTone(statusLabel),
                )}
              >
                {statusLabel}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </Link>
  );
}

export const ConversationRow = React.memo(
  ConversationRowInner,
  (previous, next) =>
    previous.href === next.href &&
    previous.isActive === next.isActive &&
    previous.item.sync.conversationVersion ===
      next.item.sync.conversationVersion &&
    previous.item.sync.unreadCount === next.item.sync.unreadCount &&
    previous.optimistic?.at === next.optimistic?.at &&
    previous.optimistic?.preview === next.optimistic?.preview &&
    previous.item.lastMessage.preview === next.item.lastMessage.preview &&
    previous.item.lastMessage.at === next.item.lastMessage.at &&
    previous.item.presentation.title === next.item.presentation.title &&
    previous.item.presentation.listing.title ===
      next.item.presentation.listing.title &&
    previous.item.presentation.statusChip ===
      next.item.presentation.statusChip &&
    previous.item.presentation.reservation.checkinDate ===
      next.item.presentation.reservation.checkinDate &&
    previous.item.presentation.reservation.checkoutDate ===
      next.item.presentation.reservation.checkoutDate &&
    previous.item.presentation.avatar?.version ===
      next.item.presentation.avatar?.version &&
    previous.item.presentation.reservation.coverMedia?.version ===
      next.item.presentation.reservation.coverMedia?.version &&
    previous.item.conversation.visibility === next.item.conversation.visibility,
);
