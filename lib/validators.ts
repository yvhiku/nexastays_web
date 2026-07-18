/**
 * Shared validators for search, booking, and forms
 */

import {
  isValidPhoneNumber,
  parsePhoneNumber,
} from "libphonenumber-js";

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

/** Morocco country code (default for bare national numbers) */
export const MOROCCO_PREFIX = "+212";

/**
 * Get national digits from a stored phone (MA-oriented helper).
 * Prefer storing/passing full E.164 with PhoneInput.
 */
export function getLocalPhonePart(value: string): string {
  const s = value.replace(/\s/g, "");
  if (s.startsWith("+212")) return s.slice(4);
  if (s.startsWith("212") && !s.startsWith("+")) return s.slice(3);
  if (s.startsWith("0") && !s.startsWith("+")) return s.slice(1);
  if (s.startsWith("+")) return s.replace(/\D/g, "").replace(/^\d{1,3}/, "");
  return s.replace(/\D/g, "");
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

/**
 * Normalize to E.164.
 * - Prefer parsePhoneNumber when possible.
 * - Already `+…` / `00…` → international.
 * - Bare / `0…` / `212…` → Morocco default (local hosts & legacy forms).
 */
export function normalizePhone(value: string): string {
  const s = value.trim();
  if (!s) return "";

  try {
    const parsed = parsePhoneNumber(s, "MA");
    if (parsed) return parsed.format("E.164");
  } catch {
    // fall through
  }

  if (s.startsWith("+") || s.startsWith("00")) {
    let digits = s.replace(/\D/g, "");
    if (digits.startsWith("00")) digits = digits.slice(2);
    // Morocco: +2120XXXXXXXXX → +212XXXXXXXXX
    if (digits.startsWith("2120") && digits.length >= 13) {
      digits = `212${digits.slice(4, 13)}`;
    }
    if (!digits || !/^[1-9]\d{7,14}$/.test(digits)) return "";
    return `+${digits}`;
  }

  return normalizeMoroccanPhone(s);
}

/** Validate phone (international E.164 or MA national forms) */
export function validatePhone(value: string): ValidationResult {
  const normalized = value.trim() ? normalizePhone(value) : "";
  if (!normalized) {
    return { valid: false, error: "Enter a valid phone number" };
  }
  try {
    const parsed = parsePhoneNumber(normalized);
    if (!parsed || !isValidPhoneNumber(normalized)) {
      return { valid: false, error: "Enter a valid phone number" };
    }
  } catch {
    return { valid: false, error: "Enter a valid phone number" };
  }
  return { valid: true };
}

/** Parsed phone helpers for display / analytics (null if unparseable) */
export function parsePhone(value: string) {
  try {
    const normalized = normalizePhone(value);
    if (!normalized) return null;
    return parsePhoneNumber(normalized);
  } catch {
    return null;
  }
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
