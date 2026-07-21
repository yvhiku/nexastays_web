"use client";

import React from "react";
import Link from "next/link";
import { Bell, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { NotificationCard } from "@/components/mobile/NotificationCard";
import { Button } from "@/components/ui/button";
import type { UserNotificationItem } from "@/lib/notifications-api";

type Props = {
  items: UserNotificationItem[];
  loading: boolean;
  error: string | null;
  markingAll: boolean;
  hasUnread: boolean;
  isAuthenticated: boolean;
  onClose: () => void;
  onMarkAllRead: () => void;
  onItemClick: (item: UserNotificationItem) => void;
  listClassName?: string;
};

function NotificationListSkeleton() {
  return (
    <ul className="space-y-2 pb-2" aria-hidden>
      {[0, 1, 2].map((i) => (
        <li key={i} className="h-[72px] animate-pulse rounded-xl bg-nexa-bg-2" />
      ))}
    </ul>
  );
}

export function NotificationsPanelContent({
  items,
  loading,
  error,
  markingAll,
  hasUnread,
  isAuthenticated,
  onClose,
  onMarkAllRead,
  onItemClick,
  listClassName,
}: Props) {
  const { t, localePath } = useLanguage();

  return (
    <>
      <div className="flex items-center justify-between border-b border-nexa-line px-4 py-3">
        <h2 className="text-base font-semibold text-nexa-ink">{t("pwa.notifications")}</h2>
        <div className="flex items-center gap-2">
          {isAuthenticated && hasUnread ? (
            <button
              type="button"
              onClick={onMarkAllRead}
              disabled={markingAll}
              className="text-sm font-semibold text-nexa-primary disabled:opacity-50"
            >
              {t("pwa.notificationsMarkAllRead")}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-nexa-ink-3 hover:bg-nexa-bg-2 md:hidden"
            aria-label={t("common.close")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="px-4 py-2">
        {!isAuthenticated ? (
          <div className="flex flex-col items-center px-2 pb-4 pt-2 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-nexa-primary-soft">
              <Bell className="h-7 w-7 text-nexa-primary" aria-hidden />
            </div>
            <p className="text-base font-semibold text-nexa-ink">
              {t("pwa.notificationsSignInTitle")}
            </p>
            <p className="mt-1.5 max-w-[280px] text-sm text-nexa-ink-3">
              {t("pwa.notificationsSignInBody")}
            </p>
            <Button asChild className="mt-6 min-h-[44px] w-full max-w-xs">
              <Link href={localePath("/login")} onClick={onClose}>
                {t("common.signIn")}
              </Link>
            </Button>
          </div>
        ) : loading ? (
          <NotificationListSkeleton />
        ) : error ? (
          <p className="py-6 text-center text-sm text-red-600">{error}</p>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center px-2 pb-4 pt-6 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-nexa-primary-soft">
              <Bell className="h-7 w-7 text-nexa-primary" aria-hidden />
            </div>
            <p className="text-base font-semibold text-nexa-ink">
              {t("pwa.notificationsEmptyTitle")}
            </p>
            <p className="mt-1.5 max-w-[280px] text-sm text-nexa-ink-3">
              {t("pwa.notificationsEmptyBody")}
            </p>
          </div>
        ) : (
          <ul
            className={
              listClassName ??
              "max-h-[calc(88dvh-5rem)] divide-y divide-nexa-line overflow-y-auto md:max-h-[420px]"
            }
          >
            {items.map((item) => (
              <li key={item.id}>
                <NotificationCard item={item} onClick={() => onItemClick(item)} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
