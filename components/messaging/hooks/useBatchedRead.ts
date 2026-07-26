"use client";

import { useCallback, useEffect, useRef } from "react";
import { markConversationRead } from "@/lib/messaging/messages-api";

const MIN_INTERVAL_MS = 1_000;

export function useBatchedRead(
  conversationId: string | null,
  token: string | null,
  enabled = true,
  onRead?: () => void,
) {
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef(false);
  const lastSentAt = useRef(0);
  const flushing = useRef(false);

  const clearTimers = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
  }, []);

  const onReadRef = useRef(onRead);
  onReadRef.current = onRead;

  const flush = useCallback(async () => {
    if (!conversationId || !token || !pending.current || flushing.current) return;

    flushing.current = true;
    pending.current = false;
    clearTimers();
    try {
      await markConversationRead(conversationId, token);
      lastSentAt.current = Date.now();
      onReadRef.current?.();
    } catch {
      pending.current = true;
    } finally {
      flushing.current = false;
      if (pending.current) {
        const remaining = Math.max(
          0,
          MIN_INTERVAL_MS - (Date.now() - lastSentAt.current),
        );
        debounceTimer.current = setTimeout(() => {
          void flush();
        }, remaining);
      }
    }
  }, [conversationId, token, clearTimers]);

  const scheduleRead = useCallback(() => {
    if (!enabled || !conversationId || !token) return;
    pending.current = true;

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    const remaining = Math.max(
      0,
      MIN_INTERVAL_MS - (Date.now() - lastSentAt.current),
    );
    if (!flushing.current && remaining === 0) {
      void flush();
      return;
    }
    debounceTimer.current = setTimeout(() => {
      void flush();
    }, remaining);
  }, [conversationId, token, enabled, flush]);

  useEffect(() => {
    pending.current = false;
    lastSentAt.current = 0;
    clearTimers();
    return () => {
      void flush();
      clearTimers();
    };
  }, [conversationId, flush, clearTimers]);

  return { scheduleRead, flushRead: flush };
}
