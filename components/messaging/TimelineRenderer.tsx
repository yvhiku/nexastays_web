"use client";

import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { ConversationPresentation, MessageDto, AttachmentDto, ConversationPermissions } from "@/lib/messaging/messages-api";
import { selectGroupedMessages } from "@/lib/messaging/selectors/group-messages";
import { messageRendererRegistry, isRegistryMessageType } from "./MessageRendererRegistry";
import { renderTimelineCard, resolveCardKind } from "./timeline/registry";
import {
  selectTimelinePresentation,
} from "@/lib/messaging/selectors/timeline-presentation";
import { messageRenderKey } from "@/lib/messaging/selectors/reconcile-messages";
import { BookingLifecycleCard } from "./timeline/BookingLifecycleCard";
import { useLanguage } from "@/contexts/LanguageContext";
import { UnreadDivider } from "./UnreadDivider";

const CARD_TYPES = new Set([
  "SYSTEM_EVENT",
  "SYSTEM_NOTICE",
  "PROPERTY_CARD",
  "BOOKING_CARD",
  "CHECKIN_CARD",
  "WIFI_CARD",
  "LOCATION_CARD",
  "REVIEW_CARD",
  "PAYMENT_CARD",
  "AI_CARD",
]);

type Props = {
  messages: MessageDto[];
  removedLabel: string;
  presentation: ConversationPresentation;
  permissions?: ConversationPermissions;
  localePath: (path: string) => string;
  onOpenGallery?: (attachments: AttachmentDto[], index: number) => void;
  onRetryMediaUpload?: (clientMessageId: string) => void;
  uploadLabels?: {
    uploading: string;
    failed: string;
    retry: string;
  };
  lastReadMessageId?: string | null;
  unreadLabel?: string;
  scrollContainerRef?: RefObject<HTMLElement>;
};

function dayKey(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function dayLabel(
  iso: string,
  locale: string,
  todayLabel: string,
  yesterdayLabel: string,
): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const weekday = d.toLocaleDateString(locale, { weekday: "long" });
  if (dayKey(iso) === dayKey(today.toISOString())) {
    return `${todayLabel} · ${weekday}`;
  }
  if (dayKey(iso) === dayKey(yesterday.toISOString())) {
    return `${yesterdayLabel} · ${weekday}`;
  }
  return d.toLocaleDateString(locale, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export function TimelineRenderer({
  messages,
  removedLabel,
  presentation,
  permissions,
  localePath,
  onOpenGallery,
  onRetryMediaUpload,
  uploadLabels,
  lastReadMessageId,
  unreadLabel,
  scrollContainerRef,
}: Props) {
  const { t, locale } = useLanguage();
  const timelineRootRef = useRef<HTMLDivElement>(null);
  const [scrollMargin, setScrollMargin] = useState(0);
  const presentationItems = useMemo(
    () => selectTimelinePresentation(messages),
    [messages],
  );
  const groupedByFirstMessage = useMemo(() => {
    const bubbleMessages = messages.filter((message) =>
      isRegistryMessageType(message.type),
    );
    const index = new Map<string, ReturnType<typeof selectGroupedMessages>[number]>();
    for (const group of selectGroupedMessages(bubbleMessages)) {
      const firstId = group.messages[0]?.id;
      if (firstId) index.set(firstId, group);
    }
    return index;
  }, [messages]);

  const lastReadIndex = lastReadMessageId
    ? messages.findIndex((message) => message.id === lastReadMessageId)
    : -1;
  const firstUnreadId =
    lastReadIndex >= 0 ? messages[lastReadIndex + 1]?.id : undefined;
  const rows = useMemo(() => {
    let lastDay = "";
    let lastIncomingSender: string | null = null;
    let lastConversationalSender: string | null = null;
    let lastConversationalOwn: boolean | null = null;
    let unreadShown = false;

    return presentationItems.map((item) => {
      const message = item.message;
      const time = message.sentAt ?? message.createdAt;
      const dk = dayKey(time);
      const showDay = Boolean(dk && dk !== lastDay);
      if (showDay) lastDay = dk;
      const label = time
        ? dayLabel(
            time,
            locale,
            t("inbox.timeline.today"),
            t("inbox.timeline.yesterday"),
          )
        : null;
      const showUnread =
        !unreadShown &&
        Boolean(unreadLabel && message.id === firstUnreadId);
      if (showUnread) unreadShown = true;

      const group = isRegistryMessageType(message.type)
        ? groupedByFirstMessage.get(message.id)
        : undefined;
      const hideAvatar = Boolean(
        group &&
          !group.isOwn &&
          lastIncomingSender === group.senderId &&
          message.type === "TEXT",
      );
      const followsSameSender = Boolean(
        group &&
          lastConversationalSender === group.senderId &&
          lastConversationalOwn === group.isOwn &&
          !showDay,
      );

      if (item.kind === "booking-summary") {
        lastIncomingSender = null;
        lastConversationalSender = null;
        lastConversationalOwn = null;
      } else if (group) {
        lastIncomingSender = group.isOwn ? null : group.senderId;
        lastConversationalSender = group.senderId;
        lastConversationalOwn = group.isOwn;
      } else if (
        CARD_TYPES.has(message.type) ||
        message.isSystem ||
        message.type.startsWith("SYSTEM")
      ) {
        lastIncomingSender = null;
        lastConversationalSender = null;
        lastConversationalOwn = null;
      }

      return {
        item,
        message,
        dk,
        label,
        showDay,
        showUnread,
        group,
        hideAvatar,
        followsSameSender,
      };
    });
  }, [
    firstUnreadId,
    groupedByFirstMessage,
    locale,
    presentationItems,
    t,
    unreadLabel,
  ]);
  const shouldVirtualize = rows.length > 80 && Boolean(scrollContainerRef);
  useLayoutEffect(() => {
    if (!shouldVirtualize) {
      setScrollMargin(0);
      return;
    }
    const root = timelineRootRef.current;
    const scroller = scrollContainerRef?.current;
    if (!root || !scroller) return;
    const next =
      root.getBoundingClientRect().top -
      scroller.getBoundingClientRect().top +
      scroller.scrollTop;
    setScrollMargin((current) =>
      Math.abs(current - next) > 1 ? next : current,
    );
  }, [rows.length, scrollContainerRef, shouldVirtualize]);

  useEffect(() => {
    if (!shouldVirtualize) return;
    const root = timelineRootRef.current;
    const scroller = scrollContainerRef?.current;
    const content = root?.parentElement;
    if (!root || !scroller || !content) return;
    const update = () => {
      const next =
        root.getBoundingClientRect().top -
        scroller.getBoundingClientRect().top +
        scroller.scrollTop;
      setScrollMargin((current) =>
        Math.abs(current - next) > 1 ? next : current,
      );
    };
    const observer = new ResizeObserver(update);
    observer.observe(content);
    update();
    return () => observer.disconnect();
  }, [scrollContainerRef, shouldVirtualize]);

  const virtualizer = useVirtualizer({
    count: shouldVirtualize ? rows.length : 0,
    getScrollElement: () => scrollContainerRef?.current ?? null,
    estimateSize: (index) => {
      const row = rows[index];
      if (!row) return 96;
      if (row.item.kind === "booking-summary") return 360;
      if (row.message.type === "IMAGE") return 280;
      if (
        CARD_TYPES.has(row.message.type) ||
        row.message.isSystem ||
        row.message.type.startsWith("SYSTEM")
      ) {
        return 170;
      }
      return row.showDay ? 132 : 86;
    },
    getItemKey: (index) =>
      rows[index] ? messageRenderKey(rows[index]!.message) : index,
    overscan: 8,
    scrollMargin,
  });
  useEffect(() => {
    if (!shouldVirtualize) return;
    const onJump = (event: Event) => {
      const messageId = (event as CustomEvent<string>).detail;
      const index = rows.findIndex((row) => row.message.id === messageId);
      if (index >= 0) virtualizer.scrollToIndex(index, { align: "center" });
    };
    window.addEventListener("nexa:timeline-jump", onJump);
    return () => window.removeEventListener("nexa:timeline-jump", onJump);
  }, [rows, shouldVirtualize, virtualizer]);

  const renderRow = (row: (typeof rows)[number]) => {
        const { item, message, dk, label, showDay, showUnread, group, hideAvatar, followsSameSender } = row;
        const dayDivider = showDay ? (
          <div
            key={`day-${dk}-${message.id}`}
            data-timeline-day={dk}
            data-timeline-day-label={label}
            className="pointer-events-none my-5 flex items-center gap-3 px-5"
          >
            <span className="h-px flex-1 bg-[linear-gradient(90deg,transparent,rgba(181,151,164,0.45))]" aria-hidden />
            <span className="rounded-full border border-nexa-line/55 bg-white/85 px-3 py-1.5 text-[10px] font-semibold text-nexa-ink-4 shadow-[0_3px_10px_rgba(78,42,58,0.04)] backdrop-blur">
              {label}
            </span>
            <span className="h-px flex-1 bg-[linear-gradient(90deg,rgba(181,151,164,0.45),transparent)]" aria-hidden />
          </div>
        ) : null;
        const unreadDivider = showUnread && unreadLabel ? (
          <UnreadDivider label={unreadLabel} />
        ) : null;

        if (item.kind === "booking-summary") {
          return (
            <React.Fragment key={message.id}>
              {dayDivider}
              {unreadDivider}
              <div data-message-id={message.id} className="py-4">
                <BookingLifecycleCard
                  messages={item.sourceMessages}
                  presentation={presentation}
                  localePath={localePath}
                  viewerRole={permissions?.viewerRole}
                />
              </div>
            </React.Fragment>
          );
        }

        if (isRegistryMessageType(message.type)) {
          if (!group) {
            return dayDivider;
          }

          return (
            <React.Fragment key={message.id}>
              {dayDivider}
              {unreadDivider}
              <div className={showDay ? "" : followsSameSender ? "mt-2" : "mt-5"}>
                {messageRendererRegistry.render({
                  group: { ...group, showAvatar: group.showAvatar && !hideAvatar },
                  message,
                  counterpartAvatar: presentation.avatar,
                  counterpartName: presentation.title,
                  removedLabel,
                  onOpenGallery,
                  onRetryMediaUpload,
                  uploadLabels,
                })}
              </div>
            </React.Fragment>
          );
        }

        if (CARD_TYPES.has(message.type) || message.isSystem || message.type.startsWith("SYSTEM")) {
          const kind = resolveCardKind(message);
          const coverUrl =
            kind === "property" ? presentation.reservation.coverMedia?.url ?? null : null;

          return (
            <React.Fragment key={message.id}>
              {dayDivider}
              {unreadDivider}
              <div
                data-message-id={message.id}
                className="px-0 py-4 sm:px-4"
                style={{ contentVisibility: "auto", containIntrinsicSize: "132px" }}
              >
                {renderTimelineCard({
                  message,
                  localePath,
                  presentation,
                  coverUrl,
                  viewerRole:
                    permissions?.viewerRole ??
                    (permissions?.canReview ? "guest" : "host"),
                  messages,
                })}
              </div>
            </React.Fragment>
          );
        }

        return dayDivider;
  };

  if (!shouldVirtualize) {
    return <div ref={timelineRootRef} className="flex flex-col py-3">{rows.map((row) => (
      <React.Fragment key={messageRenderKey(row.message)}>{renderRow(row)}</React.Fragment>
    ))}</div>;
  }

  return (
    <div
      ref={timelineRootRef}
      className="relative w-full py-3"
      style={{ height: `${virtualizer.getTotalSize()}px` }}
    >
      {virtualizer.getVirtualItems().map((virtualRow) => {
        const row = rows[virtualRow.index];
        if (!row) return null;
        return (
          <div
            key={messageRenderKey(row.message)}
            ref={virtualizer.measureElement}
            data-index={virtualRow.index}
            className="absolute start-0 top-0 w-full"
            style={{
              transform: `translateY(${virtualRow.start - scrollMargin}px)`,
              contentVisibility: "auto",
            }}
          >
            {renderRow(row)}
          </div>
        );
      })}
    </div>
  );
}
