"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  X,
  Star,
  MapPin,
  BadgeCheck,
  Wifi,
  KeyRound,
  Sparkles,
  Shield,
  CheckCircle2,
  Clock,
  LogOut,
  CigaretteOff,
  PawPrint,
  Play,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { NavBar } from "@/components/navbar/NavBar";
import { Footer } from "@/components/footer/Footer";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "@/components/ui/Alert";
import { getListing, createBooking, getListingMediaUrl, searchListings, getListingAvailability } from "@/lib/stays-api";
import { formatUserError } from "@/lib/errors";
import { ListingHeroGallery } from "@/components/listing/ListingHeroGallery";
import { ListingBookingCard } from "@/components/listing/ListingBookingCard";
import { ListingLocationSection } from "@/components/listing/ListingLocationSection";
import { ListingReviewsSection } from "@/components/reviews/ListingReviewsSection";
import { getShortLocationLabel } from "@/lib/listing-location";
import { getCurrentUserOrNull } from "@/lib/kyc-api";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useStaysFees } from "@/contexts/StaysFeeContext";
import { calculateBookingFees } from "@/lib/stays-fees";
import { GuestVerificationStep } from "@/components/booking/GuestVerificationStep";
import {
  addDaysToDateString,
  bookingNights,
  expandBlockedNights,
  isValidBookingRange,
  rangeOverlapsBlockedNights,
  readDateSearchParam,
} from "@/lib/booking-dates";
import type { StaysListing, CreateBookingOccupantDto } from "@/lib/stays-types";
import { sanitizeGuestCount } from "@/lib/input-sanitize";
import { trackEvent } from "@/lib/analytics";
import { recordRecentlyViewed } from "@/lib/recently-viewed";
import { recordListingViewForInstall } from "@/lib/pwa-engagement";
import { ShareButton } from "@/components/pwa/ShareButton";
import {
  amenityLabel,
  normalizeAmenities,
  AMENITY_OPTIONS,
  LISTING_TYPES,
} from "@/lib/host-listing-constants";

const placeholderImg = "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=800&q=80";

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  wifi: <Wifi className="w-5 h-5" />,
  kitchen: <span className="text-lg">🍳</span>,
  ac: <span className="text-lg">❄️</span>,
  tv: <span className="text-lg">📺</span>,
  washing_machine: <span className="text-lg">🧺</span>,
  parking: <span className="text-lg">🅿️</span>,
  pool: <span className="text-lg">🏊</span>,
};

const HIGHLIGHT_AMENITIES = [
  { tag: "wifi", title: "Fast WiFi", desc: "Reliable connection for work and streaming" },
  { tag: "kitchen", title: "Full Kitchen", desc: "Cook meals with complete appliances" },
  { tag: "parking", title: "Free Parking", desc: "Dedicated parking on premises" },
  { tag: "cleaning", title: "Enhanced Clean", desc: "Strict health and safety protocols" },
];

function listingTypeLabel(type: string): string {
  return LISTING_TYPES.find((t) => t.id === type)?.label ?? type;
}

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, isAuthenticated } = useAuth();
  const { t, localePath } = useLanguage();
  const { rates } = useStaysFees();
  const id = params.id as string;

  const [listing, setListing] = useState<StaysListing | null>(null);
  const [similarListings, setSimilarListings] = useState<StaysListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<{
    kyc_status: string;
    full_name?: string;
    phone_number?: string;
    email?: string;
  } | null>(null);
  const [showVerificationStep, setShowVerificationStep] = useState(false);

  const [checkin, setCheckin] = useState(
    () => readDateSearchParam(searchParams, ["checkin", "checkin_date"]),
  );
  const [checkout, setCheckout] = useState(
    () => readDateSearchParam(searchParams, ["checkout", "checkout_date"]),
  );
  const [guests, setGuests] = useState(
    () => sanitizeGuestCount(searchParams.get("guests") || "1") ?? 1,
  );
  const [blockedNights, setBlockedNights] = useState<string[]>([]);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [fullscreenIndex, setFullscreenIndex] = useState(0);
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);

  useEffect(() => {
    setCheckin(readDateSearchParam(searchParams, ["checkin", "checkin_date"]));
    setCheckout(readDateSearchParam(searchParams, ["checkout", "checkout_date"]));
    setGuests(sanitizeGuestCount(searchParams.get("guests") || "1") ?? 1);
  }, [searchParams]);

  useEffect(() => {
    if (isAuthenticated && token) {
      getCurrentUserOrNull(() => token).then(setUserProfile);
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getListing(id, token)
      .then((data) => {
        if (cancelled) return;
        setListing(data);
        const firstPhoto = data.media?.find((m) => m.kind === "PHOTO") ?? data.media?.[0];
        recordRecentlyViewed({
          id: data.id,
          title: data.title,
          city: data.city,
          imageUrl: firstPhoto
            ? getListingMediaUrl(data.id, firstPhoto.asset_id)
            : undefined,
        });
        recordListingViewForInstall(data.id);
        searchListings({ city: data.city, guests: 1 })
          .then((results) => {
            if (!cancelled) {
              setSimilarListings(results.filter((l) => l.id !== id).slice(0, 6));
            }
          })
          .catch(() => {
            if (!cancelled) setSimilarListings([]);
          });
      })
      .catch((err) => {
        if (!cancelled) {
          setError(formatUserError(err) || "Failed to load");
          setListing(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, token]);

  useEffect(() => {
    if (!listing) return;
    trackEvent("listing_viewed", {
      listing_id: listing.id,
      city: listing.city,
      guests,
    });
  }, [listing, guests]);

  useEffect(() => {
    const from = (() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    })();
    const to = addDaysToDateString(from, 540);
    getListingAvailability(id, from, to)
      .then((data) => setBlockedNights(expandBlockedNights(data.blocked_ranges)))
      .catch(() => setBlockedNights([]));
  }, [id]);

  useEffect(() => {
    if (!listing) return;
    const max = Math.max(1, listing.rules?.max_guests ?? 6);
    setGuests((g) => sanitizeGuestCount(g, max) ?? 1);
  }, [listing]);

  const photoUrls = useMemo(() => {
    if (!listing?.media) return [placeholderImg];
    const photos = listing.media
      .filter((m) => m.kind === "PHOTO")
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    if (photos.length === 0) return [placeholderImg];
    return photos.map((p) => getListingMediaUrl(listing.id, p.asset_id));
  }, [listing]);

  const openGalleryAt = (index: number) => {
    setFullscreenIndex(index);
    setFullscreenImage(photoUrls[index] ?? placeholderImg);
  };

  const handleCheckinChange = (value: string) => {
    setCheckin(value);
    if (value && checkout && !isValidBookingRange(value, checkout)) {
      setCheckout(addDaysToDateString(value, 1));
      return;
    }
    if (value && checkout && rangeOverlapsBlockedNights(value, checkout, blockedNights)) {
      setCheckout("");
    }
  };

  const handleCheckoutChange = (value: string) => {
    if (checkin && value && rangeOverlapsBlockedNights(checkin, value, blockedNights)) {
      setBookingError("Selected dates overlap an existing booking. Please choose different dates.");
      return;
    }
    setBookingError(null);
    setCheckout(value);
  };

  const handleBookClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!listing) return;
    if (!isAuthenticated || !token) {
      const returnTo = `${localePath(`/listings/${id}`)}${typeof window !== "undefined" ? window.location.search : ""}`;
      router.push(`${localePath("/login")}?redirect=${encodeURIComponent(returnTo)}`);
      return;
    }
    if (!checkin || !checkout) {
      setBookingError("Please select check-in and check-out dates.");
      return;
    }
    if (!isValidBookingRange(checkin, checkout)) {
      setBookingError("Check-out must be at least one night after check-in.");
      return;
    }
    if (rangeOverlapsBlockedNights(checkin, checkout, blockedNights)) {
      setBookingError("Selected dates overlap an existing booking. Please choose different dates.");
      return;
    }
    if (userProfile && userProfile.kyc_status !== "APPROVED" && userProfile.kyc_status !== "VERIFIED") return;
    trackEvent("booking_started", {
      listing_id: listing.id,
      checkin,
      checkout,
      guests,
    });
    setBookingError(null);
    const max = Math.max(1, listing.rules?.max_guests ?? 6);
    const guestCount = sanitizeGuestCount(guests, max) ?? 1;

    // Solo booking: reuse verified account identity — skip re-entry / ID upload.
    if (
      guestCount === 1 &&
      userProfile?.full_name &&
      userProfile.full_name.trim().length >= 2
    ) {
      void handleVerificationConfirm([
        {
          full_name: userProfile.full_name.trim(),
          is_primary: true,
          phone: userProfile.phone_number || undefined,
          email: userProfile.email || undefined,
        },
      ]);
      return;
    }

    setShowVerificationStep(true);
  };

  const handleVerificationConfirm = async (occupants: CreateBookingOccupantDto[]) => {
    if (!listing || !token) return;
    const max = Math.max(1, listing.rules?.max_guests ?? 6);
    const guestCount = sanitizeGuestCount(guests, max) ?? 1;
    setBookingError(null);
    setBooking(true);
    try {
      const b = await createBooking(
        {
          listing_id: id,
          checkin_date: checkin,
          checkout_date: checkout,
          guest_count: guestCount,
          occupants,
        },
        token
      );
      trackEvent("booking_created", {
        booking_id: b.id,
        listing_id: id,
        total_paid: b.total_paid,
        currency: b.currency,
      });
      void import("@/lib/pwa-engagement").then((m) => m.markPwaBookingCompleted());
      window.dispatchEvent(new Event("nexa-guidance-booking-success"));
      setShowVerificationStep(false);
      router.push(localePath(`/bookings/${b.id}`));
    } catch (err) {
      setBookingError(err instanceof Error ? err.message : "Booking failed");
    } finally {
      setBooking(false);
    }
  };

  const backHref = (() => {
    const p = new URLSearchParams();
    const ci = readDateSearchParam(searchParams, ["checkin", "checkin_date"]);
    const co = readDateSearchParam(searchParams, ["checkout", "checkout_date"]);
    const g = searchParams.get("guests");
    const c = searchParams.get("city");
    const verified = searchParams.get("verified_walkthrough_only");
    const instant = searchParams.get("instant_booking_only");
    const listingType = searchParams.get("listing_type");
    if (ci) p.set("checkin_date", ci);
    if (co) p.set("checkout_date", co);
    if (g) p.set("guests", g);
    if (c) p.set("city", c);
    if (verified === "true") p.set("verified_walkthrough_only", "true");
    if (instant === "true") p.set("instant_booking_only", "true");
    if (listingType) p.set("listing_type", listingType);
    return localePath(`/listings${p.toString() ? `?${p}` : ""}`);
  })();

  if (loading) {
    return (
      <>
        <NavBar />
        <main className="pt-[72px] min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nexa-primary" />
        </main>
      </>
    );
  }

  if (error || !listing) {
    return (
      <>
        <NavBar />
        <main className="pt-[72px] min-h-screen flex flex-col items-center justify-center gap-4 px-4">
          <div className="w-full max-w-md">
            <ErrorAlert error={error || "Listing not found"} />
          </div>
          <Button asChild>
            <Link href={localePath("/listings")}>Back to Listings</Link>
          </Button>
        </main>
      </>
    );
  }

  const price = listing.rate_plan?.base_price ?? 0;
  const cleaningFee = listing.rate_plan?.cleaning_fee ?? 0;
  const currency = listing.rate_plan?.currency || "MAD";
  const amenities = normalizeAmenities(listing.rules?.amenities);
  const maxGuests = Math.max(1, listing.rules?.max_guests ?? 6);
  const nights =
    checkin && checkout ? bookingNights(checkin, checkout) : 0;
  const subtotal = nights * price + cleaningFee;
  const { guestFee, totalGuestPays: total } = calculateBookingFees(subtotal, rates);
  const guestFeeLabel = `${rates.guest_fee_percent}%`;

  const hasWalkthrough = listing.media?.some((m) => m.kind === "WALKTHROUGH");
  const walkthroughMedia = listing.media?.find((m) => m.kind === "WALKTHROUGH");
  const visibleAmenities = showAllAmenities ? amenities : amenities.slice(0, 6);
  const highlights = HIGHLIGHT_AMENITIES.filter(
    (h) => h.tag === "cleaning" || amenities.includes(h.tag)
  ).slice(0, 4);

  const similarDetailUrl = (listingId: string) => {
    const p = new URLSearchParams();
    if (checkin) p.set("checkin_date", checkin);
    if (checkout) p.set("checkout_date", checkout);
    if (guests) p.set("guests", String(guests));
    if (listing.city) p.set("city", listing.city);
    return localePath(`/listings/${listingId}${p.toString() ? `?${p}` : ""}`);
  };

  return (
    <>
      <NavBar />
      <main className="pt-[72px] min-h-screen bg-nexa-bg pb-24 md:pb-0">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-16 py-6 md:py-8">
          <Link href={backHref} className="text-nexa-primary hover:underline text-sm mb-6 inline-block">
            ← Back to Listings
          </Link>

          {/* Hero Gallery */}
          <section className="mb-8">
            {listing.media && listing.media.length > 0 ? (
              <ListingHeroGallery
                listingId={listing.id}
                media={listing.media}
                alt={listing.title}
                placeholder={placeholderImg}
                verified={!!hasWalkthrough}
                instantBooking={listing.instant_booking}
                onImageClick={(url) => {
                  const idx = photoUrls.indexOf(url);
                  openGalleryAt(idx >= 0 ? idx : 0);
                }}
                onShowAll={() => openGalleryAt(0)}
              />
            ) : (
              <div className="h-[420px] md:h-[560px] rounded-2xl overflow-hidden shadow-nexa-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={placeholderImg} alt={listing.title} className="w-full h-full object-cover" />
              </div>
            )}
          </section>

          {/* Video Tour — directly below photos */}
          {hasWalkthrough && walkthroughMedia && (
            <section className="mb-8">
              <h2 className="font-display text-2xl font-semibold mb-4">Video Tour</h2>
              <div className="relative rounded-2xl overflow-hidden aspect-video shadow-nexa-card bg-nexa-ink">
                {!videoPlaying ? (
                  <button
                    type="button"
                    onClick={() => setVideoPlaying(true)}
                    className="group w-full h-full relative focus:outline-none"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photoUrls[0]}
                      alt="Video tour thumbnail"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <div className="w-20 h-20 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-xl transform transition-transform group-hover:scale-110">
                        <Play className="w-10 h-10 text-nexa-primary fill-nexa-primary ml-1" />
                      </div>
                    </div>
                    <div className="absolute bottom-6 left-6 text-white font-medium drop-shadow-md text-sm">
                      Experience the space in motion
                    </div>
                  </button>
                ) : (
                  <video
                    src={getListingMediaUrl(listing.id, walkthroughMedia.asset_id)}
                    controls
                    autoPlay
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            </section>
          )}

          {/* Property Header */}
          <section className="border-b border-nexa-line/60 pb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-nexa-ink break-words">{listing.title}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-nexa-ink-3 text-sm">
                <span className="flex items-center gap-1 font-medium text-nexa-ink">
                  <MapPin className="w-4 h-4 text-nexa-primary" />
                  {getShortLocationLabel(listing)}
                </span>
                <span className="hidden sm:inline">•</span>
                <span className="font-medium">{listingTypeLabel(listing.listing_type)}</span>
                {hasWalkthrough && (
                  <>
                    <span className="hidden sm:inline">•</span>
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                      <BadgeCheck className="w-3.5 h-3.5" />
                      Verified Walkthrough
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="flex flex-col items-start md:items-end gap-3">
              <ShareButton title={listing.title} text={getShortLocationLabel(listing)} />
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-medium text-nexa-ink-3">
              <span>{maxGuests} Guests max</span>
              {listing.instant_booking && (
                <>
                  <span>•</span>
                  <span className="text-nexa-primary">Instant booking</span>
                </>
              )}
              </div>
            </div>
          </section>

          {/* Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 mt-8">
            {/* Left Column */}
            <div className="md:col-span-8 space-y-12 order-2 md:order-1">
              {/* About */}
              <section>
                <h2 className="font-display text-2xl font-semibold mb-4">About this stay</h2>
                {listing.description ? (
                  <p className="text-lg text-nexa-ink-3 leading-relaxed max-w-3xl">{listing.description}</p>
                ) : (
                  <p className="text-lg text-nexa-ink-3 leading-relaxed max-w-3xl">
                    A beautifully curated {listingTypeLabel(listing.listing_type).toLowerCase()} in {listing.city},
                    designed for comfort and verified by the Nexa Stays team.
                  </p>
                )}
                {highlights.length > 0 && (
                  <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {highlights.map((h) => (
                      <div key={h.tag} className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-nexa-bg-2 flex items-center justify-center shrink-0 text-nexa-primary">
                          {h.tag === "cleaning" ? (
                            <Sparkles className="w-5 h-5" />
                          ) : h.tag === "wifi" ? (
                            <Wifi className="w-5 h-5" />
                          ) : (
                            <KeyRound className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm">{h.title}</h4>
                          <p className="text-xs text-nexa-ink-4 mt-0.5">{h.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Amenities */}
              <section>
                <h2 className="font-display text-2xl font-semibold mb-4">What this place offers</h2>
                {amenities.length > 0 ? (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {visibleAmenities.map((tag) => {
                        const opt = AMENITY_OPTIONS.find((a) => a.tag === tag);
                        return (
                          <div
                            key={tag}
                            className="p-4 rounded-2xl bg-white border border-nexa-line/40 flex items-center gap-3 shadow-sm"
                          >
                            <span className="text-nexa-primary">
                              {AMENITY_ICONS[tag] ?? <span>{opt?.emoji ?? "✓"}</span>}
                            </span>
                            <span className="text-sm font-medium">{amenityLabel(tag)}</span>
                          </div>
                        );
                      })}
                    </div>
                    {amenities.length > 6 && (
                      <button
                        type="button"
                        onClick={() => setShowAllAmenities((v) => !v)}
                        className="mt-5 font-semibold underline text-nexa-ink hover:text-nexa-primary transition-colors text-sm"
                      >
                        {showAllAmenities ? "Show fewer amenities" : `Show all ${amenities.length} amenities`}
                      </button>
                    )}
                  </>
                ) : (
                  <div className="flex flex-wrap gap-3 text-sm text-nexa-ink-3">
                    <span className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-nexa-primary" />
                      Check-in {listing.checkin_time}
                    </span>
                    <span className="flex items-center gap-2">
                      <LogOut className="w-4 h-4 text-nexa-primary" />
                      Check-out {listing.checkout_time}
                    </span>
                    {listing.instant_booking && (
                      <span className="flex items-center gap-2">
                        <BadgeCheck className="w-4 h-4 text-nexa-primary" />
                        Instant booking
                      </span>
                    )}
                  </div>
                )}
              </section>

              {/* Location */}
              <ListingLocationSection
                listing={listing}
                title={t("listingDetail.whereYoullStay")}
                openInMapsLabel={t("listingDetail.openInMaps")}
                contactNote={t("listingDetail.checkInContactAfterBooking")}
              />

              {/* Trust */}
              <section>
                <div className="bg-white/80 backdrop-blur-xl p-6 md:p-8 rounded-2xl border border-white shadow-nexa-card">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="bg-nexa-primary text-white w-12 h-12 rounded-full flex items-center justify-center shrink-0">
                      <Shield className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-display text-xl font-semibold">Nexa Trust Guarantee</h3>
                      <p className="text-nexa-ink-3 text-sm">We&apos;ve verified every detail for your peace of mind.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3">
                    {[
                      "Host identity verified",
                      "Property listing confirmed",
                      hasWalkthrough ? "Walkthrough video approved" : "Photo documentation reviewed",
                      "Safe neighborhood certified",
                    ].map((item) => (
                      <div key={item} className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-700 shrink-0" />
                        <span className="text-sm font-medium">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Host */}
              {listing.host && (
                <section>
                  <div className="bg-nexa-bg-2 p-6 md:p-8 rounded-2xl flex flex-col md:flex-row gap-6 items-center">
                    <div className="relative shrink-0">
                      <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-lg bg-nexa-primary/20 flex items-center justify-center">
                        <span className="text-3xl font-display font-bold text-nexa-primary">
                          {(listing.host.full_name ?? "H").charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="absolute -bottom-1 -right-1 bg-nexa-primary text-white w-8 h-8 rounded-full flex items-center justify-center border-2 border-white">
                        <BadgeCheck className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="flex-1 text-center md:text-left">
                      <h3 className="font-display text-xl font-semibold">
                        Meet your host, {listing.host.full_name ?? "Host"}
                      </h3>
                      <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-3">
                        <span className="bg-white px-3 py-1 rounded-full text-xs font-semibold border border-nexa-line/40">
                          Verified Host
                        </span>
                        {hasWalkthrough && (
                          <span className="bg-white px-3 py-1 rounded-full text-xs font-semibold border border-nexa-line/40">
                            Video Walkthrough
                          </span>
                        )}
                        {listing.instant_booking && (
                          <span className="bg-white px-3 py-1 rounded-full text-xs font-semibold border border-nexa-line/40">
                            Instant Booking
                          </span>
                        )}
                      </div>
                      <p className="mt-4 text-nexa-ink-3 text-sm">
                        {t("bookingVerification.hostContactRevealed")}
                      </p>
                    </div>
                  </div>
                </section>
              )}

              <ListingReviewsSection
                listingId={listing.id}
                initialAvg={(listing as StaysListing & { avg_rating?: number }).avg_rating}
                initialCount={(listing as StaysListing & { review_count?: number }).review_count}
              />

              {/* House Rules */}
              <section className="border-t border-nexa-line/60 pt-10">
                <h2 className="font-display text-2xl font-semibold mb-8">Things to know</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div>
                    <h3 className="font-semibold text-base mb-4">House Rules</h3>
                    <ul className="space-y-3">
                      <li className="flex items-center gap-3 text-nexa-ink-3 text-sm">
                        <Clock className="w-4 h-4 text-nexa-primary shrink-0" />
                        Check-in: {listing.checkin_time}
                      </li>
                      <li className="flex items-center gap-3 text-nexa-ink-3 text-sm">
                        <LogOut className="w-4 h-4 text-nexa-primary shrink-0" />
                        Checkout: {listing.checkout_time}
                      </li>
                      {listing.rules?.smoking_policy === "NOT_ALLOWED" && (
                        <li className="flex items-center gap-3 text-nexa-ink-3 text-sm">
                          <CigaretteOff className="w-4 h-4 text-nexa-primary shrink-0" />
                          No smoking inside
                        </li>
                      )}
                      {listing.rules?.pets_policy && listing.rules.pets_policy !== "NO" && (
                        <li className="flex items-center gap-3 text-nexa-ink-3 text-sm">
                          <PawPrint className="w-4 h-4 text-nexa-primary shrink-0" />
                          Pets {listing.rules.pets_policy === "ALLOWED" ? "allowed" : "allowed (dogs & cats)"}
                        </li>
                      )}
                      {listing.rules?.pets_policy === "NO" && (
                        <li className="flex items-center gap-3 text-nexa-ink-3 text-sm">
                          <PawPrint className="w-4 h-4 text-nexa-primary shrink-0" />
                          No pets allowed
                        </li>
                      )}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-base mb-4">Safety &amp; Property</h3>
                    <ul className="space-y-3">
                      <li className="flex items-center gap-3 text-nexa-ink-3 text-sm">
                        <Shield className="w-4 h-4 text-nexa-primary shrink-0" />
                        Host identity verified
                      </li>
                      {hasWalkthrough && (
                        <li className="flex items-center gap-3 text-nexa-ink-3 text-sm">
                          <BadgeCheck className="w-4 h-4 text-nexa-primary shrink-0" />
                          Walkthrough video on file
                        </li>
                      )}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-base mb-4">Cancellation Policy</h3>
                    <p className="text-nexa-ink-3 text-sm leading-relaxed mb-3">
                      Add your trip dates to get the cancellation details for this stay.
                    </p>
                    <Link href={localePath("/refund")} className="font-semibold underline text-sm hover:text-nexa-primary">
                      View refund policy
                    </Link>
                  </div>
                </div>
              </section>
            </div>

            {/* Right Column: Booking Card */}
            <aside id="booking-card" className="md:col-span-4 order-1 md:order-2">
              <ListingBookingCard
                listing={listing}
                checkin={checkin}
                checkout={checkout}
                guests={guests}
                maxGuests={maxGuests}
                nights={nights}
                price={price}
                cleaningFee={cleaningFee}
                guestFee={guestFee}
                guestFeeLabel={guestFeeLabel}
                total={total}
                currency={currency}
                booking={booking}
                bookingError={bookingError}
                isAuthenticated={isAuthenticated}
                userProfile={userProfile}
                localePath={localePath}
                blockedNights={blockedNights}
                onCheckinChange={handleCheckinChange}
                onCheckoutChange={handleCheckoutChange}
                onGuestsChange={setGuests}
                onSubmit={handleBookClick}
              />
            </aside>
          </div>

          {/* Similar Stays */}
          {similarListings.length > 0 && (
            <section className="mt-16 mb-8 overflow-hidden">
              <h2 className="font-display text-2xl font-semibold mb-8">Similar stays you might like</h2>
              <div className="flex gap-5 overflow-x-auto pb-4 snap-x scrollbar-hide">
                {similarListings.map((item) => {
                  const itemPrice = item.rate_plan?.base_price ?? 0;
                  const itemCurrency = item.rate_plan?.currency || "MAD";
                  const firstPhoto = item.media?.find((m) => m.kind === "PHOTO");
                  const imgSrc = firstPhoto
                    ? getListingMediaUrl(item.id, firstPhoto.asset_id)
                    : placeholderImg;
                  return (
                    <Link
                      key={item.id}
                      href={similarDetailUrl(item.id)}
                      className="min-w-[280px] flex-shrink-0 snap-start group"
                    >
                      <div className="h-56 rounded-2xl overflow-hidden mb-3 relative shadow-sm">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imgSrc}
                          alt={item.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h4 className="font-bold text-sm line-clamp-1">{item.title}</h4>
                          <p className="text-nexa-ink-4 text-xs">{item.city}, Morocco</p>
                        </div>
                        {item.instant_booking && (
                          <span className="flex items-center gap-0.5 text-xs font-semibold text-nexa-primary shrink-0">
                            <Star className="w-3 h-3 fill-nexa-primary" />
                            Instant
                          </span>
                        )}
                      </div>
                      <p className="mt-1 font-bold text-sm">
                        {itemPrice}{" "}
                        <span className="font-normal text-nexa-ink-4">{itemCurrency}/night</span>
                      </p>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* Trust Ecosystem */}
          <section className="mt-8 mb-12 bg-nexa-bg-2/60 p-8 md:p-12 rounded-2xl">
            <h2 className="font-display text-2xl font-semibold text-center mb-10">The Nexa Trust Ecosystem</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {[
                {
                  icon: <BadgeCheck className="w-8 h-8 text-nexa-primary" />,
                  title: "Verified Hosts Only",
                  desc: "Every host undergoes rigorous identity and background checks to ensure your safety and comfort.",
                },
                {
                  icon: <Shield className="w-8 h-8 text-nexa-primary" />,
                  title: "Secure Escrow Payments",
                  desc: "Your funds are held securely by Nexa and only released to the host 24 hours after a successful check-in.",
                },
                {
                  icon: <Sparkles className="w-8 h-8 text-nexa-primary" />,
                  title: "24/7 Premium Support",
                  desc: "Our digital concierge team is available around the clock to assist with any request during your stay.",
                },
              ].map((item) => (
                <div key={item.title} className="text-center space-y-4">
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-nexa-card flex items-center justify-center mx-auto">
                    {item.icon}
                  </div>
                  <h3 className="font-bold text-base">{item.title}</h3>
                  <p className="text-nexa-ink-3 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Mobile sticky booking bar */}
        <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-nexa-line px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-lg flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-bold text-base sm:text-lg truncate">
              {price} <span className="text-sm font-normal text-nexa-ink-4">{currency}/night</span>
            </p>
            {nights > 0 && (
              <p className="text-xs text-nexa-ink-4 truncate">
                {total.toFixed(2)} {currency} total · {nights} night{nights > 1 ? "s" : ""}
              </p>
            )}
          </div>
          <Button
            type="button"
            className="shrink-0 font-semibold"
            onClick={() => document.getElementById("booking-card")?.scrollIntoView({ behavior: "smooth", block: "start" })}
          >
            {isAuthenticated ? "Book" : "Sign in"}
          </Button>
        </div>
      </main>

      <GuestVerificationStep
        open={showVerificationStep}
        onClose={() => setShowVerificationStep(false)}
        guestCount={guests}
        userProfile={userProfile ?? undefined}
        onConfirm={handleVerificationConfirm}
        submitting={booking}
        t={t}
        getToken={() => token}
      />

      {/* Fullscreen gallery */}
      {fullscreenImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90"
          onClick={() => setFullscreenImage(null)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Escape" && setFullscreenImage(null)}
          aria-label="Close gallery"
        >
          <button
            type="button"
            onClick={() => setFullscreenImage(null)}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
          {photoUrls.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const next = (fullscreenIndex - 1 + photoUrls.length) % photoUrls.length;
                  openGalleryAt(next);
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
                aria-label="Previous"
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const next = (fullscreenIndex + 1) % photoUrls.length;
                  openGalleryAt(next);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
                aria-label="Next"
              >
                <ChevronRight className="h-8 w-8" />
              </button>
              <div className="absolute bottom-6 left-0 right-0 text-center text-white/80 text-sm">
                {fullscreenIndex + 1} / {photoUrls.length}
              </div>
            </>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={fullscreenImage}
            alt="Listing photo"
            className="max-w-[95vw] max-h-[95vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <Footer />
    </>
  );
}
