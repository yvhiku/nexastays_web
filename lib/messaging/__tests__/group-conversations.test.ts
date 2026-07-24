import assert from "node:assert/strict";
import test from "node:test";
import type { ConversationListItem } from "../messages-api";
import { groupConversations } from "../selectors/group-conversations";

function item(id: string, at: string, unread = 0): ConversationListItem {
  return {
    conversation: {
      id,
      type: "BOOKING",
      bookingId: null,
      listingId: null,
      messagingState: "ACTIVE",
      visibility: "ACTIVE",
    },
    presentation: {} as ConversationListItem["presentation"],
    sync: {
      conversationVersion: 1,
      snapshotVersion: 1,
      lastMessageId: null,
      unreadCount: unread,
      lastReadPointer: { messageId: null, readAt: null },
    },
    lastMessage: { preview: "Message", at },
    permissions: {} as ConversationListItem["permissions"],
  };
}

test("groups unread first without duplicating conversations", () => {
  const sections = groupConversations(
    [
      item("today", "2026-07-24T12:00:00Z"),
      item("unread-old", "2026-07-20T12:00:00Z", 2),
      item("yesterday", "2026-07-23T12:00:00Z"),
    ],
    {},
    new Date("2026-07-24T15:00:00Z"),
  );
  assert.deepEqual(
    sections.map((section) => section.id),
    ["unread", "today", "yesterday"],
  );
  assert.equal(
    new Set(sections.flatMap((section) => section.items.map((entry) => entry.conversation.id))).size,
    3,
  );
});

test("optimistic activity moves a read conversation into today", () => {
  const now = new Date("2026-07-24T15:00:00Z");
  const sections = groupConversations(
    [item("active-draft", "2026-07-20T12:00:00Z")],
    {
      "active-draft": {
        at: now.getTime() - 1_000,
        preview: "Sending…",
      },
    },
    now,
  );
  assert.equal(sections[0]?.id, "today");
  assert.equal(sections[0]?.items[0]?.conversation.id, "active-draft");
});

test("sorts each section by latest effective activity", () => {
  const sections = groupConversations(
    [
      item("older", "2026-07-24T09:00:00Z"),
      item("newer", "2026-07-24T12:00:00Z"),
    ],
    {},
    new Date("2026-07-24T15:00:00Z"),
  );
  assert.deepEqual(
    sections[0]?.items.map((entry) => entry.conversation.id),
    ["newer", "older"],
  );
});
