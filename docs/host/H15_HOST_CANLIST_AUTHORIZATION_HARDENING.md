# H15 — Host `canList` / Authorization Hardening

## Status

**COMPLETE · EXISTING API + BACKEND AUTHORIZATION HARDENING · IMPLEMENTATION DONE**

**Upstream:** H13 P1 AuthZ drift (deferred); H14 UI honesty (`5f37cf9`) unchanged.  
**Repos:** stays service monorepo (`nexastays_backend`).  
**Document home:** `nexastays_web/docs/host/` (H-series continuity).

---

## 1. Executive Verdict

Listing create/submit authorization in the **live stays** service used a **weaker** eligibility check than the domain onboarding rule.

| Path | Before H15 | After H15 |
| ---- | ---------- | --------- |
| `HostOnboardingService.canList` | APPROVED + verification APPROVED + !frozen | **Unchanged (authoritative)** |
| `HostsService.canList` (stays) | `isApprovedHost` only (`application_status === APPROVED`) | **Delegates to** `HostOnboardingService.canList` |
| `HostListingsService.assertCanList` | Called `hostsService.canList` (weak) | Same caller; now inherits strong rule |
| Identity legacy `HostsService.canList` | Already delegated to onboarding `canList` | No change required |

**Root cause:** Staysservice façade duplicated a shortened check; identity legacy had already been corrected.

**Fix:** Single source of truth — `HostsService.canList` → `HostOnboardingService.canList`.

**API:** No new endpoints.  
**Database:** None.  
**Frontend:** None (per H15 scope lock; UX gate via `getHostMe.can_create_listing` remains slightly softer — documented below).

---

## 2. Current Authorization Contract (LOCKED)

A host may create or submit listings only when:

```text
application_status === 'APPROVED'
AND host_verification_status === 'APPROVED'
AND listing_frozen !== true
```

**Evidence locking this rule**

1. `HostOnboardingService.canList` already encoded the triad.  
2. `approve()` sets **both** `application_status` and `host_verification_status` to `APPROVED`.  
3. `reject()` sets both to `REJECTED`.  
4. Docs (`kyc-onboarding-status-domains.md`, `host-account-architecture.md`) treat verification APPROVED as list prerequisite.  
5. Admin freeze sets `listing_frozen = true` with “can still book” messaging — list denial expected.  
6. Identity legacy `HostsService` already delegated to onboarding `canList`.

`isApprovedHost` remains **application APPROVED only** — intentionally weaker — and must **not** gate listing mutations.

---

## 3. Before

```text
Host create/submit
  → HostListingsService.assertCanList
    → HostsService.canList
      → HostOnboardingService.isApprovedHost
        → application_status === APPROVED only

Bypass: APPROVED + (PENDING/REJECTED verification) OR APPROVED + listing_frozen
  could still pass HostsService.canList while HostOnboardingService.canList denied.
```

Frozen hosts were only denied if a separate profile fetch after canList=false hit the frozen branch — but with weak canList, **frozen + APPROVED application returned true** and never reached the frozen message.

---

## 4. After

```text
Host create/submit
  → HostListingsService.assertCanList
    → HostsService.canList
      → HostOnboardingService.canList
        → APPROVED ∧ verification APPROVED ∧ !listing_frozen
```

Existing BadRequestException messages preserved (frozen vs verification required).

---

## 5. Caller Matrix

| Caller | Uses | Mutation? | H15 impact |
| ------ | ---- | --------- | ---------- |
| `HostListingsService.assertCanList` | `hostsService.canList` | Yes (create, submit / legacy create) | **Fixed** via façade |
| `HostListingsService.createListing` | assertCanList | Yes | Fixed |
| `HostListingsService.submitListing` | assertCanList | Yes | Fixed |
| `HostListingsService.createListingLegacy` | createListing → assertCanList | Yes | Fixed |
| `HostsService.isHostVerified` | `isApprovedHost` | No listing gate | Unchanged (not listing eligibility) |
| `GET /stays/host/me` `can_create_listing` | APPROVED ∧ !frozen (skips verification) | Signal only | **Deferred** UX alignment (not mutation) |
| Admin freeze/unfreeze | Sets `listing_frozen` | Admin | Unchanged |
| Guest/public reads | Ownership/N/A | No | Unchanged |

`updateListing` / `pauseListing` / `resumeListing` use **`requireOwnedListing` only** (not `canList`). Freeze does not currently block edit/pause of existing inventory. Documented as remaining risk (INFO/P2 product), not expanded in H15.

---

## 6. Eligibility Matrix

| application_status | host_verification_status | listing_frozen | Expected |
| ------------------ | ------------------------ | -------------- | -------- |
| APPROVED | APPROVED | false | **ALLOW** |
| APPROVED | APPROVED | true | **DENY** |
| APPROVED | PENDING | false | **DENY** |
| APPROVED | REJECTED | false | **DENY** |
| PENDING | APPROVED | false | **DENY** |
| REJECTED | APPROVED | false | **DENY** |
| DRAFT | PENDING | false | **DENY** |
| (no profile) | — | — | **DENY** |

Supported enum values from entity/types: application `NOT_STARTED|DRAFT|PENDING|APPROVED|REJECTED`; verification `PENDING|APPROVED|REJECTED` (API may surface `NOT_STARTED` when no profile).

---

## 7. Ownership / IDOR Result

`HostListingsService.requireOwnedListing`:

- Missing listing → `NotFoundException`
- Other owner → `ForbiddenException('You do not own this listing')`

Verified in `host-listings.canlist.spec.ts` via `pauseListing` for Host A → listing owned by Host B.

Note: `bola-listings.spec.ts` mirrors a **stricter existence-hiding** NotFound pattern that does **not** match current production service (Forbidden). Classified **INFO** — not changed in H15.

---

## 8. Admin / System Exceptions

| Actor | Behavior |
| ----- | -------- |
| Admin freeze/unfreeze | Intentionally mutates `listing_frozen` |
| Admin approve/reject | Sets application + verification together |
| Schedulers / public explore | Do not use host `canList` |
| Host booking as guest | Unaffected (“can still book”) |

No new role system.

---

## 9. API Decision

# EXISTING API + BACKEND AUTHORIZATION HARDENING

No `GET /stays/host/can-list`. External routes unchanged; authorization behavior for create/submit tightened.

---

## 10. Database Changes

**NONE**

---

## 11. Frontend

**NONE** in H15 (scope lock: backend-only).  
UX may still read weaker `can_create_listing` from `/host/me` until a later thin alignment (recommended H16 note).

---

## 12. Tests

Commands (from `backend/stays`):

```bash
npx jest --runInBand \
  src/modules/stays/hosts/hosts.service.spec.ts \
  src/modules/stays/hosts/host-onboarding.service.spec.ts \
  src/modules/stays/services/host-listings.canlist.spec.ts \
  src/modules/stays/security/bola-listings.spec.ts
```

**Result:** 4 suites, **20 tests passed**.

Coverage includes:

- HostsService delegates to onboarding `canList` (not `isApprovedHost`)
- Eligibility matrix DENY/ALLOW cases
- Direct create/submit denial when `canList` false (no transaction)
- Frozen-specific create error
- Cross-host pause IDOR Forbidden

---

## 13. Files Changed (backend)

| File | Change |
| ---- | ------ |
| `stays/.../hosts/hosts.service.ts` | `canList` → onboarding `canList` |
| `stays/.../hosts/hosts.service.spec.ts` | **New** façade tests |
| `stays/.../hosts/host-onboarding.service.spec.ts` | Matrix regression tests |
| `stays/.../services/host-listings.canlist.spec.ts` | **New** create/submit/IDOR tests |

Web: this documentation file only.

---

## 14. Remaining Risks / Deferred

1. **`getHostMe.can_create_listing` / `can_publish_listing`** still `APPROVED && !frozen` (verification skipped) — UX signal drift; not a mutation bypass after H15.  
2. **update / pause / resume** not gated by `canList` — frozen host may still edit owned listings. Product decision for H16/H17.  
3. **`bola-listings.spec` vs production Forbidden** mismatch — INFO.  
4. Identity legacy already correct — no change.  
5. Roadmap: H16 UX/mobile/RTL/i18n · H17 production security/regression · H18 release gate.

---

## 15. Implementation confirmation

- No new API  
- No schema changes  
- No KYC/Identity redesign  
- No H14 UI changes  
- Authorization drift between HostsService and HostOnboardingService **closed** for listing create/submit

**H15 COMPLETE — HOST AUTHORIZATION HARDENED**
