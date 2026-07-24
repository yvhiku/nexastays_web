"use client";

import React from "react";
import { Star } from "lucide-react";
import type { CardAction } from "@/lib/messaging/actions/registry";
import { getCardPayload } from "@/lib/messaging/message-payload";
import { useLanguage } from "@/contexts/LanguageContext";
import type { CardProps } from "./registry";
import { CompactTimelineMilestone } from "./CompactTimelineMilestone";

type RoleView = {
  title?: string;
  body?: string;
  actions?: CardAction[];
};

function readRoleView(meta: Record<string, unknown>, key: "guestView" | "hostView"): RoleView | null {
  const raw = meta[key];
  if (!raw || typeof raw !== "object") return null;
  return raw as RoleView;
}

export function ReviewCard({ message, localePath, presentation, viewerRole }: CardProps) {
  const { t } = useLanguage();
  const payload = getCardPayload(message);
  const meta = message.metadata as Record<string, unknown>;
  const reviewed = meta.reviewed === true;
  const isGuest = viewerRole !== "host";
  const roleView = readRoleView(meta, isGuest ? "guestView" : "hostView");
  const listingId =
    (meta.listingId as string | undefined) ??
    presentation?.reservation.listingId ??
    undefined;
  const bookingId =
    (meta.bookingId as string | undefined) ??
    presentation?.reservation.bookingId ??
    undefined;

  let title = roleView?.title ?? payload?.title ?? (meta.title as string | undefined);
  let body = roleView?.body ?? payload?.body ?? (meta.body as string | undefined);
  let actions: CardAction[] = reviewed
    ? []
    : (roleView?.actions ??
      (payload?.actions as CardAction[] | undefined) ??
      (meta.actions as CardAction[] | undefined) ??
      []);

  if (!roleView) {
    if (isGuest) {
      if (reviewed) {
        title = title ?? t("inbox.thanksForReviewing");
        body = body ?? t("inbox.thanksForReviewingBody");
        actions = [];
      } else {
        title = title ?? t("inbox.leaveReview");
        actions =
          actions.length > 0
            ? actions
            : bookingId
              ? [{
                  id: "leave_review",
                  label: t("inbox.leaveReview"),
                  type: "deep_link",
                  url: `/bookings/${bookingId}/review`,
                }]
              : [];
      }
    } else if (reviewed) {
      title = t("inbox.guestReviewedTitle");
      body = t("inbox.guestReviewedBody");
      actions = listingId
        ? [{
            id: "view_review",
            label: t("inbox.viewGuestReview"),
            type: "deep_link",
            url: `/listings/${listingId}#reviews`,
          }]
        : [];
    } else {
      title = t("inbox.reviewRequestSentTitle");
      body = t("inbox.reviewRequestSentBody");
      actions = [];
    }
  } else if (!isGuest && reviewed && actions.length === 0 && listingId) {
    actions = [{
      id: "view_review",
      label: t("inbox.viewGuestReview"),
      type: "deep_link",
      url: `/listings/${listingId}#reviews`,
    }];
  } else if (isGuest && reviewed) {
    actions = [];
  } else if (!isGuest && !reviewed) {
    actions = [];
  }

  return (
    <CompactTimelineMilestone
      icon={Star}
      title={title ?? t("inbox.leaveReview")}
      body={body}
      time={message.sentAt ?? message.createdAt}
      action={actions[0]}
      localePath={localePath}
      tone="review"
    />
  );
}
