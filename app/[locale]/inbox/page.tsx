"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { NavBar } from "@/components/navbar/NavBar";
import { Footer } from "@/components/footer/Footer";
import { ProtectedRoute } from "@/components/ProtectedRoute";
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
import { formatUserError } from "@/lib/errors";
import { trackEvent } from "@/lib/analytics";
import { MessageCircle } from "lucide-react";

const OPTIMISTIC_KEY = "nexa_messaging_optimistic_activity";

function readOptimisticMap(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(OPTIMISTIC_KEY);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    return {};
  }
}

function sortConversations(
  items: ConversationListItem[],
  optimistic: Record<string, number>,
): ConversationListItem[] {
  return [...items].sort((a, b) => {
    const aUnread = a.sync.unreadCount > 0 ? 1 : 0;
    const bUnread = b.sync.unreadCount > 0 ? 1 : 0;
    if (aUnread !== bUnread) return bUnread - aUnread;

    const aTime =
      optimistic[a.conversation.id] ??
      (a.lastMessage.at ? new Date(a.lastMessage.at).getTime() : 0);
    const bTime =
      optimistic[b.conversation.id] ??
      (b.lastMessage.at ? new Date(b.lastMessage.at).getTime() : 0);
    return bTime - aTime;
  });
}

function InboxPageInner() {
  const { token } = useAuth();
  const { t, localePath } = useLanguage();
  const [filter, setFilter] = useState<InboxFilter>("all");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [items, setItems] = useState<ConversationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [optimistic, setOptimistic] = useState<Record<string, number>>({});

  useEffect(() => {
    setOptimistic(readOptimisticMap());
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
    trackEvent("inbox_opened");
    void load();
  }, [load]);

  useMessagingRealtime("inbox", load, !!token);

  const sorted = useMemo(() => sortConversations(items, optimistic), [items, optimistic]);

  return (
    <>
      <NavBar />
      <main className="pt-[72px] min-h-screen bg-nexa-bg-1 flex flex-col">
        <div className="max-w-lg mx-auto w-full flex-1 flex flex-col bg-white md:rounded-t-3xl md:mt-4 md:border md:border-nexa-line/60 md:shadow-nexa-card overflow-hidden">
          <div className="px-4 pt-5 pb-2 border-b border-nexa-line/50">
            <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-nexa-ink">
              {t("inbox.title")}
            </h1>
            <p className="text-sm text-nexa-ink-4 mt-0.5">{t("inbox.subtitle")}</p>
          </div>

          <InboxFilters
            filter={filter}
            onFilterChange={setFilter}
            query={query}
            onQueryChange={setQuery}
            labels={{
              all: t("inbox.filters.all"),
              unread: t("inbox.filters.unread"),
              hosts: t("inbox.filters.hosts"),
              support: t("inbox.filters.support"),
              searchPlaceholder: t("inbox.searchPlaceholder"),
            }}
          />

          {error ? (
            <div className="p-4">
              <ErrorAlert error={error} onDismiss={() => setError(null)} />
            </div>
          ) : null}

          <div className="flex-1 overflow-y-auto">
            {loading && sorted.length === 0 ? (
              <ul className="divide-y divide-nexa-line/40" aria-hidden>
                {[0, 1, 2, 3].map((i) => (
                  <li key={i} className="animate-pulse h-[72px] bg-nexa-bg-2/50 mx-4 my-2 rounded-xl" />
                ))}
              </ul>
            ) : null}

            {!loading && sorted.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="w-14 h-14 rounded-full bg-nexa-primary-soft flex items-center justify-center mb-4">
                  <MessageCircle className="h-7 w-7 text-nexa-primary" />
                </div>
                <p className="font-[family-name:var(--font-playfair)] text-lg font-semibold text-nexa-ink">
                  {t("inbox.emptyTitle")}
                </p>
                <p className="text-sm text-nexa-ink-4 mt-2 max-w-xs">{t("inbox.emptyBody")}</p>
              </div>
            ) : null}

            {sorted.map((item) => (
              <ConversationRow
                key={item.conversation.id}
                item={item}
                href={localePath(`/inbox/${item.conversation.id}`)}
                optimisticAt={optimistic[item.conversation.id] ?? null}
              />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function InboxPage() {
  return (
    <ProtectedRoute>
      <InboxPageInner />
    </ProtectedRoute>
  );
}
