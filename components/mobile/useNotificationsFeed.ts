"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type UserNotificationItem,
} from "@/lib/notifications-api";
import { trackEvent } from "@/lib/analytics";
import { formatUserError } from "@/lib/errors";

export function useNotificationsFeed(open: boolean, onClose: () => void) {
  const router = useRouter();
  const { localePath } = useLanguage();
  const { isAuthenticated, token, ready } = useAuth();
  const [items, setItems] = useState<UserNotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const loadInFlightRef = useRef(false);
  const onUnreadChangeRef = useRef<((count: number) => void) | undefined>(undefined);

  const notifyUnreadCount = useCallback((list: UserNotificationItem[]) => {
    onUnreadChangeRef.current?.(list.filter((n) => !n.is_read).length);
  }, []);

  const setOnUnreadChange = useCallback((fn: (count: number) => void) => {
    onUnreadChangeRef.current = fn;
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
    onClose();
    if (actionUrl) {
      router.push(localePath(actionUrl));
    }
  };

  const hasUnread = items.some((n) => !n.is_read);

  return {
    items,
    loading,
    error,
    markingAll,
    hasUnread,
    isAuthenticated,
    handleMarkAllRead,
    handleItemClick,
    setOnUnreadChange,
  };
}
