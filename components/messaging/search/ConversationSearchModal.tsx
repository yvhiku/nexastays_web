"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { LoaderCircle, Search, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { OverlayPortal } from "@/components/ui/OverlayPortal";
import { useFocusTrap } from "@/components/messaging/hooks/useFocusTrap";
import { useLanguage } from "@/contexts/LanguageContext";
import { trackEvent } from "@/lib/analytics";
import {
  searchConversation,
  type AttachmentDto,
  type ConversationSearchResult,
  type MessageDto,
  type SearchResultType,
} from "@/lib/messaging/messages-api";
import { ConversationSearchBar } from "./ConversationSearchBar";
import {
  SearchFilterChips,
  type SearchFilter,
} from "./SearchFilterChips";
import { SearchMatchCounter } from "./SearchMatchCounter";
import { SearchResultsList } from "./SearchResultsList";
import { SearchEmptyState } from "./SearchEmptyState";
import { RecentSearches } from "./RecentSearches";
import {
  endMessagingMeasure,
  startMessagingMeasure,
} from "@/lib/messaging/performance";

const MAX_RECENT = 10;
const resultCache = new Map<string, ConversationSearchResult[]>();
const MAX_CACHED_SEARCHES = 30;

export function ConversationSearchModal({
  open,
  conversationId,
  token,
  messages,
  counterpartName,
  viewerRole,
  onClose,
  onJumpToMessage,
  onOpenGallery,
}: {
  open: boolean;
  conversationId: string;
  token: string | null;
  messages: MessageDto[];
  counterpartName: string;
  viewerRole?: "guest" | "host";
  onClose: () => void;
  onJumpToMessage: (messageId: string) => void;
  onOpenGallery: (attachments: AttachmentDto[], index: number) => void;
}) {
  const { t, locale } = useLanguage();
  const reduceMotion = useReducedMotion();
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ConversationSearchResult[]>([]);
  const [filter, setFilter] = useState<SearchFilter>("all");
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const storageKey = `nexa-conversation-search:${conversationId}`;
  useFocusTrap(open, dialogRef);

  useEffect(() => {
    if (!open) return;
    try {
      setRecent(JSON.parse(sessionStorage.getItem(storageKey) ?? "[]"));
    } catch {
      setRecent([]);
    }
    trackEvent("conversation_search_opened", { conversation_id: conversationId });
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [conversationId, open, storageKey]);

  useEffect(() => {
    if (!open || !token || query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      const cacheKey = `${conversationId}:${query.trim().toLocaleLowerCase()}`;
      const cached = resultCache.get(cacheKey);
      if (cached) {
        setResults(cached);
        setLoading(false);
        return;
      }
      setLoading(true);
      startMessagingMeasure("conversation-search");
      void searchConversation(conversationId, query.trim(), token)
        .then((value) => {
          if (!controller.signal.aborted) {
            resultCache.set(cacheKey, value);
            if (resultCache.size > MAX_CACHED_SEARCHES) {
              const oldest = resultCache.keys().next().value;
              if (oldest) resultCache.delete(oldest);
            }
            setResults(value);
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setLoading(false);
            endMessagingMeasure("conversation-search");
          }
        });
    }, 200);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [conversationId, open, query, token]);

  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [onClose, open]);

  const suggestions = useMemo(() => {
    const searchable = messages
      .map((message) => `${message.body ?? ""} ${message.type}`)
      .join(" ")
      .toLowerCase();
    const candidates = [
      ["reservation", t("inbox.phase10.suggestion.reservation")],
      ["checkin", t("inbox.phase10.suggestion.checkin")],
      ["payment", t("inbox.phase10.suggestion.payment")],
      ["parking", t("inbox.phase10.suggestion.parking")],
      ["rule", t("inbox.phase10.suggestion.rules")],
      ["invoice", t("inbox.phase10.suggestion.invoice")],
    ];
    return candidates
      .filter(([term]) => searchable.includes(term))
      .map(([, label]) => label);
  }, [messages, t]);

  const availableFilters = useMemo<SearchFilter[]>(() => {
    const types = new Set(results.map((result) => result.resultType));
    return ["all", ...(["message", "card", "photo", "file", "link"] as SearchResultType[]).filter((type) => types.has(type))];
  }, [results]);
  useEffect(() => {
    if (!availableFilters.includes(filter)) setFilter("all");
  }, [availableFilters, filter]);

  const remember = (value: string) => {
    const normalized = value.trim();
    if (normalized.length < 2) return;
    const next = [normalized, ...recent.filter((item) => item !== normalized)].slice(0, MAX_RECENT);
    setRecent(next);
    sessionStorage.setItem(storageKey, JSON.stringify(next));
  };

  const closeAndJump = (result: ConversationSearchResult, message?: MessageDto) => {
    remember(query);
    trackEvent("conversation_search_result_opened", {
      conversation_id: conversationId,
      result_type: result.resultType,
    });
    if (result.resultType === "photo" && message?.attachments.length) {
      const photos = message.attachments.filter((attachment) =>
        attachment.mime?.startsWith("image/"),
      );
      if (photos.length) {
        onClose();
        onOpenGallery(photos, 0);
        return;
      }
    }
    onClose();
    requestAnimationFrame(() => onJumpToMessage(result.messageId));
  };

  const onResultKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowDown", "ArrowUp", "Enter"].includes(event.key)) return;
    const buttons = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>("[data-search-result] button"),
    );
    const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (event.key === "Enter" && current >= 0) {
      buttons[current]?.click();
      return;
    }
    if (!buttons.length || event.key === "Enter") return;
    event.preventDefault();
    const next =
      event.key === "ArrowDown"
        ? Math.min(current + 1, buttons.length - 1)
        : Math.max(current <= 0 ? 0 : current - 1, 0);
    buttons[next]?.focus();
  };

  return (
    <OverlayPortal layer="modal">
      <AnimatePresence>
        {open ? (
          <div className="fixed inset-0 z-layer-modal flex items-center justify-center bg-black/35 p-0 backdrop-blur-sm sm:p-5">
            <button type="button" tabIndex={-1} className="absolute inset-0" onClick={onClose} aria-label={t("common.close")} />
            <motion.div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="conversation-search-title"
              initial={reduceMotion ? false : { opacity: 0, y: 10, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.99 }}
              className="relative flex h-[100dvh] w-full min-w-0 flex-col overflow-hidden bg-nexa-bg shadow-messaging-4 sm:h-[88dvh] sm:w-[90vw] sm:max-w-[700px] sm:rounded-messaging-panel sm:border sm:border-nexa-line"
            >
              <header className="shrink-0 border-b border-nexa-line bg-white px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-5 sm:pt-5">
                <div className="mb-3 flex items-center justify-between">
                  <h2 id="conversation-search-title" className="font-display text-xl font-semibold text-nexa-ink">{t("inbox.phase10.searchConversation")}</h2>
                  <button type="button" onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-full text-nexa-ink-3 hover:bg-nexa-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-primary/40" aria-label={t("common.close")}>
                    <X className="h-5 w-5" aria-hidden />
                  </button>
                </div>
                <ConversationSearchBar
                  ref={inputRef}
                  value={query}
                  onChange={setQuery}
                  placeholder={t("inbox.phase10.searchPlaceholder")}
                  clearLabel={t("inbox.phase10.clearSearch")}
                  shortcut="Ctrl K"
                  onKeyDown={(event) => {
                    if (event.key === "Enter") remember(query);
                    if (event.key === "ArrowDown") {
                      event.preventDefault();
                      dialogRef.current?.querySelector<HTMLButtonElement>("[data-search-result] button")?.focus();
                    }
                  }}
                />
                {query.trim().length >= 2 ? (
                  <div className="mt-3 space-y-3">
                    <SearchMatchCounter query={query} count={results.length} label={t("inbox.phase10.matches")} />
                    {availableFilters.length > 1 ? (
                      <SearchFilterChips
                        filters={availableFilters}
                        selected={filter}
                        onChange={(next) => {
                          setFilter(next);
                          trackEvent("conversation_search_filter_changed", {
                            conversation_id: conversationId,
                            filter: next,
                          });
                        }}
                        labels={{
                          all: t("inbox.phase10.filter.all"),
                          message: t("inbox.phase10.filter.message"),
                          card: t("inbox.phase10.filter.card"),
                          photo: t("inbox.phase10.filter.photo"),
                          file: t("inbox.phase10.filter.file"),
                          link: t("inbox.phase10.filter.link"),
                        }}
                      />
                    ) : null}
                  </div>
                ) : null}
              </header>

              <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:px-5" onKeyDown={onResultKeyDown}>
                {query.trim().length < 2 ? (
                  <div className="space-y-6">
                    <RecentSearches
                      items={recent}
                      title={t("inbox.phase10.recent")}
                      clearLabel={t("inbox.phase10.clearHistory")}
                      onSelect={setQuery}
                      onClear={() => {
                        setRecent([]);
                        sessionStorage.removeItem(storageKey);
                      }}
                    />
                    {suggestions.length ? (
                      <section>
                        <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-nexa-ink-4">{t("inbox.phase10.suggestions")}</h3>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {suggestions.map((suggestion) => (
                            <button key={suggestion} type="button" onClick={() => setQuery(suggestion)} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-nexa-line bg-white px-3 text-xs font-semibold text-nexa-ink-3 shadow-messaging-1 hover:border-nexa-primary/20 hover:text-nexa-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-primary/40">
                              <Search className="h-3.5 w-3.5" aria-hidden />{suggestion}
                            </button>
                          ))}
                        </div>
                      </section>
                    ) : null}
                  </div>
                ) : loading ? (
                  <div className="flex min-h-[280px] items-center justify-center" role="status">
                    <LoaderCircle className="h-6 w-6 animate-spin text-nexa-primary motion-reduce:animate-none" aria-hidden />
                    <span className="sr-only">{t("inbox.phase10.searching")}</span>
                  </div>
                ) : results.length ? (
                  <SearchResultsList
                    results={results}
                    filter={filter}
                    query={query}
                    locale={locale}
                    messages={messages}
                    counterpartName={counterpartName}
                    viewerRole={viewerRole}
                    labels={{
                      sections: {
                        message: t("inbox.phase10.section.message"),
                        card: t("inbox.phase10.section.card"),
                        photo: t("inbox.phase10.section.photo"),
                        file: t("inbox.phase10.section.file"),
                        link: t("inbox.phase10.section.link"),
                      },
                      jump: t("inbox.phase10.jump"),
                      open: t("inbox.phase10.open"),
                      host: t("inbox.phase10.host"),
                      guest: t("inbox.phase10.guest"),
                    }}
                    onOpen={closeAndJump}
                  />
                ) : (
                  <SearchEmptyState title={t("inbox.phase10.emptyTitle")} body={t("inbox.phase10.emptyBody")} />
                )}
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </OverlayPortal>
  );
}
