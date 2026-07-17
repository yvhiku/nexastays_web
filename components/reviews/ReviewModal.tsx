"use client";

import React, { useCallback, useRef, useState } from "react";
import { X, ImagePlus, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "@/components/ui/Alert";
import { StarRatingSelector } from "./StarRatingSelector";
import { cn } from "@/lib/utils";
import { formatUserError } from "@/lib/errors";
import {
  createReview,
  updateReview,
  uploadReviewPhoto,
  getReviewMediaUrl,
} from "@/lib/stays-api";
import type { StaysReviewDetail } from "@/lib/stays-types";

const MAX_COMMENT = 1000;
const MAX_PHOTOS = 5;
const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

interface ReviewModalProps {
  bookingId: string;
  listingTitle?: string;
  token: string | null;
  existingReview?: StaysReviewDetail | null;
  onClose: () => void;
  onSuccess: (review: StaysReviewDetail) => void;
}

export function ReviewModal({
  bookingId,
  listingTitle,
  token,
  existingReview,
  onClose,
  onSuccess,
}: ReviewModalProps) {
  const isEdit = !!existingReview?.can_edit;
  const [rating, setRating] = useState(existingReview?.rating ?? 0);
  const [comment, setComment] = useState(existingReview?.comment ?? "");
  const [assetIds, setAssetIds] = useState<string[]>(
    existingReview?.media?.map((m) => m.asset_id) ?? [],
  );
  const [previews, setPreviews] = useState<string[]>(
    existingReview?.media?.map((m) => getReviewMediaUrl(m.asset_id)) ?? [],
  );
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (files: FileList | null) => {
      if (!files?.length || !token) return;
      setError(null);
      setUploading(true);
      try {
        const nextIds = [...assetIds];
        const nextPreviews = [...previews];
        for (const file of Array.from(files)) {
          if (nextIds.length >= MAX_PHOTOS) break;
          if (!ACCEPTED_TYPES.includes(file.type)) {
            throw new Error("Only JPG, PNG, and WebP images are allowed");
          }
          if (file.size > 10 * 1024 * 1024) {
            throw new Error("Each image must be under 10MB");
          }
          const { asset_id } = await uploadReviewPhoto(file, token);
          nextIds.push(asset_id);
          nextPreviews.push(URL.createObjectURL(file));
        }
        setAssetIds(nextIds);
        setPreviews(nextPreviews);
      } catch (err) {
        setError(formatUserError(err) || "Upload failed");
      } finally {
        setUploading(false);
        if (fileRef.current) fileRef.current.value = "";
      }
    },
    [assetIds, previews, token],
  );

  const removePhoto = (index: number) => {
    setAssetIds((ids) => ids.filter((_, i) => i !== index));
    setPreviews((p) => {
      const url = p[index];
      if (url.startsWith("blob:")) URL.revokeObjectURL(url);
      return p.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async () => {
    if (rating < 0.5) {
      setError("Please select a rating");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const body = {
        rating,
        comment: comment.trim() || undefined,
        assetIds: assetIds.length ? assetIds : undefined,
      };
      const result = isEdit && existingReview
        ? await updateReview(existingReview.id, body, token)
        : await createReview({ bookingId, ...body }, token);
      setSuccess(true);
      setTimeout(() => onSuccess(result), 800);
    } catch (err) {
      setError(formatUserError(err) || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close"
      />
      <div className="relative w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white dark:bg-nexa-ink shadow-2xl border border-nexa-line/40">
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-nexa-line/40 bg-white/95 dark:bg-nexa-ink backdrop-blur">
          <div>
            <h2
              id="review-modal-title"
              className="font-[family-name:var(--font-playfair)] text-xl font-bold text-nexa-ink dark:text-white"
            >
              {isEdit ? "Edit your review" : "Write a review"}
            </h2>
            {listingTitle && (
              <p className="text-sm text-nexa-ink-3 mt-0.5 truncate">{listingTitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-nexa-bg-2 text-nexa-ink-3"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-6 space-y-6">
          {success ? (
            <div className="flex flex-col items-center py-10 text-center">
              <CheckCircle2 className="h-14 w-14 text-green-600 mb-4" />
              <p className="font-semibold text-lg text-nexa-ink dark:text-white">
                Thanks for your review!
              </p>
            </div>
          ) : (
            <>
              <div>
                <p className="text-sm font-medium text-nexa-ink mb-3">Overall rating *</p>
                <StarRatingSelector
                  value={rating}
                  onChange={setRating}
                  disabled={submitting}
                />
              </div>

              <div>
                <label
                  htmlFor="review-comment"
                  className="text-sm font-medium text-nexa-ink block mb-2"
                >
                  Your experience
                </label>
                <textarea
                  id="review-comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value.slice(0, MAX_COMMENT))}
                  rows={5}
                  placeholder="Tell other guests about your stay…"
                  disabled={submitting}
                  className={cn(
                    "w-full rounded-xl border border-nexa-line/60 px-4 py-3 text-sm",
                    "bg-nexa-bg-1 dark:bg-nexa-ink/50 text-nexa-ink dark:text-white",
                    "placeholder:text-nexa-ink-4 focus:outline-none focus:ring-2 focus:ring-nexa-primary/30",
                    "resize-none",
                  )}
                />
                <p className="text-xs text-nexa-ink-4 mt-1 text-right tabular-nums">
                  {comment.length}/{MAX_COMMENT}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-nexa-ink mb-2">
                  Photos <span className="text-nexa-ink-4 font-normal">(optional, max {MAX_PHOTOS})</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {previews.map((src, i) => (
                    <div key={assetIds[i] ?? i} className="relative h-20 w-20 rounded-lg overflow-hidden border border-nexa-line/50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        className="absolute top-1 right-1 p-0.5 rounded-full bg-black/60 text-white"
                        aria-label="Remove photo"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {assetIds.length < MAX_PHOTOS && (
                    <button
                      type="button"
                      disabled={uploading || submitting}
                      onClick={() => fileRef.current?.click()}
                      className="h-20 w-20 rounded-lg border-2 border-dashed border-nexa-line/60 flex flex-col items-center justify-center gap-1 text-nexa-ink-4 hover:border-nexa-primary hover:text-nexa-primary transition-colors"
                    >
                      {uploading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <ImagePlus className="h-5 w-5" />
                      )}
                      <span className="text-[10px]">Add</span>
                    </button>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files)}
                />
              </div>

              {error && (
                <ErrorAlert error={error} compact onDismiss={() => setError(null)} />
              )}

              <Button
                className="w-full"
                disabled={submitting || uploading || rating < 0.5}
                onClick={handleSubmit}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Submitting…
                  </>
                ) : isEdit ? (
                  "Save changes"
                ) : (
                  "Submit review"
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
