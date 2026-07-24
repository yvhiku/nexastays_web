"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { TimelineRenderer } from "@/components/messaging/TimelineRenderer";
import { useBatchedRead } from "@/components/messaging/hooks/useBatchedRead";
import { useConversationDraft } from "@/components/messaging/hooks/useConversationDraft";
import { useConversationScroll } from "@/components/messaging/hooks/useConversationScroll";
import { useMessagingRealtime } from "@/components/messaging/hooks/useMessagingRealtime";
import {
  isConversationMuted,
  setConversationMuted,
} from "@/components/messaging/ConversationMenu";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  blockConversation,
  getConversation,
  listMessages,
  reportConversation,
  reportSafetyIssue,
  sendMessage,
  updateConversationVisibility,
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
import { formatUserError } from "@/lib/errors";
import { trackEvent } from "@/lib/analytics";
import { setOptimisticInboxActivity } from "@/lib/messaging/inbox-optimistic";
import { BookingContextStrip } from "@/components/messaging/BookingContextStrip";
import {
  ConversationSkeleton,
  ContextPanelSkeleton,
  MessagingEmptyState,
} from "@/components/messaging/MessagingStates";
import { BottomSheet } from "@/components/mobile/BottomSheet";
import { OverlayPortal } from "@/components/ui/OverlayPortal";
import { PanelRightOpen, WifiOff } from "lucide-react";
import { useFocusTrap } from "@/components/messaging/hooks/useFocusTrap";
import { InboxListPanel } from "@/components/messaging/InboxListPanel";

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
          className="fixed inset-0 hidden overflow-hidden md:block lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label={ariaLabel}
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.18 }}
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
            transition={
              reduceMotion
                ? { duration: 0 }
                : { type: "spring", stiffness: 360, damping: 34 }
            }
            className="absolute inset-y-0 end-0 w-[min(380px,calc(100vw-48px))] max-w-full shadow-2xl"
          >
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function ConversationListDrawer({
  open,
  activeConversationId,
  ariaLabel,
  closeLabel,
  onClose,
}: {
  open: boolean;
  activeConversationId: string;
  ariaLabel: string;
  closeLabel: string;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { isRtl } = useLanguage();
  useFocusTrap(open, ref);
  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose, open]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          ref={ref}
          className="fixed inset-0 hidden overflow-hidden md:block lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label={ariaLabel}
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.18 }}
        >
          <button
            type="button"
            tabIndex={-1}
            className="absolute inset-0 bg-nexa-ink/30 backdrop-blur-sm"
            onClick={onClose}
            aria-label={closeLabel}
          />
          <motion.div
            initial={reduceMotion ? false : { x: isRtl ? "100%" : "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: isRtl ? "100%" : "-100%" }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { type: "spring", stiffness: 360, damping: 34 }
            }
            className="absolute inset-y-0 start-0 w-[min(360px,calc(100vw-48px))] max-w-full bg-white shadow-2xl"
            onClickCapture={(event) => {
              const target = event.target;
              if (
                target instanceof Element &&
                target.closest("[data-conversation-row]")
              ) {
                onClose();
              }
            }}
          >
            <InboxListPanel activeConversationId={activeConversationId} />
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function ConversationPageInner() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.id as string;
  const { token, user } = useAuth();
  const { t, localePath } = useLanguage();

  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [online, setOnline] = useState(true);
  const [muted, setMuted] = useState(false);
  const [contextCollapsed, setContextCollapsed] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);
  const [mobileContext, setMobileContext] = useState(false);
  const [conversationListOpen, setConversationListOpen] = useState(false);
  const [contextWidth, setContextWidth] = useState(320);
  const [gallery, setGallery] = useState<{ attachments: MessageDto["attachments"]; index: number } | null>(null);
  const [draftPrompt, setDraftPrompt] = useState<{ fileCount: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const threadWorkspaceRef = useRef<HTMLDivElement>(null);
  const contextTriggerRef = useRef<HTMLElement | null>(null);
  const galleryTriggerRef = useRef<HTMLElement | null>(null);
  const conversationListTriggerRef = useRef<HTMLElement | null>(null);

  const jumpToMessage = useCallback((messageId: string) => {
    const node = scrollRef.current?.querySelector(`[data-message-id="${messageId}"]`);
    if (node instanceof HTMLElement) {
      node.scrollIntoView({ behavior: "smooth", block: "center" });
      node.classList.add("ring-2", "ring-nexa-primary/40", "rounded-xl");
      window.setTimeout(() => node.classList.remove("ring-2", "ring-nexa-primary/40", "rounded-xl"), 2000);
    }
  }, []);

  const { draft, updateDraft, discardDraft, ready: draftReady } = useConversationDraft(conversationId);
  const { scheduleRead, flushRead } = useBatchedRead(
    conversationId,
    token,
    !!conversation,
    () => trackEvent("message_read", { conversation_id: conversationId }),
  );

  const { handleScroll, scrollToBottom, preserveAnchorOnPrepend, atBottomRef } =
    useConversationScroll({
      conversationId,
      scrollRef,
      messages,
      lastReadMessageId: conversation?.sync.lastReadPointer.messageId ?? null,
      onMarkRead: scheduleRead,
      enabled: !!conversation && !loading,
    });

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
      if (width >= 1024) {
        setContextOpen(false);
        setConversationListOpen(false);
        return;
      }
      setMobileContext(width < 768);
      if (width < 768) {
        setConversationListOpen(false);
      }
    };
    syncResponsiveOverlays();
    window.addEventListener("resize", syncResponsiveOverlays);
    return () => window.removeEventListener("resize", syncResponsiveOverlays);
  }, []);

  useEffect(() => {
    const storedWidth = Number(localStorage.getItem("nexa_messaging_context_width"));
    const storedCollapsed = localStorage.getItem("nexa_messaging_context_collapsed");
    if (Number.isFinite(storedWidth) && storedWidth >= 320 && storedWidth <= 420) {
      setContextWidth(storedWidth);
    } else {
      setContextWidth(window.innerWidth >= 1440 ? 360 : 320);
    }
    setContextCollapsed(storedCollapsed === "1");
  }, []);

  const maximumContextWidth = useCallback(() => {
    const workspaceWidth =
      threadWorkspaceRef.current?.getBoundingClientRect().width ??
      (typeof window === "undefined" ? 1143 : window.innerWidth);
    return Math.max(320, Math.min(420, Math.floor(workspaceWidth * 0.35)));
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
    setConversationListOpen(false);
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

  const closeConversationList = useCallback(() => {
    setConversationListOpen(false);
    requestAnimationFrame(() => conversationListTriggerRef.current?.focus());
  }, []);

  const openConversationList = useCallback(() => {
    if (window.matchMedia("(max-width: 767px)").matches) {
      router.push(localePath("/inbox"));
      return;
    }
    setContextOpen(false);
    conversationListTriggerRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setConversationListOpen(true);
  }, [localePath, router]);

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
    const onMove = (moveEvent: PointerEvent) => {
      const movement = moveEvent.clientX - startX;
      const next = Math.min(
        maximumContextWidth(),
        Math.max(320, startWidth + (rtl ? movement : -movement)),
      );
      setContextWidth(next);
    };
    const onUp = () => {
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
      const next = Math.min(maximumContextWidth(), Math.max(320, width + direction));
      localStorage.setItem("nexa_messaging_context_width", String(next));
      return next;
    });
  };

  const loadConversation = useCallback(async () => {
    if (!token) return;
    try {
      const detail = await getConversation(conversationId, token);
      setConversation(detail);
      setMessages(detail.timeline ?? detail.messages);
      setHasMore(detail.hasMore);
      scheduleRead();
    } catch (e) {
      setError(formatUserError(e));
    } finally {
      setLoading(false);
    }
  }, [conversationId, token, scheduleRead]);

  useEffect(() => {
    trackEvent("inbox_conversation_opened", { conversation_id: conversationId });
    setLoading(true);
    void loadConversation();
    void flushOfflineQueue(token, (item, message) => {
      if (item.conversationId === conversationId) {
        setMessages((prev) => reconcileOptimisticMessage(prev, message));
      }
    });
  }, [conversationId, token, loadConversation]);

  const poll = useCallback(async () => {
    if (!token) return;
    try {
      const detail = await getConversation(conversationId, token);
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

  const { bumpActivity } = useMessagingRealtime("conversation", poll, !!token && !!conversation);

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
    bumpActivity();
    const el = scrollRef.current;
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

  const handleVisibility = async (action: "archive" | "delete" | "restore") => {
    if (!token) return;
    try {
      await updateConversationVisibility(conversationId, action, token);
      trackEvent("conversation_archived", { conversation_id: conversationId, action });
      router.push(localePath("/inbox"));
    } catch (e) {
      setError(formatUserError(e));
    }
  };

  const menuLabels = {
    menu: t("inbox.menu"),
    archive: t("inbox.archive"),
    delete: t("inbox.delete"),
    restore: t("inbox.restore"),
    report: t("inbox.report"),
    block: t("inbox.block"),
    safety: t("inbox.safety"),
    mute: t("inbox.mute"),
    unmute: t("inbox.unmute"),
    reportPrompt: t("inbox.reportPrompt"),
  };

  if (loading) {
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

  const readOnlyHint = conversation.permissions.isReadOnly
    ? t("inbox.readOnly")
    : !conversation.permissions.canSend
      ? t("inbox.cannotSend")
      : undefined;

  return (
    <div
      ref={threadWorkspaceRef}
      className="fixed inset-0 z-layer-drawer flex h-[100dvh] min-w-0 overflow-hidden overflow-x-hidden bg-[linear-gradient(180deg,#fdfbfc,#fbf5f8)] lg:static lg:inset-auto lg:z-auto lg:h-full lg:min-h-0"
    >
      <div className="flex min-w-0 flex-1 flex-col">
      <ConversationHeader
        conversation={conversation}
        backHref={localePath("/inbox")}
        backLabel={t("inbox.back")}
        onBack={openConversationList}
        menuLabels={menuLabels}
        muted={muted}
        onArchive={() => void handleVisibility("archive")}
        onDelete={() => void handleVisibility("delete")}
        onReport={(reason) => {
          if (!token) return;
          void reportConversation(conversationId, reason, token).then(() => {
            trackEvent("conversation_reported", { conversation_id: conversationId });
          });
        }}
        onBlock={() => {
          if (!token) return;
          void blockConversation(conversationId, token).then(() => {
            trackEvent("conversation_blocked", { conversation_id: conversationId });
            void loadConversation();
          });
        }}
        onSafety={() => {
          if (!token) return;
          void reportSafetyIssue(conversationId, token).then(({ supportUrl }) => {
            router.push(supportUrl.startsWith("/") ? localePath(supportUrl) : supportUrl);
          });
        }}
        onMuteChange={(next) => {
          setConversationMuted(conversationId, next);
          setMuted(next);
          trackEvent("conversation_muted", { conversation_id: conversationId, muted: next });
        }}
        toolbarExtra={
          <ConversationSearchSheet
            conversationId={conversationId}
            token={token}
            onJumpToMessage={jumpToMessage}
          />
        }
        contextBar={
          <BookingContextStrip
            conversation={conversation}
            onOpenContext={openContext}
          />
        }
      />

      {error ? (
        <div className="w-full shrink-0 px-4 pt-2">
          <ErrorAlert error={error} compact onDismiss={() => setError(null)} />
        </div>
      ) : null}

      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-[radial-gradient(circle_at_50%_0%,rgba(253,240,243,0.72),transparent_30%),linear-gradient(180deg,#fdfbfc,#fbf6f8)] px-3 py-4 sm:px-4"
      >
        {loadingOlder ? (
          <p className="text-center text-xs text-nexa-ink-4 py-2">{t("inbox.loadingOlder")}</p>
        ) : null}
        {messages.length === 0 ? (
          <MessagingEmptyState
            title={t("inbox.emptyThreadTitle")}
            body={t("inbox.emptyThread").replace("{name}", conversation.presentation.title)}
            className="min-h-[320px]"
          />
        ) : null}
        <TimelineRenderer
          messages={messages}
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
        />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
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
          {conversation.conversation.messagingState === "ARCHIVED" ? (
            <ArchivedThreadBanner
              bookingId={conversation.conversation.bookingId}
              localePath={localePath}
              title={t("inbox.archivedBannerTitle")}
              body={t("inbox.archivedBannerBody")}
              contactSupportLabel={t("inbox.contactSupport")}
              viewReservationLabel={t("inbox.viewReservation")}
            />
          ) : null}
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
            onAttach={() => fileInputRef.current?.click()}
            onFilesDropped={(files) => attachmentManager.stageFiles(files)}
            dropLabel={t("inbox.dropFiles")}
            attachDisabled={!conversation.permissions.canUpload}
            uploadProgress={attachmentManager.state.progress?.overallPct ?? null}
            onFocus={() => {
              trackEvent("message_composer_focused", { conversation_id: conversationId });
            }}
            onActivity={bumpActivity}
          />
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
        className="relative hidden min-h-0 shrink-0 bg-[#fffafb] lg:flex"
        style={{ width: contextCollapsed ? 56 : contextWidth }}
        aria-label={t("inbox.context.title")}
      >
        {contextCollapsed ? (
          <button
            type="button"
            onClick={() => setDesktopContextCollapsed(false)}
            className="flex h-full w-14 items-start justify-center border-s border-nexa-primary/10 bg-[linear-gradient(180deg,#fffafb,#fdf4f7)] pt-5 text-nexa-primary/70 transition-[background-color,color] hover:bg-nexa-primary-soft hover:text-nexa-primary"
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
              aria-valuemin={320}
              aria-valuemax={maximumContextWidth()}
              aria-valuenow={contextWidth}
              className="absolute inset-y-0 start-0 z-layer-content w-2 -translate-x-1/2 cursor-col-resize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-primary/40 rtl:translate-x-1/2"
            />
            <MessagingContextPanel
              conversation={conversation}
              className="w-full shadow-[-16px_0_32px_rgba(26,17,24,0.035)]"
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
              onClose={() => setResponsiveContextOpen(false)}
            />
          ) : null}
        </TabletContextDrawer>
      </OverlayPortal>

      <OverlayPortal layer="drawer">
        <ConversationListDrawer
          open={conversationListOpen}
          activeConversationId={conversationId}
          ariaLabel={t("inbox.title")}
          closeLabel={t("common.close")}
          onClose={closeConversationList}
        />
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
          className="-mx-4 min-h-0"
          onClose={() => setResponsiveContextOpen(false)}
        />
      </BottomSheet>
    </div>
  );
}

export default function ConversationPage() {
  return <ConversationPageInner />;
}
