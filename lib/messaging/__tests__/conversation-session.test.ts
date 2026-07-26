import assert from "node:assert/strict";
import test from "node:test";
import {
  isConversationScrollReady,
  isCurrentConversationResponse,
  sortConversationMessages,
} from "../conversation-session";

test("conversation scroll is enabled only for data loaded for the active route", () => {
  assert.equal(
    isConversationScrollReady({
      routeConversationId: "conversation-b",
      loadedConversationId: "conversation-a",
      renderedConversationId: "conversation-a",
      loading: false,
      messageConversationIds: ["conversation-a"],
    }),
    false,
  );
  assert.equal(
    isConversationScrollReady({
      routeConversationId: "conversation-b",
      loadedConversationId: "conversation-b",
      renderedConversationId: "conversation-b",
      loading: false,
      messageConversationIds: ["conversation-b", "conversation-b"],
    }),
    true,
  );
});

test("equal message counts cannot make stale conversation data scroll-ready", () => {
  const staleIds = ["conversation-a", "conversation-a"];
  const currentIds = ["conversation-b", "conversation-b"];
  assert.equal(staleIds.length, currentIds.length);
  assert.equal(
    isConversationScrollReady({
      routeConversationId: "conversation-b",
      loadedConversationId: "conversation-a",
      renderedConversationId: "conversation-a",
      loading: false,
      messageConversationIds: staleIds,
    }),
    false,
  );
});

test("late conversation responses are rejected by route and request sequence", () => {
  assert.equal(
    isCurrentConversationResponse("conversation-a", "conversation-b", 1, 2),
    false,
  );
  assert.equal(
    isCurrentConversationResponse("conversation-b", "conversation-b", 1, 2),
    false,
  );
  assert.equal(
    isCurrentConversationResponse("conversation-b", "conversation-b", 2, 2),
    true,
  );
});

test("initial API messages are normalized into ascending timeline order", () => {
  assert.deepEqual(
    sortConversationMessages([
      { id: "newest", conversationSequence: 3 },
      { id: "oldest", conversationSequence: 1 },
      { id: "middle", conversationSequence: 2 },
    ]).map((message) => message.id),
    ["oldest", "middle", "newest"],
  );
});
