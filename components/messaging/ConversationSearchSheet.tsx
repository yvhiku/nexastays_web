"use client";

import React, { useState } from "react";
import { Search } from "lucide-react";
import { BottomSheet } from "@/components/mobile/BottomSheet";
import { SheetHeader } from "@/components/mobile/SheetHeader";
import {
  searchConversation,
  type ConversationSearchResult,
  type SearchResultType,
} from "@/lib/messaging/messages-api";

type Props = {
  conversationId: string;
  token: string | null;
  onJumpToMessage: (messageId: string) => void;
};

const FILTERS: { id: SearchResultType | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "message", label: "Messages" },
  { id: "photo", label: "Photos" },
  { id: "file", label: "Files" },
  { id: "link", label: "Links" },
  { id: "card", label: "Cards" },
];

export function ConversationSearchSheet({ conversationId, token, onJumpToMessage }: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<SearchResultType | "all">("all");
  const [results, setResults] = useState<ConversationSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const runSearch = async (query: string, type: SearchResultType | "all") => {
    if (!token || query.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const types = type === "all" ? undefined : [type];
      const data = await searchConversation(conversationId, query.trim(), token, types);
      setResults(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-10 w-10 items-center justify-center rounded-full text-nexa-ink-3 hover:bg-[#F7F7F7]"
        aria-label="Search conversation"
      >
        <Search className="h-5 w-5" />
      </button>

      <BottomSheet open={open} onOpenChange={setOpen} ariaLabel="Search" height="full">
        <div className="px-4 pb-6">
          <SheetHeader title="Search" onClose={() => setOpen(false)} />
          <input
            value={q}
            onChange={(e) => {
              const next = e.target.value;
              setQ(next);
              void runSearch(next, filter);
            }}
            placeholder="Search messages, files, photos…"
            className="mt-3 w-full rounded-xl border border-nexa-line px-3 py-2 text-sm"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  setFilter(f.id);
                  void runSearch(q, f.id);
                }}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  filter === f.id ? "bg-nexa-primary text-white" : "bg-nexa-bg-2 text-nexa-ink-3"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <ul className="mt-4 max-h-[50dvh] overflow-y-auto divide-y divide-nexa-line/50">
            {loading ? (
              <li className="py-4 text-center text-sm text-nexa-ink-3">Searching…</li>
            ) : results.length === 0 ? (
              <li className="py-4 text-center text-sm text-nexa-ink-3">No results</li>
            ) : (
              results.map((r) => (
                <li key={`${r.messageId}-${r.resultType}`}>
                  <button
                    type="button"
                    className="w-full py-3 text-left"
                    onClick={() => {
                      onJumpToMessage(r.messageId);
                      setOpen(false);
                    }}
                  >
                    <span className="text-[10px] font-bold uppercase text-nexa-primary">
                      {r.resultType}
                    </span>
                    <p className="text-sm text-nexa-ink line-clamp-2">{r.snippet}</p>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      </BottomSheet>
    </>
  );
}
