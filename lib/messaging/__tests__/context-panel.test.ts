import assert from "node:assert/strict";
import test from "node:test";
import type { ConversationDetail, MessageDto } from "../messages-api";
import { deriveContextModules } from "../context-panel";

function detail(overrides: Partial<ConversationDetail> = {}): ConversationDetail {
  return {
    conversation: {
      id: "conversation-1",
      type: "BOOKING",
      bookingId: "booking-1",
      listingId: "listing-1",
      messagingState: "ACTIVE",
      visibility: "ACTIVE",
    },
    presentation: {
      title: "Host",
      subtitle: "Confirmed",
      avatar: null,
      bookingChip: "Stay",
      statusChip: "CONFIRMED",
      counterpart: { id: "host-1", displayName: "Host" },
      listing: { title: "Riad Atlas", city: "Marrakech" },
      reservation: {
        listingTitle: "Riad Atlas",
        listingId: "listing-1",
        coverMedia: null,
        addressDisplay: "Medina",
        city: "Marrakech",
        country: "MA",
        checkinDate: "2026-07-24",
        checkoutDate: "2026-07-26",
        guestCount: 2,
        bookingReference: "NX-1",
        bookingId: "booking-1",
      },
    },
    timeline: [],
    messages: [],
    permissions: {
      canSend: true,
      canUpload: true,
      canCall: false,
      canReport: true,
      canBlock: true,
      canReview: false,
      viewerRole: "guest",
      isReadOnly: false,
      canArchive: true,
      canDelete: false,
      notificationLevel: "ALL",
    },
    sync: {
      conversationVersion: 1,
      snapshotVersion: 1,
      lastMessageId: null,
      unreadCount: 0,
      lastReadPointer: { messageId: null, readAt: null },
    },
    hasMore: false,
    bookingId: "booking-1",
    bookingStatus: "CONFIRMED",
    ...overrides,
  };
}

function checkinMessage(snapshot: Record<string, unknown>): MessageDto {
  return {
    id: "checkin-1",
    conversationId: "conversation-1",
    conversationSequence: 1,
    senderId: null,
    type: "CHECKIN_CARD",
    body: null,
    metadata: {},
    payload: {
      kind: "checkin",
      title: "Check-in details",
      body: "Use the side entrance.",
      snapshot,
    },
    status: "SENT",
    deliveryState: "SENT",
    sentAt: "2026-07-23T12:00:00Z",
    deliveredAt: null,
    readAt: null,
    isSystem: true,
    clientMessageId: null,
    createdAt: "2026-07-23T12:00:00Z",
    isOwn: false,
    presentationVersion: 1,
    attachments: [],
  };
}

function paymentMessage(status: string): MessageDto {
  return {
    ...checkinMessage({ status }),
    id: "payment-1",
    type: "PAYMENT_CARD",
    payload: {
      kind: "payment",
      title: "Payment update",
      body: status,
      snapshot: { status },
      actions:
        status === "failed"
          ? [{
              id: "retry_payment",
              label: "Retry payment",
              type: "deep_link",
              url: "/bookings/booking-1",
            }]
          : [],
    },
  };
}

test("access credentials are hidden before check-in", () => {
  const state = deriveContextModules(
    detail({ timeline: [checkinMessage({ doorCode: "2468" })] }),
    new Date("2026-07-23T12:00:00Z"),
  );
  assert.equal(state.modules.some((module) => module.id === "access"), false);
});

test("guest access is recommended during the stay", () => {
  const state = deriveContextModules(
    detail({ timeline: [checkinMessage({ doorCode: "2468" })] }),
    new Date("2026-07-24T12:00:00Z"),
  );
  assert.equal(state.recommendedId, "access");
  assert.equal(
    state.modules.find((module) => module.id === "access")?.snapshot
      ?.credential,
    "2468",
  );
});

test("host never receives the access module", () => {
  const base = detail({ timeline: [checkinMessage({ doorCode: "2468" })] });
  const state = deriveContextModules(
    {
      ...base,
      permissions: { ...base.permissions, viewerRole: "host" },
    },
    new Date("2026-07-24T12:00:00Z"),
  );
  assert.equal(state.modules.some((module) => module.id === "access"), false);
});

test("access is hidden after checkout", () => {
  const state = deriveContextModules(
    detail({ timeline: [checkinMessage({ accessCode: "2468" })] }),
    new Date("2026-07-27T12:00:00Z"),
  );
  assert.equal(state.modules.some((module) => module.id === "access"), false);
});

test("near-term check-in details are available without credentials", () => {
  const state = deriveContextModules(
    detail({ timeline: [checkinMessage({ checkInTime: "15:00" })] }),
    new Date("2026-07-22T12:00:00Z"),
  );
  assert.equal(state.modules.some((module) => module.id === "checkin"), true);
  assert.equal(state.modules.some((module) => module.id === "access"), false);
});

test("booking pending does not fabricate a payment module", () => {
  const state = deriveContextModules(detail({ bookingStatus: "PENDING" }));
  assert.equal(state.modules.some((module) => module.id === "payment"), false);
});

test("explicit failed payment is recommended", () => {
  const state = deriveContextModules(
    detail({ timeline: [paymentMessage("failed")] }),
  );
  assert.equal(state.recommendedId, "payment");
});

test("review becomes the recommended post-stay action", () => {
  const base = detail();
  const state = deriveContextModules({
    ...base,
    bookingStatus: "COMPLETED",
    permissions: { ...base.permissions, canReview: true },
  });
  assert.equal(state.recommendedId, "review");
});

test("unsupported dispute UI is omitted", () => {
  const state = deriveContextModules(detail());
  assert.equal(state.modules.some((module) => module.id === "dispute"), false);
  assert.equal(state.modules.some((module) => module.id === "support"), true);
});
