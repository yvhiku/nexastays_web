"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import {
  ATTACHMENT_DRAFT_VERSION,
  clearAttachmentDraft,
  saveAttachmentDraft,
  type AttachmentDraftFileMeta,
} from "./attachment-drafts-db";
import {
  batchMessageType,
  fileDedupKey,
  processImageFile,
  validateAttachmentBatch,
  type CropArea,
} from "./image-pipeline";
import {
  buildOptimisticMediaMessage,
  patchOptimisticUploadMeta,
  type OptimisticPreview,
} from "./optimistic-media";
import {
  abandonAttachmentSession,
  completeAttachmentSession,
  createAttachmentSession,
  sendMessageWithSession,
  uploadToAttachmentSession,
  type AttachmentDto,
  type MessageDto,
} from "./messages-api";
import {
  clearPendingUpload,
  loadPendingUpload,
  savePendingUpload,
  PENDING_UPLOAD_VERSION,
  type PendingUploadFileMeta,
} from "./pending-upload-store";
import { createClientMessageId } from "./offline-queue";

export type QueueItemStatus =
  | "queued"
  | "processing"
  | "uploading"
  | "done"
  | "failed"
  | "cancelled";

export interface StagedItem {
  id: string;
  file: File;
  kind: "image" | "file";
  previewUrl: string;
  status: QueueItemStatus;
  progress: number;
  crop?: CropArea;
  rotation: number;
  error?: string;
  attachment?: AttachmentDto;
}

export interface UploadProgress {
  overallPct: number;
  completedCount: number;
  totalCount: number;
  label: string;
}

export interface AttachmentManagerState {
  items: StagedItem[];
  caption: string;
  isOpen: boolean;
  isSending: boolean;
  progress: UploadProgress | null;
  error: string | null;
  activeUploadClientId: string | null;
}

export interface AttachmentManagerCallbacks {
  senderId?: string | null;
  onOptimisticMessage?: (message: MessageDto) => void;
  onUploadProgress?: (clientMessageId: string, progress: UploadProgress) => void;
  onMessageSent?: (message: MessageDto) => void;
  onSendFailed?: (clientMessageId: string, error: string) => void;
}

interface ActiveSend {
  clientMessageId: string;
  caption: string;
  items: StagedItem[];
  messageType: "IMAGE" | "FILE";
  sessionId: string | null;
  uploadPhase: "uploading" | "ready" | "sending";
}

function isImageFile(file: File): boolean {
  return file.type.startsWith("image/") || /\.(heic|heif)$/i.test(file.name);
}

function revokePreviews(items: StagedItem[]): void {
  for (const item of items) {
    if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
  }
}

async function persistActiveSend(conversationId: string, send: ActiveSend): Promise<void> {
  const blobs = new Map<string, Blob>();
  const files: PendingUploadFileMeta[] = send.items.map((item) => {
    const blobKey = `pending_${conversationId}_${item.id}`;
    blobs.set(blobKey, item.file);
    return {
      id: item.id,
      name: item.file.name,
      mime: item.file.type,
      size: item.file.size,
      lastModified: item.file.lastModified,
      kind: item.kind,
      rotation: item.rotation,
      crop: item.crop,
      blobKey,
      status: item.status === "cancelled" ? "queued" : item.status,
      attachmentId: item.attachment?.id,
    };
  });
  await savePendingUpload(
    {
      version: PENDING_UPLOAD_VERSION,
      conversationId,
      clientMessageId: send.clientMessageId,
      sessionId: send.sessionId,
      caption: send.caption,
      messageType: send.messageType,
      updatedAt: Date.now(),
      files,
    },
    blobs,
  );
}

function rebuildSendFromPending(
  record: Awaited<ReturnType<typeof loadPendingUpload>>,
): ActiveSend | null {
  if (!record) return null;
  const items: StagedItem[] = record.record.files.flatMap((meta) => {
    const blob = record.blobs.get(meta.blobKey);
    if (!blob) return [];
    const file = new File([blob], meta.name, {
      type: meta.mime || (meta.kind === "image" ? "image/jpeg" : "application/pdf"),
      lastModified: meta.lastModified,
    });
    return [
      {
        id: meta.id,
        file,
        kind: meta.kind,
        previewUrl: meta.kind === "image" ? URL.createObjectURL(file) : "",
        status: meta.status,
        progress: meta.status === "done" ? 100 : 0,
        rotation: meta.rotation,
        crop: meta.crop,
        attachment: meta.attachmentId ? { id: meta.attachmentId } as AttachmentDto : undefined,
      },
    ];
  });
  if (!items.length) return null;
  return {
    clientMessageId: record.record.clientMessageId,
    caption: record.record.caption,
    items,
    messageType: record.record.messageType,
    sessionId: record.record.sessionId,
    uploadPhase: items.every((i) => i.status === "done") ? "ready" : "uploading",
  };
}

export function useAttachmentManager(
  conversationId: string,
  token: string | null,
  callbacks: AttachmentManagerCallbacks = {},
) {
  const [items, setItems] = useState<StagedItem[]>([]);
  const [caption, setCaption] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeUploadClientId, setActiveUploadClientId] = useState<string | null>(null);

  const sessionRef = useRef<string | null>(null);
  const activeSendRef = useRef<ActiveSend | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resumeCheckedRef = useRef(false);

  const persistDraft = useCallback(async (draftItems: StagedItem[], draftCaption: string) => {
    if (!draftItems.length) {
      await clearAttachmentDraft(conversationId).catch(() => undefined);
      return;
    }
    const draftType = draftItems.every((i) => i.kind === "image") ? "image" : "file";
    const blobs = new Map<string, Blob>();
    const files: AttachmentDraftFileMeta[] = draftItems.map((item) => {
      const blobKey = `${conversationId}_${item.id}`;
      blobs.set(blobKey, item.file);
      return {
        id: item.id,
        name: item.file.name,
        mime: item.file.type,
        size: item.file.size,
        lastModified: item.file.lastModified,
        kind: item.kind,
        rotation: item.rotation,
        crop: item.crop,
        blobKey,
      };
    });
    await saveAttachmentDraft(
      {
        draftVersion: ATTACHMENT_DRAFT_VERSION,
        conversationId,
        draftType,
        caption: draftCaption,
        updatedAt: Date.now(),
        files,
      },
      blobs,
    ).catch(() => undefined);
  }, [conversationId]);

  useEffect(() => {
    if (!isOpen || !items.length) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      void persistDraft(items, caption);
    }, 500);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [isOpen, items, caption, persistDraft]);

  const stageFiles = useCallback((files: FileList | File[]) => {
    const incoming = Array.from(files);
    const validationError = validateAttachmentBatch(incoming);
    if (validationError) {
      setError(validationError);
      return;
    }

    trackEvent("attachment_selected", {
      conversation_id: conversationId,
      count: incoming.length,
    });

    setItems((prev) => {
      const existing = new Set(prev.map((i) => fileDedupKey(i.file)));
      const next = [...prev];
      for (const file of incoming) {
        const key = fileDedupKey(file);
        if (existing.has(key)) continue;
        existing.add(key);
        next.push({
          id: createClientMessageId(),
          file,
          kind: isImageFile(file) ? "image" : "file",
          previewUrl: isImageFile(file) ? URL.createObjectURL(file) : "",
          status: "queued",
          progress: 0,
          rotation: 0,
        });
      }
      return next;
    });
    setError(null);
    setIsOpen(true);
    trackEvent("composer_opened", { conversation_id: conversationId });
  }, [conversationId]);

  const restoreFromDraft = useCallback(
    (
      draftItems: Array<{
        id: string;
        file: File;
        kind: "image" | "file";
        rotation: number;
        crop?: CropArea;
      }>,
      draftCaption: string,
    ) => {
      const staged: StagedItem[] = draftItems.map((d) => ({
        id: d.id,
        file: d.file,
        kind: d.kind,
        previewUrl: d.kind === "image" ? URL.createObjectURL(d.file) : "",
        status: "queued",
        progress: 0,
        rotation: d.rotation,
        crop: d.crop,
      }));
      setItems(staged);
      setCaption(draftCaption);
      setIsOpen(true);
      setError(null);
      trackEvent("draft_restored", { conversation_id: conversationId });
    },
    [conversationId],
  );

  const removeItem = useCallback((id: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  const updateItemCrop = useCallback((id: string, crop: CropArea, rotation: number) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, crop, rotation } : i)),
    );
    trackEvent("crop_used", { conversation_id: conversationId });
  }, [conversationId]);

  const rotateItem = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, rotation: (i.rotation + 90) % 360 } : i,
      ),
    );
    trackEvent("rotate_used", { conversation_id: conversationId });
  }, [conversationId]);

  const hideComposer = useCallback(() => {
    setIsOpen(false);
    setProgress(null);
    setError(null);
  }, []);

  const closeComposer = useCallback(() => {
    if (items.length > 0) {
      trackEvent("cancel_upload", { conversation_id: conversationId, count: items.length });
    }
    revokePreviews(items);
    setItems([]);
    setCaption("");
    hideComposer();
    sessionRef.current = null;
    void clearAttachmentDraft(conversationId).catch(() => undefined);
  }, [items, hideComposer, conversationId]);

  const uploadOne = useCallback(
    async (
      sessionId: string,
      item: StagedItem,
      index: number,
      total: number,
      clientMessageId: string,
    ) => {
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, status: "processing", progress: 0 } : i,
        ),
      );

      let uploadFile = item.file;
      if (item.kind === "image") {
        const processed = await processImageFile(item.file, {
          rotation: item.rotation || undefined,
        });
        uploadFile = processed.file;
      }

      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, status: "uploading", progress: 0 } : i,
        ),
      );

      const attachment = await uploadToAttachmentSession(
        sessionId,
        uploadFile,
        token,
        (pct) => {
          const nextProgress: UploadProgress = {
            overallPct: Math.round(((index + pct / 100) / total) * 100),
            completedCount: index,
            totalCount: total,
            label: `${index + (pct >= 100 ? 1 : 0)} / ${total} uploaded`,
          };
          setProgress(nextProgress);
          callbacks.onUploadProgress?.(clientMessageId, nextProgress);
          setItems((prev) =>
            prev.map((i) => (i.id === item.id ? { ...i, progress: pct } : i)),
          );
        },
      );

      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? { ...i, status: "done", progress: 100, attachment }
            : i,
        ),
      );
      trackEvent("upload_success", {
        conversation_id: conversationId,
        attachment_id: attachment.id,
      });
      return attachment;
    },
    [conversationId, token, callbacks],
  );

  const executeSend = useCallback(
    async (send: ActiveSend) => {
      if (!token) return;

      const { clientMessageId, caption: sendCaption, items: sendItems, messageType } = send;

      if (send.uploadPhase === "ready" && send.sessionId) {
        setIsSending(true);
        setActiveUploadClientId(clientMessageId);
        try {
          send.uploadPhase = "sending";
          const message = await sendMessageWithSession(
            conversationId,
            messageType,
            send.sessionId,
            token,
            sendCaption.trim() || undefined,
            clientMessageId,
          );
          callbacks.onMessageSent?.(message);
          revokePreviews(sendItems);
          activeSendRef.current = null;
          sessionRef.current = null;
          await clearPendingUpload(conversationId).catch(() => undefined);
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Send failed";
          callbacks.onSendFailed?.(clientMessageId, msg);
          activeSendRef.current = send;
          await persistActiveSend(conversationId, send).catch(() => undefined);
        } finally {
          setIsSending(false);
          setActiveUploadClientId(null);
        }
        return;
      }

      setIsSending(true);
      setActiveUploadClientId(clientMessageId);
      setError(null);

      const total = sendItems.length;
      const initialProgress: UploadProgress = {
        overallPct: 0,
        completedCount: 0,
        totalCount: total,
        label: `0 / ${total} uploaded`,
      };
      setProgress(initialProgress);
      callbacks.onUploadProgress?.(clientMessageId, initialProgress);

      let sessionId = send.sessionId ?? sessionRef.current;
      try {
        if (!sessionId) {
          const session = await createAttachmentSession(conversationId, token);
          sessionId = session.id;
          sessionRef.current = sessionId;
          send.sessionId = sessionId;
          activeSendRef.current = send;
          trackEvent("session_created", {
            conversation_id: conversationId,
            session_id: sessionId,
          });
        }

        const pending = sendItems.filter((i) => i.status !== "done" || !i.attachment);
        const uploadResults = await Promise.allSettled(
          pending.map((item, idx) =>
            uploadOne(sessionId!, item, idx, total, clientMessageId),
          ),
        );

        const failed = uploadResults.filter((r) => r.status === "rejected");
        if (failed.length) {
          pending.forEach((item, idx) => {
            if (uploadResults[idx]?.status === "rejected") {
              const reason = (uploadResults[idx] as PromiseRejectedResult).reason;
              item.status = "failed";
              item.error =
                reason instanceof Error ? reason.message : "Upload failed";
            }
          });
          trackEvent("upload_failed", {
            conversation_id: conversationId,
            count: failed.length,
          });
          callbacks.onSendFailed?.(clientMessageId, "Some uploads failed");
          send.sessionId = sessionId;
          activeSendRef.current = send;
          await persistActiveSend(conversationId, send).catch(() => undefined);
          setError("Some uploads failed. Tap retry.");
          setIsSending(false);
          setActiveUploadClientId(null);
          return;
        }

        await completeAttachmentSession(sessionId, token);
        send.uploadPhase = "ready";
        await persistActiveSend(conversationId, send).catch(() => undefined);

        const doneProgress: UploadProgress = {
          overallPct: 100,
          completedCount: total,
          totalCount: total,
          label: `${total} / ${total} uploaded`,
        };
        setProgress(doneProgress);
        callbacks.onUploadProgress?.(clientMessageId, doneProgress);

        send.uploadPhase = "sending";
        const message = await sendMessageWithSession(
          conversationId,
          messageType,
          sessionId,
          token,
          sendCaption.trim() || undefined,
          clientMessageId,
        );

        callbacks.onMessageSent?.(message);
        revokePreviews(sendItems);
        activeSendRef.current = null;
        sessionRef.current = null;
        setItems([]);
        setCaption("");
        setProgress(null);
        await clearAttachmentDraft(conversationId).catch(() => undefined);
        await clearPendingUpload(conversationId).catch(() => undefined);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Send failed";
        trackEvent("upload_failed", { conversation_id: conversationId });
        callbacks.onSendFailed?.(clientMessageId, msg);

        const uploadsDone = sendItems.every((i) => i.status === "done" && i.attachment);
        if (uploadsDone) {
          send.uploadPhase = "ready";
          send.sessionId = sessionRef.current;
          activeSendRef.current = send;
          await persistActiveSend(conversationId, send).catch(() => undefined);
        } else if (sessionRef.current) {
          send.sessionId = sessionRef.current;
          activeSendRef.current = send;
          await persistActiveSend(conversationId, send).catch(() => undefined);
        }
        setError(msg);
      } finally {
        setIsSending(false);
        setActiveUploadClientId(null);
        setProgress(null);
      }
    },
    [token, conversationId, uploadOne, callbacks],
  );

  const sendBatch = useCallback(async () => {
    if (!token || isSending || items.length === 0) return null;

    const files = items.map((i) => i.file);
    const validationError = validateAttachmentBatch(files);
    if (validationError) {
      setError(validationError);
      return null;
    }

    const messageType = batchMessageType(files);
    if (!messageType) {
      setError("Unsupported attachment batch");
      return null;
    }

    trackEvent("send_clicked", { conversation_id: conversationId, count: items.length });

    const clientMessageId = createClientMessageId();
    const previews: OptimisticPreview[] = items.map((item) => ({
      id: `optimistic_att_${item.id}`,
      previewUrl: item.previewUrl || "",
      mime: item.file.type || (item.kind === "image" ? "image/jpeg" : "application/pdf"),
      originalFilename: item.file.name,
    }));

    const optimistic = buildOptimisticMediaMessage(
      conversationId,
      clientMessageId,
      callbacks.senderId ?? null,
      messageType,
      caption.trim() || undefined,
      previews,
      { uploadState: "uploading", uploadProgress: 0, uploadLabel: `0 / ${items.length} uploaded` },
    );
    callbacks.onOptimisticMessage?.(optimistic);

    const sendSnapshot: ActiveSend = {
      clientMessageId,
      caption,
      items: items.map((i) => ({ ...i })),
      messageType,
      sessionId: sessionRef.current,
      uploadPhase: "uploading",
    };
    activeSendRef.current = sendSnapshot;
    void persistActiveSend(conversationId, sendSnapshot).catch(() => undefined);

    void clearAttachmentDraft(conversationId).catch(() => undefined);
    hideComposer();

    void executeSend(sendSnapshot);
    return clientMessageId;
  }, [
    token,
    isSending,
    items,
    conversationId,
    caption,
    callbacks,
    hideComposer,
    executeSend,
  ]);

  const retryFailed = useCallback(async (clientMessageId?: string) => {
    trackEvent("retry_upload", { conversation_id: conversationId });
    const send = activeSendRef.current;
    if (!send || (clientMessageId && send.clientMessageId !== clientMessageId)) {
      if (items.some((i) => i.status === "failed")) {
        setItems((prev) =>
          prev.map((i) =>
            i.status === "failed" ? { ...i, status: "queued", error: undefined } : i,
          ),
        );
        await sendBatch();
      }
      return;
    }
    send.items.forEach((item) => {
      if (item.status === "failed") {
        item.status = "queued";
        item.error = undefined;
      }
    });
    await executeSend(send);
  }, [conversationId, items, sendBatch, executeSend]);

  const abandonPendingUpload = useCallback(async () => {
    const send = activeSendRef.current;
    if (send?.sessionId && token) {
      try {
        await abandonAttachmentSession(send.sessionId, token);
        trackEvent("session_abandoned", {
          conversation_id: conversationId,
          session_id: send.sessionId,
        });
      } catch {
        /* ignore */
      }
    }
    if (send) revokePreviews(send.items);
    activeSendRef.current = null;
    sessionRef.current = null;
    await clearPendingUpload(conversationId).catch(() => undefined);
  }, [conversationId, token]);

  const resumePendingUpload = useCallback(async (): Promise<boolean> => {
    if (!token || activeSendRef.current) return false;
    const pending = await loadPendingUpload(conversationId);
    const send = rebuildSendFromPending(pending);
    if (!send) return false;

    sessionRef.current = send.sessionId;
    activeSendRef.current = send;

    const previews: OptimisticPreview[] = send.items.map((item) => ({
      id: `optimistic_att_${item.id}`,
      previewUrl: item.previewUrl || "",
      mime: item.file.type || (item.kind === "image" ? "image/jpeg" : "application/pdf"),
      originalFilename: item.file.name,
    }));
    const optimistic = buildOptimisticMediaMessage(
      conversationId,
      send.clientMessageId,
      callbacks.senderId ?? null,
      send.messageType,
      send.caption.trim() || undefined,
      previews,
      {
        uploadState: send.uploadPhase === "ready" ? "uploading" : "uploading",
        uploadProgress: 0,
        uploadLabel: "Resuming upload…",
      },
    );
    callbacks.onOptimisticMessage?.(optimistic);
    trackEvent("retry_upload", { conversation_id: conversationId, resumed: true });
    void executeSend(send);
    return true;
  }, [token, conversationId, callbacks, executeSend]);

  useEffect(() => {
    if (!token || resumeCheckedRef.current) return;
    resumeCheckedRef.current = true;
    void resumePendingUpload();
  }, [token, resumePendingUpload]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState !== "visible") return;
      const send = activeSendRef.current;
      if (!send || !token) return;
      const needsRetry = send.items.some(
        (i) => i.status === "failed" || i.status === "uploading",
      );
      if (needsRetry || send.uploadPhase === "ready") {
        void executeSend(send);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [token, executeSend]);

  const state: AttachmentManagerState = useMemo(
    () => ({
      items,
      caption,
      isOpen,
      isSending,
      progress,
      error,
      activeUploadClientId,
    }),
    [items, caption, isOpen, isSending, progress, error, activeUploadClientId],
  );

  return {
    state,
    stageFiles,
    restoreFromDraft,
    removeItem,
    updateItemCrop,
    rotateItem,
    setCaption,
    sendBatch,
    retryFailed,
    closeComposer,
    hideComposer,
    abandonPendingUpload,
    resumePendingUpload,
  };
}
