"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/avatar/UserAvatar";
import type { ConversationListResponse } from "@/lib/messaging/messages-api";

type Props = {
  item: ConversationListResponse;
  href: string;
  optimisticAt?: number | null;
};

function formatRelativeTime(iso: string | null, optimisticAt?: number | null): string {
  const ts = optimisticAt ?? (iso ? new Date(iso).getTime() : 0);
  if (!ts) return "";
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function ConversationRowInner({ item, href, optimisticAt }: Props) {
  const { presentation, sync, lastMessage } = item;
  const unread = sync.unreadCount > 0;
  const preview = lastMessage.preview?.trim() || "—";
  const timeLabel = formatRelativeTime(lastMessage.at, optimisticAt);

  return (
    <Link
      href={href}
      className={cn(
        "flex items-start gap-3 px-4 py-3.5 min-h-[72px] border-b border-nexa-line/50 transition-colors",
        unread ? "bg-nexa-primary-soft/30" : "hover:bg-nexa-bg-2/80 active:bg-nexa-bg-2",
      )}
    >
      <UserAvatar name={presentation.title} media={presentation.avatar} size="lg" />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <p className={cn("text-sm truncate", unread ? "font-bold text-nexa-ink" : "font-semibold text-nexa-ink")}>
            {presentation.title}
          </p>
          {timeLabel ? (
            <span className="text-[11px] text-nexa-ink-4 shrink-0 tabular-nums">{timeLabel}</span>
          ) : null}
        </div>
        <p className="text-xs text-nexa-ink-4 truncate mt-0.5">{presentation.listing.title}</p>
        <p className={cn("text-sm truncate mt-1", unread ? "text-nexa-ink font-medium" : "text-nexa-ink-3")}>
          {preview}
        </p>
      </div>
      {unread ? (
        <span className="shrink-0 mt-1 h-2.5 w-2.5 rounded-full bg-nexa-primary" aria-label="Unread" />
      ) : null}
    </Link>
  );
}

export const ConversationRow = React.memo(
  ConversationRowInner,
  (prev, next) =>
    prev.href === next.href &&
    prev.optimisticAt === next.optimisticAt &&
    prev.item.sync.conversationVersion === next.item.sync.conversationVersion &&
    prev.item.sync.unreadCount === next.item.sync.unreadCount &&
    prev.item.lastMessage.at === next.item.lastMessage.at &&
    prev.item.presentation.title === next.item.presentation.title,
);
