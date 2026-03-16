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
| **Release governance** | The strict lane produces artifacts (traces, screenshots) that can be cited as release evidence. Product owners can point to a specific workflow run as proof. |
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
**Trigger:** Push to `main` on key source files + manual `workflow_dispatch`
**Auth model:** `loginWithCredentialsStrict()` — throws if backend unavailable; no localStorage fallback
**Purpose:** Release-readiness evidence. Proves the real critical path works against a live backend.
**Sign-off tests:** Run for real and fail loudly if the backend is unreachable or auth fails (when backend is configured).

The two lanes do not block each other. Standard CI remains fast. The strict lane runs separately, in parallel, and on its own schedule.

## Evidence Quality: What Counts as Release Evidence

> **Critical distinction** — a "green" strict-signoff workflow run is NOT automatically release evidence. Evidence quality depends on which mode the run used.

| Run outcome | Mode | Is this release evidence? |
|---|---|---|
| ✅ All tests passed | Mode 2 or 3 with real backend | **YES** — cite this run ID |
| ✅ All tests skipped | Mode 1 (no secrets) | **NO** — infrastructure only |
| ✅ All tests skipped | Mode 2/3 with localhost URL | **NO** — local target, not staging |
| ❌ Prerequisite failure | Mode 3 without secrets | **NO** — fail-closed (intentional) |
| ❌ Tests failed | Any mode | **NO** — backend contract violation |

**How to tell which mode was used:** Download the `strict-signoff-report` artifact from the run. The `signoff-status.json` file contains a `mode` field (`not-configured` or `full-strict`) and a `is_release_evidence` boolean.

**For procurement and compliance reviews:** Only cite runs where `is_release_evidence: true` in `signoff-status.json`. Infrastructure-only runs prove the CI plumbing but do not prove the product journey.

## Three Run Modes

### Mode 1: Infrastructure-only (no backend secrets configured)

**When it occurs:** Push-to-main when `SIGNOFF_API_BASE_URL` and/or `SIGNOFF_TEST_PASSWORD` are not set.

**Behaviour:**
- Workflow completes successfully (does not fail the push)
- All sign-off tests skip with a clear message ("not release evidence")
- A `signoff-status.json` artifact is uploaded showing the configuration state, with `is_release_evidence: false`
- No real backend was exercised; this run cannot be cited as release evidence

**Interpreting this:** The workflow infrastructure is working. The missing backend configuration is clearly documented. When secrets are configured, the next run will produce real evidence.

### Mode 2: Full strict sign-off (backend secrets configured, push-to-main)

**When it occurs:** Push-to-main after `SIGNOFF_API_BASE_URL` and `SIGNOFF_TEST_PASSWORD` are configured.

**Behaviour:**
- Vite dev server starts
- All sign-off tests run against the real backend
- Tests fail loudly on any backend unavailability or contract violation
- Full Playwright report + traces + `signoff-status.json` with `is_release_evidence: true` uploaded as artifact

**Interpreting this:** If the workflow shows ✅ PASSED and the artifact shows `is_release_evidence: true`, this run is credible release evidence.

### Mode 3: Manual release sign-off (workflow_dispatch)

**When it occurs:** A product lead or release manager triggers `workflow_dispatch`.

**Behaviour:**
- If secrets are NOT configured: workflow fails immediately after the prerequisite check (fail-closed gate). An operator explicitly requesting release sign-off must have the backend configured.
- If secrets ARE configured: full strict sign-off runs and produces evidence artifacts with `is_release_evidence: true`.

**Interpreting this:** For official release sign-off, always use `workflow_dispatch` with properly configured secrets. The fail-closed behaviour on `workflow_dispatch` without secrets is intentional — it prevents a manual release sign-off from being accidentally "passed" in infrastructure-only mode.

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

Download the `strict-signoff-report-{run-id}` artifact. It contains:
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

### ⚠️ `NOT CONFIGURED` — No backend secrets, workflow completed with skipped tests

All sign-off tests skipped because `API_BASE_URL` was not set or pointed to localhost. The `signoff-status.json` artifact explains the state. This is NOT release evidence.

To produce real release evidence:
1. Configure `SIGNOFF_API_BASE_URL`, `SIGNOFF_TEST_EMAIL`, `SIGNOFF_TEST_PASSWORD` as repository secrets
2. Trigger `workflow_dispatch` from **Actions → 🔒 Strict Backend Sign-off Gate**
3. Download the artifact and cite the run ID in release notes

### ⚠️ `SKIPPED` — Tests ran but all were skipped

All sign-off tests skip when `BIATEC_STRICT_BACKEND=true` is not set, or when `API_BASE_URL` is not set/is localhost. A run where all tests skipped is **not credible release evidence**.

### ✅ `PASSED` — Tests ran and passed

This run can be cited as release evidence. The workflow run ID can be referenced in release notes or product sign-off documents.

## Prerequisites

To enable full strict sign-off validation, configure these **environment secrets** in the `sign-off-protected` GitHub Environment, or as repository-level secrets if the environment has not yet been created:

| Secret | Description | Example |
|---|---|---|
| `SIGNOFF_API_BASE_URL` | Live staging or production backend URL | `https://staging.biatec.io` |
| `SIGNOFF_TEST_EMAIL` | Email of a provisioned sign-off test account | `signoff@biatec.io` |
| `SIGNOFF_TEST_PASSWORD` | Password for the sign-off test account | _(secret)_ |

The test account must be:
- Pre-provisioned in the backend environment
- Able to call `POST /api/auth/login` successfully
- Able to initiate and poll the deployment lifecycle endpoint

If `SIGNOFF_TEST_PASSWORD` is empty and you use `workflow_dispatch`, the workflow will fail closed (exit 1) rather than silently passing. For push-to-main without secrets, the workflow completes with all tests skipped and an infrastructure-status artifact.

## Protected Environment Setup

The workflow job declares `environment: sign-off-protected`. This is a GitHub Actions [Environment](https://docs.github.com/en/actions/deployment/targeting-different-deployment-environments) that provides:

1. **Environment-scoped secrets** with stricter access control than repository secrets
2. **Deployment protection rules** (required reviewers, wait timers, branch restrictions)
3. **Visible deployment records** in the GitHub Actions UI

### Creating the `sign-off-protected` Environment

1. Go to **Repository Settings → Environments → New environment**
2. Name it exactly `sign-off-protected`
3. Under **Deployment protection rules**:
   - Add required reviewers (product owner, release manager)
   - Enable **Required reviewers** for `workflow_dispatch` triggers
   - Restrict deployable branches to `main` only
4. Under **Environment secrets**, add:
   - `SIGNOFF_API_BASE_URL`
   - `SIGNOFF_TEST_EMAIL`
   - `SIGNOFF_TEST_PASSWORD`

> **If the environment does not exist yet:** secrets fall back to repository-level secrets with the same names. The workflow will still function — the difference is that protection rules (required reviewers, branch restrictions) will not be enforced until the environment is created.

### Why a Protected Environment Matters for Release Evidence

Using a GitHub Environment for sign-off:

- **Proves who approved the run** — GitHub tracks which reviewer approved the deployment
- **Prevents accidental production runs** — branch restrictions ensure only `main` can trigger it
- **Provides an audit trail** — every run appears as a "deployment" to `sign-off-protected` in GitHub
- **Enterprise governance** — required reviewers enforce a human approval gate before sign-off evidence is produced

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

**Note:** If you use `workflow_dispatch` without secrets configured, the workflow will fail immediately with a clear error message explaining what is missing. This is intentional fail-closed behaviour for manual release sign-off.

## Artifact Retention

Sign-off artifacts are retained for **90 days**. This ensures that a specific sign-off run can be referenced during audit, procurement review, or post-mortem investigation.

The artifact name includes the run ID: `strict-signoff-report-{run-id}`.

## Relationship to Roadmap

This strict sign-off lane directly addresses the MVP sign-off gap identified in the business owner roadmap:

> "The strict real-backend sign-off lane exists in the codebase, yet the latest push-to-main execution stopped before test execution because API_BASE_URL was unset and SIGNOFF_TEST_PASSWORD was empty."

With this updated workflow:
- The sign-off lane **completes on every push to main** — even without backend secrets (infrastructure-only mode)
- Every completion produces an **artifact** showing the current configuration state
- When secrets ARE configured, the lane **fails loudly** when backend prerequisites are absent (fail-closed for release gates)
- It produces **artifacts suitable for product-owner review** when backend is configured
- It is **separable** from the fast developer-feedback lane (no impact on standard CI speed)
- For **manual sign-off** (`workflow_dispatch`): still fails if secrets are missing — the fail-closed gate is maintained for deliberate release sign-off

## Files

| File | Purpose |
|---|---|
| `.github/workflows/strict-signoff.yml` | The CI workflow |
| `e2e/mvp-backend-signoff.spec.ts` | The strict sign-off Playwright suite |
| `e2e/helpers/auth.ts` | `loginWithCredentialsStrict()` and `isStrictBackendMode()` helpers |
| `src/utils/backendSignoffConfig.ts` | Pure functions for sign-off mode detection (testable) |
| `src/utils/__tests__/backendSignoffConfig.test.ts` | Unit tests for sign-off config utilities |
| `docs/implementations/STRICT_SIGNOFF_LANE.md` | This document |
