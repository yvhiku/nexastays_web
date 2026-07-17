"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { NavBar } from "@/components/navbar/NavBar";
import { Footer } from "@/components/footer/Footer";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { cancelBooking, createPaymentIntent, getBooking } from "@/lib/stays-api";
import { formatLocalDateOnly } from "@/lib/booking-dates";
import { getCurrentConsents, acceptMandatoryConsents } from "@/lib/consent-api";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useStaysFees } from "@/contexts/StaysFeeContext";
import type { StaysBooking } from "@/lib/stays-types";
import { CheckinContactCard } from "@/components/booking/CheckinContactCard";
import { ListingHeroGallery } from "@/components/listing/ListingHeroGallery";
import {
  resolveBookingLifecycle,
  lifecycleBadgeClasses,
  canCancelBooking,
  canReviewBooking,
} from "@/lib/booking-lifecycle";
import { StarRatingDisplay } from "@/components/reviews/StarRatingSelector";
import { HostBookingDetailView } from "@/components/bookings/HostBookingDetailView";
import { CancelBookingDialog } from "@/components/bookings/CancelBookingDialog";
import { getBookingReview } from "@/lib/stays-api";
import type { StaysReviewDetail } from "@/lib/stays-types";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";
import {
  ArrowLeft,
  Download,
  MessageCircle,
  Star,
  MapPin,
  CheckCircle2,
} from "lucide-react";

function formatDate(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    return formatLocalDateOnly(value);
  }
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function Section({
  title,
  children,
  id,
}: {
  title: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className="bg-white rounded-2xl border border-nexa-line/70 p-6 shadow-nexa-sm">
      <h2 className="text-sm font-semibold text-nexa-ink-4 uppercase tracking-wide mb-4">
        {title}
      </h2>
      {children}
    </section>
  );
}

function BookingDetailPageInner() {
  const params = useParams();
  const { token } = useAuth();
  const { t, tf, localePath } = useLanguage();
  const { rates } = useStaysFees();
  const id = params.id as string;

  const [booking, setBooking] = useState<StaysBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [consentAccepted, setConsentAccepted] = useState<boolean | null>(null);
  const [consentChecked, setConsentChecked] = useState(false);
  const [acceptingConsent, setAcceptingConsent] = useState(false);
  const [creatingPayment, setCreatingPayment] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [existingReview, setExistingReview] = useState<StaysReviewDetail | null>(null);

  const reloadBooking = () => {
    setLoading(true);
    getBooking(id, token)
      .then(setBooking)
      .catch((err) => setError(err instanceof Error ? err.message : t("bookings.failedLoad")))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    reloadBooking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token, t]);

  useEffect(() => {
    if (!token || !booking) return;
    if (booking.has_reviewed || resolveBookingLifecycle(booking) === "COMPLETED") {
      getBookingReview(id, token)
        .then((r) => setExistingReview(r))
        .catch(() => setExistingReview(null));
    }
  }, [id, token, booking]);

  useEffect(() => {
    if (token && booking?.status === "PAYMENT_PENDING" && consentAccepted === null) {
      getCurrentConsents(token)
        .then((c) => setConsentAccepted(c.mandatoryAccepted))
        .catch(() => setConsentAccepted(false));
    }
  }, [token, booking?.status, consentAccepted]);

  if (loading) {
    return (
      <>
        <NavBar />
        <main className="pt-[72px] min-h-screen flex items-center justify-center bg-nexa-bg-1">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nexa-primary" />
        </main>
      </>
    );
  }

  if (error || !booking) {
    return (
      <>
        <NavBar />
        <main className="pt-[72px] min-h-screen flex flex-col items-center justify-center gap-4 bg-nexa-bg-1">
          <p className="text-nexa-ink-3">{error || t("bookings.bookingNotFound")}</p>
          <Button asChild>
            <Link href={localePath("/listings")}>{t("common.browseStays")}</Link>
          </Button>
        </main>
      </>
    );
  }

  const lifecycle = resolveBookingLifecycle(booking);
  const lifecycleKey = `myBookings.lifecycle.${lifecycle}`;
  const lifecycleLabel = t(lifecycleKey) !== lifecycleKey ? t(lifecycleKey) : lifecycle;
  const paid = ["CONFIRMED", "CHECKED_IN", "COMPLETED"].includes(booking.status);
  const isHostView = booking.viewer_role === "HOST";
  const canStartPayment = booking.status === "PAYMENT_PENDING" && consentAccepted === true;

  const handleCardPayment = async () => {
    if (!token) return;
    if (consentAccepted !== true) {
      setPaymentError(t("bookings.termsFirst"));
      return;
    }
    setCreatingPayment(true);
    setPaymentError(null);
    try {
      trackEvent("payment_intent_started", {
        booking_id: booking.id,
        amount: booking.total_paid,
        currency: booking.currency,
      });
      const intent = await createPaymentIntent(
        booking.id,
        token,
        `web-card-${booking.id}`,
      );
      if (!intent.redirect_url) {
        throw new Error(t("bookings.cardIntegrationPending"));
      }
      window.location.assign(intent.redirect_url);
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : t("bookings.cardFailed"));
    } finally {
      setCreatingPayment(false);
    }
  };

  const handleCancelBooking = async (reason?: string) => {
    if (!token || !booking) return;
    setCancelling(true);
    setPaymentError(null);
    try {
      await cancelBooking(booking.id, "guest", reason, token);
      setCancelDialogOpen(false);
      reloadBooking();
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : t("myBookings.cancellationFailed"));
    } finally {
      setCancelling(false);
    }
  };

  const handleHostCancelBooking = async (reason?: string) => {
    if (!token || !booking) return;
    setCancelling(true);
    setPaymentError(null);
    try {
      await cancelBooking(booking.id, "host", reason, token);
      setCancelDialogOpen(false);
      reloadBooking();
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : t("myBookings.cancellationFailed"));
    } finally {
      setCancelling(false);
    }
  };

  if (isHostView) {
    return (
      <>
        <NavBar />
        <main className="pt-[72px] min-h-screen bg-nexa-bg-1">
          <HostBookingDetailView
            booking={booking}
            t={t}
            tf={tf}
            localePath={localePath}
            onCancel={() => setCancelDialogOpen(true)}
            cancelling={cancelling}
          />
        </main>
        <Footer />
        <CancelBookingDialog
          booking={booking}
          role="host"
          open={cancelDialogOpen}
          loading={cancelling}
          onClose={() => setCancelDialogOpen(false)}
          onConfirm={handleHostCancelBooking}
          t={t}
        />
      </>
    );
  }

  const timelineSteps = [
    {
      label: t("bookings.timelineCreated"),
      date: booking.created_at,
      done: true,
    },
    {
      label: t("bookings.timelinePayment"),
      date: paid ? booking.created_at : null,
      done: paid,
    },
    {
      label: t("bookings.timelineCheckin"),
      date: booking.checkin_date,
      done: lifecycle === "ACTIVE" || lifecycle === "COMPLETED",
    },
    {
      label: t("bookings.timelineCheckout"),
      date: booking.checkout_date,
      done: lifecycle === "COMPLETED",
    },
    {
      label: t("bookings.timelineCompleted"),
      date: booking.completed_at ?? (lifecycle === "COMPLETED" ? booking.checkout_date : null),
      done: lifecycle === "COMPLETED",
    },
  ];

  return (
    <>
      <NavBar />
      <main className="pt-[72px] min-h-screen bg-nexa-bg-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
          <Link
            href={localePath("/my-bookings")}
            className="inline-flex items-center gap-2 text-sm text-nexa-ink-3 hover:text-nexa-primary mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {t("bookings.backToBookings")}
          </Link>

          <header className="mb-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl font-bold text-nexa-ink">
                  {t("bookings.bookingDetails")}
                </h1>
                <p className="text-sm text-nexa-ink-4 mt-1 font-mono">{booking.id}</p>
              </div>
              <span
                className={cn(
                  "inline-flex px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide border",
                  lifecycleBadgeClasses(lifecycle),
                )}
              >
                {lifecycleLabel}
              </span>
            </div>
          </header>

          {booking.listing && booking.listing.media && booking.listing.media.length > 0 && (
            <div className="mb-6 rounded-2xl overflow-hidden">
              <ListingHeroGallery
                listingId={booking.listing.id}
                media={booking.listing.media}
                alt={booking.listing.title}
              />
            </div>
          )}

          <div className="space-y-6">
            <Section title={t("bookings.listing")}>
              {booking.listing ? (
                <>
                  <p className="font-semibold text-lg text-nexa-ink">{booking.listing.title}</p>
                  <p className="text-sm text-nexa-ink-4 flex items-center gap-1.5 mt-1">
                    <MapPin className="h-4 w-4" aria-hidden />
                    {booking.listing.city}
                  </p>
                  <p className="text-sm text-nexa-ink-3 mt-3">
                    {formatDate(booking.checkin_date)} – {formatDate(booking.checkout_date)} ·{" "}
                    {booking.guest_count} {booking.guest_count === 1 ? "guest" : "guests"}
                  </p>
                </>
              ) : (
                <p className="text-nexa-ink-3">—</p>
              )}
            </Section>

            <Section title={t("bookings.timeline")}>
              <ol className="space-y-4">
                {timelineSteps.map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <div
                      className={cn(
                        "mt-0.5 h-6 w-6 rounded-full flex items-center justify-center shrink-0",
                        step.done ? "bg-green-100 text-green-700" : "bg-nexa-bg-2 text-nexa-ink-4",
                      )}
                    >
                      {step.done ? (
                        <CheckCircle2 className="h-4 w-4" aria-hidden />
                      ) : (
                        <span className="h-2 w-2 rounded-full bg-nexa-ink-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-nexa-ink">{step.label}</p>
                      {step.date && (
                        <p className="text-xs text-nexa-ink-4 mt-0.5">{formatDate(String(step.date))}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </Section>

            <CheckinContactCard booking={booking} t={t} />

            {booking.occupants && booking.occupants.length > 0 && (
              <Section title={t("bookings.guestInfo")}>
                <ul className="space-y-2">
                  {booking.occupants.map((o, i) => (
                    <li key={i} className="text-sm">
                      <span className="font-medium text-nexa-ink">{o.full_name}</span>
                      {o.id_number && (
                        <span className="text-nexa-ink-4"> · ID: {o.id_number}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {booking.listing?.check_in_contact && (
              <Section title={t("bookings.hostInfo")}>
                <p className="text-sm font-medium text-nexa-ink">
                  {booking.listing.check_in_contact.full_name}
                </p>
                <p className="text-sm text-nexa-ink-4 mt-1">{t("bookings.hostContact")}</p>
              </Section>
            )}

            <Section title={t("bookings.paymentSummary")}>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>{t("bookings.subtotal")}</span>
                  <span>
                    {booking.total_subtotal} {booking.currency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{tf("bookings.guestFee", { percent: rates.guest_fee_percent })}</span>
                  <span>
                    {booking.guest_fee} {booking.currency}
                  </span>
                </div>
                {booking.total_paid != null && (
                  <div className="flex justify-between font-bold pt-3 border-t border-nexa-line">
                    <span>{t("bookings.total")}</span>
                    <span>
                      {booking.total_paid} {booking.currency}
                    </span>
                  </div>
                )}
              </div>

              {booking.status === "PAYMENT_PENDING" && (
                <div className="mt-6 pt-6 border-t border-nexa-line">
                  {consentAccepted === false && (
                    <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                      <p className="text-sm text-amber-800 mb-3">{t("bookings.acceptTerms")}</p>
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={consentChecked}
                          onChange={(e) => setConsentChecked(e.target.checked)}
                          className="mt-1 rounded border-nexa-line"
                        />
                        <span className="text-sm text-nexa-ink">
                          {t("bookings.agreeTerms")}{" "}
                          <Link
                            href={localePath("/terms")}
                            className="text-nexa-primary hover:underline font-medium"
                            target="_blank"
                          >
                            Terms & Conditions
                          </Link>{" "}
                          {t("bookings.and")}{" "}
                          <Link
                            href={localePath("/privacy")}
                            className="text-nexa-primary hover:underline font-medium"
                            target="_blank"
                          >
                            Privacy Policy
                          </Link>
                        </span>
                      </label>
                      <Button
                        onClick={async () => {
                          if (!token || !consentChecked) return;
                          setAcceptingConsent(true);
                          try {
                            await acceptMandatoryConsents(token);
                            setConsentAccepted(true);
                          } catch {
                            setPaymentError(t("bookings.acceptFailed"));
                          } finally {
                            setAcceptingConsent(false);
                          }
                        }}
                        disabled={!consentChecked || acceptingConsent}
                        className="mt-4"
                      >
                        {acceptingConsent ? t("bookings.accepting") : t("bookings.acceptContinue")}
                      </Button>
                    </div>
                  )}
                  <h4 className="text-sm font-semibold text-nexa-ink mb-3">{t("bookings.payNow")}</h4>
                  <div className="mb-4 p-4 bg-nexa-bg-2 border border-nexa-line rounded-xl">
                    <p className="text-sm text-nexa-ink-3">{t("bookings.cardIntegrationPending")}</p>
                  </div>
                  {paymentError && <p className="text-sm text-red-600 mb-3">{paymentError}</p>}
                  <div className="flex flex-col gap-3">
                    <Button
                      onClick={handleCardPayment}
                      disabled={!canStartPayment || creatingPayment}
                      className="w-full justify-center"
                    >
                      {creatingPayment ? t("bookings.processing") : t("bookings.payWithCard")}
                    </Button>
                    <Button
                      variant="outline"
                      disabled
                      className="w-full justify-center gap-2 opacity-60 cursor-not-allowed"
                    >
                      {t("bookings.payWithWallet")}
                      <span className="text-[0.65rem] font-semibold uppercase tracking-wide text-nexa-primary bg-nexa-primary-soft px-2 py-0.5 rounded-full">
                        {t("bookings.comingSoon")}
                      </span>
                    </Button>
                  </div>
                </div>
              )}
            </Section>

            <Section title={t("bookings.cancellationPolicy")}>
              <p className="text-sm text-nexa-ink-3">{t("bookings.standardCancellation")}</p>
              {canCancelBooking(booking) && (
                <Button
                  type="button"
                  variant="outline"
                  className="mt-4 border-red-200 text-red-600 hover:bg-red-50"
                  onClick={() => setCancelDialogOpen(true)}
                >
                  {t("myBookings.cancelBooking")}
                </Button>
              )}
            </Section>

            {booking.listing?.address && (
              <Section title={t("bookings.propertyLocation")}>
                <p className="text-sm text-nexa-ink">{booking.listing.address}</p>
              </Section>
            )}

            <Section title={t("bookings.receipt")}>
              <p className="text-sm text-nexa-ink-3 mb-4">
                {booking.id} · {formatDate(booking.checkin_date)} – {formatDate(booking.checkout_date)}
              </p>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => window.print()}
              >
                <Download className="h-4 w-4" aria-hidden />
                {t("bookings.downloadInvoice")}
              </Button>
            </Section>

            <Section title={t("bookings.support")} id="review">
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" asChild className="gap-2">
                  <Link href={`/contact?booking=${booking.id}`}>
                    <MessageCircle className="h-4 w-4" aria-hidden />
                    {t("myBookings.reportIssue")}
                  </Link>
                </Button>
                {existingReview && (
                  <>
                    <Button variant="outline" asChild className="gap-2">
                      <Link href={localePath(`/bookings/${booking.id}/review`)}>
                        <Star className="h-4 w-4" aria-hidden />
                        {t("myBookings.viewReview")}
                      </Link>
                    </Button>
                    {existingReview.can_edit && (
                      <Button asChild className="gap-2">
                        <Link href={localePath(`/bookings/${booking.id}/review`)}>
                          {t("myBookings.editReview")}
                        </Link>
                      </Button>
                    )}
                  </>
                )}
                {!existingReview && canReviewBooking(booking) && (
                  <Button asChild className="gap-2">
                    <Link href={localePath(`/bookings/${booking.id}/review`)}>
                      <Star className="h-4 w-4" aria-hidden />
                      {t("myBookings.leaveReview")}
                    </Link>
                  </Button>
                )}
              </div>
              {existingReview && (
                <div className="mt-4 p-4 rounded-xl bg-nexa-bg-2 border border-nexa-line/40">
                  <StarRatingDisplay rating={existingReview.rating} size="md" />
                  {existingReview.comment && (
                    <p className="mt-2 text-sm text-nexa-ink-3">{existingReview.comment}</p>
                  )}
                </div>
              )}
            </Section>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Button asChild className="flex-1 justify-center">
              <Link href={localePath("/my-bookings")}>{t("bookings.backToBookings")}</Link>
            </Button>
            <Button variant="outline" asChild className="flex-1 justify-center">
              <Link href={localePath("/listings")}>{t("bookings.browseMore")}</Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
      <CancelBookingDialog
        booking={booking}
        role="guest"
        open={cancelDialogOpen}
        loading={cancelling}
        onClose={() => setCancelDialogOpen(false)}
        onConfirm={handleCancelBooking}
        t={t}
      />
    </>
  );
}

export default function BookingDetailPage() {
  return (
    <ProtectedRoute>
      <BookingDetailPageInner />
    </ProtectedRoute>
  );
}
