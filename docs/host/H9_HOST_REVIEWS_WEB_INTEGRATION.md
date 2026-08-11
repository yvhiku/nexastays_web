# H9 — Host Reviews Web Integration

**Status:** IMPLEMENTED (web-only)  
**Upstream:** [H8 — Host Reviews Audit](./H8_HOST_REVIEWS_AUDIT.md)

## Endpoint consumed

`GET /stays/host/reviews?page={page}&limit={limit}`

- JWT Bearer only (no `hostId`)
- Host identity from authenticated token
- Returns **PUBLISHED** reviews only
- Web client: `getHostReviews(token, { page, limit })` in `lib/stays-api.ts`
- Default `page=1`, `limit=20`, clamped to max **50**

## Response contract (as consumed)

```ts
{
  reviews: Array<{
    id: string;
    listing_id: string;
    listing_title: string;
    guest_name: string;
    rating: number;
    comment: string;
    created_at: string; // ISO
  }>;
  summary: {
    overall_avg_rating: number | null;
    total_count: number;
    distribution_pct: { "5"|"4"|"3"|"2"|"1": number }; // fractions 0–1
  };
  page: number;
  limit: number;
  total: number;
}
```

## Route

`/[locale]/host/reviews`

- Same `ProtectedRoute` + approved-host gate pattern as the dashboard
- Locale-aware navigation via `localePath`

## UX behavior

| Area | Behavior |
| ---- | -------- |
| Summary | Uses backend `summary` only (never recalculated from the current page) |
| Distribution | Uses `summary.distribution_pct` |
| List | Guest name, rating, listing title, comment, date |
| Pagination | Server-side via `page` / `limit` / `total` |
| Empty | `reviews.length === 0` and `total === 0` |
| Error | Distinct from empty; retry control |
| Dashboard | H3 KPI unchanged; **View reviews** CTA → `/host/reviews` |

## i18n / RTL

- Namespace: `hostReviews.*` (+ `hostDashboard.viewReviews`)
- EN / FR / AR key parity enforced in tests
- Logical CSS (`-ms-2`, `text-end`, `rtl:rotate-180` on back arrow)
- Star order remains 5→1 (not mirrored incorrectly)

## Explicit non-goals

- Host replies / respond UI
- Unread / needs-response counts or badges
- Fake sample reviews or response data
- Listing filter (`listing_id` not supported by current backend)
- Backend / H3 / H7 analytics changes
- H5/H6 redesign beyond the dashboard CTA
