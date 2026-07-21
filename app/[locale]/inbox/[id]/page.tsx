"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ErrorAlert } from "@/components/ui/Alert";
import { ConversationContext } from "@/components/messaging/ConversationContext";
import { MediaGallery } from "@/components/messaging/ImageViewer";
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
  const [gallery, setGallery] = useState<{ attachments: MessageDto["attachments"]; index: number } | null>(null);
  const [draftPrompt, setDraftPrompt] = useState<{ fileCount: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

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
      setOptimisticInboxActivity(conversationId, message.body ?? "Photo");
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
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#fcf9f8] lg:static lg:inset-auto lg:z-auto lg:h-full lg:min-h-0">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-nexa-primary" />
      </div>
    );
  }

  if (error && !conversation) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#fcf9f8] px-4 lg:static lg:inset-auto lg:z-auto lg:h-full lg:min-h-0">
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
    <div className="fixed inset-0 z-[60] flex h-[100dvh] flex-col bg-[#fcf9f8] lg:static lg:inset-auto lg:z-auto lg:h-full lg:min-h-0">
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
        toolbarExtra={
          <ConversationSearchSheet
            conversationId={conversationId}
            token={token}
            onJumpToMessage={jumpToMessage}
          />
        }
        contextBar={
          <ConversationContext
            presentation={conversation.presentation}
            collapsed={contextCollapsed}
            localePath={localePath}
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
        className="flex-1 min-h-0 overflow-y-auto px-4 py-4 bg-[#fcf9f8]"
      >
        {loadingOlder ? (
          <p className="text-center text-xs text-nexa-ink-4 py-2">{t("inbox.loadingOlder")}</p>
        ) : null}
        {messages.length === 0 ? (
          <p className="py-12 text-center text-sm text-nexa-ink-3">
            {t("inbox.emptyThread").replace("{name}", conversation.presentation.title)}
          </p>
        ) : null}
        <TimelineRenderer
          messages={messages}
          removedLabel={t("inbox.messageRemoved")}
          presentation={conversation.presentation}
          localePath={localePath}
          onOpenGallery={(attachments, index) => setGallery({ attachments, index })}
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
        onClose={() => setGallery(null)}
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
          comingSoon: t("inbox.attachmentComposer.comingSoon"),
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
          attachDisabled={!conversation.permissions.canUpload}
          uploadProgress={attachmentManager.state.progress?.overallPct ?? null}
          onFocus={() => {
            setContextCollapsed(true);
            trackEvent("message_composer_focused", { conversation_id: conversationId });
          }}
          onActivity={bumpActivity}
        />
      ) : null}
    </div>
  );
}

export default function ConversationPage() {
  return <ConversationPageInner />;
}
