"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorAlert } from "@/components/ui/Alert";
import { ReservationContextBar } from "@/components/messaging/ReservationContextBar";
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

const OPTIMISTIC_KEY = "nexa_messaging_optimistic_activity";

function setOptimisticActivity(conversationId: string): void {
  if (typeof window === "undefined") return;
  try {
    const map = JSON.parse(localStorage.getItem(OPTIMISTIC_KEY) ?? "{}") as Record<string, number>;
    map[conversationId] = Date.now();
    localStorage.setItem(OPTIMISTIC_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
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
  const [muted, setMuted] = useState(false);
  const [contextCollapsed, setContextCollapsed] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  const { draft, updateDraft, discardDraft, ready: draftReady } = useConversationDraft(conversationId);
  const { scheduleRead, flushRead } = useBatchedRead(
    conversationId,
    token,
    !!conversation,
    () => trackEvent("message_read", { conversation_id: conversationId }),
  );

  const { handleScroll, scrollToBottom, preserveAnchorOnPrepend, atBottomRef } =
    useConversationScroll({
      scrollRef,
      messages,
      lastReadMessageId: conversation?.sync.lastReadPointer.messageId ?? null,
      onMarkRead: scheduleRead,
      enabled: !!conversation && !loading,
    });

  useEffect(() => {
    setMuted(isConversationMuted(conversationId));
  }, [conversationId]);

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
      if (
        localVersion != null &&
        !shouldFetchAfterPush(localVersion, detail.sync.conversationVersion) &&
        detail.timeline.at(-1)?.id === messages.at(-1)?.id
      ) {
        return;
      }
      setConversation(detail);
      setMessages((prev) => mergeMessages(prev, detail.timeline ?? detail.messages));
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
    messages,
    atBottomRef,
  ]);

  const { bumpActivity } = useMessagingRealtime("conversation", poll, !!token && !!conversation);

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
    setOptimisticActivity(conversationId);
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
    return (
      <main className="min-h-[100dvh] flex items-center justify-center bg-nexa-bg-1">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-nexa-primary" />
      </main>
    );
  }

  if (error && !conversation) {
    return (
      <main className="min-h-[100dvh] bg-nexa-bg-1 px-4 flex items-center justify-center">
        <div className="w-full max-w-md">
          <ErrorAlert error={error} />
        </div>
      </main>
    );
  }

  if (!conversation) return null;

  const readOnlyHint = conversation.permissions.isReadOnly
    ? t("inbox.readOnly")
    : !conversation.permissions.canSend
      ? t("inbox.cannotSend")
      : undefined;

  return (
    <main className="min-h-[100dvh] bg-nexa-bg-1 flex flex-col">
      <div className="max-w-lg mx-auto w-full flex-1 flex flex-col bg-white md:my-4 md:rounded-3xl md:border md:border-nexa-line/60 md:shadow-nexa-card overflow-hidden">
        <ConversationHeader
          conversation={conversation}
          backHref={localePath("/inbox")}
          backLabel={t("inbox.back")}
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
        />

        <ReservationContextBar
          presentation={conversation.presentation}
          collapsedExternal={contextCollapsed}
          localePath={localePath}
          scrollContainerRef={scrollRef}
        />

        {error ? (
          <div className="px-4 pt-2">
            <ErrorAlert error={error} compact onDismiss={() => setError(null)} />
          </div>
        ) : null}

        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="flex-1 overflow-y-auto px-3 py-2 bg-gradient-to-b from-nexa-bg-1/40 to-white"
        >
          {loadingOlder ? (
            <p className="text-center text-xs text-nexa-ink-4 py-2">{t("inbox.loadingOlder")}</p>
          ) : null}
          <TimelineRenderer
            messages={messages}
            removedLabel={t("inbox.messageRemoved")}
            presentation={conversation.presentation}
            localePath={localePath}
          />
        </div>

        {draftReady ? (
          <MessageComposer
            value={draft}
            onChange={updateDraft}
            onSend={() => void handleSend()}
            disabled={sending || !conversation.permissions.canSend}
            placeholder={t("inbox.composerPlaceholder")}
            sendLabel={t("inbox.send")}
            readOnlyHint={readOnlyHint}
            onFocus={() => {
              setContextCollapsed(true);
              trackEvent("message_composer_focused", { conversation_id: conversationId });
            }}
            onActivity={bumpActivity}
          />
        ) : null}
      </div>
    </main>
  );
}

export default function ConversationPage() {
  return (
    <ProtectedRoute>
      <ConversationPageInner />
    </ProtectedRoute>
  );
}
