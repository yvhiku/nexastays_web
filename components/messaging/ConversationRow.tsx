"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ConversationListItem } from "@/lib/messaging/messages-api";

type Props = {
  item: ConversationListItem;
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

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function ConversationRow({ item, href, optimisticAt }: Props) {
  const unread = item.unreadCount > 0;
  const preview = item.lastMessage.preview?.trim() || "—";
  const timeLabel = formatRelativeTime(item.lastMessage.at, optimisticAt);

  return (
    <Link
      href={href}
      className={cn(
        "flex items-start gap-3 px-4 py-3.5 min-h-[72px] border-b border-nexa-line/50 transition-colors",
        unread ? "bg-nexa-primary-soft/30" : "hover:bg-nexa-bg-2/80 active:bg-nexa-bg-2",
      )}
    >
      <div
        className={cn(
          "shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold border-2",
          unread
            ? "bg-nexa-primary text-white border-nexa-primary"
            : "bg-nexa-bg-2 text-nexa-primary border-nexa-primary/20",
        )}
        aria-hidden
      >
        {initials(item.counterpart.name)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <p className={cn("text-sm truncate", unread ? "font-bold text-nexa-ink" : "font-semibold text-nexa-ink")}>
            {item.counterpart.name}
          </p>
          {timeLabel ? (
            <span className="text-[11px] text-nexa-ink-4 shrink-0 tabular-nums">{timeLabel}</span>
          ) : null}
        </div>
        <p className="text-xs text-nexa-ink-4 truncate mt-0.5">{item.listing.title}</p>
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
