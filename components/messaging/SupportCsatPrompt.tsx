"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
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

function IntegerStarRating({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (next: number) => void;
  label: string;
}) {
  return (
    <div className="mt-2 flex justify-center gap-2" role="radiogroup" aria-label={label}>
      {Array.from({ length: 5 }, (_, i) => {
        const star = i + 1;
        const filled = value >= star;
        return (
          <button
            key={star}
            type="button"
            className="group"
            onClick={() => onChange(star)}
            aria-label={`${star} stars`}
          >
            <svg
              viewBox="0 0 24 24"
              className={cn(
                "h-9 w-9 transition-transform duration-200 group-hover:scale-110",
                filled
                  ? "fill-nexa-primary/90 text-nexa-primary"
                  : "fill-nexa-bg-2 text-nexa-line",
              )}
              aria-hidden
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
            </svg>
          </button>
        );
      })}
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
  const [canReview, setCanReview] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [existingRating, setExistingRating] = useState<number | null>(null);
  const [existingSolved, setExistingSolved] = useState<boolean | null>(null);
  const [agent, setAgent] = useState<SupportCsatAgent | null>(null);
  const [problemSolved, setProblemSolved] = useState<boolean | null>(null);
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
        const match = tickets.find((row) => row.conversation_id === conversationId);
        if (cancelled || !match) {
          if (!cancelled) setReady(true);
          return;
        }
        setTicketId(match.id);
        const state = await getSupportTicketCsat(match.id, token);
        if (cancelled) return;
        setCanReview(state.canReview);
        setSubmitted(state.submitted || state.alreadyReviewed);
        setExistingRating(state.csat?.rating ?? null);
        setExistingSolved(state.csat?.problem_solved ?? null);
        setAgent(state.agent);
      } catch {
        /* optional UX */
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [conversationId, conversationType, token]);

  if (!ready || !ticketId) return null;
  if (!canReview && !submitted) return null;

  if (submitted) {
    return (
      <div className="mx-4 mb-3 rounded-xl border border-green-200/80 bg-green-50/80 px-5 py-5 text-center shadow-messaging-2">
        <CheckCircle2 className="mx-auto h-8 w-8 text-nexa-primary" aria-hidden />
        <p className="mt-2 font-display text-base font-semibold text-nexa-ink">
          {t("inbox.csatThanks")}
        </p>
        {existingSolved != null ? (
          <p className="mt-1 text-sm text-nexa-ink-3">
            {existingSolved ? t("inbox.csatSolvedYes") : t("inbox.csatSolvedNo")}
            {existingRating ? ` · ${existingRating}/5` : ""}
          </p>
        ) : existingRating ? (
          <p className="mt-1 text-sm text-nexa-ink-3">{existingRating}/5</p>
        ) : null}
      </div>
    );
  }

  const needsAgentRating = Boolean(agent);
  const canSubmit =
    problemSolved !== null &&
    rating >= 1 &&
    (!needsAgentRating || agentRating >= 1);

  return (
    <div className="mx-4 mb-3 rounded-messaging-panel border border-nexa-primary/25 bg-nexa-primary-soft/50 px-5 py-5 shadow-messaging-2">
      <p className="text-center font-display text-base font-semibold text-nexa-ink">
        {t("inbox.csatSolvedQuestion")}
      </p>
      <div className="mt-3 flex justify-center gap-2">
        {[
          { value: true, label: t("inbox.csatYes") },
          { value: false, label: t("inbox.csatNo") },
        ].map((option) => (
          <button
            key={String(option.value)}
            type="button"
            onClick={() => setProblemSolved(option.value)}
            className={cn(
              "min-h-10 rounded-full px-5 text-sm font-semibold shadow-messaging-1 transition-[background-color,color,transform] duration-messaging-hover",
              problemSolved === option.value
                ? "bg-nexa-primary text-white"
                : "border border-nexa-line bg-white text-nexa-ink-2 hover:bg-white",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <p className="mt-5 text-center font-semibold text-nexa-ink">{t("inbox.csatTitle")}</p>
      <IntegerStarRating
        value={rating}
        onChange={setRating}
        label={t("inbox.csatTitle")}
      />

      {agent ? (
        <>
          <p className="mt-4 text-center font-semibold text-nexa-ink">
            {tf("inbox.csatAgent", {
              name: agent.fullName ?? t("inbox.csatAgentFallback"),
            })}
          </p>
          <IntegerStarRating
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
        onChange={(event) => setComment(event.target.value)}
        placeholder={t("inbox.csatComment")}
        maxLength={2000}
        rows={3}
        className="mt-4 w-full rounded-xl border border-nexa-line bg-nexa-bg-2 px-3 py-2.5 text-sm text-nexa-ink placeholder:text-nexa-ink-4 focus:outline-none focus:ring-2 focus:ring-nexa-primary/30"
      />
      {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
      <button
        type="button"
        disabled={saving || !canSubmit}
        className="mt-4 w-full rounded-full bg-nexa-primary px-4 py-3 text-sm font-semibold text-white shadow-nexa-md hover:bg-nexa-primary-dark disabled:opacity-50"
        onClick={() => {
          void (async () => {
            if (problemSolved == null) return;
            setSaving(true);
            setError(null);
            try {
              const next = await submitSupportTicketCsat(
                ticketId,
                {
                  problemSolved,
                  rating,
                  comment,
                  ...(needsAgentRating ? { agentRating } : {}),
                },
                token,
              );
              setSubmitted(true);
              setCanReview(false);
              setExistingRating(next.csat?.rating ?? rating);
              setExistingSolved(next.csat?.problem_solved ?? problemSolved);
            } catch (err) {
              setError(err instanceof Error ? err.message : t("inbox.csatError"));
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
