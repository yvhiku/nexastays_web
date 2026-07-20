"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { clearDraft, loadDraft, saveDraft } from "@/lib/messaging/draft-store";

const SAVE_DEBOUNCE_MS = 400;

export function useConversationDraft(conversationId: string | null) {
  const [draft, setDraft] = useState("");
  const [ready, setReady] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    if (!conversationId) {
      setDraft("");
      setReady(true);
      return;
    }
    void loadDraft(conversationId).then((text) => {
      if (!cancelled) {
        setDraft(text);
        setReady(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  const updateDraft = useCallback(
    (text: string) => {
      setDraft(text);
      if (!conversationId) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        void saveDraft(conversationId, text);
      }, SAVE_DEBOUNCE_MS);
    },
    [conversationId],
  );

  const discardDraft = useCallback(async () => {
    if (!conversationId) return;
    setDraft("");
    await clearDraft(conversationId);
  }, [conversationId]);

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  return { draft, updateDraft, discardDraft, ready };
}
