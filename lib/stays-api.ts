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
import { toAppError } from "./errors";
import type {
  SearchListingsParams,
  StaysListing,
  ExploreCard,
  ExploreListEnvelope,
  ExploreMapEnvelope,
  ExploreMapPin,
  MapBounds,
  CreateBookingDto,
  StaysBooking,
  HostVerificationStatus,
  HostVerificationPayload,
  HostMeStatus,
  SubmitHostOnboardingBody,
  SubmitHostVerificationBody,
  HostListingSummary,
  HostListingDetail,
  UpdateHostListingBody,
  HostBooking,
  HostDashboardStats,
  CreateHostListingBody,
  CreateDraftListingBody,
  ReplaceListingMediaBody,
  ReplaceListingUnitTypesBody,
  ListingReviewsResponse,
  StaysReviewDetail,
  ReviewSort,
} from "./stays-types";
import {
  sanitizeCityInput,
  sanitizeDateInput,
  sanitizeGuestCount,
} from "./input-sanitize";
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
    const e = err as AxiosError<{
      message?: string | string[];
      error?: string;
    }>;
    const raw = e.response?.data?.message ?? e.response?.data?.error;
    const code = Array.isArray(raw) ? raw[0] : raw;
    if (code === "ReviewNotAllowed") {
      throw new Error("You can only review after your stay is completed.");
    }
    if (code === "ReviewOwnListingNotAllowed") {
      throw new Error("You cannot review a stay at your own property.");
    }
    if (code === "ReviewAlreadyExists") {
      throw new Error("You have already reviewed this stay.");
    }
  }
  const app = toAppError(err);
  const e = new Error(
    app.title ? `${app.title}. ${app.message}` : app.message,
  ) as Error & { appError: ReturnType<typeof toAppError> };
  e.appError = app;
  throw e;
}

function buildExploreQuery(params: SearchListingsParams): URLSearchParams {
  const q = new URLSearchParams();
  const city = params.city ? sanitizeCityInput(params.city) : "";
  const checkin = params.checkin_date ? sanitizeDateInput(params.checkin_date) : "";
  const checkout = params.checkout_date ? sanitizeDateInput(params.checkout_date) : "";
  const guests = params.guests != null ? sanitizeGuestCount(params.guests) : undefined;
  if (city) q.set("city", city);
  if (checkin) q.set("checkin_date", checkin);
  if (checkout) q.set("checkout_date", checkout);
  if (guests != null) q.set("guests", String(guests));
  if (params.verified_walkthrough_only != null)
    q.set("verified_walkthrough_only", String(params.verified_walkthrough_only));
  if (params.instant_booking_only != null)
    q.set("instant_booking_only", String(params.instant_booking_only));
  if (params.listing_type) q.set("listing_type", params.listing_type);
  if (params.limit != null) q.set("limit", String(params.limit));
  if (params.cursor) q.set("cursor", params.cursor);
  if (params.sort) q.set("sort", params.sort);
  if (params.north != null) q.set("north", String(params.north));
  if (params.south != null) q.set("south", String(params.south));
  if (params.east != null) q.set("east", String(params.east));
  if (params.west != null) q.set("west", String(params.west));
  return q;
}

/** Map Explore card → StaysListing shape used by cards / legacy callers. */
export function exploreCardToListing(card: ExploreCard): StaysListing {
  return {
    id: card.id,
    title: card.title,
    listing_type: (card.listing_type as StaysListing["listing_type"]) || "APARTMENT",
    city: card.city,
    neighborhood: card.neighborhood,
    geo_lat: card.geo_lat,
    geo_lng: card.geo_lng,
    status: "LIVE",
    checkin_time: "14:00",
    checkout_time: "11:00",
    description: null,
    instant_booking: Boolean(card.instant_booking),
    rate_plan: card.price
      ? {
          base_price: card.price.base_price,
          cleaning_fee: 0,
          currency: card.price.currency || "MAD",
        }
      : null,
    media: [
      ...(card.cover
        ? [{ asset_id: card.cover.asset_id, kind: "PHOTO" as const }]
        : []),
      ...(card.has_walkthrough
        ? [{ asset_id: "walkthrough", kind: "WALKTHROUGH" as const }]
        : []),
    ],
    avg_rating: card.avg_rating,
    review_count: card.review_count,
  };
}

/** Explore list with opaque cursor pagination (canonical). */
export async function exploreListings(
  params: SearchListingsParams = {},
): Promise<ExploreListEnvelope> {
  const q = buildExploreQuery(params);
  const res = await client.get(`/stays/explore?${q.toString()}`).catch(handleError);
  const data = unwrap<ExploreListEnvelope>(res);
  if (!data || !Array.isArray(data.items)) {
    return {
      items: [],
      pagination: { next_cursor: null, has_more: false },
      meta: {
        query_ms: 0,
        sort: params.sort ?? "newest",
        cache: "miss",
        total_estimate: null,
      },
    };
  }
  return data;
}

/** Viewport map pins (requires bounds). */
export async function exploreMapPins(
  params: SearchListingsParams & MapBounds,
): Promise<ExploreMapEnvelope> {
  const q = buildExploreQuery(params);
  const res = await client
    .get(`/stays/explore/map?${q.toString()}`)
    .catch(handleError);
  const data = unwrap<ExploreMapEnvelope>(res);
  if (!data || !Array.isArray(data.items)) {
    return {
      items: [],
      bounds: {
        north: params.north,
        south: params.south,
        east: params.east,
        west: params.west,
      },
      truncated: false,
      meta: { query_ms: 0, cache: "miss" },
    };
  }
  return data;
}

export function mapPinToListing(pin: ExploreMapPin): StaysListing {
  return {
    id: pin.id,
    title: pin.title,
    listing_type: "APARTMENT",
    city: pin.city || "",
    neighborhood: pin.neighborhood ?? null,
    geo_lat: pin.geo_lat,
    geo_lng: pin.geo_lng,
    status: "LIVE",
    checkin_time: "14:00",
    checkout_time: "11:00",
    instant_booking: Boolean(pin.instant_booking),
    rate_plan: pin.price
      ? {
          base_price: pin.price.base_price,
          cleaning_fee: 0,
          currency: pin.price.currency || "MAD",
        }
      : null,
    rules: {
      max_guests: pin.max_guests ?? null,
      amenities: pin.has_wifi ? ["wifi"] : [],
    },
    media: [
      ...(pin.cover
        ? [{ asset_id: pin.cover.asset_id, kind: "PHOTO" as const }]
        : []),
      ...(pin.has_walkthrough
        ? [{ asset_id: "walkthrough", kind: "WALKTHROUGH" as const }]
        : []),
    ],
    avg_rating: pin.avg_rating ?? null,
    review_count: pin.review_count ?? 0,
    property_details:
      pin.bedrooms != null ? { bedroom_count: pin.bedrooms } : undefined,
  };
}

/** Search listings (public) — shim → Explore envelope, returns legacy array. */
export async function searchListings(
  params: SearchListingsParams,
): Promise<StaysListing[]> {
  const envelope = await exploreListings(params);
  return envelope.items.map(exploreCardToListing);
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

/** Blocked date ranges for a listing (booked / host-blocked nights). */
export async function getListingAvailability(
  listingId: string,
  from: string,
  to: string,
): Promise<{
  listing_id: string;
  from: string;
  to: string;
  blocked_ranges: Array<{
    checkin_date: string;
    checkout_date: string;
    source: "BOOKING" | "BLOCK";
  }>;
}> {
  const res = await client
    .get(`/stays/listings/${listingId}/availability`, {
      params: { from, to },
    })
    .catch(handleError);
  return unwrap(res);
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
  redirect_url?: string;
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

export type HostBookingsExportFilters = {
  period?: "last_30_days" | "this_year" | "all" | "custom";
  from?: string;
  to?: string;
  listing_id?: string;
  status?: string;
  format?: string;
};

/** Download host bookings CSV (requires JWT). Always returns a file (headers-only if empty). */
export async function exportHostBookingsCsv(
  token?: string | null,
  filters: HostBookingsExportFilters = {},
): Promise<void> {
  const headers = token ? { Authorization: `Bearer ${token}` } : getAuthHeaders();
  const params: Record<string, string> = {};
  if (filters.period) params.period = filters.period;
  if (filters.from) params.from = filters.from;
  if (filters.to) params.to = filters.to;
  if (filters.listing_id) params.listing_id = filters.listing_id;
  if (filters.status) params.status = filters.status;
  if (filters.format) params.format = filters.format;

  const res = await client
    .get("/stays/host/bookings/export", {
      headers,
      params,
      responseType: "blob",
    })
    .catch(async (err) => {
      if (axios.isAxiosError(err) && err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const parsed = JSON.parse(text) as { message?: string | string[] };
          const raw = parsed.message;
          const msg = Array.isArray(raw) ? raw[0] : raw;
          if (msg) throw new Error(msg);
        } catch (inner) {
          if (inner instanceof Error && inner.message && !(inner instanceof SyntaxError)) {
            throw inner;
          }
        }
      }
      return handleError(err);
    });

  const disposition = String(res.headers["content-disposition"] ?? "");
  const match = /filename="([^"]+)"/i.exec(disposition);
  const filename = match?.[1] || "nexa-bookings.csv";
  const blob = res.data instanceof Blob ? res.data : new Blob([res.data], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
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

/** Host block/unblock date range for a listing calendar. */
export async function setHostAvailabilityBlock(
  id: string,
  body: { from: string; to: string; is_blocked?: boolean },
  token?: string | null,
): Promise<{
  listing_id: string;
  from: string;
  to: string;
  is_blocked: boolean;
  nights: number;
}> {
  const headers = token ? { Authorization: `Bearer ${token}` } : getAuthHeaders();
  const res = await client
    .post(`/stays/host/listings/${id}/availability-blocks`, body, { headers })
    .catch(handleError);
  return unwrap(res);
}

export type ExternalCalendarProvider =
  | "AIRBNB"
  | "BOOKING"
  | "VRBO"
  | "GOOGLE"
  | "APPLE"
  | "DIRECT"
  | "OTHER";

export type ExternalCalendarDto = {
  id: string;
  listing_id: string;
  provider: ExternalCalendarProvider;
  label: string;
  ics_url: string;
  status: string;
  health: string;
  next_sync_at?: string;
  last_attempt_at?: string | null;
  last_successful_sync_at?: string | null;
  last_error?: string | null;
  sync_result?: {
    imported_events?: number;
    blocked_nights?: number;
    last_reservation?: { start: string; end: string } | null;
    not_modified?: boolean;
  } | null;
  history?: Array<{
    id: string;
    started_at: string;
    outcome: string;
    message?: string | null;
    blocked_nights?: number | null;
  }>;
};

export type CalendarSyncSummary = {
  calendar_id: string;
  outcome: string;
  imported_events: number;
  blocked_nights: number;
  last_reservation: { start: string; end: string } | null;
  message?: string;
};

export async function listExternalCalendars(
  listingId: string,
  token?: string | null,
): Promise<{
  listing_id: string;
  connected_calendars_count: number;
  calendars: ExternalCalendarDto[];
}> {
  const headers = token ? { Authorization: `Bearer ${token}` } : getAuthHeaders();
  const res = await client
    .get(`/stays/host/listings/${listingId}/external-calendars`, { headers })
    .catch(handleError);
  return unwrap(res);
}

export async function connectExternalCalendar(
  listingId: string,
  body: {
    provider: ExternalCalendarProvider;
    ics_url: string;
    label?: string;
    provider_listing_reference?: string;
  },
  token?: string | null,
): Promise<{ calendar: ExternalCalendarDto; sync: CalendarSyncSummary }> {
  const headers = token ? { Authorization: `Bearer ${token}` } : getAuthHeaders();
  const res = await client
    .post(`/stays/host/listings/${listingId}/external-calendars`, body, { headers })
    .catch(handleError);
  return unwrap(res);
}

export async function syncExternalCalendar(
  listingId: string,
  calendarId: string,
  token?: string | null,
): Promise<CalendarSyncSummary> {
  const headers = token ? { Authorization: `Bearer ${token}` } : getAuthHeaders();
  const res = await client
    .post(
      `/stays/host/listings/${listingId}/external-calendars/${calendarId}/sync`,
      {},
      { headers },
    )
    .catch(handleError);
  return unwrap(res);
}

export async function updateExternalCalendar(
  listingId: string,
  calendarId: string,
  body: { label?: string; status?: "ACTIVE" | "PAUSED" },
  token?: string | null,
): Promise<ExternalCalendarDto> {
  const headers = token ? { Authorization: `Bearer ${token}` } : getAuthHeaders();
  const res = await client
    .patch(
      `/stays/host/listings/${listingId}/external-calendars/${calendarId}`,
      body,
      { headers },
    )
    .catch(handleError);
  return unwrap(res);
}

export async function deleteExternalCalendar(
  listingId: string,
  calendarId: string,
  token?: string | null,
): Promise<{ deleted: boolean }> {
  const headers = token ? { Authorization: `Bearer ${token}` } : getAuthHeaders();
  const res = await client
    .delete(`/stays/host/listings/${listingId}/external-calendars/${calendarId}`, {
      headers,
    })
    .catch(handleError);
  return unwrap(res);
}

export async function getCalendarExport(
  listingId: string,
  token?: string | null,
): Promise<{ url: string; token: string }> {
  const headers = token ? { Authorization: `Bearer ${token}` } : getAuthHeaders();
  const res = await client
    .get(`/stays/host/listings/${listingId}/calendar-export`, { headers })
    .catch(handleError);
  return unwrap(res);
}

export async function regenerateCalendarExport(
  listingId: string,
  token?: string | null,
): Promise<{ url: string; token: string }> {
  const headers = token ? { Authorization: `Bearer ${token}` } : getAuthHeaders();
  const res = await client
    .post(
      `/stays/host/listings/${listingId}/calendar-export/regenerate`,
      {},
      { headers },
    )
    .catch(handleError);
  return unwrap(res);
}

/** Create DRAFT listing from property type (requires JWT, approved host) */
export async function createHostListing(
  body: CreateDraftListingBody | CreateHostListingBody,
  token?: string | null
): Promise<{ id: string; status: string; message: string }> {
  const headers = token ? { Authorization: `Bearer ${token}` } : getAuthHeaders();
  const res = await client
    .post("/stays/host/listings", body, { headers })
    .catch(handleError);
  return unwrap<{ id: string; status: string; message: string }>(res);
}

/** Submit DRAFT / REJECTED listing for admin review */
export async function submitHostListing(
  id: string,
  token?: string | null
): Promise<{ id: string; status: string; message: string }> {
  const headers = token ? { Authorization: `Bearer ${token}` } : getAuthHeaders();
  const res = await client
    .post(`/stays/host/listings/${id}/submit`, {}, { headers })
    .catch(handleError);
  return unwrap<{ id: string; status: string; message: string }>(res);
}

/** Replace all media on a draft/editable listing */
export async function replaceListingMedia(
  id: string,
  body: ReplaceListingMediaBody,
  token?: string | null
): Promise<HostListingDetail> {
  const headers = token ? { Authorization: `Bearer ${token}` } : getAuthHeaders();
  const res = await client
    .put(`/stays/host/listings/${id}/media`, body, { headers })
    .catch(handleError);
  return unwrap<HostListingDetail>(res);
}

/** Replace unit types (hotel/hostel rooms) */
export async function replaceListingUnitTypes(
  id: string,
  body: ReplaceListingUnitTypesBody,
  token?: string | null
): Promise<HostListingDetail> {
  const headers = token ? { Authorization: `Bearer ${token}` } : getAuthHeaders();
  const res = await client
    .put(`/stays/host/listings/${id}/unit-types`, body, { headers })
    .catch(handleError);
  return unwrap<HostListingDetail>(res);
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
  raw: HostVerificationPayload,
): HostVerificationStatus {
  const applicationStatus = raw.application_status;
  const hostVerification = raw.host_verification_status;
  const rawStatus = raw.status;

  const pickLifecycle = (...candidates: Array<string | undefined>) => {
    for (const c of candidates) {
      if (c === "PENDING" || c === "APPROVED" || c === "REJECTED") return c;
      if (c === "DRAFT" || c === "NOT_STARTED") return "NOT_STARTED";
    }
    return undefined;
  };

  const status = (pickLifecycle(
    applicationStatus,
    rawStatus,
    hostVerification,
  ) ?? "NOT_STARTED") as HostVerificationStatus["status"];

  return {
    ...raw,
    status,
    application_status: applicationStatus ?? status,
    rejection_reason:
      (raw.rejection_reason as string | null | undefined) ?? null,
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
  return normalizeHostVerificationStatus(
    unwrap<HostVerificationPayload>(res),
  );
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

/** Get review for a booking (guest). Returns null if none / not owned. */
export async function getBookingReview(
  bookingId: string,
  token?: string | null
): Promise<StaysReviewDetail | null> {
  const headers = token ? { Authorization: `Bearer ${token}` } : getAuthHeaders();
  try {
    const res = await client.get(`/stays/bookings/${bookingId}/review`, {
      headers,
    });
    return unwrap<StaysReviewDetail | null>(res) ?? null;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) {
      return null;
    }
    return handleError(err);
  }
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
  exploreListings,
  exploreMapPins,
  getListing,
  getListingAvailability,
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
  setHostAvailabilityBlock,
  createHostListing,
  submitHostListing,
  replaceListingMedia,
  replaceListingUnitTypes,
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
