# End-to-End Tests with Playwright

This directory contains Playwright end-to-end tests for the Biatec Tokens application.

## Authentication Model

**Email/Password Only - No Wallet Connectors**

This application uses an **auth-first** approach with email and password authentication. There are no wallet connectors (MetaMask, WalletConnect, Pera, Defly, etc.) in the MVP user experience.

### Canonical Auth Pattern: Use the `withAuth` Helper

**All E2E tests must use the canonical auth helper** from `e2e/helpers/auth.ts`:

```typescript
import { withAuth, suppressBrowserErrors, setupAuthAndNavigate } from './helpers/auth'

test.beforeEach(async ({ page }) => {
  suppressBrowserErrors(page)
  await withAuth(page)  // ← canonical pattern — validates ARC76 contract before seeding
})
```

The `withAuth()` helper:
1. Validates the session object against the **ARC76 session contract** before seeding
2. Throws immediately if the session is malformed (fail-fast during test setup)
3. Uses `addInitScript` so auth state is available before the page loads
4. Is the only officially supported auth setup pattern

**Do NOT use raw `localStorage.setItem('algorand_user', ...)` in tests**. Always use `withAuth()` instead.

### ARC76 Session Contract

Every session seeded in E2E tests must have these fields:

```typescript
{
  address: string      // Non-empty ARC76-derived address
  email: string        // Non-empty user email
  isConnected: boolean // Must be true for protected routes
}
```

The contract is validated by `validateARC76Session()` in `src/utils/arc76SessionContract.ts`. The same validation logic is also used by the router guard, so any mismatch between tests and runtime is caught by the unit tests in `src/utils/__tests__/arc76SessionContract.test.ts`.

### Backend Auth Readiness: `loginWithCredentials` for Critical Journeys

For **critical path specs** (auth-first launch, compliance flows, ARC76 validation, token creation), use
`loginWithCredentials()` instead of `withAuth()`. This helper attempts a real backend login when
`API_BASE_URL` is set, falling back to contract-validated localStorage seeding in CI without a backend.

```typescript
import { loginWithCredentials, suppressBrowserErrors } from './helpers/auth'

// In a critical journey spec (e.g., compliance-auth-first.spec.ts)
test.beforeEach(async ({ page }) => {
  suppressBrowserErrors(page)
})

test('should allow access to compliance dashboard', async ({ page }) => {
  await loginWithCredentials(page, 'user@example.com') // real auth when backend available
  await page.goto('/compliance/dashboard')
  // ...
})
```

`loginWithCredentials` parameters:
- `email` — optional; defaults to `TEST_USER_EMAIL` env var or `e2e-test@biatec.io`
- `password` — optional; defaults to `TEST_USER_PASSWORD` env var or empty string
- `API_BASE_URL` env var controls the backend base URL (default: `http://localhost:3000`)

When `API_BASE_URL` resolves to a live backend that returns HTTP 200 with `{ address, email }`,
`loginWithCredentials` validates the response against the ARC76 contract and seeds localStorage
identically to `withAuth()`. All subsequent test assertions remain identical.

**When to use which helper:**

| Spec type | Recommended helper |
|---|---|
| Critical journey (auth, compliance, token creation) | `loginWithCredentials()` |
| Isolated UI-only test (no backend dependency) | `withAuth()` |
| Guest / unauthenticated test | `clearAuthScript()` + `clearAuth()` |
| **Strict sign-off lane** | `loginWithCredentialsStrict()` (see below) |

### Strict Backend Sign-off Lane: `loginWithCredentialsStrict`

The **strict sign-off lane** is the highest-fidelity testing tier. It is designed to provide
real-backend Playwright evidence for product MVP sign-off.

**Key difference from `loginWithCredentials`:**
`loginWithCredentials` falls back to localStorage seeding when the backend is unavailable.
`loginWithCredentialsStrict` **FAILS (throws)** instead of falling back — ensuring tests
cannot silently pass through a non-production shortcut.

```typescript
import { loginWithCredentialsStrict, isStrictBackendMode } from './helpers/auth'

// Used ONLY in mvp-backend-signoff.spec.ts
test('backend auth produces valid session', async ({ page }) => {
  test.skip(!isStrictBackendMode(), 'Strict backend sign-off requires BIATEC_STRICT_BACKEND=true')

  // FAILS (throws) if backend is unavailable — never silently falls back
  await loginWithCredentialsStrict(page)
  // ...
})
```

**Activating the strict sign-off lane:**

```bash
# Run against a live staging backend
BIATEC_STRICT_BACKEND=true \
API_BASE_URL=https://staging.biatec.io \
TEST_USER_EMAIL=signoff@biatec.io \
TEST_USER_PASSWORD=<secret> \
npx playwright test e2e/mvp-backend-signoff.spec.ts
```

**What happens without these env vars:**
All tests in `mvp-backend-signoff.spec.ts` skip with a clear message. Standard CI is unaffected.

**Sign-off spec file:** `e2e/mvp-backend-signoff.spec.ts`

| Feature | Status |
|---|---|
| No broad `suppressBrowserErrors()` | ✅ Genuine errors surface as failures |
| No localStorage fallback | ✅ Throws on backend unavailability |
| Real backend deployment endpoint check | ✅ Verifies endpoint reachability |
| Wallet UI absence after real auth | ✅ Asserts no WalletConnect/MetaMask/Pera/Defly |
| Wrong-credentials rejection | ✅ Verifies backend returns 4xx |

### Error Suppression Policy

| Helper | Where used | What it suppresses |
|---|---|---|
| `suppressBrowserErrors()` | Permissive tests (isolated UI, component validation) | ALL browser console errors and page errors |
| `suppressBrowserErrorsNarrow()` | Blocker-facing sign-off specs | Only known CI-safe patterns (Vite HMR, Vue devtools warnings) |
| _(none)_ | `mvp-backend-signoff.spec.ts` strict lane + strict lane tests in `backend-deployment-contract.spec.ts` | Nothing — all errors surface as failures |

**AC #4 compliance:** All blocker-facing suites use `suppressBrowserErrorsNarrow()` instead of the
broad suppressor. This ensures genuine application regressions surface as test failures rather than
being silently masked.

**Blocker-facing suites using narrow suppressor** (as of Issue #588):
- `mvp-sign-off-hardening.spec.ts` ✅
- `mvp-signoff-readiness.spec.ts` ✅
- `mvp-stabilization.spec.ts` ✅
- `mvp-deterministic-journey.spec.ts` ✅
- `backend-deployment-contract.spec.ts` (permissive lane) ✅

**Strict lane (no suppressor at all):**
- `mvp-backend-signoff.spec.ts` — strict auth sign-off tests
- `backend-deployment-contract.spec.ts` — strict deployment contract tests

### Clearing Auth State

```typescript
import { clearAuth, clearAuthScript } from './helpers/auth'

// In beforeEach (before any page.goto) — use addInitScript-based version:
await clearAuthScript(page)

// After page.goto (page already loaded) — use evaluate-based version:
await clearAuth(page)
```

## Running Tests

### Prerequisites

First, install Playwright browsers (only needed once or in CI):

```bash
npx playwright install
```

### Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run tests in UI mode (interactive)
npm run test:e2e:ui

# Run tests with browser visible
npm run test:e2e:headed

# Debug tests
npm run test:e2e:debug

# View test report
npm run test:e2e:report
```

## Canonical Route Policy

**Every test must use `/launch/guided` as the canonical token creation route.**

| Route | Status | Behaviour |
|-------|--------|-----------|
| `/launch/guided` | ✅ **Canonical** | Primary token creation entry point. Auth-required. |
| `/create` | ✅ Supported | Advanced token creator. Auth-required. |
| `/create/wizard` | ⛔ Deprecated | **Redirects to `/launch/guided`**. Must not appear as a primary CTA or nav link. |

**Rules:**
1. No test may use `/create/wizard` as the *expected* landing route — only as the *source* of a redirect test.
2. Navigation links in the nav bar must point to `/launch/guided`, not `/create/wizard`.
3. If you encounter a test that asserts `/create/wizard` is the canonical route, that test is wrong and must be updated.

**Redirect compatibility is tested separately** in `wizard-redirect-compat.spec.ts`
(the ONLY permitted location for `/create/wizard` redirect tests — maximum 3 tests).

## Testing Posture — What is Backend-Backed vs Mocked

| Test category | Backend required? | How auth is done | File(s) |
|---|---|---|---|
| **Strict sign-off lane** | ✅ YES — fails if backend unavailable | `loginWithCredentialsStrict()` | `mvp-backend-signoff.spec.ts`, strict lane in `backend-deployment-contract.spec.ts` |
| Critical journey (blocker spec) | Optional — falls back | `loginWithCredentials()` | `mvp-sign-off-hardening.spec.ts`, `mvp-stabilization.spec.ts`, `mvp-signoff-readiness.spec.ts`, `mvp-deterministic-journey.spec.ts` |
| Isolated UI / component | ❌ NO — localStorage seeding | `withAuth()` | Most other spec files |
| Guest / unauthenticated | ❌ NO — no auth | `clearAuthScript()` | Various |

## What Blocker-Grade Playwright Evidence Now Proves

This section states precisely what a green CI run — with the strict sign-off lane
active — demonstrates about the product. It is the authoritative record for product,
engineering, and enterprise stakeholder review.

### Strict sign-off lane (`BIATEC_STRICT_BACKEND=true`)

When `BIATEC_STRICT_BACKEND=true` and `API_BASE_URL` points to a live staging backend,
the following claims are proven by machine-verifiable E2E evidence. All assertions are
**fail-closed** — there are no permissive early-return paths. Missing evidence fails the gate loudly.

| Claim | Spec file | Fail behavior if missing |
|---|---|---|
| Email/password login produces a valid ARC76 session via real HTTP — no localStorage fallback | `mvp-backend-signoff.spec.ts` | `loginWithCredentialsStrict()` throws — test fails immediately |
| Wrong credentials are correctly rejected by the backend (not just frontend validation) | `mvp-backend-signoff.spec.ts` | `expect(response.ok()).toBe(false)` fails if backend accepts bad creds |
| A real backend session allows access to `/launch/guided` (route guard accepts real token) | `mvp-backend-signoff.spec.ts` | `expect(heading).toBeVisible()` fails if page not rendered |
| Navigation for an authenticated user shows no wallet connector UI | `mvp-backend-signoff.spec.ts` | Wallet brand regex assertion fails |
| Unauthenticated access to `/launch/guided` is redirected even after strict auth cleared | `mvp-backend-signoff.spec.ts` | `expect(redirectedAway || authFormVisible).toBe(true)` fails |
| Bearer token is present in auth response (required for deployment API calls) | `mvp-backend-signoff.spec.ts` | `[STRICT SIGN-OFF FAILURE]` — test fails if auth response missing token field |
| POST `/initiate` endpoint is reachable and returns `deploymentId` | `mvp-backend-signoff.spec.ts` | `[STRICT SIGN-OFF FAILURE]` — network error or non-200/201/409 response fails test |
| GET `/status/{id}` returns valid lifecycle state immediately after initiation | `mvp-backend-signoff.spec.ts` | `[STRICT SIGN-OFF FAILURE]` — status endpoint unreachable fails test |
| Terminal state (`Completed` or `Failed`) is reached within the 60s polling window | `mvp-backend-signoff.spec.ts` | `[STRICT SIGN-OFF FAILURE]` — terminal not reached fails test |
| `Completed` terminal state surfaces `assetId` (authoritative on-chain evidence) | `mvp-backend-signoff.spec.ts` | `[STRICT SIGN-OFF FAILURE]` — missing assetId fails test |
| `Failed` terminal state surfaces `userGuidance` (actionable operator messaging) | `mvp-backend-signoff.spec.ts` | `[STRICT SIGN-OFF FAILURE]` — missing guidance fails test |
| POST `/validate` endpoint is reachable and returns `isDeterministicAddress` | `mvp-backend-signoff.spec.ts` | `[STRICT SIGN-OFF FAILURE]` — endpoint unreachable or missing field fails test |
| POST `/validate` returns `isValid` boolean | `mvp-backend-signoff.spec.ts` | `[STRICT SIGN-OFF FAILURE]` — missing field fails test |
| User email from real backend session matches the sign-off account (no placeholder) | `mvp-backend-signoff.spec.ts` | `expect(session.email).toBe(expectedEmail)` fails |
| Canonical routes (`/launch/guided`, `/compliance/setup`) render after real backend auth | `mvp-backend-signoff.spec.ts` | `expect(headingVisible).toBe(true)` fails |

**Note on failure message format:** Any assertion prefixed with `[STRICT SIGN-OFF FAILURE]`
in the Playwright output indicates a release blocker — not a flaky test or environment noise.
See the workflow artifact `strict-signoff-report-<run-id>` for traces and screenshots.

### Permissive lane (standard CI — no live backend required)

When running in the standard CI lane (no `BIATEC_STRICT_BACKEND`), the following claims
are proven through the permissive lane. These are meaningful for developer iteration and
pre-merge validation, but are NOT sufficient alone for enterprise sign-off:

| Claim | How it is tested | Limitation |
|---|---|---|
| Authenticated users see the Guided Launch form with progress bar and step indicator | Real Vue route navigation (`/launch/guided`) in `backend-deployment-contract.spec.ts` Suite 8 | Permissive lane only — auth is seeded via `loginWithCredentials()` (falls back to localStorage when no live backend). Does NOT require `BIATEC_STRICT_BACKEND=true`. |
| DeploymentStatusPanel data-testid anchors, role/aria attributes conform to contract | DOM injection in `backend-deployment-contract.spec.ts` Suites 1–3, 6–7 | Does NOT prove Vue component maps backend response shapes to DOM correctly |
| Component-level mapping (backend response → Vue props → DOM) is validated | Unit tests: `src/__tests__/DeploymentStatusPanel.test.ts` + `src/__tests__/integration/BackendDeploymentStatusWiring.integration.test.ts` | E2E layer delegates this to unit/integration tests |
| `/create/wizard` redirects to `/launch/guided` | `wizard-redirect-compat.spec.ts` | — |
| Protected routes reject unauthenticated users | Multiple blocker specs | Relies on localStorage seeding for auth state verification |
| No wallet connector UI appears in navigation | Multiple blocker specs + `backend-deployment-contract.spec.ts` | Uses seeded auth |
| Auth errors surface user-friendly messages, not raw codes | Multiple blocker specs | — |

### What this distinction means for stakeholder reviews

**For product sign-off**: A green CI run with `BIATEC_STRICT_BACKEND=true` is required.
The permissive lane alone is not sufficient because it can pass even if the real backend
auth or deployment endpoints are broken.

**For development iteration**: The permissive lane is the right feedback loop. It covers
UI contract regressions, route guard behavior, accessibility, and component rendering
without requiring a live backend — keeping CI fast and developer-friendly.

**For enterprise demos**: Use the strict sign-off lane output. It proves the actual
email/password flow, real token deployment lifecycle acceptance, and the absence of
wallet-connector UI in a way that is verifiable by non-technical stakeholders.

### What still depends on non-blocker test strategy

The following areas are currently covered by permissive lane, unit tests, or manual
verification — NOT by the strict E2E sign-off lane:

- **Full wizard form completion** through the UI with real form submission is not yet
  tested E2E. The strict lane validates API endpoint shapes; it does not navigate through
  the multi-step form UI.
- **Real-time status polling** (SSE/WebSocket push from backend to UI) is not covered.
- **Rollback and retry flows** are not covered in any lane.
- **Compliance evidence upload** through the UI is not covered.
- **Payment and subscription flows** are tested permissively; no strict backend lane exists.

### What is currently mocked

1. **Auth** — In permissive lane (standard CI): all E2E tests seed a validated session
   object into localStorage (`withAuth()` or `loginWithCredentials()` fallback). No real
   HTTP auth request is made unless `API_BASE_URL` resolves to a live backend.

2. **DeploymentStatusPanel component UI** — `backend-deployment-contract.spec.ts` Suites 1–3
   and 6–7 inject HTML elements into the page DOM to validate the component's data-testid
   anchors and ARIA attributes. These are UI contract tests, not integration tests.
   The actual Vue rendering pipeline for these states is validated by unit/integration tests.

3. **Real page navigation** — Suite 8 of `backend-deployment-contract.spec.ts` navigates to
   `/launch/guided` through the real Vue router and renders the real GuidedTokenLaunch
   component. This is NOT DOM injection — it exercises the actual application pipeline.

4. **Compliance flows** — Compliance spec tests validate the UI contract using component-
   rendered state. Backend API calls are not made in CI without a live backend.

### What requires a live backend (strict sign-off)

1. `mvp-backend-signoff.spec.ts` — requires `BIATEC_STRICT_BACKEND=true` and `API_BASE_URL`
   pointing to a live staging backend. All tests in this file skip without these env vars.

2. The deployment strict lane in `backend-deployment-contract.spec.ts` — same guards.
   These tests now cover the full lifecycle journey (initiate → poll → terminal state)
   rather than shallow endpoint reachability.

### Known gaps (follow-up work)

- Full wizard form completion through the UI with real form submission is not yet tested E2E.
- Real-time deployment status polling (SSE/WebSocket) is not covered.
- Rollback and retry flows are not covered.
- Compliance evidence upload through the UI is not covered.

## Test Structure

Tests are organized by feature:

**Strict sign-off lane (requires live backend):**
- `mvp-backend-signoff.spec.ts` - ⭐ Strict backend sign-off: real auth, no localStorage fallback, no broad error suppression

**MVP Blocker specs (CI-required, permissive auth):**
- `mvp-sign-off-hardening.spec.ts` - Canonical routes, auth confidence, accessibility, quality gates
- `mvp-stabilization.spec.ts` - Deterministic guided launch and compliance readiness
- `mvp-deterministic-journey.spec.ts` - MVP journey determinism and canonical routes
- `mvp-confidence-hardening.spec.ts` - Auth/deployment confidence hardening
- `mvp-signoff-readiness.spec.ts` - Sign-off readiness: canonical flow, auth contract, accessibility
- `backend-deployment-contract.spec.ts` - Deployment entry-point navigation (real Vue pipeline) + UI contract (DOM injection) + strict lifecycle lane (initiate→poll→terminal)

**Auth-first journey:**
- `auth-first-token-creation.spec.ts` - Auth-first journey and route guards (MVP critical)
- `confidence-hardening-deterministic.spec.ts` - Deterministic auth/nav state assertions (MVP CI gate)
- `auth-first-confidence-hardening.spec.ts` - Auth-first onboarding confidence (all entry points)
- `auth-first-issuance-workspace.spec.ts` - Canonical issuance workspace e2e flow
- `arc76-validation.spec.ts` - ARC76 account derivation and session persistence

**Feature specs:**
- `guided-token-launch.spec.ts` - Guided token launch flow (supported auth-first path)
- `compliance-orchestration.spec.ts` - KYC/AML compliance orchestration
- `compliance-dashboard.spec.ts` - Compliance dashboard and metrics
- `compliance-setup-workspace.spec.ts` - Compliance workspace setup
- `token-discovery-dashboard.spec.ts` - Token discovery and search
- `token-detail-view.spec.ts` - Individual token detail pages
- `whitelist-management-view.spec.ts` - MICA whitelist management
- `whitelist-jurisdiction.spec.ts` - Jurisdiction-based whitelist rules
- `team-management.spec.ts` - Team collaboration features
- `lifecycle-cockpit.spec.ts` - Token lifecycle monitoring
- `vision-insights-workspace.spec.ts` - Analytics and insights
- `navigation-parity-wcag.spec.ts` - Navigation parity and WCAG AA accessibility

**Redirect Compatibility (Isolated — not canonical path tests):**
- `auth-first-onboarding-closure.spec.ts` - Legacy route redirect coverage
- `route-determinism-ci-stable.spec.ts` - CI-stable redirect determinism

**Note:** Tests using `/create/wizard` as a *redirect source* are correct. Tests asserting `/create/wizard` is a canonical destination are **wrong and must be updated**.

## Writing Tests

### Best Practices

1. **Use Auth-First Pattern** - Set up localStorage auth before testing protected routes
2. **Use Semantic Waits** - Wait for specific elements, not arbitrary timeouts
3. **Use semantic selectors** like `getByRole()`, `getByText()`
4. **Test user behavior**, not implementation details
5. **Keep tests independent** - each test should be able to run standalone
6. **Use descriptive test names** that explain what is being tested
7. **AVOID arbitrary timeouts** - use `waitForLoadState()` and element visibility checks
8. **Test auth-first routing** - verify unauthenticated users are redirected appropriately

### ⚠️ CRITICAL: Avoid Arbitrary Timeouts

**❌ BAD PATTERN** - Brittle, slow, unclear failures:
```typescript
await page.goto('/cockpit')
await page.waitForLoadState('networkidle')
await page.waitForTimeout(10000) // "CI needs time" - arbitrary!

const title = page.getByRole('heading', { name: /Cockpit/i })
await expect(title).toBeVisible({ timeout: 45000 })
```

**✅ GOOD PATTERN** - Deterministic, fast, clear failures:
```typescript
await page.goto('/cockpit')
await page.waitForLoadState('networkidle')

// Wait for specific element - no arbitrary timeout needed
const title = page.getByRole('heading', { name: /Cockpit/i })
await expect(title).toBeVisible({ timeout: 45000 })
```

**Why This Matters**:
- **Fast systems**: No unnecessary 10s wait if element appears in 2s
- **Slow systems**: 45s timeout accommodates CI environment variance
- **Clear failures**: Error shows exactly which element didn't appear
- **Maintainable**: Test intent is clear

### Timeout Guidelines

**When to use `waitForTimeout`** (rarely):
- ✅ Animation/transition delays (300ms max)
- ✅ Debounced input (known timing, <1s)
- ❌ **NEVER** for page load or component mount
- ❌ **NEVER** for "CI needs time" scenarios

**Recommended timeout values**:
- Element visibility: `{ timeout: 45000 }` (CI-safe)
- User interactions: `{ timeout: 15000 }` (fast operations)
- Auth redirects: `{ timeout: 15000 }` (flexible URL checks)

**Why 45 seconds?**
- Local dev: Elements appear in 2-5 seconds
- CI environment: Auth init + component mount = 10-20 seconds
- Safety margin: 2x buffer for CI variability

### Example Test - Auth-First Pattern

```typescript
import { test, expect } from '@playwright/test';
import { withAuth, suppressBrowserErrors } from './helpers/auth';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // ✅ Use canonical helpers — never inline localStorage.setItem
    suppressBrowserErrors(page)
    await withAuth(page)  // validates ARC76 contract + seeds localStorage
  });

  test('should display protected page', async ({ page }) => {
    await page.goto('/protected-route');
    await page.waitForLoadState('networkidle');
    
    // ✅ Semantic wait - no arbitrary timeout
    const heading = page.getByRole('heading', { name: /Expected Title/i })
    await expect(heading).toBeVisible({ timeout: 45000 })
    
    // Test business logic
    // ...
  });

  test('should redirect unauthenticated user', async ({ page }) => {
    // Clear auth state — use clearAuthScript in beforeEach, clearAuth after goto
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.evaluate(() => localStorage.clear())
    
    // Try to access protected route
    await page.goto('/protected-route')
    await page.waitForLoadState('networkidle')
    
    // Flexible verification (CI-safe)
    const url = page.url()
    const urlHasAuthParam = url.includes('showAuth=true')
    const authModalVisible = await page.locator('form')
      .filter({ hasText: /email/i })
      .isVisible()
      .catch(() => false)
    
    expect(urlHasAuthParam || authModalVisible).toBe(true)
  });
});
```

### Auth Store Initialization in CI

**Problem**: Auth store initializes asynchronously in `main.ts`. In CI environments, this can take 10-20 seconds.

**Solution**: Use generous timeouts (45s) on first element visibility check instead of arbitrary upfront waits.

```typescript
// ❌ BAD: Arbitrary wait assumes fixed timing
await page.goto('/protected-route')
await page.waitForTimeout(10000) // Might not be enough in CI!

// ✅ GOOD: Semantic wait adapts to actual timing
await page.goto('/protected-route')
await page.waitForLoadState('networkidle')
const heading = page.getByRole('heading', { name: /Title/i })
await expect(heading).toBeVisible({ timeout: 45000 })
```

## Configuration

Tests are configured in `playwright.config.ts` at the project root.

Key settings:
- Base URL: `http://localhost:5173`
- Browsers: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- Web server auto-starts for tests
- Retries on CI: 2
- Screenshots on failure
- Traces on first retry

## CI/CD Integration

The frontend uses a **two-lane Playwright CI model**. The two lanes are independent — neither blocks the other.

### Lane 1: Permissive (Standard CI) — `playwright.yml`

Runs on every pull request and every push to `main` / `develop`.

- **Auth model**: `withAuth()` — seeds validated localStorage session; no live backend required
- **Purpose**: Fast developer feedback on UI regressions, accessibility, routing
- **Sign-off tests**: Skip gracefully (`BIATEC_STRICT_BACKEND` not set)

```bash
# Standard permissive lane
npm run test:e2e
```

### Lane 2: Strict Backend Sign-off Gate — `strict-signoff.yml`

Runs on push to `main` (for sign-off-related files) and on manual `workflow_dispatch`.

- **Auth model**: `loginWithCredentialsStrict()` — throws if backend unavailable; no localStorage fallback
- **Purpose**: Release-readiness evidence. Proves the real critical path works against a live backend.
- **Spec file**: `e2e/mvp-backend-signoff.spec.ts`
- **Fail behavior**: **Fail-closed** — no permissive early-return paths. Every required backend
  endpoint must be reachable, every response must include required lifecycle fields, and terminal
  state must be reached within the polling window. Silent "skip gracefully" paths have been removed.

#### Fail-Closed Behavior

All assertions in `mvp-backend-signoff.spec.ts` that enforce release sign-off requirements use
the prefix `[STRICT SIGN-OFF FAILURE]` in their failure message. This makes it easy to identify
genuine release-gate failures in CI artifacts and logs:

```
[STRICT SIGN-OFF FAILURE] /initiate endpoint unreachable at https://staging.biatec.io/...
[STRICT SIGN-OFF FAILURE] /initiate returned HTTP 400. Expected 200, 201, or 409.
[STRICT SIGN-OFF FAILURE] /initiate response missing required 'deploymentId' field.
[STRICT SIGN-OFF FAILURE] Deployment did not reach a terminal state within the 60s polling window.
[STRICT SIGN-OFF FAILURE] 'Completed' state is missing required 'assetId' field.
[STRICT SIGN-OFF FAILURE] 'Failed' state is missing the required 'error' object.
[STRICT SIGN-OFF FAILURE] /validate endpoint unreachable.
[STRICT SIGN-OFF FAILURE] /validate response missing required 'isDeterministicAddress' field.
```

If a test contains this prefix in its failure output, it is a release blocker — not a flaky test.

#### Environment Contract for the Strict Lane

The following environment variables are required for the strict lane to run. If any are missing,
the `strict-signoff.yml` workflow **fails at the prerequisites step** (not silently at test time):

| Variable | Source | Description |
|---|---|---|
| `BIATEC_STRICT_BACKEND` | Hardcoded `true` in workflow | Activates `loginWithCredentialsStrict()` and disables all localStorage fallbacks |
| `API_BASE_URL` | `SIGNOFF_API_BASE_URL` secret or `workflow_dispatch` input | Live staging backend URL — must NOT be localhost or empty |
| `TEST_USER_EMAIL` | `SIGNOFF_TEST_EMAIL` secret or `workflow_dispatch` input | Email of a provisioned sign-off test account |
| `TEST_USER_PASSWORD` | `SIGNOFF_TEST_PASSWORD` secret | Password for the sign-off test account |

Required repository secrets:

| Secret | Description |
|---|---|
| `SIGNOFF_API_BASE_URL` | Live staging backend URL (e.g. `https://staging.biatec.io`) |
| `SIGNOFF_TEST_EMAIL` | Email of a provisioned sign-off test account |
| `SIGNOFF_TEST_PASSWORD` | Password for the sign-off test account |

**Backend readiness requirements:** The sign-off backend must have these API endpoints deployed:
- `POST /api/auth/login` — returns `{ address, email, token }` (or `accessToken`/`access_token`)
- `POST /api/v1/backend-deployment-contract/initiate` — returns `{ deploymentId, state }`
- `GET /api/v1/backend-deployment-contract/status/{id}` — returns `{ deploymentId, state, assetId?, error? }`
- `POST /api/v1/backend-deployment-contract/validate` — returns `{ isValid, isDeterministicAddress }`

**Polling window:** The terminal-state test polls up to 12 attempts × 5s = 60 seconds.
If the deployment does not reach `Completed` or `Failed` within this window, the test fails.
This is a feature, not a bug — slow backends are a release quality issue.

To run the strict lane locally:

```bash
BIATEC_STRICT_BACKEND=true \
API_BASE_URL=https://staging.biatec.io \
TEST_USER_EMAIL=signoff@biatec.io \
TEST_USER_PASSWORD=<secret> \
npx playwright test e2e/mvp-backend-signoff.spec.ts --trace on
```

To trigger via GitHub Actions:
1. Navigate to **Actions → 🔒 Strict Backend Sign-off Gate**
2. Click **Run workflow** and optionally provide `api_base_url`, `test_user_email`, and a `reason`

For full documentation, see [`docs/implementations/STRICT_SIGNOFF_LANE.md`](../docs/implementations/STRICT_SIGNOFF_LANE.md).

### General CI setup

```bash
# Install dependencies
npm ci
# Install Playwright browsers
npx playwright install --with-deps chromium
# Run permissive E2E tests
npm run test:e2e
```

## Debugging

### Visual Debugging

```bash
# Run with browser visible
npm run test:e2e:headed

# Use Playwright Inspector
npm run test:e2e:debug
```

### Analyzing Failures

After a failed test run:

```bash
# View HTML report with screenshots and traces
npm run test:e2e:report
```

## Coverage Areas

Our E2E tests cover:

1. **Auth-First Authentication Flow** ⭐ MVP Critical
   - Unauthenticated users redirected to login
   - Authenticated users access protected routes
   - No wallet connector UI elements
   - Email/password authentication model
   - Session persistence across navigation

2. **Token Creation Journey**
   - Guided token launch flow (`/launch/guided`)
   - Advanced token creation (`/create`)
   - Compliance gating and eligibility checks
   - Step-by-step wizard navigation
   - Draft saving and restoration

3. **Compliance & Regulatory**
   - KYC document checklist
   - AML screening status
   - Compliance orchestration dashboard
   - MICA whitelist management
   - Jurisdiction-based rules

4. **Navigation & Routes**
   - Page navigation with auth guards
   - Route changes and deep linking
   - Back button behavior
   - Protected route redirects

5. **Dashboard & Discovery**
   - Token discovery and filtering
   - Token detail views
   - Lifecycle monitoring (cockpit)
   - Analytics and insights

6. **Error Handling**
   - API connection errors
   - Graceful degradation
   - User feedback messages
   - Form validation

7. **Responsive Design**
   - Mobile viewports
   - Tablet viewports
   - Desktop viewports
   - Adaptive navigation

8. **Accessibility**
   - Semantic HTML
   - ARIA labels
   - Keyboard navigation
   - Screen reader compatibility

**Note:** Wallet connection testing has been removed. This application uses email/password authentication only.

## Adding New Tests

When adding new features:

1. Create a new test file in `e2e/` directory
2. Name it `feature-name.spec.ts`
3. Follow the **auth-first pattern** shown above
4. Test critical user paths with authentication
5. Include negative test cases (error scenarios, unauthenticated access)
6. Test responsive behavior if UI changes
7. Verify no wallet-related UI appears
8. Update this README if adding new test categories

### Auth-First Testing Checklist

For any new protected route or feature:

- [ ] Test unauthenticated access redirects to login
- [ ] Test authenticated access shows correct content
- [ ] Verify no wallet/network selectors appear
- [ ] Test session persistence across navigation
- [ ] Verify email display in user menu (not wallet address)
- [ ] Test compliance gating if applicable

## Troubleshooting

### Tests Timing Out

Increase timeout in test:
```typescript
test('slow test', async ({ page }) => {
  test.setTimeout(60000); // 60 seconds
  // test code
});
```

### Element Not Found

Add explicit waits:
```typescript
await expect(element).toBeVisible({ timeout: 10000 });
```

### Flaky Tests

1. Add proper waits for async operations
2. Use `page.waitForLoadState('load')` — **NEVER** `'networkidle'` (Vite HMR SSE blocks it indefinitely in CI)
3. Avoid hard-coded `page.waitForTimeout()` — use `expect(element).toBeVisible()` instead
4. Use retry logic for assertions
5. For auth-required routes in CI, use `test.setTimeout(90000)` and explicit 30s timeouts on `goto()`
6. Use generous visibility timeouts (45000ms) for auth-guarded routes in CI environments

### Auth Store Initialization in CI

Auth-required routes need extra time in CI:
- Auth store initializes async in main.ts
- Component then mounts and renders
- Total CI time: 5-10 seconds minimum
- Use `test.setTimeout(90000)` for tests with auth-required routes
- Use explicit timeout on `goto({ timeout: 30000 })` and `waitForLoadState('load', { timeout: 30000 })`
- Then check for specific visible element with 45000ms timeout:
  ```typescript
  const heading = page.getByRole('heading', { name: /Expected Title/i, level: 1 })
  await expect(heading).toBeVisible({ timeout: 45000 })
  ```
- **DO NOT** use `page.waitForTimeout()` for auth initialization

## Deterministic Testing Guidelines

### Critical Patterns (ALWAYS use)

```typescript
// ✅ CORRECT: Semantic wait after navigation
await page.goto('/route')
await page.waitForLoadState('load')  // 'load' not 'networkidle'!
const heading = page.getByRole('heading', { name: /Page Title/i })
await expect(heading).toBeVisible({ timeout: 20000 })

// ✅ CORRECT: Auth-required route with proper budget
test('auth-required page', async ({ page }) => {
  test.setTimeout(90000)
  await withAuth(page)
  await page.goto('/launch/guided', { timeout: 30000 })
  await page.waitForLoadState('load', { timeout: 30000 })
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 45000 })
})

// ✅ CORRECT: Wallet pattern check uses word boundary for Pera
const navText = await getNavText(page)
expect(navText).not.toMatch(/WalletConnect|MetaMask|\bPera\b|Defly/i)
```

### Anti-Patterns (NEVER use)

```typescript
// ❌ WRONG: networkidle is blocked by Vite HMR SSE in CI
await page.waitForLoadState('networkidle')

// ❌ WRONG: arbitrary timeout
await page.waitForTimeout(5000)

// ❌ WRONG: bare /Pera/i matches "Operations" as substring
expect(navText).not.toMatch(/Pera/i)

// ❌ WRONG: broad wallet pattern matches product copy
expect(bodyText).not.toMatch(/connect.*wallet|wallet.*connect/i)
```

### Timeout Budget Rule

When using `test.setTimeout(90000)`, the sum of all action timeouts must be < 90s:
- `goto({ timeout: 15000 })` — Vite pre-warmed in CI: 2-5s actual, 15s budget
- `waitForLoadState('load', { timeout: 10000 })` — fires quickly: 10s budget
- `toBeVisible({ timeout: 30000 })` — element may need time: 30s budget
- `textContent({ timeout: 10000 })` — MUST have explicit timeout: 10s budget
- Total: 65s < 90s ✓

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)
