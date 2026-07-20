"use client";

import React from "react";
import { cn } from "@/lib/utils";
import type { UserNotificationItem } from "@/lib/notifications-api";

type Props = {
  item: UserNotificationItem;
  onClick: () => void;
  subtitle?: string;
};

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function NotificationCard({ item, onClick, subtitle }: Props) {
  const bookingId =
    typeof item.data?.booking_id === "string" ? item.data.booking_id : null;
  const line2 = subtitle ?? (bookingId ? `Booking #${bookingId.slice(0, 8).toUpperCase()}` : item.body);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full gap-3 rounded-xl px-3 py-3 text-start transition-colors",
        "hover:bg-nexa-bg-2 active:scale-[0.99]",
        !item.is_read && "bg-nexa-primary-soft/40",
      )}
    >
      <span
        className={cn(
          "mt-1.5 h-2 w-2 shrink-0 rounded-full",
          item.is_read ? "bg-transparent" : "bg-nexa-primary",
        )}
        aria-hidden
      />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-nexa-ink">{item.title}</span>
        <span className="mt-0.5 block truncate text-sm text-nexa-ink-3">{line2}</span>
        <span className="mt-1 block text-xs text-nexa-ink-4">
          {formatRelativeTime(item.created_at)}
        </span>
      </span>
    </button>
  );
}
