# MVP Sign-off Readiness: Blocker-Closure Mapping

**Issue:** MVP Sign-off readiness: canonical guided flow, backend-verified auth E2E, and accessibility trust hardening
**PR:** Implements remaining acceptance criteria for MVP launch readiness
**Date:** 2026-03-02
**Last updated:** 2026-03-21 — reflects closure of Issue #728 (Promote frontend release evidence to artifact-backed strict sign-off readiness)
**Roadmap:** https://raw.githubusercontent.com/scholtz/biatec-tokens/refs/heads/main/business-owner-roadmap.md

---

## Purpose

This document provides a complete, auditable mapping from each acceptance criterion (AC)
to the concrete code changes and test assertions that satisfy it. Product Owners and
reviewers can use this table to trace any blocker to its resolution evidence without
manual forensic investigation.

---

## Issue #728 AC Traceability — Artifact-Backed Strict Sign-off Readiness

| AC | Description | Status | Code Change | Evidence |
|----|-------------|--------|-------------|----------|
| #1 | Strict-signoff run executes at least one job and uploads artifact on current head | ✅ CLOSED | `strict-signoff.yml` — environment handling, prereqs check, artifact upload | CI run [23383071332](https://github.com/scholtz/biatec-tokens/actions/runs/23383071332): 1 job executed, `strict-signoff-report-23383071332` artifact uploaded |
| #2 | Canonical strict result consumable by frontend release-evidence flows | ✅ CLOSED | `evidenceTruthfulness.ts`, `releaseReadiness.ts`, `ReleaseEvidenceCenterView.vue` | `src/utils/__tests__/evidenceTruthfulness.test.ts` (503 lines); `src/utils/__tests__/releaseReadiness.test.ts` (944 lines); `e2e/release-evidence-center.spec.ts` |
| #3 | Latest application-bearing Build and Deploy FE workflow is green | ✅ CLOSED | `package.json`: `vitest@^4.1.0`, `@vitest/coverage-v8@^4.1.0`, `@vitest/ui@^4.1.0` aligned in PR #716 | CI run [23383071335](https://github.com/scholtz/biatec-tokens/actions/runs/23383071335): success on `main` |
| #4 | Release Evidence Center shows current-head strict status, freshness, provenance, next action | ✅ CLOSED | `ReleaseEvidenceCenterView.vue` (947 lines), `releaseReadiness.ts`, `RELEASE_CENTER_TEST_IDS` | `src/views/__tests__/ReleaseEvidenceCenterView.test.ts` (450 lines); `src/views/__tests__/ReleaseEvidenceCenterView.logic.test.ts` (949 lines) |
| #5 | Investor onboarding and compliance reporting surface compatible evidence-truth messaging | ✅ CLOSED | `InvestorComplianceOnboardingWorkspace.vue`, `ComplianceReportingWorkspace.vue` — added `evidenceTruthBanner` | `e2e/investor-compliance-onboarding.spec.ts`; `e2e/compliance-reporting-workspace.spec.ts` |
| #6 | Highest-value E2E suites use semantic waits and reduce permissive helpers | ✅ CLOSED | `mvp-backend-signoff.spec.ts`, `release-evidence-center.spec.ts` — 0 `waitForTimeout` calls | All assertions in sign-off-critical specs use `toBeVisible()`, `toBeAttached()`, `waitFor({ state })` |
| #7 | `PLAYWRIGHT_STATUS.md` and `MVP_SIGNOFF_READINESS_BLOCKER_MAPPING.md` updated to current | ✅ CLOSED | This document and `docs/testing/PLAYWRIGHT_STATUS.md` | Run IDs, suite shape, and blocker analysis current as of March 21, 2026 |
| #8 | No new wallet-based authentication paths introduced | ✅ CLOSED | All new views and helpers use email/password only | `grep -r "WalletConnect\|Pera\|MetaMask\|Defly" src/` → 0 results in new files |
| #9 | CI remains green for all existing required checks on implementation PR | ✅ CLOSED | No regressions introduced; unit tests 13478/13478 passing (PR #729 adds 480 new tests across 22 uncovered files) | Run Tests `main`: [23383071338](https://github.com/scholtz/biatec-tokens/actions/runs/23383071338) ✅; PR #729 final: [23394199204](https://github.com/scholtz/biatec-tokens/actions/runs/23394199204) ✅; Playwright final: [23394199218](https://github.com/scholtz/biatec-tokens/actions/runs/23394199218) ✅ |
| #10 | PR description and tests explain business risk of missing/stale strict evidence | ✅ CLOSED | `evidenceTruthfulness.ts` `EVIDENCE_TRUTH_DESCRIPTIONS`, operator-facing copy | Utility descriptions drive `evidenceTruthBannerBody` in all three release-critical surfaces |

---

## Issue #728 Implementation Summary

### What was the gap before Issue #728?

- The `strict-signoff.yml` workflow previously failed with **zero jobs executed** on certain runs (e.g., run `23366476602`) due to environment-handling edge cases.
- The `Build and Deploy FE` workflow was failing (run `23284062779`) due to `@vitest/ui@4.1.0` being mismatched against `vitest@4.0.18` and `@vitest/coverage-v8@4.0.18`. This was fixed in PR #716 by aligning all three to `^4.1.0`.
- The frontend had evidence-truthfulness UX primitives (from PR #727) but lacked the full wiring to show live strict-run freshness, blocked-state cause, and next actions to operators.

### What was delivered?

1. **Strict-signoff workflow execution**: The workflow now reliably executes at least one job on every push to `main`. When secrets are not configured, it generates a `"status": "not_configured"` artifact that truthfully states no release evidence was produced. When secrets are configured and backend is reachable, it runs the full strict Playwright suite and produces `"is_release_evidence": true`.

2. **Vitest dependency alignment**: All vitest peer packages pinned to `^4.1.0` in `package.json`, eliminating the peer mismatch that caused the Docker build-time `npm run test:coverage` to fail.

3. **Evidence truthfulness integration**: `ReleaseEvidenceCenterView.vue`, `InvestorComplianceOnboardingWorkspace.vue`, and `ComplianceReportingWorkspace.vue` now surface `evidenceTruthfulness` banners showing plain-language descriptions for `environment_blocked`, `unavailable`, `stale`, `partial_hydration`, and `backend_confirmed` states.

4. **Documentation refresh**: `PLAYWRIGHT_STATUS.md` and this document updated with current run IDs, actual suite shape (80 spec files, 13025 unit tests on `main`; 13478 unit tests after PR #729 — 480 new tests across 22 uncovered utility, service, store, view, and component files), and remaining backend-configuration gap analysis.

---

## PR #729 Unit Test Coverage — Release-Evidence Business Risk Traceability

PR #729 added **480 new unit tests across 22 previously uncovered files**. The following table maps the highest-risk file groups to the specific operator trust problems described in Issue #728.

| File Group | New Tests | Business Risk Protected |
|------------|-----------|------------------------|
| `src/utils/compliance.ts` (21 tests) | `isAlgorandBasedToken`, `calculateComplianceScore`, `getDefaultNetwork` | Incorrect compliance score calculation would silently misrepresent operator readiness — a release-blocking trust failure for regulated RWA issuance |
| `src/utils/complianceEvidencePack.ts` (20 tests) | `STATUS_LABELS` constants, `EvidenceTruthClass` discriminated union shapes | Wrong status labels shown to an operator/auditor is a commercial-trust defect; constant coverage ensures label strings match what evidence surfaces display |
| `src/utils/address.ts` (16 tests) | `formatAddress`, `isValidAlgorandAddress` | Invalid Algorand addresses passed to deployment flows would produce incorrect backend-signed transactions — directly tied to the "trustworthy deployment" guarantee |
| `src/utils/allowances.ts` (56 tests) | All 12 allowance-management functions (approve, revoke, check, format) | Allowance logic errors are invisible to operators until a transfer fails; these 56 tests protect the invariants used in ARC20 compliance reporting |
| `src/utils/network.ts` (10 tests) + `formValidation.ts` (18 tests) | Network detection, email/form validation | Stale network-state or form-validation bypass could route evidence to the wrong chain or accept invalid operator email — both undermine audit trail integrity |
| `src/services/teamManagement.ts` (51 tests) | `hasPermission`, `getRoleDefinition`, invitation lifecycle | Permission guard failures expose enterprise compliance operations to unauthorized users — a direct breach of the "operator trust" requirement |
| `src/services/BatchDeploymentService.ts` (36 tests) | `createBatch`, `retryFailedTokens`, `exportBatchAudit` (JSON + CSV) | Export audit trail correctness is a hard release-readiness requirement for regulated token issuance; retry-count and state-reset logic determines what operators see in the Evidence Center |
| `src/services/whitelistService.ts` (28 tests) | Pagination, `approve`/`reject`/`requestMoreInfo` operations | Whitelist approval flows guard which investors can participate; incorrect status shapes or stale counts would create false compliance signals |
| `src/services/attestation.ts` (7 tests) | Attestation object shapes and field presence | Attestation records feed the Release Evidence Center; missing fields would cause the frontend to show misleading provenance labels |
| `src/stores/complianceDashboard.ts` (43 tests) | localStorage persistence, filter state, metric computation | Dashboard metrics must survive page reload and accurately aggregate compliance evidence — operators and auditors rely on these numbers for sign-off decisions |
| `src/views/AttestationsDashboard.vue` + `TokenStandardsView.vue` + `DiscoveryDashboard.vue` (36 tests) | Heading structure, store rendering, network/filter logic | These views are entry points for compliance leads reviewing evidence; display regressions here directly erode operator confidence in release evidence quality |
| `src/components/ComplianceBadge.vue` + `LandingEntryModule.vue` + compliance step components (85 tests) | Badge rendering, no-wallet-UI invariant, onboarding step logic | Compliance badge shows operator sign-off readiness; `hasAnyFlags` must be deterministic; LandingEntryModule must never show wallet-connector UI (product-definition invariant) |

**CI evidence for final head `09fe0cf`:**
- Run Tests: [23394199204](https://github.com/scholtz/biatec-tokens/actions/runs/23394199204) — ✅ 13,478 tests, 0 failures (for commit `09fe0cf`); locally verified 13,521+ tests passing after additional view tests added
- Playwright Tests: [23394199218](https://github.com/scholtz/biatec-tokens/actions/runs/23394199218) — ✅ success

---

## Previous Issue AC Traceability (Issue pre-#728)

| AC | Description | Status | Code Change | Test Evidence |
|----|-------------|--------|-------------|---------------|
| #1 | Guided Launch is only primary token creation entry | ✅ CLOSED | `src/router/index.ts` (redirect), `src/constants/navItems.ts` | `e2e/mvp-signoff-readiness.spec.ts` AC#1 group; `e2e/frontend-mvp-hardening.spec.ts` AC#1 group |
| #2 | `/create/wizard` redirects correctly with dedicated compat tests | ✅ CLOSED | `src/router/index.ts` line ~57 redirect rule | `e2e/mvp-signoff-readiness.spec.ts` AC#2 group; `e2e/wizard-redirect-compat.spec.ts` |
| #3 | Critical auth E2E suites use contract-validated session bootstrap | ✅ CLOSED | `e2e/helpers/auth.ts` `withAuth()`/`loginWithCredentials()` | `e2e/frontend-mvp-hardening.spec.ts` AC#2 group (loginWithCredentials); `e2e/mvp-signoff-readiness.spec.ts` AC#3+#4 group |
| #4 | Deterministic auth assertions — same credentials → same account | ✅ CLOSED | `src/utils/arc76SessionContract.ts` pure functions | `src/utils/__tests__/mvpSignoffSessionEdgeCases.test.ts` AC#11+#12 group; `e2e/mvp-signoff-readiness.spec.ts` AC#3+#4 group |
| #5 | Invalid/expired session covered with explicit user-guidance checks | ✅ CLOSED | `src/utils/launchErrorMessages.ts`, `src/utils/arc76SessionContract.ts` | `src/utils/__tests__/mvpSignoffSessionEdgeCases.test.ts` AC#5 group; `e2e/mvp-signoff-readiness.spec.ts` AC#5 group |
| #6 | Critical-path `waitForTimeout` reduced to semantic waits | ✅ CLOSED | `e2e/competitive-platform-enhancements.spec.ts` (11 calls replaced) | Zero `await page.waitForTimeout()` in `mvp-signoff-readiness.spec.ts` and `mvp-hardening-canonical-launch.spec.ts` |
| #7 | Skip usage in blocker-relevant suites reduced, documented | ✅ CLOSED | All CI skips retain documented justification (`#495` reference) | `e2e/mvp-signoff-readiness.spec.ts` has zero `test.skip()`; existing skips all documented |
| #8 | Testing status docs reflect actual current metrics | ✅ CLOSED | This document | 13025 unit tests passing on `main` (CI run [23383071338](https://github.com/scholtz/biatec-tokens/actions/runs/23383071338) ✅); 13478 after PR #729 — 480 new tests across 22 files (CI run [23394199204](https://github.com/scholtz/biatec-tokens/actions/runs/23394199204) ✅); E2E specs pass in CI without flaky rerun (Playwright run [23394199218](https://github.com/scholtz/biatec-tokens/actions/runs/23394199218) ✅) |
| #9 | Accessibility checks pass for auth/launch interactions | ✅ CLOSED | Navbar skip-to-content, `id="main-content"`, `aria-label` on nav | `e2e/mvp-signoff-readiness.spec.ts` AC#9 group; `src/utils/__tests__/mvpSignoffSessionEdgeCases.test.ts` AC#9 group |
| #10 | CI for updated frontend tests is green | ✅ CLOSED | All test files run via existing `.github/workflows/test.yml` and `playwright.yml` | CI run [23383071338](https://github.com/scholtz/biatec-tokens/actions/runs/23383071338): success |
| #11 | Changes map to MVP blocker closure (this document) | ✅ CLOSED | This document | See blocker rows above |
| #12 | PO can trace each blocker to test + code evidence | ✅ CLOSED | This document | All ACs in this table have test file + test group references |

---

## Test Evidence Summary

### Unit Tests

| File | Tests Added | Coverage Area |
|------|-------------|---------------|
| `src/utils/__tests__/mvpSignoffSessionEdgeCases.test.ts` | 38 new tests | AC#5, AC#9, AC#11, AC#12 — session edge cases, error copy, blocker closure |
| `src/utils/__tests__/mvpHardeningSessionBehavior.test.ts` | 42 tests (from base) | AC#2, #3, #4, #5, #6, #1 — session determinism, return path, error messages |
| `src/router/canonical-routes.test.ts` | ~65 tests (from base) | AC#1, AC#4 — route guard logic, format address, isActive |
| `src/views/__tests__/mvpHardeningCanonicalRouting.integration.test.ts` | ~40 tests (from base) | AC#1, #2, #3, #9 — CTA routing, session guard, accessibility contract |
| `src/utils/__tests__/evidenceTruthfulness.test.ts` | 503-line file | `EvidenceTruthClass` derivation, CSS helpers, labels, descriptions, banner text |
| `src/utils/__tests__/releaseReadiness.test.ts` | 944-line file | `SignOffReadinessState`, `EvidenceDimension`, `buildDefaultReleaseReadiness`, helpers |
| `src/views/__tests__/ReleaseEvidenceCenterView.test.ts` | 450-line file | Rendering, WCAG, provenance labels, export button |
| `src/views/__tests__/ReleaseEvidenceCenterView.logic.test.ts` | 949-line file | `handleExport`, `dimensionStateLabel`, lifecycle, `onBeforeUnmount` |

### E2E Tests

| File | Tests | CI Skips | Coverage |
|------|-------|----------|----------|
| `e2e/mvp-signoff-readiness.spec.ts` | 21 | 0 | AC#1, #2, #3, #4, #5, #6, #7, #9 |
| `e2e/mvp-hardening-canonical-launch.spec.ts` | 20 | 0 | AC#1, #2, #3, #4 — canonical routing, accessibility, auth determinism |
| `e2e/frontend-mvp-hardening.spec.ts` | 18 | 0 | AC#1, #2, #3, #4, #5 — full journey, loginWithCredentials, wallet-free UI |
| `e2e/wizard-redirect-compat.spec.ts` | varies | 0 | AC#2 — `/create/wizard` redirect compatibility |
| `e2e/harden-auth-guided-launch.spec.ts` | varies | 0 | AC#3, #4, #6 — auth session determinism, semantic waits |
| `e2e/auth-first-confidence-hardening.spec.ts` | varies | 0 | AC#3, #4, #6 — auth guard confidence |
| `e2e/release-evidence-center.spec.ts` | varies | 0 | Issue #728 AC#2, #4, #6 — evidence center, grade distinction, accessibility |
| `e2e/investor-compliance-onboarding.spec.ts` | varies | 0 | Issue #728 AC#5 — evidence-truth banner in investor onboarding |
| `e2e/compliance-reporting-workspace.spec.ts` | varies | 0 | Issue #728 AC#5 — evidence-truth banner in compliance reporting |

---

## Session Contract Validity Matrix

Each cell shows what happens for the given session state when accessing a protected route:

| Session State | `/launch/guided` | `/dashboard` | `/compliance/setup` |
|---------------|-----------------|--------------|---------------------|
| `null` (no localStorage) | ❌ redirect (showAuth=true) | ✅ allowed (exception) | ❌ redirect |
| `isConnected: false` (expired) | ❌ redirect | ✅ allowed | ❌ redirect |
| `address: ''` (empty) | ❌ redirect | ✅ allowed | ❌ redirect |
| Valid ARC76 session | ✅ allowed | ✅ allowed | ✅ allowed |

**Test evidence:** `src/utils/__tests__/mvpSignoffSessionEdgeCases.test.ts` "Blocker-closure evidence" group

---

## Auth Session Bootstrap Convention

All E2E tests in this PR use the validated `withAuth()` helper from `e2e/helpers/auth.ts`.

```typescript
// ✅ Correct: contract-validated session before any navigation
await withAuth(page)           // validates ARC76 contract before seeding localStorage
await page.goto('/launch/guided')

// ✅ For critical journeys: backend-realistic fallback
await loginWithCredentials(page, 'user@biatec.io', 'password')

// ❌ Forbidden: raw localStorage seeding bypasses ARC76 contract
await page.evaluate(() =>
  localStorage.setItem('algorand_user', JSON.stringify({ address: 'raw' }))
)
```

---

## Current Remaining Blocker: Backend Secrets Not Configured

The single remaining gap for **credible release evidence** (`"is_release_evidence": true`) is backend-side: the `sign-off-protected` GitHub Environment is not yet provisioned with secrets. This is an operational dependency, not a code defect.

| Required | Value | Remaining Action |
|----------|-------|-----------------|
| `SIGNOFF_API_BASE_URL` | Live staging backend URL | Configure in Repository Settings → Environments → `sign-off-protected` |
| `SIGNOFF_TEST_PASSWORD` | Sign-off test account password | Configure in Repository Settings → Environments → `sign-off-protected` |
| `SIGNOFF_TEST_EMAIL` | *(optional, default: `e2e-test@biatec.io`)* | Configure if non-default account needed |

Until configured:
- `strict-signoff.yml` runs on every push to `main` and uploads `"status": "not_configured"` artifact
- Release Evidence Center correctly displays `environment_blocked` truth class with plain-language next-step guidance
- This is honest, fail-closed behavior — not a hidden failure

**Commercial impact**: Enterprise customers, compliance leads, and auditors cannot yet be shown a `"is_release_evidence": true` artifact. Configuring the secrets resolves this gap without any further code changes.

---

## Remaining Known Limitations

1. **`compliance-setup-workspace.spec.ts` CI skips (12 tests)**: Multi-step wizard tests
   require form fills across 5 steps. CI environment is 10-20x slower than local for
   accumulated state transitions. All skips are documented with `#495` reference.
   These tests pass 100% locally and validate compliance coverage via unit + integration
   tests in `src/views/__tests__/ComplianceSetupWorkspace.test.ts`.

2. **`portfolio-intelligence.spec.ts` auth redirect CI skip (1 test)**: Auth guard redirect
   timing in CI is highly variable. The redirect behavior is validated via unit tests in
   the router guard tests. 4+ optimization attempts documented in the skip comment.

3. **Backend-real auth in CI**: `loginWithCredentials()` falls back to ARC76-validated
   localStorage seeding because no real backend runs in CI. The session shape is identical
   to real backend responses and validated against the same contract. Once
   `POST /api/auth/login` is available in the test environment, no test changes are needed.

---

## Business Value Impact

| Impact Area | Evidence |
|-------------|----------|
| **Onboarding conversion** | Single `/launch/guided` entry reduces decision fatigue; 0 competing CTA paths in nav |
| **Compliance credibility** | ARC76 session contract is validated at every auth boundary; expired sessions are explicitly rejected |
| **Accessibility / enterprise procurement** | Skip-to-content, aria-labels, no wallet UI confirmed via 8 dedicated E2E checks |
| **CI stability** | Zero arbitrary `waitForTimeout` in critical-path specs; 0 CI-only skips in new tests |
| **Support reduction** | Actionable error messages in all 10 launch error codes; no raw technical codes in user-facing text |
| **Release governance** | `strict-signoff.yml` runs on every push to `main`; artifact uploaded every run; `"is_release_evidence"` field is machine-readable for release gates |
| **Evidence freshness** | `environment_blocked` / `stale` / `partial_hydration` / `backend_confirmed` states surface truthfully in Release Evidence Center, Investor Onboarding, and Compliance Reporting |
| **Commercial trust** | Enterprise buyers can see: "evidence is current + real backend-validated" vs "not yet configured" — no false assurance |
