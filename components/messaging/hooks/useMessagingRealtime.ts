"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  MessagingRealtimeAdapter,
  type RealtimeMode,
} from "@/lib/messaging/realtime-adapter";
import { subscribeMessagingRealtime } from "@/lib/messaging/realtime-stream";

export function useMessagingRealtime(
  mode: RealtimeMode,
  onPoll: () => void | Promise<void>,
  enabled = true,
  token?: string | null,
): { bumpActivity: () => void } {
  const onPollRef = useRef(onPoll);
  const adapterRef = useRef<MessagingRealtimeAdapter | null>(null);
  const inFlightRef = useRef(false);
  const queuedRef = useRef(false);
  onPollRef.current = onPoll;

  if (!adapterRef.current) {
    adapterRef.current = new MessagingRealtimeAdapter();
  }

  const runPoll = useCallback(async () => {
    if (inFlightRef.current) {
      queuedRef.current = true;
      return;
    }
    inFlightRef.current = true;
    try {
      await onPollRef.current();
    } finally {
      inFlightRef.current = false;
      if (queuedRef.current) {
        queuedRef.current = false;
        void runPoll();
      }
    }
  }, []);

  const bumpActivity = useCallback(() => {
    adapterRef.current?.bumpActivity();
  }, []);

  useEffect(() => {
    const adapter =
      adapterRef.current ??
      (adapterRef.current = new MessagingRealtimeAdapter());
    if (!enabled || mode === "off") {
      adapter.stop();
      return;
    }

    adapter.start(mode, runPoll);
    return () => {
      adapter.stop();
    };
  }, [mode, enabled, runPoll]);

  useEffect(() => {
    if (!enabled || mode === "off" || !token) return;
    return subscribeMessagingRealtime(token, () => void runPoll());
  }, [enabled, mode, runPoll, token]);

  useEffect(
    () => () => {
      adapterRef.current?.dispose();
      adapterRef.current = null;
    },
    [],
  );

  return { bumpActivity };
}
