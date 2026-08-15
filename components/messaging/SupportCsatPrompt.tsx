"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  getSupportTicketCsat,
  listSupportTickets,
  submitSupportTicketCsat,
  type SupportCsatAgent,
} from "@/lib/messaging/messages-api";

type Props = {
  conversationId: string;
  conversationType?: string | null;
  token?: string | null;
};

function StarRow({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (next: number) => void;
  label: string;
}) {
  return (
    <div className="mt-2 flex gap-1" role="group" aria-label={label}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`h-8 w-8 rounded ${
            value >= star ? "text-amber-500" : "text-muted-foreground"
          }`}
          onClick={() => onChange(star)}
          aria-label={`${star} stars`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export function SupportCsatPrompt({
  conversationId,
  conversationType,
  token,
}: Props) {
  const { t, tf } = useLanguage();
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [ticketStatus, setTicketStatus] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [existingRating, setExistingRating] = useState<number | null>(null);
  const [agent, setAgent] = useState<SupportCsatAgent | null>(null);
  const [rating, setRating] = useState(0);
  const [agentRating, setAgentRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (conversationType && conversationType.toUpperCase() !== "SUPPORT") {
      setReady(true);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const tickets = await listSupportTickets(token, 100);
        const match = tickets.find((t) => t.conversation_id === conversationId);
        if (cancelled || !match) {
          if (!cancelled) setReady(true);
          return;
        }
        setTicketId(match.id);
        setTicketStatus(match.status);
        if (match.status !== "CLOSED") {
          if (!cancelled) setReady(true);
          return;
        }
        const state = await getSupportTicketCsat(match.id, token);
        if (cancelled) return;
        setSubmitted(state.submitted || state.alreadyReviewed);
        setExistingRating(state.csat?.rating ?? null);
        setAgent(state.agent);
      } catch {
        /* ignore — CSAT is optional UX */
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [conversationId, conversationType, token]);

  if (!ready || !ticketId) return null;
  if (ticketStatus !== "CLOSED") return null;

  if (submitted) {
    return (
      <div className="mx-4 mb-3 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
        {t("inbox.csatThanks")}
        {existingRating ? ` (${existingRating}/5)` : ""}.
      </div>
    );
  }

  const needsAgentRating = Boolean(agent);
  const canSubmit = rating >= 1 && (!needsAgentRating || agentRating >= 1);

  return (
    <div className="mx-4 mb-3 rounded-lg border border-border bg-background px-3 py-3 text-sm">
      <p className="font-medium">{t("inbox.csatTitle")}</p>
      <StarRow value={rating} onChange={setRating} label={t("inbox.csatTitle")} />
      {agent ? (
        <>
          <p className="mt-3 font-medium">
            {tf("inbox.csatAgent", {
              name: agent.fullName ?? t("inbox.csatAgentFallback"),
            })}
          </p>
          <StarRow
            value={agentRating}
            onChange={setAgentRating}
            label={tf("inbox.csatAgent", {
              name: agent.fullName ?? t("inbox.csatAgentFallback"),
            })}
          />
        </>
      ) : null}
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder={t("inbox.csatComment")}
        maxLength={2000}
        className="mt-2 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
        rows={2}
      />
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
      <button
        type="button"
        disabled={saving || !canSubmit}
        className="mt-2 rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background disabled:opacity-50"
        onClick={() => {
          void (async () => {
            setSaving(true);
            setError(null);
            try {
              const next = await submitSupportTicketCsat(
                ticketId,
                {
                  rating,
                  comment,
                  ...(needsAgentRating ? { agentRating } : {}),
                },
                token,
              );
              setSubmitted(true);
              setExistingRating(next.csat?.rating ?? rating);
            } catch (err) {
              setError(
                err instanceof Error ? err.message : t("inbox.csatError"),
              );
            } finally {
              setSaving(false);
            }
          })();
        }}
      >
        {t("inbox.csatSubmit")}
      </button>
    </div>
  );
}
