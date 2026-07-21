"use client";

import { useCallback, useEffect, useRef } from "react";

type Options = {
  conversationId: string;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  messages: { id: string; conversationSequence: number }[];
  lastReadMessageId: string | null;
  onMarkRead?: () => void;
  enabled?: boolean;
};

function scrollContainerToBottom(el: HTMLElement): void {
  el.scrollTop = el.scrollHeight;
}

/** Keep pinned to bottom while timeline cards/images finish layout. */
function scrollToBottomUntilStable(
  el: HTMLElement,
  onComplete: () => void,
): () => void {
  scrollContainerToBottom(el);

  let stableTimer: ReturnType<typeof setTimeout> | null = null;
  let maxTimer: ReturnType<typeof setTimeout> | null = null;
  let observer: ResizeObserver | null = null;

  const pin = () => {
    scrollContainerToBottom(el);
    if (stableTimer) clearTimeout(stableTimer);
    stableTimer = setTimeout(() => {
      scrollContainerToBottom(el);
      observer?.disconnect();
      onComplete();
    }, 120);
  };

  const raf = requestAnimationFrame(pin);

  observer = new ResizeObserver(pin);
  observer.observe(el);

  maxTimer = setTimeout(() => {
    scrollContainerToBottom(el);
    observer?.disconnect();
    onComplete();
  }, 2500);

  return () => {
    cancelAnimationFrame(raf);
    observer?.disconnect();
    if (stableTimer) clearTimeout(stableTimer);
    if (maxTimer) clearTimeout(maxTimer);
  };
}

export function useConversationScroll({
  conversationId,
  scrollRef,
  messages,
  lastReadMessageId,
  onMarkRead,
  enabled = true,
}: Options) {
  const atBottomRef = useRef(true);
  const initialScrollDone = useRef(false);
  const markReadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    initialScrollDone.current = false;
    atBottomRef.current = true;
  }, [conversationId]);

  const scrollToBottom = useCallback((smooth = false) => {
    const el = scrollRef.current;
    if (!el) return;
    if (smooth) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    } else {
      scrollContainerToBottom(el);
    }
    atBottomRef.current = true;
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
      atBottomRef.current = false;
    } else {
      scrollToBottom(false);
    }
  }, [scrollRef, messages, lastReadMessageId, scrollToBottom]);

  useEffect(() => {
    if (!enabled || initialScrollDone.current || messages.length === 0) return;

    let cancelled = false;
    let cleanupStable: (() => void) | undefined;
    let raf = 0;

    const attempt = () => {
      if (cancelled || initialScrollDone.current) return;
      const el = scrollRef.current;
      if (!el) {
        raf = requestAnimationFrame(attempt);
        return;
      }
      cleanupStable = scrollToBottomUntilStable(el, () => {
        if (!cancelled) {
          initialScrollDone.current = true;
          atBottomRef.current = true;
        }
      });
    };

    attempt();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      cleanupStable?.();
    };
  }, [enabled, messages.length, scrollRef, conversationId]);

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
    atBottomRef.current = false;
  }, [scrollRef]);

  return {
    scrollToBottom,
    scrollToFirstUnread,
    handleScroll,
    preserveAnchorOnPrepend,
    atBottomRef,
  };
}
