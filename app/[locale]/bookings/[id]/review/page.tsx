"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { NavBar } from "@/components/navbar/NavBar";
import { Footer } from "@/components/footer/Footer";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { RateStayContent } from "@/components/reviews/RateStayContent";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getBooking, getBookingReview } from "@/lib/stays-api";
import { canReviewBooking } from "@/lib/booking-lifecycle";
import type { StaysBooking, StaysReviewDetail } from "@/lib/stays-types";
import { ArrowLeft, AlertCircle } from "lucide-react";

function RateStayPageInner() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const { t, localePath } = useLanguage();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<StaysBooking | null>(null);
  const [existingReview, setExistingReview] = useState<StaysReviewDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      getBooking(bookingId, token),
      getBookingReview(bookingId, token).catch(() => null),
    ])
      .then(([b, review]) => {
        setBooking(b);
        setExistingReview(review);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : t("bookings.failedLoad")),
      )
      .finally(() => setLoading(false));
  }, [bookingId, token, t]);

  const handleSuccess = () => {
    router.push(localePath(`/bookings/${bookingId}`));
  };

  if (loading) {
    return (
      <>
        <NavBar />
        <main className="pt-[72px] min-h-screen flex items-center justify-center bg-nexa-bg">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nexa-primary" />
        </main>
        <Footer />
      </>
    );
  }

  if (error || !booking) {
    return (
      <>
        <NavBar />
        <main className="pt-[72px] min-h-screen flex flex-col items-center justify-center gap-4 bg-nexa-bg px-4">
          <p className="text-nexa-ink-3">{error ?? t("bookings.bookingNotFound")}</p>
          <Button asChild>
            <Link href={localePath("/my-bookings")}>{t("bookings.backToBookings")}</Link>
          </Button>
        </main>
        <Footer />
      </>
    );
  }

  const canReview = canReviewBooking(booking);
  const hasReview = booking.has_reviewed || !!existingReview;
  const canEdit = existingReview?.can_edit;
  const ownListing = booking.review_blocked_reason === "OWN_LISTING";
  const allowed = !ownListing && (canReview || hasReview || !!canEdit);

  if (!allowed) {
    return (
      <>
        <NavBar />
        <main className="pt-[72px] min-h-screen bg-nexa-bg">
          <div className="max-w-lg mx-auto px-4 py-16 text-center">
            <AlertCircle className="h-12 w-12 text-nexa-ink-4 mx-auto mb-4" />
            <h1 className="font-display text-2xl font-bold text-nexa-ink mb-2">
              {ownListing ? t("rateStay.ownListingTitle") : t("rateStay.notAvailable")}
            </h1>
            <p className="text-nexa-ink-3 mb-8">
              {ownListing ? t("rateStay.ownListingDesc") : t("rateStay.notAvailableDesc")}
            </p>
            <Button asChild>
              <Link href={localePath(`/bookings/${bookingId}`)}>
                {t("rateStay.backToBooking")}
              </Link>
            </Button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <NavBar />
      <main className="pt-28 pb-16 min-h-screen bg-nexa-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href={localePath(`/bookings/${bookingId}`)}
            className="inline-flex items-center gap-2 text-sm text-nexa-ink-3 hover:text-nexa-primary mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {t("rateStay.backToBooking")}
          </Link>

          <RateStayContent
            booking={booking}
            token={token}
            existingReview={existingReview}
            localePath={localePath}
            t={t}
            onSuccess={handleSuccess}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function RateStayPage() {
  return (
    <ProtectedRoute>
      <RateStayPageInner />
    </ProtectedRoute>
  );
}
