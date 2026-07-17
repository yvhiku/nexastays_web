"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { NavBar } from "@/components/navbar/NavBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
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

function listingToForm(l: HostListingDetail): EditFormState {
  const rules = l.rules ?? {};
  const contact = l.check_in_contact ?? null;
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
    checkinTime: l.checkin_time ?? "14:00",
    checkoutTime: l.checkout_time ?? "11:00",
    maxGuests: rules.max_guests ?? 2,
    petsPolicy: (rules.pets_policy as EditFormState["petsPolicy"]) ?? "NO",
    smokingPolicy:
      (rules.smoking_policy as EditFormState["smokingPolicy"]) ?? "NOT_ALLOWED",
    cancellationPolicy:
      (rules.cancellation_policy as EditFormState["cancellationPolicy"]) ?? "MODERATE",
    amenities: normalizeAmenities(rules.amenities),
    contactName: contact?.full_name ?? "",
    contactPhone: contact?.phone ?? "",
    contactRole: (contact?.role as EditFormState["contactRole"]) ?? "OWNER",
    accessInstructions: contact?.access_instructions ?? "",
  };
}

function HostListingEditContent() {
  const params = useParams();
  const router = useRouter();
  const listingId = typeof params.id === "string" ? params.id : "";
  const { token } = useAuth();
  const { t, localePath } = useLanguage();

  const [listing, setListing] = useState<HostListingDetail | null>(null);
  const [form, setForm] = useState<EditFormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        setForm(listingToForm(data));
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : t("hostListingEdit.failedLoad")),
      )
      .finally(() => setLoading(false));
  }, [token, listingId, t]);

  const toggleAmenity = (tag: string) => {
    if (!form) return;
    const amenities = form.amenities.includes(tag)
      ? form.amenities.filter((a) => a !== tag)
      : [...form.amenities, tag];
    patch({ amenities });
  };

  const validate = (): string | null => {
    if (!form) return t("hostListingEdit.failedLoad");
    if (!form.title.trim()) return t("hostListingEdit.titleRequired");
    if (!form.city.trim()) return t("hostListingEdit.cityRequired");
    if (!form.address.trim()) return t("hostListingEdit.addressRequired");
    if (form.geoLat == null || form.geoLng == null)
      return t("hostListingEdit.mapPinRequired");
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
    return {
      title: form.title.trim(),
      city: form.city.trim(),
      neighborhood: form.neighborhood.trim() || undefined,
      address: form.address.trim(),
      geo_lat: form.geoLat ?? undefined,
      geo_lng: form.geoLng ?? undefined,
      description: form.description.trim(),
      checkin_time: form.checkinTime,
      checkout_time: form.checkoutTime,
      rate_plan: {
        currency: listing?.rate_plan?.currency ?? "MAD",
        base_price: Number(form.basePrice),
        weekend_price: form.weekendPrice ? Number(form.weekendPrice) : null,
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
  };

  const handleSave = async () => {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    if (!token || !listingId) return;

    setSaving(true);
    setError(null);
    try {
      await updateHostListing(listingId, buildPayload(), token);
      router.push(localePath("/host/dashboard"));
    } catch (e) {
      setError(e instanceof Error ? e.message : t("hostListingEdit.saveFailed"));
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
          {t("hostListingEdit.status")}: {listing.status}
        </p>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-red-800 text-sm mb-6">
          {error}
        </div>
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
              <Input value={form.city} onChange={(e) => patch({ city: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-nexa-ink mb-1.5">
                {t("hostListingEdit.fieldNeighborhood")}
              </label>
              <Input
                value={form.neighborhood}
                onChange={(e) => patch({ neighborhood: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-nexa-ink mb-1.5">
                {t("hostListingEdit.fieldAddress")}
              </label>
              <Input value={form.address} onChange={(e) => patch({ address: e.target.value })} />
            </div>
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
              <select
                className="w-full h-10 rounded-xl border border-nexa-line px-3 text-sm"
                value={form.petsPolicy}
                onChange={(e) =>
                  patch({ petsPolicy: e.target.value as EditFormState["petsPolicy"] })
                }
              >
                <option value="NO">{t("hostListingEdit.petsNo")}</option>
                <option value="DOGS_CATS">{t("hostListingEdit.petsDogsCats")}</option>
                <option value="ALLOWED">{t("hostListingEdit.petsAllowed")}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-nexa-ink mb-1.5">
                {t("hostListingEdit.fieldSmoking")}
              </label>
              <select
                className="w-full h-10 rounded-xl border border-nexa-line px-3 text-sm"
                value={form.smokingPolicy}
                onChange={(e) =>
                  patch({
                    smokingPolicy: e.target.value as EditFormState["smokingPolicy"],
                  })
                }
              >
                <option value="NOT_ALLOWED">{t("hostListingEdit.smokingNotAllowed")}</option>
                <option value="ALLOWED">{t("hostListingEdit.smokingAllowed")}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-nexa-ink mb-1.5">
                {t("hostListingEdit.fieldCancellation")}
              </label>
              <select
                className="w-full h-10 rounded-xl border border-nexa-line px-3 text-sm"
                value={form.cancellationPolicy}
                onChange={(e) =>
                  patch({
                    cancellationPolicy:
                      e.target.value as EditFormState["cancellationPolicy"],
                  })
                }
              >
                <option value="FLEXIBLE">{t("hostListingEdit.cancelFlexible")}</option>
                <option value="MODERATE">{t("hostListingEdit.cancelModerate")}</option>
                <option value="STRICT">{t("hostListingEdit.cancelStrict")}</option>
              </select>
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

        <div className="flex flex-col sm:flex-row gap-3 pb-8">
          <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
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
