/**
 * Booking Criteria & Verification Flow — types and schemas
 * Supports platform approval, guest identity collection, and host visibility.
 */

/** Verification status for client, host, or booking */
export type VerificationStatus =
  | "PENDING_VERIFICATION"   // Not yet submitted
  | "UNDER_REVIEW"          // Submitted, awaiting platform review
  | "APPROVED"              // Platform approved
  | "REJECTED"              // Platform rejected
  | "BLOCKED";              // Booking blocked due to missing verification

/** Gender for multi-guest identity (determines required fields) */
export type GuestGender = "MALE" | "FEMALE" | "PREFER_NOT_TO_SAY";

/** Primary guest: full identity. Additional male guests: same. Female guests: name + ID only. */
export interface GuestIdentityFormData {
  /** Full name exactly as on ID */
  full_name: string;
  /** Required for primary guest and male additional guests */
  phone?: string;
  /** Required for primary guest and male additional guests */
  email?: string;
  /** ID card/passport number */
  id_number: string;
  /** For multi-guest: determines required fields */
  gender?: GuestGender;
  /** Whether this is the primary booking guest */
  is_primary: boolean;
  /** Asset ID of uploaded ID document (front). Backend stores securely. */
  id_document_front_asset_id?: string;
  /** Asset ID of uploaded ID document (back), if applicable */
  id_document_back_asset_id?: string;
}

/** Extended occupant for CreateBookingDto — backend-ready shape */
export interface BookingOccupantDto {
  full_name: string;
  id_number?: string;
  is_primary?: boolean;
  phone?: string;
  email?: string;
  gender?: string;
  id_document_front_asset_id?: string;
  id_document_back_asset_id?: string;
}

/** Host verification details visible to client (post-booking or in listing context) */
export interface HostVerificationInfo {
  host_id: string;
  full_name: string;
  phone?: string;           // Only visible after booking confirmed
  has_id_verified: boolean;
  has_profile_photo: boolean;
  has_walkthrough_video: boolean;
  profile_photo_url?: string | null;
}
