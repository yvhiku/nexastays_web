"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  appendedMessagesAfterTail,
  evaluateInitialScrollFrame,
  INITIAL_BOTTOM_TOLERANCE_PX,
  isConversationNearBottom,
} from "@/lib/messaging/scroll-policy";
import {
  debugMessagingScroll,
  scrollGeometry,
} from "@/lib/messaging/scroll-diagnostics";

type Options = {
  conversationId: string;
  loadedConversationId?: string | null;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  messages: { id: string; conversationSequence: number }[];
  lastReadMessageId: string | null;
  onMarkRead?: () => void;
  enabled?: boolean;
};

function scrollContainerToBottom(el: HTMLElement): void {
  el.scrollTop = el.scrollHeight;
}

function distanceFromBottom(el: HTMLElement): number {
  return Math.max(0, el.scrollHeight - el.scrollTop - el.clientHeight);
}

function allowsSmoothMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** Keep pinned to bottom while timeline cards/images finish layout. */
function scrollToBottomUntilStable(
  el: HTMLElement,
  conversationId: string,
  onComplete: () => void,
): () => void {
  let observer: ResizeObserver | null = null;
  let mutationObserver: MutationObserver | null = null;
  let userInterrupted = false;
  let animationFrame = 0;
  let lastScrollHeight = -1;
  let lastClientHeight = -1;
  let stableSince = performance.now();
  let completed = false;

  const finish = (reason: "stabilized" | "interrupted" | "cleanup") => {
    if (completed) return;
    completed = true;
    cancelAnimationFrame(animationFrame);
    observer?.disconnect();
    mutationObserver?.disconnect();
    el.removeEventListener("wheel", interrupt);
    el.removeEventListener("touchstart", interrupt);
    el.removeEventListener("pointerdown", interrupt);
    debugMessagingScroll(reason, {
      routeConversationId: conversationId,
      scroll: scrollGeometry(el),
    });
    onComplete();
  };

  const interrupt = () => {
    userInterrupted = true;
    finish("interrupted");
  };

  const lockBottom = (now: number) => {
    if (completed || userInterrupted) return;

    const frame = evaluateInitialScrollFrame(
      { lastScrollHeight, lastClientHeight, stableSince },
      {
        scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight,
        distanceFromBottom: distanceFromBottom(el),
      },
      now,
    );
    ({ lastScrollHeight, lastClientHeight, stableSince } = frame.state);

    if (frame.shouldCorrect) {
      scrollContainerToBottom(el);
      debugMessagingScroll("geometry-correction", {
        routeConversationId: conversationId,
        scroll: scrollGeometry(el),
      });
    }

    if (frame.stabilized) {
      finish("stabilized");
      return;
    }

    animationFrame = requestAnimationFrame(lockBottom);
  };

  const pin = (source: "observer-resize" | "observer-mutation") => {
    if (completed || userInterrupted) return;
    stableSince = performance.now();
    if (distanceFromBottom(el) > INITIAL_BOTTOM_TOLERANCE_PX) {
      scrollContainerToBottom(el);
    }
    debugMessagingScroll(source, {
      routeConversationId: conversationId,
      scroll: scrollGeometry(el),
    });
  };

  scrollContainerToBottom(el);
  animationFrame = requestAnimationFrame(lockBottom);

  observer = new ResizeObserver(() => pin("observer-resize"));
  observer.observe(el.firstElementChild ?? el);
  mutationObserver = new MutationObserver(() => pin("observer-mutation"));
  mutationObserver.observe(el, { childList: true, subtree: true });
  el.addEventListener("wheel", interrupt, { passive: true, once: true });
  el.addEventListener("touchstart", interrupt, { passive: true, once: true });
  el.addEventListener("pointerdown", interrupt, { passive: true, once: true });

  return () => {
    finish("cleanup");
  };
}

export function useConversationScroll({
  conversationId,
  loadedConversationId = null,
  scrollRef,
  messages,
  lastReadMessageId,
  onMarkRead,
  enabled = true,
}: Options) {
  const atBottomRef = useRef(true);
  const initialScrollDone = useRef(false);
  const markReadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousTailIdRef = useRef<string | null>(null);
  const activeConversationIdRef = useRef(conversationId);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [newMessagesBelow, setNewMessagesBelow] = useState(0);

  if (activeConversationIdRef.current !== conversationId) {
    activeConversationIdRef.current = conversationId;
    initialScrollDone.current = false;
    atBottomRef.current = true;
    previousTailIdRef.current = null;
  }

  const scrollToBottom = useCallback((smooth = false) => {
    const el = scrollRef.current;
    if (!el) return;
    if (smooth && allowsSmoothMotion()) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    } else {
      scrollContainerToBottom(el);
    }
    atBottomRef.current = true;
    setIsNearBottom(true);
    setNewMessagesBelow(0);
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

  useLayoutEffect(() => {
    if (!enabled || initialScrollDone.current) return;

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
      scrollContainerToBottom(el);
      initialScrollDone.current = true;
      atBottomRef.current = true;
      setIsNearBottom(true);
      setNewMessagesBelow(0);
      debugMessagingScroll("controller-start", {
        routeConversationId: conversationId,
        loadedConversationId,
        messageCount: messages.length,
        scroll: scrollGeometry(el),
      });
      cleanupStable = scrollToBottomUntilStable(el, conversationId, () => {
        if (!cancelled) {
          atBottomRef.current = true;
          setIsNearBottom(true);
          setNewMessagesBelow(0);
        }
      });
    };

    attempt();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      cleanupStable?.();
    };
  }, [
    enabled,
    loadedConversationId,
    scrollRef,
    conversationId,
    messages.length,
  ]);

  useEffect(() => {
    const tailId = messages.at(-1)?.id ?? null;
    const previousTailId = previousTailIdRef.current;
    previousTailIdRef.current = tailId;
    if (
      !enabled ||
      !initialScrollDone.current ||
      !previousTailId ||
      !tailId ||
      previousTailId === tailId
    ) {
      return;
    }

    const appendedCount = appendedMessagesAfterTail(previousTailId, messages);
    if (appendedCount <= 0) return;

    if (atBottomRef.current) {
      requestAnimationFrame(() => scrollToBottom(true));
    } else {
      setNewMessagesBelow((count) => count + appendedCount);
    }
  }, [enabled, messages, scrollToBottom]);

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
    const nearBottom = isConversationNearBottom(distanceFromBottom(el));
    atBottomRef.current = nearBottom;
    setIsNearBottom((current) =>
      current === nearBottom ? current : nearBottom,
    );
    if (nearBottom) setNewMessagesBelow(0);
    debugMessagingScroll("user-scroll", {
      routeConversationId: conversationId,
      loadedConversationId,
      initialized: initialScrollDone.current,
      scroll: scrollGeometry(el),
    });
  }, [conversationId, loadedConversationId, scrollRef]);

  const preserveAnchorOnPrepend = useCallback((prependedHeight: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop += prependedHeight;
    atBottomRef.current = false;
    setIsNearBottom(false);
  }, [scrollRef]);

  return {
    scrollToBottom,
    scrollToFirstUnread,
    handleScroll,
    preserveAnchorOnPrepend,
    atBottomRef,
    isNearBottom,
    newMessagesBelow,
  };
}
