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
        className="flex h-11 w-11 items-center justify-center rounded-full text-nexa-primary transition-[background-color,transform] hover:bg-nexa-primary-soft active:scale-95 motion-reduce:transition-none lg:h-10 lg:w-10"
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
            className="mt-3 w-full rounded-2xl border border-nexa-primary/15 bg-white px-4 py-3 text-sm text-nexa-ink shadow-[0_5px_16px_rgba(90,44,65,0.08)] placeholder:text-nexa-ink-4 focus:border-nexa-primary/35 focus:outline-none focus:ring-2 focus:ring-nexa-primary/20"
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
                className={`min-h-11 rounded-full border px-3 py-1.5 text-xs font-semibold transition-[background-color,border-color,box-shadow,transform] active:scale-95 motion-reduce:transition-none ${
                  filter === f.id ? "border-nexa-primary/20 bg-[linear-gradient(135deg,#f4809a,#e8507a)] text-white shadow-nexa-sm" : "border-nexa-line/70 bg-white text-nexa-ink-3 hover:border-nexa-primary/20 hover:text-nexa-primary hover:shadow-sm"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <ul className="mt-4 max-h-[50dvh] space-y-2 overflow-y-auto">
            {loading ? (
              <li className="py-4 text-center text-sm text-nexa-ink-3">Searching…</li>
            ) : results.length === 0 ? (
              <li className="py-4 text-center text-sm text-nexa-ink-3">No results</li>
            ) : (
              results.map((r) => (
                <li key={`${r.messageId}-${r.resultType}`}>
                  <button
                    type="button"
                    className="w-full rounded-2xl border border-nexa-line/70 bg-white px-4 py-3 text-left shadow-[0_3px_12px_rgba(85,43,62,0.05)] transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-nexa-primary/20 hover:shadow-nexa-sm active:translate-y-0 motion-reduce:transition-none"
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
