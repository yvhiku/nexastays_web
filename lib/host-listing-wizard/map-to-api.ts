import type { CreateHostListingBody } from "@/lib/stays-types";
import type { ListingWizardFormState } from "./form-types";
import { isMultiUnitFlow } from "./step-config";

export function buildCreateHostListingBody(
  form: ListingWizardFormState,
  media: CreateHostListingBody["media"],
): CreateHostListingBody {
  if (!form.listingType || !form.bookingModel) {
    throw new Error("Property type and booking model are required.");
  }

  const multi = isMultiUnitFlow(form.listingType, form.bookingModel);
  const unitBase =
    multi && form.unitTypes.length > 0
      ? Math.min(...form.unitTypes.map((u) => Number(u.basePrice) || 0).filter((n) => n > 0))
      : Number(form.basePrice) || 0;

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
    description: form.description.trim(),
    checkin_time: form.checkinTime,
    checkout_time: form.checkoutTime,
    instant_booking: false,
    property_details: {
      ...form.propertyDetails,
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

/** Draft JSON without File blobs (photos/video are session-only). */
export function serializeWizardDraft(form: ListingWizardFormState) {
  const { photos: _p, walkthrough: _w, walkthroughPreview: _wp, ...rest } = form;
  return {
    ...rest,
    photos: [],
    walkthrough: null,
    walkthroughPreview: null,
  };
}
