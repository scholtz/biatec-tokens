# Strict Backend Sign-off Lane

## What This Document Covers

This document explains the **strict backend sign-off lane** for the Biatec Tokens frontend. It is written for product owners, release managers, and engineers who need to understand what the sign-off lane proves, what it requires, and how to interpret its results.

## Purpose

The Biatec Tokens platform targets enterprise customers who need confidence that the tokenisation software they are buying actually works under real conditions — not just in a demo with mocked data. The strict sign-off lane exists to provide that confidence.

It is a dedicated Playwright test run that:

- Uses **real email/password authentication** against a live backend (no seeded localStorage shortcuts)
- Validates that backend sessions comply with the **ARC76 contract** (address, email, isConnected)
- Exercises the **deployment lifecycle** endpoint — initiation, status polling, terminal state
- Proves that **auth-first routing** correctly protects enterprise routes
- Confirms that **no wallet connector UI** appears after real backend authentication

This is the highest-fidelity proof the repository produces. When a strict sign-off run passes, product leadership can say: "The frontend's most important enterprise journey was validated against a live backend."

## Business Value

| Value | Detail |
|---|---|
| **Sales and demos** | Customers hear that sign-in, guided launch, and deployment are tested against a real service in CI. This builds trust during procurement reviews. |
| **Risk reduction** | The gate catches regressions in the critical path before they reach customers. A failed gate is far cheaper than a failed enterprise onboarding. |
| **Release governance** | The strict lane produces artefacts (traces, screenshots) that can be cited as release evidence. Product owners can point to a specific workflow run as proof. |
| **Premium pricing support** | Enterprise buyers expect the vendor to demonstrate operational discipline. A visible sign-off gate strengthens the case for professional and enterprise pricing. |

## Two-Lane Model

The frontend CI has two distinct Playwright lanes.

### Lane 1: Permissive (Standard CI)

**Workflow:** `.github/workflows/playwright.yml`
**Trigger:** Every pull request and push to `main` / `develop`
**Auth model:** `withAuth()` — seeds validated localStorage session; no backend required
**Purpose:** Fast developer feedback. Catches UI regressions, accessibility failures, routing errors.
**Sign-off tests:** Skip gracefully (`BIATEC_STRICT_BACKEND` not set)

### Lane 2: Strict Sign-off (This Document)

**Workflow:** `.github/workflows/strict-signoff.yml`
**Trigger:** Push to `main` on sign-off-related files + manual `workflow_dispatch`
**Auth model:** `loginWithCredentialsStrict()` — throws if backend unavailable; no localStorage fallback
**Purpose:** Release-readiness evidence. Proves the real critical path works against a live backend.
**Sign-off tests:** Run for real and fail loudly if the backend is unreachable or auth fails.

The two lanes do not block each other. Standard CI remains fast. The strict lane runs separately, in parallel, and on its own schedule.

## What the Strict Lane Validates

### AC #1 — Real backend authentication

The suite calls `POST /api/auth/login` with real credentials. If the backend is unreachable or returns non-200, the test **fails** — it does not fall back to localStorage. This prevents false positives where tests "pass" because of seeded state rather than real backend behaviour.

### AC #2 — Auth-first routing and session contract

After real login, the suite navigates to `/launch/guided` and `/compliance/setup`. It asserts:
- The route guard accepts the real backend session
- The URL does not redirect away (session is valid)
- No wallet connector UI appears in navigation
- Wrong-password login correctly returns a 4xx error from the backend

### AC #3 — Deployment lifecycle

The suite calls:
- `POST /api/v1/backend-deployment-contract/initiate` — must return a `deploymentId`
- `GET /api/v1/backend-deployment-contract/status/{id}` — must return a valid lifecycle state
- Polls for terminal state (`Completed` / `Failed`) — asserts `assetId` or `userGuidance` is surfaced

## Interpreting Failures

### ❌ `FAILED` — Tests ran and failed

Download the `strict-signoff-report-{run-id}` artefact. It contains:
- **HTML report** — test-by-test results with timing
- **Traces** — Playwright trace viewer files for step-by-step replay
- **Screenshots** — captured on test failure

Common failure causes:

| Failure | Likely cause |
|---|---|
| `Backend unreachable at ...` | `SIGNOFF_API_BASE_URL` is wrong or the backend is down |
| `HTTP 401 for POST /api/auth/login` | Credentials (`SIGNOFF_TEST_EMAIL` / `SIGNOFF_TEST_PASSWORD`) are wrong or account is not provisioned |
| `Backend response missing address field` | Backend login response schema mismatch — may need backend update |
| `Expected heading to be visible` | Route guard regression or page rendering failure |
| `Strict mode violation` | `BIATEC_STRICT_BACKEND=true` but a test tried to use a seeded auth shortcut |

### ⚠️ `SKIPPED` — Tests ran but all were skipped

All sign-off tests skip when `BIATEC_STRICT_BACKEND=true` is not set. If the workflow ran with `BIATEC_STRICT_BACKEND=true` but all tests still skipped, check whether `requireStrictBackend()` inside `mvp-backend-signoff.spec.ts` is returning an unexpected skip reason.

A run where all tests skipped is **not credible release evidence**.

### ✅ `PASSED` — Tests ran and passed

This run can be cited as release evidence. The workflow run ID can be referenced in release notes or product sign-off documents.

## Prerequisites

To enable full strict sign-off validation, configure these **repository secrets** in GitHub:

| Secret | Description | Example |
|---|---|---|
| `SIGNOFF_API_BASE_URL` | Live staging or production backend URL | `https://staging.biatec.io` |
| `SIGNOFF_TEST_EMAIL` | Email of a provisioned sign-off test account | `signoff@biatec.io` |
| `SIGNOFF_TEST_PASSWORD` | Password for the sign-off test account | _(secret)_ |

The test account must be:
- Pre-provisioned in the backend environment
- Able to call `POST /api/auth/login` successfully
- Able to initiate and poll the deployment lifecycle endpoint

If `SIGNOFF_TEST_PASSWORD` is empty, auth tests will fail with a clear error message (not silently pass).

## Running the Strict Lane Locally

```bash
# Run against a live staging backend
BIATEC_STRICT_BACKEND=true \
API_BASE_URL=https://staging.biatec.io \
TEST_USER_EMAIL=signoff@biatec.io \
TEST_USER_PASSWORD=<secret> \
npx playwright test e2e/mvp-backend-signoff.spec.ts --trace on
```

## Running the Strict Lane via `workflow_dispatch`

1. Navigate to **Actions → 🔒 Strict Backend Sign-off Gate**
2. Click **Run workflow**
3. Optionally provide:
   - `api_base_url` — overrides the `SIGNOFF_API_BASE_URL` secret
   - `test_user_email` — overrides the `SIGNOFF_TEST_EMAIL` secret
   - `reason` — descriptive label for the run (e.g. "Release candidate v1.2.3")
4. Click **Run workflow**

## Artefact Retention

Sign-off artefacts are retained for **90 days**. This ensures that a specific sign-off run can be referenced during audit, procurement review, or post-mortem investigation.

The artefact name includes the run ID: `strict-signoff-report-{run-id}`.

## Relationship to Roadmap

This strict sign-off lane directly addresses the MVP sign-off gap identified in the business owner roadmap:

> "The strict real-backend sign-off lane exists in the codebase, yet it is not enforced in the standard CI flow that product leadership can trust for MVP sign-off."

With this workflow:
- The sign-off lane is **first-class CI** — not an optional developer capability
- It **fails loudly** when backend prerequisites are absent
- It produces **artefacts suitable for product-owner review**
- It is **separable** from the fast developer-feedback lane (no impact on standard CI speed)

## Files

| File | Purpose |
|---|---|
| `.github/workflows/strict-signoff.yml` | The CI workflow |
| `e2e/mvp-backend-signoff.spec.ts` | The strict sign-off Playwright suite |
| `e2e/helpers/auth.ts` | `loginWithCredentialsStrict()` and `isStrictBackendMode()` helpers |
| `src/utils/backendSignoffConfig.ts` | Pure functions for sign-off mode detection (testable) |
| `src/utils/__tests__/backendSignoffConfig.test.ts` | Unit tests for sign-off config utilities |
