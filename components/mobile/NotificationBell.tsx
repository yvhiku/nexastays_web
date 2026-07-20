"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { NotificationsSheet } from "@/components/mobile/NotificationsSheet";
import { getUnreadNotificationCount } from "@/lib/notifications-api";

type Props = {
  className?: string;
};

function formatBadge(count: number): string {
  if (count <= 0) return "";
  if (count > 99) return "99+";
  return String(count);
}

/** Mobile header bell — opens notifications bottom sheet with unread badge. */
export function NotificationBell({ className }: Props) {
  const { t } = useLanguage();
  const { isAuthenticated, token, ready } = useAuth();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  const refreshUnread = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setUnread(0);
      return;
    }
    try {
      const count = await getUnreadNotificationCount(token);
      setUnread(count);
    } catch {
      /* keep last known count */
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    if (ready && isAuthenticated && token) {
      void refreshUnread();
    } else if (ready) {
      setUnread(0);
    }
  }, [ready, isAuthenticated, token, refreshUnread]);

  const badge = formatBadge(unread);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "relative md:hidden flex items-center justify-center w-11 h-11 rounded-lg text-nexa-ink-3 hover:bg-nexa-bg-2 active:scale-95",
          className,
        )}
        aria-label={t("pwa.notifications")}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />
        {badge ? (
          <span
            className="absolute -top-0.5 -end-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-nexa-primary px-1 text-[10px] font-bold leading-none text-white transition-transform"
            aria-hidden
          >
            {badge}
          </span>
        ) : null}
      </button>
      <NotificationsSheet
        open={open}
        onOpenChange={setOpen}
        onUnreadChange={setUnread}
      />
    </>
  );
}
