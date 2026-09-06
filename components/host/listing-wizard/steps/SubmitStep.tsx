"use client";

import { ChevronRight, MapPin } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  SUBMIT_MIN_PHOTOS,
  computeCompletionFlags,
  listMissing,
  type MissingStep,
} from "@/lib/host-listing-wizard/completion";
import { completionInputFromForm } from "@/lib/host-listing-wizard/map-to-api";
import { isMultiUnitFlow } from "@/lib/host-listing-wizard/step-config";
import { coverPhotoId, hasUnfinishedUploads } from "@/lib/host-listing-wizard/photo-queue";
import type { WizardStepId } from "@/lib/host-listing-wizard/form-types";
import { cn } from "@/lib/utils";
import { SectionCard, StepHeader } from "../wizard-ui";
import { WizardStatusIcon, wizardStatusClasses, type WizardStatus } from "../wizard-status";
import { WIZARD_STICKY_TOP } from "../wizard-chrome";
import type { StepProps } from "./step-props";

const K = "hostListing.wizard.submit.";

export function SubmitStep({
  form,
  listingStatus,
  onJump,
}: Pick<StepProps, "form"> & {
  listingStatus: string | null;
  onJump: (stepId: WizardStepId) => void;
}) {
  const { t, tf } = useLanguage();
  const flags = computeCompletionFlags(completionInputFromForm(form));
  const missing = listMissing(flags);
  const required = missing.filter((m) => m.required);
  const optional = missing.filter((m) => !m.required);
  const failedPhotos = form.photos.filter((p) => p.uploadStatus === "error").length;
  const uploading = hasUnfinishedUploads(form.photos);
  const multi = isMultiUnitFlow(form.listingType, form.bookingModel);
  const isRejected = listingStatus === "REJECTED";

  const coverId = coverPhotoId(form.photos.filter((p) => p.uploadStatus !== "error"));
  const cover = form.photos.find((p) => p.id === coverId);
  const unitPrices = form.unitTypes.map((u) => Number(u.basePrice) || 0).filter((n) => n > 0);
  const fromPrice = multi ? (unitPrices.length ? Math.min(...unitPrices) : 0) : Number(form.basePrice) || 0;

  const ready = required.length === 0 && failedPhotos === 0 && !uploading;

  const doneItems: Array<{ key: string; label: string }> = [
    flags.location_complete && { key: "location", label: t("hostListing.wizard.missing.location") },
    flags.about_complete && { key: "about", label: t("hostListing.wizard.missing.about") },
    multi && flags.rooms_complete && { key: "rooms", label: t("hostListing.wizard.missing.rooms") },
    flags.pricing_complete && { key: "pricing", label: t("hostListing.wizard.missing.pricing") },
    flags.photos_complete && {
      key: "photos",
      label: tf("hostListing.wizard.missing.photos", { min: SUBMIT_MIN_PHOTOS }),
    },
  ].filter(Boolean) as Array<{ key: string; label: string }>;

  const stepFor = (step: MissingStep): WizardStepId => step;

  return (
    <div className="space-y-6">
      <StepHeader
        eyebrow={t(K + "eyebrow")}
        title={isRejected ? t(K + "titleResubmit") : t(K + "title")}
        description={t(K + "description")}
      />

      {isRejected && (
        <div className="flex items-start gap-3 rounded-2xl border-2 border-nexa-accent/50 bg-nexa-accent-soft p-4">
          <WizardStatusIcon status="needsAttention" size={20} className="mt-0.5 shrink-0 text-nexa-accent" />
          <div>
            <p className="font-sans text-sm font-semibold text-nexa-ink">{t(K + "needsChangesTitle")}</p>
            <p className="mt-1 text-sm leading-relaxed text-nexa-ink-2">{t(K + "needsChangesBody")}</p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
        <SectionCard title={t(K + "checklistTitle")} description={t(K + "checklistDesc")}>
          <ul className="space-y-1">
            {required.map((m) => (
              <ChecklistRow
                key={m.key}
                status="needsAttention"
                label={tf(m.labelKey, m.vars)}
                hint={t(K + "required")}
                onClick={() => onJump(stepFor(m.step))}
              />
            ))}
            {failedPhotos > 0 && (
              <ChecklistRow
                status="error"
                label={tf(K + "failedPhotos", { count: failedPhotos })}
                hint={t(K + "required")}
                onClick={() => onJump("media")}
              />
            )}
            {uploading && (
              <ChecklistRow status="busy" label={t(K + "uploadsInProgress")} onClick={() => onJump("media")} />
            )}
            {doneItems.map((d) => (
              <ChecklistRow key={d.key} status="ok" label={d.label} />
            ))}
            {optional.map((m) => (
              <ChecklistRow
                key={m.key}
                status="needsAttention"
                muted
                label={tf(m.labelKey, m.vars)}
                hint={t(K + "recommended")}
                onClick={() => onJump(stepFor(m.step))}
              />
            ))}
          </ul>
          <p
            className={cn(
              "mt-4 flex items-center gap-2 text-sm font-medium",
              ready ? "text-nexa-primary" : "text-nexa-ink-3",
            )}
          >
            <WizardStatusIcon status={ready ? "ok" : "needsAttention"} size={16} />
            {ready ? t(K + "readyToSubmit") : t(K + "notReady")}
          </p>
        </SectionCard>

        {/* Guest-facing preview: what a traveller sees in search results. */}
        <aside
          aria-label={t(K + "previewLabel")}
          className="lg:sticky lg:self-start"
          style={{ top: WIZARD_STICKY_TOP }}
        >
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-nexa-ink-4">
            {t(K + "previewLabel")}
          </p>
          <div className="overflow-hidden rounded-2xl border-2 border-nexa-line bg-white shadow-nexa-sm">
            <div className="relative aspect-[4/3] bg-nexa-bg-2">
              {cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cover.preview} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-nexa-ink-4">
                  {t(K + "noCoverYet")}
                </div>
              )}
            </div>
            <div className="space-y-1 p-3">
              <p className="truncate font-sans text-sm font-semibold text-nexa-ink">
                {form.title.trim() || t(K + "untitled")}
              </p>
              <p className="flex items-center gap-1 truncate text-xs text-nexa-ink-3">
                <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                {[form.neighborhood.trim(), form.city.trim()].filter(Boolean).join(", ") ||
                  t(K + "noLocationYet")}
              </p>
              <p className="text-sm text-nexa-ink">
                {fromPrice > 0 ? (
                  <>
                    <span className="text-xs text-nexa-ink-3">{t(K + "from")} </span>
                    <span className="font-semibold">{fromPrice.toLocaleString()} MAD</span>
                    <span className="text-xs text-nexa-ink-3"> / {t(K + "night")}</span>
                  </>
                ) : (
                  <span className="text-xs text-nexa-ink-4">{t(K + "noPriceYet")}</span>
                )}
              </p>
            </div>
          </div>
        </aside>
      </div>

      <SectionCard title={t(K + "whatHappensTitle")}>
        <ol className="space-y-2 text-sm text-nexa-ink-2">
          <li className="flex gap-2">
            <span className="font-semibold text-nexa-primary">1.</span>
            {t(K + "whatHappens1")}
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-nexa-primary">2.</span>
            {t(K + "whatHappens2")}
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-nexa-primary">3.</span>
            {t(K + "whatHappens3")}
          </li>
        </ol>
      </SectionCard>
    </div>
  );
}

function ChecklistRow({
  status,
  label,
  hint,
  onClick,
  muted,
}: {
  status: WizardStatus;
  label: string;
  hint?: string;
  onClick?: () => void;
  muted?: boolean;
}) {
  const { text } = wizardStatusClasses(status);
  const content = (
    <>
      <WizardStatusIcon status={status} size={16} className={cn("shrink-0", text)} />
      <span className={cn("flex-1 text-sm", muted ? "text-nexa-ink-3" : "text-nexa-ink")}>{label}</span>
      {hint && (
        <span className="text-[0.7rem] font-semibold uppercase tracking-wide text-nexa-ink-4">{hint}</span>
      )}
      {onClick && <ChevronRight className="h-4 w-4 text-nexa-ink-4 rtl:rotate-180" aria-hidden="true" />}
    </>
  );
  if (!onClick) {
    return <li className="flex min-h-[44px] items-center gap-3 rounded-xl px-2">{content}</li>;
  }
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-2 text-start transition-colors duration-150 hover:bg-nexa-bg-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-primary/30"
      >
        {content}
      </button>
    </li>
  );
}
