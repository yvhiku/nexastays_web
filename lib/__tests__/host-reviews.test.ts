import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  HOST_REVIEWS_DEFAULT_LIMIT,
  HOST_REVIEWS_MAX_LIMIT,
  buildHostReviewsPath,
  clampHostReviewsLimit,
  deriveHostReviewsViewState,
  distributionPctAsPercent,
  hostReviewsHasNext,
  hostReviewsHasPrevious,
  hostReviewsTotalPages,
  isHostReviewsEmpty,
  normalizeHostReviewsPage,
} from "../host-reviews";

const read = (path: string) => readFileSync(path, "utf8");

function flattenKeys(obj: unknown, prefix = ""): string[] {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return [];
  const out: string[] = [];
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      out.push(...flattenKeys(v, path));
    } else {
      out.push(path);
    }
  }
  return out;
}

describe("host-reviews helpers", () => {
  it("builds the host reviews path with page and limit and never includes hostId", () => {
    assert.equal(
      buildHostReviewsPath({ page: 2, limit: 20 }),
      "/stays/host/reviews?page=2&limit=20",
    );
    assert.equal(
      buildHostReviewsPath(),
      `/stays/host/reviews?page=1&limit=${HOST_REVIEWS_DEFAULT_LIMIT}`,
    );
    assert.doesNotMatch(buildHostReviewsPath({ page: 1, limit: 10 }), /hostId|host_id|listing_id/);
  });

  it("clamps limit to backend max of 50", () => {
    assert.equal(clampHostReviewsLimit(999), HOST_REVIEWS_MAX_LIMIT);
    assert.equal(clampHostReviewsLimit(0), 1);
    assert.equal(clampHostReviewsLimit(20), 20);
    assert.equal(normalizeHostReviewsPage(0), 1);
  });

  it("detects empty inbox vs paginated pages", () => {
    assert.equal(
      isHostReviewsEmpty({
        reviews: [],
        total: 0,
      }),
      true,
    );
    assert.equal(
      isHostReviewsEmpty({
        reviews: [],
        total: 25,
      }),
      false,
    );
  });

  it("paginates using server total/limit", () => {
    assert.equal(hostReviewsTotalPages(45, 20), 3);
    assert.equal(hostReviewsHasPrevious(1), false);
    assert.equal(hostReviewsHasPrevious(2), true);
    assert.equal(hostReviewsHasNext(1, 20, 45), true);
    assert.equal(hostReviewsHasNext(3, 20, 45), false);
  });

  it("treats distribution_pct as fractions", () => {
    assert.equal(distributionPctAsPercent(0.6), 60);
    assert.equal(distributionPctAsPercent(0), 0);
  });

  it("derives loading, error, empty, and ready states separately", () => {
    assert.equal(
      deriveHostReviewsViewState({ loading: true, error: null, payload: null }).kind,
      "loading",
    );
    assert.equal(
      deriveHostReviewsViewState({
        loading: false,
        error: "boom",
        payload: null,
      }).kind,
      "error",
    );
    assert.equal(
      deriveHostReviewsViewState({
        loading: false,
        error: null,
        payload: {
          reviews: [],
          summary: {
            overall_avg_rating: null,
            total_count: 0,
            distribution_pct: { "5": 0, "4": 0, "3": 0, "2": 0, "1": 0 },
          },
          page: 1,
          limit: 20,
          total: 0,
        },
      }).kind,
      "empty",
    );
    const ready = deriveHostReviewsViewState({
      loading: false,
      error: null,
      payload: {
        reviews: [
          {
            id: "r1",
            listing_id: "l1",
            listing_title: "Riad",
            guest_name: "Sara",
            rating: 5,
            comment: "Great",
            created_at: "2026-08-01T12:00:00.000Z",
          },
        ],
        summary: {
          overall_avg_rating: 5,
          total_count: 1,
          distribution_pct: { "5": 1, "4": 0, "3": 0, "2": 0, "1": 0 },
        },
        page: 1,
        limit: 20,
        total: 1,
      },
    });
    assert.equal(ready.kind, "ready");
    if (ready.kind === "ready") {
      assert.equal(ready.reviews.length, 1);
      assert.equal(ready.summary.overall_avg_rating, 5);
    }
  });
});

describe("host-reviews web integration (source)", () => {
  it("stays-api exposes getHostReviews against /stays/host/reviews", () => {
    const source = read("lib/stays-api.ts");
    assert.match(source, /export async function getHostReviews/);
    assert.match(source, /buildHostReviewsPath/);
    assert.match(source, /getHostReviews,/);
    assert.doesNotMatch(source, /getHostReviews[\s\S]{0,400}hostId/);
  });

  it("types match H8 host review contract without reply/unread fields", () => {
    const source = read("lib/stays-types.ts");
    assert.match(source, /export interface HostReview\b/);
    assert.match(source, /export interface HostReviewSummary\b/);
    assert.match(source, /export interface HostReviewsResponse\b/);
    assert.match(source, /distribution_pct/);
    const hostReviewBlock = source.slice(
      source.indexOf("export interface HostReview "),
      source.indexOf("export interface HostReviewSummary"),
    );
    assert.doesNotMatch(hostReviewBlock, /response|unread|needs_response|sub_ratings/);
  });

  it("review UI renders summary, list, empty, error, pagination markers", () => {
    const page = read("components/host/HostReviewsPage.tsx");
    const summary = read("components/host/HostReviewsSummary.tsx");
    const card = read("components/host/HostReviewCard.tsx");
    const pagination = read("components/host/HostReviewPagination.tsx");

    assert.match(page, /getHostReviews\(/);
    assert.match(page, /hostReviews\.emptyTitle/);
    assert.match(page, /hostReviews\.retry/);
    assert.match(page, /ErrorAlert/);
    assert.match(summary, /distribution_pct/);
    assert.match(summary, /overall_avg_rating/);
    assert.match(card, /listing_title/);
    assert.match(card, /guest_name/);
    assert.match(card, /created_at/);
    assert.match(pagination, /onPageChange/);
    assert.match(pagination, /hostReviews\.previous/);
    assert.match(pagination, /hostReviews\.next/);

    for (const source of [page, summary, card, pagination]) {
      assert.doesNotMatch(
        source,
        /needs.?response|unread_reviews|Reply|Respond|response_rate|Waiting for your response/i,
      );
      assert.doesNotMatch(source, /\bm[lr]-|\b[lp][lr]-|\bleft-|\bright-/);
    }
  });

  it("dashboard CTA navigates to locale-aware /host/reviews", () => {
    const snapshot = read("components/host/HostBusinessSnapshot.tsx");
    const dashboard = read("app/[locale]/host/dashboard/page.tsx");
    assert.match(snapshot, /localePath\(\s*["']\/host\/reviews["']\s*\)/);
    assert.match(snapshot, /hostReviews\.viewReviews/);
    assert.match(dashboard, /localePath=\{localePath\}/);
    assert.match(read("app/[locale]/host/reviews/page.tsx"), /HostReviewsPage/);
  });

  it("keeps EN/FR/AR hostReviews key parity", () => {
    const en = JSON.parse(read("lib/i18n/locales/en.json"));
    const fr = JSON.parse(read("lib/i18n/locales/fr.json"));
    const ar = JSON.parse(read("lib/i18n/locales/ar.json"));
    const enKeys = flattenKeys(en.hostReviews).sort();
    const frKeys = flattenKeys(fr.hostReviews).sort();
    const arKeys = flattenKeys(ar.hostReviews).sort();
    assert.deepEqual(frKeys, enKeys);
    assert.deepEqual(arKeys, enKeys);
    assert.ok(enKeys.includes("viewReviews"));
    assert.ok(enKeys.includes("emptyTitle"));
    assert.ok(en.hostDashboard.viewReviews);
    assert.ok(fr.hostDashboard.viewReviews);
    assert.ok(ar.hostDashboard.viewReviews);
  });
});
