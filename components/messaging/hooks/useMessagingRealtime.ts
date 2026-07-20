"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  getMessagingRealtimeAdapter,
  type RealtimeMode,
} from "@/lib/messaging/realtime-adapter";

export function useMessagingRealtime(
  mode: RealtimeMode,
  onPoll: () => void | Promise<void>,
  enabled = true,
): { bumpActivity: () => void } {
  const onPollRef = useRef(onPoll);
  onPollRef.current = onPoll;

  const bumpActivity = useCallback(() => {
    getMessagingRealtimeAdapter().bumpActivity();
  }, []);

  useEffect(() => {
    const adapter = getMessagingRealtimeAdapter();
    if (!enabled || mode === "off") {
      adapter.stop();
      return;
    }

    adapter.start(mode, () => onPollRef.current());
    return () => {
      adapter.stop();
    };
  }, [mode, enabled]);

  return { bumpActivity };
}
