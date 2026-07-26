import type { ConversationListItem } from "../messages-api";
import type { OptimisticInboxEntry } from "../inbox-optimistic";

export type ConversationSectionId =
  | "unread"
  | "today"
  | "yesterday"
  | "earlier"
  | "archived";

export type ConversationSection = {
  id: ConversationSectionId;
  items: ConversationListItem[];
};

function activityAt(
  item: ConversationListItem,
  optimistic: Record<string, OptimisticInboxEntry>,
): number {
  return (
    optimistic[item.conversation.id]?.at ??
    (item.lastMessage.at ? new Date(item.lastMessage.at).getTime() : 0)
  );
}

function dayStart(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export function groupConversations(
  items: ConversationListItem[],
  optimistic: Record<string, OptimisticInboxEntry>,
  now = new Date(),
): ConversationSection[] {
  const todayStart = dayStart(now);
  const yesterdayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - 1,
  ).getTime();
  const sections = new Map<ConversationSectionId, ConversationListItem[]>([
    ["unread", []],
    ["today", []],
    ["yesterday", []],
    ["earlier", []],
    ["archived", []],
  ]);

  for (const item of items) {
    if (
      item.conversation.visibility === "ARCHIVED" ||
      item.conversation.messagingState === "ARCHIVED"
    ) {
      sections.get("archived")!.push(item);
      continue;
    }
    if (item.sync.unreadCount > 0) {
      sections.get("unread")!.push(item);
      continue;
    }
    const timestamp = activityAt(item, optimistic);
    const id: ConversationSectionId =
      timestamp >= todayStart
        ? "today"
        : timestamp >= yesterdayStart
          ? "yesterday"
          : "earlier";
    sections.get(id)!.push(item);
  }

  return (["unread", "today", "yesterday", "earlier", "archived"] as const)
    .map((id) => ({
      id,
      items: sections
        .get(id)!
        .sort(
          (a, b) =>
            activityAt(b, optimistic) - activityAt(a, optimistic),
        ),
    }))
    .filter((section) => section.items.length > 0);
}
