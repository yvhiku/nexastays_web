"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ErrorAlert } from "@/components/ui/Alert";
import { ConversationRow } from "@/components/messaging/ConversationRow";
import { InboxFilters } from "@/components/messaging/InboxFilters";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMessagingRealtime } from "@/components/messaging/hooks/useMessagingRealtime";
import {
  listConversations,
  type ConversationListItem,
  type InboxFilter,
} from "@/lib/messaging/messages-api";
import {
  readOptimisticInboxMap,
  subscribeOptimisticInbox,
  type OptimisticInboxEntry,
} from "@/lib/messaging/inbox-optimistic";
import { formatUserError } from "@/lib/errors";
import { groupConversations } from "@/lib/messaging/selectors/group-conversations";
import { MessagingEmptyState } from "@/components/messaging/MessagingStates";

function sortConversations(
  items: ConversationListItem[],
  optimistic: Record<string, OptimisticInboxEntry>,
): ConversationListItem[] {
  return [...items].sort((a, b) => {
    const aUnread = a.sync.unreadCount > 0 ? 1 : 0;
    const bUnread = b.sync.unreadCount > 0 ? 1 : 0;
    if (aUnread !== bUnread) return bUnread - aUnread;

    const aTime =
      optimistic[a.conversation.id]?.at ??
      (a.lastMessage.at ? new Date(a.lastMessage.at).getTime() : 0);
    const bTime =
      optimistic[b.conversation.id]?.at ??
      (b.lastMessage.at ? new Date(b.lastMessage.at).getTime() : 0);
    return bTime - aTime;
  });
}

type Props = {
  activeConversationId?: string | null;
};

export function InboxListPanel({ activeConversationId = null }: Props) {
  const { token } = useAuth();
  const { t, localePath } = useLanguage();
  const [filter, setFilter] = useState<InboxFilter>("active");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [items, setItems] = useState<ConversationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [optimistic, setOptimistic] = useState<Record<string, OptimisticInboxEntry>>({});

  useEffect(() => {
    setOptimistic(readOptimisticInboxMap());
    return subscribeOptimisticInbox(() => setOptimistic(readOptimisticInboxMap()));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listConversations(token, filter, debouncedQuery || undefined);
      setItems(data);
    } catch (e) {
      setError(formatUserError(e));
    } finally {
      setLoading(false);
    }
  }, [token, filter, debouncedQuery]);

  useEffect(() => {
    void load();
  }, [load]);

  useMessagingRealtime("inbox", load, !!token);

  const sorted = useMemo(() => sortConversations(items, optimistic), [items, optimistic]);
  const sections = useMemo(
    () => groupConversations(sorted, optimistic),
    [sorted, optimistic],
  );

  const onListKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    const rows = Array.from(
      event.currentTarget.querySelectorAll<HTMLAnchorElement>("[data-conversation-row]"),
    );
    if (rows.length === 0) return;
    const active = document.activeElement as HTMLAnchorElement | null;
    const currentIndex = rows.indexOf(active!);
    const nextIndex =
      event.key === "ArrowDown"
        ? Math.min(currentIndex + 1, rows.length - 1)
        : Math.max(currentIndex < 0 ? rows.length - 1 : currentIndex - 1, 0);
    event.preventDefault();
    rows[nextIndex]?.focus();
  };

  const sectionLabel = (id: string) =>
    t(`inbox.sections.${id}`);

  return (
    <div className="flex h-full min-h-0 flex-col bg-[linear-gradient(180deg,#fff_0%,#fefbfc_100%)]">
      <div className="flex h-14 items-end justify-between px-5 pb-2">
        <h2 className="font-display text-[22px] font-semibold leading-none text-nexa-ink drop-shadow-[0_1px_0_rgba(255,255,255,0.9)]">
          {t("inbox.title")}
        </h2>
      </div>

      <InboxFilters
        filter={filter}
        onFilterChange={setFilter}
        query={query}
        onQueryChange={setQuery}
        labels={{
          active: t("inbox.filters.active"),
          unread: t("inbox.filters.unread"),
          support: t("inbox.filters.support"),
          archived: t("inbox.filters.archived"),
          all: t("inbox.filters.all"),
          searchPlaceholder: t("inbox.searchPlaceholder"),
        }}
      />

      {error ? (
        <div className="p-4">
          <ErrorAlert error={error} compact onDismiss={() => setError(null)} />
        </div>
      ) : null}

      <div
        className="min-h-0 flex-1 overflow-y-auto pb-3"
        onKeyDown={onListKeyDown}
        aria-label={t("inbox.title")}
      >
        {loading && sorted.length === 0 ? (
          <>
            <span className="sr-only" role="status">{t("inbox.loadingInbox")}</span>
            <ul className="space-y-2 px-2" aria-hidden>
              {[0, 1, 2, 3].map((i) => (
                <li key={i} className="h-16 animate-pulse rounded-xl bg-nexa-bg-2/60" />
              ))}
            </ul>
          </>
        ) : null}

        {!loading && sorted.length === 0 ? (
          <MessagingEmptyState
            title={debouncedQuery ? t("inbox.emptySearchTitle") : t("inbox.emptyTitle")}
            body={debouncedQuery ? t("inbox.emptySearchBody") : t("inbox.emptyBody")}
            search={Boolean(debouncedQuery)}
          />
        ) : null}

        {sections.map((section) => (
          <section key={section.id} aria-labelledby={`inbox-section-${section.id}`}>
            <h3
              id={`inbox-section-${section.id}`}
              className="sticky top-0 z-layer-content bg-white/90 px-5 pb-1 pt-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-nexa-primary/70 backdrop-blur-xl"
            >
              {sectionLabel(section.id)}
            </h3>
            <div className="space-y-1">
              {section.items.map((item) => (
                <ConversationRow
                  key={item.conversation.id}
                  item={item}
                  href={localePath(`/inbox/${item.conversation.id}`)}
                  optimistic={optimistic[item.conversation.id] ?? null}
                  isActive={item.conversation.id === activeConversationId}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
