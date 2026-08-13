"use client";

import React, { useEffect, useState } from "react";
import { Phone } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  reportSafetyIssue,
  type SafetyIssueCategory,
} from "@/lib/messaging/messages-api";
import { trackEvent } from "@/lib/analytics";
import { ReportCategoryList } from "./ReportCategoryList";
import { ReportDetailsStep } from "./ReportDetailsStep";
import { ReportConfirmation } from "./ReportConfirmation";
import { ReportFlowShell, ReportStickyCta } from "./ReportFlowShell";
import {
  hasSafetyBookingContext,
  SAFETY_CATEGORIES,
  type SafetyBookingContext,
} from "./report-categories";

type Step = "category" | "details" | "done" | "emergency";

type Props = {
  open: boolean;
  onClose: () => void;
  conversationId: string;
  token: string | null;
  bookingContext?: SafetyBookingContext | null;
  onContactSupport?: (supportUrl: string) => void;
};

export function SafetyIssueSheet({
  open,
  onClose,
  conversationId,
  token,
  bookingContext,
  onContactSupport,
}: Props) {
  const { t, locale } = useLanguage();
  const [step, setStep] = useState<Step>("category");
  const [category, setCategory] = useState<SafetyIssueCategory | null>(null);
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supportUrl, setSupportUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setStep("category");
    setCategory(null);
    setDetails("");
    setSubmitting(false);
    setError(null);
    setSupportUrl(null);
  }, [open]);

  const title =
    step === "done"
      ? t("inbox.safetyFlow.confirmationTitle")
      : step === "emergency"
        ? t("inbox.safetyFlow.emergencyTitle")
        : step === "details"
          ? t("inbox.safetyFlow.detailsTitle")
          : t("inbox.safetyFlow.title");

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const handleBack = () => {
    if (submitting) return;
    if (step === "details" || step === "emergency") {
      setError(null);
      setStep("category");
      return;
    }
    handleClose();
  };

  const formatStayDates = () => {
    if (!bookingContext?.checkIn && !bookingContext?.checkOut) return null;
    const fmt = (iso?: string) => {
      if (!iso) return null;
      try {
        return new Intl.DateTimeFormat(locale, {
          month: "short",
          day: "numeric",
        }).format(new Date(iso));
      } catch {
        return iso;
      }
    };
    const a = fmt(bookingContext.checkIn);
    const b = fmt(bookingContext.checkOut);
    if (a && b) return `${a} – ${b}`;
    return a ?? b;
  };

  const submit = async () => {
    if (!token || !category || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await reportSafetyIssue(
        conversationId,
        {
          category,
          details: details.trim() || undefined,
        },
        token,
      );
      trackEvent("conversation_safety_reported", {
        conversation_id: conversationId,
        category,
      });
      setSupportUrl(result.supportUrl || null);
      setStep("done");
    } catch {
      setError(t("inbox.safetyFlow.submitError"));
    } finally {
      setSubmitting(false);
    }
  };

  const showStay = hasSafetyBookingContext(bookingContext);
  const stayDates = formatStayDates();

  return (
    <ReportFlowShell
      open={open}
      onClose={handleClose}
      title={title}
      onBack={
        step === "details" || step === "emergency" ? handleBack : undefined
      }
      showClose={step !== "done"}
    >
      {step === "category" ? (
        <>
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4 sm:px-5">
            <div className="rounded-xl border border-red-200/80 bg-red-50/90 px-4 py-3.5">
              <p className="text-sm font-semibold text-red-900">
                {t("inbox.safetyFlow.emergencyHeading")}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-red-800/90">
                {t("inbox.safetyFlow.emergencyBody")}
              </p>
              <button
                type="button"
                onClick={() => setStep("emergency")}
                className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-red-700 px-3.5 text-sm font-semibold text-white shadow-messaging-1 transition-[transform,opacity] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50"
              >
                <Phone className="h-4 w-4" aria-hidden />
                {t("inbox.safetyFlow.getEmergencyHelp")}
              </button>
            </div>

            <div>
              <p className="mb-3 text-sm font-semibold text-nexa-ink">
                {t("inbox.safetyFlow.categoryPrompt")}
              </p>
              <ReportCategoryList
                name="safety-category"
                value={category}
                onChange={(id) => setCategory(id as SafetyIssueCategory)}
                items={SAFETY_CATEGORIES.map((c) => ({
                  id: c.id,
                  label: t(c.labelKey),
                }))}
              />
            </div>
          </div>
          <ReportStickyCta
            label={t("inbox.safetyFlow.continue")}
            disabled={!category}
            onClick={() => setStep("details")}
          />
        </>
      ) : null}

      {step === "emergency" ? (
        <>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
            <div className="space-y-3 rounded-xl border border-nexa-line bg-white px-4 py-4 shadow-messaging-1">
              <p className="text-sm leading-relaxed text-nexa-ink-2">
                {t("inbox.safetyFlow.emergencyGuidance")}
              </p>
              <p className="text-xs leading-relaxed text-nexa-ink-3">
                {t("inbox.safetyFlow.emergencyGuidanceNote")}
              </p>
            </div>
          </div>
          <ReportStickyCta
            label={t("inbox.safetyFlow.backToReport")}
            onClick={() => setStep("category")}
          />
        </>
      ) : null}

      {step === "details" ? (
        <>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
            <ReportDetailsStep
              value={details}
              onChange={setDetails}
              label={t("inbox.safetyFlow.whatHappened")}
              placeholder={t("inbox.safetyFlow.detailsPlaceholder")}
              disabled={submitting}
            />
            {showStay ? (
              <div className="rounded-xl border border-nexa-line bg-white px-4 py-3 shadow-messaging-1">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-nexa-ink-4">
                  {t("inbox.safetyFlow.relatedStay")}
                </p>
                {bookingContext?.listingName ? (
                  <p className="mt-1 text-sm font-semibold text-nexa-ink">
                    {bookingContext.listingName}
                  </p>
                ) : null}
                {stayDates ? (
                  <p className="mt-0.5 text-sm text-nexa-ink-3">{stayDates}</p>
                ) : null}
              </div>
            ) : null}
            {error ? (
              <p
                className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                role="alert"
              >
                {error}
              </p>
            ) : null}
          </div>
          <ReportStickyCta
            label={t("inbox.safetyFlow.submit")}
            loading={submitting}
            onClick={() => void submit()}
          />
        </>
      ) : null}

      {step === "done" ? (
        <ReportConfirmation
          title={t("inbox.safetyFlow.confirmationTitle")}
          body={t("inbox.safetyFlow.confirmationBody")}
          doneLabel={t("inbox.safetyFlow.done")}
          onDone={onClose}
          secondaryAction={
            supportUrl
              ? {
                  label: t("inbox.safetyFlow.contactSupport"),
                  onClick: () => {
                    onContactSupport?.(supportUrl);
                    onClose();
                  },
                }
              : undefined
          }
        />
      ) : null}
    </ReportFlowShell>
  );
}
