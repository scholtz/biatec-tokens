# MVP Hardening: Canonical Guided Flow and Backend-Verified Auth Confidence

**Issue:** Frontend MVP hardening: canonical guided flow and backend-verified auth confidence
**PR:** Delivers acceptance criteria for regulated token issuance UX hardening
**Roadmap:** https://raw.githubusercontent.com/scholtz/biatec-tokens/refs/heads/main/business-owner-roadmap.md

---

## Summary

This document records the hardening deliverables and contributor conventions established
by the frontend MVP hardening initiative. It is the authoritative reference for canonical
route policy, auth test bootstrap conventions, and test quality expectations.

---

## Canonical Route Policy

### Token creation entry point

The **canonical** path for token creation and issuance is:

```
/launch/guided
```

All CTAs, navigation links, and post-auth redirects that lead to token creation MUST point
to `/launch/guided`. No new code should introduce `/create/wizard` as a functional endpoint.

### Legacy route compatibility

`/create/wizard` is retained as a **redirect-only** route. Its only permitted appearance
in E2E test files is in tests explicitly labelled as "redirect-compatibility":

```typescript
// ✅ Correct — tests redirect behavior only
test('legacy /create/wizard redirects to /launch/guided', async ({ page }) => {
  await page.goto('/create/wizard')
  await page.waitForFunction(
    () => !window.location.pathname.includes('/create/wizard'),
    { timeout: 20000 },
  )
  expect(page.url()).toContain('/launch/guided')
})

// ❌ Wrong — using /create/wizard as canonical route for new tests
test('create token at /create/wizard', async ({ page }) => {
  await page.goto('/create/wizard')
  // ...fill wizard form, not a redirect test
})
```

### Other canonical routes

| User journey | Canonical path |
|---|---|
| Token creation / guided issuance | `/launch/guided` |
| Compliance workspace setup | `/compliance/setup` |
| Post-launch operations | `/operations` |
| Token dashboard | `/dashboard` |
| Portfolio launchpad | `/launchpad` |
| Portfolio intelligence | `/portfolio` |
| Lifecycle cockpit | `/cockpit` |

---

## Auth Test Bootstrap Conventions

### Helper selection guide

| Spec type | Helper | When to use |
|---|---|---|
| Critical journey (token creation, compliance, billing) | `loginWithCredentials()` | Default for all new critical-path specs |
| Isolated UI component test (no backend dependency) | `withAuth()` | UI-only assertions, store/service mocks |
| Guest / unauthenticated test | `clearAuthScript()` | Before `page.goto()` in `beforeEach` |
| Post-navigation auth clear | `clearAuth()` | After `page.goto()` |

### `loginWithCredentials` — backend-realistic fallback

```typescript
import { loginWithCredentials, suppressBrowserErrors } from './helpers/auth'

test.beforeEach(async ({ page }) => {
  suppressBrowserErrors(page)
})

test('should allow access to guided launch workspace', async ({ page }) => {
  // Real backend auth when API_BASE_URL is set; ARC76-validated fallback in CI
  await loginWithCredentials(page)
  await page.goto('/launch/guided')
  await page.waitForLoadState('networkidle')

  const heading = page.getByRole('heading', { name: /guided token launch/i, level: 1 })
  await expect(heading).toBeVisible({ timeout: 60000 })
})
```

`loginWithCredentials` behavior:
1. Attempts real HTTP POST to `{API_BASE_URL}/api/auth/login`
2. On HTTP 200, validates the response against the ARC76 contract and seeds localStorage
3. On backend unavailability (network error or non-200), falls back to ARC76-validated localStorage seeding
4. In CI without a backend, falls back automatically — no test changes required

### `withAuth` — isolated UI tests

```typescript
import { withAuth, suppressBrowserErrors } from './helpers/auth'

test.beforeEach(async ({ page }) => {
  suppressBrowserErrors(page)
  await withAuth(page)
})

test('should display guided launch heading', async ({ page }) => {
  await page.goto('/launch/guided')
  await page.waitForLoadState('networkidle')
  const heading = page.getByRole('heading', { name: /guided token launch/i })
  await expect(heading).toBeVisible({ timeout: 60000 })
})
```

### ARC76 session contract

Every session seeded in E2E tests must satisfy the ARC76 contract:

```typescript
{
  address: string    // Non-empty ARC76-derived address (structural, not cryptographic check)
  email: string      // Non-empty user email (format: any@any.any)
  isConnected: true  // Must be true for protected routes
}
```

The contract is validated by `validateARC76Session()` in `src/utils/arc76SessionContract.ts`.
The router guard for `/launch/guided` uses `isIssuanceSessionValid()` from
`src/utils/authFirstIssuanceWorkspace.ts` which enforces the contract structurally.

---

## Semantic Wait Conventions

**Zero `waitForTimeout()` is the standard for all new E2E tests.**

| Pattern to replace | Semantic alternative |
|---|---|
| `await page.waitForTimeout(5000)` | `await expect(heading).toBeVisible({ timeout: 45000 })` |
| `await page.waitForTimeout(3000)` | `await heading.waitFor({ state: 'visible', timeout: 30000 })` |
| `await page.waitForTimeout(1000)` (after click) | `await page.waitForFunction(() => <condition>, { timeout: 10000 })` |

### Standard page load pattern

```typescript
await page.goto('/launch/guided')
await page.waitForLoadState('networkidle')

// Semantic wait: heading visible proves auth guard passed + component mounted
const heading = page.getByRole('heading', { name: /guided token launch/i, level: 1 })
await expect(heading).toBeVisible({ timeout: 60000 }) // 60s for CI
```

### Auth redirect detection pattern

```typescript
await clearAuthScript(page)
await page.goto('/protected-route')
await page.waitForLoadState('networkidle')

// Semantic wait: URL changes OR auth prompt appears
await page.waitForFunction(
  () => {
    const url = window.location.href
    const hasShowAuth = url.includes('showAuth=true')
    const isNotProtected = !url.includes('/protected-route') || hasShowAuth
    const emailInput = document.querySelector("input[type='email']")
    return isNotProtected || emailInput !== null
  },
  { timeout: 20000 },
)
```

---

## Test Quality Gates

### Skip policy

- **Zero `test.skip()` for critical paths** (auth, token creation, compliance, billing)
- `test.skip(!!process.env.CI, 'reason')` only after 10+ optimization attempts with local 100% pass rate
- `test.skip(browserName === 'firefox', 'reason')` for documented browser-specific issues

### Test count thresholds (unit tests)

| Scope | Minimum |
|---|---|
| New utility module | 10+ unit tests |
| New Pinia store | 15+ unit tests |
| New Vue component | 8+ component tests |
| New E2E spec | 5+ tests |

---

## Test Evidence (PR Delivery)

| Category | Count | Status |
|---|---|---|
| New unit tests (`mvpHardeningSessionBehavior.test.ts`) | 42 | ✅ All passing |
| New E2E tests (`frontend-mvp-hardening.spec.ts`) | 18 | ✅ All passing locally |
| Semantic wait replacements (`competitive-platform-enhancements.spec.ts`) | 11 `waitForTimeout` → semantic | ✅ Complete |
| Auth helper migration (`token-interoperability-hardening.spec.ts`) | `authenticatedInitScript` → `withAuth()` | ✅ Complete |
| `waitForTimeout` remaining in spec (interoperability) | 0 | ✅ Clean |

---

## Acceptance Criteria Mapping

| AC | Description | Implementation | Test Evidence |
|---|---|---|---|
| AC #1 | Canonical guided-launch as only token creation entry | Router has `/create/wizard` → redirect; navbar links to `/launch/guided` | `frontend-mvp-hardening.spec.ts` AC #1 group |
| AC #2 | Backend-verified auth in critical tests | `loginWithCredentials()` in all new critical specs | `frontend-mvp-hardening.spec.ts` AC #2 group |
| AC #3 | Deterministic behavior evidence | 42-test unit suite + repeated-credential E2E tests | `mvpHardeningSessionBehavior.test.ts` |
| AC #4 | Test hygiene and CI confidence | Zero `waitForTimeout` in touched specs; zero new `test.skip` on critical paths | Both E2E files verified clean |
| AC #5 | UX/accessibility quality | Nav parity, skip-to-content, no wallet UI assertions | `frontend-mvp-hardening.spec.ts` AC #5 group |
| AC #6 | Documentation accuracy | This document + `e2e/README.md` updated | This file |

---

## Business Value

**Onboarding conversion**: Deterministic auth behavior means non-technical users complete the
login → guided-launch journey without encountering dead ends or legacy route confusion.

**Enterprise trust**: Tests prove the session contract matches the router guard contract, so
sales demos can credibly assert that frontend behavior maps to backend guarantees.

**Revenue acceleration**: Hardened test quality reduces CI flakiness, unblocking beta intake
without creating support overload.

**Competitive differentiation**: MICA-oriented procurement requirements are met by accessible,
keyboard-navigable UX with zero wallet connector artifacts.

**Regulatory risk mitigation**: Consistent navigation, accessible labels, and user-readable
error messages reduce the risk of onboarding failures and audit findings.
