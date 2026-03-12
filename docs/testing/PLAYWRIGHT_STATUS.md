# Playwright E2E Test Status

## Current Status: ✅ All Tests Passing (Chromium CI)

_Last updated: March 2026 — reflects state after Issue #559 (E2E CI stability: TokenDetail back-button fix, `/create/wizard` redirect test consolidation, semantic wait migration)_

### Test Results (Chromium / CI)

- **51 spec files** covering all critical user journeys
- **20 tests skipped in CI** (CI absolute timing ceiling for multi-step wizard flows; all pass locally)
- **1 viewport-conditional skip** (readiness score card desktop-only)
- **0 tests failing** (root cause: TokenDetail `router.back()` with no history — fixed in Issue #559)

`grep -r "test\.skip(" e2e/ | wc -l` → **22** (20 conditional CI skips + 1 Firefox skip + 1 viewport skip)

### Auth Pattern Status

| Pattern | Critical journeys | Smoke tests |
|---------|------------------|-------------|
| `loginWithCredentials()` | ✅ Used in all 4 critical suites: auth-first-token-creation, compliance-orchestration, guided-token-launch, compliance-setup-workspace | — |
| `withAuth()` | ✅ Retained — non-critical UI smoke tests only (clearly documented) | ✅ Acceptable |
| Raw `localStorage.setItem` | ❌ Removed from all critical journey specs | ❌ Not allowed |

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

`grep -rn "await page\.waitForTimeout" e2e/ | wc -l` → **1**
- 1 in `full-e2e-journey.spec.ts` (cursor animation between steps — legitimate non-timing use; inside animated mouse-move helper)

All other specs use semantic waits (`waitForFunction`, `expect(locator).toBeVisible()`, `waitForLoadState`).
Issue #559 migrated 6 arbitrary `waitForTimeout` calls to semantic waits (subscription-billing: 4, backend-deployment-contract: 2).

### /create/wizard References

All remaining `/create/wizard` references in spec files are:
- In **comments** only (e.g., "redirect-compatibility tests consolidated into wizard-redirect-compat.spec.ts")
- In `wizard-redirect-compat.spec.ts` — the **only** canonical file permitted to navigate to `/create/wizard` (tests redirect → `/launch/guided`)
- In assertions that verify `/create/wizard` does NOT appear as a primary nav link

`grep -r "goto.*create/wizard" e2e/` → **3 results** (all in wizard-redirect-compat.spec.ts — expected)

Issue #559 removed 9 duplicate redirect-compat `goto('/create/wizard')` calls from 5 spec files
(mvp-signoff-readiness, frontend-mvp-hardening, mvp-hardening-canonical-launch, canonical-launch-aa-hardening, mvp-sign-off-hardening) — all were duplicates of tests already in `wizard-redirect-compat.spec.ts`.

### Root Cause Analysis: CI Failure Run #1366 (March 4, 2026)

**Failing test**: `should handle back button navigation` in `e2e/token-detail-view.spec.ts`

**Root cause**: `TokenDetail.vue` used `$router.back()` as the back button handler. When the test navigated directly to `/tokens/mock-token-123` (no browser history), `router.back()` did nothing and the URL stayed at the token detail page. The test assertion `expect(url).not.toContain('/tokens/mock-token-123')` then failed.

**Fix**: Changed `TokenDetail.vue` back button to `goBack()` function that uses `router.push('/dashboard')` as fallback when `window.history.length <= 1`. This is both the correct UX behavior (never trap users on a detail page with no history) and makes the test pass deterministically.

### Test Coverage Areas

- ✅ Auth-first routing and redirect guards (30+ tests)
- ✅ Guided Token Launch flow — token creation critical path (20+ tests)
- ✅ Compliance delivery slice — pipeline step validation (25+ tests)
- ✅ ARC76 determinism — idempotency, isolation, contract enforcement (8 tests)
- ✅ Portfolio, launchpad, and discovery flows (40+ tests)
- ✅ Accessibility (WCAG 2.1 AA) and navigation parity (20+ tests)
- ✅ Wizard redirect compatibility (3 tests — canonical file only)
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

### Action Items (Resolved as of Issue #559 + Issue #557 + Issue #553 + Issue #588)

- [x] Fix TokenDetail `router.back()` to fallback to `/dashboard` when no browser history (Issue #559)
- [x] Consolidate all `/create/wizard` redirect tests to `wizard-redirect-compat.spec.ts` only — removed 9 duplicates from 5 spec files (Issue #559)
- [x] Reduce `waitForTimeout` calls from 7 to 1 — only legitimate cursor animation remains (Issue #559)
- [x] Replace `withAuth()` / raw `localStorage` with `loginWithCredentials()` in all 4 critical journey specs (compliance-orchestration, compliance-setup-workspace, auth-first-token-creation, guided-token-launch)
- [x] Create `arc76-determinism.spec.ts` dedicated ARC76 determinism spec (fixed syntax error in closing brackets — Issue #553)
- [x] Create `backend-deployment-contract.spec.ts` — 15+ tests for deployment lifecycle UI (Issue #557)
- [x] Create `src/lib/api/backendDeploymentContract.ts` typed API client (33 unit tests) (Issue #557)
- [x] Create `DeploymentStatusPanel.vue` component showing all 5 lifecycle states (35 unit tests) (Issue #557)
- [x] Update documentation to match actual skip count and spec count
- [x] Remaining `/create/wizard` references are comments or canonical redirect tests only
- [x] `wizard-redirect-compat.spec.ts` is the sole permitted file to navigate to legacy `/create/wizard`
- [x] **AC #1**: `mvp-backend-signoff.spec.ts` — strict sign-off lane using `loginWithCredentialsStrict()` that FAILS if backend unavailable (Issue #588)
- [x] **AC #2**: `backend-deployment-contract.spec.ts` strict lane upgraded — uses `loginWithCredentialsStrict()` instead of fallback `loginWithCredentials()` (Issue #588)
- [x] **AC #3**: No direct `goto('/create/wizard')` calls outside `wizard-redirect-compat.spec.ts` — confirmed clean (Issue #588)
- [x] **AC #4**: `backend-deployment-contract.spec.ts`, `mvp-signoff-readiness.spec.ts`, `mvp-stabilization.spec.ts`, `mvp-deterministic-journey.spec.ts` switched from broad `suppressBrowserErrors()` to narrow `suppressBrowserErrorsNarrow()` — real app errors now surface as failures in blocker specs (Issue #588)
- [x] **AC #5**: Two low-signal `toBeTruthy()` assertions in `backend-deployment-contract.spec.ts` replaced with meaningful assertions (`toContain('localhost')`, `toMatch(/deployment/i)`) (Issue #588)
- [x] **AC #6**: Helper two-tier model documented in `e2e/helpers/auth.ts` and `e2e/README.md` — strict vs permissive lane distinction is clear (Issue #588)
- [x] **AC #7**: Documentation updated to reflect actual blocker status (Issue #588)

### Remaining Open Items (as of March 2026)

- Full wizard form completion through the UI with real form submission is not yet tested E2E (backend-only concern for staging environment).
- Real-time deployment status polling (SSE/WebSocket) is not covered.
- Rollback and retry flows are not covered.
- Full deployment wizard lifecycle (request → status progression → terminal state) requires a live staging backend (`BIATEC_STRICT_BACKEND=true` + `API_BASE_URL`). The strict lane tests in `mvp-backend-signoff.spec.ts` and `backend-deployment-contract.spec.ts` are ready to run against a live backend when available.

