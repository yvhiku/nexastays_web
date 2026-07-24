import type { MessageDto } from "../messages-api";
import { getCardPayload } from "../message-payload";

export type TimelinePresentationItem =
  | {
      kind: "message";
      message: MessageDto;
    }
  | {
      kind: "booking-summary";
      message: MessageDto;
      sourceMessages: MessageDto[];
    };

export function isBookingSummarySource(message: MessageDto): boolean {
  const payload = getCardPayload(message);
  const kind = String(payload?.kind ?? message.type).toLowerCase();
  if (
    kind.includes("booking") ||
    kind.includes("property") ||
    kind.includes("location")
  ) {
    return true;
  }
  if (message.isSystem || message.type.startsWith("SYSTEM")) {
    const body = (message.body ?? "").toLowerCase();
    return (
      (body.includes("booking") || body.includes("reservation")) &&
      (body.includes("confirm") || body.includes("created"))
    );
  }
  return false;
}

/**
 * Collapses duplicate reservation overview events for presentation only.
 * Original messages remain untouched for realtime, pagination, and reconciliation.
 */
export function selectTimelinePresentation(
  messages: MessageDto[],
): TimelinePresentationItem[] {
  const bookingSources = messages.filter(isBookingSummarySource);
  const representativeId = bookingSources[0]?.id;

  return messages.flatMap((message): TimelinePresentationItem[] => {
    if (!isBookingSummarySource(message)) {
      return [{ kind: "message", message }];
    }
    if (message.id !== representativeId) return [];
    return [{
      kind: "booking-summary",
      message,
      sourceMessages: bookingSources,
    }];
  });
}
