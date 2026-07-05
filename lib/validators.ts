/**
 * Shared validators for search, booking, and forms
 */

/** Phone: E.164 or similar, 10–15 digits */
const PHONE_REGEX = /^\+?[0-9]{10,15}$/;

/** Email: standard format */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Allowed upload MIME types */
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

/** Max file size in bytes (5MB) */
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/** Validate guests: integer, min 1, max from listing or default 20 */
export function validateGuests(
  value: unknown,
  maxGuests?: number | null
): ValidationResult {
  const n = typeof value === "number" ? value : parseInt(String(value), 10);
  if (Number.isNaN(n)) {
    return { valid: false, error: "Guests must be a number" };
  }
  if (!Number.isInteger(n)) {
    return { valid: false, error: "Guests must be a whole number" };
  }
  if (n < 1) {
    return { valid: false, error: "At least 1 guest required" };
  }
  const max = maxGuests ?? 20;
  if (n > max) {
    return { valid: false, error: `Maximum ${max} guests allowed` };
  }
  return { valid: true };
}

/** Validate dates: checkin >= today, checkout > checkin */
export function validateDates(
  checkin: string,
  checkout: string
): ValidationResult {
  if (!checkin || !checkout) {
    return { valid: false, error: "Check-in and check-out dates are required" };
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const ci = new Date(checkin);
  ci.setHours(0, 0, 0, 0);
  const co = new Date(checkout);
  co.setHours(0, 0, 0, 0);

  if (ci < today) {
    return { valid: false, error: "Check-in date cannot be in the past" };
  }
  if (co <= ci) {
    return { valid: false, error: "Check-out must be after check-in" };
  }
  return { valid: true };
}

/** Morocco country code */
export const MOROCCO_PREFIX = "+212";

/** Get local part (612345677) from full (+212612345677) or return as-is */
export function getLocalPhonePart(value: string): string {
  const s = value.replace(/\s/g, "");
  if (s.startsWith("+212")) return s.slice(4);
  if (s.startsWith("212")) return s.slice(3);
  if (s.startsWith("0")) return s.slice(1);
  return s;
}

/**
 * Normalize Moroccan phone to E.164 (+212612345677).
 * Accepts: 0612345677, 612345677, 212612345677, +212612345677, +2120612345678
 */
export function normalizeMoroccanPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  let local = digits;
  if (local.startsWith("212")) {
    local = local.slice(3);
  }
  if (local.startsWith("0")) {
    local = local.slice(1);
  }
  // Morocco mobile: 6XX XXX XXX (9 digits)
  let out =
    local.length >= 9 && local.startsWith("6")
      ? `${MOROCCO_PREFIX}${local.slice(0, 9)}`
      : `${MOROCCO_PREFIX}${local}`;
  // +2120612345678 (national 0 after country code) → +212612345678
  if (/^\+2120\d{9}$/.test(out)) {
    out = `${MOROCCO_PREFIX}${out.slice(5)}`;
  }
  return out;
}

/** Validate phone number (accepts 06..., 6..., 212..., +212..., normalizes before check) */
export function validatePhone(value: string): ValidationResult {
  const normalized = value.trim() ? normalizeMoroccanPhone(value) : "";
  if (!normalized || normalized.length < 12) {
    return { valid: false, error: "Enter a valid phone number (e.g. 0612345677)" };
  }
  if (!PHONE_REGEX.test(normalized)) {
    return { valid: false, error: "Phone number format is invalid" };
  }
  return { valid: true };
}

/** Validate email */
export function validateEmail(value: string): ValidationResult {
  if (!value.trim()) {
    return { valid: false, error: "Email is required" };
  }
  if (!EMAIL_REGEX.test(value)) {
    return { valid: false, error: "Enter a valid email address" };
  }
  return { valid: true };
}

/** Validate date of birth: must be valid date and age >= 18 */
export function validateDateOfBirth(value: string): ValidationResult {
  if (!value) {
    return { valid: false, error: "Date of birth is required" };
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    return { valid: false, error: "Invalid date" };
  }
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  if (age < 18) {
    return { valid: false, error: "You must be at least 18 years old" };
  }
  return { valid: true };
}

/** Validate ID number (basic: non-empty, reasonable length) */
export function validateIdNumber(value: string): ValidationResult {
  const v = value.trim();
  if (!v) {
    return { valid: false, error: "ID number is required" };
  }
  if (v.length < 5 || v.length > 50) {
    return { valid: false, error: "ID number must be 5–50 characters" };
  }
  return { valid: true };
}

/** Validate file: type and size */
export function validateImageFile(file: File): ValidationResult {
  if (!file) {
    return { valid: false, error: "File is required" };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: "File must be 5MB or smaller" };
  }
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    return { valid: false, error: "Only JPEG, PNG, and WebP images are allowed" };
  }
  return { valid: true };
}
