"use client";

import React, { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  reportConversation,
  type ConversationReportCategory,
} from "@/lib/messaging/messages-api";
import { trackEvent } from "@/lib/analytics";
import { ReportCategoryList } from "./ReportCategoryList";
import { ReportDetailsStep } from "./ReportDetailsStep";
import { ReportConfirmation } from "./ReportConfirmation";
import { ReportFlowShell, ReportStickyCta } from "./ReportFlowShell";
import { formatReportReason, REPORT_CATEGORIES } from "./report-categories";

type Step = "category" | "details" | "done";

type Props = {
  open: boolean;
  onClose: () => void;
  conversationId: string;
  token: string | null;
};

export function ReportConversationSheet({
  open,
  onClose,
  conversationId,
  token,
}: Props) {
  const { t } = useLanguage();
  const [step, setStep] = useState<Step>("category");
  const [category, setCategory] = useState<ConversationReportCategory | null>(
    null,
  );
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setStep("category");
    setCategory(null);
    setDetails("");
    setSubmitting(false);
    setError(null);
  }, [open]);

  const title =
    step === "done"
      ? t("inbox.reportFlow.confirmationTitle")
      : step === "details"
        ? t("inbox.reportFlow.detailsTitle")
        : t("inbox.reportFlow.title");

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const handleBack = () => {
    if (submitting) return;
    if (step === "details") {
      setError(null);
      setStep("category");
      return;
    }
    handleClose();
  };

  const submit = async () => {
    if (!token || !category || submitting) return;
    setSubmitting(true);
    setError(null);
    const reason = formatReportReason(category, details);
    try {
      await reportConversation(conversationId, reason, token);
      trackEvent("conversation_reported", {
        conversation_id: conversationId,
        category,
      });
      setStep("done");
    } catch {
      setError(t("inbox.reportFlow.submitError"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ReportFlowShell
      open={open}
      onClose={handleClose}
      title={title}
      onBack={step === "details" ? handleBack : undefined}
      showClose={step !== "done"}
    >
      {step === "category" ? (
        <>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
            <p className="mb-4 text-sm text-nexa-ink-3">
              {t("inbox.reportFlow.categoryPrompt")}
            </p>
            <ReportCategoryList
              name="report-category"
              value={category}
              onChange={(id) =>
                setCategory(id as ConversationReportCategory)
              }
              items={REPORT_CATEGORIES.map((c) => ({
                id: c.id,
                label: t(c.labelKey),
              }))}
            />
          </div>
          <ReportStickyCta
            label={t("inbox.reportFlow.continue")}
            disabled={!category}
            onClick={() => setStep("details")}
          />
        </>
      ) : null}

      {step === "details" ? (
        <>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
            <ReportDetailsStep
              value={details}
              onChange={setDetails}
              label={t("inbox.reportFlow.whatHappened")}
              placeholder={t("inbox.reportFlow.detailsPlaceholder")}
              helperText={t("inbox.reportFlow.detailsHelper")}
              disabled={submitting}
            />
            {error ? (
              <p
                className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                role="alert"
              >
                {error}
              </p>
            ) : null}
          </div>
          <ReportStickyCta
            label={t("inbox.reportFlow.submit")}
            loading={submitting}
            onClick={() => void submit()}
          />
        </>
      ) : null}

      {step === "done" ? (
        <ReportConfirmation
          title={t("inbox.reportFlow.confirmationTitle")}
          body={t("inbox.reportFlow.confirmationBody")}
          doneLabel={t("inbox.reportFlow.done")}
          onDone={onClose}
        />
      ) : null}
    </ReportFlowShell>
  );
}
