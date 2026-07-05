# Nexa Stays Web Public – Potential Bugs & Issues

> Audit of known problems, edge cases, and areas for improvement.  
> Last updated: March 2025

---

## 1. Potential Bugs

### Auth & Registration

| Issue | Location | Description |
|-------|----------|-------------|
| `userId` "pending" stored as real ID | `app/login/page.tsx:86` | Login stores `otp_session_token` with `userId: "pending"`. Logic treating `userId` as UUID can break. |
| `getUserIdFromToken` on non-JWT | `app/login/page.tsx:14-19` | `otp_session_token` is not a JWT; parsing as JWT for `sub` can throw or return null. |
| `completeRegistration` with wrong token | `app/registration/page.tsx:137-139` | For users with `access_token` from `verifyOtp`, `completeRegistration(access_token)` is called but expects `otp_session_token`. Errors are caught and ignored. |
| `getCurrentUser` with `otp_session_token` | `lib/kyc-api.ts:27-34` | KYC API uses `Bearer {token}`. When token is `otp_session_token`, `/users/me` may return 401. `getCurrentUser` returns `null` on error without distinguishing token type. |

### Data Handling

| Issue | Location | Description |
|-------|----------|-------------|
| `parseInt` on invalid `guests` | `app/listings/page.tsx:87` | `parseInt(searchParams.get("guests")!, 10)` can produce `NaN` if `guests` is invalid; passed to `searchListings`. |
| `parseInt` without validation | `app/listings/[id]/page.tsx:172` | `parseInt(e.target.value, 10)` for guests can produce `NaN`. |

### Host Flow

| Issue | Location | Description |
|-------|----------|-------------|
| Host step 2 uses password auth | `app/host/page.tsx:351-352` | Step 2 has password fields but app uses OTP/PIN. Data is never used or sent; misleading UX. |

---

## 2. Error Handling Gaps

### Silent Failures

- **`getCurrentUser`** – Swallows all errors and returns `null`. Callers cannot tell 401 from network error or other issues.
- **`completeRegistration`** – Errors are ignored in try/catch; users may think registration succeeded when it did not.
- **auth-api** – No global error handling; Axios errors propagate; message extraction is duplicated across callers.

### Inconsistent Error Extraction

- Different patterns: login (`response?.data?.message`), registration (nested checks), host (generic messages).
- Some paths use only `err.message`; others prefer `response.data.message`.

### Missing Error Boundaries

- No React error boundary; uncaught errors can crash the whole app.

---

## 3. Edge Cases Not Handled

### Auth

- No refresh of expired tokens; no `refresh_token` usage.
- No handling of 401 on protected routes; APIs fail and callers show generic errors.
- `AuthProvider` returns `null` until `ready`, causing a flash of empty content.
- No distinction between JWT and `otp_session_token` in auth context.

### Forms & Input

- **Search** – No date checks (checkout before checkin, past dates).
- **Listings** – Guests can be 0 or negative via URL params.
- **Registration** – No email format validation despite `*`; nationality "OTHER" with no extra flow.
- **Contact** – Required fields not validated; no backend submission.

### Bookings

- `checkout` can be before `checkin`; only `min` is used.
- No validation that checkout is after checkin.
- `max_guests` on listing is not enforced before creating a booking.

### KYC

- File type restricted to `image/*`; no size or content checks.
- CNIE back required only when `idType === "CNIE"`; other flows may be incomplete.
- No handling of `kyc_status === "REJECTED"` in the registration UI.

---

## 4. Security Concerns

| Issue | Description |
|-------|-------------|
| **Token storage** | Tokens in `localStorage`; exposed to XSS, not HttpOnly. |
| **API base URL** | Defaults to `http://127.0.0.1:3000`; production must set `NEXT_PUBLIC_API_BASE_URL`. |
| **Document number** | `btoa(docNumber).slice(0, 64)` is not a secure hash; Base64 is reversible (`app/host/page.tsx:322`). |
| **Route protection** | No middleware or route guards; pages rely on in-page redirects. |
| **Contact form** | No CSRF protection for forms. |
| **CORS / API headers** | No explicit handling of CORS or API security headers in the frontend. |

---

## 5. UX Issues

### Feedback

- No loading indicator on home search submission.
- Contact form "Send Message" does nothing; no success/error feedback.
- Host identity verification shows "upload coming soon" with no alternative path.
- Registration step 4 shows "Verification submitted" even when `completeRegistration` fails.

### Navigation & Redirects

- Booking page shows "Failed to load" instead of redirecting unauthenticated users to login.
- Registration redirect URL can contain nested redirects (`/login?redirect=/registration?redirect=...`), which may be fragile.

### Consistency

- Listings default filter is "Apartment" while the first pill is "All"; initial view is filtered but looks like "All".
- "My Stays" in NavBar points to `/listings` instead of a user-specific bookings page.
- Phone formatting varies ("+212 6 XX XX XX XX" vs raw input).

### Accessibility

- Some form labels use `htmlFor`; others rely on proximity.
- Error messages often lack `aria-live` or `role="alert"`.
- No skip links or robust keyboard navigation for modals/dropdowns.

---

## 6. API Integration Issues

### auth-api

- Response shape assumed via `res.data?.data ?? res.data`; fragile if backend changes.
- No timeout or retry configuration.
- `verifyPin` exists but is unused in the flow.

### kyc-api

- `jsonClient` may be used before definition; order can cause subtle issues depending on bundling.
- `getAuthHeaders()` runs only in browser; SSR will send no auth headers.
- No centralized logic for "token type" vs "endpoint"; mixing JWT and `otp_session_token` is error-prone.

### stays-api

- `unwrap` assumes `data` or `data.data`; no handling of pagination or alternative structures.
- `handleError` rethrows as `Error`; original status codes and details are lost.
- No rate limiting or retry on 429/5xx.

### General

- No shared axios instance with interceptors for auth, 401 handling, or base config.
- No logging or monitoring for failed requests.

---

## 7. Missing Validations

| Field | Issue |
|-------|-------|
| **Phone** | Only `length >= 10`; no format or country validation. |
| **Email** | Required (`*`) but no format validation. |
| **Date of birth** | No age or date-range checks. |
| **ID number** | No format or length checks. |
| **File uploads** | No size limits (e.g. 5MB), MIME checks, or basic validation. |
| **Check-in/out** | No rule that checkout > checkin or that both are in the future. |

### Host Flow

- Step 2: required fields not validated or submitted.
- Step 4: document type required; ID number optional; document uploads not implemented.
- Steps 5–10: placeholder content; no validation on forms or state.

---

## 8. Inconsistencies

| Area | Description |
|------|-------------|
| **Auth model** | Login: OTP + PIN. Host step 2: password-based signup. Registration: KYC only; no PIN setup in this flow. |
| **Token semantics** | "token" can mean JWT `access_token` or `otp_session_token`; same `localStorage` key; logic does not distinguish. |
| **API response handling** | Different patterns: `res.data?.data ?? res.data`, `unwrap()`, direct `res.data`. |
| **Error messages** | Different shapes: `message`, `error`, nested paths. |
| **Type safety** | `params.id as string` used without validation in listings/booking pages. |
| **Storage key** | `nexa_access_token` holds both JWT and `otp_session_token`. |

---

## Summary

| Category | Count |
|----------|-------|
| Potential bugs | 8+ |
| Error handling gaps | 6+ |
| Edge cases | 12+ |
| Security concerns | 6+ |
| UX issues | 9+ |
| API integration issues | 8+ |
| Missing validations | 10+ |
| Inconsistencies | 6+ |

### Highest Impact Areas

1. Auth/registration token handling (JWT vs `otp_session_token`).
2. Silent API failures (`getCurrentUser`, `completeRegistration`).
3. Lack of route protection and middleware.
4. Insecure handling of document numbers in host flow.
5. Date and guest validation for search and bookings.
