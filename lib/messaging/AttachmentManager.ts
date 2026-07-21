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
}

function isImageFile(file: File): boolean {
  return file.type.startsWith("image/") || /\.(heic|heif)$/i.test(file.name);
}

function revokePreviews(items: StagedItem[]): void {
  for (const item of items) {
    if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
  }
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
          crop: item.crop,
          rotation: item.rotation,
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
          setError("Some uploads failed. Tap retry.");
          setIsSending(false);
          setActiveUploadClientId(null);
          return;
        }

        await completeAttachmentSession(sessionId, token);
        const doneProgress: UploadProgress = {
          overallPct: 100,
          completedCount: total,
          totalCount: total,
          label: `${total} / ${total} uploaded`,
        };
        setProgress(doneProgress);
        callbacks.onUploadProgress?.(clientMessageId, doneProgress);

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
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Send failed";
        trackEvent("upload_failed", { conversation_id: conversationId });
        callbacks.onSendFailed?.(clientMessageId, msg);
        if (sessionRef.current) {
          try {
            await abandonAttachmentSession(sessionRef.current, token);
            trackEvent("session_abandoned", {
              conversation_id: conversationId,
              session_id: sessionRef.current,
            });
          } catch {
            /* ignore */
          }
          sessionRef.current = null;
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
    };
    activeSendRef.current = sendSnapshot;

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
  };
}
