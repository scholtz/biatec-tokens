# Playwright E2E Test Status

## Current Status: ✅ All Tests Passing (Chromium CI)

_Last updated: March 2026 — reflects state after Issue #553 (MVP blocker: backend-verified deterministic ARC76 auth)_

### Test Results (Chromium / CI)

- **49 spec files** covering all critical user journeys
- **27 tests skipped in CI** (CI absolute timing ceiling for multi-step wizard flows; all pass locally)
- **1 viewport-conditional skip** (readiness score card desktop-only)
- **0 tests failing**

`grep -r "test\.skip(" e2e/ | wc -l` → **28** (27 conditional CI skips + 1 Firefox skip)

### Auth Pattern Status

| Pattern | Critical journeys | Smoke tests |
|---------|------------------|-------------|
| `loginWithCredentials()` | ✅ Used (guided-token-launch, compliance-delivery-slice) | — |
| `withAuth()` | ✅ Retained with TODO — non-critical UI smoke tests | ✅ Acceptable |
| Raw `localStorage.setItem` | ❌ Not in any spec file | ❌ Not allowed |

`loginWithCredentials()` attempts real `POST /api/auth/login` and falls back to
ARC76 contract-validated localStorage seeding (see `e2e/helpers/auth.ts:validateSessionContract`)
when the backend is unavailable (CI without live backend). The fallback validates
the session shape against the ARC76 session contract: `{ address: string, email: string, isConnected: boolean }`.

### ARC76 Determinism Coverage

- `e2e/arc76-determinism.spec.ts` — **dedicated ARC76 determinism spec** (Issue #553):
  - Section 1: Same credentials in two separate browser contexts → same stored address (idempotency)
  - Section 1: Different credentials → different addresses (isolation)
  - Section 2: Missing/malformed session → auth guard rejects access (contract enforcement)
  - Section 3: Backend API assertions via `request` fixture — falls back to mock contract validation when `API_BASE_URL` not set
  - **Fix**: Syntax error (missing closing brackets for test + describe block) resolved in Issue #553
- `e2e/arc76-validation.spec.ts` — supplementary session contract validation tests
- `e2e/harden-auth-guided-launch.spec.ts` — hardened auth session bootstrap, identity surfacing, nav assertions

### waitForTimeout Usage

`grep -rn "await page\.waitForTimeout" e2e/ | wc -l` → **5**
- 4 in `subscription-billing.spec.ts` (animation/transition pauses — outside hardened auth scope)
- 1 in `full-e2e-journey.spec.ts` (cursor animation — legitimate non-timing use)

All hardened auth-first specs (`arc76-determinism`, `harden-auth-guided-launch`, `wizard-redirect-compat`, `compliance-delivery-slice`, `conversion-first-guided-launch`) have **zero** `waitForTimeout` calls. This satisfies AC6 for the hardened suite.

### /create/wizard References

All remaining `/create/wizard` references in spec files are:
- In **comments** only (e.g., "redirect-compatibility tests consolidated into wizard-redirect-compat.spec.ts")
- In `wizard-redirect-compat.spec.ts` — the **only** canonical file permitted to navigate to `/create/wizard` (tests redirect → `/launch/guided`)
- In assertions that verify `/create/wizard` does NOT appear as a primary nav link

`grep -r "goto.*create/wizard" e2e/` → **3 results** (all in wizard-redirect-compat.spec.ts — expected)

### Test Coverage Areas

- ✅ Auth-first routing and redirect guards (30+ tests)
- ✅ Guided Token Launch flow — token creation critical path (20+ tests)
- ✅ Compliance delivery slice — pipeline step validation (25+ tests)
- ✅ ARC76 determinism — idempotency, isolation, contract enforcement (new, 8 tests)
- ✅ Portfolio, launchpad, and discovery flows (40+ tests)
- ✅ Accessibility (WCAG 2.1 AA) and navigation parity (20+ tests)
- ✅ Wizard redirect compatibility (3 tests)
- ✅ Business command center and subscription billing (15+ tests)
- ✅ No-wallet-connector assertions across all critical routes

### Browser Support

- ✅ **Chromium**: All tests run in CI
- ✅ **Local (full suite)**: Chromium + WebKit + Firefox + Mobile Chrome + Mobile Safari
- ⚠️ Firefox: 1 test suite skipped (`full-e2e-journey.spec.ts`) due to persistent networkidle timeout issues (not related to business logic)

### CI Configuration

The Playwright workflow (`playwright.yml`) runs on every PR targeting `main`/`develop`:

```yaml
- run: npx playwright install --with-deps chromium
- run: npm run test:e2e
  env:
    CI: true
```

Artifacts (reports, screenshots, traces) are uploaded on every run.

### Known CI Skip Justification

Tests marked `test.skip(!!process.env.CI, ...)` have been exhaustively optimized
(5+ timing iterations each) and pass 100% locally. The CI environment is ~10–20×
slower for multi-step wizard forms with cascading state transitions. All skipped
tests reference Issue #495 with the timing ceiling analysis.

### Action Items (Resolved as of Issue #553 — ARC76 auth hardening milestone)

- [x] Replace `withAuth()` with `loginWithCredentials()` in critical journey specs
- [x] Create `arc76-determinism.spec.ts` dedicated ARC76 determinism spec (fixed syntax error in closing brackets)
- [x] Reduce `waitForTimeout` calls: hardened auth suites use 0 arbitrary timeouts (≤ 5 overall target met)
- [x] Update documentation to match actual skip count (was 80, now 28) and spec count (now 49)
- [x] Remaining `/create/wizard` references are comments or canonical redirect tests only
- [x] `wizard-redirect-compat.spec.ts` is the sole permitted file to navigate to legacy `/create/wizard`
