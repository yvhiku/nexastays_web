import type {
  ListingWizardFormState,
  WizardFieldErrors,
  WizardMessage,
  WizardStepId,
} from "./form-types";
import { isMultiUnitFlow } from "./step-config";
import { SUBMIT_MIN_PHOTOS } from "./completion";
import { hasUnfinishedUploads } from "./photo-queue";

/** DTO limits mirrored from Stays `UpdateHostListingDto`. */
export const TITLE_MAX = 200;
export const DESCRIPTION_MIN = 20;
export const DESCRIPTION_MAX = 5000;
export const MAX_GUESTS_LIMIT = 15;

const V = "hostListing.wizard.validation.";
const msg = (key: string, vars?: WizardMessage["vars"]): WizardMessage => ({
  key: V + key,
  vars,
});

/**
 * Field-level validation for one step. Keys are form field names (or a
 * synthetic key such as `photos` / `unitTypes.<id>.name`) so the UI can attach
 * `aria-describedby` and build a focusable error summary.
 */
export function validateStepFields(
  stepId: WizardStepId,
  form: ListingWizardFormState,
): WizardFieldErrors {
  const errors: WizardFieldErrors = {};
  switch (stepId) {
    case "location": {
      if (!form.city.trim()) errors.city = msg("cityRequired");
      if (!form.address.trim()) errors.address = msg("addressRequired");
      if (!["MA", "MOROCCO"].includes(form.country.trim().toUpperCase())) {
        errors.country = msg("countryMorocco");
      }
      if (form.geoLat == null || form.geoLng == null) {
        errors.map = msg("mapPinRequired");
      }
      return errors;
    }
    case "about": {
      const title = form.title.trim();
      if (!title || title === "Untitled listing") {
        errors.title = msg("titleRequired");
      } else if (title.length > TITLE_MAX) {
        errors.title = msg("titleTooLong", { max: TITLE_MAX });
      }
      const desc = form.description.trim();
      if (!desc || desc.length < DESCRIPTION_MIN) {
        errors.description = msg("descriptionMin", { min: DESCRIPTION_MIN });
      } else if (desc.length > DESCRIPTION_MAX) {
        errors.description = msg("descriptionMax", { max: DESCRIPTION_MAX });
      }
      if (form.maxGuests < 1) errors.maxGuests = msg("guestsMin");
      if (form.maxGuests > MAX_GUESTS_LIMIT) {
        errors.maxGuests = msg("guestsMax", { max: MAX_GUESTS_LIMIT });
      }
      return errors;
    }
    case "unitTypes": {
      if (!isMultiUnitFlow(form.listingType, form.bookingModel)) return errors;
      if (form.unitTypes.length < 1) {
        errors.unitTypes = msg("unitTypeRequired");
        return errors;
      }
      for (const u of form.unitTypes) {
        const badCapacity =
          u.quantity < 1 ||
          u.quantity > 100 ||
          u.maxGuests < 1 ||
          u.maxGuests > MAX_GUESTS_LIMIT ||
          (u.pricingUnit === "BED_NIGHT" && u.maxGuests !== 1);
        if (badCapacity) {
          errors[`unitTypes.${u.id}.capacity`] = msg("unitCapacity");
        }
        if (!u.name.trim()) {
          errors[`unitTypes.${u.id}.name`] = msg("unitNameRequired");
        }
        if (!u.basePrice.trim() || Number(u.basePrice) <= 0) {
          errors[`unitTypes.${u.id}.basePrice`] = msg("unitPriceRequired");
        }
      }
      return errors;
    }
    case "pricing": {
      if (isMultiUnitFlow(form.listingType, form.bookingModel)) {
        const minUnit = form.unitTypes.reduce(
          (min, u) => Math.min(min, Number(u.basePrice) || Infinity),
          Infinity,
        );
        if (!Number.isFinite(minUnit) || minUnit <= 0) {
          errors.unitTypes = msg("unitPricesRequired");
        }
        return errors;
      }
      if (!form.basePrice.trim() || Number(form.basePrice) <= 0) {
        errors.basePrice = msg("priceRequired");
      }
      if (
        form.weekendPrice.trim() &&
        (!Number.isFinite(Number(form.weekendPrice)) || Number(form.weekendPrice) < 0)
      ) {
        errors.weekendPrice = msg("weekendPriceInvalid");
      }
      return errors;
    }
    case "media": {
      const failed = form.photos.filter((p) => p.uploadStatus === "error").length;
      if (failed > 0) {
        errors.photos = msg("photosFailed", { count: failed });
        return errors;
      }
      if (hasUnfinishedUploads(form.photos)) {
        errors.photos = msg("photosUploading");
        return errors;
      }
      // Only fully uploaded tiles count toward the minimum — pending/uploading do not.
      const usable = form.photos.filter((p) => p.uploadStatus === "uploaded").length;
      if (usable < SUBMIT_MIN_PHOTOS) {
        errors.photos = msg("photosMin", { min: SUBMIT_MIN_PHOTOS });
      }
      return errors;
    }
    case "amenitiesRules":
    case "submit":
    default:
      return errors;
  }
}

/**
 * First error for a step as an i18n message, or null when valid.
 * Kept for callers that only need a boolean-ish gate.
 */
export function validateStep(
  stepId: WizardStepId,
  form: ListingWizardFormState,
): WizardMessage | null {
  const errors = validateStepFields(stepId, form);
  const first = Object.values(errors)[0];
  return first ?? null;
}

/** Field ids in DOM order for a step; used to pick the first invalid control. */
export function firstInvalidField(errors: WizardFieldErrors): string | null {
  const keys = Object.keys(errors);
  return keys.length ? keys[0] : null;
}
