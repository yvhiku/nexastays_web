"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Cursor-append list loader with:
 * - reset on query key change (cancel/ignore stale)
 * - single in-flight next-page guard
 * - page-2 failure preserves already-loaded items
 */

export type CursorPage<T> = {
  items: T[];
  pagination: {
    limit: number;
    has_next: boolean;
    next_cursor: string | null;
  };
};

type Fetcher<T> = (cursor: string | null) => Promise<CursorPage<T>>;

export function useHostCursorList<T>(options: {
  enabled: boolean;
  /** Change this when filter/search/sort/etc changes — resets list. */
  queryKey: string;
  fetchPage: Fetcher<T>;
}) {
  const { enabled, queryKey, fetchPage } = options;
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const genRef = useRef(0);
  const inFlightRef = useRef(false);
  const fetchPageRef = useRef(fetchPage);
  fetchPageRef.current = fetchPage;

  const loadFirst = useCallback(async () => {
    if (!enabled) return;
    const gen = ++genRef.current;
    inFlightRef.current = true;
    setLoading(true);
    setError(null);
    setLoadMoreError(null);
    setItems([]);
    setNextCursor(null);
    setHasNext(true);
    try {
      const page = await fetchPageRef.current(null);
      if (gen !== genRef.current) return;
      setItems(page.items);
      setHasNext(page.pagination.has_next);
      setNextCursor(page.pagination.next_cursor);
    } catch (e) {
      if (gen !== genRef.current) return;
      setItems([]);
      setHasNext(false);
      setNextCursor(null);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      if (gen === genRef.current) {
        setLoading(false);
        inFlightRef.current = false;
      }
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setItems([]);
      setLoading(false);
      setHasNext(false);
      setNextCursor(null);
      return;
    }
    void loadFirst();
    // queryKey intentionally drives reset
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, queryKey, loadFirst]);

  const loadMore = useCallback(async () => {
    if (!enabled || !hasNext || !nextCursor) return;
    if (inFlightRef.current || loading || loadingMore) return;
    const gen = genRef.current;
    const cursor = nextCursor;
    inFlightRef.current = true;
    setLoadingMore(true);
    setLoadMoreError(null);
    try {
      const page = await fetchPageRef.current(cursor);
      if (gen !== genRef.current) return;
      setItems((prev) => [...prev, ...page.items]);
      setHasNext(page.pagination.has_next);
      setNextCursor(page.pagination.next_cursor);
    } catch (e) {
      if (gen !== genRef.current) return;
      setLoadMoreError(e instanceof Error ? e.message : String(e));
    } finally {
      if (gen === genRef.current) {
        setLoadingMore(false);
        inFlightRef.current = false;
      }
    }
  }, [enabled, hasNext, nextCursor, loading, loadingMore]);

  return {
    items,
    loading,
    loadingMore,
    error,
    loadMoreError,
    hasNext,
    loadMore,
    reload: loadFirst,
  };
}
