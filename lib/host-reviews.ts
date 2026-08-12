import type {
  HostReviewSummary,
  HostReviewsResponse,
  ReviewSort,
} from "@/lib/stays-types";

export const HOST_REVIEWS_DEFAULT_PAGE = 1;
export const HOST_REVIEWS_DEFAULT_LIMIT = 20;
export const HOST_REVIEWS_MAX_LIMIT = 50;
export const HOST_REVIEWS_DEFAULT_SORT: ReviewSort = "newest";

export const HOST_REVIEW_SORT_ORDER: ReviewSort[] = [
  "newest",
  "highest",
  "lowest",
];

/** Clamp limit to backend contract [1, 50]. */
export function clampHostReviewsLimit(limit?: number): number {
  const raw = Number.isFinite(limit) ? Number(limit) : HOST_REVIEWS_DEFAULT_LIMIT;
  return Math.min(HOST_REVIEWS_MAX_LIMIT, Math.max(1, Math.trunc(raw)));
}

export function normalizeHostReviewsPage(page?: number): number {
  const raw = Number.isFinite(page) ? Number(page) : HOST_REVIEWS_DEFAULT_PAGE;
  return Math.max(1, Math.trunc(raw));
}

export function parseHostReviewSort(
  raw?: string | null,
): ReviewSort {
  if (raw === "highest" || raw === "lowest" || raw === "newest") return raw;
  return HOST_REVIEWS_DEFAULT_SORT;
}

/** Build query path for GET /stays/host/reviews (no hostId). */
export function buildHostReviewsPath(opts?: {
  page?: number;
  limit?: number;
  sort?: ReviewSort | string | null;
}): string {
  const page = normalizeHostReviewsPage(opts?.page);
  const limit = clampHostReviewsLimit(opts?.limit);
  const sort = parseHostReviewSort(opts?.sort);
  const q = new URLSearchParams();
  q.set("page", String(page));
  q.set("limit", String(limit));
  q.set("sort", sort);
  return `/stays/host/reviews?${q.toString()}`;
}

export function isHostReviewsEmpty(payload: Pick<HostReviewsResponse, "reviews" | "total">): boolean {
  return payload.total === 0 && payload.reviews.length === 0;
}

export function hostReviewsTotalPages(total: number, limit: number): number {
  const safeLimit = clampHostReviewsLimit(limit);
  if (total <= 0) return 0;
  return Math.ceil(total / safeLimit);
}

export function hostReviewsHasPrevious(page: number): boolean {
  return normalizeHostReviewsPage(page) > 1;
}

export function hostReviewsHasNext(page: number, limit: number, total: number): boolean {
  const p = normalizeHostReviewsPage(page);
  const l = clampHostReviewsLimit(limit);
  return p * l < total;
}

/** Backend distribution_pct values are fractions in [0, 1]. */
export function distributionPctAsPercent(fraction: number | undefined): number {
  if (!Number.isFinite(fraction)) return 0;
  return Math.round(Number(fraction) * 1000) / 10;
}

export function formatHostReviewDate(iso: string, locale: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function emptyHostReviewSummary(): HostReviewSummary {
  return {
    overall_avg_rating: null,
    total_count: 0,
    distribution_pct: { "5": 0, "4": 0, "3": 0, "2": 0, "1": 0 },
  };
}

export type HostReviewsViewState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "empty"; summary: HostReviewSummary }
  | {
      kind: "ready";
      summary: HostReviewSummary;
      reviews: HostReviewsResponse["reviews"];
      page: number;
      limit: number;
      total: number;
    };

/** Distinguish API failure from an empty host review inbox. */
export function deriveHostReviewsViewState(args: {
  loading: boolean;
  error: string | null;
  payload: HostReviewsResponse | null;
}): HostReviewsViewState {
  if (args.error) {
    return { kind: "error", message: args.error };
  }
  if (args.loading && !args.payload) {
    return { kind: "loading" };
  }
  if (!args.payload) {
    return { kind: "loading" };
  }
  if (isHostReviewsEmpty(args.payload)) {
    return { kind: "empty", summary: args.payload.summary };
  }
  return {
    kind: "ready",
    summary: args.payload.summary,
    reviews: args.payload.reviews,
    page: args.payload.page,
    limit: args.payload.limit,
    total: args.payload.total,
  };
}
