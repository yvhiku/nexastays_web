"use client";

import { useCallback, useEffect, useRef } from "react";
import { markConversationRead } from "@/lib/messaging/messages-api";

const DEBOUNCE_MS = 5_000;
const MAX_INTERVAL_MS = 15_000;

export function useBatchedRead(
  conversationId: string | null,
  token: string | null,
  enabled = true,
  onRead?: () => void,
) {
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef(false);
  const lastSentAt = useRef(0);
  const flushing = useRef(false);

  const clearTimers = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    if (maxTimer.current) {
      clearTimeout(maxTimer.current);
      maxTimer.current = null;
    }
  }, []);

  const onReadRef = useRef(onRead);
  onReadRef.current = onRead;

  const flush = useCallback(async () => {
    if (!conversationId || !token || !pending.current || flushing.current) return;
    const now = Date.now();
    if (now - lastSentAt.current < MAX_INTERVAL_MS) return;

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
    }
  }, [conversationId, token, clearTimers]);

  const scheduleRead = useCallback(() => {
    if (!enabled || !conversationId || !token) return;
    pending.current = true;

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      void flush();
    }, DEBOUNCE_MS);

    if (!maxTimer.current) {
      maxTimer.current = setTimeout(() => {
        void flush();
      }, MAX_INTERVAL_MS);
    }
  }, [conversationId, token, enabled, flush]);

  useEffect(() => {
    return () => {
      void flush();
      clearTimers();
    };
  }, [conversationId, flush, clearTimers]);

  return { scheduleRead, flushRead: flush };
}
