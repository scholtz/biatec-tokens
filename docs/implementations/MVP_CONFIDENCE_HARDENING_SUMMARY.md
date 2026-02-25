# MVP Confidence Hardening: Canonical Guided Launch and Auth-Realistic E2E

**Issue:** MVP confidence hardening: guided launch canonical flow and auth-realistic E2E  
**PR:** #480  
**Branch:** `copilot/mvp-confidence-hardening`  
**Status:** ✅ 4860 unit/integration tests passing | ✅ 20 E2E tests passing | ✅ Build clean | ✅ Zero `waitForTimeout()` | ✅ Zero `test.skip()` (CI-conditional)

---

## Business Value

### Revenue Impact (HIGH)

- **Onboarding conversion**: Fragile multi-step E2E navigation (waiting 5–10 seconds per step) blocked reliable smoke testing of the guided launch funnel. Draft injection replaces those brittle paths, giving product and QA a deterministic way to verify any step. Faster, reliable testing shortens the release cycle and reduces abandonment from uncaught regressions.
- **Enterprise trust signals**: A backend that required raw, unvalidated `localStorage` seeding for tests implied production auth differed from test auth — a diligence red flag for compliance buyers. The new `validateSessionContract()` helper enforces shape before write, matching what the auth store expects. Reviewers and auditors can trace the session contract from test fixture to production guard.
- **Subscription activation**: The `/launch/guided` canonical route is the only path to token creation. Removing `/create/wizard` from primary journey ownership (it is now a redirect-only route with explicit tests) ensures all paid-tier onboarding flows through a single, well-tested entrypoint.

### Risk Reduction (HIGH)

- **Regression prevention**: 142 new deterministic tests formally encode the canonical flow contract, session validation, nav state invariants, and error message format. Any future drift in routing, nav, or session shape triggers an immediate test failure.
- **CI stability improvement**: Zero `waitForTimeout()` in new E2E tests. Draft injection at any step eliminates cumulative timing budget (previously 30–50 seconds of waits per multi-step navigation). CI E2E budget is now spent on assertions, not sleeping.
- **No new test.skip()**: Every test in `mvp-confidence-hardening.spec.ts` runs in CI without conditional skipping. Previous suites had 14 CI-only skips in `compliance-setup-workspace.spec.ts` alone.

### Support Efficiency (MEDIUM)

- Centralised `GUEST_NAV_FORBIDDEN_PATTERNS` and `containsForbiddenGuestNavText()` provide a single place to update if wallet-related strings must be excluded — no scattered assertions across multiple spec files.
- `buildTestSession()` / `buildExpiredSession()` / `buildDraftAtStep()` are reusable fixtures. Future tests can call these instead of copy-pasting raw JSON, reducing maintenance when the session shape changes.

### Competitive Positioning (MEDIUM)

- The roadmap positions Biatec as the compliance-first tokenization platform for non-crypto-native users. Deterministic, auditable test evidence — as opposed to skipped or timeout-dependent tests — is the quality signal that separates credible beta candidates from alpha-quality products. This PR directly advances that positioning.

---

## Scope

### In Scope

1. **Session contract utility** — validated read/write helpers that catch malformed session fixtures at test-setup time instead of causing silent mid-test failures.
2. **Canonical route constants** — `CANONICAL_LAUNCH_ROUTE`, `LEGACY_WIZARD_ROUTE`, `GUIDED_LAUNCH_STEPS` as single-source references used across unit, integration, and E2E layers.
3. **Navigation state contracts** — `GUEST_NAV_FORBIDDEN_PATTERNS` and `containsForbiddenGuestNavText()` for deterministic guest-nav invariant testing.
4. **Draft builder helpers** — `buildDraftAtStep(index)` enables direct step access in E2E tests without multi-step UI navigation.
5. **Unit tests (86)** — full coverage of all exported functions including error branches.
6. **Integration tests (56)** — cross-concern scenarios: auth guard simulation, session state lifecycle, nav invariants, step ordering, error message contracts.
7. **E2E tests (20)** — browser-level proof of the canonical guided flow, auth-realistic bootstrap, nav state assertions, legacy redirect guard, draft injection.

### Out of Scope

- Changes to production Vue components, stores, or router logic.
- Backend API changes.
- Visual redesign or Tailwind class changes.
- New token standards or network integrations.
- Changes to existing test files (only new files added).

### Non-Goals

- Replacing the remaining 14 CI-skipped tests in `compliance-setup-workspace.spec.ts` — those require a separate targeted effort once backend timing is stable.
- Full session bootstrap via live backend auth endpoint — this PR uses `addInitScript` localStorage bootstrap (the existing pattern across all auth-dependent E2E suites); backend-session integration is a future backend-coordination item.

---

## Technical Architecture

### New utility: `src/utils/mvpCanonicalFlow.ts`

Pure-function module with zero runtime side effects (except localStorage helpers, which are explicitly noted):

| Export | Purpose |
|---|---|
| `MVP_SESSION_STORAGE_KEY` | `'algorand_user'` — canonical auth key |
| `MVP_GUIDED_LAUNCH_DRAFT_KEY` | `'biatec_guided_launch_draft'` — canonical draft key |
| `buildTestSession(overrides?)` | Typed, validated session fixture |
| `buildExpiredSession(overrides?)` | Expired session fixture (`isConnected: false`) |
| `validateSessionContract(raw)` | Validates shape: `address`, `email`, `isConnected` fields |
| `readAndValidateSession()` | Reads + validates from localStorage; catches JSON errors |
| `writeValidatedSession(session)` | Validates before write; returns `false` on violation |
| `clearSession()` | Removes session from localStorage |
| `hasLiveSession()` | `true` only if session is valid AND `isConnected === true` |
| `CANONICAL_LAUNCH_ROUTE` | `'/launch/guided'` |
| `LEGACY_WIZARD_ROUTE` | `'/create/wizard'` |
| `GUIDED_LAUNCH_STEPS` | Ordered tuple of 6 step identifiers |
| `GUIDED_LAUNCH_STEP_COUNT` | `6` |
| `getStepIndex(step)` | 0-based step position |
| `isValidStepIndex(index)` | Bounds check |
| `canAdvanceFromStep(index, completed)` | Progression guard |
| `areRequiredStepsComplete(completed)` | `economics` (index 4) is optional |
| `isCanonicalLaunchRoute(path)` | Strips query/trailing slash before comparing |
| `isLegacyWizardRoute(path)` | Strips query/trailing slash before comparing |
| `ROUTE_READY_ANCHORS` | DOM selector strings for semantic E2E waits |
| `GUEST_NAV_VISIBLE_LABELS` | Labels guest nav must include |
| `GUEST_NAV_FORBIDDEN_PATTERNS` | Regex list: wallet, connected, mainnet, testnet, MetaMask, etc. |
| `containsForbiddenGuestNavText(text)` | `true` if any forbidden pattern matches |
| `findForbiddenGuestNavPatterns(text)` | Returns list of matched patterns (for assertion messages) |
| `buildMinimalDraft(overrides?)` | Draft at step 0, no completed steps |
| `buildDraftAtStep(index, overrides?)` | Draft positioned at step `index` with prior steps complete |
| `getStepTitle(step)` | Human-readable step title |
| `serialiseDraft(draft)` | JSON string for localStorage injection |

### Draft injection pattern (eliminates multi-step timing)

```ts
// Before: cumulative 30–50 seconds of waitForTimeout + step clicks
await page.goto('/launch/guided')
await page.waitForTimeout(10000)
await page.fill('#org-name', 'Corp')
await page.click('button:has-text("Continue")')
await page.waitForTimeout(5000)
// ... 3 more steps

// After: O(1) deterministic step access
await injectDraftAtStep(page, 3) // template step, prior steps complete
await page.goto('/launch/guided')
// Template selection heading visible immediately — no timing budget consumed
```

---

## Acceptance Criteria Mapping

| AC | Description | Status | Tests | Evidence |
|---|---|---|---|---|
| AC #1 | `/launch/guided` is canonical; `/create/wizard` is redirect-only | ✅ PASS | 2 E2E redirect tests | `mvp-confidence-hardening.spec.ts` "redirect guard" group |
| AC #2 | Session contract validated before use | ✅ PASS | 30 unit + 10 integration | `mvpCanonicalFlow.test.ts` session section; `integration.test.ts` AC#2 group |
| AC #3 | Guest nav has no wallet/network-centric labels | ✅ PASS | 6 unit + 7 integration + 3 E2E | `mvpCanonicalFlow.test.ts` nav section; E2E "AC#3" group |
| AC #4 | No `waitForTimeout` in new E2E tests | ✅ PASS | Code audit | `grep "await page.waitForTimeout" e2e/mvp-confidence-hardening.spec.ts` → 0 results |
| AC #4 | No `test.skip(!!process.env.CI)` in new E2E tests | ✅ PASS | Code audit | `grep "test.skip(!!process.env.CI" e2e/mvp-confidence-hardening.spec.ts` → 0 results |
| AC #5 | Tests are intention-revealing, grouped by journey | ✅ PASS | 5 `test.describe` groups | All groups map to one AC each |
| Error UX | Error messages are human-readable, not raw codes | ✅ PASS | 10 integration tests | `mvpCanonicalFlow.integration.test.ts` AC#7 group |
| Session expiry | Expired session is distinguishable from missing session | ✅ PASS | 4 integration tests | `mvpCanonicalFlow.integration.test.ts` AC#8 group |

---

## Test Evidence

### Unit tests (`src/utils/__tests__/mvpCanonicalFlow.test.ts`)

```
Test Files  1 passed (1)
Tests       86 passed (86)
Duration    515ms
```

### Integration tests (`src/views/__tests__/mvpCanonicalFlow.integration.test.ts`)

```
Test Files  1 passed (1)
Tests       56 passed (56)
Duration    539ms
```

### E2E tests (`e2e/mvp-confidence-hardening.spec.ts`)

```
[CustomReporter] Summary: 20 passed, 0 failed, 0 skipped
```

### Full test suite

```
Test Files  203 passed (203)
Tests       4860 passed | 25 skipped (4885)
Duration    118.72s
```

All 25 skipped tests are pre-existing (in other test files, pre-date this PR).

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Session shape changes in auth store | Low | Medium | `validateSessionContract()` is the single validation point; update one function + tests |
| Draft format version change in guidedLaunch store | Low | Low | `buildDraftAtStep()` hardcodes version `'1.0'`; will need updating if version bumps — intentional coupling |
| New wallet UI accidentally added to guest nav | Low | High | `containsForbiddenGuestNavText()` + E2E nav invariant tests would catch it immediately |
| `/launch/guided` route renamed | Low | Medium | `CANONICAL_LAUNCH_ROUTE` constant + router-level tests (`canonical-routes.test.ts`) would both fail |

**No regressions:** 4860/4885 total tests pass (25 skipped are all pre-existing in unrelated test files).

---

## Rollout Considerations

- **Zero production code changes**: Only test utilities and test files were added. There is no rollback risk for production behavior.
- **Backward compatible**: All new exports are additive. Existing tests are unmodified.
- **CI impact**: 20 new E2E tests add approximately 3–4 minutes to the Playwright suite on CI. All 20 pass deterministically without environment-specific conditions.

---

## Manual Verification Checklist

For product owner smoke walk-through in staging:

1. **Guest redirect**: Open a private/incognito window → navigate to `/launch/guided` → confirm redirect to home with Sign In modal → Sign In button visible → no wallet connector UI visible.
2. **Canonical launch**: Sign in with email/password → navigate to `/launch/guided` → confirm "Guided Token Launch" heading visible → "0 of 6 steps complete" progress shown → no MetaMask/WalletConnect/Pera references in page.
3. **Legacy redirect**: Navigate to `/create/wizard` (while authenticated) → confirm automatic redirect to `/launch/guided` with no wizard-era UI rendered.
4. **Compliance gate**: Reach Compliance step → confirm "Continue to Template Selection" button is disabled until risk acknowledgement checkbox is checked → check checkbox → button becomes enabled.
5. **Error banner**: Inject `submissionError: 'SUBMISSION_FAILED'` in localStorage draft → reload `/launch/guided` → confirm error banner with human-readable title (not "SUBMISSION_FAILED") → Dismiss button removes banner.
