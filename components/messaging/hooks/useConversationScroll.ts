"use client";

import { useCallback, useEffect, useRef } from "react";

type Options = {
  scrollRef: React.RefObject<HTMLDivElement | null>;
  messages: { id: string; conversationSequence: number }[];
  lastReadMessageId: string | null;
  onMarkRead?: () => void;
  enabled?: boolean;
};

export function useConversationScroll({
  scrollRef,
  messages,
  lastReadMessageId,
  onMarkRead,
  enabled = true,
}: Options) {
  const atBottomRef = useRef(true);
  const initialScrollDone = useRef(false);
  const markReadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollToBottom = useCallback((smooth = false) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  }, [scrollRef]);

  const scrollToFirstUnread = useCallback(() => {
    const el = scrollRef.current;
    if (!el || messages.length === 0) {
      scrollToBottom(false);
      return;
    }

    if (!lastReadMessageId) {
      scrollToBottom(false);
      return;
    }

    const idx = messages.findIndex((m) => m.id === lastReadMessageId);
    if (idx < 0 || idx >= messages.length - 1) {
      scrollToBottom(false);
      return;
    }

    const targetId = messages[idx + 1]?.id;
    const node = targetId ? el.querySelector(`[data-message-id="${targetId}"]`) : null;
    if (node instanceof HTMLElement) {
      node.scrollIntoView({ block: "center" });
    } else {
      scrollToBottom(false);
    }
  }, [scrollRef, messages, lastReadMessageId, scrollToBottom]);

  useEffect(() => {
    if (!enabled || initialScrollDone.current || messages.length === 0) return;
    initialScrollDone.current = true;
    requestAnimationFrame(() => scrollToFirstUnread());
  }, [enabled, messages.length, scrollToFirstUnread]);

  useEffect(() => {
    if (!enabled || !onMarkRead) return;
    if (markReadTimer.current) clearTimeout(markReadTimer.current);
    markReadTimer.current = setTimeout(() => {
      onMarkRead();
    }, 5000);
    return () => {
      if (markReadTimer.current) clearTimeout(markReadTimer.current);
    };
  }, [enabled, messages.length, onMarkRead]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    atBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }, [scrollRef]);

  const preserveAnchorOnPrepend = useCallback((prependedHeight: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop += prependedHeight;
  }, [scrollRef]);

  return {
    scrollToBottom,
    scrollToFirstUnread,
    handleScroll,
    preserveAnchorOnPrepend,
    atBottomRef,
  };
}
