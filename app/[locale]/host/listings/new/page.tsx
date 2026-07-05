"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { NavBar } from "@/components/navbar/NavBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import {
  createHostListing,
  getHostVerification,
  uploadListingPhoto,
  uploadListingWalkthrough,
  normalizeHostVerificationStatus,
} from "@/lib/stays-api";
import {
  LISTING_WIZARD_STEPS,
  LISTING_TYPES,
  AMENITY_OPTIONS,
  MIN_LISTING_PHOTOS,
  defaultListingForm,
  type ListingWizardForm,
} from "@/lib/host-listing-constants";
import { NEXA_STAYS_LOGO_SRC } from "@/lib/brand-assets";
import { Menu, X, Upload, CheckCircle2 } from "lucide-react";
import { AppLoader } from "@/components/AppLoader";

const totalSteps = LISTING_WIZARD_STEPS.length;

const progressWidths: Record<number, number> = {
  1: 12.5,
  2: 25,
  3: 37.5,
  4: 50,
  5: 62.5,
  6: 75,
  7: 87.5,
  8: 100,
};

function ListingWizardContent() {
  const { token, user } = useAuth();
  const { t, localePath } = useLanguage();

  const stepLabels = [
    t("hostListing.stepLabel1"),
    t("hostListing.stepLabel2"),
    t("hostListing.stepLabel3"),
    t("hostListing.stepLabel4"),
    t("hostListing.stepLabel5"),
    t("hostListing.stepLabel6"),
    t("hostListing.stepLabel7"),
    t("hostListing.stepLabel8"),
  ];

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<ListingWizardForm>(defaultListingForm);
  const [mobileStepsOpen, setMobileStepsOpen] = useState(false);
  const [hostReady, setHostReady] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    getHostVerification(token)
      .then((s) => {
        const n = normalizeHostVerificationStatus(
          s as Parameters<typeof normalizeHostVerificationStatus>[0],
        );
        setHostReady(n.status === "APPROVED");
      })
      .catch(() => setHostReady(false));
  }, [token]);

  useEffect(() => {
    if (!user) return;
    setForm((prev) => ({
      ...prev,
      contactName: prev.contactName || user.full_name?.trim() || "",
      contactPhone: prev.contactPhone || user.phone_number?.trim() || "",
    }));
  }, [user]);

  const patch = useCallback(
    (partial: Partial<ListingWizardForm>) =>
      setForm((prev) => ({ ...prev, ...partial })),
    [],
  );

  const validateStep = (s: number): string | null => {
    switch (s) {
      case 1:
        return form.listingType ? null : "Select a property type.";
      case 2:
        if (!form.title.trim()) return "Property title is required.";
        if (!form.city.trim()) return "City is required.";
        if (!form.address.trim()) return "Address is required.";
        if (form.description.trim().length < 20)
          return "Description must be at least 20 characters.";
        return null;
      case 3:
        if (form.maxGuests < 1) return "Max guests must be at least 1.";
        return null;
      case 4:
        return form.amenities.length > 0 ? null : "Select at least one amenity.";
      case 5: {
        const price = Number(form.basePrice);
        if (!Number.isFinite(price) || price <= 0)
          return "Enter a valid nightly price.";
        return null;
      }
      case 6:
        if (!form.contactName.trim()) return "Check-in contact name is required.";
        if (!form.contactPhone.trim()) return "Check-in contact phone is required.";
        return null;
      case 7:
        if (form.photos.length < MIN_LISTING_PHOTOS)
          return `Upload at least ${MIN_LISTING_PHOTOS} photos.`;
        return null;
      case 8:
        if (!form.walkthrough) return "Upload a walkthrough video.";
        return null;
      default:
        return null;
    }
  };

  const goNext = () => {
    const err = validateStep(step);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setStep((s) => Math.min(s + 1, totalSteps));
  };

  const goBack = () => {
    setError(null);
    setStep((s) => Math.max(s - 1, 1));
  };

  const handlePhotos = (files: FileList | null) => {
    if (!files?.length) return;
    const added = Array.from(files).filter((f) => f.type.startsWith("image/"));
    const photos = [...form.photos, ...added];
    const photoPreviews = [
      ...form.photoPreviews,
      ...added.map((f) => URL.createObjectURL(f)),
    ];
    patch({ photos, photoPreviews });
  };

  const removePhoto = (index: number) => {
    URL.revokeObjectURL(form.photoPreviews[index]);
    patch({
      photos: form.photos.filter((_, i) => i !== index),
      photoPreviews: form.photoPreviews.filter((_, i) => i !== index),
    });
  };

  const handleWalkthrough = (file: File | null) => {
    if (form.walkthroughPreview) URL.revokeObjectURL(form.walkthroughPreview);
    if (!file) {
      patch({ walkthrough: null, walkthroughPreview: null });
      return;
    }
    patch({
      walkthrough: file,
      walkthroughPreview: URL.createObjectURL(file),
    });
  };

  const toggleAmenity = (tag: string) => {
    const amenities = form.amenities.includes(tag)
      ? form.amenities.filter((a) => a !== tag)
      : [...form.amenities, tag];
    patch({ amenities });
  };

  const handleSubmit = async () => {
    for (let s = 1; s <= totalSteps; s++) {
      const err = validateStep(s);
      if (err) {
        setError(err);
        setStep(s);
        return;
      }
    }
    if (!token) return;

    setSubmitting(true);
    setError(null);
    try {
      setUploadProgress(`Uploading ${form.photos.length} photos…`);
      const photoAssets: { asset_id: string; kind: "PHOTO"; sort_order: number }[] = [];
      for (let i = 0; i < form.photos.length; i++) {
        const { asset_id } = await uploadListingPhoto(form.photos[i], token);
        photoAssets.push({ asset_id, kind: "PHOTO", sort_order: i });
      }

      setUploadProgress("Uploading walkthrough video…");
      const { asset_id: videoId } = await uploadListingWalkthrough(
        form.walkthrough!,
        token,
      );

      setUploadProgress("Submitting listing…");
      await createHostListing(
        {
          title: form.title.trim(),
          listing_type: form.listingType,
          city: form.city.trim(),
          address: form.address.trim(),
          description: form.description.trim(),
          checkin_time: form.checkinTime,
          checkout_time: form.checkoutTime,
          instant_booking: false,
          rules: {
            max_guests: form.maxGuests,
            pets_policy: form.petsPolicy,
            smoking_policy: form.smokingPolicy,
            quiet_hours: form.quietHours,
            couples_welcome: form.couplesWelcome,
            cancellation_policy: form.cancellationPolicy,
            amenities: form.amenities,
          },
          rate_plan: {
            currency: "MAD",
            base_price: Number(form.basePrice),
            weekend_price: form.weekendPrice
              ? Number(form.weekendPrice)
              : undefined,
            cleaning_fee: Number(form.cleaningFee) || 0,
          },
          check_in_contact: {
            full_name: form.contactName.trim(),
            phone: form.contactPhone.trim(),
            role: form.contactRole,
          },
          media: [
            ...photoAssets,
            {
              asset_id: videoId,
              kind: "WALKTHROUGH",
              sort_order: photoAssets.length,
            },
          ],
        },
        token,
      );

      setSubmitted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("host.failedSubmit"));
    } finally {
      setSubmitting(false);
      setUploadProgress(null);
    }
  };

  const stepsSidebar = (
    <>
      <Link
        href={localePath("/host/dashboard")}
        className="flex items-center gap-2.5 mb-6 lg:mb-10 cursor-pointer hover:opacity-90"
      >
        <div className="relative w-9 h-9 rounded-lg overflow-hidden shrink-0">
          <Image
            src={NEXA_STAYS_LOGO_SRC}
            alt="Nexa Stays"
            fill
            sizes="36px"
            className="object-cover"
          />
        </div>
        <span className="font-display text-xl font-bold text-white">
          {t("hostListing.wizardTitle")}
        </span>
      </Link>
      <div className="mb-6 lg:mb-8">
        <div className="text-xs font-bold uppercase tracking-wider text-white/40 mb-3">
          {t("hostListing.progress")}
        </div>
        <div className="h-1 bg-white/15 rounded-sm">
          <div
            className="h-full rounded-sm bg-gradient-to-r from-nexa-primary to-nexa-primary-light transition-all duration-400"
            style={{ width: `${progressWidths[step] ?? 0}%` }}
          />
        </div>
      </div>
      <nav className="flex flex-col gap-1.5">
        {stepLabels.map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => {
              if (i + 1 <= step) {
                setStep(i + 1);
                setMobileStepsOpen(false);
              }
            }}
            className={cn(
              "flex items-center gap-3 py-2.5 px-3.5 rounded-xl transition-colors text-left min-h-[44px]",
              step === i + 1 ? "bg-nexa-primary/20" : "hover:bg-white/5",
              i + 1 > step && "opacity-50 cursor-not-allowed",
            )}
          >
            <div
              className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-[0.78rem] font-bold border shrink-0",
                step > i + 1
                  ? "border-nexa-primary bg-nexa-primary text-white"
                  : step === i + 1
                    ? "border-nexa-primary text-nexa-primary bg-nexa-primary/15"
                    : "border-white/20 text-white/40",
              )}
            >
              {step > i + 1 ? "✓" : i + 1}
            </div>
            <span
              className={cn(
                "text-sm",
                step === i + 1 ? "text-white font-semibold" : "text-white/50",
                step > i + 1 && "text-white/70",
              )}
            >
              {label}
            </span>
          </button>
        ))}
      </nav>
      <div className="mt-6 bg-white/5 rounded-xl p-4 text-xs text-white/50">
        <strong className="text-white/80 block mb-1">🔒 {t("hostListing.privacyTitle")}</strong>
        {t("hostListing.privacyNote")}
      </div>
    </>
  );

  if (hostReady === null) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <AppLoader />
      </div>
    );
  }

  if (hostReady === false) {
    return (
      <div className="max-w-lg mx-auto py-16 px-4 text-center">
        <h2 className="text-2xl font-semibold text-nexa-ink mb-2">
          {t("hostListing.notApprovedTitle")}
        </h2>
        <p className="text-nexa-ink-3 mb-6">{t("hostListing.notApprovedDesc")}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild>
            <Link href={localePath("/host")}>{t("hostDashboard.becomeHost")}</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={localePath("/host/dashboard")}>{t("hostDashboard.title")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto py-16 px-4 text-center">
        <div className="inline-flex w-16 h-16 rounded-full bg-green-100 items-center justify-center mb-6">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-semibold text-nexa-ink mb-2">
          {t("hostListing.submittedTitle")}
        </h2>
        <p className="text-nexa-ink-3 mb-6">{t("hostListing.submittedDesc")}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild>
            <Link href={localePath("/host/dashboard")}>{t("hostListing.goToDashboard")}</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={localePath("/")}>{t("hostDashboard.backToHome")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <aside className="hidden lg:block bg-gradient-to-br from-nexa-ink to-nexa-ink-2 p-10 overflow-y-auto sticky top-[72px] h-[calc(100vh-72px)]">
        {stepsSidebar}
      </aside>

      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <button
          type="button"
          onClick={() => setMobileStepsOpen(true)}
          className="flex items-center gap-2 px-5 py-3 min-h-[48px] rounded-full bg-nexa-ink text-white shadow-lg font-semibold text-sm"
        >
          <Menu className="h-4 w-4" />
          {t("hostListing.stepOf").replace("{step}", String(step)).replace("{total}", String(totalSteps))}
        </button>
      </div>

      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden transition-opacity duration-300",
          mobileStepsOpen ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        aria-hidden={!mobileStepsOpen}
      >
        <div
          className="absolute inset-0 bg-nexa-ink/60"
          onClick={() => setMobileStepsOpen(false)}
        />
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 max-h-[85vh] bg-gradient-to-br from-nexa-ink to-nexa-ink-2 rounded-t-2xl p-6 overflow-y-auto transition-transform duration-300",
            mobileStepsOpen ? "translate-y-0" : "translate-y-full",
          )}
        >
          {stepsSidebar}
        </div>
      </div>

      <div className="bg-nexa-bg py-8 sm:py-10 lg:py-12 px-4 sm:px-6 md:px-10 lg:px-20 pb-24 lg:pb-16">
        <div className="max-w-[640px]">
          <span className="text-xs font-semibold tracking-[0.12em] uppercase text-nexa-primary">
            {t("hostListing.stepOf").replace("{step}", String(step)).replace("{total}", String(totalSteps))}
          </span>

          {error && (
            <div className="mt-4 rounded-xl bg-red-50 border border-red-200 p-4 text-red-800 text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Property Type */}
          {step === 1 && (
            <div className="mt-4">
              <h2 className="text-2xl font-semibold mb-2">{t("hostListing.step1Title")}</h2>
              <p className="text-nexa-ink-3 mb-8">{t("hostListing.step1Desc")}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {LISTING_TYPES.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => patch({ listingType: type.id })}
                    className={cn(
                      "border-2 rounded-[22px] p-6 text-center transition-all",
                      form.listingType === type.id
                        ? "border-nexa-primary bg-nexa-primary-soft"
                        : "border-nexa-line hover:border-nexa-primary",
                    )}
                  >
                    <div className="text-4xl mb-2">{type.emoji}</div>
                    <h3 className="font-semibold">{type.label}</h3>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Location & Basics */}
          {step === 2 && (
            <div className="mt-4 space-y-5">
              <h2 className="text-2xl font-semibold mb-2">{t("hostListing.step2Title")}</h2>
              <p className="text-nexa-ink-3 mb-4">{t("hostListing.step2Desc")}</p>
              <div>
                <label className="block text-sm font-semibold mb-2">{t("hostListing.propertyTitle")} *</label>
                <Input
                  value={form.title}
                  onChange={(e) => patch({ title: e.target.value })}
                  placeholder="Cozy riad in the medina"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">{t("hostListing.city")} *</label>
                <Input
                  value={form.city}
                  onChange={(e) => patch({ city: e.target.value })}
                  placeholder="Marrakech"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">{t("hostListing.address")} *</label>
                <Input
                  value={form.address}
                  onChange={(e) => patch({ address: e.target.value })}
                  placeholder={t("host.streetAddress")}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">{t("hostListing.description")} *</label>
                <textarea
                  className="w-full min-h-[120px] rounded-xl border border-nexa-line px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-nexa-primary/30"
                  value={form.description}
                  onChange={(e) => patch({ description: e.target.value })}
                  placeholder={t("host.describeProperty")}
                />
              </div>
            </div>
          )}

          {/* Step 3: House Rules */}
          {step === 3 && (
            <div className="mt-4 space-y-5">
              <h2 className="text-2xl font-semibold mb-2">{t("hostListing.step3Title")}</h2>
              <p className="text-nexa-ink-3 mb-4">{t("hostListing.step3Desc")}</p>
              <div>
                <label className="block text-sm font-semibold mb-2">{t("hostListing.maxGuests")}</label>
                <Input
                  type="number"
                  min={1}
                  value={form.maxGuests}
                  onChange={(e) => patch({ maxGuests: Number(e.target.value) || 1 })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">{t("hostListing.petsPolicy")}</label>
                <select
                  className="w-full rounded-xl border border-nexa-line px-4 py-3 text-sm"
                  value={form.petsPolicy}
                  onChange={(e) =>
                    patch({ petsPolicy: e.target.value as ListingWizardForm["petsPolicy"] })
                  }
                >
                  <option value="NO">{t("hostListing.petsNo")}</option>
                  <option value="DOGS_CATS">{t("hostListing.petsDogsCats")}</option>
                  <option value="ALLOWED">{t("hostListing.petsAllowed")}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">{t("hostListing.smokingPolicy")}</label>
                <select
                  className="w-full rounded-xl border border-nexa-line px-4 py-3 text-sm"
                  value={form.smokingPolicy}
                  onChange={(e) =>
                    patch({
                      smokingPolicy: e.target.value as ListingWizardForm["smokingPolicy"],
                    })
                  }
                >
                  <option value="NOT_ALLOWED">{t("hostListing.smokingNotAllowed")}</option>
                  <option value="ALLOWED">{t("hostListing.smokingAllowed")}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">{t("hostListing.cancellation")}</label>
                <select
                  className="w-full rounded-xl border border-nexa-line px-4 py-3 text-sm"
                  value={form.cancellationPolicy}
                  onChange={(e) =>
                    patch({
                      cancellationPolicy: e.target.value as ListingWizardForm["cancellationPolicy"],
                    })
                  }
                >
                  <option value="FLEXIBLE">{t("hostListing.cancelFlexible")}</option>
                  <option value="MODERATE">{t("hostListing.cancelModerate")}</option>
                  <option value="STRICT">{t("hostListing.cancelStrict")}</option>
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.quietHours}
                  onChange={(e) => patch({ quietHours: e.target.checked })}
                  className="rounded border-nexa-line"
                />
                {t("hostListing.quietHours")}
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.couplesWelcome}
                  onChange={(e) => patch({ couplesWelcome: e.target.checked })}
                  className="rounded border-nexa-line"
                />
                {t("hostListing.couplesWelcome")}
              </label>
            </div>
          )}

          {/* Step 4: Amenities */}
          {step === 4 && (
            <div className="mt-4">
              <h2 className="text-2xl font-semibold mb-2">{t("hostListing.step4Title")}</h2>
              <p className="text-nexa-ink-3 mb-6">{t("hostListing.step4Desc")}</p>
              <div className="flex flex-wrap gap-2">
                {AMENITY_OPTIONS.map((a) => {
                  const selected = form.amenities.includes(a.tag);
                  return (
                    <button
                      key={a.tag}
                      type="button"
                      onClick={() => toggleAmenity(a.tag)}
                      className={cn(
                        "px-3 py-2 rounded-full border text-sm transition-colors",
                        selected
                          ? "border-nexa-primary bg-nexa-primary-soft text-nexa-primary font-medium"
                          : "border-nexa-line hover:border-nexa-primary/50",
                      )}
                    >
                      {a.emoji} {a.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 5: Pricing */}
          {step === 5 && (
            <div className="mt-4 space-y-5">
              <h2 className="text-2xl font-semibold mb-2">{t("hostListing.step5Title")}</h2>
              <p className="text-nexa-ink-3 mb-4">{t("hostListing.step5Desc")}</p>
              <div>
                <label className="block text-sm font-semibold mb-2">{t("hostListing.nightlyRate")} (MAD) *</label>
                <Input
                  type="number"
                  min={0}
                  value={form.basePrice}
                  onChange={(e) => patch({ basePrice: e.target.value })}
                  placeholder="500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">{t("hostListing.weekendRate")} (MAD)</label>
                <Input
                  type="number"
                  min={0}
                  value={form.weekendPrice}
                  onChange={(e) => patch({ weekendPrice: e.target.value })}
                  placeholder={t("common.optional")}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">{t("hostListing.cleaningFee")} (MAD)</label>
                <Input
                  type="number"
                  min={0}
                  value={form.cleaningFee}
                  onChange={(e) => patch({ cleaningFee: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* Step 6: Check-in Contact */}
          {step === 6 && (
            <div className="mt-4 space-y-5">
              <h2 className="text-2xl font-semibold mb-2">{t("hostListing.step6Title")}</h2>
              <p className="text-nexa-ink-3 mb-4">{t("hostListing.step6Desc")}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold mb-2">{t("hostListing.checkInTime")}</label>
                  <Input
                    type="time"
                    value={form.checkinTime}
                    onChange={(e) => patch({ checkinTime: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">{t("hostListing.checkOutTime")}</label>
                  <Input
                    type="time"
                    value={form.checkoutTime}
                    onChange={(e) => patch({ checkoutTime: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">{t("host.contactName")}</label>
                <Input
                  value={form.contactName}
                  onChange={(e) => patch({ contactName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">{t("hostListing.contactPhone")} *</label>
                <Input
                  type="tel"
                  value={form.contactPhone}
                  onChange={(e) => patch({ contactPhone: e.target.value })}
                  placeholder="+212 6 XX XX XX XX"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">{t("hostListing.contactRole")}</label>
                <select
                  className="w-full rounded-xl border border-nexa-line px-4 py-3 text-sm"
                  value={form.contactRole}
                  onChange={(e) =>
                    patch({ contactRole: e.target.value as ListingWizardForm["contactRole"] })
                  }
                >
                  <option value="OWNER">{t("hostListing.roleOwner")}</option>
                  <option value="CO_HOST">{t("hostListing.roleCoHost")}</option>
                  <option value="AGENT">{t("hostListing.roleAgent")}</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 7: Photos */}
          {step === 7 && (
            <div className="mt-4">
              <h2 className="text-2xl font-semibold mb-2">{t("hostListing.step7Title")}</h2>
              <p className="text-nexa-ink-3 mb-4">
                {t("hostListing.step7Desc").replace("{min}", String(MIN_LISTING_PHOTOS))}
              </p>
              <p className="text-sm font-medium mb-4">
                {form.photos.length} / {MIN_LISTING_PHOTOS}{" "}
                {form.photos.length >= MIN_LISTING_PHOTOS ? "✓" : ""}
              </p>
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-nexa-line rounded-xl p-8 cursor-pointer hover:border-nexa-primary hover:bg-nexa-primary-soft/30 transition-colors mb-6">
                <Upload className="h-8 w-8 text-nexa-ink-4 mb-2" />
                <span className="text-sm font-medium">{t("hostListing.uploadPhotos")}</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handlePhotos(e.target.files)}
                />
              </label>
              {form.photoPreviews.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {form.photoPreviews.map((src, i) => (
                    <div key={src} className="relative aspect-square rounded-lg overflow-hidden border border-nexa-line">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center"
                        aria-label="Remove photo"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 8: Walkthrough & Submit */}
          {step === 8 && (
            <div className="mt-4">
              <h2 className="text-2xl font-semibold mb-2">{t("hostListing.step8Title")}</h2>
              <p className="text-nexa-ink-3 mb-6">{t("hostListing.step8Desc")}</p>
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-nexa-line rounded-xl p-8 cursor-pointer hover:border-nexa-primary hover:bg-nexa-primary-soft/30 transition-colors mb-8">
                <Upload className="h-8 w-8 text-nexa-ink-4 mb-2" />
                <span className="text-sm font-medium">
                  {form.walkthrough
                    ? t("host.walkthroughUploaded")
                    : t("hostListing.uploadVideo")}
                </span>
                <input
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => handleWalkthrough(e.target.files?.[0] ?? null)}
                />
              </label>

              <div className="rounded-xl border border-nexa-line bg-white p-5 space-y-2 text-sm">
                <h3 className="font-semibold text-nexa-ink mb-3">{t("hostListing.reviewTitle")}</h3>
                <p><strong>{form.title || "—"}</strong> · {form.city}</p>
                <p>{form.listingType} · {form.maxGuests} guests · {form.basePrice || "—"} MAD/night</p>
                <p>{form.photos.length} photos · {form.amenities.length} amenities</p>
              </div>

              {uploadProgress && (
                <p className="mt-4 text-sm text-nexa-ink-3">{uploadProgress}</p>
              )}
            </div>
          )}

          <div className="flex gap-3 mt-10">
            {step > 1 && (
              <Button type="button" variant="ghost" onClick={goBack} disabled={submitting}>
                ← {t("common.back")}
              </Button>
            )}
            {step < totalSteps ? (
              <Button type="button" onClick={goNext}>
                {t("common.continue")} →
              </Button>
            ) : (
              <Button type="button" onClick={handleSubmit} disabled={submitting}>
                {submitting ? t("host.submitting") : t("host.submitForReview")}
              </Button>
            )}
          </div>

          <div className="mt-6">
            <Button variant="link" className="text-nexa-ink-4 px-0" asChild>
              <Link href={localePath("/host/dashboard")}>{t("hostListing.backToDashboard")}</Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function NewListingPage() {
  return (
    <>
      <NavBar />
      <main className="pt-[72px] min-h-screen grid grid-cols-1 lg:grid-cols-[340px_1fr]">
        <ProtectedRoute>
          <ListingWizardContent />
        </ProtectedRoute>
      </main>
    </>
  );
}
