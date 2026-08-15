"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ErrorAlert } from "@/components/ui/Alert";
import { ArchivedThreadBanner } from "@/components/messaging/ArchivedThreadBanner";
import { AttachmentComposer } from "@/components/messaging/AttachmentComposer";
import { AttachmentDraftPrompt } from "@/components/messaging/AttachmentDraftPrompt";
import { ConversationSearchSheet } from "@/components/messaging/ConversationSearchSheet";
import { useAttachmentManager } from "@/lib/messaging/AttachmentManager";
import { loadAttachmentDraft, clearAttachmentDraft } from "@/lib/messaging/attachment-drafts-db";
import { shouldRefreshAttachments } from "@/lib/messaging/attachment-sync";
import { ConversationHeader } from "@/components/messaging/ConversationHeader";
import { MessageComposer } from "@/components/messaging/MessageComposer";
import { SupportCsatPrompt } from "@/components/messaging/SupportCsatPrompt";
import { TimelineRenderer } from "@/components/messaging/TimelineRenderer";
import { useBatchedRead } from "@/components/messaging/hooks/useBatchedRead";
import { useConversationDraft } from "@/components/messaging/hooks/useConversationDraft";
import { useConversationScroll } from "@/components/messaging/hooks/useConversationScroll";
import { useTransientScrollDate } from "@/components/messaging/hooks/useTransientScrollDate";
import { useMessagingRealtime } from "@/components/messaging/hooks/useMessagingRealtime";
import {
  isConversationMuted,
  setConversationMuted,
} from "@/components/messaging/ConversationMenu";
import { ReportConversationSheet } from "@/components/messaging/report/ReportConversationSheet";
import { SafetyIssueSheet } from "@/components/messaging/report/SafetyIssueSheet";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  getConversation,
  listMessages,
  sendMessage,
  type ConversationDetail,
  type MessageDto,
} from "@/lib/messaging/messages-api";
import {
  mergeMessages,
  reconcileOptimisticMessage,
  patchOptimisticByClientId,
} from "@/lib/messaging/selectors/reconcile-messages";
import {
  buildOptimisticMessage,
  createClientMessageId,
  enqueueOffline,
  flushOfflineQueue,
  isOnline,
} from "@/lib/messaging/offline-queue";
import { shouldFetchAfterPush } from "@/lib/messaging/push-sync";
import { formatUserError, isClosedSupportConflict } from "@/lib/errors";
import { trackEvent } from "@/lib/analytics";
import { setOptimisticInboxActivity, clearOptimisticInboxActivity } from "@/lib/messaging/inbox-optimistic";
import { BookingContextStrip } from "@/components/messaging/BookingContextStrip";
import { CheckInWelcomeBanner } from "@/components/messaging/timeline/CheckInWelcomeBanner";
import { ConversationSummary } from "@/components/messaging/ConversationSummary";
import { AttachmentRail } from "@/components/messaging/AttachmentRail";
import { DraftRecovery } from "@/components/messaging/DraftRecovery";
import { executeCardAction, type CardAction } from "@/lib/messaging/actions/registry";
import { getCardPayload } from "@/lib/messaging/message-payload";
import {
  ConversationSkeleton,
  ContextPanelSkeleton,
} from "@/components/messaging/MessagingStates";
import { BottomSheet } from "@/components/mobile/BottomSheet";
import { OverlayPortal } from "@/components/ui/OverlayPortal";
import { PanelRightOpen, WifiOff } from "lucide-react";
import { useFocusTrap } from "@/components/messaging/hooks/useFocusTrap";
import { NewMessagesIndicator } from "@/components/messaging/NewMessagesIndicator";
import {
  MESSAGING_EASE_OUT,
  MESSAGING_MOTION,
} from "@/lib/messaging/motion";
import {
  endMessagingMeasure,
  startMessagingMeasure,
} from "@/lib/messaging/performance";
import { inboxBasePathFromPathname } from "@/lib/messaging/thread-routes";
import { BookingJourney } from "@/components/messaging/hospitality/BookingJourney";
import { deriveJourneyIndex } from "@/components/messaging/hospitality/journey";
import { ConversationWelcomeCard } from "@/components/messaging/polish/ConversationWelcomeCard";
import { ContextualTip } from "@/components/messaging/polish/ContextualTip";
import { ConversationThemeProvider } from "@/components/messaging/polish/ConversationThemeProvider";
import {
  isConversationScrollReady,
  isCurrentConversationResponse,
  sortConversationMessages,
} from "@/lib/messaging/conversation-session";
import {
  debugMessagingScroll,
  scrollGeometry,
} from "@/lib/messaging/scroll-diagnostics";

const MediaGallery = dynamic(
  () => import("@/components/messaging/ImageViewer").then((module) => module.MediaGallery),
  { ssr: false },
);

const MessagingContextPanel = dynamic(
  () =>
    import("@/components/messaging/MessagingContextPanel").then(
      (module) => module.MessagingContextPanel,
    ),
  {
    ssr: false,
    loading: () => <ContextPanelSkeleton />,
  },
);

function TabletContextDrawer({
  open,
  ariaLabel,
  closeLabel,
  onClose,
  children,
}: {
  open: boolean;
  ariaLabel: string;
  closeLabel: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { isRtl } = useLanguage();
  useFocusTrap(open, ref);
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          ref={ref}
          className="fixed inset-0 hidden overflow-hidden md:block min-[1400px]:hidden"
          role="dialog"
          aria-modal="true"
          aria-label={ariaLabel}
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : MESSAGING_MOTION.panel }}
        >
          <button
            type="button"
            tabIndex={-1}
            className="absolute inset-0 bg-nexa-ink/30 backdrop-blur-sm"
            onClick={onClose}
            aria-label={closeLabel}
          />
          <motion.div
            initial={reduceMotion ? false : { x: isRtl ? "-100%" : "100%" }}
            animate={{ x: 0 }}
            exit={{ x: isRtl ? "-100%" : "100%" }}
            transition={{
              duration: reduceMotion ? 0 : MESSAGING_MOTION.panel,
              ease: MESSAGING_EASE_OUT,
            }}
            className="absolute inset-y-0 end-0 w-[min(380px,calc(100vw-48px))] max-w-full shadow-2xl"
          >
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function ConversationPageInner() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const conversationId = params.id as string;
  const { token, user } = useAuth();
  const { t, locale, localePath } = useLanguage();
  const reduceMotion = useReducedMotion();
  const inboxBase = inboxBasePathFromPathname(pathname);

  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [loadedConversationId, setLoadedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [online, setOnline] = useState(true);
  const [muted, setMuted] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [safetyOpen, setSafetyOpen] = useState(false);
  const [headerCompact, setHeaderCompact] = useState(false);
  const [contextCollapsed, setContextCollapsed] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);
  const [mobileContext, setMobileContext] = useState(false);
  const [contextWidth, setContextWidth] = useState(310);
  const [gallery, setGallery] = useState<{ attachments: MessageDto["attachments"]; index: number } | null>(null);
  const [draftPrompt, setDraftPrompt] = useState<{ fileCount: number } | null>(null);
  const [screenReaderAnnouncement, setScreenReaderAnnouncement] = useState("");
  const photoInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const threadWorkspaceRef = useRef<HTMLDivElement>(null);
  const contextTriggerRef = useRef<HTMLElement | null>(null);
  const galleryTriggerRef = useRef<HTMLElement | null>(null);
  const announcedTailRef = useRef<string | null>(null);
  const activeRouteConversationIdRef = useRef(conversationId);
  const conversationRequestSequenceRef = useRef(0);
  activeRouteConversationIdRef.current = conversationId;

  const jumpToMessage = useCallback((messageId: string) => {
    const node = scrollRef.current?.querySelector(`[data-message-id="${messageId}"]`);
    if (node instanceof HTMLElement) {
      node.scrollIntoView({ behavior: "smooth", block: "center" });
      node.classList.add("ring-2", "ring-nexa-primary/40", "rounded-xl");
      window.setTimeout(
        () =>
          node.classList.remove(
            "ring-2",
            "ring-nexa-primary/40",
            "rounded-xl",
          ),
        900,
      );
    } else {
      window.dispatchEvent(
        new CustomEvent("nexa:timeline-jump", { detail: messageId }),
      );
    }
  }, []);

  const { draft, updateDraft, discardDraft, ready: draftReady } = useConversationDraft(conversationId);
  const [showDraftRecovery, setShowDraftRecovery] = useState(false);
  const draftRecoveryCheckedRef = useRef(false);
  useEffect(() => {
    draftRecoveryCheckedRef.current = false;
    setShowDraftRecovery(false);
  }, [conversationId]);
  useEffect(() => {
    if (!draftReady || draftRecoveryCheckedRef.current) return;
    draftRecoveryCheckedRef.current = true;
    setShowDraftRecovery(Boolean(draft.trim()));
  }, [draft, draftReady]);

  const { scheduleRead } = useBatchedRead(
    conversationId,
    token,
    conversation?.conversation.id === conversationId,
    () => trackEvent("message_read", { conversation_id: conversationId }),
  );
  const scheduleReadRef = useRef(scheduleRead);
  scheduleReadRef.current = scheduleRead;

  useEffect(() => {
    if (conversation?.conversation.id !== conversationId) return;
    scheduleReadRef.current();
  }, [conversation?.conversation.id, conversationId]);

  const scrollInitializationReady = isConversationScrollReady({
    routeConversationId: conversationId,
    loadedConversationId,
    renderedConversationId: conversation?.conversation.id ?? null,
    loading,
    messageConversationIds: messages.map((message) => message.conversationId),
  });
  const {
    handleScroll,
    scrollToBottom,
    preserveAnchorOnPrepend,
    atBottomRef,
    newMessagesBelow,
  } =
    useConversationScroll({
      conversationId,
      scrollRef,
      messages,
      lastReadMessageId: conversation?.sync.lastReadPointer.messageId ?? null,
      onMarkRead: scheduleRead,
      enabled: scrollInitializationReady,
      loadedConversationId,
    });
  const {
    label: scrollDateLabel,
    visible: scrollDateVisible,
    onScrollActivity: updateScrollDate,
  } = useTransientScrollDate({ conversationId, scrollRef });

  useEffect(() => {
    setMuted(isConversationMuted(conversationId));
  }, [conversationId]);

  useEffect(() => {
    const syncOnlineState = () => setOnline(navigator.onLine);
    syncOnlineState();
    window.addEventListener("online", syncOnlineState);
    window.addEventListener("offline", syncOnlineState);
    return () => {
      window.removeEventListener("online", syncOnlineState);
      window.removeEventListener("offline", syncOnlineState);
    };
  }, []);

  useEffect(() => {
    const syncResponsiveOverlays = () => {
      const width = window.innerWidth;
      if (width >= 1400) {
        setContextOpen(false);
        return;
      }
      setMobileContext(width < 768);
    };
    syncResponsiveOverlays();
    window.addEventListener("resize", syncResponsiveOverlays);
    return () => window.removeEventListener("resize", syncResponsiveOverlays);
  }, []);

  useEffect(() => {
    const storedWidth = Number(localStorage.getItem("nexa_messaging_context_width"));
    const storedCollapsed = localStorage.getItem("nexa_messaging_context_collapsed");
    if (Number.isFinite(storedWidth) && storedWidth >= 280 && storedWidth <= 320) {
      setContextWidth(storedWidth);
    } else {
      setContextWidth(310);
    }
    setContextCollapsed(storedCollapsed === "1");
  }, []);

  const maximumContextWidth = useCallback(() => {
    const workspaceWidth =
      threadWorkspaceRef.current?.getBoundingClientRect().width ??
      (typeof window === "undefined" ? 1143 : window.innerWidth);
    return Math.max(280, Math.min(320, Math.floor(workspaceWidth * 0.24)));
  }, []);

  useEffect(() => {
    const keepConversationDominant = () => {
      setContextWidth((width) => Math.min(width, maximumContextWidth()));
    };
    keepConversationDominant();
    window.addEventListener("resize", keepConversationDominant);
    return () => window.removeEventListener("resize", keepConversationDominant);
  }, [maximumContextWidth]);

  const setDesktopContextCollapsed = (collapsed: boolean) => {
    setContextCollapsed(collapsed);
    localStorage.setItem("nexa_messaging_context_collapsed", collapsed ? "1" : "0");
  };

  const openContext = () => {
    if (window.matchMedia("(min-width: 1024px)").matches) {
      setDesktopContextCollapsed(false);
      return;
    }
    contextTriggerRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setMobileContext(window.matchMedia("(max-width: 767px)").matches);
    setContextOpen(true);
  };

  const setResponsiveContextOpen = useCallback((open: boolean) => {
    setContextOpen(open);
    if (!open) {
      requestAnimationFrame(() => contextTriggerRef.current?.focus());
    }
  }, []);

  const navigateBackToInbox = useCallback(() => {
    router.push(localePath(inboxBase));
  }, [inboxBase, localePath, router]);

  useEffect(() => {
    if (!contextOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setResponsiveContextOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [contextOpen, setResponsiveContextOpen]);

  const startContextResize = (event: React.PointerEvent<HTMLDivElement>) => {
    const startX = event.clientX;
    const startWidth = contextWidth;
    const rtl = document.documentElement.dir === "rtl";
    let frame: number | null = null;
    let latestX = startX;
    const onMove = (moveEvent: PointerEvent) => {
      latestX = moveEvent.clientX;
      if (frame !== null) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        const movement = latestX - startX;
        const next = Math.min(
          maximumContextWidth(),
          Math.max(280, startWidth + (rtl ? movement : -movement)),
        );
        setContextWidth(next);
      });
    };
    const onUp = () => {
      if (frame !== null) cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      setContextWidth((width) => {
        localStorage.setItem("nexa_messaging_context_width", String(width));
        return width;
      });
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const resizeContextByKeyboard = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const rtl = document.documentElement.dir === "rtl";
    const direction =
      event.key === "ArrowLeft"
        ? (rtl ? -16 : 16)
        : (rtl ? 16 : -16);
    setContextWidth((width) => {
      const next = Math.min(maximumContextWidth(), Math.max(280, width + direction));
      localStorage.setItem("nexa_messaging_context_width", String(next));
      return next;
    });
  };

  const loadConversation = useCallback(async () => {
    if (!token) return;
    const requestedConversationId = conversationId;
    const requestSequence = ++conversationRequestSequenceRef.current;
    debugMessagingScroll("request-start", {
      routeConversationId: conversationId,
      requestedConversationId,
      requestSequence,
    });
    try {
      const detail = await getConversation(requestedConversationId, token);
      if (
        !isCurrentConversationResponse(
          requestedConversationId,
          activeRouteConversationIdRef.current,
          requestSequence,
          conversationRequestSequenceRef.current,
        )
      ) {
        debugMessagingScroll("request-stale", {
          routeConversationId: activeRouteConversationIdRef.current,
          requestedConversationId,
          requestSequence,
        });
        return;
      }
      const timeline = sortConversationMessages(
        detail.timeline ?? detail.messages,
      );
      setConversation(detail);
      setMessages(timeline);
      setHasMore(detail.hasMore);
      setLoadedConversationId(requestedConversationId);
      debugMessagingScroll("request-finish", {
        routeConversationId: conversationId,
        loadedConversationId: requestedConversationId,
        requestSequence,
        messageCount: timeline.length,
        firstSequence: timeline[0]?.conversationSequence ?? null,
        lastSequence: timeline.at(-1)?.conversationSequence ?? null,
      });
    } catch (e) {
      if (
        requestSequence !== conversationRequestSequenceRef.current ||
        requestedConversationId !== activeRouteConversationIdRef.current
      ) {
        return;
      }
      setError(formatUserError(e));
    } finally {
      if (
        requestSequence === conversationRequestSequenceRef.current &&
        requestedConversationId === activeRouteConversationIdRef.current
      ) {
        setLoading(false);
      }
    }
  }, [conversationId, token]);

  useEffect(() => {
    conversationRequestSequenceRef.current += 1;
    setLoadedConversationId(null);
    setConversation(null);
    setMessages([]);
    setHasMore(false);
    setError(null);
    setLoading(true);
    debugMessagingScroll("route-change", {
      routeConversationId: conversationId,
      requestSequence: conversationRequestSequenceRef.current,
    });
    trackEvent("inbox_conversation_opened", { conversation_id: conversationId });
    startMessagingMeasure(`thread-render:${conversationId}`);
    void loadConversation();
    void flushOfflineQueue(token, (item, message) => {
      if (item.conversationId === conversationId) {
        setMessages((prev) => reconcileOptimisticMessage(prev, message));
      }
    });
  }, [conversationId, token, loadConversation]);

  useEffect(() => {
    if (loading || !conversation) return;
    const frame = requestAnimationFrame(() =>
      {
        debugMessagingScroll("timeline-commit", {
          routeConversationId: conversationId,
          loadedConversationId,
          renderedConversationId: conversation.conversation.id,
          messageCount: messages.length,
          scroll: scrollGeometry(scrollRef.current),
        });
        endMessagingMeasure(`thread-render:${conversationId}`, {
          loadedMessages: messages.length,
        });
      },
    );
    return () => cancelAnimationFrame(frame);
  }, [conversation, conversationId, loadedConversationId, loading, messages.length]);

  useEffect(() => {
    const last = messages.at(-1);
    if (!last) return;
    if (announcedTailRef.current === null) {
      announcedTailRef.current = last.id;
      return;
    }
    if (announcedTailRef.current === last.id) return;
    announcedTailRef.current = last.id;
    if (!last.isOwn && !last.isSystem) {
      setScreenReaderAnnouncement(
        t("inbox.phase13.newMessage").replace(
          "{name}",
          conversation?.presentation.title ?? "",
        ),
      );
    }
  }, [conversation?.presentation.title, messages, t]);

  const poll = useCallback(async () => {
    if (!token) return;
    const requestedConversationId = conversationId;
    try {
      const detail = await getConversation(requestedConversationId, token);
      if (
        requestedConversationId !== activeRouteConversationIdRef.current ||
        loadedConversationId !== requestedConversationId
      ) {
        debugMessagingScroll("request-stale", {
          routeConversationId: activeRouteConversationIdRef.current,
          requestedConversationId,
          source: "poll",
        });
        return;
      }
      const localVersion = conversation?.sync.conversationVersion;
      const localAttachVersion = conversation?.sync.attachmentVersion;
      const sameTail = detail.timeline.at(-1)?.id === messages.at(-1)?.id;
      const skipConversation =
        localVersion != null &&
        !shouldFetchAfterPush(localVersion, detail.sync.conversationVersion) &&
        sameTail;
      const refreshAttachments = shouldRefreshAttachments(
        localAttachVersion,
        detail.sync.attachmentVersion,
      );

      if (skipConversation && !refreshAttachments) return;

      setConversation(detail);
      setMessages((prev) =>
        mergeMessages(prev, detail.timeline ?? detail.messages, {
          preferIncomingAttachments: refreshAttachments,
        }),
      );
      setHasMore(detail.hasMore);
      if (atBottomRef.current) {
        requestAnimationFrame(() => scrollToBottom());
      }
      scheduleRead();
    } catch {
      /* silent poll failure */
    }
  }, [
    conversationId,
    loadedConversationId,
    token,
    scheduleRead,
    scrollToBottom,
    conversation?.sync.conversationVersion,
    conversation?.sync.attachmentVersion,
    messages,
    atBottomRef,
  ]);

  const uploadLabels = useMemo(
    () => ({
      uploading: t("inbox.attachmentComposer.uploading"),
      failed: t("inbox.attachmentComposer.uploadFailed"),
      retry: t("inbox.attachmentComposer.retry"),
    }),
    [t],
  );

  const { bumpActivity } = useMessagingRealtime(
    "conversation",
    poll,
    !!token && !!conversation,
    token,
  );

  const attachmentManager = useAttachmentManager(conversationId, token, {
    senderId: user?.id ?? null,
    onOptimisticMessage: (message) => {
      setMessages((prev) => [...prev, message]);
      setOptimisticInboxActivity(
        conversationId,
        message.type === "IMAGE"
          ? "You sent a photo"
          : message.body?.trim() || "You sent a file",
      );
      bumpActivity();
      scrollToBottom(true);
      setDraftPrompt(null);
    },
    onUploadProgress: (clientMessageId, prog) => {
      setMessages((prev) =>
        patchOptimisticByClientId(prev, clientMessageId, {
          metadata: {
            uploadState: "uploading",
            uploadProgress: prog.overallPct,
            uploadLabel: prog.label,
          },
        }),
      );
    },
    onMessageSent: (message) => {
      setMessages((prev) =>
        reconcileOptimisticMessage(prev, {
          ...message,
          metadata: { ...message.metadata, uploadState: "complete", uploadProgress: 100 },
        }),
      );
      setDraftPrompt(null);
      requestAnimationFrame(() => scrollToBottom(true));
      void poll();
    },
    onSendFailed: (clientMessageId, err) => {
      setMessages((prev) =>
        patchOptimisticByClientId(prev, clientMessageId, {
          metadata: {
            uploadState: "failed",
            uploadError: err,
          },
        }),
      );
    },
  });

  useEffect(() => {
    if (!conversationId || attachmentManager.state.isOpen) return;
    if (attachmentManager.state.activeUploadClientId) {
      setDraftPrompt(null);
      return;
    }
    void loadAttachmentDraft(conversationId)
      .then((draft) => {
        if (draft && draft.record.files.length > 0) {
          setDraftPrompt({ fileCount: draft.record.files.length });
        } else {
          setDraftPrompt(null);
        }
      })
      .catch(() => undefined);
  }, [
    conversationId,
    attachmentManager.state.isOpen,
    attachmentManager.state.activeUploadClientId,
  ]);

  const handleRestoreDraft = useCallback(async () => {
    const draft = await loadAttachmentDraft(conversationId);
    if (!draft) {
      setDraftPrompt(null);
      return;
    }
    const restored = draft.record.files.flatMap((meta) => {
      const blob = draft.blobs.get(meta.blobKey);
      if (!blob) return [];
      const file = new File([blob], meta.name, {
        type: meta.mime || (meta.kind === "image" ? "image/jpeg" : "application/pdf"),
        lastModified: meta.lastModified,
      });
      return [{ id: meta.id, file, kind: meta.kind, rotation: meta.rotation, crop: meta.crop }];
    });
    if (!restored.length) {
      setDraftPrompt(null);
      return;
    }
    attachmentManager.restoreFromDraft(restored, draft.record.caption);
    setDraftPrompt(null);
  }, [conversationId, attachmentManager]);

  const handleDiscardDraft = useCallback(async () => {
    await clearAttachmentDraft(conversationId);
    setDraftPrompt(null);
  }, [conversationId]);

  const handleRetryMediaUpload = useCallback(
    (clientMessageId: string) => {
      void attachmentManager.retryFailed(clientMessageId);
    },
    [attachmentManager],
  );

  const loadOlder = async () => {
    if (!token || loadingOlder || !hasMore || messages.length === 0) return;
    const firstSeq = messages[0]?.conversationSequence;
    if (firstSeq == null) return;
    const el = scrollRef.current;
    const prevHeight = el?.scrollHeight ?? 0;
    setLoadingOlder(true);
    try {
      const page = await listMessages(conversationId, token, 30, firstSeq);
      setMessages((prev) => mergeMessages(page.messages, prev));
      setHasMore(page.hasMore);
      requestAnimationFrame(() => {
        const nextHeight = el?.scrollHeight ?? 0;
        preserveAnchorOnPrepend(nextHeight - prevHeight);
      });
    } catch (e) {
      setError(formatUserError(e));
    } finally {
      setLoadingOlder(false);
    }
  };

  const onScroll = () => {
    handleScroll();
    updateScrollDate();
    bumpActivity();
    const el = scrollRef.current;
    if (el) {
      const distance =
        el.scrollHeight - el.scrollTop - el.clientHeight;
      setHeaderCompact((current) => {
        const next = distance > 180;
        return current === next ? current : next;
      });
    }
    if (el && el.scrollTop < 48) {
      void loadOlder();
    }
  };

  const handleSend = async () => {
    const body = draft.trim();
    if (!body || !token || sending || !conversation?.permissions.canSend) return;

    const clientMessageId = createClientMessageId();
    const optimistic = buildOptimisticMessage(
      conversationId,
      body,
      clientMessageId,
      user?.id ?? null,
    );

    setSending(true);
    setMessages((prev) => [...prev, optimistic]);
    setOptimisticInboxActivity(conversationId, body);
    await discardDraft();
    bumpActivity();
    scrollToBottom(true);

    try {
      if (!isOnline()) {
        enqueueOffline({
          conversationId,
          body,
          clientMessageId,
          createdAt: new Date().toISOString(),
        });
        trackEvent("message_sent", { conversation_id: conversationId, offline: true });
        return;
      }

      const saved = await sendMessage(conversationId, body, token, clientMessageId);
      setMessages((prev) => reconcileOptimisticMessage(prev, saved));
      trackEvent("message_sent", { conversation_id: conversationId, offline: false });
      void poll();
    } catch (e) {
      if (isClosedSupportConflict(e)) {
        setMessages((prev) =>
          prev.filter((message) => message.clientMessageId !== clientMessageId),
        );
        clearOptimisticInboxActivity(conversationId);
        void loadConversation();
        setError(formatUserError(e));
        return;
      }
      enqueueOffline({
        conversationId,
        body,
        clientMessageId,
        createdAt: new Date().toISOString(),
      });
      setError(formatUserError(e));
    } finally {
      setSending(false);
    }
  };

  const handleShareLocation = async () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError(t("inbox.attachmentMenu.locationError"));
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10_000,
            maximumAge: 60_000,
          });
        },
      );
      const latitude = position.coords.latitude.toFixed(6);
      const longitude = position.coords.longitude.toFixed(6);
      const mapUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
      const locationLine = `${t("inbox.attachmentMenu.location")}: ${mapUrl}`;
      updateDraft(
        `${draft.trimEnd()}${draft.trim() ? "\n" : ""}${locationLine}`.slice(
          0,
          2000,
        ),
      );
      bumpActivity();
    } catch {
      setError(t("inbox.attachmentMenu.locationError"));
    }
  };

  const menuLabels = {
    menu: t("inbox.menu"),
    report: t("inbox.report"),
    safety: t("inbox.safety"),
    mute: t("inbox.mute"),
    unmute: t("inbox.unmute"),
  };

  if (loading || loadedConversationId !== conversationId) {
    return <ConversationSkeleton />;
  }

  if (error && !conversation) {
    return (
      <div className="fixed inset-0 z-layer-drawer flex items-center justify-center bg-[linear-gradient(180deg,#fdfbfc,#fbf4f7)] px-4 lg:static lg:inset-auto lg:z-auto lg:h-full lg:min-h-0">
        <div className="w-full max-w-md">
          <ErrorAlert error={error} />
        </div>
      </div>
    );
  }

  if (!conversation) return null;

  const isSupportThread =
    conversation.conversation.type.toUpperCase() === "SUPPORT";
  const isSupportClosed =
    isSupportThread &&
    (conversation.conversation.messagingState === "ARCHIVED" ||
      conversation.conversation.archiveReason === "SUPPORT" ||
      conversation.permissions.isReadOnly ||
      !conversation.permissions.canSend);
  const readOnlyHint = conversation.permissions.isReadOnly
    ? t("inbox.readOnly")
    : !conversation.permissions.canSend
      ? t("inbox.cannotSend")
      : undefined;
  const reservation = conversation.presentation.reservation;
  const bookingId = reservation.bookingId ?? conversation.conversation.bookingId;
  const shortDate = (value: string) =>
    value
      ? new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString(locale, {
          day: "numeric",
          month: "short",
        })
      : "";
  const stayDates =
    reservation.checkinDate && reservation.checkoutDate
      ? `${shortDate(reservation.checkinDate)} – ${shortDate(reservation.checkoutDate)}`
      : null;
  const timelineActions = messages.flatMap((message) => {
    const payload = getCardPayload(message);
    const metadata = message.metadata as { actions?: CardAction[] };
    return payload?.actions ?? metadata.actions ?? [];
  });
  const mapAction = timelineActions.find((action) =>
    [action.id, action.type, action.url].some(
      (value) =>
        typeof value === "string" &&
        /(map|direction)/i.test(value),
    ),
  );
  const reservationActions = [
    ...(bookingId
      ? [{
          id: "view-booking",
          label: t("inbox.context.viewBooking"),
          onSelect: () =>
            executeCardAction(
              {
                id: "phase9-view-booking",
                label: t("inbox.context.viewBooking"),
                type: "OPEN_BOOKING",
                url: `/bookings/${bookingId}`,
              },
              { localePath },
            ),
        }]
      : []),
    ...(mapAction
      ? [{
          id: "directions",
          label: mapAction.label,
          onSelect: () => executeCardAction(mapAction, { localePath }),
        }]
      : []),
    {
      id: "contact-support",
      label: t("inbox.context.contactSupport"),
      onSelect: () =>
        executeCardAction(
          {
            id: "contact_support_summary",
            label: t("inbox.context.contactSupport"),
            type: "deep_link",
            url: `/contact?safety=1${bookingId ? `&booking_id=${bookingId}` : ""}`,
          },
          { localePath },
        ),
    },
  ].slice(0, 3);
  const allAttachments = messages.flatMap((message) => message.attachments);
  const photoCount = allAttachments.filter((attachment) =>
    attachment.mime?.startsWith("image/"),
  ).length;
  const voiceCount = allAttachments.filter((attachment) =>
    attachment.mime?.startsWith("audio/"),
  ).length;
  const fileCount = allAttachments.length - photoCount - voiceCount;
  const journeyStage = deriveJourneyIndex(conversation);
  const tip =
    conversation.permissions.canReview
      ? t("inbox.phase15.tips.review")
      : journeyStage >= 2 && conversation.presentation.reservation.addressDisplay
        ? t("inbox.phase15.tips.directions")
        : conversation.presentation.reservation.listingId
          ? t("inbox.phase15.tips.property")
          : null;

  return (
    <section
      ref={threadWorkspaceRef}
      aria-label={t("inbox.phase13.thread")}
      className={`messaging-surface fixed inset-0 z-layer-drawer flex h-[100dvh] min-w-0 overflow-hidden overflow-x-hidden bg-[linear-gradient(180deg,#fdfbfc,#fbf5f8)] transition-[filter,transform] [transition-duration:250ms] motion-reduce:transition-none min-[1100px]:static min-[1100px]:inset-auto min-[1100px]:z-auto min-[1100px]:h-full min-[1100px]:min-h-0 ${
        attachmentManager.state.isOpen
          ? "scale-[0.99] brightness-[0.82]"
          : "scale-100 brightness-100"
      }`}
    >
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {screenReaderAnnouncement}
      </p>
      <ConversationThemeProvider conversation={conversation}>
      <div className="flex min-w-0 flex-1 flex-col min-[1400px]:min-w-[760px]">
      <ConversationHeader
        conversation={conversation}
        compact={headerCompact}
        backHref={localePath(inboxBase)}
        backLabel={t("inbox.back")}
        onBack={navigateBackToInbox}
        menuLabels={menuLabels}
        muted={muted}
        onReport={() => setReportOpen(true)}
        onSafety={() => setSafetyOpen(true)}
        onMuteChange={(next) => {
          setConversationMuted(conversationId, next);
          setMuted(next);
          trackEvent("conversation_muted", { conversation_id: conversationId, muted: next });
        }}
        toolbarExtra={
          <>
            <ConversationSearchSheet
              conversationId={conversationId}
              token={token}
              messages={messages}
              counterpartName={conversation.presentation.title}
              viewerRole={conversation.permissions.viewerRole}
              onJumpToMessage={jumpToMessage}
              onOpenGallery={(attachments, index) => {
                galleryTriggerRef.current =
                  document.activeElement instanceof HTMLElement
                    ? document.activeElement
                    : null;
                setGallery({ attachments, index });
              }}
            />
            <BookingContextStrip
              onOpenContext={openContext}
            />
          </>
        }
      />

      {error ? (
        <div className="w-full shrink-0 px-4 pt-2">
          <ErrorAlert error={error} compact onDismiss={() => setError(null)} />
        </div>
      ) : null}

      <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden">
        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="h-full min-h-0 min-w-0 overflow-y-auto overflow-x-hidden overscroll-contain bg-[radial-gradient(circle_at_50%_0%,rgba(253,240,243,0.72),transparent_30%),linear-gradient(180deg,#fdfbfc,#fbf6f8)] px-3 py-4 [scrollbar-color:transparent_transparent] [scrollbar-width:thin] hover:[scrollbar-color:rgba(232,80,122,0.34)_transparent] sm:px-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-nexa-primary/30 [&::-webkit-scrollbar-track]:bg-transparent"
        >
          <div className="mx-auto min-w-0 w-full max-w-[920px]">
            <BookingJourney conversation={conversation} compact />
            <ConversationSummary
              conversationId={conversationId}
              label={t("inbox.phase9.reservation")}
              title={conversation.presentation.listing.title || reservation.listingTitle}
              dates={stayDates}
              status={conversation.presentation.statusChip ?? conversation.bookingStatus}
              actions={reservationActions}
            />
            <CheckInWelcomeBanner
              conversationId={conversationId}
              checkInDate={conversation.presentation.reservation.checkinDate}
              country={conversation.presentation.reservation.country}
              visible={conversation.permissions.viewerRole === "guest"}
              title={t("inbox.timeline.welcome")}
              body={t("inbox.timeline.stayBeginsToday")}
              dismissLabel={t("inbox.timeline.dismissWelcome")}
            />
            {tip ? (
              <ContextualTip
                id={`${conversationId}:${journeyStage}`}
                text={tip}
                dismissLabel={t("inbox.phase15.dismissTip")}
              />
            ) : null}
            <AttachmentRail
              messages={messages}
              counterpartName={conversation.presentation.title}
              locale={locale}
              labels={{
                shared: t("inbox.phase9.sharedMedia"),
                title: t("inbox.phase11.title"),
                close: t("inbox.phase11.close"),
                all: t("inbox.phase11.all"),
                photos: t("inbox.phase11.photos"),
                files: t("inbox.phase11.files"),
                voice: t("inbox.phase11.voice"),
                links: t("inbox.phase11.links"),
                today: t("inbox.phase11.today"),
                yesterday: t("inbox.phase11.yesterday"),
                open: t("inbox.phase11.open"),
                download: t("inbox.phase11.download"),
                downloading: t("inbox.phase11.downloading"),
                downloaded: t("inbox.phase11.downloaded"),
                failed: t("inbox.phase11.failed"),
                select: t("inbox.phase11.select"),
                selected: t("inbox.phase11.selected"),
                viewAll: t("inbox.phase11.viewAll"),
                emptyTitle: t("inbox.phase11.emptyTitle"),
                emptyBody: t("inbox.phase11.emptyBody"),
              }}
              onOpenGallery={(attachments, index) => {
                galleryTriggerRef.current =
                  document.activeElement instanceof HTMLElement
                    ? document.activeElement
                    : null;
                setGallery({ attachments, index });
              }}
            />
            {loadingOlder ? (
              <p className="py-2 text-center text-xs text-nexa-ink-4">
                {t("inbox.loadingOlder")}
              </p>
            ) : null}
            {messages.length === 0 ? (
              <ConversationWelcomeCard conversation={conversation} />
            ) : null}
            <TimelineRenderer
              messages={messages}
              scrollContainerRef={scrollRef}
              removedLabel={t("inbox.messageRemoved")}
              presentation={conversation.presentation}
              permissions={conversation.permissions}
              localePath={localePath}
              onOpenGallery={(attachments, index) => {
                galleryTriggerRef.current =
                  document.activeElement instanceof HTMLElement
                    ? document.activeElement
                    : null;
                setGallery({ attachments, index });
              }}
              onRetryMediaUpload={handleRetryMediaUpload}
              uploadLabels={uploadLabels}
              lastReadMessageId={conversation.sync.lastReadPointer.messageId}
              unreadLabel={t("inbox.phase9.newMessages")}
            />
          </div>
        </div>
        <AnimatePresence>
          {scrollDateVisible && scrollDateLabel ? (
            <motion.div
              className="pointer-events-none absolute inset-x-0 top-2 z-layer-sticky flex justify-center px-4"
              initial={
                reduceMotion ? { opacity: 0 } : { opacity: 0, y: -5, scale: 0.98 }
              }
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={
                reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.98 }
              }
              transition={{
                duration: reduceMotion ? 0 : MESSAGING_MOTION.button,
                ease: MESSAGING_EASE_OUT,
              }}
              role="status"
              aria-live="polite"
            >
              <span className="rounded-full border border-nexa-line bg-white/95 px-3 py-2 text-xs font-medium text-nexa-ink-3 shadow-messaging-2 backdrop-blur-xl">
                {scrollDateLabel}
              </span>
            </motion.div>
          ) : null}
        </AnimatePresence>
        <NewMessagesIndicator
          count={newMessagesBelow}
          label={t("inbox.newMessages").replace(
            "{count}",
            String(newMessagesBelow),
          )}
          onClick={() => scrollToBottom(true)}
        />
      </div>

      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) attachmentManager.stageFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={documentInputRef}
        type="file"
        accept="application/pdf"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) attachmentManager.stageFiles(e.target.files);
          e.target.value = "";
        }}
      />

      <MediaGallery
        open={!!gallery}
        attachments={gallery?.attachments ?? []}
        initialIndex={gallery?.index ?? 0}
        onClose={() => {
          setGallery(null);
          requestAnimationFrame(() => galleryTriggerRef.current?.focus());
        }}
      />

      <AttachmentComposer
        manager={attachmentManager}
        labels={{
          captionPlaceholder: t("inbox.attachmentComposer.captionPlaceholder"),
          send: t("inbox.attachmentComposer.send"),
          discard: t("inbox.attachmentComposer.discard"),
          remove: t("inbox.attachmentComposer.remove"),
          rotate: t("inbox.attachmentComposer.rotate"),
          crop: t("inbox.attachmentComposer.crop"),
          uploadProgress: t("inbox.attachmentComposer.uploadProgress"),
          retry: t("inbox.attachmentComposer.retry"),
          close: t("inbox.attachmentComposer.close"),
        }}
      />

      <AttachmentDraftPrompt
        open={!!draftPrompt && !attachmentManager.state.isOpen}
        fileCount={draftPrompt?.fileCount ?? 0}
        labels={{
          title: t("inbox.attachmentComposer.continueEditing"),
          continue: t("inbox.attachmentComposer.continue"),
          discard: t("inbox.attachmentComposer.discard"),
        }}
        onContinue={() => void handleRestoreDraft()}
        onDiscard={() => void handleDiscardDraft()}
      />

      {draftReady && !attachmentManager.state.isOpen ? (
        <>
          {isSupportClosed ? (
            <div className="mx-4 mb-3 rounded-messaging-panel border border-nexa-line bg-white px-5 py-5 text-center shadow-messaging-2">
              <p className="font-display text-base font-semibold text-nexa-ink">
                {t("inbox.supportClosedTitle")}
              </p>
              <p className="mt-1.5 text-sm text-nexa-ink-2">
                {t("inbox.supportClosedBody")}
              </p>
            </div>
          ) : conversation.conversation.messagingState === "ARCHIVED" ? (
            <ArchivedThreadBanner
              bookingId={conversation.conversation.bookingId}
              localePath={localePath}
              title={t("inbox.archivedBannerTitle")}
              body={t("inbox.archivedBannerBody")}
              contactSupportLabel={t("inbox.contactSupport")}
              viewReservationLabel={t("inbox.viewReservation")}
            />
          ) : null}
          <DraftRecovery
            visible={showDraftRecovery}
            label={t("inbox.phase9.draft")}
            body={draft}
            dismissLabel={t("inbox.phase9.dismissDraft")}
            onContinue={() => {
              setShowDraftRecovery(false);
              requestAnimationFrame(() =>
                document
                  .querySelector<HTMLTextAreaElement>("[data-message-composer-input]")
                  ?.focus(),
              );
            }}
            onDismiss={() => setShowDraftRecovery(false)}
          />
          <SupportCsatPrompt
            conversationId={conversationId}
            conversationType={conversation.conversation.type}
            token={token}
          />
          {!isSupportClosed ? (
          <MessageComposer
            value={draft}
            onChange={updateDraft}
            onSend={() => void handleSend()}
            onVoiceRecorded={(file) => void attachmentManager.sendVoiceNote(file)}
            disabled={sending || !conversation.permissions.canSend}
            placeholder={t("inbox.composerPlaceholder")}
            sendLabel={t("inbox.send")}
            voiceLabel={t("inbox.voiceMessage")}
            recordingLabel={t("inbox.recordingVoice")}
            cancelLabel={t("common.cancel")}
            readOnlyHint={readOnlyHint}
            onAttach={() => photoInputRef.current?.click()}
            onAttachDocument={() => documentInputRef.current?.click()}
            onShareLocation={() => void handleShareLocation()}
            attachmentLabels={{
              menu: t("inbox.attachmentMenu.title"),
              photos: t("inbox.attachmentMenu.photos"),
              documents: t("inbox.attachmentMenu.documents"),
              location: t("inbox.attachmentMenu.location"),
            }}
            onFilesDropped={(files) => attachmentManager.stageFiles(files)}
            dropLabel={t("inbox.dropFiles")}
            attachDisabled={!conversation.permissions.canUpload}
            uploadProgress={attachmentManager.state.progress?.overallPct ?? null}
            onFocus={() => {
              trackEvent("message_composer_focused", { conversation_id: conversationId });
            }}
            onActivity={bumpActivity}
          />
          ) : null}
        </>
      ) : null}

      {!online ? (
        <div
          className="flex shrink-0 items-center justify-center gap-2 bg-amber-50 px-4 py-2 text-xs font-medium text-amber-900"
          role="status"
        >
          <WifiOff className="h-3.5 w-3.5" aria-hidden />
          <span>{t("inbox.offline")}</span>
        </div>
      ) : null}
      </div>

      <aside
        className="relative hidden min-h-0 shrink-0 bg-[#fffafb] min-[1400px]:flex"
        style={{ width: contextCollapsed ? 56 : contextWidth }}
        aria-label={t("inbox.context.title")}
      >
        {contextCollapsed ? (
          <button
            type="button"
            onClick={() => setDesktopContextCollapsed(false)}
            className="flex h-full w-14 items-start justify-center border-s border-nexa-line bg-white pt-5 text-nexa-ink-3 transition-[background-color,color] duration-messaging-hover hover:bg-nexa-bg-2 hover:text-nexa-ink"
            aria-label={t("inbox.context.open")}
          >
            <PanelRightOpen className="h-5 w-5" />
          </button>
        ) : (
          <>
            <div
              role="separator"
              aria-label={t("inbox.context.resize")}
              aria-orientation="vertical"
              tabIndex={0}
              onPointerDown={startContextResize}
              onKeyDown={resizeContextByKeyboard}
              aria-valuemin={280}
              aria-valuemax={maximumContextWidth()}
              aria-valuenow={contextWidth}
              className="absolute inset-y-0 start-0 z-layer-content w-2 -translate-x-1/2 cursor-col-resize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-primary/40 rtl:translate-x-1/2"
            />
            <MessagingContextPanel
              conversation={conversation}
              activity={{ messages: messages.length, photos: photoCount, files: fileCount, voice: voiceCount }}
              contextualNote={tip}
              className="w-full"
              onClose={() => setDesktopContextCollapsed(true)}
            />
          </>
        )}
      </aside>

      <OverlayPortal layer="drawer">
        <TabletContextDrawer
          open={contextOpen && !mobileContext}
          ariaLabel={t("inbox.context.title")}
          closeLabel={t("common.close")}
          onClose={() => setResponsiveContextOpen(false)}
        >
          {contextOpen && !mobileContext ? (
            <MessagingContextPanel
              conversation={conversation}
              activity={{ messages: messages.length, photos: photoCount, files: fileCount, voice: voiceCount }}
              contextualNote={tip}
              onClose={() => setResponsiveContextOpen(false)}
            />
          ) : null}
        </TabletContextDrawer>
      </OverlayPortal>

      <BottomSheet
        open={contextOpen && mobileContext}
        onOpenChange={setResponsiveContextOpen}
        ariaLabel={t("inbox.context.title")}
        layer="drawer"
        height="full"
        padded={false}
      >
        <MessagingContextPanel
          conversation={conversation}
          activity={{ messages: messages.length, photos: photoCount, files: fileCount, voice: voiceCount }}
          contextualNote={tip}
          className="-mx-4 min-h-0"
          onClose={() => setResponsiveContextOpen(false)}
        />
      </BottomSheet>

      <ReportConversationSheet
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        conversationId={conversationId}
        token={token}
        onContactSupport={(supportUrl) => {
          router.push(
            supportUrl.startsWith("/") ? localePath(supportUrl) : supportUrl,
          );
        }}
      />
      <SafetyIssueSheet
        open={safetyOpen}
        onClose={() => setSafetyOpen(false)}
        conversationId={conversationId}
        token={token}
        bookingContext={{
          listingName:
            conversation.presentation.reservation.listingTitle ||
            conversation.presentation.listing.title ||
            undefined,
          checkIn: conversation.presentation.reservation.checkinDate || undefined,
          checkOut: conversation.presentation.reservation.checkoutDate || undefined,
        }}
        onContactSupport={(supportUrl) => {
          router.push(
            supportUrl.startsWith("/") ? localePath(supportUrl) : supportUrl,
          );
        }}
      />
      </ConversationThemeProvider>
    </section>
  );
}

export default function ConversationPage() {
  return <ConversationPageInner />;
}
