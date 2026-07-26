"use client";

import React, { useMemo } from "react";
import {
  CalendarCheck,
  FileText,
  ImageIcon,
  Link2,
  MessageCircle,
} from "lucide-react";
import type {
  ConversationSearchResult,
  MessageDto,
  SearchResultType,
} from "@/lib/messaging/messages-api";
import type { SearchFilter } from "./SearchFilterChips";
import { SearchSection } from "./SearchSection";
import { SearchResultCard } from "./SearchResultCard";

type Labels = {
  sections: Record<SearchResultType, string>;
  jump: string;
  open: string;
  host: string;
  guest: string;
};

function friendlyDate(value: string, locale: string): string {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const dayKey = (item: Date) =>
    `${item.getFullYear()}-${item.getMonth()}-${item.getDate()}`;
  const time = date.toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" });
  if (dayKey(date) === dayKey(today)) return `${date.toLocaleDateString(locale, { weekday: "long" })} · ${time}`;
  if (dayKey(date) === dayKey(yesterday)) return date.toLocaleDateString(locale, { weekday: "long" });
  return date.toLocaleDateString(locale, { day: "numeric", month: "short" });
}

const ICONS = {
  message: MessageCircle,
  card: CalendarCheck,
  photo: ImageIcon,
  file: FileText,
  link: Link2,
} satisfies Record<SearchResultType, React.ElementType>;

export function SearchResultsList({
  results,
  filter,
  query,
  locale,
  messages,
  counterpartName,
  viewerRole,
  labels,
  onOpen,
}: {
  results: ConversationSearchResult[];
  filter: SearchFilter;
  query: string;
  locale: string;
  messages: MessageDto[];
  counterpartName: string;
  viewerRole?: "guest" | "host";
  labels: Labels;
  onOpen: (result: ConversationSearchResult, message?: MessageDto) => void;
}) {
  const messageIndex = useMemo(
    () => new Map(messages.map((message) => [message.id, message])),
    [messages],
  );
  const visible = filter === "all"
    ? results
    : results.filter((result) => result.resultType === filter);
  const order: SearchResultType[] = ["message", "card", "photo", "file", "link"];

  return (
    <div className="space-y-4">
      {order.map((type) => {
        const section = visible.filter((result) => result.resultType === type);
        if (!section.length) return null;
        return (
          <SearchSection key={type} title={labels.sections[type]} count={section.length} grid={type === "photo"}>
            {section.map((result) => {
              const message = messageIndex.get(result.messageId);
              const attachmentCount = message?.attachments.length ?? 0;
              const sender = message
                ? message.isOwn
                  ? viewerRole === "guest" ? labels.guest : labels.host
                  : counterpartName
                : labels.sections[type];
              const meta = [
                sender,
                attachmentCount ? `${attachmentCount} ${labels.sections[type]}` : null,
                friendlyDate(result.createdAt, locale),
              ].filter(Boolean).join(" · ");
              const Icon = ICONS[type];
              return (
                <div key={`${result.messageId}-${type}`} data-search-result>
                  <SearchResultCard
                    icon={Icon}
                    eyebrow={sender}
                    preview={result.snippet || result.highlight}
                    meta={meta}
                    actionLabel={type === "photo" || type === "file" ? labels.open : labels.jump}
                    query={query}
                    onOpen={() => onOpen(result, message)}
                  />
                </div>
              );
            })}
          </SearchSection>
        );
      })}
    </div>
  );
}
