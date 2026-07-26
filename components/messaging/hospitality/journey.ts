import type { ConversationDetail } from "@/lib/messaging/messages-api";
import {
  dateOnlyInTimeZone,
  propertyTimeZone,
} from "@/lib/messaging/context-panel";

export type JourneyStepId =
  | "inquiry"
  | "confirmed"
  | "checkin"
  | "stay"
  | "checkout"
  | "review";

export function deriveJourneyIndex(conversation: ConversationDetail): number {
  const status = `${conversation.bookingStatus ?? ""} ${conversation.presentation.statusChip ?? ""} ${conversation.conversation.messagingState}`.toLowerCase();
  const reservation = conversation.presentation.reservation;
  const checkin = reservation.checkinDate.slice(0, 10);
  const checkout = reservation.checkoutDate.slice(0, 10);
  const today = dateOnlyInTimeZone(
    new Date(),
    propertyTimeZone(reservation.country),
  );

  if (/review/.test(status) || conversation.permissions.canReview) return 5;
  if (/completed|checkout|checked.out|post.stay/.test(status) || (checkout && today >= checkout)) return 4;
  if (/stay|checked.in|in.progress/.test(status) || (checkin && checkout && today >= checkin && today < checkout)) return 3;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const propertyTomorrow = dateOnlyInTimeZone(
    tomorrow,
    propertyTimeZone(reservation.country),
  );
  if (/check.?in/.test(status) || (checkin && checkin <= propertyTomorrow)) return 2;
  if (conversation.conversation.bookingId || /confirm|upcoming|paid/.test(status)) return 1;
  return 0;
}

export function supportedJourneySteps(
  conversation: ConversationDetail,
): JourneyStepId[] {
  if (!conversation.conversation.bookingId) return ["inquiry"];
  return ["inquiry", "confirmed", "checkin", "stay", "checkout", "review"];
}
