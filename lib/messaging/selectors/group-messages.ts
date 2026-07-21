import type { MessageDto } from "../messages-api";

const GROUP_WINDOW_MS = 2 * 60 * 1000;

export interface MessageGroup {
  senderId: string | null;
  isOwn: boolean;
  messages: MessageDto[];
  showAvatar: boolean;
  showTimestamp: boolean;
  showStatus: boolean;
}

function messageTime(m: MessageDto): number {
  const iso = m.sentAt ?? m.createdAt;
  return iso ? new Date(iso).getTime() : 0;
}

/**
 * Groups consecutive messages from the same sender within ~2 minutes.
 * Port this algorithm to Flutter for parity.
 */
export function selectGroupedMessages(messages: MessageDto[]): MessageGroup[] {
  if (messages.length === 0) return [];

  const groups: MessageGroup[] = [];
  let current: MessageGroup | null = null;

  for (const message of messages) {
    const isTextLike = message.type === "TEXT";
    if (!isTextLike) {
      if (current) groups.push(current);
      current = null;
      groups.push({
        senderId: message.senderId,
        isOwn: message.isOwn,
        messages: [message],
        showAvatar: !message.isOwn,
        showTimestamp: true,
        showStatus: message.isOwn,
      });
      continue;
    }

    const sameSender =
      current &&
      current.isOwn === message.isOwn &&
      current.senderId === message.senderId;
    const withinWindow =
      current &&
      messageTime(message) - messageTime(current.messages[current.messages.length - 1]) <=
        GROUP_WINDOW_MS;

    if (current && sameSender && withinWindow) {
      current.messages.push(message);
    } else {
      if (current) groups.push(current);
      current = {
        senderId: message.senderId,
        isOwn: message.isOwn,
        messages: [message],
        showAvatar: !message.isOwn,
        showTimestamp: true,
        showStatus: message.isOwn,
      };
    }
  }

  if (current) groups.push(current);

  for (let i = 0; i < groups.length; i++) {
    const g = groups[i];
    const prev = groups[i - 1];
    if (!g.isOwn && prev && !prev.isOwn && prev.senderId === g.senderId) {
      g.showAvatar = false;
    }
  }

  return groups;
}
