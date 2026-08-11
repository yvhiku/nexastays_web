# H11 — Host Analytics Web Integration

**Status:** IMPLEMENTED (web-only)  
**Upstream:** [H7 audit](./H7_HOST_PROPERTY_PERFORMANCE_AUDIT.md), `backend/stays/docs/host-analytics-api.md` (H10)

## Route

`/[locale]/host/analytics?period={period}`

- Default period: `this_month` (omitted from URL when default)
- Supported: `this_month` | `previous_month` | `all_time` | `next_30d`
- Same `ProtectedRoute` + approved-host gate as reviews/dashboard
- Dashboard CTAs: hero + business snapshot → analytics

## API consumed

`GET /stays/host/analytics?period=…` via `getHostAnalytics(token, { period })`

- JWT only — no `hostId`
- Frontend types mirror H10 nested DTO (`HostAnalyticsResponse`)

## Frontend behavior

| Area | Behavior |
| ---- | -------- |
| Period selector | Four H10 periods; updates URL + refetch |
| Summary | Presentation sums of property rows (no invented formulas; no occupancy average) |
| Properties | Desktop table + mobile cards |
| Money | Backend gross / net / fees / payouts only |
| Occupancy | Display `occupancy.value`; footnote `BOOKED_NIGHTS_OVER_PERIOD_DAYS_V1` |
| `all_time` occupancy | `null` → localized **N/A** (never `0%`) |
| Reviews | avg + count; CTA to `/host/reviews` |
| Charts | None (H10 has no series) |

## Explicit non-goals

- Backend/H10 contract changes  
- Custom date ranges / `last_30_days`  
- Charts, ADR, occupancy-block math  
- Review replies / unread  
- H5/H6/H9 redesign beyond navigation CTAs  
- Fake/mock analytics data  
