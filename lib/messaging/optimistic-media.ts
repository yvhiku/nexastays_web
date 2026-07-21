import type { MessageDto } from "./message-normalize";
import type { CropArea } from "./image-pipeline";

export type MediaUploadState = "uploading" | "failed" | "complete";

export interface MediaUploadMeta {
  uploadState: MediaUploadState;
  uploadProgress: number;
  uploadLabel?: string;
  uploadError?: string;
}

export interface OptimisticPreview {
  id: string;
  previewUrl: string;
  mime: string;
  originalFilename: string;
}

export function getMediaUploadMeta(message: MessageDto): MediaUploadMeta | null {
  const meta = message.metadata as Partial<MediaUploadMeta & { upload_state?: MediaUploadState }>;
  const state = meta.uploadState ?? meta.upload_state;
  if (!state) return null;
  return {
    uploadState: state,
    uploadProgress: meta.uploadProgress ?? 0,
    uploadLabel: meta.uploadLabel,
    uploadError: meta.uploadError,
  };
}

export function buildOptimisticMediaMessage(
  conversationId: string,
  clientMessageId: string,
  senderId: string | null,
  type: "IMAGE" | "FILE",
  caption: string | undefined,
  previews: OptimisticPreview[],
  uploadMeta?: Partial<MediaUploadMeta>,
): MessageDto {
  const now = new Date().toISOString();
  const attachments = previews.map((p) => ({
    id: p.id,
    status: "UPLOADING" as const,
    mime: p.mime,
    sizeBytes: null,
    width: null,
    height: null,
    blurhash: null,
    originalFilename: p.originalFilename,
    thumbnail: {
      url: p.previewUrl,
      version: 1,
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    },
    full: null,
  }));

  return {
    id: `optimistic_${clientMessageId}`,
    conversationId,
    conversationSequence: Number.MAX_SAFE_INTEGER,
    senderId,
    type,
    body: caption ?? null,
    metadata: {
      source: "USER",
      schemaVersion: 1,
      cardVersion: 1,
      presentationVersion: 1,
      caption,
      uploadState: uploadMeta?.uploadState ?? "uploading",
      uploadProgress: uploadMeta?.uploadProgress ?? 0,
      uploadLabel: uploadMeta?.uploadLabel,
      uploadError: uploadMeta?.uploadError,
    },
    payload: {
      attachmentIds: [],
      caption,
      attachments,
    },
    status: "PENDING",
    deliveryState: "PENDING",
    sentAt: null,
    deliveredAt: null,
    readAt: null,
    isSystem: false,
    clientMessageId,
    createdAt: now,
    isOwn: true,
    presentationVersion: 1,
    attachments,
  };
}

export function patchOptimisticUploadMeta(
  message: MessageDto,
  patch: Partial<MediaUploadMeta>,
): MessageDto {
  return {
    ...message,
    metadata: { ...message.metadata, ...patch },
  };
}

export type { CropArea };
