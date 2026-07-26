import type {
  AttachmentDto,
  MessageDto,
} from "@/lib/messaging/messages-api";

export type MediaCategory = "all" | "photo" | "file" | "voice" | "link";

export type MediaItem = {
  id: string;
  category: Exclude<MediaCategory, "all">;
  attachment?: AttachmentDto;
  url?: string;
  label: string;
  createdAt: string;
  senderLabel?: string;
};

const URL_PATTERN = /https?:\/\/[^\s<>"']+/gi;

export function attachmentCategory(
  attachment: AttachmentDto,
): "photo" | "file" | "voice" {
  const mime = attachment.mime?.toLowerCase() ?? "";
  if (mime.startsWith("image/")) return "photo";
  if (mime.startsWith("audio/")) return "voice";
  return "file";
}

export function buildMediaItems(
  messages: MessageDto[],
  counterpartName?: string,
): MediaItem[] {
  const items: MediaItem[] = [];
  const seenLinks = new Set<string>();

  for (const message of messages) {
    const senderLabel = message.isOwn ? undefined : counterpartName;
    for (const attachment of message.attachments ?? []) {
      items.push({
        id: `${message.id}:${attachment.id}`,
        category: attachmentCategory(attachment),
        attachment,
        label: attachment.originalFilename ?? "Attachment",
        createdAt: message.sentAt ?? message.createdAt,
        senderLabel,
      });
    }

    const text =
      message.type === "TEXT"
        ? message.body ??
          ("text" in message.payload ? message.payload.text : "")
        : "";
    for (const rawUrl of text.match(URL_PATTERN) ?? []) {
      const url = rawUrl.replace(/[),.;!?]+$/, "");
      if (seenLinks.has(url)) continue;
      seenLinks.add(url);
      items.push({
        id: `${message.id}:link:${items.length}`,
        category: "link",
        url,
        label: safeHostname(url),
        createdAt: message.sentAt ?? message.createdAt,
        senderLabel,
      });
    }
  }

  return items.sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
}

export function safeHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function fileExtension(item: MediaItem): string {
  const filename = item.attachment?.originalFilename ?? "";
  const extension = filename.includes(".") ? filename.split(".").pop() : "";
  return extension && extension.length <= 6 ? extension.toUpperCase() : "FILE";
}
