"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { BottomSheet } from "@/components/mobile/BottomSheet";
import { NotificationsPanelContent } from "@/components/mobile/NotificationsPanelContent";
import { useNotificationsFeed } from "@/components/mobile/useNotificationsFeed";
import { useHeaderState } from "@/components/navbar/HeaderStateProvider.client";

type Props = {
  className?: string;
};

function formatBadge(count: number): string {
  if (count <= 0) return "";
  if (count > 99) return "99+";
  return String(count);
}

/** Header notifications bell — bottom sheet on mobile, dropdown on desktop. */
export function NotificationBell({ className }: Props) {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const { notificationCount, refresh } = useHeaderState();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const feed = useNotificationsFeed(open, () => setOpen(false));

  const handleUnreadChange = useCallback(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    feed.setOnUnreadChange(handleUnreadChange);
  }, [handleUnreadChange, feed.setOnUnreadChange]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("click", handleClickOutside);
    }
    return () => document.removeEventListener("click", handleClickOutside);
  }, [open]);

  const badge = formatBadge(notificationCount);
  const panel = (
    <NotificationsPanelContent
      items={feed.items}
      loading={feed.loading}
      error={feed.error}
      markingAll={feed.markingAll}
      hasUnread={feed.hasUnread}
      isAuthenticated={feed.isAuthenticated}
      onClose={() => setOpen(false)}
      onMarkAllRead={() => void feed.handleMarkAllRead()}
      onItemClick={(item) => void feed.handleItemClick(item)}
    />
  );

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "relative flex h-10 w-10 items-center justify-center rounded-lg text-nexa-ink-3 transition-colors hover:bg-nexa-bg-2 hover:text-nexa-primary active:scale-95",
          className,
        )}
        aria-label={t("pwa.notifications")}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />
        {isAuthenticated && badge ? (
          <span
            className="absolute -end-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-nexa-primary px-1 text-[10px] font-bold leading-none text-white"
            aria-hidden
          >
            {badge}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute end-0 top-full z-50 mt-2 hidden w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-nexa-line bg-white shadow-lg md:block">
          {panel}
        </div>
      ) : null}

      <BottomSheet
        open={open}
        onOpenChange={setOpen}
        ariaLabel={t("pwa.notifications")}
        zIndexClassName="z-[80]"
        height="full"
        padded={false}
        contentClassName="max-h-[88dvh]"
      >
        <div className="pb-[max(1rem,env(safe-area-inset-bottom))]">{panel}</div>
      </BottomSheet>
    </div>
  );
}
