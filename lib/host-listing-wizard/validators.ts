import type { ListingWizardFormState, WizardStepId } from "./form-types";
import { isMultiUnitFlow } from "./step-config";
import { SUBMIT_MIN_PHOTOS } from "./completion";

export function validateStep(
  stepId: WizardStepId,
  form: ListingWizardFormState,
): string | null {
  switch (stepId) {
    case "propertyType":
      return form.listingType ? null : "Select a property type to continue.";
    case "bookingModel":
      return form.bookingModel ? null : "Select how guests can book this property.";
    case "location":
      if (!form.city.trim()) return "City is required.";
      if (!form.address.trim()) return "Street address is required.";
      if (!["MA", "MOROCCO"].includes(form.country.trim().toUpperCase())) {
        return "Select Morocco as the listing country.";
      }
      if (form.geoLat == null || form.geoLng == null) {
        return "Place the listing on the map so guests can find it.";
      }
      return null;
    case "details":
    case "about":
      if (!form.title.trim() || form.title.trim() === "Untitled listing") {
        return "Add a listing title.";
      }
      if (!form.description.trim() || form.description.trim().length < 20) {
        return "Add a description of at least 20 characters.";
      }
      if (form.maxGuests < 1) return "Maximum guests must be at least 1.";
      if (form.maxGuests > 15) return "Maximum guests cannot exceed 15.";
      return null;
    case "unitTypes": {
      if (!isMultiUnitFlow(form.listingType, form.bookingModel)) return null;
      if (form.unitTypes.length < 1) return "Add at least one room or dorm type.";
      const invalidCapacity = form.unitTypes.find(
        (u) =>
          u.quantity < 1 ||
          u.quantity > 100 ||
          u.maxGuests < 1 ||
          u.maxGuests > 15 ||
          (u.pricingUnit === "BED_NIGHT" && u.maxGuests !== 1),
      );
      if (invalidCapacity) {
        return "Each type must have 1–100 rooms or beds and 1–15 guests per booking.";
      }
      const incomplete = form.unitTypes.find(
        (u) => !u.name.trim() || !u.basePrice.trim() || Number(u.basePrice) <= 0,
      );
      if (incomplete) {
        return "Each unit type needs a name and a price greater than zero.";
      }
      return null;
    }
    case "amenities":
      return null;
    case "policies":
      return null;
    case "pricing": {
      if (isMultiUnitFlow(form.listingType, form.bookingModel)) {
        const minUnit = form.unitTypes.reduce(
          (min, u) => Math.min(min, Number(u.basePrice) || Infinity),
          Infinity,
        );
        if (!Number.isFinite(minUnit) || minUnit <= 0) {
          return "Set prices on your room or dorm types.";
        }
        return null;
      }
      if (!form.basePrice.trim() || Number(form.basePrice) <= 0) {
        return "Enter a nightly price greater than zero.";
      }
      return null;
    }
    case "media": {
      if (form.photos.length < SUBMIT_MIN_PHOTOS) {
        return `Add at least ${SUBMIT_MIN_PHOTOS} photos to continue.`;
      }
      return null;
    }
    case "review":
    case "submit":
      return null;
    default:
      return null;
  }
}
