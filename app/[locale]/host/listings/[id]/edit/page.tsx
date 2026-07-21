"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { NavBar } from "@/components/navbar/NavBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NexaSelect } from "@/components/ui/NexaSelect";
import { ErrorAlert } from "@/components/ui/Alert";
import { cn } from "@/lib/utils";
import { formatUserError } from "@/lib/errors";
import { showSaveToast } from "@/lib/save-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { getHostListingById, updateHostListing } from "@/lib/stays-api";
import type { HostListingDetail, UpdateHostListingBody } from "@/lib/stays-types";
import { AMENITY_OPTIONS, normalizeAmenities } from "@/lib/host-listing-constants";
import { AppLoader } from "@/components/AppLoader";
import { HostLocationMapPicker } from "@/components/host/listing-wizard/HostLocationMapPicker";
import { ArrowLeft, Save } from "lucide-react";

interface EditFormState {
  title: string;
  city: string;
  neighborhood: string;
  address: string;
  geoLat: number | null;
  geoLng: number | null;
  description: string;
  basePrice: string;
  weekendPrice: string;
  cleaningFee: string;
  checkinTime: string;
  checkoutTime: string;
  maxGuests: number;
  petsPolicy: "ALLOWED" | "DOGS_CATS" | "NO";
  smokingPolicy: "ALLOWED" | "NOT_ALLOWED";
  cancellationPolicy: "FLEXIBLE" | "MODERATE" | "STRICT";
  amenities: string[];
  contactName: string;
  contactPhone: string;
  contactRole: "OWNER" | "CO_HOST" | "AGENT";
  accessInstructions: string;
}

function normalizeTime(value: string): string {
  const trimmed = (value || "").trim();
  const match = trimmed.match(/^(\d{2}):(\d{2})(?::\d{2})?$/);
  if (!match) return trimmed;
  return `${match[1]}:${match[2]}`;
}

function listingToForm(
  l: HostListingDetail,
  hostDefaults?: { name?: string; phone?: string },
): EditFormState {
  const rules = l.rules ?? {};
  const contact = l.check_in_contact ?? null;
  const contactName =
    contact?.full_name?.trim() || hostDefaults?.name?.trim() || "";
  const contactPhone =
    contact?.phone?.trim() || hostDefaults?.phone?.trim() || "";
  return {
    title: l.title ?? "",
    city: l.city ?? "",
    neighborhood: l.neighborhood ?? "",
    address: l.address ?? "",
    geoLat: l.geo_lat != null ? Number(l.geo_lat) : null,
    geoLng: l.geo_lng != null ? Number(l.geo_lng) : null,
    description: l.description ?? "",
    basePrice: l.rate_plan?.base_price != null ? String(l.rate_plan.base_price) : "",
    weekendPrice:
      l.rate_plan?.weekend_price != null ? String(l.rate_plan.weekend_price) : "",
    cleaningFee:
      l.rate_plan?.cleaning_fee != null ? String(l.rate_plan.cleaning_fee) : "0",
    checkinTime: normalizeTime(l.checkin_time ?? "14:00"),
    checkoutTime: normalizeTime(l.checkout_time ?? "11:00"),
    maxGuests: rules.max_guests ?? 2,
    petsPolicy: (rules.pets_policy as EditFormState["petsPolicy"]) ?? "NO",
    smokingPolicy:
      (rules.smoking_policy as EditFormState["smokingPolicy"]) ?? "NOT_ALLOWED",
    cancellationPolicy:
      (rules.cancellation_policy as EditFormState["cancellationPolicy"]) ?? "MODERATE",
    amenities: normalizeAmenities(rules.amenities),
    contactName,
    contactPhone,
    contactRole: (contact?.role as EditFormState["contactRole"]) ?? "OWNER",
    accessInstructions: contact?.access_instructions ?? "",
  };
}

function HostListingEditContent() {
  const params = useParams();
  const router = useRouter();
  const listingId = typeof params.id === "string" ? params.id : "";
  const { token, user } = useAuth();
  const { t, localePath } = useLanguage();

  const [listing, setListing] = useState<HostListingDetail | null>(null);
  const [form, setForm] = useState<EditFormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const feedbackRef = React.useRef<HTMLDivElement | null>(null);

  const patch = useCallback(
    (partial: Partial<EditFormState>) =>
      setForm((prev) => (prev ? { ...prev, ...partial } : prev)),
    [],
  );

  useEffect(() => {
    if (!token || !listingId) return;
    setLoading(true);
    setError(null);
    getHostListingById(listingId, token)
      .then((data) => {
        setListing(data);
        setForm(
          listingToForm(data, {
            name: user?.full_name,
            phone: user?.phone_number,
          }),
        );
      })
      .catch((e) =>
        setError(formatUserError(e) || t("hostListingEdit.failedLoad")),
      )
      .finally(() => setLoading(false));
  }, [token, listingId, t, user?.full_name, user?.phone_number]);

  const showFeedback = (message: string) => {
    setError(message);
    requestAnimationFrame(() => {
      feedbackRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };

  const toggleAmenity = (tag: string) => {
    if (!form) return;
    const amenities = form.amenities.includes(tag)
      ? form.amenities.filter((a) => a !== tag)
      : [...form.amenities, tag];
    patch({ amenities });
  };

  const locationLocked = ["LIVE", "APPROVED", "PAUSED"].includes(
    listing?.status ?? "",
  );

  const validate = (): string | null => {
    if (!form) return t("hostListingEdit.failedLoad");
    if (!form.title.trim()) return t("hostListingEdit.titleRequired");
    if (!locationLocked) {
      if (!form.city.trim()) return t("hostListingEdit.cityRequired");
      if (!form.address.trim()) return t("hostListingEdit.addressRequired");
      if (form.geoLat == null || form.geoLng == null)
        return t("hostListingEdit.mapPinRequired");
    }
    if (form.description.trim().length < 20)
      return t("hostListingEdit.descriptionMin");
    const price = Number(form.basePrice);
    if (!Number.isFinite(price) || price <= 0)
      return t("hostListingEdit.priceRequired");
    if (form.maxGuests < 1) return t("hostListingEdit.guestsRequired");
    if (!form.contactName.trim()) return t("hostListingEdit.contactNameRequired");
    if (!form.contactPhone.trim()) return t("hostListingEdit.contactPhoneRequired");
    return null;
  };

  const buildPayload = (): UpdateHostListingBody => {
    if (!form) return {};
    const payload: UpdateHostListingBody = {
      title: form.title.trim(),
      description: form.description.trim(),
      checkin_time: normalizeTime(form.checkinTime),
      checkout_time: normalizeTime(form.checkoutTime),
      rate_plan: {
        currency: listing?.rate_plan?.currency ?? "MAD",
        base_price: Number(form.basePrice),
        ...(form.weekendPrice.trim()
          ? { weekend_price: Number(form.weekendPrice) }
          : {}),
        cleaning_fee: Number(form.cleaningFee) || 0,
      },
      rules: {
        max_guests: form.maxGuests,
        pets_policy: form.petsPolicy,
        smoking_policy: form.smokingPolicy,
        cancellation_policy: form.cancellationPolicy,
        amenities: form.amenities,
      },
      check_in_contact: {
        full_name: form.contactName.trim(),
        phone: form.contactPhone.trim(),
        role: form.contactRole,
        access_instructions: form.accessInstructions.trim() || undefined,
      },
    };
    if (!locationLocked) {
      payload.city = form.city.trim();
      payload.neighborhood = form.neighborhood.trim() || undefined;
      payload.address = form.address.trim();
      payload.geo_lat = form.geoLat ?? undefined;
      payload.geo_lng = form.geoLng ?? undefined;
    }
    return payload;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) {
      showFeedback(err);
      return;
    }
    if (!token || !listingId) return;

    setSaving(true);
    setError(null);
    try {
      await updateHostListing(listingId, buildPayload(), token);
      showSaveToast(t("common.changesSaved"));
      router.push(localePath("/host/dashboard?saved=1"));
    } catch (e) {
      showFeedback(formatUserError(e) || t("hostListingEdit.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <AppLoader />
      </div>
    );
  }

  if (!form || !listing) {
    return (
      <div className="max-w-lg mx-auto py-16 px-4 text-center">
        <p className="text-nexa-ink-3 mb-6">{error ?? t("hostListingEdit.failedLoad")}</p>
        <Button asChild>
          <Link href={localePath("/host/dashboard")}>{t("hostListingEdit.backToDashboard")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
          <Link href={localePath("/host/dashboard")} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            {t("hostListingEdit.backToDashboard")}
          </Link>
        </Button>
        <h1 className="text-2xl sm:text-3xl font-bold text-nexa-ink">
          {t("hostListingEdit.title")}
        </h1>
        <p className="text-nexa-ink-3 mt-1">{listing.title}</p>
        <p className="text-xs text-nexa-ink-4 mt-1">
          {t("hostListingEdit.status")}:{" "}
          {listing.status === "REJECTED" ? "Needs Changes" : listing.status}
          {listing.listing_type ? ` · ${listing.listing_type}` : ""}
        </p>
        {["LIVE", "APPROVED", "PAUSED"].includes(listing.status) && (
          <p className="mt-2 text-sm text-amber-800 rounded-lg bg-amber-50 px-3 py-2">
            Location cannot be changed on live listings yet. Description, price,
            amenities, and house rules update immediately. Property type cannot be changed.
          </p>
        )}
      </div>

      {error && (
        <ErrorAlert
          error={error}
          className="mb-6"
          onDismiss={() => setError(null)}
        />
      )}

      <div className="space-y-8">
        <section className="rounded-2xl border border-nexa-line bg-white p-6">
          <h2 className="text-lg font-semibold text-nexa-ink mb-4">
            {t("hostListingEdit.sectionBasics")}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-nexa-ink mb-1.5">
                {t("hostListingEdit.fieldTitle")}
              </label>
              <Input value={form.title} onChange={(e) => patch({ title: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-nexa-ink mb-1.5">
                {t("hostListingEdit.fieldCity")}
              </label>
              <Input
                value={form.city}
                disabled={["LIVE", "APPROVED", "PAUSED"].includes(listing.status)}
                onChange={(e) => patch({ city: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-nexa-ink mb-1.5">
                {t("hostListingEdit.fieldNeighborhood")}
              </label>
              <Input
                value={form.neighborhood}
                disabled={["LIVE", "APPROVED", "PAUSED"].includes(listing.status)}
                onChange={(e) => patch({ neighborhood: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-nexa-ink mb-1.5">
                {t("hostListingEdit.fieldAddress")}
              </label>
              <Input
                value={form.address}
                disabled={["LIVE", "APPROVED", "PAUSED"].includes(listing.status)}
                onChange={(e) => patch({ address: e.target.value })}
              />
            </div>
            {!["LIVE", "APPROVED", "PAUSED"].includes(listing.status) ? (
              <HostLocationMapPicker
                city={form.city}
                neighborhood={form.neighborhood}
                address={form.address}
                latitude={form.geoLat}
                longitude={form.geoLng}
                onCoordinatesChange={({ lat, lng }) =>
                  patch({ geoLat: lat, geoLng: lng })
                }
              />
            ) : (
              <p className="text-sm text-nexa-ink-4">
                Map pin is locked while the listing is live.
              </p>
            )}
            <div>
              <label className="block text-sm font-medium text-nexa-ink mb-1.5">
                {t("hostListingEdit.fieldDescription")}
              </label>
              <textarea
                className="w-full min-h-[120px] rounded-xl border border-nexa-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nexa-primary/30"
                value={form.description}
                onChange={(e) => patch({ description: e.target.value })}
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-nexa-line bg-white p-6">
          <h2 className="text-lg font-semibold text-nexa-ink mb-4">
            {t("hostListingEdit.sectionPricing")}
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-nexa-ink mb-1.5">
                {t("hostListingEdit.fieldBasePrice")}
              </label>
              <Input
                type="number"
                min={1}
                value={form.basePrice}
                onChange={(e) => patch({ basePrice: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-nexa-ink mb-1.5">
                {t("hostListingEdit.fieldWeekendPrice")}
              </label>
              <Input
                type="number"
                min={0}
                value={form.weekendPrice}
                onChange={(e) => patch({ weekendPrice: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-nexa-ink mb-1.5">
                {t("hostListingEdit.fieldCleaningFee")}
              </label>
              <Input
                type="number"
                min={0}
                value={form.cleaningFee}
                onChange={(e) => patch({ cleaningFee: e.target.value })}
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-nexa-line bg-white p-6">
          <h2 className="text-lg font-semibold text-nexa-ink mb-4">
            {t("hostListingEdit.sectionRules")}
          </h2>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-nexa-ink mb-1.5">
                {t("hostListingEdit.fieldCheckin")}
              </label>
              <Input
                type="time"
                value={form.checkinTime}
                onChange={(e) => patch({ checkinTime: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-nexa-ink mb-1.5">
                {t("hostListingEdit.fieldCheckout")}
              </label>
              <Input
                type="time"
                value={form.checkoutTime}
                onChange={(e) => patch({ checkoutTime: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-nexa-ink mb-1.5">
                {t("hostListingEdit.fieldMaxGuests")}
              </label>
              <Input
                type="number"
                min={1}
                value={form.maxGuests}
                onChange={(e) => patch({ maxGuests: Number(e.target.value) || 1 })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-nexa-ink mb-1.5">
                {t("hostListingEdit.fieldPets")}
              </label>
              <NexaSelect
                variant="field"
                value={form.petsPolicy}
                onChange={(v) =>
                  patch({ petsPolicy: v as EditFormState["petsPolicy"] })
                }
                aria-label={t("hostListingEdit.fieldPets")}
                options={[
                  { value: "NO", label: t("hostListingEdit.petsNo") },
                  { value: "DOGS_CATS", label: t("hostListingEdit.petsDogsCats") },
                  { value: "ALLOWED", label: t("hostListingEdit.petsAllowed") },
                ]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-nexa-ink mb-1.5">
                {t("hostListingEdit.fieldSmoking")}
              </label>
              <NexaSelect
                variant="field"
                value={form.smokingPolicy}
                onChange={(v) =>
                  patch({ smokingPolicy: v as EditFormState["smokingPolicy"] })
                }
                aria-label={t("hostListingEdit.fieldSmoking")}
                options={[
                  {
                    value: "NOT_ALLOWED",
                    label: t("hostListingEdit.smokingNotAllowed"),
                  },
                  {
                    value: "ALLOWED",
                    label: t("hostListingEdit.smokingAllowed"),
                  },
                ]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-nexa-ink mb-1.5">
                {t("hostListingEdit.fieldCancellation")}
              </label>
              <NexaSelect
                variant="field"
                value={form.cancellationPolicy}
                onChange={(v) =>
                  patch({
                    cancellationPolicy: v as EditFormState["cancellationPolicy"],
                  })
                }
                aria-label={t("hostListingEdit.fieldCancellation")}
                options={[
                  { value: "FLEXIBLE", label: t("hostListingEdit.cancelFlexible") },
                  { value: "MODERATE", label: t("hostListingEdit.cancelModerate") },
                  { value: "STRICT", label: t("hostListingEdit.cancelStrict") },
                ]}
              />
            </div>
          </div>
          <p className="text-sm font-medium text-nexa-ink mb-2">
            {t("hostListingEdit.fieldAmenities")}
          </p>
          <div className="flex flex-wrap gap-2">
            {AMENITY_OPTIONS.map((a) => (
              <button
                key={a.tag}
                type="button"
                onClick={() => toggleAmenity(a.tag)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm border transition-colors",
                  form.amenities.includes(a.tag)
                    ? "border-nexa-primary bg-nexa-primary-soft text-nexa-primary"
                    : "border-nexa-line text-nexa-ink-3 hover:border-nexa-primary/40",
                )}
              >
                {a.emoji} {a.label}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-nexa-line bg-white p-6">
          <h2 className="text-lg font-semibold text-nexa-ink mb-4">
            {t("hostListingEdit.sectionContact")}
          </h2>
          <p className="mb-4 text-sm text-nexa-ink-3">
            Prefills from your verified host profile. Change only if a co-host handles check-in.
          </p>
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-nexa-ink mb-1.5">
                  {t("hostListingEdit.fieldContactName")}
                </label>
                <Input
                  value={form.contactName}
                  onChange={(e) => patch({ contactName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-nexa-ink mb-1.5">
                  {t("hostListingEdit.fieldContactPhone")}
                </label>
                <Input
                  value={form.contactPhone}
                  onChange={(e) => patch({ contactPhone: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-nexa-ink mb-1.5">
                {t("hostListingEdit.fieldAccessInstructions")}
              </label>
              <textarea
                className="w-full min-h-[80px] rounded-xl border border-nexa-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nexa-primary/30"
                value={form.accessInstructions}
                onChange={(e) => patch({ accessInstructions: e.target.value })}
              />
            </div>
          </div>
        </section>

        <p className="text-xs text-nexa-ink-4">{t("hostListingEdit.mediaNote")}</p>

        <div ref={feedbackRef} className="space-y-3 pb-8">
          {error && <ErrorAlert error={error} onDismiss={() => setError(null)} />}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? t("hostListingEdit.saving") : t("hostListingEdit.save")}
            </Button>
            {(listing.status === "LIVE" || listing.status === "APPROVED") && (
              <Button variant="outline" asChild>
                <Link href={localePath(`/listings/${listing.id}`)}>
                  {t("hostDashboard.view")} →
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HostListingEditPage() {
  return (
    <>
      <NavBar />
      <main className="pt-[72px] min-h-screen bg-nexa-bg-1">
        <ProtectedRoute>
          <HostListingEditContent />
        </ProtectedRoute>
      </main>
    </>
  );
}
