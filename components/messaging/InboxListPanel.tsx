"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { MessageCircle } from "lucide-react";
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

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="flex items-center justify-between border-b border-[#F7F7F7] px-4 py-4">
        <h2 className="font-[family-name:var(--font-playfair)] text-xl font-semibold text-nexa-ink">
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
          all: t("inbox.filters.all"),
          unread: t("inbox.filters.unread"),
          hosts: t("inbox.filters.hosts"),
          support: t("inbox.filters.support"),
          searchPlaceholder: t("inbox.searchPlaceholder"),
        }}
      />

      {error ? (
        <div className="p-4">
          <ErrorAlert error={error} compact onDismiss={() => setError(null)} />
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading && sorted.length === 0 ? (
          <ul className="divide-y divide-nexa-line/40" aria-hidden>
            {[0, 1, 2, 3].map((i) => (
              <li key={i} className="mx-4 my-2 h-[72px] animate-pulse rounded-xl bg-nexa-bg-2/50" />
            ))}
          </ul>
        ) : null}

        {!loading && sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-nexa-primary-soft">
              <MessageCircle className="h-6 w-6 text-nexa-primary" />
            </div>
            <p className="text-sm font-semibold text-nexa-ink">{t("inbox.emptyTitle")}</p>
            <p className="mt-1 max-w-xs text-xs text-nexa-ink-4">{t("inbox.emptyBody")}</p>
          </div>
        ) : null}

        {sorted.map((item) => (
          <ConversationRow
            key={item.conversation.id}
            item={item}
            href={localePath(`/inbox/${item.conversation.id}`)}
            optimistic={optimistic[item.conversation.id] ?? null}
            isActive={item.conversation.id === activeConversationId}
          />
        ))}
      </div>
    </div>
  );
}
