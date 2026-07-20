"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getUnreadConversationCount } from "@/lib/messaging/messages-api";
import { useMessagingRealtime } from "@/components/messaging/hooks/useMessagingRealtime";

type Props = {
  className?: string;
};

function formatBadge(count: number): string {
  if (count <= 0) return "";
  if (count > 99) return "99+";
  return String(count);
}

/** Header inbox icon with unread badge — links to inbox page. */
export function InboxBell({ className }: Props) {
  const { t, localePath } = useLanguage();
  const { isAuthenticated, token, ready } = useAuth();
  const [unread, setUnread] = useState(0);

  const refreshUnread = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setUnread(0);
      return;
    }
    try {
      const count = await getUnreadConversationCount(token);
      setUnread(count);
    } catch {
      /* keep last known */
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    if (ready && isAuthenticated && token) {
      void refreshUnread();
    } else if (ready) {
      setUnread(0);
    }
  }, [ready, isAuthenticated, token, refreshUnread]);

  useMessagingRealtime("inbox", refreshUnread, ready && isAuthenticated && !!token);

  const badge = formatBadge(unread);

  if (!isAuthenticated) return null;

  return (
    <Link
      href={localePath("/inbox")}
      className={cn(
        "relative md:hidden flex items-center justify-center w-11 h-11 rounded-lg text-nexa-ink-3 hover:bg-nexa-bg-2 active:scale-95",
        className,
      )}
      aria-label={t("inbox.title")}
    >
      <MessageCircle className="h-5 w-5" />
      {badge ? (
        <span
          className="absolute -top-0.5 -end-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-nexa-primary px-1 text-[10px] font-bold leading-none text-white"
          aria-hidden
        >
          {badge}
        </span>
      ) : null}
    </Link>
  );
}
