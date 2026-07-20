"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import {
  BadgeCheck,
  Camera,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatUserError } from "@/lib/errors";
import { trackEvent } from "@/lib/analytics";
import {
  createReview,
  updateReview,
  uploadReviewPhoto,
  getReviewMediaUrl,
  getListingMediaUrl,
} from "@/lib/stays-api";
import type { StaysBooking, StaysReviewDetail } from "@/lib/stays-types";
import { StarRatingDisplay } from "./StarRatingSelector";
import { ErrorAlert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/button";
import { useProductGuidanceOptional } from "@/components/guidance/ProductGuidanceProvider";

const MAX_COMMENT = 1000;
const MAX_PHOTOS = 5;
const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const PLACEHOLDER =
  "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=800&q=80";

function formatStayDates(checkin: string, checkout: string): string {
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };
  const a = new Date(checkin).toLocaleDateString(undefined, opts);
  const b = new Date(checkout).toLocaleDateString(undefined, opts);
  return `${a} – ${b}`;
}

function ratingTagline(rating: number): string {
  if (rating <= 0) return "";
  if (rating >= 4.5) return "A truly exceptional retreat that exceeded expectations.";
  if (rating >= 4) return "A wonderful stay — would happily return.";
  if (rating >= 3) return "A good stay with a few areas to improve.";
  if (rating >= 2) return "The stay had noticeable issues.";
  return "Unfortunately, the stay did not meet expectations.";
}

interface LargeStarRatingProps {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}

function LargeStarRating({ value, onChange, disabled }: LargeStarRatingProps) {
  const handle = (index: number, half: boolean) => {
    if (disabled) return;
    onChange(half ? index + 0.5 : index + 1);
  };

  return (
    <div className="flex justify-center gap-2" role="radiogroup" aria-label="Overall rating">
      {Array.from({ length: 5 }, (_, i) => {
        const fill = Math.min(1, Math.max(0, value - i));
        return (
          <div key={i} className="relative group">
            {/* Empty base star */}
            <svg
              viewBox="0 0 24 24"
              className={cn(
                "w-10 h-10 sm:w-11 sm:h-11 text-nexa-line fill-nexa-bg-2 transition-all duration-200 rating-star",
                !disabled && "group-hover:scale-110",
              )}
              aria-hidden
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
            </svg>
            {/* Clipped fill overlay for full and half stars */}
            <div
              className="absolute inset-0 overflow-hidden pointer-events-none"
              style={{ width: `${fill * 100}%` }}
            >
              <svg
                viewBox="0 0 24 24"
                className="w-10 h-10 sm:w-11 sm:h-11 text-nexa-primary fill-nexa-primary/90"
                aria-hidden
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
              </svg>
            </div>
            <button
              type="button"
              disabled={disabled}
              className="absolute inset-y-0 left-0 w-1/2 cursor-pointer disabled:cursor-not-allowed"
              aria-label={`${i + 0.5} stars`}
              onClick={() => handle(i, true)}
            />
            <button
              type="button"
              disabled={disabled}
              className="absolute inset-y-0 right-0 w-1/2 cursor-pointer disabled:cursor-not-allowed"
              aria-label={`${i + 1} stars`}
              onClick={() => handle(i, false)}
            />
          </div>
        );
      })}
    </div>
  );
}

export interface RateStayContentProps {
  booking: StaysBooking;
  token: string | null;
  existingReview?: StaysReviewDetail | null;
  localePath: (path: string) => string;
  t: (key: string) => string;
  onSuccess: (review: StaysReviewDetail) => void;
}

export function RateStayContent({
  booking,
  token,
  existingReview,
  localePath,
  t,
  onSuccess,
}: RateStayContentProps) {
  const isEdit = !!existingReview?.can_edit;
  const readOnly = !!existingReview && !existingReview.can_edit;
  const reduce = useReducedMotion();
  const guidance = useProductGuidanceOptional();
  const [mounted, setMounted] = useState(false);

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
  const [successReview, setSuccessReview] = useState<StaysReviewDetail | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (readOnly) {
      trackEvent("review_viewed", { bookingId: booking.id });
    } else {
      trackEvent("review_started", {
        bookingId: booking.id,
        mode: isEdit ? "edit" : "create",
      });
    }
  }, [booking.id, isEdit, readOnly]);

  useEffect(() => {
    if (!success) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [success]);

  const listing = booking.listing;
  const photoMedia = listing?.media?.find((m) => m.kind === "PHOTO");
  const coverUrl = listing?.id && photoMedia
    ? getListingMediaUrl(listing.id, photoMedia.asset_id)
    : PLACEHOLDER;

  const hostName =
    listing?.check_in_contact?.full_name?.trim() ||
    listing?.host?.full_name?.trim() ||
    "Your host";

  const handleFile = useCallback(
    async (files: FileList | null) => {
      if (!files?.length || !token || readOnly) return;
      setError(null);
      setUploading(true);
      try {
        const nextIds = [...assetIds];
        const nextPreviews = [...previews];
        for (const file of Array.from(files)) {
          if (nextIds.length >= MAX_PHOTOS) break;
          if (!ACCEPTED_TYPES.includes(file.type)) {
            throw new Error(t("rateStay.invalidImageType"));
          }
          if (file.size > 10 * 1024 * 1024) {
            throw new Error(t("rateStay.imageTooLarge"));
          }
          const { asset_id } = await uploadReviewPhoto(file, token);
          nextIds.push(asset_id);
          nextPreviews.push(URL.createObjectURL(file));
        }
        setAssetIds(nextIds);
        setPreviews(nextPreviews);
      } catch (err) {
        setError(formatUserError(err) || t("rateStay.uploadFailed"));
      } finally {
        setUploading(false);
        if (fileRef.current) fileRef.current.value = "";
      }
    },
    [assetIds, previews, token, readOnly, t],
  );

  const removePhoto = (index: number) => {
    if (readOnly) return;
    setAssetIds((ids) => ids.filter((_, i) => i !== index));
    setPreviews((p) => {
      const url = p[index];
      if (url.startsWith("blob:")) URL.revokeObjectURL(url);
      return p.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async () => {
    if (readOnly) return;
    if (rating < 0.5) {
      setError(t("rateStay.ratingRequired"));
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
      const result =
        isEdit && existingReview
          ? await updateReview(existingReview.id, body, token)
          : await createReview({ bookingId: booking.id, ...body }, token);
      trackEvent(isEdit ? "review_edited" : "review_completed", {
        bookingId: booking.id,
        rating,
      });
      window.dispatchEvent(
        new CustomEvent("nexa-review-submitted", {
          detail: {
            listingId: booking.listing_id,
            bookingId: booking.id,
            review: result,
          },
        }),
      );
      setSuccessReview(result);
      setSuccess(true);
    } catch (err) {
      setError(formatUserError(err) || t("rateStay.submitFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const tagline = useMemo(() => ratingTagline(rating), [rating]);

  if (success) {
    const celebration = (
      <div
        className="fixed inset-0 z-[120] flex flex-col items-center justify-center bg-[rgba(253,251,252,0.96)] px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-[calc(5rem+env(safe-area-inset-top))] backdrop-blur-md"
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-celebration-title"
      >
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex w-full max-w-md flex-col items-center text-center overflow-hidden rounded-[28px] border border-nexa-line/60 bg-white px-6 py-10 shadow-nexa-lg"
        >
          {!reduce && (
            <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
              {Array.from({ length: 18 }).map((_, i) => (
                <motion.span
                  key={i}
                  className="absolute h-2 w-2 rounded-full bg-nexa-primary/70"
                  style={{
                    left: `${8 + ((i * 17) % 84)}%`,
                    top: `${10 + ((i * 23) % 60)}%`,
                  }}
                  initial={{ opacity: 0, y: -8, scale: 0.6 }}
                  animate={{ opacity: [0, 1, 0], y: [0, 40, 70], scale: [0.6, 1, 0.4] }}
                  transition={{ duration: 1.6, delay: i * 0.04, ease: "easeOut" }}
                />
              ))}
            </div>
          )}
          <CheckCircle2 className="relative mb-6 h-16 w-16 text-nexa-primary" />
          <h2
            id="review-celebration-title"
            className="relative mb-2 font-display text-2xl font-bold text-nexa-ink sm:text-3xl"
          >
            {t("rateStay.thankYou")}
          </h2>
          <p className="relative mb-8 max-w-md text-nexa-ink-3">{t("rateStay.thankYouDesc")}</p>
          {successReview && (
            <div className="relative mb-8 rounded-2xl border border-nexa-line bg-white px-6 py-4 shadow-sm">
              <StarRatingDisplay rating={successReview.rating} size="md" />
            </div>
          )}
          <Button
            type="button"
            className="relative min-w-[160px]"
            onClick={() => {
              guidance?.markGuideCompleted("review_celebration");
              onSuccess(successReview ?? existingReview!);
            }}
          >
            {t("rateStay.thankYouContinue")}
          </Button>
        </motion.div>
      </div>
    );

    return (
      <>
        {/* Keep layout for back-link context while overlay covers chrome */}
        <div className="min-h-[40vh]" aria-hidden />
        {mounted ? createPortal(celebration, document.body) : celebration}
      </>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
      {/* Left: stay summary */}
      <aside className="lg:col-span-4 space-y-8">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-nexa-ink tracking-tight">
          {readOnly ? t("rateStay.yourReview") : isEdit ? t("rateStay.editTitle") : t("rateStay.title")}
        </h1>

        <div className="bg-white rounded-3xl overflow-hidden shadow-nexa-card border border-nexa-line/30 group">
          <div className="aspect-[3/2] overflow-hidden relative bg-nexa-bg-2">
            <Image
              src={coverUrl}
              alt={listing?.title ?? "Stay"}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              sizes="(max-width: 1024px) 100vw, 33vw"
              unoptimized={coverUrl.startsWith("http://127.0.0.1") || coverUrl.includes("/api/")}
            />
          </div>
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="bg-nexa-primary-soft text-nexa-primary text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-full">
                {t("rateStay.verifiedStay")}
              </span>
              {listing?.city && (
                <span className="text-nexa-ink-4 text-[10px] uppercase tracking-widest font-semibold">
                  {listing.city}
                </span>
              )}
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-semibold text-nexa-ink">
              {listing?.title ?? t("rateStay.yourStay")}
            </h2>
            <p className="text-nexa-ink-3 mt-1.5">
              {formatStayDates(booking.checkin_date, booking.checkout_date)}
            </p>
            <div className="mt-6 pt-6 border-t border-nexa-line/40 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-nexa-primary/15 flex items-center justify-center shrink-0 text-lg font-bold text-nexa-primary border border-nexa-line/30">
                {hostName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-sm text-nexa-ink">
                  {t("rateStay.hostedBy").replace("{name}", hostName)}
                </p>
                <p className="text-xs text-nexa-ink-4 mt-0.5">{t("rateStay.hostPartner")}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 rounded-3xl bg-nexa-primary-soft/60 border border-nexa-primary/15">
          <p className="font-semibold text-sm text-nexa-primary mb-2 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden />
            {t("rateStay.communityTitle")}
          </p>
          <p className="text-xs text-nexa-ink-3 leading-relaxed">
            {t("rateStay.communityDesc")}
          </p>
        </div>
      </aside>

      {/* Right: review form */}
      <section className="lg:col-span-8">
        <div className="bg-white rounded-[32px] p-6 sm:p-10 lg:p-12 shadow-nexa-card border border-nexa-line/20">
          {readOnly && existingReview ? (
            <div className="space-y-8">
              <div className="text-center pb-8 border-b border-nexa-line/30">
                <p className="text-[10px] uppercase tracking-widest text-nexa-ink-4 mb-4 font-semibold">
                  {t("rateStay.overallExperience")}
                </p>
                <StarRatingDisplay rating={existingReview.rating} size="md" />
                <p className="mt-4 text-nexa-ink-3 italic">{ratingTagline(existingReview.rating)}</p>
              </div>
              {existingReview.comment && (
                <div>
                  <h3 className="font-display text-xl font-semibold text-nexa-ink mb-3">
                    {t("rateStay.describeStay")}
                  </h3>
                  <p className="text-nexa-ink-3 leading-relaxed whitespace-pre-wrap">
                    {existingReview.comment}
                  </p>
                </div>
              )}
              {existingReview.media.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {existingReview.media.map((m) => (
                    <div
                      key={m.asset_id}
                      className="aspect-square rounded-2xl overflow-hidden border border-nexa-line/40"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getReviewMediaUrl(m.asset_id)}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
              )}
              <Link
                href={localePath(`/bookings/${booking.id}`)}
                className="inline-flex items-center justify-center w-full sm:w-auto bg-nexa-primary text-white font-semibold px-10 py-4 rounded-full shadow-nexa-md hover:bg-nexa-primary-dark active:scale-[0.98] transition-all"
              >
                {t("rateStay.backToBooking")}
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-10 text-center">
                <p className="text-[10px] uppercase tracking-widest text-nexa-ink-4 mb-5 font-semibold">
                  {t("rateStay.overallExperience")}
                </p>
                <LargeStarRating
                  value={rating}
                  onChange={setRating}
                  disabled={submitting}
                />
                {tagline && (
                  <p className="mt-5 text-nexa-ink-3 italic text-sm sm:text-base max-w-lg mx-auto">
                    &ldquo;{tagline}&rdquo;
                  </p>
                )}
              </div>

              <div className="mt-8">
                <label
                  htmlFor="review-comment"
                  className="font-display text-xl sm:text-2xl font-semibold text-nexa-ink block mb-4"
                >
                  {t("rateStay.describeStay")}
                </label>
                <textarea
                  id="review-comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value.slice(0, MAX_COMMENT))}
                  rows={7}
                  disabled={submitting}
                  placeholder={t("rateStay.commentPlaceholder")}
                  className={cn(
                    "w-full bg-nexa-bg-2 border border-transparent rounded-3xl p-6 min-h-[180px]",
                    "focus:ring-2 focus:ring-nexa-primary/30 focus:border-nexa-primary/20 focus:bg-white",
                    "placeholder:text-nexa-ink-4 text-nexa-ink text-base resize-none transition-all",
                  )}
                />
                <p className="text-xs text-nexa-ink-4 mt-2 text-right tabular-nums">
                  {comment.length}/{MAX_COMMENT}
                </p>
              </div>

              <div className="mt-10">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-nexa-ink">{t("rateStay.addPhotos")}</h3>
                  <span className="text-xs text-nexa-ink-4">
                    {t("rateStay.photoLimit").replace("{max}", String(MAX_PHOTOS))}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
                  {previews.map((src, i) => (
                    <div
                      key={assetIds[i] ?? i}
                      className="aspect-square rounded-2xl overflow-hidden relative group border border-nexa-line/30 shadow-nexa-sm"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        disabled={submitting}
                        className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        aria-label={t("rateStay.removePhoto")}
                      >
                        <Trash2 className="h-6 w-6 text-white" />
                      </button>
                    </div>
                  ))}
                  {assetIds.length < MAX_PHOTOS && (
                    <button
                      type="button"
                      disabled={uploading || submitting}
                      onClick={() => fileRef.current?.click()}
                      className="aspect-square rounded-2xl border-2 border-dashed border-nexa-line/60 flex flex-col items-center justify-center gap-2 hover:border-nexa-primary/50 hover:bg-nexa-primary-soft/30 transition-all group"
                    >
                      {uploading ? (
                        <Loader2 className="h-7 w-7 animate-spin text-nexa-primary" />
                      ) : (
                        <Camera className="h-7 w-7 text-nexa-ink-4 group-hover:text-nexa-primary transition-colors" />
                      )}
                      <span className="text-[10px] font-bold uppercase tracking-widest text-nexa-ink-4 group-hover:text-nexa-primary">
                        {t("rateStay.upload")}
                      </span>
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
                <ErrorAlert
                  error={error}
                  className="mt-6"
                  onDismiss={() => setError(null)}
                />
              )}

              <div className="mt-10 pt-8 border-t border-nexa-line/30 flex flex-col sm:flex-row justify-between items-center gap-6">
                <p className="text-xs text-nexa-ink-4 flex items-center gap-2 max-w-xs text-center sm:text-left">
                  <BadgeCheck className="h-4 w-4 text-nexa-primary shrink-0" aria-hidden />
                  {t("rateStay.publishNote")}
                </p>
                <button
                  type="button"
                  disabled={submitting || uploading || rating < 0.5}
                  onClick={handleSubmit}
                  className={cn(
                    "w-full sm:w-auto bg-nexa-primary text-white font-semibold px-10 py-4 rounded-full",
                    "shadow-nexa-md hover:bg-nexa-primary-dark active:scale-[0.98] transition-all duration-300",
                    "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
                    "inline-flex items-center justify-center gap-2 min-w-[200px]",
                  )}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t("rateStay.submitting")}
                    </>
                  ) : isEdit ? (
                    t("rateStay.saveChanges")
                  ) : (
                    t("rateStay.submitReview")
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
