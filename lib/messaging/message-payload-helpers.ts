import type { MessageDto, TimelineCardPayload } from "./message-normalize";

export function getMessageText(message: MessageDto): string {
  if ("text" in message.payload) return message.payload.text;
  if ("caption" in message.payload) return message.payload.caption ?? "";
  if ("title" in message.payload) return message.payload.title;
  return message.body ?? "";
}

export function getCardPayload(message: MessageDto): TimelineCardPayload | null {
  if ("kind" in message.payload) return message.payload;
  const meta = message.metadata as Partial<TimelineCardPayload>;
  if (meta?.kind) {
    return {
      kind: meta.kind,
      title: meta.title ?? "",
      body: meta.body,
      actions: meta.actions,
      snapshot: meta.snapshot,
    };
  }
  return null;
}

export function getAttachmentIds(message: MessageDto): string[] {
  if ("attachmentIds" in message.payload) return message.payload.attachmentIds;
  const meta = message.metadata as { attachment_ids?: string[] };
  return meta.attachment_ids ?? message.attachments?.map((a) => a.id) ?? [];
}

export function resolveMessageAttachments(message: MessageDto): MessageDto["attachments"] {
  if (message.attachments.length > 0) return message.attachments;
  if ("attachments" in message.payload && message.payload.attachments?.length) {
    return message.payload.attachments;
  }
  return [];
}

export function collapseDeliveryUi(state: string): "none" | "sent" | "read" {
  if (state === "READ") return "read";
  if (state === "DELIVERED" || state === "SENT" || state === "PERSISTED") return "sent";
  return "none";
}
