import type { ListingWizardFormState, WizardStepId } from "./form-types";
import { isMultiUnitFlow } from "./step-config";

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
      if (!form.title.trim()) return "Listing title is required.";
      if (!/^[A-Za-z]{2}$/.test(form.country.trim())) {
        return "Country must be a 2-letter code (e.g. MA).";
      }
      if (form.geoLat == null || form.geoLng == null) {
        return "Place the listing on the map so guests can find it.";
      }
      return null;
    case "details":
      if (!form.description.trim() || form.description.trim().length < 20) {
        return "Add a description of at least 20 characters.";
      }
      if (form.maxGuests < 1) return "Maximum guests must be at least 1.";
      return null;
    case "unitTypes": {
      if (!isMultiUnitFlow(form.listingType, form.bookingModel)) return null;
      if (form.unitTypes.length < 1) return "Add at least one room or dorm type.";
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
      if (!form.contactName.trim()) return "Check-in contact name is required.";
      if (!form.contactPhone.trim()) return "Check-in contact phone is required.";
      if (!/^[+\d\s\-()]+$/.test(form.contactPhone.trim())) {
        return "Check-in contact phone may only include digits, spaces, +, -, and parentheses.";
      }
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
      const photos = form.photos;
      if (photos.length < 12) {
        return "Add at least 12 photos before submitting.";
      }
      const hasExterior = photos.some(
        (p) => p.category === "EXTERIOR" || p.category === "ENTRANCE",
      );
      if (!hasExterior) {
        return "Add at least one exterior or entrance photo.";
      }
      if (!form.walkthrough) {
        return "A walkthrough video is required.";
      }
      return null;
    }
    case "review":
      return null;
    default:
      return null;
  }
}
