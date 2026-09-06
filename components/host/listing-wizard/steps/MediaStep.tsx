"use client";

import * as React from "react";
import { ImagePlus, Video, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  QUALITY_TARGET_PHOTOS,
  SUBMIT_MIN_PHOTOS,
} from "@/lib/host-listing-wizard/completion";
import {
  PHOTO_MAX_BYTES,
  type PhotoFileRejection,
} from "@/lib/host-listing-wizard/photo-queue";
import { RECOMMENDED_SHOTS } from "@/lib/host-listing-wizard/step-content";
import { cn } from "@/lib/utils";
import { PhotoGrid, type PhotoGridActions } from "../PhotoGrid";
import { SectionCard, StepHeader } from "../wizard-ui";
import { WizardStatusIcon } from "../wizard-status";
import { resolveMessage } from "../WizardErrorSummary";
import type { StepProps } from "./step-props";

const K = "hostListing.wizard.photos.";

export interface MediaStepProps extends StepProps {
  photoActions: PhotoGridActions & {
    onFilesAdded: (files: File[]) => PhotoFileRejection[];
    onWalkthroughCleared?: () => void;
  };
}

export function MediaStep({ form, patch, errors, photoActions }: MediaStepProps) {
  const { t, tf } = useLanguage();
  const err = (id: string) => (errors[id] ? resolveMessage(tf, errors[id]) : null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = React.useState(false);
  const [rejections, setRejections] = React.useState<PhotoFileRejection[]>([]);

  const photos = form.photos;
  const usable = photos.filter((p) => p.uploadStatus !== "error").length;
  const uploadingCount = photos.filter(
    (p) => p.uploadStatus === "uploading" || p.uploadStatus === "pending",
  ).length;
  const missingShots = RECOMMENDED_SHOTS.filter(
    (c) => !photos.some((p) => p.category === c && p.uploadStatus !== "error"),
  );
  const qualityPct = Math.min(100, Math.round((usable / QUALITY_TARGET_PHOTOS) * 100));
  const qualityStatus =
    usable >= QUALITY_TARGET_PHOTOS ? "ok" : usable >= SUBMIT_MIN_PHOTOS ? "needsAttention" : "error";

  const addFiles = (list: FileList | File[] | null) => {
    if (!list) return;
    const files = Array.from(list);
    if (files.length === 0) return;
    const rejected = photoActions.onFilesAdded(files);
    setRejections(rejected);
  };

  return (
    <div className="space-y-6">
      <StepHeader
        eyebrow={t(K + "eyebrow")}
        title={t(K + "title")}
        description={tf(K + "description", { min: SUBMIT_MIN_PHOTOS, target: QUALITY_TARGET_PHOTOS })}
        tip={t(K + "tip")}
      />

      {/* Dropzone — always visible so adding more is one gesture away. */}
      <div data-wizard-field="photos">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!dragOver) setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            addFiles(e.dataTransfer.files);
          }}
          className={cn(
            "flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-[border-color,background-color] duration-150",
            dragOver
              ? "border-nexa-primary bg-nexa-primary-soft"
              : err("photos")
                ? "border-red-500 bg-red-50/40"
                : "border-nexa-line bg-white hover:border-nexa-primary/50",
          )}
        >
          <ImagePlus className="h-9 w-9 text-nexa-primary" aria-hidden="true" />
          <p className="font-sans text-base font-semibold text-nexa-ink">
            {photos.length === 0
              ? tf(K + "emptyTitle", { min: SUBMIT_MIN_PHOTOS })
              : t(K + "addMoreTitle")}
          </p>
          <p className="max-w-sm text-sm leading-relaxed text-nexa-ink-3">
            {tf(K + "dropHint", { maxMb: Math.round(PHOTO_MAX_BYTES / (1024 * 1024)) })}
          </p>
          <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
            {t(K + "browse")}
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="sr-only"
            aria-label={t(K + "browse")}
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
        {err("photos") && (
          <p role="alert" className="mt-2 text-xs font-medium text-red-600">
            {err("photos")}
          </p>
        )}
        {rejections.length > 0 && (
          <div
            role="alert"
            className="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <WizardStatusIcon status="error" size={16} className="mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold">{tf(K + "rejectedTitle", { count: rejections.length })}</p>
              <ul className="mt-1 space-y-0.5 text-xs">
                {rejections.slice(0, 5).map((r, i) => (
                  <li key={`${r.name}-${i}`}>
                    {r.name} — {t(`${K}reject.${r.reasonKey}`)}
                  </li>
                ))}
              </ul>
            </div>
            <button
              type="button"
              onClick={() => setRejections([])}
              aria-label={t("hostListing.wizard.shell.dismiss")}
              className="rounded-md p-1 hover:bg-red-100"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {photos.length > 0 && (
        <SectionCard
          title={tf(K + "gridTitle", { count: photos.length })}
          description={
            uploadingCount > 0
              ? tf(K + "uploadingCount", { count: uploadingCount })
              : t(K + "gridDesc")
          }
        >
          <PhotoGrid photos={photos} actions={photoActions} />
        </SectionCard>
      )}

      <SectionCard title={t(K + "qualityTitle")} description={t(K + "qualityDesc")}>
        <div className="flex items-center gap-3">
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={QUALITY_TARGET_PHOTOS}
            aria-valuenow={usable}
            aria-label={t(K + "qualityTitle")}
            className="h-2 flex-1 overflow-hidden rounded-sm bg-nexa-line"
          >
            <div
              className={cn(
                "h-full rounded-sm transition-[width] duration-200 motion-reduce:transition-none",
                qualityStatus === "ok"
                  ? "bg-nexa-primary"
                  : qualityStatus === "needsAttention"
                    ? "bg-nexa-accent"
                    : "bg-red-500",
              )}
              style={{ width: `${qualityPct}%` }}
            />
          </div>
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold tabular-nums text-nexa-ink">
            <WizardStatusIcon
              status={qualityStatus}
              size={16}
              className={
                qualityStatus === "ok"
                  ? "text-nexa-primary"
                  : qualityStatus === "needsAttention"
                    ? "text-nexa-accent"
                    : "text-red-600"
              }
            />
            {usable} / {QUALITY_TARGET_PHOTOS}
          </span>
        </div>
        <p className="mt-3 text-sm text-nexa-ink-3">
          {usable < SUBMIT_MIN_PHOTOS
            ? tf(K + "needMore", { count: SUBMIT_MIN_PHOTOS - usable })
            : usable < QUALITY_TARGET_PHOTOS
              ? tf(K + "goodAddMore", { count: QUALITY_TARGET_PHOTOS - usable })
              : t(K + "excellent")}
        </p>
        {missingShots.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-nexa-ink-4">
              {t(K + "suggestedShots")}
            </p>
            <div className="flex flex-wrap gap-2">
              {missingShots.map((c) => (
                <span
                  key={c}
                  className="rounded-lg bg-nexa-bg-2 px-2.5 py-1 text-xs font-medium text-nexa-ink-2"
                >
                  {t(`hostListing.wizard.mediaCategories.${c}`)}
                </span>
              ))}
            </div>
          </div>
        )}
      </SectionCard>

      <SectionCard title={t(K + "walkthroughTitle")} description={t(K + "walkthroughDesc")}>
        {form.walkthroughPreview ? (
          <div className="space-y-3">
            <video
              src={form.walkthroughPreview}
              controls
              className="w-full rounded-xl border-2 border-nexa-line bg-black"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                if (form.walkthroughPreview?.startsWith("blob:")) {
                  URL.revokeObjectURL(form.walkthroughPreview);
                }
                if (photoActions.onWalkthroughCleared) {
                  photoActions.onWalkthroughCleared();
                } else {
                  patch({ walkthrough: null, walkthroughPreview: null, walkthroughAssetId: null });
                }
              }}
            >
              {t(K + "removeVideo")}
            </Button>
          </div>
        ) : (
          <label className="flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-nexa-line bg-nexa-bg px-4 py-6 text-sm font-medium text-nexa-ink-2 transition-colors duration-150 hover:border-nexa-primary/50">
            <Video className="h-5 w-5 text-nexa-primary" aria-hidden="true" />
            {t(K + "addVideo")}
            <input
              type="file"
              accept="video/mp4,video/quicktime,video/webm"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                patch({
                  walkthrough: file,
                  walkthroughPreview: URL.createObjectURL(file),
                  walkthroughAssetId: null,
                });
                e.target.value = "";
              }}
            />
          </label>
        )}
      </SectionCard>
    </div>
  );
}
