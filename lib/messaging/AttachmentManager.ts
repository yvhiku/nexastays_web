"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import {
  batchMessageType,
  fileDedupKey,
  processImageFile,
  validateAttachmentBatch,
  type CropArea,
} from "./image-pipeline";
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
}

function isImageFile(file: File): boolean {
  return (
    file.type.startsWith("image/") ||
    /\.(heic|heif)$/i.test(file.name)
  );
}

export function useAttachmentManager(
  conversationId: string,
  token: string | null,
  onMessageSent?: (message: MessageDto) => void,
) {
  const [items, setItems] = useState<StagedItem[]>([]);
  const [caption, setCaption] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const sessionRef = useRef<string | null>(null);

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

  const closeComposer = useCallback(() => {
    setItems((prev) => {
      prev.forEach((i) => {
        if (i.previewUrl) URL.revokeObjectURL(i.previewUrl);
      });
      return [];
    });
    setCaption("");
    setIsOpen(false);
    setProgress(null);
    setError(null);
    sessionRef.current = null;
  }, []);

  const uploadOne = useCallback(
    async (sessionId: string, item: StagedItem, index: number, total: number) => {
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
          setProgress({
            overallPct: Math.round(((index + pct / 100) / total) * 100),
            completedCount: index,
            totalCount: total,
            label: `${index + (pct >= 100 ? 1 : 0)} / ${total} uploaded`,
          });
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
      trackEvent("upload_success", { conversation_id: conversationId, attachment_id: attachment.id });
      return attachment;
    },
    [conversationId, token],
  );

  const sendBatch = useCallback(async () => {
    if (!token || isSending || items.length === 0) return;

    const files = items.map((i) => i.file);
    const validationError = validateAttachmentBatch(files);
    if (validationError) {
      setError(validationError);
      return;
    }

    const messageType = batchMessageType(files);
    if (!messageType) {
      setError("Unsupported attachment batch");
      return;
    }

    trackEvent("send_clicked", { conversation_id: conversationId, count: items.length });
    setIsSending(true);
    setError(null);
    setProgress({ overallPct: 0, completedCount: 0, totalCount: items.length, label: "0 / " + items.length + " uploaded" });

    let sessionId = sessionRef.current;
    try {
      if (!sessionId) {
        const session = await createAttachmentSession(conversationId, token);
        sessionId = session.id;
        sessionRef.current = sessionId;
        trackEvent("session_created", { conversation_id: conversationId, session_id: sessionId });
      }

      const pending = items.filter((i) => i.status !== "done" || !i.attachment);
      const total = items.length;

      const uploadResults = await Promise.allSettled(
        pending.map((item, idx) => uploadOne(sessionId!, item, idx, total)),
      );

      const failed = uploadResults.filter((r) => r.status === "rejected");
      if (failed.length) {
        pending.forEach((item, idx) => {
          if (uploadResults[idx]?.status === "rejected") {
            const reason = (uploadResults[idx] as PromiseRejectedResult).reason;
            setItems((prev) =>
              prev.map((i) =>
                i.id === item.id
                  ? {
                      ...i,
                      status: "failed",
                      error: reason instanceof Error ? reason.message : "Upload failed",
                    }
                  : i,
              ),
            );
          }
        });
        trackEvent("upload_failed", { conversation_id: conversationId, count: failed.length });
        setError("Some uploads failed. Tap retry on failed items.");
        setIsSending(false);
        return;
      }

      await completeAttachmentSession(sessionId, token);
      setProgress((p) => (p ? { ...p, overallPct: 100, completedCount: total } : p));

      const clientMessageId = createClientMessageId();
      const message = await sendMessageWithSession(
        conversationId,
        messageType,
        sessionId,
        token,
        caption.trim() || undefined,
        clientMessageId,
      );

      onMessageSent?.(message);
      closeComposer();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Send failed";
      setError(msg);
      trackEvent("upload_failed", { conversation_id: conversationId });
      if (sessionRef.current) {
        try {
          await abandonAttachmentSession(sessionRef.current, token);
        } catch {
          /* ignore */
        }
        sessionRef.current = null;
      }
    } finally {
      setIsSending(false);
      setProgress(null);
    }
  }, [
    token,
    isSending,
    items,
    conversationId,
    caption,
    uploadOne,
    onMessageSent,
    closeComposer,
  ]);

  const retryFailed = useCallback(async () => {
    trackEvent("retry_upload", { conversation_id: conversationId });
    setItems((prev) =>
      prev.map((i) => (i.status === "failed" ? { ...i, status: "queued", error: undefined } : i)),
    );
    await sendBatch();
  }, [conversationId, sendBatch]);

  const state: AttachmentManagerState = useMemo(
    () => ({ items, caption, isOpen, isSending, progress, error }),
    [items, caption, isOpen, isSending, progress, error],
  );

  return {
    state,
    stageFiles,
    removeItem,
    updateItemCrop,
    rotateItem,
    setCaption,
    sendBatch,
    retryFailed,
    closeComposer,
  };
}
