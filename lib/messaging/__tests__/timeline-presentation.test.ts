import assert from "node:assert/strict";
import test from "node:test";
import { normalizeMessageDto, type MessageDto } from "../message-normalize";
import {
  isBookingSummarySource,
  selectTimelinePresentation,
} from "../selectors/timeline-presentation";

function message(
  id: string,
  type: string,
  sequence: number,
  body: string | null = null,
): MessageDto {
  return normalizeMessageDto({
    id,
    conversationId: "conversation-1",
    conversationSequence: sequence,
    senderId: type === "TEXT" ? "guest-1" : null,
    type,
    body,
    metadata: {},
    isSystem: type.startsWith("SYSTEM"),
    createdAt: `2026-07-2${sequence}T12:00:00.000Z`,
  });
}

test("collapses fragmented booking, property, and location events into one summary", () => {
  const messages = [
    message("booking", "BOOKING_CARD", 1),
    message("property", "PROPERTY_CARD", 2),
    message("location", "LOCATION_CARD", 3),
    message("text", "TEXT", 4, "See you soon"),
  ];

  const items = selectTimelinePresentation(messages);

  assert.equal(items.length, 2);
  assert.equal(items[0]?.kind, "booking-summary");
  if (items[0]?.kind === "booking-summary") {
    assert.equal(items[0].message.id, "booking");
    assert.deepEqual(
      items[0].sourceMessages.map((source) => source.id),
      ["booking", "property", "location"],
    );
  }
  assert.equal(items[1]?.kind, "message");
  assert.equal(items[1]?.message.id, "text");
});

test("keeps check-in and unrelated lifecycle milestones independent", () => {
  const messages = [
    message("booking", "BOOKING_CARD", 1),
    message("checkin", "CHECKIN_CARD", 2),
    message("payment", "PAYMENT_CARD", 3),
  ];

  const items = selectTimelinePresentation(messages);

  assert.deepEqual(
    items.map((item) => [item.kind, item.message.id]),
    [
      ["booking-summary", "booking"],
      ["message", "checkin"],
      ["message", "payment"],
    ],
  );
});

test("recognizes confirmed reservation system events but not general updates", () => {
  const confirmed = message(
    "confirmed",
    "SYSTEM_EVENT",
    1,
    "Reservation confirmed",
  );
  const general = message(
    "general",
    "SYSTEM_EVENT",
    2,
    "The host shared an update",
  );

  assert.equal(isBookingSummarySource(confirmed), true);
  assert.equal(isBookingSummarySource(general), false);
});

test("does not mutate the source timeline", () => {
  const messages = [
    message("booking", "BOOKING_CARD", 1),
    message("property", "PROPERTY_CARD", 2),
  ];
  const before = messages.map((entry) => entry.id);

  selectTimelinePresentation(messages);

  assert.deepEqual(messages.map((entry) => entry.id), before);
});
