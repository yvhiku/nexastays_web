"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getHeaderState, type HeaderState } from "@/lib/header-api";
import { isJwtExpired } from "@/lib/jwt-utils";
import { runAfterIdle } from "@/lib/defer-after-idle";
import { useMessagingRealtime } from "@/components/messaging/hooks/useMessagingRealtime";

const POLL_MS = 60_000;

type HeaderStateContextValue = HeaderState & {
  refresh: () => Promise<void>;
  setNotificationCount: (count: number) => void;
  pollingActive: boolean;
};

const HeaderStateContext = createContext<HeaderStateContextValue | null>(null);

export function HeaderStateProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, token, tokenType, ready, refreshUser } = useAuth();
  const [state, setState] = useState<HeaderState>({
    notificationCount: 0,
    inboxCount: 0,
    avatar: null,
    hostMode: false,
  });
  const [idleReady, setIdleReady] = useState(false);
  const mountedRef = useRef(true);
  const refreshInFlightRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    runAfterIdle(() => {
      if (mountedRef.current) setIdleReady(true);
    });
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refresh = useCallback(() => {
    if (refreshInFlightRef.current) return refreshInFlightRef.current;

    const request = (async () => {
      if (!isAuthenticated || tokenType !== "jwt" || !token) {
        setState({
          notificationCount: 0,
          inboxCount: 0,
          avatar: null,
          hostMode: false,
        });
        return;
      }
      if (isJwtExpired(token)) {
        await refreshUser();
        return;
      }
      const next = await getHeaderState(token);
      if (next === null) {
        await refreshUser();
        return;
      }
      if (mountedRef.current) setState(next);
    })();
    refreshInFlightRef.current = request;
    void request.finally(() => {
      if (refreshInFlightRef.current === request) {
        refreshInFlightRef.current = null;
      }
    });
    return request;
  }, [isAuthenticated, refreshUser, token, tokenType]);

  const setNotificationCount = useCallback((count: number) => {
    setState((prev) => ({
      ...prev,
      notificationCount: Math.max(0, count),
    }));
  }, []);

  const canPoll =
    ready &&
    idleReady &&
    isAuthenticated &&
    tokenType === "jwt" &&
    !!token &&
    typeof document !== "undefined" &&
    document.visibilityState === "visible";

  useEffect(() => {
    if (!canPoll) return;

    void refresh();
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void refresh();
      }
    }, POLL_MS);

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void refresh();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [canPoll, refresh]);

  useMessagingRealtime(
    "inbox",
    refresh,
    canPoll,
    token,
  );

  const value = useMemo(
    () => ({
      ...state,
      refresh,
      setNotificationCount,
      pollingActive: canPoll,
    }),
    [state, refresh, setNotificationCount, canPoll],
  );

  return (
    <HeaderStateContext.Provider value={value}>{children}</HeaderStateContext.Provider>
  );
}

export function useHeaderState(): HeaderStateContextValue {
  const ctx = useContext(HeaderStateContext);
  if (!ctx) {
    return {
      notificationCount: 0,
      inboxCount: 0,
      avatar: null,
      hostMode: false,
      refresh: async () => {},
      setNotificationCount: () => {},
      pollingActive: false,
    };
  }
  return ctx;
}
