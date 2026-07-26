import assert from "node:assert/strict";
import test from "node:test";
import { parseSseFrames } from "../realtime-stream";

test("parses conversation events and preserves partial frames", () => {
    const event = JSON.stringify({
      type: "conversation.changed",
      conversationId: "conversation-1",
      reason: "MESSAGE_DELIVERED",
      emittedAt: "2026-07-25T12:00:00.000Z",
    });
    const parsed = parseSseFrames(
      `event: conversation.changed\ndata: ${event}\n\ndata: {"type":"conversation`,
    );

  assert.equal(parsed.events.length, 1);
  assert.equal(parsed.events[0]?.conversationId, "conversation-1");
  assert.equal(parsed.events[0]?.reason, "MESSAGE_DELIVERED");
  assert.equal(parsed.remainder, 'data: {"type":"conversation');
});

test("ignores heartbeat and malformed events", () => {
  const parsed = parseSseFrames(
    'event: heartbeat\ndata: {"type":"heartbeat"}\n\ndata: not-json\n\n',
  );
  assert.deepEqual(parsed.events, []);
  assert.equal(parsed.remainder, "");
});
