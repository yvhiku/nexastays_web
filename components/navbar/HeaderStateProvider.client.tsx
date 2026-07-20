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
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getHeaderState, type HeaderState } from "@/lib/header-api";
import { runAfterIdle } from "@/lib/defer-after-idle";
import { useMessagingRealtime } from "@/components/messaging/hooks/useMessagingRealtime";

const POLL_MS = 60_000;

type HeaderStateContextValue = HeaderState & {
  refresh: () => Promise<void>;
  pollingActive: boolean;
};

const HeaderStateContext = createContext<HeaderStateContextValue | null>(null);

export function HeaderStateProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated, token, tokenType, ready } = useAuth();
  const [state, setState] = useState<HeaderState>({
    notificationCount: 0,
    inboxCount: 0,
    avatar: null,
    hostMode: false,
  });
  const [pollingActive, setPollingActive] = useState(false);
  const [idleReady, setIdleReady] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    runAfterIdle(() => {
      if (mountedRef.current) setIdleReady(true);
    });
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    if (!isAuthenticated || tokenType !== "jwt" || !token) {
      setState({
        notificationCount: 0,
        inboxCount: 0,
        avatar: null,
        hostMode: false,
      });
      return;
    }
    const next = await getHeaderState(token);
    if (mountedRef.current) setState(next);
  }, [isAuthenticated, token, tokenType]);

  const canPoll =
    ready &&
    idleReady &&
    isAuthenticated &&
    tokenType === "jwt" &&
    !!token &&
    typeof document !== "undefined" &&
    document.visibilityState === "visible";

  useEffect(() => {
    setPollingActive(canPoll);
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

  const onInboxRoute =
    pathname.includes("/inbox") || pathname.includes("/bookings/");

  useMessagingRealtime(
    "inbox",
    refresh,
    canPoll && onInboxRoute,
  );

  const value = useMemo(
    () => ({
      ...state,
      refresh,
      pollingActive: canPoll,
    }),
    [state, refresh, canPoll],
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
      pollingActive: false,
    };
  }
  return ctx;
}
