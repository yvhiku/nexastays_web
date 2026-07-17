/** Nexa Stays API types */

export interface SearchListingsParams {
  city?: string;
  checkin_date?: string;
  checkout_date?: string;
  guests?: number;
  verified_walkthrough_only?: boolean;
  instant_booking_only?: boolean;
  listing_type?: "APARTMENT" | "HOTEL" | "RIAD" | "VILLA" | "HOSTEL";
}

export interface StaysListing {
  id: string;
  title: string;
  listing_type: "APARTMENT" | "HOTEL" | "RIAD" | "VILLA" | "HOSTEL";
  city: string;
  neighborhood?: string | null;
  geo_lat?: number | null;
  geo_lng?: number | null;
  address?: string | null;
  check_in_instructions?: string | null;
  status: string;
  checkin_time: string;
  checkout_time: string;
  description?: string | null;
  instant_booking: boolean;
  rate_plan?: {
    base_price: number;
    weekend_price?: number | null;
    cleaning_fee: number;
    currency: string;
  } | null;
  rules?: {
    pets_policy?: string | null;
    smoking_policy?: string | null;
    max_guests?: number | null;
    amenities?: string[] | null;
  } | null;
  host?: {
    id: string;
    full_name?: string | null;
  } | null;
  media?: { asset_id: string; kind: "PHOTO" | "VIDEO" | "WALKTHROUGH"; sort_order?: number }[];
  avg_rating?: number | null;
  review_count?: number;
}

export interface ListingReviewMedia {
  asset_id: string;
  display_order: number;
}

export interface ListingReview {
  id: string;
  listing_id: string;
  guest_id?: string;
  guest_name: string;
  guest_photo_url: string | null;
  rating: number;
  comment: string;
  created_at: string;
  edited_at?: string | null;
  is_verified_stay: boolean;
  is_edited: boolean;
  media: ListingReviewMedia[];
}

export interface ListingReviewsSummary {
  overall_avg_rating: number | null;
  total_count: number;
  distribution: Record<string, number>;
  distribution_pct: Record<string, number>;
}

export interface ListingReviewsResponse {
  reviews: ListingReview[];
  summary: ListingReviewsSummary;
  page: number;
  limit: number;
  total: number;
}

export interface StaysReviewDetail extends ListingReview {
  booking_id: string;
  status: string;
  can_edit: boolean;
}

export type ReviewSort = "newest" | "highest" | "lowest";

/** Occupant/guest identity for booking verification */
export interface CreateBookingOccupantDto {
  full_name: string;
  id_number?: string;
  is_primary?: boolean;
  phone?: string;
  email?: string;
  gender?: string;
  id_document_front_asset_id?: string;
  id_document_back_asset_id?: string;
}

export interface CreateBookingDto {
  listing_id: string;
  checkin_date: string; // YYYY-MM-DD
  checkout_date: string;
  guest_count: number;
  idempotency_key?: string;
  occupants?: CreateBookingOccupantDto[];
}

/** Occupant info — guests see minimal fields; hosts see contact details too */
export interface BookingOccupantInfo {
  full_name: string;
  id_number: string | null;
  is_primary?: boolean;
  phone?: string | null;
  email?: string | null;
  gender?: string | null;
}

export type BookingLifecycle =
  | "UPCOMING"
  | "ACTIVE"
  | "COMPLETED"
  | "PENDING_PAYMENT"
  | "CANCELLED"
  | "EXPIRED";

export interface StaysBooking {
  id: string;
  listing_id: string;
  status: string;
  booking_lifecycle?: BookingLifecycle;
  checkin_date: string;
  checkout_date: string;
  guest_count: number;
  total_subtotal: number;
  guest_fee: number;
  host_fee: number;
  total_paid: number | null;
  payout_amount: number | null;
  currency: string;
  created_at?: string;
  completed_at?: string | null;
  payment_expires_at?: string | null;
  payment_failed?: boolean;
  can_review?: boolean;
  can_complain?: boolean;
  can_cancel?: boolean;
  has_reviewed?: boolean;
  review_blocked_reason?: "OWN_LISTING";
  viewer_role?: "GUEST" | "HOST";
  guest_name?: string | null;
  guest_phone?: string | null;
  occupants?: BookingOccupantInfo[];
  listing?: {
    id: string;
    title: string;
    city: string;
    address?: string | null;
    check_in_instructions?: string | null;
    checkin_time?: string | null;
    checkout_time?: string | null;
    check_in_contact?: {
      full_name: string;
      phone: string;
      role?: string;
      access_instructions?: string | null;
    } | null;
    rules?: {
      cancellation_policy?: "FLEXIBLE" | "MODERATE" | "STRICT" | string | null;
    } | null;
    host?: { full_name?: string | null } | null;
    media?: { asset_id: string; kind: string; sort_order?: number }[];
  } | null;
}

export interface HostVerificationStatus {
  status: "NOT_STARTED" | "PENDING" | "APPROVED" | "REJECTED";
  application_status?: string;
  identity_status?: string;
  message?: string;
  submitted_at?: string | null;
  reviewed_at?: string | null;
  rejection_reason?: string | null;
}

/** Raw payload from GET/POST /host/verification (field names vary by API version). */
export type HostVerificationPayload = HostVerificationStatus & {
  host_verification_status?: string;
};

export interface HostMeStatus {
  is_host: boolean;
  host_user_id?: string | null;
  profile_id?: string | null;
  application_status: string;
  identity_status: string;
  host_verification_status: string;
  can_create_listing: boolean;
  can_publish_listing: boolean;
  rejection_reason?: string | null;
  submitted_at?: string | null;
  reviewed_at?: string | null;
  source?: string | null;
  submitted_from?: string | null;
}

export interface SubmitHostOnboardingBody {
  full_name?: string;
  phone?: string;
  email?: string;
  city?: string;
  host_type?: string;
  source?: "MOBILE" | "WEB" | "ADMIN" | "UNKNOWN";
  submitted_from?: string;
  use_existing_kyc?: boolean;
  hosting_policies_accepted?: boolean;
  identity_reused?: boolean;
  sumsub_applicant_id?: string;
  identity_status?: string;
  document_type?: string;
  document_number_hash?: string;
  document_front_asset_id?: string;
  document_back_asset_id?: string;
  selfie_asset_id?: string;
}

export interface SubmitHostVerificationBody {
  document_type?: string;
  document_number_hash?: string;
  document_front_asset_id?: string;
  document_back_asset_id?: string;
  selfie_asset_id?: string;
  /** Use existing approved KYC identity (name, phone, email, DOB) - skips document upload */
  use_existing_kyc?: boolean;
}

export interface HostBooking {
  id: string;
  listing_id: string;
  status: string;
  checkin_date: string;
  checkout_date: string;
  guest_count: number;
  total_subtotal: number;
  host_fee?: number;
  total_paid: number | null;
  payout_amount?: number | null;
  currency: string;
  listing?: { id: string; title: string; city: string } | null;
  guest_name?: string | null;
  guest_phone?: string | null;
  /** Declared occupants — full_name and id_number only (no ID document) */
  occupants?: BookingOccupantInfo[];
}

export interface HostDashboardStats {
  total_earnings: number;
  this_month_earnings: number;
  currency: string;
  total_bookings: number;
  pending_bookings: number;
  active_bookings: number;
  completed_bookings: number;
  cancelled_bookings: number;
  live_listings: number;
  pending_listings: number;
  total_listings: number;
  avg_rating: number | null;
  total_reviews: number;
}

export interface HostListingSummary {
  id: string;
  title: string;
  listing_type: string;
  city: string;
  neighborhood?: string | null;
  geo_lat?: number | null;
  geo_lng?: number | null;
  status: string;
  description?: string | null;
  address?: string | null;
  checkin_time?: string | null;
  checkout_time?: string | null;
  instant_booking?: boolean;
  rate_plan?: {
    base_price: number;
    weekend_price?: number | null;
    cleaning_fee: number;
    currency: string;
  } | null;
  rules?: {
    max_guests?: number;
    pets_policy?: string | null;
    smoking_policy?: string | null;
    amenities?: string[] | null;
    cancellation_policy?: string | null;
  } | null;
  media?: { asset_id: string; kind: string; sort_order?: number }[];
  created_at: string;
}

export interface HostListingDetail extends HostListingSummary {
  check_in_contact?: {
    full_name: string;
    phone: string;
    role: string;
    access_instructions?: string | null;
  } | null;
}

export interface UpdateHostListingBody {
  title?: string;
  city?: string;
  neighborhood?: string;
  address?: string;
  geo_lat?: number;
  geo_lng?: number;
  description?: string;
  checkin_time?: string;
  checkout_time?: string;
  instant_booking?: boolean;
  rate_plan?: {
    base_price?: number;
    weekend_price?: number | null;
    cleaning_fee?: number;
    currency?: string;
  };
  rules?: {
    max_guests?: number;
    pets_policy?: "ALLOWED" | "DOGS_CATS" | "NO";
    smoking_policy?: "ALLOWED" | "NOT_ALLOWED";
    amenities?: string[];
    cancellation_policy?: "FLEXIBLE" | "MODERATE" | "STRICT";
  };
  check_in_contact?: {
    full_name?: string;
    phone?: string;
    role?: "OWNER" | "CO_HOST" | "AGENT";
    access_instructions?: string;
  };
}

export interface CreateHostListingBody {
  title: string;
  listing_type: "APARTMENT" | "HOTEL" | "RIAD" | "VILLA" | "HOSTEL";
  booking_model?:
    | "ENTIRE_PROPERTY"
    | "PRIVATE_ROOM"
    | "MULTI_UNIT"
    | "ROOM_TYPES"
    | "DORM_BEDS"
    | "PRIVATE_ROOMS"
    | "DORM_AND_PRIVATE"
    | "BOTH";
  city: string;
  country?: string;
  neighborhood?: string;
  postal_code?: string;
  building_name?: string;
  landmark?: string;
  address?: string;
  geo_lat?: number;
  geo_lng?: number;
  description?: string;
  checkin_time?: string;
  checkout_time?: string;
  instant_booking?: boolean;
  property_details?: Record<string, unknown>;
  safety_features?: Record<string, unknown>;
  policies?: Record<string, unknown>;
  rules?: {
    pets_policy?: "ALLOWED" | "DOGS_CATS" | "NO";
    smoking_policy?: "ALLOWED" | "NOT_ALLOWED";
    quiet_hours?: boolean;
    couples_welcome?: boolean;
    max_guests?: number;
    amenities?: string[];
    cancellation_policy?: "FLEXIBLE" | "MODERATE" | "STRICT";
  };
  rate_plan: {
    currency?: string;
    base_price: number;
    weekend_price?: number;
    cleaning_fee?: number;
    deposit_policy_text?: string;
  };
  check_in_contact: {
    full_name: string;
    phone: string;
    role: "OWNER" | "CO_HOST" | "AGENT";
    access_instructions?: string;
  };
  media: {
    asset_id: string;
    kind: "PHOTO" | "WALKTHROUGH";
    sort_order?: number;
    category?: string;
    is_cover?: boolean;
  }[];
  unit_types?: Array<{
    kind:
      | "APARTMENT_UNIT"
      | "VILLA_UNIT"
      | "HOTEL_ROOM"
      | "RIAD_ROOM"
      | "HOSTEL_DORM"
      | "HOSTEL_PRIVATE";
    name: string;
    quantity?: number;
    max_guests?: number;
    bed_config?: unknown[];
    size_sqm?: number;
    amenities?: string[];
    pricing_unit?: "NIGHT" | "BED_NIGHT" | "ROOM_NIGHT";
    base_price: number;
    currency?: string;
    details?: Record<string, unknown>;
    sort_order?: number;
    is_active?: boolean;
  }>;
}
