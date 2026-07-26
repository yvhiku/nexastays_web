"use client";

import React from "react";
import type { CardAction } from "@/lib/messaging/actions/registry";
import {
  executeCardAction,
} from "@/lib/messaging/actions/registry";
import {
  dateOnlyInTimeZone,
  hasGatedAccessCredential,
  propertyTimeZone,
} from "@/lib/messaging/context-panel";
import { getCardPayload } from "@/lib/messaging/message-payload";
import { useLanguage } from "@/contexts/LanguageContext";
import type { CardProps } from "./registry";
import { CheckInTimelineCard } from "./CheckInTimelineCard";

function cardData(message: CardProps["message"]) {
  const payload = getCardPayload(message);
  const metadata = message.metadata as {
    actions?: CardAction[];
    snapshot?: Record<string, unknown>;
  };
  return {
    actions: payload?.actions ?? metadata.actions ?? [],
    snapshot: payload?.snapshot ?? metadata.snapshot ?? {},
  };
}

function actionMatches(action: CardAction, term: string): boolean {
  return [action.id, action.type, action.url, action.value].some(
    (value) =>
      typeof value === "string" && value.toLowerCase().includes(term),
  );
}

function structuredString(
  snapshot: Record<string, unknown>,
  keys: string[],
): string | undefined {
  for (const key of keys) {
    const value = snapshot[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

function structuredRules(snapshot: Record<string, unknown>): string[] {
  for (const key of ["houseRules", "house_rules", "rules"]) {
    const value = snapshot[key];
    if (Array.isArray(value)) {
      return value.filter(
        (rule): rule is string => typeof rule === "string" && Boolean(rule.trim()),
      );
    }
  }
  return [];
}

export function CheckinCard({
  message,
  messages = [],
  localePath,
  presentation,
  viewerRole,
}: CardProps) {
  const { t, locale } = useLanguage();
  const current = cardData(message);
  const allCards = [message, ...messages.filter((item) => item.id !== message.id)]
    .map((item) => ({ message: item, ...cardData(item) }));
  const allActions = allCards.flatMap((card) => card.actions);
  const mapAction = allActions.find(
    (action) =>
      actionMatches(action, "map") ||
      actionMatches(action, "direction") ||
      action.type === "external_maps",
  );
  const credentialPresent = allCards.some((card) =>
    hasGatedAccessCredential(card.snapshot),
  );
  const rules = allCards.flatMap((card) => structuredRules(card.snapshot));
  const reservation = presentation?.reservation;
  const checkInDate = reservation?.checkinDate;
  const checkoutDate = reservation?.checkoutDate;
  const today = dateOnlyInTimeZone(
    new Date(),
    propertyTimeZone(reservation?.country),
  );
  const checkinDay = checkInDate?.slice(0, 10);
  const checkoutDay = checkoutDate?.slice(0, 10);
  const duringStay = Boolean(
    checkinDay &&
      checkoutDay &&
      today >= checkinDay &&
      today <= checkoutDay,
  );
  const accessAvailable =
    viewerRole === "guest" && duringStay && credentialPresent;
  const rawTime = structuredString(current.snapshot, [
    "arrivalTime",
    "checkInHour",
    "checkinTime",
  ]);
  const checkInTime =
    rawTime && /^\d{1,2}:\d{2}/.test(rawTime) ? rawTime : undefined;
  const timezone = structuredString(current.snapshot, [
    "timezone",
    "timeZone",
  ]);
  const formattedDate = checkinDay
    ? new Date(`${checkinDay}T12:00:00`).toLocaleDateString(locale, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowKey = dateOnlyInTimeZone(
    tomorrow,
    propertyTimeZone(reservation?.country),
  );
  const arrivalStatus =
    checkinDay === today
      ? t("inbox.timeline.checkinToday")
      : checkinDay === tomorrowKey
        ? t("inbox.timeline.checkinTomorrow")
        : undefined;
  const propertyName =
    presentation?.listing.title ||
    reservation?.listingTitle ||
    t("inbox.timeline.yourReservation");

  return (
    <CheckInTimelineCard
      propertyName={propertyName}
      cover={reservation?.coverMedia}
      welcomeTitle={t("inbox.timeline.welcomeStay")}
      arrivalLabel={t("inbox.timeline.arrival")}
      arrivalStatus={arrivalStatus}
      checkInDate={formattedDate}
      checkInTime={checkInTime}
      timezone={timezone}
      address={reservation?.addressDisplay}
      mapActionLabel={mapAction?.label || t("inbox.timeline.viewMap")}
      onOpenMap={
        mapAction
          ? () => executeCardAction(mapAction, { localePath })
          : undefined
      }
      accessAvailable={accessAvailable}
      rules={Array.from(new Set(rules))}
      checklist={[
        {
          label: t("inbox.timeline.reservationConfirmed"),
          complete: true,
        },
        {
          label: t("inbox.timeline.checkinAvailable"),
          complete: Boolean(checkinDay && today >= checkinDay),
        },
        {
          label: t("inbox.timeline.accessInformation"),
          complete: accessAvailable,
        },
        {
          label: t("inbox.timeline.enjoyStay"),
          complete: duringStay,
        },
      ]}
      labels={{
        propertyImage: t("inbox.timeline.propertyImage"),
        retryImage: t("inbox.timeline.retryImage"),
        location: t("inbox.timeline.propertyAddress"),
        access: t("inbox.timeline.propertyAccess"),
        accessAvailable: t("inbox.timeline.accessAvailable"),
        houseRules: t("inbox.timeline.houseRules"),
        checklist: t("inbox.timeline.arrivalChecklist"),
      }}
    />
  );
}
