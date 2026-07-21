"use client";

import React, { useEffect } from "react";
import { BottomSheet } from "@/components/mobile/BottomSheet";
import { NotificationsPanelContent } from "@/components/mobile/NotificationsPanelContent";
import { useNotificationsFeed } from "@/components/mobile/useNotificationsFeed";
import { useLanguage } from "@/contexts/LanguageContext";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUnreadChange?: (count: number) => void;
};

export function NotificationsSheet({ open, onOpenChange, onUnreadChange }: Props) {
  const { t } = useLanguage();
  const feed = useNotificationsFeed(open, () => onOpenChange(false));

  useEffect(() => {
    if (onUnreadChange) {
      feed.setOnUnreadChange(onUnreadChange);
    }
  }, [onUnreadChange, feed.setOnUnreadChange]);

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      ariaLabel={t("pwa.notifications")}
      zIndexClassName="z-[80]"
      height="full"
      padded={false}
      contentClassName="max-h-[88dvh]"
    >
      <div className="pb-[max(1rem,env(safe-area-inset-bottom))]">
        <NotificationsPanelContent
          items={feed.items}
          loading={feed.loading}
          error={feed.error}
          markingAll={feed.markingAll}
          hasUnread={feed.hasUnread}
          isAuthenticated={feed.isAuthenticated}
          onClose={() => onOpenChange(false)}
          onMarkAllRead={() => void feed.handleMarkAllRead()}
          onItemClick={(item) => void feed.handleItemClick(item)}
        />
      </div>
    </BottomSheet>
  );
}
