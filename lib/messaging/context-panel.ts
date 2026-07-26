import type {
  ConversationDetail,
  MessageDto,
} from "./messages-api";
import type { CardAction } from "./actions/registry";
import { getCardPayload } from "./message-payload";

export type ContextModuleId =
  | "booking"
  | "checkin"
  | "access"
  | "payment"
  | "review"
  | "dispute"
  | "support";

export type ContextModule = {
  id: ContextModuleId;
  labelKey: string;
  priority: number;
  title?: string;
  body?: string;
  actions: CardAction[];
  snapshot?: Record<string, unknown>;
};

export type ContextPanelState = {
  modules: ContextModule[];
  recommendedId: ContextModuleId;
};

const PROPERTY_TIME_ZONES_BY_COUNTRY: Record<string, string> = {
  MA: "Africa/Casablanca",
  Morocco: "Africa/Casablanca",
};

export function propertyTimeZone(country?: string | null): string {
  const normalized = country?.trim() ?? "";
  return (
    PROPERTY_TIME_ZONES_BY_COUNTRY[normalized] ??
    Intl.DateTimeFormat().resolvedOptions().timeZone ??
    "UTC"
  );
}

export function dateOnlyInTimeZone(now: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function normalizeDateOnly(value: string): string {
  return value.slice(0, 10);
}

function timelineCards(detail: ConversationDetail): Array<{
  message: MessageDto;
  kind: string;
  title?: string;
  body?: string;
  actions: CardAction[];
  snapshot: Record<string, unknown>;
}> {
  return [...detail.timeline]
    .reverse()
    .map((message) => {
      const payload = getCardPayload(message);
      const metadata = message.metadata as {
        kind?: string;
        title?: string;
        body?: string;
        actions?: CardAction[];
        snapshot?: Record<string, unknown>;
      };
      return {
        message,
        kind: String(payload?.kind ?? metadata.kind ?? message.type).toLowerCase(),
        title: payload?.title ?? metadata.title,
        body: payload?.body ?? metadata.body,
        actions: payload?.actions ?? metadata.actions ?? [],
        snapshot: payload?.snapshot ?? metadata.snapshot ?? {},
      };
    });
}

function containsTerm(value: unknown, term: string): boolean {
  return typeof value === "string" && value.toLowerCase().includes(term);
}

function actionMatches(action: CardAction, term: string): boolean {
  return [action.id, action.type, action.url, action.value].some((value) =>
    containsTerm(value, term),
  );
}

function firstString(
  snapshot: Record<string, unknown>,
  keys: string[],
): string | undefined {
  for (const key of keys) {
    const value = snapshot[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

export function hasGatedAccessCredential(
  snapshot: Record<string, unknown>,
): boolean {
  return Boolean(
    firstString(snapshot, ["doorCode", "accessCode", "lockCode", "gateCode"]),
  );
}

export function deriveContextModules(
  detail: ConversationDetail,
  now = new Date(),
): ContextPanelState {
  const cards = timelineCards(detail);
  const reservation = detail.presentation.reservation;
  const bookingId = reservation.bookingId ?? detail.conversation.bookingId;
  const viewerRole =
    detail.permissions.viewerRole ??
    (detail.permissions.canReview ? "guest" : "host");
  const today = dateOnlyInTimeZone(
    now,
    propertyTimeZone(reservation.country),
  );
  const checkinDate = normalizeDateOnly(reservation.checkinDate);
  const checkoutDate = normalizeDateOnly(reservation.checkoutDate);
  const duringStay = today >= checkinDate && today <= checkoutDate;
  const daysUntilCheckin = Math.ceil(
    (Date.parse(`${checkinDate}T00:00:00Z`) -
      Date.parse(`${today}T00:00:00Z`)) /
      86_400_000,
  );

  const checkinCard = cards.find(
    (card) =>
      card.kind.includes("checkin") || card.kind.includes("check-in"),
  );
  const locationCard = cards.find((card) => card.kind.includes("location"));
  const paymentCard = cards.find((card) => card.kind.includes("payment"));
  const disputeCard = cards.find(
    (card) =>
      card.kind.includes("dispute") ||
      card.actions.some((action) => actionMatches(action, "dispute")),
  );
  const credential = checkinCard
    ? firstString(checkinCard.snapshot, [
        "doorCode",
        "accessCode",
        "lockCode",
      ])
    : undefined;

  const modules: ContextModule[] = [];

  if (bookingId) {
    modules.push({
      id: "booking",
      labelKey: "inbox.context.booking",
      priority: 60,
      title: detail.presentation.listing.title,
      body: detail.presentation.statusChip ?? detail.bookingStatus ?? undefined,
      actions: [
        {
          id: "view_booking_context",
          label: "View booking",
          type: "OPEN_BOOKING",
          url: `/bookings/${bookingId}`,
        },
      ],
      snapshot: {
        bookingId,
        checkinDate,
        checkoutDate,
        guestCount: reservation.guestCount,
        addressDisplay: reservation.addressDisplay,
        city: reservation.city,
        country: reservation.country,
        coverUrl: reservation.coverMedia?.url,
      },
    });
  }

  if (
    checkinCard &&
    (duringStay || (daysUntilCheckin >= 0 && daysUntilCheckin <= 3))
  ) {
    modules.push({
      id: "checkin",
      labelKey: "inbox.context.checkin",
      priority: 50,
      title: checkinCard.title,
      body: checkinCard.body,
      actions: [
        ...checkinCard.actions,
        ...(locationCard?.actions ?? []),
      ],
      snapshot: {
        ...checkinCard.snapshot,
        location: locationCard?.snapshot,
      },
    });
  }

  if (credential && viewerRole === "guest" && duringStay) {
    modules.push({
      id: "access",
      labelKey: "inbox.context.access",
      priority: 10,
      title: checkinCard?.title,
      body: checkinCard?.body,
      actions: (checkinCard?.actions ?? []).filter((action) =>
        actionMatches(action, "copy"),
      ),
      snapshot: { credential },
    });
  }

  const paymentStatus =
    paymentCard?.snapshot.status ??
    paymentCard?.snapshot.paymentStatus;
  if (paymentCard) {
    const paymentText = [
      paymentCard.title,
      paymentCard.body,
      paymentStatus,
    ]
      .filter((value): value is string => typeof value === "string")
      .join(" ");
    const actionable =
      containsTerm(paymentText, "pending") ||
      containsTerm(paymentText, "failed") ||
      paymentCard.actions.length > 0;
    modules.push({
      id: "payment",
      labelKey: "inbox.context.payment",
      priority: actionable ? 20 : 55,
      title: paymentCard?.title,
      body:
        paymentCard.body ??
        (typeof paymentStatus === "string" ? paymentStatus : undefined),
      actions: paymentCard.actions,
      snapshot: paymentCard.snapshot,
    });
  }

  if (detail.permissions.canReview && bookingId) {
    modules.push({
      id: "review",
      labelKey: "inbox.context.review",
      priority: 30,
      actions: [
        {
          id: "leave_review_context",
          label: "Leave a review",
          type: "deep_link",
          url: `/bookings/${bookingId}/review`,
        },
      ],
    });
  }

  if (disputeCard) {
    modules.push({
      id: "dispute",
      labelKey: "inbox.context.dispute",
      priority: 40,
      title: disputeCard.title,
      body: disputeCard.body,
      actions: disputeCard.actions.filter((action) =>
        actionMatches(action, "dispute"),
      ),
      snapshot: disputeCard.snapshot,
    });
  }

  modules.push({
    id: "support",
    labelKey: "inbox.context.support",
    priority: 70,
    actions: [
      {
        id: "contact_support_context",
        label: "Contact support",
        type: "deep_link",
        url: `/contact?safety=1${bookingId ? `&booking_id=${bookingId}` : ""}`,
      },
    ],
  });

  modules.sort((a, b) => a.priority - b.priority);
  return {
    modules,
    recommendedId: modules[0]?.id ?? "support",
  };
}
