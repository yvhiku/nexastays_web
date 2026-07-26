"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";
import {
  Archive,
  MailCheck,
  MessageCircle,
  SearchX,
} from "lucide-react";
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

function InboxSkeleton({ label }: { label: string }) {
  return (
    <div className="px-2 pb-4" aria-label={label} aria-busy="true">
      <span className="sr-only" role="status">
        {label}
      </span>
      <div className="space-y-2" aria-hidden>
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className="flex min-h-24 items-start gap-3 rounded-messaging-card border border-nexa-line/70 bg-white/80 px-3 py-3 shadow-messaging-1"
          >
            <div className="h-12 w-12 shrink-0 animate-pulse rounded-full bg-nexa-bg-2" />
            <div className="min-w-0 flex-1 space-y-2 pt-0.5">
              <div className="h-3.5 w-2/3 animate-pulse rounded-full bg-nexa-bg-2" />
              <div className="h-2.5 w-4/5 animate-pulse rounded-full bg-nexa-bg-2/80" />
              <div className="h-2.5 w-full animate-pulse rounded-full bg-nexa-bg-2/70" />
              <div className="h-2.5 w-1/2 animate-pulse rounded-full bg-nexa-bg-2/60" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InboxEmptyState({
  title,
  body,
  filter,
  search,
  actionLabel,
  onAction,
}: {
  title: string;
  body: string;
  filter: InboxFilter;
  search: boolean;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const Icon = search
    ? SearchX
    : filter === "archived"
      ? Archive
      : filter === "unread"
        ? MailCheck
        : MessageCircle;

  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center px-7 py-12 text-center">
      <div className="relative">
        <span
          className="absolute inset-2 rounded-full bg-nexa-primary/10 blur-xl"
          aria-hidden
        />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-messaging-card border border-nexa-line bg-white text-nexa-ink-3 shadow-messaging-2">
          <Icon className="h-7 w-7" aria-hidden />
        </div>
      </div>
      <h3 className="mt-5 font-display text-xl font-semibold text-nexa-ink">
        {title}
      </h3>
      <p className="mt-2 max-w-[240px] text-sm leading-6 text-nexa-ink-2">
        {body}
      </p>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 inline-flex min-h-12 items-center rounded-full border border-nexa-line bg-white px-4 text-sm font-semibold text-nexa-ink-2 shadow-messaging-1 transition-[background-color,box-shadow,transform] duration-messaging-hover hover:-translate-y-px hover:bg-nexa-bg-2 hover:text-nexa-ink hover:shadow-messaging-2 active:translate-y-0 active:scale-[0.98] active:duration-messaging-press motion-reduce:transition-none lg:min-h-10"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

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
  const reduceMotion = useReducedMotion();
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

  useMessagingRealtime("inbox", load, !!token, token);

  const sorted = useMemo(() => sortConversations(items, optimistic), [items, optimistic]);
  const sections = useMemo(
    () => groupConversations(sorted, optimistic),
    [sorted, optimistic],
  );
  const unreadTotal = useMemo(
    () => sorted.reduce((total, item) => total + item.sync.unreadCount, 0),
    [sorted],
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
    id === "archived"
      ? t("inbox.filters.archived")
      : t(`inbox.sections.${id}`);

  const clearEmptyState = () => {
    if (query) {
      setQuery("");
      return;
    }
    setFilter("active");
  };

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col overflow-x-hidden bg-[linear-gradient(180deg,#fff_0%,#fdfbfc_100%)]">
      <div className="flex min-h-[68px] items-end justify-between gap-3 px-5 pb-2 pt-4">
        <div className="min-w-0">
          <h2 className="font-display text-2xl font-semibold leading-none text-nexa-ink">
            {t("inbox.title")}
          </h2>
          <p className="mt-1.5 truncate text-[11px] font-medium text-nexa-ink-3">
            {t("inbox.subtitle")}
          </p>
        </div>
        {unreadTotal > 0 ? (
          <span
            className="mb-0.5 flex h-7 min-w-7 shrink-0 items-center justify-center rounded-full bg-nexa-primary px-2 text-[11px] font-bold text-white shadow-messaging-1"
            aria-label={`${unreadTotal} ${t("inbox.sections.unread")}`}
          >
            {unreadTotal > 99 ? "99+" : unreadTotal}
          </span>
        ) : null}
      </div>

      <InboxFilters
        filter={filter}
        onFilterChange={setFilter}
        query={query}
        onQueryChange={setQuery}
        loading={loading && Boolean(debouncedQuery)}
        labels={{
          active: t("inbox.filters.active"),
          unread: t("inbox.filters.unread"),
          support: t("inbox.filters.support"),
          archived: t("inbox.filters.archived"),
          all: t("inbox.filters.all"),
          searchPlaceholder: t("inbox.searchPlaceholder"),
          clearSearch: t("common.clear"),
          loading: t("common.loading"),
        }}
      />

      {error ? (
        <div className="p-4">
          <ErrorAlert error={error} compact onDismiss={() => setError(null)} />
        </div>
      ) : null}

      <div
        className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pb-4"
        onKeyDown={onListKeyDown}
        aria-label={t("inbox.title")}
      >
        {loading && sorted.length === 0 ? (
          <InboxSkeleton label={t("inbox.loadingInbox")} />
        ) : null}

        {!loading && sorted.length === 0 ? (
          <InboxEmptyState
            title={
              debouncedQuery
                ? t("inbox.emptySearchTitle")
                : filter === "archived"
                  ? t("inbox.archivedBannerTitle")
                  : t("inbox.emptyTitle")
            }
            body={
              debouncedQuery
                ? t("inbox.emptySearchBody")
                : filter === "archived"
                  ? t("inbox.archivedBannerBody")
                  : t("inbox.emptyBody")
            }
            filter={filter}
            search={Boolean(debouncedQuery)}
            actionLabel={
              debouncedQuery || filter !== "active"
                ? debouncedQuery
                  ? t("common.clear")
                  : t("inbox.filters.active")
                : undefined
            }
            onAction={
              debouncedQuery || filter !== "active"
                ? clearEmptyState
                : undefined
            }
          />
        ) : null}

        <AnimatePresence initial={false} mode="sync">
          {sections.map((section) => (
            <motion.section
              layout={!reduceMotion}
              key={section.id}
              aria-labelledby={`inbox-section-${section.id}`}
            >
              <h3
                id={`inbox-section-${section.id}`}
                className="sticky top-0 z-layer-content mb-1 flex items-center gap-2 bg-[rgba(255,252,253,0.92)] px-5 pb-1.5 pt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-nexa-ink-3 backdrop-blur-xl"
              >
                <span>{sectionLabel(section.id)}</span>
                <span className="rounded-full bg-nexa-primary-soft px-1.5 py-0.5 text-[9px] tabular-nums text-nexa-primary">
                  {section.items.length}
                </span>
              </h3>
              <div className="space-y-2" role="list">
                <AnimatePresence initial={false} mode="sync">
                  {section.items.map((item, index) => (
                    <motion.div
                      role="listitem"
                      layout={!reduceMotion}
                      key={item.conversation.id}
                      initial={
                        reduceMotion
                          ? false
                          : { opacity: 0, y: 6, scale: 0.99 }
                      }
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={
                        reduceMotion
                          ? { opacity: 0 }
                          : { opacity: 0, y: -4, scale: 0.99 }
                      }
                      transition={{
                        duration: reduceMotion ? 0 : 0.18,
                        delay: reduceMotion ? 0 : Math.min(index * 0.015, 0.08),
                        ease: "easeOut",
                      }}
                    >
                      <ConversationRow
                        item={item}
                        href={localePath(`/inbox/${item.conversation.id}`)}
                        optimistic={optimistic[item.conversation.id] ?? null}
                        isActive={item.conversation.id === activeConversationId}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.section>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
