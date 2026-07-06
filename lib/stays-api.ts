/**
 * Nexa Stays API client
 * Base: /api/v1/stays
 */

import axios, { AxiosError } from "axios";
import {
  refreshToken as refreshTokenApi,
  notifyTokenRefreshed,
  notifyAuthLogout,
} from "./auth-api";
import type {
  SearchListingsParams,
  StaysListing,
  CreateBookingDto,
  StaysBooking,
  HostVerificationStatus,
  HostMeStatus,
  SubmitHostOnboardingBody,
  SubmitHostVerificationBody,
  HostListingSummary,
  HostListingDetail,
  UpdateHostListingBody,
  HostBooking,
  HostDashboardStats,
  CreateHostListingBody,
  ListingReviewsResponse,
  StaysReviewDetail,
  ReviewSort,
} from "./stays-types";
import { getStaysApiBaseUrl } from "./env";

const API_BASE = getStaysApiBaseUrl();

/** Public URL for listing media (photos, walkthrough) - no auth needed */
export function getListingMediaUrl(listingId: string, assetId: string): string {
  return `${API_BASE}/stays/listings/${encodeURIComponent(listingId)}/media/${encodeURIComponent(assetId)}`;
}

/** Public URL for review photo attachments */
export function getReviewMediaUrl(assetId: string): string {
  return `${API_BASE}/stays/reviews/media/${encodeURIComponent(assetId)}`;
}

const client = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

// For FormData uploads, remove Content-Type so the browser sets multipart/form-data with boundary.
client.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  return config;
});

const JWT_KEY = "nexa_access_token";
const REFRESH_TOKEN_KEY = "nexa_refresh_token";

/** Retry on 429 with backoff; show friendly message if still failing */
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1500;

client.interceptors.response.use(
  (res) => res,
  async (err) => {
    const config = err.config as typeof err.config & { __retryCount?: number; __refreshRetried?: boolean };
    if (!config) return Promise.reject(err);

    if (err.response?.status === 429) {
      if ((config.__retryCount ?? 0) >= MAX_RETRIES) return Promise.reject(err);
      config.__retryCount = (config.__retryCount ?? 0) + 1;
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (config.__retryCount ?? 1)));
      return client.request(config);
    }

    if (err.response?.status === 401 && !config.__refreshRetried && typeof window !== "undefined") {
      const hadAuth = config.headers?.["Authorization"] || config.headers?.Authorization;
      const refresh = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (hadAuth && refresh) {
        config.__refreshRetried = true;
        try {
          const tokens = await refreshTokenApi(refresh);
          localStorage.setItem(JWT_KEY, tokens.access_token);
          if (tokens.refresh_token) localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
          notifyTokenRefreshed(tokens.access_token);
          config.headers = { ...config.headers, Authorization: `Bearer ${tokens.access_token}` };
          return client.request(config);
        } catch {
          localStorage.removeItem(JWT_KEY);
          localStorage.removeItem(REFRESH_TOKEN_KEY);
          notifyAuthLogout();
        }
      }
    }

    return Promise.reject(err);
  }
);

/** Attach JWT for authenticated requests */
function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem(JWT_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function unwrap<T>(res: { data?: unknown }): T {
  const d = res.data;
  return (d && typeof d === "object" && "data" in d ? (d as { data: T }).data : d) as T;
}

function handleError(err: unknown): never {
  if (axios.isAxiosError(err)) {
    const e = err as AxiosError<{ message?: string; error?: string }>;
    if (e.response?.status === 429) {
      throw new Error("Please wait a moment and try again.");
    }
    const msg = e.response?.data?.message ?? e.response?.data?.error ?? e.message ?? "Request failed";
    if (msg === "ReviewNotAllowed") {
      throw new Error("You can only review after your stay is completed.");
    }
    if (msg === "ReviewOwnListingNotAllowed") {
      throw new Error("You cannot review a stay at your own property.");
    }
    if (msg === "ReviewAlreadyExists") {
      throw new Error("You have already reviewed this stay.");
    }
    throw new Error(msg);
  }
  throw err;
}

/** Search listings (public) */
export async function searchListings(
  params: SearchListingsParams
): Promise<StaysListing[]> {
  const q = new URLSearchParams();
  if (params.city) q.set("city", params.city);
  if (params.checkin_date) q.set("checkin_date", params.checkin_date);
  if (params.checkout_date) q.set("checkout_date", params.checkout_date);
  if (params.guests != null) q.set("guests", String(params.guests));
  if (params.verified_walkthrough_only != null)
    q.set("verified_walkthrough_only", String(params.verified_walkthrough_only));
  if (params.instant_booking_only != null)
    q.set("instant_booking_only", String(params.instant_booking_only));

  const res = await client
    .get(`/stays/listings/search?${q.toString()}`)
    .catch(handleError);
  const data = unwrap<StaysListing[]>(res);
  return Array.isArray(data) ? data : [];
}

/** Get listing by ID (public; includes address and map coordinates for browsing) */
export async function getListing(
  id: string,
  token?: string | null
): Promise<StaysListing> {
  const headers = token ? { Authorization: `Bearer ${token}` } : getAuthHeaders();
  const res = await client
    .get(`/stays/listings/${id}`, { headers })
    .catch(handleError);
  return unwrap<StaysListing>(res);
}

/** Create booking (requires JWT, verified guest) */
export async function createBooking(
  dto: CreateBookingDto,
  token?: string | null
): Promise<StaysBooking> {
  const headers = token ? { Authorization: `Bearer ${token}` } : getAuthHeaders();
  const res = await client
    .post("/stays/bookings", dto, { headers })
    .catch(handleError);
  return unwrap<StaysBooking>(res);
}

/** Create or get payment intent for booking (PAYMENT_PENDING) */
export async function createPaymentIntent(
  bookingId: string,
  token?: string | null,
  idempotencyKey?: string
): Promise<{
  id: string;
  booking_id: string;
  provider: string;
  provider_intent_id: string | null;
  amount: number;
  currency: string;
  status: string;
}> {
  const headers = token ? { Authorization: `Bearer ${token}` } : getAuthHeaders();
  const res = await client
    .post(
      `/stays/bookings/${bookingId}/payments/intent`,
      idempotencyKey ? { idempotency_key: idempotencyKey } : {},
      { headers }
    )
    .catch(handleError);
  return unwrap(res);
}

/** Pay with Nexa Pay wallet (requires KYC-approved guest with sufficient balance) */
export async function payWithWallet(
  bookingId: string,
  token?: string | null
): Promise<{ id: string; booking_id: string; provider: string; amount: number; currency: string; status: string }> {
  const headers = token ? { Authorization: `Bearer ${token}` } : getAuthHeaders();
  const res = await client
    .post(`/stays/bookings/${bookingId}/payments/wallet`, {}, { headers })
    .catch(handleError);
  return unwrap(res);
}

/** Simulate card payment success (dev only - calls mock webhook) */
export async function simulateCardPayment(
  providerIntentId: string
): Promise<void> {
  const API_BASE = getStaysApiBaseUrl();
  const res = await fetch(`${API_BASE}/stays/webhooks/payments/mock`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ provider_intent_id: providerIntentId }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.message ?? `Simulate failed: ${res.status}`);
  }
}

/** Get guest's booking history (requires JWT) */
export async function getGuestBookings(
  token?: string | null
): Promise<StaysBooking[]> {
  const headers = token ? { Authorization: `Bearer ${token}` } : getAuthHeaders();
  const res = await client
    .get("/stays/bookings", { headers })
    .catch(handleError);
  const data = unwrap<StaysBooking[]>(res);
  return Array.isArray(data) ? data : [];
}

/** Cancel booking (guest or host) */
export async function cancelBooking(
  bookingId: string,
  cancelledBy: "guest" | "host",
  reason?: string,
  token?: string | null
): Promise<void> {
  const headers = token ? { Authorization: `Bearer ${token}` } : getAuthHeaders();
  await client
    .post(
      `/stays/bookings/${bookingId}/cancel`,
      { cancelled_by: cancelledBy, reason: reason ?? undefined },
      { headers }
    )
    .catch(handleError);
}

/** Get booking by ID (requires JWT) */
export async function getBooking(
  id: string,
  token?: string | null
): Promise<StaysBooking> {
  const headers = token ? { Authorization: `Bearer ${token}` } : getAuthHeaders();
  const res = await client
    .get(`/stays/bookings/${id}`, { headers })
    .catch(handleError);
  return unwrap<StaysBooking>(res);
}

/** Get host dashboard KPI stats (requires JWT) */
export async function getHostStats(
  token?: string | null
): Promise<HostDashboardStats> {
  const headers = token ? { Authorization: `Bearer ${token}` } : getAuthHeaders();
  const res = await client
    .get("/stays/host/stats", { headers })
    .catch(handleError);
  return unwrap<HostDashboardStats>(res);
}

/** Get host's bookings (requires JWT) */
export async function getHostBookings(
  token?: string | null
): Promise<HostBooking[]> {
  const headers = token ? { Authorization: `Bearer ${token}` } : getAuthHeaders();
  const res = await client
    .get("/stays/host/bookings", { headers })
    .catch(handleError);
  const data = unwrap<HostBooking[]>(res);
  return Array.isArray(data) ? data : [];
}

/** Get host's listings (requires JWT, approved host) */
export async function getHostListings(
  token?: string | null
): Promise<HostListingSummary[]> {
  const headers = token ? { Authorization: `Bearer ${token}` } : getAuthHeaders();
  const res = await client
    .get("/stays/host/listings", { headers })
    .catch(handleError);
  const data = unwrap<HostListingSummary[]>(res);
  return Array.isArray(data) ? data : [];
}

/** Get host listing detail for editing */
export async function getHostListingById(
  id: string,
  token?: string | null
): Promise<HostListingDetail> {
  const headers = token ? { Authorization: `Bearer ${token}` } : getAuthHeaders();
  const res = await client
    .get(`/stays/host/listings/${id}`, { headers })
    .catch(handleError);
  return unwrap<HostListingDetail>(res);
}

/** Update host listing */
export async function updateHostListing(
  id: string,
  body: UpdateHostListingBody,
  token?: string | null
): Promise<HostListingDetail> {
  const headers = token ? { Authorization: `Bearer ${token}` } : getAuthHeaders();
  const res = await client
    .patch(`/stays/host/listings/${id}`, body, { headers })
    .catch(handleError);
  return unwrap<HostListingDetail>(res);
}

/** Pause listing (hide from search) */
export async function pauseHostListing(
  id: string,
  token?: string | null
): Promise<{ id: string; status: string; message: string }> {
  const headers = token ? { Authorization: `Bearer ${token}` } : getAuthHeaders();
  const res = await client
    .post(`/stays/host/listings/${id}/pause`, {}, { headers })
    .catch(handleError);
  return unwrap(res);
}

/** Resume paused listing */
export async function resumeHostListing(
  id: string,
  token?: string | null
): Promise<{ id: string; status: string; message: string }> {
  const headers = token ? { Authorization: `Bearer ${token}` } : getAuthHeaders();
  const res = await client
    .post(`/stays/host/listings/${id}/resume`, {}, { headers })
    .catch(handleError);
  return unwrap(res);
}

/** Create listing (requires JWT, approved host) */
export async function createHostListing(
  body: CreateHostListingBody,
  token?: string | null
): Promise<{ id: string; status: string; message: string }> {
  const headers = token ? { Authorization: `Bearer ${token}` } : getAuthHeaders();
  const res = await client
    .post("/stays/host/listings", body, { headers })
    .catch(handleError);
  return unwrap<{ id: string; status: string; message: string }>(res);
}

/** Upload listing photo (returns asset_id) */
export async function uploadListingPhoto(
  file: File,
  token?: string | null
): Promise<{ asset_id: string }> {
  const headers = token ? { Authorization: `Bearer ${token}` } : getAuthHeaders();
  const form = new FormData();
  form.append("file", file);
  const res = await client
    .post("/stays/host/listings/media/photo", form, { headers })
    .catch(handleError);
  return unwrap<{ asset_id: string }>(res);
}

/** Upload listing walkthrough video (returns asset_id) */
export async function uploadListingWalkthrough(
  file: File,
  token?: string | null
): Promise<{ asset_id: string }> {
  const headers = token ? { Authorization: `Bearer ${token}` } : getAuthHeaders();
  const form = new FormData();
  form.append("file", file);
  const res = await client
    .post("/stays/host/listings/media/walkthrough", form, { headers })
    .catch(handleError);
  return unwrap<{ asset_id: string }>(res);
}

/** Unified host onboarding status (requires JWT) */
export async function getHostMe(token?: string | null): Promise<HostMeStatus> {
  const headers = token ? { Authorization: `Bearer ${token}` } : getAuthHeaders();
  const res = await client.get("/stays/host/me", { headers }).catch(handleError);
  return unwrap<HostMeStatus>(res);
}

/** Submit unified host onboarding (requires JWT) */
export async function submitHostOnboarding(
  body: SubmitHostOnboardingBody,
  token?: string | null
): Promise<HostVerificationStatus> {
  const headers = token ? { Authorization: `Bearer ${token}` } : getAuthHeaders();
  const res = await client
    .post("/stays/host/onboarding", body, { headers })
    .catch(handleError);
  return unwrap<HostVerificationStatus>(res);
}

/** Normalize GET /host/verification (status vs application_status). */
export function normalizeHostVerificationStatus(
  raw: HostVerificationStatus & Record<string, unknown>,
): HostVerificationStatus {
  const applicationStatus =
    (raw.application_status as string | undefined) ??
    (raw.status as string | undefined);
  const hostVerification = raw.host_verification_status as string | undefined;
  let status = raw.status as HostVerificationStatus["status"] | undefined;
  if (!status || status === "NOT_STARTED") {
    if (
      applicationStatus === "PENDING" ||
      applicationStatus === "APPROVED" ||
      applicationStatus === "REJECTED"
    ) {
      status = applicationStatus as HostVerificationStatus["status"];
    } else if (
      hostVerification === "PENDING" ||
      hostVerification === "APPROVED" ||
      hostVerification === "REJECTED"
    ) {
      status = hostVerification as HostVerificationStatus["status"];
    } else {
      status = "NOT_STARTED";
    }
  }
  return {
    ...raw,
    status,
    application_status: applicationStatus,
  };
}

/** Get host verification status (requires JWT) */
export async function getHostVerification(
  token?: string | null
): Promise<HostVerificationStatus> {
  const headers = token ? { Authorization: `Bearer ${token}` } : getAuthHeaders();
  const res = await client
    .get("/stays/host/verification", { headers })
    .catch(handleError);
  return normalizeHostVerificationStatus(unwrap<HostVerificationStatus>(res));
}

/** Submit host verification (requires JWT) */
export async function submitHostVerification(
  body: SubmitHostVerificationBody,
  token?: string | null
): Promise<HostVerificationStatus> {
  const headers = token ? { Authorization: `Bearer ${token}` } : getAuthHeaders();
  const res = await client
    .post("/stays/host/verification", body, { headers })
    .catch(handleError);
  return unwrap<HostVerificationStatus>(res);
}

/** Upload host ID document front (requires JWT) */
export async function uploadHostDocumentFront(
  file: File,
  token?: string | null
): Promise<{ asset_id: string }> {
  const headers = token ? { Authorization: `Bearer ${token}` } : getAuthHeaders();
  const form = new FormData();
  form.append("file", file);
  const res = await client
    .post("/stays/host/verification/documents/front", form, { headers })
    .catch(handleError);
  return unwrap<{ asset_id: string }>(res);
}

/** Upload host ID document back (requires JWT) */
export async function uploadHostDocumentBack(
  file: File,
  token?: string | null
): Promise<{ asset_id: string }> {
  const headers = token ? { Authorization: `Bearer ${token}` } : getAuthHeaders();
  const form = new FormData();
  form.append("file", file);
  const res = await client
    .post("/stays/host/verification/documents/back", form, { headers })
    .catch(handleError);
  return unwrap<{ asset_id: string }>(res);
}

/** Upload occupant ID document for booking verification (requires JWT) */
export async function uploadOccupantIdDocument(
  file: File,
  side: "front" | "back",
  token?: string | null
): Promise<{ asset_id: string }> {
  const headers = token ? { Authorization: `Bearer ${token}` } : getAuthHeaders();
  const form = new FormData();
  form.append("file", file);
  form.append("side", side);
  const res = await client
    .post("/stays/bookings/occupants/upload-id", form, { headers })
    .catch(handleError);
  return unwrap<{ asset_id: string }>(res);
}

/** Upload host selfie (requires JWT) */
export async function uploadHostSelfie(
  file: File,
  token?: string | null
): Promise<{ asset_id: string }> {
  const headers = token ? { Authorization: `Bearer ${token}` } : getAuthHeaders();
  const form = new FormData();
  form.append("file", file);
  const res = await client
    .post("/stays/host/verification/documents/selfie", form, { headers })
    .catch(handleError);
  return unwrap<{ asset_id: string }>(res);
}

/** List reviews for a listing (public) */
export async function getListingReviews(
  listingId: string,
  params?: { page?: number; limit?: number; sort?: ReviewSort }
): Promise<ListingReviewsResponse> {
  const q = new URLSearchParams();
  if (params?.page) q.set("page", String(params.page));
  if (params?.limit) q.set("limit", String(params.limit));
  if (params?.sort) q.set("sort", params.sort);
  const res = await client
    .get(`/stays/listings/${listingId}/reviews?${q.toString()}`)
    .catch(handleError);
  return unwrap<ListingReviewsResponse>(res);
}

/** Get review for a booking (guest) */
export async function getBookingReview(
  bookingId: string,
  token?: string | null
): Promise<StaysReviewDetail | null> {
  const headers = token ? { Authorization: `Bearer ${token}` } : getAuthHeaders();
  const res = await client
    .get(`/stays/bookings/${bookingId}/review`, { headers })
    .catch(handleError);
  const data = unwrap<StaysReviewDetail | null>(res);
  return data ?? null;
}

/** Submit a review */
export async function createReview(
  body: {
    bookingId: string;
    rating: number;
    comment?: string;
    assetIds?: string[];
  },
  token?: string | null
): Promise<StaysReviewDetail> {
  const headers = token ? { Authorization: `Bearer ${token}` } : getAuthHeaders();
  const res = await client
    .post("/stays/reviews", body, { headers })
    .catch(handleError);
  return unwrap<StaysReviewDetail>(res);
}

/** Legacy: submit review by booking path */
export async function submitBookingReview(
  bookingId: string,
  body: { rating: number; comment?: string },
  token?: string | null
): Promise<StaysReviewDetail> {
  const headers = token ? { Authorization: `Bearer ${token}` } : getAuthHeaders();
  const res = await client
    .post(`/stays/bookings/${bookingId}/review`, body, { headers })
    .catch(handleError);
  return unwrap<StaysReviewDetail>(res);
}

/** Edit a review within 48h */
export async function updateReview(
  reviewId: string,
  body: { rating?: number; comment?: string; assetIds?: string[] },
  token?: string | null
): Promise<StaysReviewDetail> {
  const headers = token ? { Authorization: `Bearer ${token}` } : getAuthHeaders();
  const res = await client
    .patch(`/stays/reviews/${reviewId}`, body, { headers })
    .catch(handleError);
  return unwrap<StaysReviewDetail>(res);
}

/** Upload review photo (max 10MB, jpg/png/webp) */
export async function uploadReviewPhoto(
  file: File,
  token?: string | null
): Promise<{ asset_id: string }> {
  const headers = token ? { Authorization: `Bearer ${token}` } : getAuthHeaders();
  const form = new FormData();
  form.append("file", file);
  const res = await client
    .post("/stays/reviews/media/photo", form, { headers })
    .catch(handleError);
  return unwrap<{ asset_id: string }>(res);
}

export const staysApi = {
  searchListings,
  getListing,
  createBooking,
  getBooking,
  getHostMe,
  getHostVerification,
  getHostStats,
  submitHostOnboarding,
  getHostListings,
  getHostListingById,
  updateHostListing,
  pauseHostListing,
  resumeHostListing,
  createHostListing,
  uploadListingPhoto,
  uploadListingWalkthrough,
  submitHostVerification,
  uploadHostDocumentFront,
  uploadHostDocumentBack,
  uploadHostSelfie,
  uploadOccupantIdDocument,
  getListingReviews,
  getBookingReview,
  createReview,
  submitBookingReview,
  updateReview,
  uploadReviewPhoto,
  getReviewMediaUrl,
};
