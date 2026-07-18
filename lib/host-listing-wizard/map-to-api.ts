import type {
  CreateHostListingBody,
  HostListingDetail,
  ReplaceListingMediaBody,
  ReplaceListingUnitTypesBody,
  UpdateHostListingBody,
} from "@/lib/stays-types";
import { getListingMediaUrl } from "@/lib/stays-api";
import type {
  BookingModel,
  ListingType,
  ListingWizardFormState,
  MediaCategory,
  UnitKind,
} from "./form-types";
import { defaultWizardForm, newBedroom } from "./form-defaults";
import { defaultBookingModel, isMultiUnitFlow } from "./step-config";
import {
  computeCompletionFlags,
  computeCompletionPercentage,
  type CompletionInput,
} from "./completion";

export function buildCreateHostListingBody(
  form: ListingWizardFormState,
  media: CreateHostListingBody["media"],
): CreateHostListingBody {
  if (!form.listingType || !form.bookingModel) {
    throw new Error("Property type and booking model are required.");
  }

  const multi = isMultiUnitFlow(form.listingType, form.bookingModel);
  const unitPrices =
    multi && form.unitTypes.length > 0
      ? form.unitTypes.map((u) => Number(u.basePrice) || 0).filter((n) => n > 0)
      : [];
  const unitBase =
    unitPrices.length > 0
      ? Math.min(...unitPrices)
      : Number(form.basePrice) || 0;
  if (!Number.isFinite(unitBase) || unitBase <= 0) {
    throw new Error("A valid nightly price greater than zero is required.");
  }

  const body: CreateHostListingBody = {
    title: form.title.trim(),
    listing_type: form.listingType,
    booking_model: form.bookingModel,
    city: form.city.trim(),
    country: form.country.trim() || "MA",
    neighborhood: form.neighborhood.trim() || undefined,
    postal_code: form.postalCode.trim() || undefined,
    building_name: form.buildingName.trim() || undefined,
    landmark: form.landmark.trim() || undefined,
    address: form.address.trim(),
    geo_lat: form.geoLat ?? undefined,
    geo_lng: form.geoLng ?? undefined,
    description: form.description.trim(),
    checkin_time: form.checkinTime,
    checkout_time: form.checkoutTime,
    instant_booking: false,
    property_details: {
      ...form.propertyDetails,
      ...(form.guestHouse ? { guest_house: true } : {}),
      size_sqm: form.sizeSqm ? Number(form.sizeSqm) || form.sizeSqm : undefined,
      bedrooms: form.bedrooms.map((b) => ({
        label: b.label,
        bed_summary: b.bedSummary,
        sleeps: b.sleeps,
        private_bathroom: b.privateBathroom,
      })),
      checkin_method: form.checkinMethod,
      guest_language: form.guestLanguage,
    },
    safety_features: form.safety,
    policies: {
      children_allowed: form.childrenAllowed,
      visitors_allowed: form.visitorsAllowed,
      parties_allowed: form.partiesAllowed,
      min_stay: form.minStay,
      max_stay: form.maxStay,
      quiet_hours: form.quietHours,
    },
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
      base_price: unitBase,
      weekend_price: form.weekendPrice ? Number(form.weekendPrice) : undefined,
      cleaning_fee: Number(form.cleaningFee) || 0,
    },
    check_in_contact: {
      full_name: form.contactName.trim(),
      phone: form.contactPhone.trim(),
      role: form.contactRole,
      access_instructions: form.accessInstructions.trim() || undefined,
    },
    media,
  };

  if (multi && form.unitTypes.length > 0) {
    body.unit_types = form.unitTypes.map((u, i) => ({
      kind: u.kind,
      name: u.name.trim(),
      quantity: u.quantity,
      max_guests: u.maxGuests,
      bed_config: u.bedConfig ? [{ summary: u.bedConfig }] : [],
      size_sqm: u.sizeSqm ? Number(u.sizeSqm) : undefined,
      amenities: u.amenities,
      pricing_unit: u.pricingUnit,
      base_price: Number(u.basePrice),
      currency: "MAD",
      details: u.details,
      sort_order: i,
      is_active: u.isActive,
    }));
  }

  return body;
}

/** PATCH body for draft autosave (no media). */
export function buildUpdateHostListingBody(
  form: ListingWizardFormState,
): UpdateHostListingBody {
  const multi = isMultiUnitFlow(form.listingType, form.bookingModel);
  const unitPrices = form.unitTypes
    .map((u) => Number(u.basePrice) || 0)
    .filter((n) => n > 0);
  const basePrice = multi
    ? unitPrices.length
      ? Math.min(...unitPrices)
      : Number(form.basePrice) || 0
    : Number(form.basePrice) || 0;

  return {
    title: form.title.trim() || "Untitled listing",
    city: form.city.trim(),
    neighborhood: form.neighborhood.trim() || undefined,
    address: form.address.trim() || undefined,
    geo_lat: form.geoLat ?? undefined,
    geo_lng: form.geoLng ?? undefined,
    description: form.description.trim() || undefined,
    checkin_time: form.checkinTime,
    checkout_time: form.checkoutTime,
    property_details: {
      ...form.propertyDetails,
      ...(form.guestHouse ? { guest_house: true } : {}),
      size_sqm: form.sizeSqm ? Number(form.sizeSqm) || form.sizeSqm : undefined,
      bedrooms: form.bedrooms.map((b) => ({
        label: b.label,
        bed_summary: b.bedSummary,
        sleeps: b.sleeps,
        private_bathroom: b.privateBathroom,
      })),
      checkin_method: form.checkinMethod,
      guest_language: form.guestLanguage,
    },
    policies: {
      children_allowed: form.childrenAllowed,
      visitors_allowed: form.visitorsAllowed,
      parties_allowed: form.partiesAllowed,
      min_stay: form.minStay,
      max_stay: form.maxStay,
      quiet_hours: form.quietHours,
    },
    rules: {
      max_guests: form.maxGuests,
      pets_policy: form.petsPolicy,
      smoking_policy: form.smokingPolicy,
      cancellation_policy: form.cancellationPolicy,
      amenities: form.amenities,
    },
    rate_plan: {
      currency: "MAD",
      base_price: basePrice,
      ...(form.weekendPrice.trim()
        ? { weekend_price: Number(form.weekendPrice) }
        : { weekend_price: null }),
      cleaning_fee: Number(form.cleaningFee) || 0,
    },
    check_in_contact: {
      full_name: form.contactName.trim() || undefined,
      phone: form.contactPhone.trim() || undefined,
      role: form.contactRole,
      access_instructions: form.accessInstructions.trim() || undefined,
    },
  };
}

export function buildReplaceUnitTypesBody(
  form: ListingWizardFormState,
): ReplaceListingUnitTypesBody {
  return {
    unit_types: form.unitTypes.map((u, i) => ({
      kind: u.kind,
      name: u.name.trim() || `Room ${i + 1}`,
      quantity: u.quantity,
      max_guests: u.maxGuests,
      base_price: Number(u.basePrice) || 0,
      currency: "MAD",
      pricing_unit: u.pricingUnit,
      amenities: u.amenities,
      details: {
        ...u.details,
        bed_config: u.bedConfig,
        size_sqm: u.sizeSqm ? Number(u.sizeSqm) : undefined,
      },
      sort_order: i,
      is_active: u.isActive,
    })),
  };
}

export function buildReplaceMediaBody(
  form: ListingWizardFormState,
): ReplaceListingMediaBody {
  const media: ReplaceListingMediaBody["media"] = form.photos
    .filter((p) => p.assetId)
    .map((p, i) => ({
      asset_id: p.assetId!,
      kind: "PHOTO" as const,
      sort_order: i,
      category: p.category,
      is_cover: p.isCover,
    }));

  const walkId = form.walkthroughAssetId;
  if (walkId) {
    media.push({
      asset_id: walkId,
      kind: "WALKTHROUGH",
      sort_order: media.length,
    });
  }

  return { media };
}

export function hydrateWizardFromListing(
  listing: HostListingDetail,
  hostDefaults?: { name?: string; phone?: string },
): ListingWizardFormState {
  const base = defaultWizardForm();
  const listingType = (listing.listing_type as ListingType) || null;
  const bookingModel =
    (listing.booking_model as BookingModel) ||
    (listingType ? defaultBookingModel(listingType) : null);
  const details = listing.property_details ?? {};
  const guestHouse = Boolean(details.guest_house);
  const bedroomsRaw = Array.isArray(details.bedrooms) ? details.bedrooms : [];
  const bedrooms =
    bedroomsRaw.length > 0
      ? bedroomsRaw.map((raw, i) => {
          const b = raw as Record<string, unknown>;
          return {
            id: crypto.randomUUID(),
            label: String(b.label ?? `Bedroom ${i + 1}`),
            bedSummary: String(b.bed_summary ?? ""),
            sleeps: Number(b.sleeps) || 2,
            privateBathroom: Boolean(b.private_bathroom),
          };
        })
      : [newBedroom(1)];

  const photos = (listing.media ?? [])
    .filter((m) => m.kind === "PHOTO")
    .map((m, i) => ({
      id: m.asset_id,
      file: null as File | null,
      assetId: m.asset_id,
      preview: getListingMediaUrl(listing.id, m.asset_id),
      category: (m.category as MediaCategory) || "OTHER",
      isCover: Boolean(m.is_cover) || i === 0,
    }));

  const walk = (listing.media ?? []).find((m) => m.kind === "WALKTHROUGH");

  const multi = isMultiUnitFlow(listingType, bookingModel);
  const unitTypes = multi
    ? (listing.unit_types ?? []).map((u) => ({
        id: u.id,
        kind: u.kind as UnitKind,
        name: u.name,
        quantity: u.quantity,
        maxGuests: u.max_guests,
        bedConfig:
          Array.isArray(u.bed_config) && u.bed_config[0]
            ? String(
                (u.bed_config[0] as { summary?: string }).summary ??
                  JSON.stringify(u.bed_config[0]),
              )
            : "",
        sizeSqm: u.size_sqm != null ? String(u.size_sqm) : "",
        amenities: u.amenities ?? [],
        pricingUnit: (u.pricing_unit as "NIGHT" | "BED_NIGHT" | "ROOM_NIGHT") ||
          "ROOM_NIGHT",
        basePrice: String(u.base_price ?? ""),
        details: u.details ?? {},
        isActive: u.is_active !== false,
      }))
    : [];

  const policies = listing.policies ?? {};

  return {
    ...base,
    listingType,
    bookingModel,
    guestHouse,
    title: listing.title === "Untitled listing" ? "" : listing.title ?? "",
    country: listing.country ?? "MA",
    city: listing.city ?? "",
    neighborhood: listing.neighborhood ?? "",
    address: listing.address ?? "",
    buildingName: listing.building_name ?? "",
    postalCode: listing.postal_code ?? "",
    landmark: listing.landmark ?? "",
    geoLat: listing.geo_lat != null ? Number(listing.geo_lat) : null,
    geoLng: listing.geo_lng != null ? Number(listing.geo_lng) : null,
    description: listing.description ?? "",
    maxGuests: listing.rules?.max_guests ?? 2,
    bedrooms,
    sizeSqm: details.size_sqm != null ? String(details.size_sqm) : "",
    propertyDetails: { ...details },
    petsPolicy: (listing.rules?.pets_policy as ListingWizardFormState["petsPolicy"]) ?? "NO",
    smokingPolicy:
      (listing.rules?.smoking_policy as ListingWizardFormState["smokingPolicy"]) ??
      "NOT_ALLOWED",
    quietHours: Boolean(listing.rules?.quiet_hours ?? policies.quiet_hours ?? true),
    couplesWelcome: listing.rules?.couples_welcome !== false,
    childrenAllowed: policies.children_allowed !== false,
    visitorsAllowed: policies.visitors_allowed !== false,
    partiesAllowed: Boolean(policies.parties_allowed),
    minStay: Number(policies.min_stay) || 1,
    maxStay: Number(policies.max_stay) || 30,
    cancellationPolicy:
      (listing.rules?.cancellation_policy as ListingWizardFormState["cancellationPolicy"]) ??
      "MODERATE",
    amenities: listing.rules?.amenities ?? [],
    checkinTime: (listing.checkin_time ?? "14:00").slice(0, 5),
    checkoutTime: (listing.checkout_time ?? "11:00").slice(0, 5),
    checkinMethod:
      (details.checkin_method as ListingWizardFormState["checkinMethod"]) ??
      "IN_PERSON",
    contactName:
      listing.check_in_contact?.full_name?.trim() ||
      hostDefaults?.name?.trim() ||
      "",
    contactPhone:
      listing.check_in_contact?.phone?.trim() ||
      hostDefaults?.phone?.trim() ||
      "",
    contactRole:
      (listing.check_in_contact?.role as ListingWizardFormState["contactRole"]) ??
      "OWNER",
    accessInstructions: listing.check_in_contact?.access_instructions ?? "",
    guestLanguage: String(details.guest_language ?? "fr"),
    basePrice:
      listing.rate_plan?.base_price != null && listing.rate_plan.base_price > 0
        ? String(listing.rate_plan.base_price)
        : "",
    weekendPrice:
      listing.rate_plan?.weekend_price != null
        ? String(listing.rate_plan.weekend_price)
        : "",
    cleaningFee:
      listing.rate_plan?.cleaning_fee != null
        ? String(listing.rate_plan.cleaning_fee)
        : "0",
    unitTypes,
    photos,
    walkthrough: null,
    walkthroughPreview: walk
      ? getListingMediaUrl(listing.id, walk.asset_id)
      : null,
    walkthroughAssetId: walk?.asset_id ?? null,
  };
}

export function completionInputFromForm(
  form: ListingWizardFormState,
): CompletionInput {
  const multi = isMultiUnitFlow(form.listingType, form.bookingModel);
  const unitPrices = form.unitTypes
    .map((u) => Number(u.basePrice) || 0)
    .filter((n) => n > 0);
  const basePrice = multi
    ? unitPrices.length
      ? Math.min(...unitPrices)
      : 0
    : Number(form.basePrice) || 0;

  return {
    listing_type: form.listingType ?? "",
    booking_model: form.bookingModel,
    title: form.title,
    city: form.city,
    address: form.address,
    geo_lat: form.geoLat,
    geo_lng: form.geoLng,
    description: form.description,
    max_guests: form.maxGuests,
    base_price: basePrice,
    photo_count: form.photos.length,
    has_walkthrough: Boolean(form.walkthrough || form.walkthroughAssetId),
    unit_count: form.unitTypes.length,
    amenities_count: form.amenities.length,
    has_house_rules_touch: true,
  };
}

export function listingCompletePercent(form: ListingWizardFormState): number {
  if (!form.listingType) return 0;
  return computeCompletionPercentage(
    computeCompletionFlags(completionInputFromForm(form)),
  );
}

/** @deprecated Draft JSON without File blobs — localStorage is no longer SoT. */
export function serializeWizardDraft(form: ListingWizardFormState) {
  const {
    photos: _p,
    walkthrough: _w,
    walkthroughPreview: _wp,
    ...rest
  } = form;
  return {
    ...rest,
    photos: [],
    walkthrough: null,
    walkthroughPreview: null,
    walkthroughAssetId: form.walkthroughAssetId ?? null,
  };
}
