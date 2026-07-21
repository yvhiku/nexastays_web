import { useCallback, useRef, useState } from "react";
import {
  uploadAttachment,
  sendMessageWithAttachments,
  type AttachmentDto,
  type MessageDto,
} from "./messages-api";
import { createClientMessageId, buildOptimisticMessage } from "./offline-queue";

export interface UploadQueueItem {
  id: string;
  file: File;
  progress: number;
  status: "queued" | "uploading" | "ready" | "failed";
  attachment?: AttachmentDto;
  error?: string;
}

export function useUploadQueue(
  conversationId: string,
  token: string | null,
  onMessageSent?: (message: MessageDto) => void,
) {
  const [items, setItems] = useState<UploadQueueItem[]>([]);
  const processingRef = useRef(false);

  const compressImage = useCallback(async (file: File): Promise<File> => {
    if (!file.type.startsWith("image/") || file.size < 400_000) return file;
    try {
      const bitmap = await createImageBitmap(file);
      const maxDim = 1600;
      const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return file;
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.85),
      );
      if (!blob) return file;
      return new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" });
    } catch {
      return file;
    }
  }, []);

  const processQueue = useCallback(async () => {
    if (processingRef.current || !token) return;
    processingRef.current = true;
    try {
      while (true) {
        let nextItem: UploadQueueItem | undefined;
        setItems((prev) => {
          nextItem = prev.find((i) => i.status === "queued");
          if (!nextItem) return prev;
          return prev.map((x) =>
            x.id === nextItem!.id ? { ...x, status: "uploading", progress: 0 } : x,
          );
        });
        if (!nextItem) break;

        const item = nextItem;
        const clientMessageId = createClientMessageId();
        const previewUrl = item.file.type.startsWith("image/")
          ? URL.createObjectURL(item.file)
          : undefined;

        try {
          const compressed = await compressImage(item.file);
          const attachment = await uploadAttachment(conversationId, compressed, token, (pct) => {
            setItems((prev) =>
              prev.map((x) => (x.id === item.id ? { ...x, progress: pct } : x)),
            );
          });
          setItems((prev) =>
            prev.map((x) =>
              x.id === item.id ? { ...x, status: "ready", attachment, progress: 100 } : x,
            ),
          );

          const type = compressed.type.startsWith("image/") ? "IMAGE" : "FILE";
          const message = await sendMessageWithAttachments(
            conversationId,
            type,
            [attachment.id],
            token,
            undefined,
            clientMessageId,
          );
          if (previewUrl) URL.revokeObjectURL(previewUrl);
          onMessageSent?.(message);
          setItems((prev) => prev.filter((x) => x.id !== item.id));
        } catch (e) {
          if (previewUrl) URL.revokeObjectURL(previewUrl);
          setItems((prev) =>
            prev.map((x) =>
              x.id === item.id
                ? { ...x, status: "failed", error: e instanceof Error ? e.message : "Upload failed" }
                : x,
            ),
          );
          break;
        }
      }
    } finally {
      processingRef.current = false;
    }
  }, [token, conversationId, compressImage, onMessageSent]);

  const enqueueFiles = useCallback(
    (files: FileList | File[]) => {
      const list = Array.from(files).map((file) => ({
        id: createClientMessageId(),
        file,
        progress: 0,
        status: "queued" as const,
      }));
      setItems((prev) => [...prev, ...list]);
      setTimeout(() => void processQueue(), 0);
    },
    [processQueue],
  );

  const activeProgress =
    items.find((i) => i.status === "uploading")?.progress ??
    (items.some((i) => i.status === "queued") ? 0 : null);

  return { items, enqueueFiles, activeProgress, retry: processQueue };
}

export function buildOptimisticMediaMessage(
  conversationId: string,
  clientMessageId: string,
  senderId: string | null,
  type: "IMAGE" | "FILE",
  previewUrl?: string,
): MessageDto {
  const base = buildOptimisticMessage(conversationId, type === "IMAGE" ? "Photo" : "File", clientMessageId, senderId);
  return {
    ...base,
    type,
    payload: { attachmentIds: [], caption: undefined },
    attachments: previewUrl
      ? [
          {
            id: `optimistic_att_${clientMessageId}`,
            status: "PROCESSING",
            mime: type === "IMAGE" ? "image/jpeg" : "application/pdf",
            sizeBytes: null,
            width: null,
            height: null,
            blurhash: null,
            originalFilename: null,
            thumbnail: { url: previewUrl, version: 1, expiresAt: new Date(Date.now() + 3600000).toISOString() },
            full: null,
          },
        ]
      : [],
  };
}
