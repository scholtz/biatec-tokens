# Canonical Flow Definition

## Overview

This document defines the single canonical path for token creation in Biatec, establishes route hierarchy, and specifies redirect policies for legacy routes. The canonical flow is the authoritative source of truth for all product decisions, test coverage, and UX work related to token creation.

---

## Canonical Route: `/launch/guided`

**`/launch/guided` is the primary and only supported token creation flow.**

All other creation-related routes are considered legacy and must redirect to this canonical path.

### Why This Route Is Canonical

1. **Product alignment:** The guided launch flow reflects the email/password-first, backend-deployment model described in the business roadmap.
2. **Compliance-first design:** `/launch/guided` enforces the compliance checklist sequence required for MICA-aligned token issuance.
3. **UX clarity:** A single path eliminates confusion for non-crypto-native issuers who encounter multiple entry points.
4. **Testability:** A single canonical route allows deterministic E2E test coverage of the complete creation journey.
5. **Analytics:** All funnel metrics (completion rate, drop-off point, time-to-first-token) can be measured against one path.

---

## Legacy Route Policy

### Routes That Must Redirect to `/launch/guided`

| Legacy Route | Status | Action |
|-------------|--------|--------|
| `/create` | **Deprecated** | 301 redirect → `/launch/guided` |
| `/create/wizard` | **Deprecated** | 301 redirect → `/launch/guided` |
| `/token/new` | **Deprecated** | 301 redirect → `/launch/guided` |
| `/launch/wizard` | **Deprecated** | 301 redirect → `/launch/guided` |
| `/issue` | **Deprecated** | 301 redirect → `/launch/guided` |

### Redirect Implementation

In the Vue Router configuration (`src/router/index.ts`):

```typescript
// Legacy route redirects
{
  path: '/create',
  redirect: '/launch/guided',
},
{
  path: '/create/wizard',
  redirect: '/launch/guided',
},
{
  path: '/create/:pathMatch(.*)*',
  redirect: '/launch/guided',
},
```

### Compatibility Guarantees

- **All legacy links remain functional:** Existing bookmarks, shared URLs, and marketing links using `/create` will continue to work via redirect.
- **Query parameters are preserved where relevant:** If a legacy URL includes a referral code or campaign parameter (`?ref=X`), it is passed through the redirect.
- **No user-visible 404 errors:** Any user arriving via an old creation URL lands on the guided flow, not an error page.
- **Redirect is permanent (301):** Signals to search engines that `/launch/guided` is the canonical destination.

---

## Route Hierarchy

```
/launch/                       → Launch Hub (overview)
/launch/guided                 → Canonical Token Creation Flow (PRIMARY)
/launch/guided/step-1          → Organization & Token Details
/launch/guided/step-2          → Compliance Configuration
/launch/guided/step-3          → Investor Whitelist Setup
/launch/guided/review          → Pre-Launch Review
/launch/guided/confirm         → Deployment Confirmation
/launch/status                 → Deployment Status Monitor
/launch/history                → Past Launch History

/tokens/                       → Token Management Dashboard
/tokens/:id                    → Individual Token Detail
/tokens/:id/compliance         → Token Compliance Status
/tokens/:id/investors          → Investor Management
```

### Route Ownership

| Route | Owner Component | Auth Required |
|-------|----------------|---------------|
| `/launch/guided` | `GuidedTokenLaunch.vue` | ✅ Yes |
| `/launch/status` | `DeploymentStatus.vue` | ✅ Yes |
| `/tokens` | `TokenDashboard.vue` | ✅ Yes |

---

## When to Deviate from Canonical Flow

The canonical flow `/launch/guided` is designed for first-time and standard token issuance. The following scenarios may result in a different path, but these are exceptions — not alternatives:

### Accepted Deviations

| Scenario | Deviation | Resolution |
|----------|-----------|------------|
| **Resuming a draft** | User navigates directly to a specific step from a saved draft | Resume from last completed step within `/launch/guided` — not a separate route |
| **Enterprise API integration** | Large issuer using API to create tokens programmatically | API endpoint only; no alternative frontend route |
| **Admin token creation** | Biatec staff creates token on behalf of customer | Admin panel route (not customer-facing) |
| **Token copy/duplicate** | User duplicates an existing token configuration | Redirects to `/launch/guided` with pre-populated fields via query params |

### Not Accepted Deviations

- Creating a separate `/create` wizard for "advanced users" — this fragments the product
- Maintaining `/create` as a parallel route with different features — this splits test coverage
- Linking to creation from marketing pages using any path other than `/launch/guided`

---

## Criteria for Modifying the Canonical Flow

Any change to the canonical flow requires:

1. **Product Owner approval** — the canonical flow is a product decision, not a UI preference
2. **Impact assessment** — all existing E2E tests for `/launch/guided` must pass after the change
3. **Analytics tracking** — new step requires funnel tracking event definition before implementation
4. **Documentation update** — this document must be updated to reflect the change
5. **Migration path** — if removing or reordering a step, describe how in-progress drafts are handled

---

## Integration Points

### Navigation
- Navbar "Create Token" link → `/launch/guided`
- Dashboard "Issue New Token" CTA → `/launch/guided`
- Empty state CTAs on token list → `/launch/guided`
- Post-deployment "Issue Another Token" → `/launch/guided`

### Analytics Events
All analytics events for the creation flow use the prefix `launch_guided_`:
- `launch_guided_started`
- `launch_guided_step_completed`
- `launch_guided_abandoned`
- `launch_guided_completed`
- `launch_guided_deployed`

### Auth Guard
The canonical flow route is protected by the standard auth guard. Unauthenticated users are redirected to `/?showAuth=true` with the return path preserved:
```
/?showAuth=true&returnPath=/launch/guided
```

After authentication, the user is returned to `/launch/guided` automatically.

---

## Compliance Sequence Within Canonical Flow

The canonical flow enforces this step sequence — steps cannot be skipped:

```
Step 1: Organization Profile        (can_proceed: always)
Step 2: Token Type Selection        (can_proceed: step 1 complete)
Step 3: Token Parameters            (can_proceed: step 2 complete)
Step 4: Compliance Checklist        (can_proceed: step 3 complete)
Step 5: Investor Whitelist          (can_proceed: step 4 ≥ 80% complete, required items done)
Step 6: Pre-Launch Review           (can_proceed: all required items complete)
Step 7: Deploy                      (can_proceed: step 6 review confirmed)
```

Users may navigate **backward** freely within the sequence to revise earlier steps.  
Users may not skip forward past the step where blocking requirements are unmet.

---

*Last updated: 2025 | Product Architecture*
