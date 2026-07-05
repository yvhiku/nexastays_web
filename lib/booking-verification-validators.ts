/**
 * Validation for guest identity and booking verification flow
 */

import { validateEmail, validateIdNumber } from "./validators";
import type { GuestIdentityFormData, GuestGender } from "./booking-verification-types";

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/** Full name: non-empty, reasonable length, matches ID requirement */
export function validateFullName(value: string): ValidationResult {
  const v = value.trim();
  if (!v) {
    return { valid: false, error: "Full name is required" };
  }
  if (v.length < 2) {
    return { valid: false, error: "Enter full name as shown on your ID" };
  }
  return { valid: true };
}

/** Validate a single guest identity based on role and gender */
export function validateGuestIdentity(
  guest: GuestIdentityFormData,
  index: number
): ValidationResult {
  const err = validateFullName(guest.full_name);
  if (!err.valid) return { valid: false, error: `Guest ${index + 1}: ${err.error}` };

  const idErr = validateIdNumber(guest.id_number);
  if (!idErr.valid) return { valid: false, error: `Guest ${index + 1}: ${idErr.error}` };

  // Primary guest and male guests: require phone, email
  const needsPhoneEmail =
    guest.is_primary || guest.gender === "MALE" || guest.gender === "PREFER_NOT_TO_SAY";

  if (needsPhoneEmail) {
    if (!guest.phone || guest.phone.trim().length < 10) {
      return { valid: false, error: `Guest ${index + 1}: Phone number is required` };
    }
    const digits = guest.phone.replace(/\D/g, "");
    if (digits.length < 9) {
      return { valid: false, error: `Guest ${index + 1}: Enter a valid phone number` };
    }
    if (guest.email) {
      const e = validateEmail(guest.email);
      if (!e.valid) return { valid: false, error: `Guest ${index + 1}: ${e.error}` };
    } else {
      return { valid: false, error: `Guest ${index + 1}: Email is required` };
    }
  }

  return { valid: true };
}

/** Validate that all guests have ID document uploaded */
export function validateIdDocumentUploaded(
  guests: GuestIdentityFormData[]
): ValidationResult {
  for (let i = 0; i < guests.length; i++) {
    if (!guests[i].id_document_front_asset_id?.trim()) {
      return {
        valid: false,
        error: `Guest ${i + 1}: ID document upload is required`,
      };
    }
  }
  return { valid: true };
}

/** Validate that guest count matches number of submitted profiles */
export function validateGuestCountMatch(
  guestCount: number,
  guests: GuestIdentityFormData[]
): ValidationResult {
  if (guests.length !== guestCount) {
    return {
      valid: false,
      error: `Please provide details for all ${guestCount} guest${guestCount > 1 ? "s" : ""}.`,
    };
  }
  return { valid: true };
}
