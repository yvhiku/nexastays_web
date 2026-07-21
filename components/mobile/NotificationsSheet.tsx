"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { BottomSheet } from "@/components/mobile/BottomSheet";
import { SheetHeader } from "@/components/mobile/SheetHeader";
import { NotificationCard } from "@/components/mobile/NotificationCard";
import { Button } from "@/components/ui/button";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type UserNotificationItem,
} from "@/lib/notifications-api";
import { trackEvent } from "@/lib/analytics";
import { formatUserError } from "@/lib/errors";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUnreadChange?: (count: number) => void;
};

function NotificationListSkeleton() {
  return (
    <ul className="space-y-2 pb-2" aria-hidden>
      {[0, 1, 2].map((i) => (
        <li key={i} className="animate-pulse rounded-xl bg-nexa-bg-2 h-[72px]" />
      ))}
    </ul>
  );
}

export function NotificationsSheet({ open, onOpenChange, onUnreadChange }: Props) {
  const router = useRouter();
  const { t, localePath } = useLanguage();
  const { isAuthenticated, token, ready } = useAuth();
  const [items, setItems] = useState<UserNotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const onUnreadChangeRef = useRef(onUnreadChange);
  const loadInFlightRef = useRef(false);

  useEffect(() => {
    onUnreadChangeRef.current = onUnreadChange;
  }, [onUnreadChange]);

  const notifyUnreadCount = useCallback((list: UserNotificationItem[]) => {
    onUnreadChangeRef.current?.(list.filter((n) => !n.is_read).length);
  }, []);

  const load = useCallback(async () => {
    if (!token || loadInFlightRef.current) return;
    loadInFlightRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const data = await getNotifications(token, 20);
      setItems(data);
      notifyUnreadCount(data);
    } catch (e) {
      setError(formatUserError(e));
    } finally {
      loadInFlightRef.current = false;
      setLoading(false);
    }
  }, [token, notifyUnreadCount]);

  useEffect(() => {
    if (open && isAuthenticated && ready && token) {
      trackEvent("notification_opened");
      void load();
    }
  }, [open, isAuthenticated, ready, token, load]);

  const handleMarkAllRead = async () => {
    if (!token || markingAll) return;
    setMarkingAll(true);
    try {
      await markAllNotificationsRead(token);
      trackEvent("notification_mark_all_read");
      const next = items.map((n) => ({
        ...n,
        is_read: true,
        read_at: n.read_at ?? new Date().toISOString(),
      }));
      setItems(next);
      onUnreadChangeRef.current?.(0);
    } catch (e) {
      setError(formatUserError(e));
    } finally {
      setMarkingAll(false);
    }
  };

  const handleItemClick = async (item: UserNotificationItem) => {
    const actionUrl =
      typeof item.data?.action_url === "string" ? item.data.action_url : null;
    trackEvent("notification_clicked", {
      notification_id: item.id,
      type: item.type,
    });
    if (!item.is_read && token) {
      try {
        await markNotificationRead(item.id, token);
        trackEvent("notification_mark_read", { notification_id: item.id });
        setItems((prev) => {
          const next = prev.map((n) =>
            n.id === item.id
              ? { ...n, is_read: true, read_at: new Date().toISOString() }
              : n,
          );
          onUnreadChangeRef.current?.(next.filter((n) => !n.is_read).length);
          return next;
        });
      } catch {
        /* navigation still proceeds */
      }
    }
    onOpenChange(false);
    if (actionUrl) {
      router.push(localePath(actionUrl));
    }
  };

  const hasUnread = items.some((n) => !n.is_read);

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
      <div className="px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <SheetHeader
          title={t("pwa.notifications")}
          onClose={() => onOpenChange(false)}
          action={
            isAuthenticated && hasUnread ? (
              <button
                type="button"
                onClick={() => void handleMarkAllRead()}
                disabled={markingAll}
                className="text-sm font-semibold text-nexa-primary disabled:opacity-50"
              >
                {t("pwa.notificationsMarkAllRead")}
              </button>
            ) : undefined
          }
        />

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
              <Link href={localePath("/login")} onClick={() => onOpenChange(false)}>
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
          <ul className="divide-y divide-nexa-line overflow-y-auto max-h-[calc(88dvh-5rem)]">
            {items.map((item) => (
              <li key={item.id}>
                <NotificationCard item={item} onClick={() => void handleItemClick(item)} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </BottomSheet>
  );
}
