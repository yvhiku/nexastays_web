import assert from "node:assert/strict";
import test from "node:test";
import {
  deriveJourneyIndex,
  supportedJourneySteps,
} from "../../../components/messaging/hospitality/journey";
import type { ConversationDetail } from "../messages-api";

function conversation(
  overrides: {
    bookingId?: string | null;
    status?: string | null;
    checkin?: string;
    checkout?: string;
    canReview?: boolean;
  } = {},
): ConversationDetail {
  const future = new Date(Date.now() + 10 * 86_400_000)
    .toISOString()
    .slice(0, 10);
  const later = new Date(Date.now() + 12 * 86_400_000)
    .toISOString()
    .slice(0, 10);
  const bookingId = overrides.bookingId ?? null;
  return {
    conversation: {
      id: "conversation",
      type: "BOOKING",
      bookingId,
      listingId: "listing",
      messagingState: "ACTIVE",
      visibility: "ACTIVE",
    },
    presentation: {
      title: "Host",
      subtitle: "",
      avatar: null,
      bookingChip: null,
      statusChip: overrides.status ?? null,
      counterpart: { id: "host", displayName: "Host" },
      listing: { title: "Riad", city: "Marrakesh" },
      reservation: {
        listingTitle: "Riad",
        listingId: "listing",
        coverMedia: null,
        addressDisplay: null,
        city: "Marrakesh",
        country: "MA",
        checkinDate: overrides.checkin ?? future,
        checkoutDate: overrides.checkout ?? later,
        guestCount: 2,
        bookingReference: null,
        bookingId,
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
      canReview: overrides.canReview ?? false,
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
    bookingId,
    bookingStatus: overrides.status ?? null,
  };
}

test("inquiry conversations expose only the supported inquiry milestone", () => {
  const value = conversation();
  assert.deepEqual(supportedJourneySteps(value), ["inquiry"]);
  assert.equal(deriveJourneyIndex(value), 0);
});

test("confirmed bookings expose the complete journey without advancing future steps", () => {
  const value = conversation({ bookingId: "booking", status: "CONFIRMED" });
  assert.equal(supportedJourneySteps(value).length, 6);
  assert.equal(deriveJourneyIndex(value), 1);
});

test("active stay dates advance the journey from existing booking dates", () => {
  const checkin = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  const checkout = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
  assert.equal(
    deriveJourneyIndex(
      conversation({ bookingId: "booking", checkin, checkout }),
    ),
    3,
  );
});

test("review permission advances the journey to its final supported step", () => {
  assert.equal(
    deriveJourneyIndex(
      conversation({ bookingId: "booking", canReview: true }),
    ),
    5,
  );
});
