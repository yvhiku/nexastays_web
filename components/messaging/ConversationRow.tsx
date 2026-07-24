"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/avatar/UserAvatar";
import type { ConversationListResponse } from "@/lib/messaging/messages-api";
import { resolveInboxPreview, type OptimisticInboxEntry } from "@/lib/messaging/inbox-optimistic";
import { resolveRoleAwareInboxPreview } from "@/lib/messaging/inbox-preview";

type Props = {
  item: ConversationListResponse;
  href: string;
  optimistic?: OptimisticInboxEntry | null;
  isActive?: boolean;
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

function ConversationRowInner({ item, href, optimistic, isActive = false }: Props) {
  const { presentation, sync, lastMessage, permissions } = item;
  const unread = sync.unreadCount > 0;
  const viewerRole =
    permissions.viewerRole ?? (permissions.canReview ? "guest" : "host");
  const preview = resolveRoleAwareInboxPreview(
    resolveInboxPreview(lastMessage.preview, lastMessage.at, optimistic),
    viewerRole,
  );
  const timeLabel = formatRelativeTime(lastMessage.at, optimistic?.at ?? null);

  return (
    <Link
      href={href}
      data-conversation-row
      className={cn(
        "group mx-2 flex min-h-[64px] items-center gap-2.5 rounded-2xl border px-2.5 py-2 transition-[background-color,border-color,box-shadow,transform] duration-200 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-nexa-primary/50",
        isActive
          ? "border-nexa-primary/20 bg-[linear-gradient(135deg,#fff_0%,#fdf0f3_100%)] shadow-[inset_3px_0_0_#E8507A,0_8px_22px_rgba(232,80,122,0.10)]"
          : unread
            ? "border-nexa-primary/10 bg-[#fff9fb] shadow-[0_3px_12px_rgba(232,80,122,0.055)] hover:-translate-y-px hover:border-nexa-primary/20 hover:shadow-nexa-sm"
            : "border-transparent bg-transparent hover:-translate-y-px hover:border-nexa-line/70 hover:bg-white hover:shadow-nexa-card active:translate-y-0",
      )}
    >
      <UserAvatar name={presentation.title} media={presentation.avatar} size="md" className="ring-2 ring-white shadow-[0_3px_12px_rgba(90,45,66,0.14)]" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className={cn("min-w-0 flex-1 truncate text-[13px]", unread ? "font-bold text-nexa-ink" : "font-semibold text-nexa-ink")}>
            {presentation.title}
          </p>
          {presentation.statusChip ? (
            <span className="max-w-16 shrink-0 truncate rounded-full bg-nexa-primary-soft px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-nexa-primary">
              {presentation.statusChip}
            </span>
          ) : null}
          {timeLabel ? (
            <span className="shrink-0 text-[10px] tabular-nums text-nexa-ink-4">{timeLabel}</span>
          ) : null}
          {unread ? (
            <span className="flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#f4809a,#e8507a)] px-1 text-[9px] font-bold text-white shadow-[0_2px_7px_rgba(232,80,122,0.32)]" aria-label={`${sync.unreadCount} unread`}>
              {sync.unreadCount > 99 ? "99+" : sync.unreadCount}
            </span>
          ) : null}
        </div>
        <div className="mt-1 flex min-w-0 items-center gap-1 text-xs">
          <span className="max-w-[42%] shrink-0 truncate font-medium text-nexa-ink-3">
            {presentation.listing.title}
          </span>
          <span className="text-nexa-ink-4" aria-hidden>·</span>
          <span className={cn("min-w-0 flex-1 truncate", unread ? "font-medium text-nexa-ink" : "text-nexa-ink-4")}>
            {preview}
          </span>
        </div>
      </div>
    </Link>
  );
}

export const ConversationRow = React.memo(
  ConversationRowInner,
  (prev, next) =>
    prev.href === next.href &&
    prev.isActive === next.isActive &&
    prev.item.sync.conversationVersion === next.item.sync.conversationVersion &&
    prev.item.sync.unreadCount === next.item.sync.unreadCount &&
    prev.optimistic?.at === next.optimistic?.at &&
    prev.optimistic?.preview === next.optimistic?.preview &&
    prev.item.lastMessage.preview === next.item.lastMessage.preview &&
    prev.item.lastMessage.at === next.item.lastMessage.at &&
    prev.item.presentation.title === next.item.presentation.title &&
    prev.item.presentation.listing.title === next.item.presentation.listing.title &&
    prev.item.presentation.statusChip === next.item.presentation.statusChip,
);
