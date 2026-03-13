# Copilot Instructions for Biatec Tokens

## 🚨 CRITICAL: ISSUE TYPE IDENTIFICATION 🚨

**MANDATORY FIRST STEP**: Before starting ANY work, identify the issue type and required deliverables.

### Issue Type Classification

**Implementation Issue** - Requires CODE changes with tests:
- Keywords: "implement", "add feature", "fix bug", "build", "create functionality"
- Acceptance criteria focused on BEHAVIOR (e.g., "user can do X", "system validates Y")
- **Required deliverables**: Code changes + unit tests + integration tests + E2E tests + documentation
- **Example**: "Build deterministic states for loading, empty, success, failure screens"

**Documentation/Planning Issue** - Requires documents only:
- Keywords: "document", "create plan", "design spec", "requirements gathering"
- Acceptance criteria focused on ARTIFACTS (e.g., "document created", "plan outlined")
- **Required deliverables**: Markdown documents, diagrams, specifications
- **Example**: "Create API design specification for payment integration"

**Vision/Strategy Issue** - Requires BOTH implementation AND planning:
- Keywords: "vision", "roadmap", "strategy" WITH implementation requirements
- Acceptance criteria include BOTH behavioral changes AND planning artifacts
- **Required deliverables**: Code changes + tests + documentation + KPI framework
- **Example**: "Vision: Auth-first UX" with requirements like "Replace wizard paths" + "Define KPI impact"

### 🚨 CRITICAL PAST VIOLATION - February 18, 2026 🚨

**Violation**: Copilot misidentified a vision/strategy issue as documentation-only and created 70KB of KPI documentation without ANY code changes or tests.

**What Went Wrong**:
- Issue title: "Vision: Auth-first token creation UX and deterministic compliance workflow"
- Issue had 30 requirements asking for "Define measurable KPI impact and instrumentation mapping"
- BUT the issue ALSO had implementation requirements in "In Scope" section:
  - "Replace residual wizard-oriented paths with auth-first journey"
  - "Build deterministic states for loading, empty, success, failure screens"
  - "Add resilient UI contract tests"
  - "Add UX telemetry"
- Product owner rejection: "required CI evidence is missing, no proof tests cover auth-first product behavior"

**Correct Approach** for Vision/Strategy Issues:
1. **READ ENTIRE ISSUE**: Don't focus only on "Requirements 1-30" - read "In Scope", "Acceptance Criteria", "Technical Approach"
2. **Identify Implementation Work**: Look for behavioral requirements (e.g., "replace X", "build Y", "add Z")
3. **Deliver BOTH**: Implementation (code + tests + CI fix) AND planning (KPI docs, instrumentation specs)
4. **Test-First Always**: Even for vision issues, start with tests that prove the vision is implemented

**Pattern to Prevent Recurrence**:
```
BEFORE starting work on ANY issue:
1. Read full issue description (not just requirements list)
2. Check "In Scope" section for code changes
3. Check "Acceptance Criteria" for test requirements
4. Check "Testing" section for coverage expectations
5. If BOTH implementation AND documentation needed → deliver BOTH
6. If unsure → ask product owner to clarify
```

**Red Flags** (indicates implementation required, not just docs):
- "Fix CI" mentioned anywhere
- "Add tests" in acceptance criteria
- "Replace", "Build", "Implement" in scope section
- Product owner references roadmap blockers needing resolution
- Mentions of "deterministic behavior", "validation", "user flows"

**Validation/Verification Issue** - Requires VALIDATION of existing code + documentation:
- Keywords: "validate", "verify", "confirm", "document existing", "audit"
- Acceptance criteria focused on PROVING existing functionality works
- **Required deliverables**: Test execution evidence + documentation + gap analysis + CI proof
- **Example**: "Validate auth-first routing is complete and document test coverage"

### 🚨 CRITICAL PAST VIOLATION - February 18, 2026 (Issue #432) 🚨

**Violation**: Copilot misidentified implementation issue as validation-only based on memory that "auth-first routing already implemented."

**What Went Wrong**:
- Issue title: "Build the next high-impact frontend milestone" - keyword "BUILD" indicates IMPLEMENTATION
- Issue scope: "Implement or refine", "Remove or refactor", "Ensure CTAs consistently route"
- Copilot saw "Ensure" and "verify" keywords, assumed validation-only work
- Copilot relied on memory saying "auth-first routing fully implemented" without verifying CURRENT state
- Delivered only documentation (validation summary, manual checklist)
- Product owner rejection: "no implementation evidence, no passing CI signal, only initialization text"

**Root Cause**:
- **Memory Blindness**: Trusted stale memory without checking if product roadmap shows issues
- **Keyword Over-Focus**: Saw "ensure" and ignored "BUILD", "implement or refine", "remove or refactor"
- **Context Ignore**: Roadmap says "55% complete", "integration issues persist", "ARC76 needs completion"
- **AC Misread**: ACs say "Ensure CTAs **consistently** route" (implies they DON'T currently), not "Validate CTAs route"

**Correct Approach When Issue Title Says "BUILD"**:
1. **ALWAYS treat "BUILD" as IMPLEMENTATION** - regardless of other keywords
2. **CHECK ROADMAP STATUS FIRST**: If roadmap shows incomplete features (50%, 55%, 70%), assume gaps exist
3. **RUN TESTS TO FIND GAPS**: Don't assume memory is current - test to find what's broken
4. **IMPLEMENT GAPS FIRST**: Fix broken tests, add missing features, THEN validate
5. **IGNORE MEMORIES ABOUT "ALREADY COMPLETE"**: Memories may be stale, roadmap is source of truth

**Red Flags This Was Implementation, Not Validation**:
- ✅ Issue title starts with "BUILD"
- ✅ Roadmap shows 50-70% completion (not 100%)
- ✅ Scope uses "implement OR refine" (implies might need implementation)
- ✅ Product owner explicitly asks for "implementation evidence"
- ✅ Context mentions "integration issues", "needs completion", "partially working"

**When to Do VALIDATION vs IMPLEMENTATION**:
- **VALIDATION**: Issue title "Validate X", roadmap 100% complete, all tests passing, product owner asks for "proof"
- **IMPLEMENTATION**: Issue title "Build X", roadmap <100%, ANY mention of bugs/gaps/issues in context

### 🚨 CRITICAL PAST VIOLATION - February 18, 2026 (Issue #430) 🚨

**Violation**: Copilot misidentified validation issue as documentation-only and delivered 120KB of analysis docs WITHOUT running tests or proving CI works.

**What Went Wrong**:
- Issue title: "Frontend auth-first determinism and compliance UX hardening"
- Issue scope: "Ensure every user journey routes to auth", "Remove wallet-era affordances", "E2E stability hardening"
- Keywords like "ensure", "verify", "reduce flakiness" suggested VALIDATION work
- Copilot delivered: Analysis docs, skip rationale, implementation summary
- Product owner rejection: "no passing CI evidence", "add concrete unit and integration tests", "fix CI"

**What Should Have Happened**:
1. **Run existing tests FIRST** to prove functionality works
2. **Check CI status** - are tests passing in CI?
3. **If tests exist and pass**: Document execution evidence + screenshots + CI links
4. **If tests missing**: Write the missing tests FIRST, then document
5. **If CI failing**: Investigate and FIX CI before claiming completion
6. **Deliver PROOF**: Test execution logs, CI workflow links, before/after screenshots

**Correct Approach for Validation Issues**:
```
VALIDATION WORK CHECKLIST:
1. ✅ Run existing unit tests locally → Document pass counts
2. ✅ Run existing E2E tests locally → Document pass counts  
3. ✅ Check CI status → Link to passing workflows OR fix failures
4. ✅ If tests missing → Write tests FIRST, document SECOND
5. ✅ If CI broken → Fix CI FIRST, document SECOND
6. ✅ Provide EVIDENCE: Test logs, CI links, screenshots, coverage reports
7. ✅ Document gaps with MITIGATION plans (not just analysis)
8. ✅ Link PR to issue number (e.g., "Fixes #430")
```

**Red Flags for Validation Issues**:
- "Validate", "Verify", "Ensure", "Confirm" in title
- "Prove", "Demonstrate", "Show evidence" in acceptance criteria
- "CI passing", "Tests green", "Coverage maintained" requirements
- Product owner asking for "proof", "evidence", "execution logs"

**Deliverable Requirements**:
- ❌ WRONG: Only analysis documents (no proof tests work)
- ❌ WRONG: Documentation + "tests exist" claim (no execution evidence)
- ✅ CORRECT: Test execution logs + CI links + screenshots + gap mitigation + docs

### 🚨 CRITICAL PAST VIOLATION - February 20, 2026 (PR #455) 🚨

**Violation**: Copilot submitted a new feature PR (Token Operations Cockpit v1) with component (`TimelineWidget.vue`) but WITHOUT component tests or integration tests in the same commit. Tests were only added after the first product owner rejection.

**What Went Wrong**:
- Issue: "Next-step: Token Operations Cockpit v1 for lifecycle intelligence"
- Copilot created `TimelineWidget.vue` but did NOT add component tests (`TimelineWidget.test.ts`) in the same commit
- Copilot created 4 utility modules but did NOT add integration tests until after PO rejection
- E2E tests also contained strict-mode violations (multiple elements matched by `getByText(/Last updated:/i)`) and false-positive wallet-connector assertions that matched diagnostic widget labels
- First submission required 3 follow-up commits to fix test gaps and CI failures

**Root Cause**:
- **Component Without Tests**: New components were committed WITHOUT their unit test file in the same commit
- **No Pre-Push E2E Verification**: E2E tests were written but not run locally before committing
- **Strict Mode Blindness**: Text-presence assertions (`getByText()`) were not verified against ALL content rendered on the page (including third-party/diagnostic widgets)
- **Absence Assertion Risk**: Negative assertions (`expect(content).not.toContain(...)`) were not verified against full rendered DOM

**Correct Approach for New Components/Features**:
1. **ALWAYS create test file in same commit as component** — `TimelineWidget.vue` + `TimelineWidget.test.ts` must be one atomic commit
2. **Run E2E tests locally before pushing** — `npm run test:e2e -- e2e/relevant-spec.ts` before `report_progress`
3. **Check ALL page content for text assertions** — `getByText()` and `not.toContain()` assertions must be verified against every widget rendered on the page
4. **Use `.first()` for repeated elements** — when multiple widgets share similar text (e.g., "Last updated:"), always use `.first()` or a more specific locator
5. **Negative assertions need extra care** — assertions checking that something does NOT appear must consider all content from diagnostic/compatibility widgets

**Red Flags This Pattern Is Repeating**:
- ✅ New `.vue` component created without matching `.test.ts` file in same commit
- ✅ Integration tests added in separate follow-up commit rather than initial one
- ✅ E2E test failures discovered only after CI run (not local pre-push verification)
- ✅ `getByText()` used without `.first()` on pages with multiple widgets

### 🚨 CRITICAL PAST VIOLATION - February 24, 2026 (PR #465) 🚨

**Violation**: Copilot submitted a new feature PR (Guided Portfolio Onboarding) with incomplete test coverage in the first commit, requiring 3 product owner review cycles before reaching adequate quality. Tests were added incrementally across follow-up commits rather than being complete from the start.

**What Went Wrong**:
- Issue: "Frontend growth milestone: guided portfolio onboarding and cross-wallet continuity" (Issue #467, PR #465)
- First commit had 56 unit + 13 E2E tests — NOT sufficient for a feature with 10 acceptance criteria
- Integration tests covering empty wallet, interrupted session, and account switching were missing from the first commit
- PR remained in draft state and product owner could not confirm CI evidence
- Required 3 rounds of product owner feedback and 3 follow-up commits to reach 149+ tests
- Business value / risk / rollback were not in the PR description from the start

**Root Cause**:
- **Underestimating test scope**: Treated a 10-AC vision/strategy feature as if 56 unit tests were sufficient
- **Missing minimum test count threshold**: No explicit minimum was enforced for vision/strategy issues with 10+ ACs
- **PR description incomplete**: Did not include business value, risk mitigation, and rollback from the initial commit
- **Draft state left open**: PR was submitted without verifying CI evidence
- **No edge-case pre-analysis**: Edge cases (empty wallet, interrupted session, account switch) were not identified upfront

**Correct Approach for Vision/Strategy Issues with 10+ Acceptance Criteria**:
1. **MINIMUM 150+ tests from FIRST commit** — Count them before `report_progress`:
   - 60+ unit tests (all logic paths incl. edge cases)
   - 40+ integration tests (empty wallet, interrupted session, account switching, analytics, complete journey)
   - 30+ component tests (all 3 states: loading/error/empty/success per component)
   - 15+ E2E tests (full journey, failure-recovery, returning-user, product-alignment)
2. **PR description from day one MUST include**:
   - `Closes #<issue_number>`
   - Business value (user pain removed, metric to improve, risk mitigated)
   - Rollback strategy
   - Test evidence table with exact counts per layer
3. **Never mark PR as "draft"** — Submit as ready-for-review only when all tests pass and counts are verified
4. **Pre-analyze edge cases** before writing any code — List them explicitly:
   - Empty wallet / null address
   - Interrupted session / partial form completion
   - Account switching / cross-wallet state isolation
   - Error states / network failures
   - Analytics / telemetry PII safety

**Minimum Test Count Table (enforced per issue type)**:

| Issue Type | Unit | Component | Integration | E2E | Total |
|---|---|---|---|---|---|
| Small fix (<3 ACs) | 5+ | — | — | 3+ | 8+ |
| Feature (3–6 ACs) | 30+ | 15+ | 10+ | 8+ | 63+ |
| Feature (7–10 ACs) | 50+ | 30+ | 20+ | 15+ | 115+ |
| Vision/Strategy (10+ ACs) | 60+ | 30+ | 40+ | 15+ | 145+ |

**Red Flags This Pattern Is Repeating**:
- ✅ Issue has 10 acceptance criteria but first commit has <100 tests
- ✅ Integration tests for edge cases (empty wallet, interrupted session) not present in first commit
- ✅ PR description lacks business value / rollback strategy
- ✅ PR submitted in draft state without CI evidence

**Never Again**:
- ❌ Submit vision/strategy PR with <150 tests in first commit
- ❌ Leave PR in draft state without verifying test counts
- ❌ Add edge-case tests only after product owner rejection
- ❌ Omit business value / risk / rollback from initial PR description

### 🚨 CRITICAL PAST VIOLATION - February 19, 2026 (PR #437) 🚨

**Violation**: Copilot misidentified "hardening" issue as validation-only and delivered only documentation WITHOUT fixing tests or CI.

**What Went Wrong**:
- Issue title: "Next MVP step: frontend auth-first issuance determinism and compliance UX **hardening**"
- "Hardening" keyword means STRENGTHEN/IMPROVE existing features, not just validate
- Issue had 307 arbitrary `waitForTimeout()` calls in E2E tests - clear implementation gap
- CI status: "action_required" - needed investigation and fixes
- Copilot delivered: 4 validation documents (54KB) but NO test improvements or CI fixes
- Product owner rejection: "unstable", "lacks CI evidence", "needs unit/integration tests", "needs E2E improvements"

**Root Cause**:
- **Keyword Blindness**: Saw "determinism" and "verify" keywords, ignored "**hardening**" and "Next MVP **step**"
- **Memory Over-Trust**: Relied on memory saying "auth-first routing already implemented" without checking for quality gaps
- **Scope Misjudgment**: Focused on proving existing functionality works vs improving test quality/CI stability
- **AC Misread**: ACs like "Critical frontend tests are deterministic in CI" require FIXING tests, not just documenting they exist

**Correct Approach for "Hardening" Issues**:
1. **"Hardening" = BUILD WORK** - Always treat as implementation requiring code/test changes
2. **Check E2E Test Quality**: Count arbitrary timeouts (`grep -r "waitForTimeout" e2e/`), check CI pass rate
3. **Replace Arbitrary Waits**: Use semantic waits (`await expect(element).toBeVisible({ timeout: X })`)
4. **Fix CI Failures**: Investigate "action_required" status, fix root causes (timing, auth init, etc.)
5. **Add Missing Tests**: If test coverage gaps exist, write tests FIRST
6. **Improve Error Messages**: Replace console.error with user-friendly toasts/alerts
7. **Deliver PROOF**: Green CI status + reduced timeout count + improved test pass rate

**Pattern: What "Hardening" Means**:
- **Stability Hardening**: Fix flaky tests, replace arbitrary waits, improve CI pass rate
- **UX Hardening**: Improve error messages, add loading states, handle edge cases
- **Security Hardening**: Add input validation, sanitization, XSS prevention
- **Compliance Hardening**: Strengthen audit trails, improve validation messaging, add determin istic state transitions

**Red Flags This Was BUILD, Not Validation**:
- ✅ Issue title contains "**hardening**" (means improve/strengthen)
- ✅ Issue title contains "Next MVP **step**" (implies new work, not just validation)
- ✅ 307 arbitrary `waitForTimeout()` calls in E2E tests (clear quality gap)
- ✅ CI status "action_required" (needs fixes, not just documentation)
- ✅ Product owner asks for "E2E coverage with semantic waits **only**" (implementation directive)

**When to Do HARDENING vs VALIDATION**:
- **HARDENING**: Issue title has "hardening", "stability", "determinism" + mentions test improvements/CI fixes
- **VALIDATION**: Issue title has "validate" + roadmap 100% complete + all tests passing + PO asks for proof only

**E2E Test Hardening Pattern** (Replacing Arbitrary Timeouts):
```typescript
// ❌ WRONG (brittle, timing-dependent):
await page.waitForTimeout(10000) // Hope auth store initializes in time

// ✅ CORRECT (semantic, deterministic):
const title = page.getByRole('heading', { name: /Expected Title/i })
await expect(title).toBeVisible({ timeout: 60000 }) // Wait for actual element

// ✅ CORRECT (wait for multiple conditions):
await page.waitForFunction(() => {
  const hasElement = document.querySelector('.expected-element')
  const hasData = window.myGlobalState?.loaded === true
  return hasElement && hasData
}, { timeout: 30000 })
```

**E2E Test Hardening Checklist**:
1. ✅ Replace `waitForTimeout()` with `expect(element).toBeVisible()`
2. ✅ Use `waitForLoadState('load')` before assertions — NOT `'networkidle'` (Vite HMR SSE blocks it)
3. ✅ Increase timeouts for CI (45-60s vs 10-15s locally)
4. ✅ Use `waitForFunction()` for complex state checks
5. ✅ Add explicit error messages to waits for debugging
6. ✅ Test locally AND in CI mode (`CI=true npm run test:e2e`)
7. ✅ Document any unavoidable CI skips with business justification

**Never Again**:
- ❌ Deliver only documentation for "hardening" issues
- ❌ Ignore 307 arbitrary timeouts in E2E tests
- ❌ Claim "tests passing" without proving CI is green
- ❌ Skip E2E test improvements when issue explicitly asks for them

## 🚨 ABSOLUTE PRIORITY: TESTING COMPLIANCE 🚨

**CRITICAL ENFORCEMENT:** Under NO circumstances shall any work be completed with failing tests or insufficient test coverage. Previous violations have resulted in production bugs and must never recur.

- **IMMEDIATE ACTION REQUIRED:** If any test fails or coverage drops below thresholds (see Testing section for exact values), STOP ALL WORK and fix immediately.
- **ZERO TOLERANCE:** Failing tests block all progress. Coverage below thresholds blocks completion.
- **VERIFICATION MANDATORY:** Run full test suite and coverage check before ANY code changes and after EVERY change.
- **NEW CODE STANDARDS:** Aim for 70%+ branch coverage on all new code. The project threshold (68.5%) accounts for legacy technical debt.

**PAST VIOLATIONS:** Copilot has previously finished work with failing tests and reduced coverage, violating these instructions. This has introduced bugs and reduced quality. This MUST NOT happen again.

**CRITICAL PAST VIOLATION - February 2026**: Copilot submitted PR #419 with only E2E tests but NO unit/integration tests for the underlying logic being tested (auth store, router guard). This was rejected by product owner. ALWAYS write unit/integration tests FIRST, then E2E tests to validate the complete user journey.

## 🚨 TEST PYRAMID ENFORCEMENT 🚨

**MANDATORY TEST ORDER** - Tests must be written in this order:

1. **FIRST: Unit Tests** - Test individual functions, stores, utilities in isolation
   - Auth stores, router guards, services, utilities
   - Minimum 15+ tests for new stores, 10+ for utilities
   - These are FAST (milliseconds) and test logic directly
   
2. **SECOND: Integration Tests** - Test interactions between components
   - Store + router guard interactions
   - Component + store interactions
   - Service integrations
   
3. **LAST: E2E Tests** - Test complete user journeys
   - These are SLOW (seconds) and test the full stack
   - Used to validate user flows, not test logic
   - E2E tests without unit tests = INCOMPLETE COVERAGE

**WHY THIS MATTERS**:
- Unit tests catch 80% of bugs in milliseconds
- E2E tests catch 20% of bugs in minutes
- E2E-only testing is 100x slower and misses edge cases
- Product owner WILL REJECT PRs with E2E-only coverage

**EXAMPLE - Auth-First Routing**:
❌ **WRONG**: Only add E2E tests for login flow
✅ **CORRECT**: 
- Unit tests for auth store (24 tests) - test initialization, persistence, edge cases
- Integration tests for router guard (17 tests) - test routing logic directly  
- E2E tests (13 tests) - test complete user journey

## 🚨 PRODUCT OWNER QUALITY REQUIREMENTS 🚨

**MANDATORY COMPLETENESS CHECKLIST** - Work is NEVER considered complete without ALL of the following:

### 1. Test Coverage Requirements (MANDATORY)
- [ ] **Unit Tests**: Minimum 15+ tests for new stores, 10+ for new utilities, 10+ for new components
- [ ] **E2E Tests**: Minimum 10+ tests for new views/pages, 5+ for wizard steps
- [ ] **Component Tests**: Every new component MUST have unit tests covering props, events, edge cases
- [ ] **Integration Tests**: State transitions and API interactions must be tested
- [ ] **Test Matrix Document**: Create comprehensive testing matrix (e.g., `FEATURE_TESTING_MATRIX.md`) with:
  - Unit test counts and coverage areas
  - Integration test patterns
  - E2E test descriptions with scenarios
  - Edge case validation
  - Business value linkage to roadmap
  - Test evidence (pass/fail counts, duration)

### 2. Documentation Requirements (MANDATORY)
- [ ] **Implementation Summary**: Create `FEATURE_IMPLEMENTATION_SUMMARY.md` with:
  - Business value analysis (revenue impact, user impact, risk reduction)
  - Technical architecture deep dive
  - Acceptance criteria mapping (with test evidence)
  - Risk assessment and mitigation strategies
  - Rollout plan with phases
  - Dependencies and assumptions
- [ ] **Testing Matrix**: Link tests to acceptance criteria explicitly
- [ ] **Manual Verification Checklist**: 5+ step-by-step test scenarios for product owner
- [ ] **Screenshots/Videos**: Visual evidence of key user flows and states

### 3. Quality Gates (MANDATORY BEFORE COMPLETION)
- [ ] **All Tests Pass Locally**: Exact count (e.g., 2737/2762 passing)
- [ ] **Build Succeeds**: Zero TypeScript errors, zero build warnings
- [ ] **Test Coverage**: New code ≥70% branch coverage
- [ ] **E2E Tests Pass**: All critical user flows validated
  - **MANDATORY:** Run `npm run test:e2e` for affected feature areas before completion
  - **CRITICAL:** Auth-first tests must pass (auth-first-token-creation.spec.ts)
  - **REQUIRED:** Document pass counts (e.g., "8/8 auth-first tests passing")
  - **PROHIBITED:** Never skip E2E tests without 10+ optimization attempts AND local 100% pass rate
- [ ] **No Regressions**: All existing tests still pass
- [ ] **ALL CI Checks Green**: Every required check must pass, including pre-existing test suites
- [ ] **Accessibility Check**: WCAG 2.1 AA baseline (labels, contrast, keyboard)
- [ ] **Business Roadmap Alignment**: Verify changes align with product definition
  - **Email/password only** - No wallet connector UI
  - **Backend token deployment** - No frontend signing/deployment
  - **Compliance-first** - MVP blockers addressed per roadmap
  - **Auth-first routing** - Unauthenticated users redirected to login

**🚨 CRITICAL: CI FAILURE POLICY 🚨**

**ZERO TOLERANCE FOR CI FAILURES** - Product owner requires ALL CI checks to be green before merge, including tests unrelated to your changes.

**If CI fails with pre-existing test failures:**
1. **DO NOT** claim "pre-existing failures" as excuse to merge
2. **DO NOT** finish work with any failing tests in CI
3. **MUST** either:
   - Fix ALL failing tests (including pre-existing ones)
   - OR get explicit Product Owner approval with documented list of known failures
   - OR work with Product Owner to disable/skip flaky tests

**Past Violations:** Previous work was rejected multiple times for pre-existing CI failures. Product owner expects "every required check is green" - no exceptions.

**🚨 EXCEPTION: CI ABSOLUTE TIMING CEILING 🚨**

**When Extensive Optimization Fails** - After exhaustive optimization attempts (10+) with no improvement in CI E2E test pass rate:

1. **Verify Tests Pass Locally**: Must pass 100% in local environment
2. **Document Optimization History**: List all timing increases attempted (e.g., 12 attempts: 2s→10s auth, 15s→45s visibility, 2s→5s steps, 3s→10s cumulative)
3. **Confirm Root Cause**: CI environment significantly slower (10-20x) than local for complex multi-step flows
4. **Pragmatic Solution**: Skip failing tests in CI environment only using `test.skip(!!process.env.CI, 'reason')`
5. **Documentation**: Add detailed comments explaining why tests are skipped in CI
6. **Keep Tests Active Locally**: Tests must remain active for local validation of functionality

**Pattern for CI-Only Skip**:
```typescript
test('test name', async ({ page }) => {
  // Skip in CI due to absolute timing ceiling after X optimization attempts
  // Test passes 100% locally, validates functionality. CI environment 10-20x slower.
  test.skip(!!process.env.CI, 'CI absolute timing ceiling: description')
  
  // ... rest of test
})
```

**This exception applies ONLY when:**
- Tests pass 100% locally with same code/timeouts
- 10+ optimization attempts made with no CI improvement
- Total wait times exceed 90s+ per test
- Functionality is validated through local execution
- Product owner is informed with detailed analysis

### 4. Issue Linkage and Acceptance Criteria (MANDATORY)
- [ ] **Link to Issue Number**: PR description must reference issue (e.g., "Closes #389")
- [ ] **Map ALL Acceptance Criteria**: Each criterion from issue mapped to implementation + tests
- [ ] **Provide Test Evidence**: For each criterion, show which tests validate it

### 5. Risk Controls Documentation (MANDATORY)
- [ ] **False Positive Prevention**: How system prevents incorrect blocking
- [ ] **False Negative Prevention**: How system prevents incorrect approval
- [ ] **Error Handling**: All error states have explicit user-facing messages
- [ ] **Rollback Plan**: How to revert if critical issues arise

### 6. No Wallet Connector Verification (MANDATORY)
- [ ] **E2E Tests Verify**: No wallet connector buttons/text appear
- [ ] **Code Review**: Grep for wallet-related imports (WalletConnect, Pera, Defly, MetaMask)
- [ ] **Explicit Statement**: "This PR does not introduce wallet connectors. Email/password authentication only."

### 7. Build Verification (MANDATORY BEFORE COMPLETION)
- [ ] **TypeScript Compilation**: Run `npm run build` and ensure zero errors
  - ❌ **Common Error**: String comparison with empty string for union types (`organizationType !== ''`)
  - ✅ **Solution**: Use `.length > 0` for string comparisons with union types
- [ ] **Missing Imports**: Check all imports are present (especially services/utilities)
  - ❌ **Common Error**: Using service without importing (e.g., `launchTelemetryService` used but not imported)
  - ✅ **Solution**: Add import statement at top of file
- [ ] **Build Warnings**: Address all warnings, don't just ignore them
- [ ] **Verify Build Output**: Check dist/ folder is generated correctly

### 7a. TypeScript Store API Verification (MANDATORY) 🆕

**🚨 CRITICAL PAST VIOLATION - February 19, 2026 🚨**

**Violation**: Copilot used incorrect store API properties causing TypeScript compilation failures:
- Used `guidedLaunchStore.selectedTemplate` when correct API is `guidedLaunchStore.currentForm.selectedTemplate`
- Used `guidedLaunchStore.hasDraft()` when no such method exists (should use `loadDraft()` return value)
- Used `draft.network` when correct property is `draft.selectedNetwork`

**Root Cause**: Assumed store structure without verifying actual store implementation.

**Correct Approach BEFORE Using Any Store**:
1. **READ STORE FILE**: Check `src/stores/[storeName].ts` for exported properties and methods
2. **CHECK RETURN BLOCK**: Look at the store's return statement to see what's actually exported
3. **VERIFY PROPERTY PATHS**: Nested properties like `currentForm.selectedTemplate` must be accessed correctly
4. **TEST BUILD IMMEDIATELY**: Run `npm run build` after ANY store integration to catch errors early

**Common Store Patterns**:
```typescript
// ❌ WRONG - Assuming direct property access
guidedLaunchStore.selectedTemplate // Doesn't exist!

// ✅ CORRECT - Access via currentForm
guidedLaunchStore.currentForm.selectedTemplate

// ❌ WRONG - Assuming method exists
if (guidedLaunchStore.hasDraft()) { ... } // No such method!

// ✅ CORRECT - Use actual store methods
const hasDraft = guidedLaunchStore.loadDraft() // Returns boolean
if (hasDraft) { ... }

// ❌ WRONG - Wrong property name
draft.network // Doesn't exist on TokenDraftForm!

// ✅ CORRECT - Use actual property name
draft.selectedNetwork // Correct property name
```

**Verification Checklist**:
- [ ] Read store file to understand API structure
- [ ] Check if property is direct or nested (e.g., `store.prop` vs `store.form.prop`)
- [ ] Verify method exists by checking store's return block
- [ ] Run `npm run build` immediately after integration
- [ ] Fix TypeScript errors BEFORE committing

**Never Assume Store Structure** - Always verify by reading the actual store implementation!

### 7b. Utility Integration Verification (MANDATORY FOR NEW UTILITIES) 🆕

**🚨 CRITICAL PAST VIOLATION - February 26, 2026 (Issue #488) 🚨**

**Violation**: Copilot delivered `authFirstIssuanceWorkspace.ts` utility with 178 tests but did NOT integrate it into the actual `GuidedTokenLaunch.vue` view. The utility defined `ISSUANCE_TEST_IDS` constants for `data-testid` anchors but none were added to the view template. Utility functions (`isIssuanceSessionValid`, `storeIssuanceReturnPath`, `consumeIssuanceReturnPath`, `buildStepEnteredEvent`) were never imported or called from the router or view — despite 3 repeated product owner rejection cycles.

**What Went Wrong**:
- Utility was created with comprehensive test coverage (136 unit + 42 integration + 20 E2E tests)
- BUT the Vue component that uses the issuance flow had zero `data-testid` attributes matching the utility's constants
- Product owner feedback: "delivered work was not finished in proper quality" (repeated 3+ times)
- The utility's `isIssuanceSessionValid`, `storeIssuanceReturnPath`, `consumeIssuanceReturnPath`, `ISSUANCE_TEST_IDS` were never imported in the router or view
- Added `data-testid` anchors to view template but still used **hardcoded strings** instead of importing `ISSUANCE_TEST_IDS` constants — this still does not constitute "integration"

**Root Cause**:
- **Utility-without-integration pattern**: Creating helpers without wiring them into the consuming views
- **No integration verification step**: Did not check that data-testid constants defined in the utility are PRESENT in the template via import, not hardcoded
- **Missing completeness check**: Did not verify the utility is `import`ed anywhere besides tests
- **Repeated oversight**: Even after adding data-testid attributes, the constants were hardcoded strings — not imported from the utility

**Correct Approach for New Utility/Helper Files**:
1. **CHECK WHO CONSUMES IT**: After writing the utility, ask "Which Vue component or store uses this?"
2. **IMPORT AND USE CONSTANTS**: If utility defines `ISSUANCE_TEST_IDS`, IMPORT them and use `:data-testid="ISSUANCE_TEST_IDS.WORKSPACE_SHELL"` — NOT hardcoded strings
3. **WIRE FUNCTIONS**: Route guard utilities must be called from `src/router/index.ts`. Session/lifecycle utilities must be called from `onMounted`. Telemetry builders must be called in event handlers.
4. **GREP TO VERIFY**: Run `grep -r 'authFirstIssuanceWorkspace' src/ --include='*.vue' --include='*.ts' | grep -v test` to confirm non-test usage
5. **100% BRANCH COVERAGE**: New utilities must achieve ≥98% branch coverage, not just line coverage

**Verification Checklist for New Utilities**:
```bash
# 1. Check the utility is imported somewhere non-test
grep -r 'yourUtility' src/ --include='*.vue' --include='*.ts' | grep -v test | grep -v __tests__

# 2. Check constants are IMPORTED and USED (not just hardcoded strings with matching values)
grep -r 'ISSUANCE_TEST_IDS' src/views/ --include='*.vue'
# Must show: :data-testid="ISSUANCE_TEST_IDS.WORKSPACE_SHELL" — NOT data-testid="issuance-workspace-shell"

# 3. Check route guard functions are actually called in router
grep -r 'isIssuanceSessionValid\|storeIssuanceReturnPath' src/router/

# 4. Verify coverage is truly comprehensive
npx vitest run --coverage src/utils/__tests__/yourUtility.test.ts
# Target: 100% branches, 100% functions, 100% lines
```

**Pattern Example (Correct)**:
```typescript
// ✅ Router uses utility function for structural session validation
import { isIssuanceSessionValid, storeIssuanceReturnPath } from '../utils/authFirstIssuanceWorkspace'
const isAuthenticated = to.name === 'GuidedTokenLaunch'
  ? isIssuanceSessionValid(algorandUser)  // more stringent check
  : !!algorandUser

// ✅ View imports and uses constants (NOT hardcoded strings)
import { ISSUANCE_TEST_IDS, consumeIssuanceReturnPath } from '../utils/authFirstIssuanceWorkspace'
// In template:
<div :data-testid="ISSUANCE_TEST_IDS.WORKSPACE_SHELL">  // ← imported constant, not "issuance-workspace-shell"

// ✅ View uses lifecycle function in onMounted
const savedPath = consumeIssuanceReturnPath()
if (savedPath) router.replace(savedPath)
```

**Pattern Example (Wrong — still fails even with data-testids present)**:
```typescript
// ❌ WRONG: utility imported in tests only, NOT in router or view
// router/index.ts — no import of authFirstIssuanceWorkspace
// views/GuidedTokenLaunch.vue — no import of authFirstIssuanceWorkspace

// ❌ WRONG: hardcoded strings that happen to match utility constants
<div data-testid="issuance-workspace-shell">  // ← NOT using ISSUANCE_TEST_IDS
```

**Red Flags This Pattern Is Repeating**:
- ✅ Utility file created but not imported in any .vue file
- ✅ Constants like `SOME_TEST_IDS` defined but `data-testid` attributes are hardcoded strings, not imported constants
- ✅ PR only adds test files + utility file, no Vue component changes
- ✅ E2E test uses `page.content()` string checks instead of `[data-testid]` locators
- ✅ Route guard utility functions not present in `src/router/index.ts`
- ✅ Lifecycle utilities (`consumeIssuanceReturnPath`) not called in `onMounted`

**Never Again**:
- ❌ Create a utility with `data-testid` constants without importing and using those constants in the template
- ❌ Submit PR with utility + tests only — at least one non-test consumer required
- ❌ Accept "utility coverage is high" as complete — must verify VIEW and ROUTER integration
- ❌ Treat hardcoded strings as "integration" — import the constants and use them

### 7c. Hardcoded Test Data Length Verification (MANDATORY FOR TESTS WITH LENGTH ASSERTIONS) 🆕

**🚨 CRITICAL PAST VIOLATION - March 1, 2026 (PR #508) 🚨**

**Violation**: Copilot added E2E spec `arc76-validation.spec.ts` Section 3 with mock Algorand addresses that were 57 characters long, but the test assertion was `>= 58`. This caused CI failures: `Expected >= 58, Received 57`.

**Root Cause**:
- Hardcoded `MOCK_ARC76_ADDRESS_A = 'BIATECTEST7ARC76DERIVEDADDRESSAAAAAAAAAAAAAAAAAAAAAAAAAAA'` (57 chars)
- Test asserted `expect(MOCK_ARC76_ADDRESS_A.length).toBeGreaterThanOrEqual(58)`
- Did NOT run the test locally before committing (would have caught the off-by-one error immediately)

**Correct Approach for Tests with Length/Format Assertions on Hardcoded Data**:
1. **VERIFY BEFORE COMMITTING**: Run `node -e "console.log('MOCK_ADDR'.length)"` to confirm length
2. **ASSERT ONLY WHAT'S TRUE**: If the address is 57 chars, either make it 58 or assert `>= 57`
3. **RUN AFFECTED SPEC LOCALLY**: Always run the specific spec file before pushing:
   ```bash
   npx playwright test e2e/arc76-validation.spec.ts --headed=false
   ```
4. **UNIT TEST MOCK DATA**: Add a unit test (e.g., in `arc76SessionContract.test.ts`) that asserts
   the mock address values used in E2E tests meet the length contract. This catches regressions.

**Quick Verification Pattern** (before/after showing the PR #508 defect):
```bash
# ❌ WRONG — was committed without verification (PR #508):
# const MOCK_A = 'BIATECTEST7ARC76DERIVEDADDRESSAAAAAAAAAAAAAAAAAAAAAAAAAAA' // 57 chars
# expect(MOCK_A.length).toBeGreaterThanOrEqual(58) // FAILS: 57 < 58

# ✅ CORRECT — verify before committing:
node -e "
const MOCK_A = 'BIATECTEST7ARC76DERIVEDADDRESSAAAAAAAAAAAAAAAAAAAAAAAAAAAA'; // 58 chars
console.log('length:', MOCK_A.length, 'passes >= 58?', MOCK_A.length >= 58);
"
# Output: length: 58 passes >= 58? true
```

**Never Again**:
- ❌ Write `expect(MOCK_STRING.length).toBeGreaterThanOrEqual(N)` without verifying the string is actually >= N chars
- ❌ Push new E2E tests without running them locally first
- ❌ Trust that a "comment says 58 chars" without verifying the actual string length

### 7d. Syntax Validation for New E2E Spec Files (MANDATORY) 🆕

**🚨 CRITICAL PAST VIOLATION - March 3, 2026 (PR #554) 🚨**

**Violation**: Copilot committed `arc76-determinism.spec.ts` with an unbalanced brace structure — the second test inside the first `test.describe()` block was missing its `})` closing bracket, and the outer `test.describe` was also missing its `})`. This silently dropped Section 1's second test and the entire describe block from CI.

**Root Cause**:
- New E2E test file written without running `node -e "... brace check ..."` before committing
- No local syntax validation step before `report_progress`
- The missing brackets caused a runtime parse failure not caught until code review

**Correct Approach for EVERY New E2E Spec File**:
1. **BRACE COUNT CHECK**: After writing, always verify balanced braces:
   ```bash
   node -e "
   const fs = require('fs');
   const code = fs.readFileSync('e2e/my-spec.spec.ts', 'utf8');
   const open = (code.match(/\{/g)||[]).length;
   const close = (code.match(/\}/g)||[]).length;
   console.log('Open:', open, 'Close:', close, 'Diff:', open - close);
   // Diff must be 0
   "
   ```
2. **DESCRIBE/TEST COUNT**: Verify the number of `test.describe()` calls matches expected:
   ```bash
   grep -c "test.describe(" e2e/my-spec.spec.ts  # should match your plan
   grep -c "test('" e2e/my-spec.spec.ts          # should match planned test count
   ```
3. **TYPESCRIPT PARSE TEST**: Quick TS parse check before committing:
   ```bash
   node --input-type=module < <(echo "import * as f from './e2e/my-spec.spec.ts'") 2>&1 | head -5
   ```
4. **NEVER commit a spec file that wasn't run locally first** — use `npx playwright test e2e/my-spec.spec.ts --headed=false` in CI simulation.

**Minimum Quality Bar for E2E Spec Files Before Committing**:
- [ ] Brace count diff = 0
- [ ] `test.describe` count matches planned sections
- [ ] `test(` count matches planned test count
- [ ] TypeScript parses without syntax errors (check via `npx tsc --noEmit e2e/my-spec.spec.ts`)

**Never Again**:
- ❌ Commit a spec file with unbalanced braces
- ❌ Skip the brace-count check after writing a new spec file
- ❌ Trust indentation to indicate correct brace nesting (count them explicitly)

### 7e. Wallet-Pattern Regex Must Use Word Boundaries for "Pera" (MANDATORY) 🆕

**🚨 CRITICAL PAST VIOLATION - March 4, 2026 (PR #554) 🚨**

**Violation**: Copilot used `/WalletConnect|MetaMask|Pera|Defly/i` in E2E wallet-pattern assertions. After "Operations" was added to the nav, this regex matched "o**pera**tions" via the bare `/Pera/i` alternative (case-insensitive), causing 3 false-positive failures: `homepage navigation contains no wallet connector UI` in `conversion-first-guided-launch.spec.ts`.

**Root Cause**:
- Nav text: `"...Portfolio Operations Compliance..."` — "Operations" contains the substring "pera"
- `/Pera/i` matches "pera" anywhere without word boundaries
- Same root cause was previously fixed in unit test files (`.test.ts`) but E2E spec files were not fully audited

**Correct Pattern** (MANDATORY for all wallet-pattern assertions):
```typescript
// ❌ WRONG - /Pera/i matches "operations" as substring
expect(navText).not.toMatch(/WalletConnect|MetaMask|Pera|Defly/i)

// ✅ CORRECT - \bPera\b requires word boundary, won't match "operations"
expect(navText).not.toMatch(/WalletConnect|MetaMask|\bPera\b|Defly/i)

// ✅ ALSO CORRECT - "Pera Wallet" requires a space after "Pera"
expect(navText).not.toMatch(/WalletConnect|MetaMask|Pera Wallet|Defly/i)
// or
expect(navText).not.toMatch(/WalletConnect|MetaMask|Pera.*Wallet|Defly/i)
```

**Pre-Commit Check** for any wallet-pattern regex:
```bash
# Test that the regex does NOT match known nav labels
node -e "
const nav = 'Home Guided Launch Dashboard Portfolio Operations Compliance Pricing Settings';
const pattern = /WalletConnect|MetaMask|\bPera\b|Defly/i;
const m = nav.match(pattern);
if (m) { console.error('FALSE POSITIVE:', m[0]); process.exit(1); }
else console.log('OK: no false positives in nav text');
"
```

**Never Again**:
- ❌ Write `/Pera/i` without `\b` word boundaries in wallet pattern assertions
- ❌ Audit only `.test.ts` files — always check E2E `.spec.ts` files too
- ❌ Add new nav labels without scanning E2E wallet-pattern regexes for false positives
- ❌ Use broad `connect.*wallet|wallet.*connect` patterns — these match product copy like "No wallet needed to get started—connect one later when you're ready." Use specific brand names only: `/WalletConnect|MetaMask|\bPera\b|Defly/i`

### 7h. Global Playwright Timeout Must Cover Cold-Start Browser Context Overhead (MANDATORY) 🆕

**🚨 CRITICAL PAST VIOLATION - March 4, 2026 (PR #566) 🚨**

**Root cause confirmed via trace analysis**: The router (`src/router/index.ts`) uses STATIC imports for 30+ view components. The FIRST page load in CI causes Vite to compile the entire ~2.5MB bundle — this takes **60-120 seconds** in CI. Tests whose attempt 0 runs on a cold Vite worker fail (timeout), then pass on attempt 1 (warm Vite). Playwright marks `FullResult.status = 'failed'` causing exit code 1.

**Important: `trace: "on-first-retry"` traces show PASSING RETRIES, not failures.**
The `.zip` trace files in `playwright-report/data/` are from attempt 1 (the retry). If traces show 2-4s duration, the test PASSED quickly on retry because Vite was warm. Attempt 0 silently failed due to cold Vite exceeding the timeout.

**Root Cause Diagnostic** (how to confirm this pattern):
1. Download the Playwright HTML report artifact from the failing CI run
2. Look for `.zip` trace files in `playwright-report/data/` — each `.zip` = one retried test
3. Read `0-trace.stacks` to identify which spec file; read `0-trace.trace` for event timing
4. If traces show 2-4s duration → tests PASSED on retry; cold Vite caused attempt 0 to fail
5. Check `src/router/index.ts` — if routes use static imports → cold Vite is the root cause

**Primary Fix: Pre-warm Vite in globalSetup (MANDATORY)**:
```typescript
// e2e/global-setup.ts — visit key routes BEFORE any tests start
import { chromium, FullConfig } from '@playwright/test'

async function globalSetup(_config: FullConfig) {
  const browser = await chromium.launch()
  const page = await browser.newPage()
  try {
    // Seed auth so guarded routes render their full component tree (not redirect)
    await page.addInitScript((auth: string) => {
      localStorage.setItem('algorand_user', auth)
    }, JSON.stringify({ address: 'GLOBALSETUPWARMUP7...58chars', email: 'warmup@biatec.io', isConnected: true }))

    // These 3 visits compile ALL statically-imported Vue components:
    // CRITICAL: Use 'load' NOT 'networkidle' — Vite HMR SSE keeps a persistent
    // SSE connection, preventing networkidle from EVER completing. Using 'networkidle'
    // means the warmup silently fails (120s timeout → caught exception → Vite never warmed).
    await page.goto('http://localhost:5173/', { waitUntil: 'load', timeout: 120000 })
    await page.goto('http://localhost:5173/launch/guided', { waitUntil: 'load', timeout: 120000 })
    await page.goto('http://localhost:5173/compliance/setup', { waitUntil: 'load', timeout: 120000 })
  } catch (err) {
    console.warn(`[globalSetup] Warmup failed (non-fatal): ${err}`)
  } finally {
    await browser.close()
  }
}
```

**Secondary Fix: Per-test timeouts as belt-and-suspenders** (for tests that navigate to heavy pages):
```typescript
test('test navigating to /launch/guided or /compliance/setup', async ({ page }) => {
  test.setTimeout(90000) // Belt-and-suspenders if globalSetup warmup incomplete
  // ...
})
```

**Never Again**:
- ❌ Set global Playwright `timeout` below 60s — cold-start takes 60-120s in CI
- ❌ Leave `globalSetup` empty — it MUST pre-warm Vite by visiting key routes
- ❌ Use `waitUntil: 'networkidle'` in `globalSetup` `page.goto()` calls — Vite HMR SSE blocks networkidle, the warmup silently times out and Vite is NEVER warmed (see section 7i)
- ❌ Use `toBeVisible({ timeout: 60000 })` in a test with only 60s global budget — add `test.setTimeout(90000)`
- ❌ Treat retry trace duration as "test failure duration" — traces are from PASSING retries
- ❌ Treat "0 failed, X passed" as a CI success signal — check `FullResult.status` in reporter output
- ❌ Use `waitForLoadState('networkidle')` in tests with `test.setTimeout(90000)` — Vite HMR SSE blocks networkidle (see section 7i)

**Confirmed files affected** (resolved in commits 6a5a921, f1cc5ab, and current):
- Global: `playwright.config.ts` timeout 30s→60s, `navigationTimeout: 30000`, `e2e/global-setup.ts` pre-warmup added
- Per-test `test.setTimeout(90000)` + `waitForLoadState('load')`: `auth-first-token-creation.spec.ts:118`, `accessibility-first-launch.spec.ts:280`, `accessibility-conversion-hardening.spec.ts:421`, `guided-launch-hardening.spec.ts:116`

### 7i. Vite HMR SSE Blocks `waitForLoadState('networkidle')` in CI (MANDATORY) 🆕

**🚨 CRITICAL PAST VIOLATION - March 4, 2026 (PR #566 continuation) 🚨**

**Violation**: 4 tests with `test.setTimeout(90000)` used `waitForLoadState('networkidle')` and timed out on ALL 3 attempts (90s × 3 = 270s wasted per test). Playwright report showed `status=timedOut, unexpected: 4` causing `FullResult.status='failed'` and exit code 1.

**Root Cause**: Vite's HMR (Hot Module Replacement) dev server maintains a persistent SSE (Server-Sent Events) connection with every connected browser page. This open connection prevents `waitForLoadState('networkidle')` from completing because Playwright's networkidle requires **no network connections for 500ms**. With `test.setTimeout(90000)`, the navigation timeout inherits the 90s budget, causing each test to silently wait 90s before failing.

**Why some tests with networkidle pass**: Tests with the global 60s timeout have `navigationTimeout: 30000` as a cap (now configured globally), fail at 30s, and succeed on retry when HMR is quieter. Tests with `test.setTimeout(90000)` previously had 90s cap, causing all 3 attempts to fail before HMR settled.

**Correct Approach**:
```typescript
// ❌ WRONG - hangs indefinitely when Vite HMR SSE is active
await page.goto('/launch/guided')
await page.waitForLoadState('networkidle') // SSE connection = network always active = waits test.setTimeout

// ✅ CORRECT - use 'load' (DOM + resources ready) or 'domcontentloaded'
await page.goto('/launch/guided')
await page.waitForLoadState('load') // Fires when JS/CSS/images loaded, ignores SSE connection
// Then use explicit element wait:
await expect(page.getByRole('heading', { name: /Expected Title/i })).toBeVisible({ timeout: 60000 })

// ✅ ALSO CORRECT - rely on element assertion as the semantic wait (skip waitForLoadState entirely)
await page.goto('/launch/guided')
const heading = page.getByRole('heading', { name: /Guided Token Launch/i, level: 1 })
await expect(heading).toBeVisible({ timeout: 60000 }) // This IS the semantic wait
```

**Global Safety Net Added**: `playwright.config.ts` now has `navigationTimeout: 30000`. This caps ALL `waitForLoadState()` calls at 30s, preventing tests from hanging 60-90s. Any test that uses `networkidle` will fail quickly at 30s and retry.

**CRITICAL DISCOVERY**: `navigationTimeout: 30000` does NOT reliably cap `waitForLoadState('networkidle')` in Playwright v1.58 when used inside `test.setTimeout(90000)`. The test-level timeout (90s) can fire BEFORE the navigation timeout, causing `status='timedOut'` instead of `status='failed'`. This has two consequences:
1. The test times out at 90s on ALL 3 retry attempts (never passes) 
2. The test has `status='timedOut'` (capital O) not `'failed'` — the reporter must check `'timedOut'` not `'timedout'` (lowercase)!

**Affected Tests Fixed** (changed `networkidle` → `load`):
- `e2e/auth-first-token-creation.spec.ts` lines 92, 111, 125, 177, 185, 204 (all test.setTimeout(90000) tests)
- `e2e/accessibility-first-launch.spec.ts:280-303` (test.setTimeout(90000))
- `e2e/accessibility-conversion-hardening.spec.ts:421` (test.setTimeout(90000))
- `e2e/guided-launch-hardening.spec.ts:116` (test.setTimeout(90000))
- `e2e/mvp-stabilization.spec.ts` lines 147, 159, 182, 193, 219, 260 (all test.setTimeout(90000) tests)
- `e2e/compliance-setup-workspace.spec.ts` lines 40, 262 (all test.setTimeout(90000) tests)

**Diagnostic Pattern** (how to identify this issue):
1. CI reporter shows "0 failed" but Playwright exits code 1 → suspect `'timedOut'` case bug in reporter
2. Total tests count doesn't add up: e.g. "806 total, 783 passed, 19 skipped = 802 ≠ 806" → 4 tests unreported
3. Report shows `unexpected: 4, flaky: 0, ok: false` — tests fail ALL attempts (not just some)
4. Test duration = exactly `test.setTimeout` value on every attempt

**Never Again**:
- ❌ Use `waitForLoadState('networkidle')` in tests with `test.setTimeout(90000)` — use `'load'` instead
- ❌ Trust that `networkidle` works reliably in CI — Vite HMR SSE makes it non-deterministic
- ❌ Use `'timedout'` (lowercase) in reporter status checks — Playwright uses `'timedOut'` (capital O)!
- ❌ Assume `navigationTimeout: 30000` caps `waitForLoadState` inside 90s test — verify the timeout chain

### 7j. Cumulative Timeout Budget Must Stay Below test.setTimeout() Value (MANDATORY) 🆕

**🚨 CRITICAL PAST VIOLATION - March 5, 2026 (PR #566 continuation) 🚨**

**Violation**: 3 tests in `test.setTimeout(90000)` consistently timed out at exactly 90s on all 3 retry attempts. Root cause: `textContent()`, `click()`, and `innerText()` calls WITHOUT explicit timeouts inside `test.setTimeout(90000)` tests inherit the test budget (90s) as their action timeout. When combined with other steps that each have 30s explicit timeouts, the cumulative MAXIMUM exceeded 90s.

**Example pattern that caused the failure**:
```typescript
// ❌ WRONG — cumulative max = 5+30+30+45+90 = 200s > 90s budget
test.setTimeout(90000)
await loginWithCredentials(page) // 5s HTTP timeout
await page.goto('/route', { timeout: 30000 }) // max 30s
await page.waitForLoadState('load', { timeout: 30000 }) // max 30s
await expect(heading).toBeVisible({ timeout: 45000 }) // max 45s
const navText = await getNavText(page) // textContent() with NO timeout = inherits 90s!
```

**Root cause**: When `test.setTimeout(90000)` is active, ALL actions without explicit timeouts inherit 90s as their action timeout:
- `locator.click()` — no timeout → waits 90s if element doesn't respond
- `locator.textContent()` — no timeout → waits 90s if element not found
- `locator.innerText()` — no timeout → waits 90s if element not found

Even with `navigationTimeout: 30000` set globally, this does NOT apply to action methods.

**Correct Pattern**:
```typescript
// ✅ CORRECT — cumulative max = 5+15+10+30+20 = 80s < 90s budget
test.setTimeout(90000)
await loginWithCredentials(page) // 5s HTTP timeout (fallback to localStorage)
await page.goto('/route', { timeout: 15000 }) // Vite pre-warmed: 15s sufficient
await page.waitForLoadState('load', { timeout: 10000 }) // Vite pre-warmed: 10s sufficient
await expect(heading).toBeVisible({ timeout: 30000 }) // Reduced: fits budget
const nav = page.getByRole('navigation').first()
const navText = await nav.textContent({ timeout: 10000 }).catch(() => '') // EXPLICIT timeout!

// Also applies to click():
await button.click({ timeout: 5000 }) // If button isVisible() confirmed, 5s is enough
```

**Budget Calculation Rule** (MANDATORY before committing tests with test.setTimeout):
```
SUM of all max timeouts < test.setTimeout value
= loginWithCredentials(5) + goto(15) + waitForLoadState(10) + toBeVisible(30) + textContent(10) + other_actions(5)
= 75s < 90s ✓

For tests with 2 navigation sequences:
= loginWithCredentials(5) + goto1(10) + load1(8) + visible1(20) + goto2(10) + load2(8) + visible2(20)
= 81s < 90s ✓
```

**Key guidelines**:
1. Since `globalSetup` pre-warms Vite, page.goto() and waitForLoadState() complete in 2-5s, not 15-30s. Use 15s/10s timeouts (not 30s) for these operations in test.setTimeout(90000) tests.
2. toBeVisible() timeout: use 20-30s (not 60s) since Vite is pre-warmed.
3. ALWAYS add explicit `{ timeout: N }` to ALL `click()`, `textContent()`, `innerText()`, `innerHTML()` calls in test.setTimeout(90000) tests.

**🚨 CRITICAL REPEAT VIOLATION - March 5, 2026 (PR #566 mvp-deterministic-journey.spec.ts) 🚨**

**Violation**: Copilot wrote NEW E2E tests with `{ timeout: 30000 }` on `page.goto()`, `{ timeout: 30000 }` on `page.waitForLoadState()`, and `{ timeout: 45000 }` on `expect().toBeVisible()` inside `test.setTimeout(90000)`. Cumulative budget = 30+30+45 = 105s > 90s. Five tests had this over-budget pattern; the "guided launch page has no wallet connector UI" test timed out on ALL 3 retries (15 CI attempts wasted across the 5 tests). This violated the existing Section 7j guidelines that were already documented.

**Root Cause**: When writing new `test.setTimeout(90000)` tests from scratch, the WRONG pattern (`goto(30s)+load(30s)+visible(45s)`) was copy-pasted from old tests that predated the 7j guidelines, instead of using the correct pattern (`goto(15s)+load(10s)+visible(30s)`) that appears in fixed tests.

**Pre-Commit Mandatory Check** (before committing ANY new `test.setTimeout(90000)` test):
```bash
# Calculate budget for EACH new test:
node -e "
const goto = 15000;        // Vite pre-warmed (globalSetup): use 15s NOT 30s
const load = 10000;        // Vite pre-warmed (globalSetup): use 10s NOT 30s
const visible = 30000;     // Use 30s NOT 45s
const budget = 90000;
const sum = goto + load + visible;
// For tests with additional operations (e.g. attached, textContent), add those too
console.log('Budget used:', sum + 'ms / ' + budget + 'ms', sum < budget ? '✓' : '✗ OVER BUDGET');
"
# Must output: ✓ (NOT ✗ OVER BUDGET)
# For tests with 2 navigations or extra operations (e.g. attached(10s)):
# goto(15)+load(10)+visible(30)+attached(10) = 65s — still < 90s ✓
# goto1(10)+load1(8)+visible1(20)+goto2(10)+load2(8)+visible2(20) = 76s < 90s ✓
```

**Never Again**:
- ❌ Use `textContent()`, `click()`, or `innerText()` without explicit timeout in test.setTimeout(90000) tests
- ❌ Use `{ timeout: 30000 }` on goto/waitForLoadState — use 10-15s (Vite is pre-warmed in CI)
- ❌ Use `{ timeout: 45000 }` on toBeVisible in test.setTimeout(90000) tests — use 20-30s
- ❌ Skip the budget calculation — always sum all max timeouts and verify < test.setTimeout
- ❌ Navigate to `/launch/guided` for nav wallet UI checks — use `/` instead (same nav, fewer onMounted triggers)

**Auth-Heavy Page Pattern — Use Simpler Routes for Nav Assertions**

When the goal is to check that NO wallet connector UI appears in the navigation, always use the home page `/` instead of auth-protected routes like `/launch/guided` or `/compliance/setup`. The navigation component is IDENTICAL on every page. Navigating to auth-heavy routes adds complex `onMounted` operations (telemetry init, draft loading, session validation) that can consume CI timeout budget unpredictably.

```typescript
// ❌ WRONG — navigates to auth-heavy /launch/guided for a nav-only assertion
test('guided launch page has no wallet connector UI', async ({ page }) => {
  test.setTimeout(90000)
  await withAuth(page)
  await page.goto('/launch/guided', { timeout: 15000 })  // auth-heavy: complex onMounted
  await page.waitForLoadState('load', { timeout: 10000 })
  await expect(heading).toBeVisible({ timeout: 30000 }) // 55s total — too close to 90s budget
  const navText = await getNavText(page)
  expect(navText).not.toMatch(/WalletConnect|MetaMask|\bPera\b|Defly/i)
})

// ✅ CORRECT — nav is the same on every page; use /  for speed and reliability
test('guided launch page has no wallet connector UI', async ({ page }) => {
  // Budget: withAuth(0) + goto(10s) + load(5s) + getNavText(20s) = 35s << 60s global
  await withAuth(page)
  await page.goto('/', { timeout: 10000 })
  await page.waitForLoadState('load', { timeout: 5000 })
  const navText = await getNavText(page)
  expect(navText).not.toMatch(/WalletConnect|MetaMask|\bPera\b|Defly/i)
})
```

**Rule**: If cumulative max timeout slack is < 20s in a `test.setTimeout(90000)` test, redesign the test to use a simpler page or auth approach. CI scheduling overhead consumes 5–15s beyond the calculated maximum. Reference: `auth-first-token-creation.spec.ts` "should not display wallet/network UI elements in top navigation" for the canonical pattern.


**🚨 CRITICAL PAST VIOLATION - March 4, 2026 (PR #566) 🚨**

**Violation**: Copilot used `/connect.*wallet|wallet.*connect/i` in an E2E body text assertion (`page.locator('body').innerText()`). This broad pattern matched legitimate product copy: "No wallet needed to get started—connect one later when you're ready." causing 3 CI failures (1 test × 3 retries).

**Root Cause**:
- Pattern `wallet.*connect` matches "wallet" appearing anywhere before "connect" in the same string
- Product copy often legitimately mentions wallets in informational/negative contexts ("no wallet needed")
- The pattern was too broad — it tested for semantic proximity of two words without requiring they form a specific UI call-to-action

**Correct Pattern** (MANDATORY for body text wallet assertions):
```typescript
// ❌ WRONG - too broad, matches informational product copy
expect(bodyText).not.toMatch(/connect.*wallet|wallet.*connect/i)
// Matches: "No wallet needed to get started—connect one later when you're ready."

// ✅ CORRECT - specific brand names only, won't match informational copy
expect(navText).not.toMatch(/WalletConnect|MetaMask|\bPera\b|Defly/i)
// Does NOT match: "No wallet needed to get started—connect one later when you're ready."

// ✅ ALSO CORRECT - for E2E nav assertions, always use getNavText(page)
const navText = await getNavText(page)
expect(navText).not.toMatch(/WalletConnect|MetaMask|\bPera\b|Defly/i)
```

**Pre-Commit Check** for body text assertions:
```bash
node -e "
const bodyText = 'No wallet needed to get started—connect one later when you are ready.';
const badPattern = /connect.*wallet|wallet.*connect/i;
const goodPattern = /WalletConnect|MetaMask|\bPera\b|Defly/i;
const falsePositive = badPattern.test(bodyText);
const correctResult = goodPattern.test(bodyText);
if (falsePositive) { console.error('BAD pattern false-positives on product copy'); process.exit(1); }
if (correctResult) { console.error('GOOD pattern also false-positives - investigate'); process.exit(1); }
console.log('OK: patterns are correct');
"
```

**Never Again**:
- ❌ Use `connect.*wallet` or `wallet.*connect` in body text assertions — matches product copy
- ❌ Check `page.locator('body').innerText()` for wallet patterns — use `getNavText(page)` instead
- ❌ Skip the pre-commit regex test when writing new wallet assertions

### 7f. API Client + UI Component Integration Tests Are Mandatory (MANDATORY) 🆕

**🚨 CRITICAL PAST VIOLATION - March 4, 2026 (PR #558) 🚨**

**Violation**: Copilot delivered a typed API client (`backendDeploymentContract.ts`) and a UI component (`DeploymentStatusPanel.vue`) with separate unit tests, but did NOT deliver integration tests proving the API client's response shapes correctly flow into the component's props. Product owner requirement #3 explicitly asked for "integration tests for deployment status wiring."

**What Went Wrong**:
- API client had 33 unit tests + component had 36 unit tests = 69 tests total
- But NO test verified the wiring between them: that `result.data.state` from the client maps correctly to `props.state` on the component
- No test verified that `userGuidance` from the client reaches the component without raw error codes
- No test verified that `isIdempotentReplay` from the client flows to the component's replay notice
- Product owner correctly identified this as an incomplete integration

**Correct Approach When Delivering API Client + UI Component Together**:
1. **ALWAYS create an integration test file** `src/__tests__/integration/<Feature>.integration.test.ts`
2. **Minimum 10+ integration tests** covering:
   - Each terminal state (Completed, Failed) produces correct component rendering
   - Error guidance from client reaches component with no raw error codes
   - All discriminated union props (idempotency replay, audit trail URL, previousState) wire correctly
   - State machine transitions (e.g., Pending → Validated → Submitted) produce accurate step indicators
   - 4xx error responses from client fallback correctly to component error state
3. **File naming convention**: `src/__tests__/integration/<Feature>Wiring.integration.test.ts`

**Integration Test Pattern** (required for any API client + component pair):
```typescript
// src/__tests__/integration/BackendDeploymentStatusWiring.integration.test.ts
import { mount } from '@vue/test-utils'
import MyComponent from '../../components/MyComponent.vue'
import { MyApiClient } from '../../lib/api/myApiClient'

it('API response state flows correctly to component rendering', async () => {
  vi.stubGlobal('fetch', makeFetchOk({ state: 'Completed', assetId: '12345' }))
  const client = new MyApiClient('http://localhost:5000')
  const result = await client.getStatus('dep-001', 'bearer-token')
  expect(result.ok).toBe(true)
  if (!result.ok) return

  // Verify the wiring: API data → component props → rendered output
  const wrapper = mount(MyComponent, {
    props: { state: result.data.state, assetId: result.data.assetId },
  })
  expect(wrapper.find('[data-testid="lifecycle-label"]').text()).toContain('Deployment complete')
})
```

**Coverage Requirement for API Client Files**:
- New `src/lib/api/*.ts` files must achieve **≥90% branch coverage** (not just 70%)
- API clients have discrete, testable error paths — every 4xx response code, null body, and network failure must be covered
- Run `npx vitest run --coverage path/to/file.test.ts` and verify before committing

**Red Flags This Pattern Is Repeating**:
- ✅ PR has separate unit tests for API client AND component but no integration test file
- ✅ No test in `src/__tests__/integration/` for the new feature area
- ✅ API client branch coverage < 90% (4xx fallback paths, null body, exhausted polling)
- ✅ No test verifying error messages from client reach the component without raw error codes

**Never Again**:
- ❌ Deliver API client + UI component without an integration test proving wiring
- ❌ Stop at unit tests without testing how data flows between the layers
- ❌ Allow API client branch coverage below 90% when error paths are clearly testable

### 7k. Adding `aria-label` to nav Elements Breaks Existing E2E `nav[aria-label]` Count Assertions (MANDATORY) 🆕

**🚨 CRITICAL PAST VIOLATION - March 5, 2026 (PR #564) 🚨**

**Violation**: Copilot added `aria-label="Sidebar navigation"` to `Sidebar.vue`'s `<nav>` element as part of WCAG accessibility improvements. This was CORRECT for accessibility, but BROKE 3 existing E2E tests that asserted `nav[aria-label]` count = 1 globally on the page. The home page renders both `Navbar.vue` (primary nav) and `Sidebar.vue` (secondary nav) simultaneously, so there were now 2 `nav[aria-label]` elements.

**CI Result**: 3 test × 3 retries = 9 failures. All failures were "expect(locator).toHaveCount(expected) — unexpected value '2'".

**Root Cause**:
- `Navbar.vue` already had `<nav aria-label="Main navigation">` 
- `Sidebar.vue` did NOT have an aria-label (hidden from AT but rendered in DOM)
- Adding `aria-label="Sidebar navigation"` to Sidebar was CORRECT per WCAG — but created a second `nav[aria-label]` element on every page that uses `MainLayout`
- Three pre-existing E2E tests were checking `nav[aria-label]` count = 1 (assuming only one nav would ever have an aria-label)
- Copilot did not grep for `nav\[aria-label\]` count assertions before adding the aria-label

**Correct Approach — MANDATORY Before Adding aria-label to ANY nav Element**:

1. **Grep for existing E2E count assertions on nav[aria-label]**:
   ```bash
   grep -rn 'nav\[aria-label\]' e2e/ --include="*.spec.ts"
   # If any test has: await expect(page.locator("nav[aria-label]")).toHaveCount(1)
   # → That test WILL break when you add a second nav[aria-label] to any shared layout component
   ```

2. **Update those tests to use the SPECIFIC label value**:
   ```typescript
   // ❌ WRONG — breaks when a second nav[aria-label] is added to the page
   const nav = page.locator('nav[aria-label]');
   await expect(nav).toHaveCount(1);

   // ✅ CORRECT — scope to the specific landmark label
   const nav = page.locator('nav[aria-label="Main navigation"]');
   await expect(nav).toHaveCount(1);
   ```

3. **Add a unit test to the component file proving the aria-label**:
   ```typescript
   it('sidebar nav has aria-label for landmark disambiguation (WCAG SC 2.4.3)', () => {
     const nav = wrapper.find('nav');
     expect(nav.attributes('aria-label')).toBe('Sidebar navigation');
   });
   ```

4. **Run the E2E tests that reference nav[aria-label] before pushing**:
   ```bash
   # Run affected specs BEFORE committing to catch count regressions
   npx playwright test e2e/navigation-parity-wcag.spec.ts e2e/trustworthy-operations-ux.spec.ts e2e/auth-first-confidence-hardening.spec.ts --reporter=list 2>&1 | grep -E 'PASS|FAIL'
   ```

**Prevention Checklist** (MANDATORY before adding aria-label to any `<nav>` in a shared layout):
- [ ] `grep -rn 'nav\[aria-label\]' e2e/ --include="*.spec.ts"` — find all assertions
- [ ] Update any `.toHaveCount(1)` assertions to use `nav[aria-label="Specific Label"]`
- [ ] Add unit test to the component proving the new aria-label value
- [ ] Run the affected E2E spec files locally (or check CI logs match)

**Never Again**:
- ❌ Add `aria-label` to a `<nav>` in a shared layout without grepping for count assertions
- ❌ Assert `nav[aria-label]` count globally — always use the specific label value
- ❌ Push accessibility changes without verifying E2E tests that check landmark counts

### 7l. `keyboard.press('Tab')` Does Not Focus Elements in Headless CI Without Prior Click (MANDATORY) 🆕

**🚨 CRITICAL PAST VIOLATION - March 5, 2026 (PR #566 canonical-launch-aa-hardening.spec.ts) 🚨**

**Violation**: Copilot wrote an E2E test that did `page.keyboard.press('Tab')` immediately after `page.waitForLoadState('load')`, then checked `page.locator(':focus').count() > 0`. In headless CI the count was always 0 — the test failed on every run.

**Root Cause**: In headless Chromium/Playwright, `keyboard.press('Tab')` only moves focus if the browser window/page already has keyboard focus. After `page.goto()` + `waitForLoadState()`, the page has rendered DOM but does NOT automatically have keyboard focus in headless mode. The `:focus` CSS selector also has synchronization issues — it may return stale results.

**Correct Approach** (MANDATORY for any test that uses `keyboard.press` to test focus navigation):
```typescript
// ❌ WRONG — Tab has no effect without prior focus in headless CI
await page.goto('/')
await page.waitForLoadState('load')
await page.keyboard.press('Tab')
const count = await page.locator(':focus').count()
expect(count).toBeGreaterThan(0) // FAILS: count is always 0 in headless

// ✅ CORRECT — click body first to give page keyboard focus, then use evaluate()
await page.goto('/')
await page.waitForLoadState('load')
await page.locator('body').click()   // Gives the page window focus
await page.keyboard.press('Tab')    // Now Tab actually moves focus
const hasFocusedElement = await page.evaluate(() => {
  const active = document.activeElement
  return active !== null && active !== document.body && active !== document.documentElement
})
// document.activeElement is synchronous and reliable in headless
expect(hasFocusedElement).toBe(true)
```

**Why `document.activeElement` instead of CSS `:focus`?**
- `page.locator(':focus')` uses Playwright's selector engine which may not reflect current focus state synchronously
- `page.evaluate(() => document.activeElement)` reads the live DOM property which is always up-to-date

**🚨 CRITICAL REPEAT VIOLATION - March 5, 2026 (route-determinism-ci-stable.spec.ts + auth-first-onboarding-closure.spec.ts) 🚨**

**Violation**: Two MORE spec files had the same `keyboard.press('Tab')` without prior `body.click()` + `:focus` count > 0 assertion pattern, despite the fix in canonical-launch-aa-hardening.spec.ts being documented above. Both failed in CI (same run as the mvp-deterministic-journey timeout issue).

**Root Cause**: The fix was only applied to the ONE file currently being authored. The pattern existed in at least 4 spec files. When fixing keyboard focus tests, always grep ALL spec files for the broken pattern before committing.

**Pre-Commit Grep Check** (MANDATORY before committing any keyboard navigation fix):
```bash
# Find ALL instances of the broken pattern in spec files:
grep -rn 'locator.*:focus.*count\|:focus.*count\|count.*:focus' e2e/ --include="*.spec.ts"
# For each result: check if it asserts > 0 (not >= 0)
# If > 0: fix ALL of them using body.click() + document.activeElement pattern
```

**Never Again**:
- ❌ Call `keyboard.press('Tab')` without first clicking body/a focusable element in headless tests
- ❌ Use `page.locator(':focus').count()` — use `page.evaluate(() => document.activeElement)` instead
- ❌ Write keyboard navigation tests without verifying they pass in `headless: true` mode
- ❌ Fix the pattern in ONE file without auditing ALL spec files for the same broken pattern

### 7m. New View Components Must Have ≥80% Function Coverage Before PR Submission (MANDATORY) 🆕

**🚨 CRITICAL PAST VIOLATION - March 7, 2026 (PR #570) 🚨**

**Violation**: `GuidedLaunchWorkspace.vue` was submitted with only 64.51% function coverage. The following functions had zero test coverage:
- `markItemComplete` — advances checklist and emits analytics
- `handleCtaClick` — emits analytics on CTA click  
- `resetSimulation` — clears simulation state and removes item from completed
- `formatSimulationTime` — formats ISO timestamp to locale string (with error fallback)
- Simulation success/failed UI states (template branches for `phase === 'success'` and `phase === 'failed'`)
- `persistState` / `loadPersistedState` error branches (corrupt localStorage)

**Root Cause**: The existing `.test.ts` file covered rendering/WCAG but did not cover interaction handlers. No `.logic.test.ts` file was added alongside the view, which is the established pattern for new views.

**Correct Approach**:
1. **ALWAYS create a `.logic.test.ts` alongside every new view** — pair `MyView.vue` with both `MyView.test.ts` (WCAG/rendering) AND `MyView.logic.test.ts` (interaction logic/state transitions)
2. **Cover ALL exported/public functions in the `<script setup>` block** — check function coverage before committing
3. **Cover template branches for all `v-if/v-else-if` states** — simulation success, simulation failed, blocked banner, locked item card
4. **localStorage error paths** — always test with `null`, valid JSON, and corrupt JSON

**Pre-Commit Function Coverage Check** (MANDATORY for new view components):
```bash
# Run coverage for the specific view file:
npx vitest run --coverage src/views/__tests__/MyView*.test.ts 2>&1 | grep "MyView.vue"
# Requirement: Functions ≥80%, Branches ≥80%, Statements ≥80%
# If below threshold → add MyView.logic.test.ts covering missing functions
```

**Pattern for interaction logic tests** (based on GuidedLaunchWorkspace.logic.test.ts):
```typescript
// Cover simulation state transitions with fake timers:
vi.useFakeTimers()
await btn.trigger('click')
vi.advanceTimersByTime(2000)
await nextTick()
// Assert success/failed state rendered

// Cover localStorage persistence:
localStorageStub.getItem.mockReturnValue('NOT_VALID_JSON:::')
const wrapper = await mountWorkspace()
expect(wrapper.exists()).toBe(true) // Should not throw

// Cover analytics events:
const events: CustomEvent[] = []
window.addEventListener('workspace:analytics', handler)
await mountWorkspace()
expect(events.map(e => e.detail?.eventName)).toContain('workspace_entered')
```

**Minimum test file structure for new views with interaction logic**:
```
src/views/MyView.vue
src/views/__tests__/MyView.test.ts        ← rendering, WCAG, AC mapping
src/views/__tests__/MyView.logic.test.ts  ← interaction handlers, state machine, persistence, analytics
```

**Never Again**:
- ❌ Submit new view with `.test.ts` only when view has `onMounted`, timers, localStorage, or event handlers
- ❌ Skip coverage check for function coverage (not just line/statement coverage)
- ❌ Leave simulation success/failed UI states untested (they are distinct template branches)
- ❌ Skip testing localStorage error fallback paths (corrupt data causes silent errors)

### 7n. View Helper Functions and @click Handlers on router-link Must All Be Branch-Covered (MANDATORY) 🆕

**🚨 CRITICAL PAST VIOLATION - March 7, 2026 (PR #585) 🚨**

**Violation**: `ComplianceLaunchConsole.vue` was submitted with 73.77% branch coverage (below the 80% threshold). The following were never invoked in tests:
- `handlePrimaryCta()` — the `@click` handler on the primary CTA button
- `emitDomainAnalytics(domain)` — the `@click` on `<router-link>` for domain setup links
- `emitBlockerAnalytics(domain, blocker)` — the `@click` on `<router-link>` for blocker remediation links
- `blockerCardClass('high')` and `blockerLinkClass('high')` — the 'high' severity branch of view helper functions
- A dead `case 'medium'` in `blockerCardClass` that the store could never produce (removed as dead code)

**Root Cause**:
1. **`@click` on `<router-link>` is invisible without expansion**: The domain detail panel is collapsed by default. Tests that only mount and scan initial HTML never see the expanded state, so router-link @click handlers are never fired.
2. **Helper functions used in `:class` bindings need one test per return-value branch**: `blockerCardClass` and `blockerLinkClass` are called via `:class="blockerCardClass(blocker.severity)"`. They are never directly called in tests — only triggered when a blocker with the matching severity is rendered. A test that only renders 'critical' severity blockers will never reach the 'high' or 'medium' branches.
3. **Router navigation tested with `wrapper.vm.$router` not `router` object**: Spying on a `router` variable after mount does not intercept because `useRouter()` returns an injected proxy. Set up the spy before mounting (on `router.push`) OR use `router.isReady()` + `router.currentRoute.value.path` after trigger to verify navigation.

**Correct Approach — MANDATORY Before Committing a New View**:

```bash
# 1. Run per-file coverage to find uncovered branches:
node_modules/.bin/vitest run --coverage src/views/__tests__/MyView*.test.ts 2>&1 | grep "MyView.vue"
# Requirement: % Branch ≥80%, % Funcs ≥80%, % Stmts ≥80%

# 2. For every @click handler not covered:
#    - Find the element in the template (including expanded/conditional sections)
#    - Add a test that expands the panel (click header) THEN clicks the router-link or button
#    - Verify the handler fired (via analytics event, router.currentRoute, or DOM change)

# 3. For every :class="helperFn(value)" binding:
#    - Identify all DISTINCT return values the function can produce
#    - Ensure there is a test case that triggers each return-value branch
#    - Remove dead branches the store can never produce (simplify switch → if/if/return)
```

**Router navigation test pattern** (use `router.currentRoute` not `router.push` spy):
```typescript
it('clicking primary CTA routes to /compliance/setup', async () => {
  const router = makeRouter()
  const wrapper = mount(MyView, {
    global: { plugins: [createTestingPinia({ createSpy: vi.fn, initialState }), router] }
  })
  await router.isReady()
  await nextTick()
  await wrapper.find('[data-testid="primary-cta-button"]').trigger('click')
  await router.isReady()
  await nextTick()
  expect(router.currentRoute.value.path).toBe('/expected/path')
})
```

**:class helper function coverage checklist** (MANDATORY for each function that maps severity/status to CSS):
```typescript
// For a function like:
function blockerCardClass(severity: 'critical' | 'high' | 'medium' | 'low'): string {
  if (severity === 'critical') return '...'
  if (severity === 'high') return '...'
  return '...'  // medium / low fallback
}
// You MUST have test cases that render:
// (a) a blocker with severity='critical' → covers first branch
// (b) a blocker with severity='high'     → covers second branch
// (c) No third case needed: the final return is the else/fallback and is always hit
//     when neither (a) nor (b) applies — but only if you have a test where neither condition is true
```

**Pre-Commit Branch Coverage Check** (MANDATORY for new views):
```bash
node_modules/.bin/vitest run --coverage \
  src/views/__tests__/MyView.test.ts \
  src/views/__tests__/MyView.logic.test.ts 2>&1 | grep "MyView.vue"
# Must show: % Branch ≥80%
# If not: identify uncovered lines in "Uncovered Line #s" column and add targeted tests
```

**Never Again**:
- ❌ Submit a view without checking the "% Branch" column in the coverage report
- ❌ Assume `@click` on `<router-link>` inside a collapsed panel is tested — it is NOT visible until expanded
- ❌ Leave helper functions (`:class="fn()"`) with cases that are never triggered by any test
- ❌ Keep dead switch cases that the underlying store/data can never produce — replace switch with if/if/return
- ❌ Spy on `router.push` from outside the component after mounting — use `router.currentRoute.value.path` instead

### 7o. E2E Tests Must Never Use Low-Signal (Always-True) Assertions (MANDATORY) 🆕

**🚨 CRITICAL PAST VIOLATION - March 12, 2026 (PR #590) 🚨**

**Violation**: Copilot submitted an E2E hardening PR claiming to fix low-signal assertions, but the adjacent spec files (`token-standards-view.spec.ts`, `token-discovery-dashboard.spec.ts`, `token-detail-view.spec.ts`, `team-management.spec.ts`, `whitelist-jurisdiction.spec.ts`, `guided-token-launch.spec.ts`) still contained 13+ always-true assertions. The blocker roadmap explicitly listed these 6 files as requiring cleanup but they were NOT addressed in the first submission — only fixed after a follow-up review cycle.

**Root Cause**:
- PR focused on creating new spec files (`mvp-backend-signoff.spec.ts`) but IGNORED the existing low-signal assertions in the 6 spec files listed by name in the roadmap
- Copilot read "Eliminate the remaining low-signal assertions, starting with `e2e/token-standards-view.spec.ts`..." in the roadmap but only created new infrastructure, not the listed existing file cleanup
- The always-true assertion patterns are invisible to `grep -n 'expect(true)'` unless you ALSO check `expect(x || true)` and `toBeGreaterThanOrEqual(0)` patterns

**What was fixed** (remedied in second commit of PR #590):
- All 6 spec files were updated to replace always-true patterns with meaningful assertions
- Inline `page.on('console',...)` suppressors replaced with canonical `suppressBrowserErrors(page)`
- Keyboard focus tests updated: `body.click()` before Tab + `document.activeElement` check
- Bug fixed: `await count() > 0` → `(await count()) > 0` (operator precedence)

**Low-signal assertion patterns that must NEVER appear in E2E tests**:
```typescript
// ❌ ALWAYS TRUE — provides zero signal about actual product behavior
expect(true).toBe(true)
expect(isVisible || true).toBe(true)
expect(found || true).toBe(true)
expect(count).toBeGreaterThanOrEqual(0)  // count is always >= 0

// ✅ CORRECT — meaningful assertions
expect(page.url()).toContain('/expected-route')          // URL is testable
expect(bodyText.length).toBeGreaterThan(100)             // page has content
expect(isVisible || hasEmptyState).toBe(true)            // at least one state visible
expect(page.url()).toBeTruthy()                          // page navigated somewhere
```

**Pre-commit check for low-signal assertions** (MANDATORY before any E2E commit):
```bash
# Find ALL always-true assertion patterns in E2E files
grep -rn "expect(true)\.toBe(true)\|\\.toBe(true)\|toBeGreaterThanOrEqual(0)" e2e/ --include="*.spec.ts"
# Also check for the || true pattern explicitly:
grep -rn "|| true)\.toBe(true)" e2e/ --include="*.spec.ts"
# Both must return zero results. If any results found: fix them ALL before committing.
```

**Inline error suppression pattern** (MUST use canonical helper):
```typescript
// ❌ WRONG — inline suppressor — must not appear in spec files
page.on('console', msg => {
  if (msg.type() === 'error') {
    console.log(`Browser console error (suppressed...): ${msg.text()}`)
  }
})
page.on('pageerror', error => {
  console.log(`Page error (suppressed...): ${error.message}`)
})

// ✅ CORRECT — use canonical helper
import { suppressBrowserErrors } from './helpers/auth'
// In beforeEach:
suppressBrowserErrors(page)
```

**Scope awareness**: When a roadmap or issue NAMES SPECIFIC FILES for cleanup, those files MUST be addressed in the same PR. Addressing only new files while leaving named existing files untouched is an incomplete delivery.

**Assertion strength calibration**: When replacing `expect(true).toBe(true)` with real assertions, verify the app's ACTUAL behavior for the edge case BEFORE writing the assertion. If the app shows a blank layout for non-existent tokens (no error, no redirect), then `expect(hasError || isRedirected).toBe(true)` is OVER-STRICT and fails in CI. Use a targeted always-rendered layout element as the third condition:
```typescript
// ✅ CORRECT — find a UI element that is ALWAYS rendered by the view/layout
const backButton = page.getByRole('button', { name: /Back to Dashboard/i })
const layoutLoaded = await backButton.isVisible({ timeout: 10000 }).catch(() => false)
expect(hasError || isRedirected || layoutLoaded).toBe(true)

// ❌ OVER-STRICT — fails if app renders blank/empty state (not always a bug)
expect(hasError || isRedirected).toBe(true)

// ❌ TOO WEAK — bodyText.length > 100 matches almost any rendered page
expect(hasError || isRedirected || bodyText.length > 100).toBe(true)
```

**Never Again**:
- ❌ Leave `expect(true).toBe(true)` in any E2E spec file
- ❌ Leave `expect(x || true).toBe(true)` patterns (always-true regardless of x)
- ❌ Leave `expect(count).toBeGreaterThanOrEqual(0)` for counts (always passes)
- ❌ Leave inline `page.on('console',...)` suppressors in spec files (use `suppressBrowserErrors()`)
- ❌ Ignore named spec files in a roadmap when those files require cleanup
- ❌ Replace always-true assertions with over-strict ones that assume app behavior without verifying what the app actually renders — use a targeted always-rendered layout element as graceful fallback

- [ ] **Navigation Link Required**: If implementing new route, MUST add navigation link
  - ❌ **Past Violation**: Guided launch implemented but not accessible from navbar
  - ✅ **Solution**: Add link to `src/components/layout/Navbar.vue` with appropriate icon
- [ ] **Mobile Navigation**: Ensure feature appears in mobile menu too
- [ ] **Route Registration**: Verify route is in `src/router/index.ts` with auth guard
- [ ] **Manual Testing**: Actually click the navigation link and verify page loads
- [ ] **E2E Test**: Add test verifying navigation link exists and works

**Example - Adding Navigation Link**:
```typescript
// In src/components/layout/Navbar.vue
import { RocketLaunchIcon } from "@heroicons/vue/24/outline"

const navigationItems = [
  { name: "Home", path: "/", icon: HomeIcon },
  { name: "New Feature", path: "/new-feature", icon: RocketLaunchIcon }, // ADD THIS
  // ... existing items
]
```

### 7p. Strict Backend E2E Tests Must Cover Full Lifecycle (Not Just Reachability) (MANDATORY) 🆕

**🚨 CRITICAL PAST VIOLATION - March 12, 2026 (PR #588) 🚨**

**Violation**: Copilot submitted a PR claiming AC #2 ("real backend-driven deployment lifecycle verification") was addressed, but the strict lane tests in `backend-deployment-contract.spec.ts` only checked endpoint reachability (`[200, 201, 400, 401, 403, 404]`). They did NOT cover:
- Initiating a deployment via POST and receiving a `deploymentId` (request acceptance)
- Polling the status endpoint with the `deploymentId` (status progression)
- Verifying surfaced identifiers in the response
- Handling terminal states (`Completed` with `assetId`, or `Failed` with `userGuidance`)

**Root Cause**:
- Treated "strict lane exists" as equivalent to "full lifecycle verified"
- Added reachability probes (`/api/v1/backend-deployment-contract`) but not lifecycle tests (`/initiate` → `/status/{id}`)
- The first `report_progress` commit was empty (Initial plan), and the PO commented before the second commit was visible — but the second commit still lacked lifecycle depth

**Correct Approach for Strict Backend Sign-Off Tests**:
```
AC #2 = Full lifecycle proof, not just endpoint reachability:
1. POST /api/v1/backend-deployment-contract/initiate — assert deploymentId returned
2. GET  /api/v1/backend-deployment-contract/status/{id} — assert state transitions
3. Poll for terminal state — assert assetId (Completed) or userGuidance (Failed)
4. POST /api/v1/backend-deployment-contract/validate — assert isDeterministicAddress
```

**Pattern for Comprehensive Lifecycle Test**:
```typescript
// ✅ CORRECT — covers the full lifecycle
test('deployment lifecycle — initiate request and receive accepted deploymentId', async ({ page }) => {
  const skipReason = requireStrictBackend() // returns undefined or skip message
  test.skip(skipReason !== undefined, skipReason ?? '')
  await loginWithCredentialsStrict(page) // hard-fail if backend unavailable

  // Step 1: Auth to get bearer token
  const authBody = await getAuthBody(page, apiBaseUrl)
  const bearerToken = authBody.token || authBody.accessToken || authBody.access_token

  // Step 2: Initiate deployment
  const initiateResponse = await page.request.post(`${apiBaseUrl}/api/v1/backend-deployment-contract/initiate`, {
    headers: { Authorization: `Bearer ${bearerToken}` },
    data: { idempotencyKey: uniqueKey, tokenName: '...', ... },
  })
  expect([200, 201, 409]).toContain(initiateResponse.status()) // 409=idempotent replay

  // Step 3: Assert deploymentId returned
  const body = await initiateResponse.json()
  expect(typeof body.deploymentId).toBe('string')

  // Step 4: Poll status with deploymentId
  const statusBody = await pollStatus(page, apiBaseUrl, bearerToken, body.deploymentId)
  expect(VALID_STATES).toContain(statusBody.state)

  // Step 5: If terminal — assert lifecycle identifiers
  if (statusBody.state === 'Completed') {
    expect(String(statusBody.assetId).length).toBeGreaterThan(0)
  } else if (statusBody.state === 'Failed') {
    expect(typeof statusBody.error.userGuidance).toBe('string')
  }
})
```

**Pre-Commit Check for Strict Lane Tests**:
```bash
# Verify the strict lane covers all lifecycle stages, not just reachability:
grep -A 30 "AC #2\|deployment lifecycle" e2e/mvp-backend-signoff.spec.ts | grep -c "initiate\|/status/\|deploymentId\|assetId\|userGuidance"
# Must return >= 4 (all 4 lifecycle stages represented)
```

**Never Again**:
- ❌ Submit AC "backend deployment lifecycle" with only endpoint reachability checks
- ❌ Skip `report_progress` until the full AC scope is implemented (don't push empty initial plans)
- ❌ Claim an AC is closed without verifying each sub-requirement (initiate, poll, terminal, surfaced IDs)
- ❌ Submit a PR where the first commit is an empty planning document and the second contains incomplete implementation

### 7q. E2E Tests Must Use Exact `data-testid` Values From Source Constants (MANDATORY) 🆕

**🚨 CRITICAL PAST VIOLATION - March 12, 2026 (PR #591) 🚨**

**Violation**: Copilot wrote an E2E test asserting `[data-testid="issuance-continue-button"]` but the actual constant in `authFirstIssuanceWorkspace.ts` is `CONTINUE_BUTTON: 'issuance-continue'` (no "-button" suffix). The test failed on all 3 CI retry attempts with "element(s) not found".

**Root Cause**:
- E2E test used an assumed testid string (`issuance-continue-button`) without verifying the actual constant value
- The source utility (`authFirstIssuanceWorkspace.ts`) defines `CONTINUE_BUTTON: 'issuance-continue'`, but the test assumed a longer name with "-button" appended
- No pre-commit check was run to verify the testid actually existed in the rendered DOM

**Correct Approach — MANDATORY Before Asserting on data-testid in E2E Tests**:

```bash
# 1. Before writing ANY data-testid assertion, look up the constant value:
grep -n "CONTINUE_BUTTON\|PROGRESS_BAR\|WORKSPACE_SHELL" src/utils/authFirstIssuanceWorkspace.ts
# Output shows the EXACT string: CONTINUE_BUTTON: 'issuance-continue'
# → Use 'issuance-continue' in test, NOT 'issuance-continue-button'

# 2. Verify the constant is actually bound in the template:
grep -n "ISSUANCE_TEST_IDS.CONTINUE_BUTTON\|issuance-continue" src/views/GuidedTokenLaunch.vue
# Must show: :data-testid="ISSUANCE_TEST_IDS.CONTINUE_BUTTON"

# 3. If no node_modules available, verify by reading the constant file directly:
node -e "
const fs = require('fs');
const code = fs.readFileSync('src/utils/authFirstIssuanceWorkspace.ts', 'utf8');
const match = code.match(/CONTINUE_BUTTON:\s*'([^']+)'/);
console.log('CONTINUE_BUTTON value:', match && match[1]);
"
```

**Pre-Commit Testid Verification Pattern**:
```typescript
// ❌ WRONG — assumed testid without checking actual constant value
const continueBtn = page.locator('[data-testid="issuance-continue-button"]')
// → ACTUAL constant: CONTINUE_BUTTON: 'issuance-continue' (no "-button" suffix!)

// ✅ CORRECT — looked up constant value first
// authFirstIssuanceWorkspace.ts: CONTINUE_BUTTON: 'issuance-continue'
const continueBtn = page.locator('[data-testid="issuance-continue"]')
```

**Universal Rule**: When testing a `data-testid` that originates from a TypeScript constant (e.g., `ISSUANCE_TEST_IDS.CONTINUE_BUTTON`), ALWAYS read the constant's actual string value from the source file before writing the E2E assertion. Never assume the string matches a "natural" expansion of the constant name.

**Never Again**:
- ❌ Assume `CONTINUE_BUTTON` → `issuance-continue-button` without verifying the actual string value
- ❌ Write `page.locator('[data-testid="..."]')` without first grepping the source for the exact constant value
- ❌ Push E2E tests that reference `data-testid` strings that don't exist in any template binding

---

### 7r. Teleport + `@keydown.esc` Cannot Be Tested via `dispatchEvent` in happy-dom (MANDATORY) 🆕

**🚨 CRITICAL PAST VIOLATION - March 12, 2026 (PR #594) 🚨**

**Violation**: Copilot wrote a unit test for `Modal.vue` that verified `@keydown.esc="closeModal"` by dispatching a `new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })` on the teleported outer div. The test failed in CI on all runs (3 commits, 3 retries) because `dispatchEvent()` on elements inside `<Teleport>` does NOT trigger Vue's compiled `@keydown` event handlers in the happy-dom test environment.

**Root Cause**:
- Vue 3's `@keydown.esc` compiles to `el.addEventListener('keydown', withKeys(handler, ['esc']))`
- In happy-dom, dispatching a native `KeyboardEvent` on a teleported element does NOT invoke the event listener registered by Vue's runtime-dom, even with `bubbles: true` and `cancelable: true`
- Using `DOMWrapper.trigger()` from Vue Test Utils has the same limitation — it internally uses `dispatchEvent()` too
- This is a known happy-dom limitation with `<Teleport>`-rendered elements

**Correct Approach for Testing Keyboard Handlers on Teleported Elements**:

1. **Verify the structural PRESENCE** — confirm the outer wrapper with the keydown handler is rendered:
```typescript
// Verify the outer wrapper (which carries @keydown.esc) is present in DOM (SC 2.1.2)
const outer = document.body.querySelector('[role="presentation"]') as HTMLElement | null
expect(outer).not.toBeNull()
// The keyboard handler logic is tested separately via the method
```

2. **Verify the handler LOGIC separately** — call the exposed method directly:
```typescript
// Verify the method called by @keydown.esc emits the correct event
await (wrapper.vm as any).closeModal()
expect(wrapper.emitted('close')).toBeTruthy()
```

This two-part approach gives FULL confidence:
- `[role="presentation"]` present → the keyboard-trap structure is rendered (structural correct)
- `closeModal()` emits 'close' → the method called by the handler works correctly (logic correct)

**Why `_vei` is NOT reliable for freshly-mounted Teleport elements in happy-dom**:
- Vue 3 runtime-dom stores event listeners in `element._vei = { [eventKey]: invoker }` in real browsers
- In happy-dom, `_vei.onKeydown` is `undefined` on FRESHLY mounted teleported elements (Vue doesn't populate it synchronously in happy-dom's event model)
- The `_vei` approach appeared to work only when a STALE teleported element (from a previous test) was found first by `querySelector` — the stale element had `_vei` set from when it was originally rendered
- After adding `beforeEach` cleanup that removes stale elements, fresh elements are found and `_vei.onKeydown` is `undefined`
- **IMPORTANT**: Never use `_vei.onKeydown` for freshly-mounted Teleport elements in happy-dom tests

**Never Again**:
- ❌ Use `element.dispatchEvent(new KeyboardEvent(...))` to test Vue `@keydown.esc` on teleported elements
- ❌ Use `DOMWrapper.trigger('keydown', ...)` on teleported elements (same limitation)
- ❌ Check `element._vei?.onKeydown` for freshly-mounted teleported elements — unreliable in happy-dom
- ✅ Check that `[role="presentation"]` exists in DOM (proves structural presence of keyboard-trap element)
- ✅ Call exposed method (`closeModal()`) for behavior verification

---

### 7s. Teleport Component Internal Functions Must Be Tested Via `(wrapper.vm as any)` in happy-dom (MANDATORY) 🆕

**🚨 CRITICAL PAST VIOLATION - March 13, 2026 (PR #608) 🚨**

**Violation**: `PolicyEditPanel.vue` was submitted with 56.6% function coverage because tests only used DOM-event simulation to trigger internal functions (`addJurisdiction`, `removeJurisdiction`, `toggleCategory`, `toggleKyc`, `changeSummary` branches). In happy-dom's Teleport environment, clicking DOM elements does NOT reliably invoke Vue's compiled `@click` listeners on teleported content, so many code paths were never exercised despite the tests appearing to interact with the correct buttons.

**Root Cause**:
- Teleport renders into `document.body` outside the component's Shadow DOM, meaning `wrapper.trigger()` and `element.click()` do not reliably call Vue-registered event handlers for internal script-setup functions
- DOM-click-based tests reached 56.6% function coverage — well below the 80% threshold
- No `.logic.test.ts` file was created alongside the component, which is the established pattern for complex views/components

**Correct Approach for Teleport Components With Internal Logic**:

1. **Create `ComponentName.logic.test.ts`** alongside the regular `ComponentName.test.ts` for any component using `<Teleport>` with internal `<script setup>` functions
2. **Access internal functions via `(wrapper.vm as any)`** — this is the only reliable way to call script-setup functions in Teleport components in happy-dom:

```typescript
// ✅ CORRECT — access script-setup function directly via vm for Teleport components
const wrapper = mount(PolicyEditPanel, { props, global })
await nextTick()
const vm = wrapper.vm as any

// Test addJurisdiction directly (DOM click won't reliably fire in Teleport + happy-dom)
vm.activeAddInput = 'allowedJurisdictions'
vm.addCountrySearch = 'Germany'
await nextTick()
vm.addJurisdiction('allowedJurisdictions')
await nextTick()
expect(vm.localDraft.allowedJurisdictions.find((j: any) => j.code === 'DE')).toBeTruthy()

// Test computed branch directly
vm.localDraft.kycRequired = false
await nextTick()
expect(vm.changeSummary).toContain('Global KYC: Disabled')
```

3. **Cover ALL internal state branches** that are only accessible through computed properties or reactive data mutations (e.g., `changeSummary` branches for `kycRequired`, `accreditationRequired`, `defaultBehavior`)

**Coverage Checklist for Teleport Components**:
- [ ] `*.test.ts` — DOM structure, accessibility (aria roles, labels), visibility states
- [ ] `*.logic.test.ts` — ALL internal functions called directly via `(wrapper.vm as any)`:
  - Each function that has early-return guard (`if (!localDraft.value) return`)
  - Each computed branch (e.g., `changeSummary` with 5+ sub-branches)
  - Each async function that emits events (`handleConfirmSave`, etc.)

**Pre-Commit Coverage Check** (MANDATORY for any `<Teleport>` component):
```bash
npx vitest run --coverage \
  src/components/myComponent/__tests__/MyComponent.test.ts \
  src/components/myComponent/__tests__/MyComponent.logic.test.ts 2>&1 | grep "MyComponent.vue"
# Must show: % Funcs ≥80%, % Branch ≥80%
```

**Never Again**:
- ❌ Use only DOM-click tests for Teleport component internal function coverage
- ❌ Submit a Teleport component without a `.logic.test.ts` that uses `(wrapper.vm as any)`
- ❌ Accept coverage below 80% functions/branches for any new component

---

### 7t. `locator.isVisible()` Is a Snapshot Check — Use `waitFor()` for Polling Waits (MANDATORY) 🆕

**🚨 CRITICAL PAST VIOLATION - March 13, 2026 (PR #608 whitelist-policy-dashboard.spec.ts) 🚨**

**Violation**: E2E tests used `await editBtn.isVisible({ timeout: 12000 }).catch(() => false)` expecting it to WAIT up to 12 seconds for the element to appear. In Playwright, `locator.isVisible()` is a **snapshot check** that returns immediately (true/false). The `{ timeout }` option does NOT cause it to poll. All 3 tests relying on this pattern returned `false` immediately (the async mock fetch hadn't completed) and then asserted on loading-skeleton body text, failing deterministically.

**Root cause**: The difference between snapshot methods and polling methods in Playwright:
- `locator.isVisible()` — snapshot, returns immediately based on current DOM state
- `locator.isVisible({ timeout: N })` — STILL a snapshot, the timeout option is NOT a retry wait
- `locator.waitFor({ state: 'visible', timeout: N })` — polling, WAITS until element appears
- `expect(locator).toBeVisible({ timeout: N })` — polling assertion, WAITS until element appears

**Correct Pattern** (MANDATORY for any test that waits for an element to appear):

```typescript
// ❌ WRONG — isVisible returns immediately regardless of timeout value
const isVisible = await editBtn.isVisible({ timeout: 12000 }).catch(() => false)
// ^ Returns false immediately if element not in DOM yet — timeout is ignored for polling

// ✅ CORRECT for assertive tests (element MUST appear or test fails):
await editBtn.waitFor({ state: 'visible', timeout: 20000 })
// or:
await expect(editBtn).toBeVisible({ timeout: 20000 })

// ✅ CORRECT for conditional tests (graceful skip if element doesn't appear):
const btnVisible = await editBtn
  .waitFor({ state: 'visible', timeout: 15000 })
  .then(() => true)
  .catch(() => false)

// ✅ CORRECT for waiting for element to DISAPPEAR (e.g., after dialog close):
await expect(dialog).not.toBeVisible({ timeout: 5000 })
// ^ Polls until dialog is hidden (handles CSS transitions)
// NOT: dialog.isVisible() which returns true immediately during transition
```

**Pre-Commit Check**:
```bash
# Find all uses of isVisible with a timeout (usually a sign of misuse):
grep -rn "isVisible({ timeout" e2e/ --include="*.spec.ts"
# If any result expects the return value to be TRUE (meaning "element appeared"), 
# replace with waitFor({ state: 'visible', timeout }) or expect().toBeVisible({ timeout })
# Only keep isVisible({ timeout }) if the intent is "check current state, return quickly"
```

**Never Again**:
- ❌ Use `await locator.isVisible({ timeout: N })` expecting it to WAIT N seconds for element to appear
- ❌ Use `isVisible` before `waitFor` if the test depends on the element being present for subsequent assertions
- ❌ Use `isVisible` to check if a dialog is GONE — use `expect(locator).not.toBeVisible({ timeout })` to handle CSS transitions
- ✅ Reserve `isVisible()` for immediate snapshot checks where the current state (not a future state) matters

---

## 🚨 CRITICAL: PR QUALITY STANDARDS - HARDENING ISSUES 🚨

**MANDATORY BEFORE SUBMITTING ANY PR FOR HARDENING ISSUES**

### PR Quality Checklist (MUST ALL BE ✅ BEFORE SUBMISSION)

Based on product owner rejection of PR #439, the following standards are MANDATORY:

#### 1. Issue Linking (REQUIRED)
- [ ] PR description must start with `Closes #[issue_number]`
- [ ] Example: `Closes #438` (not just "fixes" or "addresses")

#### 2. Business Value Documentation (REQUIRED)
PR must explain in detail:
- [ ] **Revenue Impact**: How does this reduce onboarding friction? (e.g., "reduces abandonment at login→token stage")
- [ ] **Risk Reduction**: What specific business risks are mitigated? (e.g., "prevents auth-flow regressions")
- [ ] **Support Efficiency**: How does this reduce support burden? (e.g., "clear navigation reduces confusion tickets by X%")
- [ ] **Enterprise Trust**: How does this build buyer confidence? (e.g., "WCAG AA compliance meets procurement requirements")

**Template**:
```markdown
## Business Value & Risk Mitigation

### Revenue Impact (HIGH/MEDIUM/LOW)
- **Onboarding Conversion**: [How this improves conversion]
- **Enterprise Trust**: [How this builds trust]
- **Support Efficiency**: [How this reduces tickets]

### Risk Reduction Achieved
- **Regression Prevention**: [What regressions are prevented]
- **CI Stability**: [How this improves CI]
- **Compliance Confidence**: [How this supports compliance]

### Business Alignment
Supports $29/$99/$299 tier customer acquisition by:
1. [Specific improvement 1]
2. [Specific improvement 2]
```

#### 3. Comprehensive Test Coverage (REQUIRED)
BEFORE submitting PR, MUST have:
- [ ] **Unit tests**: For all route guards, navigation logic, error messages, accessibility
- [ ] **Integration tests**: For component interactions (e.g., router + auth store)
- [ ] **E2E tests**: For complete user flows (unauth → login → feature)
- [ ] **Test counts documented**: "X/Y passing (Z% pass rate)"

**Minimum Test Coverage for Hardening Issues**:
- Navigation changes: 5+ unit tests for parity, accessibility, no-wallet-UI
- Router guard changes: 15+ integration tests for auth behavior
- Error message changes: 5+ tests for user-friendly messaging
- E2E flows: 10+ tests for critical paths (auth-first, mobile parity)

#### 4. Test Evidence (REQUIRED)
PR description MUST include:
- [ ] **Before/After test counts**: Show improvement (e.g., "9 arbitrary waits → 0")
- [ ] **Exact pass rates**: "3392/3417 unit tests (99.3%)"
- [ ] **Test execution logs**: Paste actual test output showing passes
- [ ] **CI workflow links**: Link to green CI runs

**Template**:
```markdown
### Test Coverage Summary

| Category | Tests | Pass Rate | Status |
|----------|-------|-----------|--------|
| Unit Tests | X/Y | Z% | ✅ PASSING |
| Integration | X/Y | Z% | ✅ PASSING |
| E2E Auth-First | X/Y | Z% | ✅ PASSING |
```

#### 5. Before/After Evidence (REQUIRED)
MUST provide:
- [ ] **Screenshots**: For UI changes (navigation, error messages, accessibility)
- [ ] **Test logs**: Showing before/after test behavior
- [ ] **Code snippets**: Showing before/after patterns (e.g., arbitrary waits → semantic)

#### 6. CI Must Be Green (REQUIRED)
- [ ] **All workflows passing**: No red checks allowed
- [ ] **No skipped critical tests**: Only skip with documented justification
- [ ] **Build succeeds**: TypeScript compiles without errors
- [ ] **Coverage maintained**: No drops below thresholds

**If CI fails with pre-existing issues**: Document which tests were already failing and provide evidence your changes don't make it worse.

#### 7. Acceptance Criteria Mapping (REQUIRED)
PR must explicitly map to issue ACs:
- [ ] Table showing each AC and how it's met
- [ ] Test evidence for each AC
- [ ] Links to specific code changes for each AC

**Template**:
```markdown
| AC | Description | Status | Evidence |
|----|-------------|--------|----------|
| AC #1 | Unauth redirect | ✅ PASS | 17 tests in auth-guard.test.ts |
| AC #2 | No wallet UI | ✅ PASS | 5 tests in Navbar.navigation-parity.test.ts |
```

### Common Rejection Reasons (NEVER DO THIS)

❌ **"Missing tests"** - PR submitted without unit/integration tests for new logic
- **Prevention**: Write tests FIRST, then code

❌ **"No business value"** - PR description only has technical changes, no business impact
- **Prevention**: Always explain revenue/risk/support impact

❌ **"CI failing"** - PR submitted with red checks
- **Prevention**: Run all tests locally before pushing

❌ **"Incomplete evidence"** - PR lacks test logs, screenshots, or pass counts
- **Prevention**: Use template above, provide ALL evidence

❌ **"Not linked to issue"** - PR doesn't reference issue number
- **Prevention**: Start description with `Closes #XXX`

### Quality Gates (ALL MUST PASS)

Before marking PR as "Ready for Review":

1. **Self-Review Checklist**:
   - [ ] Read PR description as if you're the product owner
   - [ ] Verify ALL business value points are clear
   - [ ] Check ALL test evidence is included
   - [ ] Confirm CI is green
   - [ ] Validate issue link works

2. **Test Verification**:
   - [ ] Run `npm test` - all passing
   - [ ] Run `npm run test:e2e` - all passing
   - [ ] Run `npm run build` - succeeds
   - [ ] Check coverage hasn't dropped

3. **Documentation**:
   - [ ] Implementation summary created (if significant feature)
   - [ ] Testing matrix created (if new feature area)
   - [ ] Copilot instructions updated (if process gap found)

### Example of HIGH QUALITY PR Description

See PR #XYZ for reference (after this is merged):
- Clear `Closes #438` link
- Detailed business value (revenue, risk, support)
- Complete test coverage table
- Before/after code examples
- Test execution evidence
- CI workflow links
- AC mapping table

---

## FAILURE TO MEET REQUIREMENTS = IMMEDIATE REJECTION

**Product Owner will reject ANY PR that lacks:**
1. Comprehensive test coverage (unit + integration + E2E)
2. Business value documentation (revenue + risk + support)
3. Test evidence (counts, logs, screenshots)
4. Issue linking (`Closes #XXX`)
5. All tests passing (CI green)
6. AC mapping table

**This is NOT optional. Every hardening PR MUST meet all standards.**

---

## QUALITY DOCUMENTATION REQUIREMENTS
- Unit test coverage with specific test counts
- Integration test patterns and API interactions
- E2E test coverage with user flow descriptions
- Edge case validation (duplicates, invalid data, errors)
- Business value linkage to product roadmap
- Test evidence (pass/fail counts, duration)

**Example**: See `docs/implementations/WHITELIST_MANAGEMENT_TESTING_MATRIX.md` for the required level of detail.

### Test Quality Requirements

**ALL tests must pass before marking work complete.** When writing tests:

1. **Async Testing**: Components with async data loading need proper async test patterns
   - ❌ BAD: Checking loading state immediately after mount (mock data loads too fast)
   - ✅ GOOD: Either test functional behavior after data loads, OR mock delays properly
   
2. **Loading State Tests**: If testing loading states:
   - Use `vi.useFakeTimers()` to control timing
   - Mock async functions to control when they resolve
   - OR skip loading state tests if not critical (focus on functional tests)

3. **Error State Tests**: Test error states by:
   - Mocking functions to throw errors
   - Not just checking if error template exists in HTML

4. **Example Pattern**:
```typescript
// Good: Test functional behavior after load
it('should display data after loading', async () => {
  const wrapper = mount(Component);
  await wrapper.vm.$nextTick();
  await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for mock data
  expect(wrapper.text()).toContain('Expected Data');
});

// Good: Test with controlled timing
it('should show loading state', async () => {
  vi.useFakeTimers();
  const wrapper = mount(Component);
  expect(wrapper.find('.loading').exists()).toBe(true);
  await vi.advanceTimersByTimeAsync(1000);
  expect(wrapper.find('.loading').exists()).toBe(false);
  vi.useRealTimers();
});
```

**Product Owner Requirement**: Zero failing tests allowed. If tests are flaky or timing-dependent, fix them or remove them. Never commit code with known test failures.

### E2E Test Quality Requirements (Playwright)

**ALL E2E tests must be robust and pass consistently in CI.** When writing E2E tests:

1. **Async Data Loading**: Components with async mock data need proper wait patterns
   - ❌ BAD: Checking elements immediately after page load (mock data hasn't loaded)
   - ✅ GOOD: Wait for `'load'` state + explicit element visibility check
   - ❌ NEVER: Use `waitForLoadState('networkidle')` — Vite HMR SSE blocks networkidle indefinitely (see section 7i)
   
2. **E2E Test Pattern**:
```typescript
// ✅ CORRECT: Use 'load' (not 'networkidle') — Vite HMR SSE prevents networkidle
test('should display element', async ({ page }) => {
  await page.goto('/route');
  await page.waitForLoadState('load'); // SSE-safe; fires when DOM+JS ready
  
  const element = page.getByRole('button', { name: /Action/i });
  await expect(element).toBeVisible({ timeout: 15000 }); // Semantic wait
});

// ❌ WRONG: networkidle hangs when Vite HMR SSE is active
test('should display element', async ({ page }) => {
  await page.goto('/route');
  await page.waitForLoadState('networkidle'); // DANGEROUS: may hang 60-90s in CI
  const element = page.getByRole('button', { name: /Action/i });
  await expect(element).toBeVisible();
});
```

3. **Auth-Dependent Routes** (CRITICAL for CI): Routes requiring authentication need EXTRA time in CI
   - Auth store initializes async in main.ts → component mounts → renders (5-10 seconds in CI)
   - ❌ BAD: 3s wait, 20s timeouts (fails in CI but passes locally)
   - ⚠️ PARTIAL: 5s wait, 30s timeouts (may still fail in CI for complex flows)
   - ✅ GOOD: 10s wait, 45s timeouts (passes reliably in CI and locally)
   
```typescript
// ✅ Pattern for auth-dependent routes (e.g., /launch/guided, /compliance/*, /tokens/*)
test('should display auth-required page', async ({ page }) => {
  await page.goto('/launch/guided');
  await page.waitForLoadState('load'); // Use 'load' NOT 'networkidle' — Vite HMR SSE blocks networkidle
  
  // Wait for SPECIFIC element that proves page loaded (semantic wait)
  const title = page.getByRole('heading', { name: /Guided Token Launch/i, level: 1 });
  await expect(title).toBeVisible({ timeout: 45000 }); // Extra time for CI
  
  // Now interact with form elements
  const input = page.getByPlaceholder(/enter your organization name/i);
  await input.waitFor({ state: 'visible', timeout: 45000 });
  await input.fill('Test Company');
  
  // Extra wait after interactions (3000ms for CI)
  await page.waitForTimeout(3000);
});
```

**CRITICAL**: Multi-step wizard navigation requires 3000ms waits between steps in CI:
```typescript
// After filling form and clicking Continue
await page.waitForTimeout(3000); // Validation + state update
const continueButton = page.locator('button').filter({ hasText: /continue/i });
await continueButton.waitFor({ state: 'visible', timeout: 45000 });
await expect(continueButton).toBeEnabled();
await continueButton.click();
await page.waitForTimeout(3000); // Step transition in CI needs extra time

// Repeat pattern for each step navigation
```

4. **Click Actions**: Add small waits after animations
```typescript
await button.click();
await page.waitForTimeout(300); // Wait for animation/transition
await expect(element).toHaveAttribute('aria-expanded', 'true');
```

5. **Visibility Timeouts**: Use generous timeouts for CI environments
   - Local: 5000-10000ms may work
   - CI (no auth): 15000ms recommended (slower environments)
   - CI (auth-required): 45000ms recommended (auth init + component load)

6. **Playwright locator.waitFor() API**: CRITICAL - `state` parameter accepts only: 'attached' | 'detached' | 'visible' | 'hidden'
   - ❌ BAD: `await button.waitFor({ state: 'enabled' })` - **NOT A VALID STATE** - causes "state: expected one of (attached|detached|visible|hidden)" error
   - ✅ GOOD: `await button.waitFor({ state: 'visible' }); await expect(button).toBeEnabled()`
   - Use `waitFor({state: 'visible'})` first, then `expect(locator).toBeEnabled()` to check if element is enabled
   
```typescript
// CORRECT pattern for checking if button is visible and enabled
const button = page.locator('button').filter({ hasText: /Continue/i });
await button.waitFor({ state: 'visible', timeout: 45000 });
await expect(button).toBeEnabled();  // Check enabled separately
await button.click();

// WRONG pattern - causes test failure
const button = page.locator('button').filter({ hasText: /Continue/i });
await button.waitFor({ state: 'enabled', timeout: 45000 }); // ERROR: 'enabled' not valid
```

7. **Wizard Step Transition Timing (Multi-Step Forms)**: Step transitions need extra time in CI
   - Multi-step wizards that unmount/mount components require 5000ms waits (not 2000ms or 3000ms)
   - Pattern: Form validation + state update + component unmount + next component mount
   - Apply after EVERY form submit and BEFORE checking next step elements
   
```typescript
// CORRECT pattern for wizard step navigation in CI
await input.fill('value');
await page.waitForTimeout(5000); // CI needs 5s for validation + state updates

const continueButton = page.locator('button').filter({ hasText: /Continue/i });
await continueButton.waitFor({ state: 'visible', timeout: 45000 });
await expect(continueButton).toBeEnabled();
await continueButton.click();
await page.waitForTimeout(5000); // CI needs 5s for step transition (unmount + mount)

// For tests with 2+ step transitions, add cumulative wait before final check
// Increased from 3s → 5s (11th attempt) → 10s (12th attempt) after continued CI failures
await page.waitForTimeout(10000); // Additional time for multi-step accumulation in CI

// Now check next step
const nextStepHeading = page.locator('h2').filter({ hasText: /Next Step/i });
await expect(nextStepHeading).toBeVisible({ timeout: 45000 });
```

8. **Playwright Strict Mode**: Avoid ambiguous selectors
   - ❌ BAD: `page.getByText('Jurisdiction')` when word appears multiple times
   - ✅ GOOD: `page.getByText('Jurisdiction').first()` or use count() to check existence
   - ✅ BETTER: Use role-based selectors with specific names

9. **Auth Redirect Testing**: Testing authentication guards requires special handling
   - Auth guards redirect to home with query params (e.g., `/?showAuth=true`)
   - CI environment may format URLs differently than local
   - Use flexible URL assertions, not exact matches
   - After 4+ optimization attempts with no CI improvement, use CI-only skip
   
```typescript
// CORRECT pattern after 4+ failed optimization iterations
test('should require authentication', async ({ page }) => {
  // Skip in CI after multiple optimization attempts
  // Document iterations attempted and root cause
  test.skip(!!process.env.CI, 'CI absolute timing ceiling reached after 4 optimization attempts. Test passes 100% locally.')
  
  // Clear auth
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1000)
  await page.evaluate(() => localStorage.clear())
  
  // Try to access protected route
  await page.goto('/protected-route')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(10000) // CI needs 10s for auth guard redirect
  
  // Flexible verification: URL param OR auth modal visible
  const url = page.url()
  const urlHasAuthParam = url.includes('showAuth=true')
  const authModalVisible = await page.locator('form').filter({ hasText: /email/i }).isVisible().catch(() => false)
  expect(urlHasAuthParam || authModalVisible).toBe(true)
})

// WRONG patterns - too strict for CI
test('should require authentication', async ({ page }) => {
  // ... setup ...
  
  // ❌ Exact URL match fails in CI with different URL formatting
  await expect(page).toHaveURL('/?showAuth=true')
  
  // ❌ Complex regex may not match all CI URL formats
  const url = page.url()
  expect(url).toMatch(/^https?:\/\/[^/]+\/\?showAuth=true$/)
})
```

**Progressive Optimization Protocol for Auth Redirect Tests**:
1. Iteration 1-2: Increase wait times (2s → 5s → 10s)
2. Iteration 3-4: Make URL assertions flexible (exact → regex → toContain → dual check)
3. Iteration 5+: If still failing in CI but passing locally 100%, apply CI-only skip

**Exception Policy**: After 4+ optimization attempts with auth redirect tests consistently passing locally but failing in CI, use `test.skip(!!process.env.CI, 'reason')` to skip in CI only. Tests remain active locally for functionality validation.

**Product Owner Requirement**: E2E tests must pass in CI when possible. Auth redirect tests may use CI-only skip after exhaustive optimization due to environmental differences.

### E2E Test Coverage Requirements for New Features

**MANDATORY**: When implementing new user-facing features, E2E tests are REQUIRED before marking work complete.

**Minimum E2E Coverage**:
- New views/pages: At least 10 tests covering:
  - Page navigation and title
  - Main UI elements visibility
  - Empty states
  - Action buttons functionality
  - Error states
  - Keyboard navigation
  - Loading states with proper async handling
  
- New wizard steps: At least 5 tests covering:
  - Step display and validation
  - Required field warnings
  - Modal/dialog interactions
  - Navigation between steps
  - Integration with wizard state

**Example Structure**:
```typescript
test.describe('New Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Auth setup
    // Navigate to feature
    // Wait for load
  });

  test('should display page correctly', async ({ page }) => {
    // Test rendering
  });

  test('should handle user actions', async ({ page }) => {
    // Test interactions
  });
  
  // ... more tests
});
```

**Quality Gate**: PR cannot be marked complete without:
- ✅ E2E test file created (e2e/feature-name.spec.ts)
- ✅ Minimum coverage met (10+ tests for views, 5+ for wizard steps)
- ✅ All E2E tests passing locally AND in CI
- ✅ Tests use proper async patterns (networkidle, timeouts, visibility checks)

### Wizard Step Validation Testing

**CRITICAL**: When adding new validation requirements to wizard steps, ALL existing tests MUST be updated to reflect the new validation logic.

**Common Pattern**: Wizard steps with `isValid` computed property
```typescript
// If you add new validation requirements like this:
const isValid = computed(() => {
  const complianceValid = allRequiredComplete.value || riskAcknowledged.value
  const whitelistValid = !whitelistRequired.value || selectedWhitelistId.value !== null
  return complianceValid && whitelistValid // BOTH conditions required
})

// Then ALL existing tests that check `isValid` MUST be updated:
it('should be valid when conditions met', async () => {
  const vm = wrapper.vm as any
  vm.riskAcknowledged = true
  vm.selectedWhitelistId = 'test-id' // NEW: Must set all required fields
  await wrapper.vm.$nextTick()
  expect(vm.isValid).toBe(true)
})
```

**Before Committing Changes**:
1. Run ALL tests for the modified component
2. Check for tests that verify `isValid` state
3. Update tests to satisfy ALL validation conditions
4. Never assume tests will pass without verification

## 🚨 E2E TESTING REQUIREMENTS 🚨

**MANDATORY:** E2E tests are NOT OPTIONAL for user-facing features. They are REQUIRED quality gates.

### Pre-Completion E2E Checklist

**Before marking ANY work complete:**

- [ ] **Run E2E tests locally** - Execute `npm run test:e2e` for affected areas
- [ ] **Document pass counts** - Record exact numbers (e.g., "8/8 passing in 58.6s")
- [ ] **Verify CI compatibility** - Tests must use deterministic waits (10s auth + 45s visibility)
- [ ] **Check for skipped tests** - No new test.skip() without product owner approval
- [ ] **Validate auth-first patterns** - All protected routes must test unauthenticated redirect

### Auth-First E2E Testing Pattern (MANDATORY)

For ALL protected routes and auth-required features:

```typescript
test('should redirect unauthenticated user to login', async ({ page }) => {
  // Clear auth state
  await page.goto('/')
  await page.waitForLoadState('load') // 'load' NOT 'networkidle' — Vite HMR SSE blocks networkidle
  await page.evaluate(() => localStorage.clear())
  
  // Try to access protected route
  await page.goto('/protected-route')
  await page.waitForLoadState('load')
  await page.waitForTimeout(5000) // Auth guard redirect
  
  // Flexible verification (CI-safe)
  const url = page.url()
  const urlHasAuthParam = url.includes('showAuth=true')
  const authModalVisible = await page.locator('form').filter({ hasText: /email/i }).isVisible().catch(() => false)
  
  expect(urlHasAuthParam || authModalVisible).toBe(true)
})

test('should allow authenticated user to access route', async ({ page }) => {
  // Set up auth before navigation
  await page.addInitScript(() => {
    localStorage.setItem('algorand_user', JSON.stringify({
      address: 'TEST_ADDRESS',
      email: 'test@example.com',
      isConnected: true,
    }))
  })
  
  // Navigate to protected route
  await page.goto('/protected-route')
  await page.waitForLoadState('load') // 'load' NOT 'networkidle' — SSE-safe
  
  // Verify page loaded (semantic wait — no arbitrary timeout needed)
  const heading = page.getByRole('heading', { name: /Expected Title/i, level: 1 })
  await expect(heading).toBeVisible({ timeout: 45000 }) // CI-safe timeout
})
```

### E2E Quality Standards

**Deterministic Waits (REQUIRED):**
- Auth-required routes: element-based semantic waits (toBeVisible with 45s+ timeout)
- Element visibility: 45s timeout minimum
- NO brittle `waitForTimeout()` without justification
- Use `waitForLoadState('load')` — NOT `'networkidle'` (Vite HMR SSE makes networkidle non-deterministic in CI)

**Product Alignment (REQUIRED):**
- Verify NO wallet connector UI appears
- Verify NO "Not connected" status text
- Verify email/password authentication only
- Verify backend-driven token deployment flows

**Test Skipping (PROHIBITED without approval):**
- Never skip E2E tests without 10+ optimization attempts
- Tests must pass 100% locally before considering skip
- Document all optimization iterations in skip comment
- Get product owner approval for CI-only skips

**Exit Code Forcing (PROHIBITED):**
- ❌ **NEVER** force `process.exitCode = 0` to hide test failures
- ❌ **NEVER** use exit hooks to mask CI failures
- ✅ **ALWAYS** let real test failures surface in CI
- ✅ **CRITICAL LESSON LEARNED (Feb 2026)**: When removing exit code forcing that was masking failures:
  1. **MUST** run full E2E test suite locally FIRST
  2. **MUST** fix any exposed flaky tests BEFORE committing
  3. **MUST** verify all tests pass in CI after removal
  4. Pattern: Remove forcing → Run E2E locally → Fix flaky tests → Commit → Verify CI

**Why Exit Code Forcing is Prohibited:**
- Masks real test failures, violating deterministic behavior requirements
- Makes debugging impossible (failures hidden)
- Violates product owner quality standards
- Creates false confidence in CI green status

**What to Do Instead:**
- Use per-test error suppression: `page.on('console', ...)` in `beforeEach`
- Fix flaky tests with proper waits (not arbitrary timeouts)
- Let custom reporters show actual test results
- Address root causes, not symptoms

### E2E Failure Investigation Protocol

**When E2E tests fail:**

1. **Run locally first** - `npm run test:e2e -- failing-test.spec.ts`
2. **Check timing patterns** - Are waits sufficient for CI?
3. **Verify selectors** - Use role-based selectors, not CSS
4. **Test in CI mode** - Run with `CI=true npm run test:e2e`
5. **Document findings** - Record optimization attempts
6. **Fix deterministically** - NO "might work" timing guesses

**Progressive Optimization Pattern:**
- Iteration 1-3: Increase timeouts (5s → 10s → 15s)
- Iteration 4-6: Flexible assertions (exact → regex → flexible)
- Iteration 7-9: Alternative approaches (different selectors)
- Iteration 10+: Consider CI-only skip with PO approval

### Business Roadmap Alignment Verification

**Before completing ANY feature, verify:**

```typescript
// Run this E2E check for all user-facing features
test('should align with business roadmap requirements', async ({ page }) => {
  await page.goto('/')
  const content = await page.content()
  
  // Email/password only - NO wallet connectors
  expect(content).not.toMatch(/WalletConnect|MetaMask|Pera.*Wallet|Defly/i)
  expect(content).not.toContain('connect wallet')
  
  // Auth-first routing
  expect(content).toMatch(/Sign\s+In|Email|Password/i)
  
  // Backend-driven deployment (no frontend signing)
  expect(content).not.toContain('sign transaction')
  expect(content).not.toContain('approve in wallet')
})
```

**Reference:** https://raw.githubusercontent.com/scholtz/biatec-tokens/refs/heads/main/business-owner-roadmap.md

### Past E2E Quality Violations

**NEVER REPEAT:**
- ❌ Finishing work without running E2E tests
- ❌ Skipping E2E tests without optimization attempts
- ❌ Using brittle timing waits (hardcoded timeouts)
- ❌ Ignoring CI failures as "pre-existing"
- ❌ Not verifying product roadmap alignment
- ❌ **NEW (Feb 2026)**: Removing exit code forcing without running full E2E suite first

**Product Owner Rejection History:**
- Work rejected for missing E2E coverage
- Work rejected for flaky E2E tests in CI
- Work rejected for wallet UI traces in auth-first flows
- **Feb 2026 (PR #421)**: Work initially incomplete - removed exit code forcing (correct per requirements) but didn't run full E2E suite to fix exposed flaky tests. Fixed by adding proper waits to flaky test.

## Project Overview

This is a Vue 3 + TypeScript frontend application for managing and deploying tokens on multiple blockchain networks. The application provides a user interface for creating, managing, and deploying various token standards across both EVM chains (Ethereum, Arbitrum, Base) and AVM chains (Algorand mainnet, Algorand testnet, VOI, Aramid).

## Tech Stack

- **Framework**: Vue 3 with Composition API (`<script setup>`)
- **Language**: TypeScript (strict mode enabled)
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with custom configuration and dark mode support
- **State Management**: Pinia stores
- **Router**: Vue Router
- **Blockchain**: Multi-chain support with Algorand SDK (algosdk) for AVM chains and ethers.js/web3.js for EVM chains
- **Testing**:
  - **Unit Tests**: Vitest + Vue Test Utils
  - **E2E Tests**: Playwright (cross-browser testing)

## Project Structure

```
src/
├── components/       # Vue components
│   ├── ui/          # Reusable UI components (Button, Modal, Card, Input, Select, Badge)
│   └── layout/      # Layout components (Navbar, Sidebar)
├── generated/       # Auto-generated API client from backend Swagger spec
├── stores/          # Pinia stores (auth, tokens, theme, settings, subscription)
├── router/          # Vue Router configuration
├── views/           # Page components
├── assets/          # Static assets
├── main.ts          # Application entry point
└── App.vue          # Root component

docs/
├── general/         # General project documentation (README, CHANGELOG, etc.)
├── compliance/      # Compliance and regulatory documentation
├── business/        # Business value and roadmap documentation
├── onboarding/      # User onboarding and wizard documentation
├── issues/          # Issue tracking and verification documentation
├── implementations/ # Implementation summaries and MVP documentation
├── testing/         # Test results and coverage documentation
├── deployment/      # Deployment and UX improvement documentation
├── pr/              # Pull request and analysis documentation
├── attestations/    # Attestation dashboard documentation
├── metadata/        # Metadata pipeline documentation
└── copilot/         # Copilot instruction updates
```

## Development Commands

- **Development Server**: `npm run dev`
- **Build**: `npm run build` (runs vue-tsc type checking then vite build)
- **Preview Production Build**: `npm run preview`
- **Generate API Client**: `npm run generate-api` (generates TypeScript client from backend Swagger spec)
- **Unit Tests**: `npm test` (Vitest)
- **Unit Tests (Watch)**: `npm run test:watch`
- **Unit Tests (UI)**: `npm run test:ui`
- **Test Coverage**: `npm run test:coverage`
- **E2E Tests**: `npm run test:e2e` (Playwright)
- **E2E Tests (UI Mode)**: `npm run test:e2e:ui`
- **E2E Tests (Headed)**: `npm run test:e2e:headed`
- **E2E Tests (Debug)**: `npm run test:e2e:debug`
- **E2E Test Report**: `npm run test:e2e:report`

## Code Style and Conventions

### TypeScript

- **Strict Mode**: Always enabled - use proper typing, never use `as any` or `any` type
- **Compiler Options**: Target ES2020, use ESNext modules
- **Type Checking**: The build command includes `vue-tsc -b` for type checking
- **Unused Imports**: TypeScript strict mode will fail the build if imports are declared but never used (TS6133). Always remove unused imports before committing.
- Follow existing patterns in `tsconfig.app.json`:
  - `noUnusedLocals: true`
  - `noUnusedParameters: true`
  - `noFallthroughCasesInSwitch: true`
  - For unused parameters in functions (e.g., event handlers), prefix with underscore (e.g., `_data`) to indicate intentional non-use and satisfy TypeScript strict mode. Preferably do not end work with unused parameters unless necessary.

### Vue Components

- Use **Composition API** with `<script setup>` syntax
- Component structure example:

  ```vue
  <script setup lang="ts">
  // imports
  // props/emits
  // composables/stores
  // reactive state
  // computed
  // methods
  </script>

  <template>
    <!-- markup -->
  </template>
  ```

- Use TypeScript for all component logic
- Prefer composition over options API

### Styling

- **Primary Framework**: Tailwind CSS
- **Dark Mode**: Use `class` strategy (check `tailwind.config.js`)
- **Custom Colors**:
  - Use extended gray palette (50-950)
  - Biatec-specific colors defined in theme
- **Custom Animations**: `fade-in`, `slide-up`, `float`, `pulse-slow` available
- **Utility Classes**: Extensive safelist defined in `tailwind.config.js` - use these classes
- **Font**: Inter font family is primary
- Follow the glass-effect and gradient patterns seen in existing components
- Aloways produce professional UX and UI designs

### State Management

- Use **Pinia** stores for global state
- Store files located in `src/stores/`
- Existing stores: `auth`, `tokens`, `theme`, `settings`, `subscription`
- Follow existing store patterns when creating new ones

### Blockchain Integration

- Use `algosdk` for AVM chain interactions (Algorand mainnet, testnet, VOI, Aramid)
- Use `ethers.js` or `web3.js` for EVM chain interactions (Ethereum, Arbitrum, Base, testnets)
- Support multiple networks: AVM chains (Algorand mainnet, testnet, VOI, Aramid) and EVM chains (Ethereum mainnet, Arbitrum, Base, Sepolia testnet)
- Network configurations defined in `main.ts`
- ERC standards (ERC20, ERC721) are for EVM chains
- ASA and ARC standards (ASA, ARC3, ARC19, ARC69, ARC200, ARC72) are for AVM chains

### Backend API Integration

- **Generated API Client**: Use the auto-generated TypeScript client from `src/generated/ApiClient.ts`
- **Generation Command**: Run `npm run generate-api` to update the client when backend API changes
- **Base URL**: Configured via `VITE_API_BASE_URL` environment variable
- **Usage**: Import and instantiate the client for type-safe API calls
- **Regeneration**: Always regenerate the client after backend API schema changes to maintain type safety

### File Naming

- Vue components: PascalCase (e.g., `TokenCard.vue`, `Button.vue`)
- TypeScript files: kebab-case or camelCase (e.g., `auth.ts`, `stripe-config.ts`)
- Store files: lowercase (e.g., `tokens.ts`, `settings.ts`)
- **Service files**: Use descriptive names and avoid file name casing conflicts on case-sensitive filesystems

### Pre-Existing Code Compatibility

**CRITICAL: Always preserve backward compatibility with existing code**

Before creating new services, stores, or APIs:
1. **Check for existing implementations**: Search for similar files or functionality
2. **Verify API contracts**: If modifying existing services, check all consumers
3. **Avoid breaking changes**: If creating a new API, don't modify existing components that use old APIs
4. **File naming conflicts**: On case-sensitive filesystems, `WhitelistService.ts` and `whitelistService.ts` are different files. Be careful with:
   - Renaming files that change casing
   - Creating new files with similar names but different casing
   - Importing from files with case-sensitive names
5. **Test all affected code**: After any service changes, run full test suite to catch breaking changes
6. **Update all consumers together**: If you must break an API, update all consuming components in the same commit

**Example**: When creating `whitelistService.ts`, existing components using `WhitelistService.ts` with a different API must continue to work. Either:
- Keep both services separate with distinct names
- Create a migration plan and update all consumers
- Never partially migrate - either all or none

## Important Boundaries

### DO NOT:

- Modify `.github/workflows/` files unless specifically requested
- Change network configurations in `main.ts` without explicit instruction
- Remove or modify security-related code (authentication)
- Modify deployment scripts or SSH configurations
- Change TypeScript strict mode settings
- Add `any` types - always use proper typing
- Modify the Buffer/global polyfills in `main.ts`
- Place documentation files in the root directory - use appropriate `docs/` subfolders

### DO:

- Maintain existing component structure and patterns
- Follow Tailwind CSS utility-first approach
- Use Composition API with `<script setup>`
- Ensure proper TypeScript typing
- Keep dark mode support in mind for UI changes
- Use existing UI components from `src/components/ui/` before creating new ones

## Testing and Validation

**🚨 CRITICAL TESTING REQUIREMENTS 🚨**

**ABSOLUTELY NEVER FINISH WORK WITH FAILING TESTS UNDER ANY CIRCUMSTANCES.** This project maintains strict quality standards where all tests must pass before code changes are accepted. Failing tests indicate potential bugs, broken functionality, or incomplete implementations that could impact users.

**PAST INCIDENT:** Copilot previously finished work with failing tests, which violated these instructions and could have introduced bugs into production. This must never happen again.

**If tests are failing:**

1. **IMMEDIATELY STOP** all other work
2. **DEBUG** the failing tests immediately - do not proceed until root cause is identified
3. **FIX** the root cause (not just the test symptoms) - ensure the fix is correct and complete
4. **RE-RUN** all tests to ensure they pass - verify multiple times if needed
5. **ONLY THEN** proceed with the work or mark it as complete

**Remember:** Test failures are not just technical issues - they represent potential user-facing problems that could break the application in production. Treat test failures as critical blocking issues that must be resolved before any other action.

### Automated Testing Enforcement

- **Before any code changes:** Run tests to establish baseline
- **After any code changes:** Run tests immediately to catch regressions
- **Before committing:** Run full test suite
- **Before PR creation:** Run all tests and ensure coverage thresholds are met
- **If uncertain about test status:** Run tests again to confirm

### Pre-Completion Testing Checklist

**MANDATORY: Complete ALL items before marking work as done. FAILURE TO COMPLETE WILL RESULT IN IMMEDIATE WORK REJECTION:**

- [ ] Run `npm test` (Unit tests) - Ensure 0 failures, 0 errors
- [ ] Run `npm run test:coverage` - Ensure coverage meets thresholds:
  - Statements: ≥78%
  - Branches: ≥68.5%
  - Functions: ≥68.5%
  - Lines: ≥79%
  - **Note**: New code should aim for 70%+ branch coverage. The 68.5% threshold accounts for pre-existing low-coverage files (DeploymentStatusService: 16.52%, whitelist.ts: 10%) which are known technical debt.
- [ ] Run `npm run test:e2e` (E2E tests) - Ensure 0 failures, 0 errors
- [ ] Run `npm run build` - Ensure TypeScript compilation passes
- [ ] Run `npm run check-typescript-errors-tsc` - Ensure TypeScript compilation without warnings/errors
- [ ] Run `npm run check-typescript-errors-vue` - Ensure VUE TypeScript compilation without warnings/errors
- [ ] If adding/modifying components: Run component-specific unit tests
- [ ] If changing UI/UX: Verify E2E tests for affected user flows pass
- [ ] If modifying API integration: Run `npm run generate-api` and update code accordingly
- [ ] Verify dark mode compatibility for UI changes

**FINAL VERIFICATION:** Before marking any task complete, run the full test suite one final time and document the results.

### Dependency Updates: Special Requirements

**🚨 CRITICAL: Dependency updates require COMPLETE verification before approval 🚨**

When handling dependency update PRs (especially automated Dependabot PRs):

#### Pre-Approval Requirements (MANDATORY)

1. **Run ALL Tests** ✅
   - [ ] Run `npm test` - All unit tests must pass
   - [ ] Run `npm run test:e2e` - All E2E tests must pass
   - [ ] Run `npm run build` - Build must succeed without errors
   - [ ] Document test results with specific counts (e.g., "2779/2798 passing")

2. **Review Release Notes** 📋
   - [ ] Fetch and review official release notes from package repository
   - [ ] Identify ALL changes: features, fixes, breaking changes, security updates
   - [ ] Document what changed between versions
   - [ ] Verify semver classification (major/minor/patch)

3. **Business Value Analysis** 💼
   - [ ] Create comprehensive business value document explaining:
     - What changed and why it matters
     - Business impact (HIGH/MEDIUM/LOW)
     - Security implications
     - User-facing changes (if any)
     - Risk assessment
     - Alignment with product roadmap
   - [ ] Include ROI analysis if applicable
   - [ ] Document current vs. future value

4. **Risk Assessment** ⚠️
   - [ ] Technical risks (breaking changes, compatibility)
   - [ ] Business risks (user impact, revenue impact)
   - [ ] Security risks (vulnerabilities, compliance)
   - [ ] Document mitigation strategies for each risk

5. **Test Coverage Verification** 🧪
   - [ ] Verify existing tests cover affected functionality
   - [ ] Add new tests if dependency introduces new behavior
   - [ ] Document test coverage for changed functionality

6. **Manual Verification Checklist** ✅
   - [ ] Create detailed manual testing checklist with:
     - Prerequisites (browser versions, environment setup)
     - Step-by-step test scenarios
     - Expected results for each scenario
     - Browser compatibility verification
   - [ ] Include at least 3-5 critical user flows
   - [ ] Document any known limitations or browser-specific issues

7. **Documentation Updates** 📝
   - [ ] Update CHANGELOG.md if user-facing changes
   - [ ] Update README.md if setup/installation changes
   - [ ] Create business value document (save as `DEPENDENCY_UPDATE_<NAME>_<DATE>.md`)
   - [ ] Update copilot instructions if dependency introduces new patterns

#### Common Dependency Update Mistakes to AVOID ❌

1. ❌ **Finishing work without running tests**
   - NEVER assume tests pass just because it's a minor version bump
   - ALWAYS run full test suite: `npm test && npm run test:e2e && npm run build`

2. ❌ **Not reviewing release notes**
   - NEVER approve dependency updates without understanding what changed
   - ALWAYS fetch and review official release notes

3. ❌ **Missing business value analysis**
   - NEVER approve updates without explaining "why this matters"
   - ALWAYS document business value, risks, and ROI

4. ❌ **Inadequate test coverage**
   - NEVER assume existing tests cover new dependency behavior
   - ALWAYS verify test coverage for changed functionality

5. ❌ **No manual verification checklist**
   - NEVER skip manual testing for critical dependencies (auth, payment)
   - ALWAYS provide step-by-step manual verification for product owner

6. ❌ **Ignoring security implications**
   - NEVER overlook security updates in dependencies
   - ALWAYS run `npm audit` and document security impact

7. ❌ **Not considering product roadmap alignment**
   - NEVER approve updates without checking roadmap alignment
   - ALWAYS verify update supports current and future product phases

#### Special Cases: Critical Dependencies

For these critical dependencies, EXTRA verification is required:

**Authentication:**

- **Extra:** Test login/logout flows, session management, token refresh
- **Manual:** Verify auth persists across page reloads

**Payment/Subscription:**

- Stripe SDK, payment processors
- **Extra:** Test checkout flows, webhook handling, subscription status
- **Manual:** Verify payment flow in test mode

**UI Framework:**

- `vue`, `vite`, `tailwindcss`, `@headlessui/vue`
- **Extra:** Test responsive design, dark mode, accessibility
- **Manual:** Verify on multiple browsers and devices

#### Deployment Readiness Criteria

Before marking dependency update as "Ready to Merge":

- ✅ ALL tests passing (unit + E2E + build)
- ✅ Release notes reviewed and documented
- ✅ Business value document created
- ✅ Risk assessment completed
- ✅ Test coverage verified and documented
- ✅ Manual verification checklist created
- ✅ Product owner requirements addressed
- ✅ No breaking changes OR migration plan documented
- ✅ Security audit clean OR vulnerabilities documented with mitigation
- ✅ Rollback plan documented (how to revert if issues)

**Only when ALL criteria met:** Reply to product owner with approval recommendation.

### Unit Tests (Vitest)

- Always run `npm test` for unit tests with Vitest
- Unit tests are located in `src/` directories alongside components (e.g., `*.test.ts`, `*.spec.ts`)
- Test files use Vitest with Vue Test Utils for component testing
- Run `npm run test:coverage` to check test coverage - must meet thresholds:
  - Statements: >80%
  - Branches: >80%
  - Functions: >80%
  - Lines: >80%
- Existing test patterns:
  - Component tests: Mock dependencies, test user interactions
  - Store tests: Test state management and actions
  - Service tests: Mock API calls, test business logic

### E2E Tests (Playwright)

- **CRITICAL: Always run E2E tests before finishing the work**
- **MANDATORY: Fix any failing tests immediately - do not finish work with failing tests**
- E2E tests are located in `e2e/` directory (e.g., `*.spec.ts`)
- **Before running E2E tests, ensure browsers are installed**: `npx playwright install --with-deps chromium` (run once)
- Run `npm run test:e2e` to execute all E2E tests
- Run `npm run test:e2e:ui` for interactive test runner
- Run `npm run test:e2e:headed` to see browser during tests
- Run `npm run test:e2e:debug` for debugging tests
- Playwright tests cover:
  - End to end User flows
  - Responsive design across devices

Purpose of playwright tests is to do end-to-end testing of user flows and critical paths. They are not meant to test implementation details or internal state. Focus on what the user sees and does, not how it's implemented. Output of full journey playwright tests is used for video education and documentation, so they must be robust and reliable with mouse pointer visible and animated between mouse movements, and when run in video context must perform delays between user actions.

### E2E Test Writing Guidelines

When writing E2E tests:

- **Always wait for page load**: Use `await page.waitForLoadState("domcontentloaded")` after navigation
- **Use robust selectors**: Prefer `getByRole()`, `getByText()` over CSS selectors
- **AVOID STRICT MODE VIOLATIONS**: Never use generic selectors like `page.locator('h1')` that can match multiple elements. Always use specific role-based selectors with names and levels.
- **Add timeouts**: Use `{ timeout: 10000 }` for visibility checks to handle slow loads
- **Handle missing elements gracefully**: Use `.isVisible().catch(() => false)` for optional elements
- **Test localStorage persistence**: Verify state persists across page reloads
- **Clear state in beforeEach**: Use `localStorage.clear()` to ensure test isolation
- **Test button text variations**: Use regex patterns like `/Sign in|Authenticate/i` to match different button texts
- **Verify page loads successfully**: Always check page title or main heading as baseline
- **Focus on user behavior**: Test what users see and do, not implementation details

### Avoiding Playwright Strict Mode Violations

**CRITICAL:** Playwright's strict mode requires selectors to match exactly one element. Generic selectors often cause "strict mode violation" errors.

**❌ BAD - Will fail with multiple h1 elements:**
```typescript
await expect(page.locator('h1')).toContainText('Compliance Dashboard');
const hasMembers = await page.locator('text=/Team Members/i').isVisible();
```

**✅ GOOD - Use specific role-based selectors:**
```typescript
// Use getByRole with specific name
await expect(page.getByRole('heading', { name: 'Compliance Dashboard' })).toBeVisible();

// Use getByRole with specific level for uniqueness
const hasMembers = await page.getByRole('heading', { name: 'Team Members', level: 3 }).isVisible().catch(() => false);

// For buttons, filter by text then use first() if multiple matches expected
const button = page.locator('button').filter({ hasText: /Submit/i }).first();
```

**Common Patterns to Avoid Strict Mode Violations:**
- Instead of `page.locator('h1')` → use `page.getByRole('heading', { name: 'Expected Text' })`
- Instead of `page.locator('h2')` → use `page.getByRole('heading', { name: 'Expected Text', level: 2 })`
- Instead of `page.locator('text=/Some Text/i')` → use `page.getByRole('heading', { name: 'Some Text', level: 3 })` or `page.getByText('Some Text', { exact: false })`
- For multiple matches, use `.first()`, `.last()`, or `.nth(index)` only when semantically correct

**🚨 NAVBAR DUPLICATE ELEMENT PATTERN (Critical - Caused CI Failure in PR #447):**
The Navbar renders BOTH desktop AND mobile versions in DOM simultaneously. Any button/link present in both menus will match **twice** when using `getByRole`. Always use `.first()` for elements that appear in both desktop and mobile nav:

```typescript
// ❌ WRONG - fails with "strict mode violation: resolved to 2 elements"
// (both desktop Sign In + mobile Sign In are in DOM at same time)
const signInButton = page.getByRole('button', { name: /sign in/i });
await expect(signInButton).toBeVisible(); // FAILS: 2 elements found

// ✅ CORRECT - use .first() to target the visible desktop button
const signInButton = page.getByRole('button', { name: /sign in/i }).first();
await expect(signInButton).toBeVisible(); // PASSES

// ✅ CORRECT - for nav links present in both desktop and mobile
const guidedLaunchLink = page.getByRole('link', { name: /guided launch/i }).first();
await expect(guidedLaunchLink).toBeVisible();
```

**Pattern applies to:** Sign In button, all navigation links, any interactive element rendered in both desktop and mobile navbar variants.

### Critical E2E Testing Requirements

**NEVER finish work request with failing E2E tests. Always:**

1. **Run tests before PR creation**: Execute `npm run test:e2e` and ensure all tests pass
2. **Fix failing tests immediately**: If tests fail, debug and fix them before proceeding
3. **Verify selectors are correct**: Check that CSS selectors and placeholders match actual DOM elements
4. **IMPORTANT**: If encountering CI failures in tests unrelated to your changes:
   - Document which tests are failing and confirm they were already failing before your changes
   - Run `npm test` and `npm run test:e2e` locally to verify your tests pass
   - Create a testing matrix document showing your tests pass locally with exact counts
   - Note pre-existing failures in PR description with links to previous failing workflows
   - Do NOT spend time fixing unrelated test failures unless specifically requested
   - Product Owner will assess if pre-existing failures block merge

### Pre-Existing CI Failures - How to Handle

**Pattern Recognition:** Sometimes CI workflows fail due to pre-existing issues in other test files, not your changes.

**When You Encounter Pre-Existing Failures:**

1. **Verify Local Tests**: Run `npm test && npm run test:e2e && npm run build` locally
2. **Document Results**: Record exact test counts and pass rates (e.g., "2783/2808 passing locally")
3. **Identify Unrelated Failures**: Check if failing tests are in files you didn't modify
4. **Check Previous Runs**: Use GitHub Actions history to see if tests were already failing
5. **Report in PR**: Clearly state "Pre-existing CI failures detected in [file.spec.ts], not related to this PR"
6. **Provide Evidence**: Link to previous workflow runs showing same failures
7. **Focus on Your Tests**: Ensure YOUR new tests pass 100% locally and document this

**Example Documentation in PR:**
```markdown
## CI Status

**Unit Tests**: ✅ PASSING (2783/2808 locally)
**E2E Tests**: ⚠️ PARTIAL (Our tests: 10/10 passing)

**Pre-existing Failures** (not related to this PR):
- compliance-orchestration.spec.ts: 12 tests failing
- These failures existed before this PR (see workflow #21992064212)
- Our new tests in token-utility-recommendations.spec.ts: 100% passing
```

**Product Owner Decision Point:**
- Product Owner will decide if pre-existing failures block merge
- Your responsibility: Ensure YOUR changes don't break anything
- Your tests must pass 100% locally with documentation
4. **Test authentication flows**: Ensure protected routes are handled properly in tests
5. **Handle browser compatibility**: Add appropriate skips for browsers with known issues (e.g., Firefox networkidle timeouts)
6. **Test responsive design**: Make tests robust against different screen sizes and responsive layouts
7. **Update tests for UI changes**: When modifying components, update corresponding E2E tests
8. **Use correct URLs**: Verify route paths match actual Vue Router configuration

### Common E2E Test Patterns

```typescript
// Wait for page and check title
await page.goto("/");
await page.waitForLoadState("domcontentloaded");
await expect(page).toHaveTitle(/Expected Title/);

// Find button with flexible text matching
const button = page
  .locator("button")
  .filter({ hasText: /Button Text/i })
  .first();
await expect(button).toBeVisible({ timeout: 10000 });

// Test localStorage persistence
await page.evaluate(() => {
  localStorage.setItem("key", "value");
});
await page.reload();
const value = await page.evaluate(() => localStorage.getItem("key"));
expect(value).toBe("value");

// Handle optional elements
const element = page.locator("selector");
const isVisible = await element.isVisible().catch(() => false);
expect(isVisible || true).toBe(true); // Pass if element not found

// Handle authentication redirects
const currentUrl = page.url();
if (!currentUrl.includes("/expected-route")) {
  // Test passes if redirected due to auth
  expect(true).toBe(true);
  return;
}

// Skip Firefox for known issues
test.skip(browserName === "firefox", "Firefox has persistent networkidle timeout issues");
```

### Common E2E Test Patterns

```typescript
// Wait for page and check title
await page.goto("/");
await page.waitForLoadState("domcontentloaded");
await expect(page).toHaveTitle(/Expected Title/);

// Find button with flexible text matching
const button = page
  .locator("button")
  .filter({ hasText: /Button Text/i })
  .first();
await expect(button).toBeVisible({ timeout: 10000 });

// Test localStorage persistence
await page.evaluate(() => {
  localStorage.setItem("key", "value");
});
await page.reload();
const value = await page.evaluate(() => localStorage.getItem("key"));
expect(value).toBe("value");

// Handle optional elements
const element = page.locator("selector");
const isVisible = await element.isVisible().catch(() => false);
expect(isVisible || true).toBe(true); // Pass if element not found
```

### Test Setup and Configuration

- **Global Test Setup**: Located in `src/test/setup.ts` with configuration in `vitest.config.ts`
- **localStorage Handling**: Use real browser localStorage for tests that need persistence; clear in `beforeEach` for isolation
- **Environment**: Tests run in happy-dom environment for DOM simulation
- **Coverage Requirements**: Must maintain minimum thresholds (Statements ≥78%, Branches ≥69%, Functions ≥68.5%, Lines ≥79%)
- **Test Isolation**: Each test should be independent with proper cleanup

### Common Test Failure Causes and Solutions

**URL/Route Issues:**

- **Problem**: Tests use incorrect route paths (e.g., `/token-creator` instead of `/create`)
- **Solution**: Always verify routes in `src/router/index.ts` and use correct paths in tests

**Selector Issues:**

- **Problem**: Tests use generic selectors that don't match actual DOM elements
- **Solution**: Inspect actual HTML to find correct placeholders, classes, and element structures

**Browser Compatibility Issues:**

- **Problem**: Firefox has persistent `networkidle` timeout issues
- **Solution**: Add `test.skip(browserName === "firefox")` to affected test suites

**Responsive Design Issues:**

- **Problem**: Elements not visible on all screen sizes
- **Solution**: Make tests check for element visibility and handle gracefully when elements are hidden

**Timing Issues:**

- **Problem**: Tests fail due to slow page loads or async operations
- **Solution**: Use appropriate timeouts and wait strategies, prefer `waitForLoadState("domcontentloaded")`

**State Persistence Issues:**

- **Problem**: Tests don't properly isolate state between runs
- **Solution**: Clear localStorage in `beforeEach` hooks and mock required state

**Pinia Store Testing Issues (CRITICAL):**

- **Problem**: Store computed properties aren't reactive in tests. Setting `store.isActive = true` doesn't work when `isActive` is a computed property.
- **Solution**: Set the **underlying data** that the computed depends on, not the computed itself. Mock any lifecycle methods that might override test data.
- **Example**:

  ```typescript
  // ❌ WRONG - setting computed property directly
  subscriptionStore.isActive = true;

  // ✅ CORRECT - set underlying data
  subscriptionStore.subscription = { subscription_status: "active" } as any;
  subscriptionStore.fetchSubscription = vi.fn().mockResolvedValue(undefined); // Mock to prevent override
  ```

- **Common patterns**:
  - `authStore.isAuthenticated` depends on `authStore.isConnected` AND `authStore.user` - set both
  - `subscriptionStore.isActive` depends on `subscriptionStore.subscription.subscription_status`
  - `complianceStore.metrics` depends on `complianceStore.checklistItems` array
  - Always mock `onMounted` lifecycle hooks that call store methods (like `fetchSubscription`)

**State Persistence Issues:**

- **Problem**: Tests don't properly isolate state between runs
- **Solution**: Clear localStorage in `beforeEach` hooks and mock required state

## CI Configuration Requirements

### 🚨 CRITICAL: Vitest Configuration in vite.config.ts

**MANDATORY**: `vite.config.ts` MUST include complete vitest configuration. Without this, tests will fail in CI with "localStorage is not defined" errors even if they pass locally.

**Required Configuration**:

```typescript
export default defineConfig({
  // ... other vite config ...
  test: {
    environment: "happy-dom", // Provides browser APIs (localStorage, DOM)
    setupFiles: ["src/test/setup.ts"], // Global test setup
    globals: true, // Makes test functions globally available
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      statements: 78,
      branches: 69,
      functions: 68.5,
      lines: 79,
    },
  },
});
```

**Why This Matters**:

- CI environment doesn't provide browser APIs by default
- Tests using `localStorage`, DOM methods, or browser globals will fail without happy-dom
- Setup file must run before tests to configure global mocks
- Coverage thresholds enforce quality standards

**Common Error Without This**:

```
ReferenceError: localStorage is not defined
```

### Pre-Commit CI Verification Checklist

Before finishing ANY work, ALWAYS verify:

- [ ] **vite.config.ts** has complete vitest configuration with happy-dom environment
- [ ] **E2E tests** Main worklow end to end tests are implemented and passing
- [ ] **Unit tests** pass: `npm test` shows 2794+ passing (99.3%+)
- [ ] **Build** succeeds: `npm run build` completes without errors
- [ ] **TypeScript** compiles: 0 compilation errors

**Common CI Failure Patterns**:

1. **Display Name Mismatches**: E2E tests search for "Algorand" but UI shows "Algorand Mainnet"
   - Fix: Use regex patterns `/Algorand/i` instead of exact text
2. **Timing Issues**: Tests timeout waiting for elements
   - Fix: Use `page.waitForLoadState('networkidle')`, increase timeouts to 3000ms
3. **Missing Vitest Config**: localStorage undefined errors
   - Fix: Add test configuration to vite.config.ts

### Quality Gate: Before Marking Work Complete

Run this verification sequence:

```bash
# 1. Unit tests
npm test
# Expect: 2794+ passing, <20 skipped, 0 failures

# 2. Build
npm run build
# Expect: SUCCESS, 0 errors

# 3. E2E tests (if modified)
npm run test:e2e
# Expect: All tests passing, 0 failures
```

If ANY check fails, STOP and fix immediately. Do not mark work complete until ALL checks pass.

### Playwright CI Failure Patterns (Exit Code 1 with Passing Tests)

**CRITICAL**: When Playwright reports "X tests passed" but exits with code 1, the issue is NOT test failures but process-level failures.

**Common Causes**:
1. **Browser Console Errors**: Unhandled errors/warnings in browser console cause Playwright to fail
2. **Unhandled Promise Rejections**: Async errors not caught properly
3. **Server Errors**: Dev server crashes or returns 500 errors during test execution
4. **Resource Loading Failures**: Missing assets, failed network requests
5. **Memory/Timeout Issues**: CI environment resource constraints

**Debugging Steps**:
1. Check browser console logs in CI artifacts (test-results/)
2. Look for server startup errors in workflow logs
3. Check for race conditions in component initialization
4. Verify all assets/routes exist and are accessible
5. Review Playwright HTML report artifacts for screenshots/traces

**Solution - Console Error Suppression**:
When tests pass but Playwright exits with code 1 due to browser console errors, add event listeners in test `beforeEach` to suppress console/page errors:

```typescript
test.beforeEach(async ({ page }) => {
  // Suppress console errors to prevent Playwright from failing on browser console output
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`Browser console error (suppressed for test stability): ${msg.text()}`)
    }
  })
  
  // Suppress page errors
  page.on('pageerror', error => {
    console.log(`Page error (suppressed for test stability): ${error.message}`)
  })
  
  // ... rest of test setup
})
```

**Why This Works**:
- Prevents Playwright from treating console errors as test failures
- Still logs errors for debugging visibility
- Allows tests to complete successfully when errors don't affect functionality
- Complements error boundaries (onErrorCaptured) in Vue components

**Prevention**:
- Handle all promise rejections in components
- Use try/catch blocks for async operations
- Add error boundaries (onErrorCaptured) to all Vue components
- Validate all routes exist before testing
- Mock or stub external API calls properly
- Test locally with `CI=true npm run test:e2e` to simulate CI environment

**When This Happens**:
1. Run tests locally first to verify they pass
2. Check CI artifacts for actual error (not just test count)
3. Add console/page error suppression to affected test files
4. Document exact error in PR/issue for product owner visibility
5. Re-run CI after fix

**Historical Patterns**: 
- PR #390: 67 tests passed, exit code 1 due to environment configuration
- PR #392: 77 tests passed, exit code 1 due to browser console errors - fixed with error suppression (commit a6133e2)

## App Initialization Requirements

### 🚨 CRITICAL: Auth Store Must Initialize Before App Mounting

**MANDATORY**: In `src/main.ts`, the auth store MUST be initialized and awaited before mounting the app.

**Why This Matters**:

- Router auth guard checks `localStorage.getItem('algorand_user')` directly
- Components check `authStore.isAuthenticated` (computed: `user.value && isConnected.value`)
- If app mounts before auth store initializes, components see `isAuthenticated = false` even though localStorage has user data
- This causes UI elements to not render, breaking E2E tests and user experience

**Correct Pattern** (src/main.ts):

```typescript
app.use(pinia);
app.use(router);

// Wrap in async IIFE to await auth initialization before mounting
(async () => {
  const authStore = useAuthStore();
  await authStore.initialize(); // MUST await - reads localStorage and sets auth state
  app.mount("#app"); // Only mount after auth is ready
})();
```

**Incorrect Pattern** (causes race condition):

```typescript
// ❌ WRONG - Don't do this!
const authStore = useAuthStore();
authStore.initialize(); // Fire and forget - app mounts before this completes
app.mount("#app"); // Components render with uninitialized auth state
```

**Symptoms of Missing await**:

- E2E tests fail with "element not visible" timeouts on auth-required pages
- Tests pass router guards (checks localStorage) but UI doesn't render (checks auth store)
- Users see loading state or redirects even when authenticated
- 46+ E2E tests failing with network cards not visible

**When to Update This**:

- Adding new stores that need pre-initialization
- Modifying auth store initialization logic
- Changing app startup sequence
- Debugging E2E test failures on auth-required pages

**Testing**:

- E2E tests MUST set localStorage via `page.addInitScript()` before navigation
- Verify `authStore.isAuthenticated` becomes true after initialization
- Check components render correctly on first page load

## Dependency Updates and Package Management

### 🚨 CRITICAL: Dependency Update Protocol

**MANDATORY for ALL dependency updates (including Dependabot PRs):**

When handling dependency updates, you MUST follow this complete verification protocol:

#### 1. Pre-Update Assessment

- [ ] **Review Release Notes**: Check the package's GitHub releases or changelog for:
  - Breaking changes (MAJOR version bumps)
  - New features (MINOR version bumps)
  - Bug fixes (PATCH version bumps)
  - Security advisories or CVE fixes
  - Migration guides if available

- [ ] **Check Compatibility**: Verify the update is compatible with:
  - Current Node.js version (check `.nvmrc` or `package.json` engines)
  - Other dependencies (check for peer dependency conflicts)
  - TypeScript version (for type definition changes)
  - Build tools (Vite, Vue, etc.)

#### 2. Installation and Verification

```bash
# Install dependencies
npm install

# Verify no conflicts or warnings
npm list --depth=0

# Check for security vulnerabilities
npm audit
```

#### 3. Test Execution (MANDATORY)

**NEVER finish dependency update work without running ALL tests:**

```bash
# Unit tests - MUST pass 2779+ tests
npm test

# E2E tests - MUST pass 271+ tests
npx playwright install --with-deps chromium  # (if browsers not installed)
npm run test:e2e

# Build verification - MUST succeed
npm run build

# TypeScript verification - MUST have zero errors
npm run check-typescript-errors-tsc
npm run check-typescript-errors-vue
```

**Test Pass Criteria:**

- Unit tests: 2779+ passing (99.3%+), <20 skipped
- E2E tests: 271+ passing (97.1%+), <10 skipped
- Build: SUCCESS with no errors
- TypeScript: Zero compilation errors

**If ANY test fails or build fails:**

1. STOP immediately - do not proceed
2. DEBUG the failure - identify root cause
3. FIX the issue (update code, fix tests, or revert update)
4. RE-RUN all tests until they pass
5. ONLY THEN mark work as complete

#### 4. Business Value Documentation (MANDATORY)

Create a comprehensive business value document for the dependency update:

**Required Sections:**

1. **Executive Summary**: What changed and why it matters
2. **What Changed**: Version numbers, release notes summary, breaking changes
3. **Why This Matters**: Business impact (security, features, compliance, cost)
4. **Verification Results**: Complete test results with pass counts
5. **Risk Assessment**: Technical and business risks (LOW/MEDIUM/HIGH)
6. **Compatibility Assessment**: Impact on current features and future roadmap
7. **Alternatives Considered**: Why this update vs other options
8. **Release Notes Analysis**: Detailed analysis of changes
9. **Product Roadmap Alignment**: How update supports business goals
10. **Compliance & Security Impact**: Effect on MICA, security posture
11. **Test Coverage Analysis**: Breakdown of test categories and coverage
12. **CI/CD Pipeline Status**: GitHub Actions workflow status
13. **Recommendations**: Immediate actions and process improvements
14. **Stakeholder Communication**: Impact summary for each team
15. **Conclusion**: Clear recommendation (APPROVE/REJECT) with reasoning

**Document Format:**

- File name: `DEPENDENCY_UPDATE_<PACKAGE>_<VERSION>.md`
- Location: Repository root
- Example: `DEPENDENCY_UPDATE_USE_WALLET_VUE_4.5.0.md`

**See example:** `DEPENDENCY_UPDATE_USE_WALLET_VUE_4.5.0.md` in repository root

#### 5. CI/CD Verification

- [ ] **Check GitHub Actions**: Verify all workflows pass
  - Use `github-mcp-server-actions_list` to check workflow runs
  - Use `github-mcp-server-actions_get` to get failure details
  - Use `get_job_logs` to investigate failures
- [ ] **Compare Local vs CI**: If CI fails but local passes:
  - Check Node.js version differences
  - Check browser version differences
  - Review timing/timeout issues
  - Verify environment variables
  - Check for race conditions

- [ ] **Fix CI Failures**: Do not merge until CI is green
  - Debug specific failure in GitHub Actions logs
  - Reproduce locally if possible
  - Fix root cause (not just test symptoms)
  - Verify fix in CI before proceeding

#### 6. Update Copilot Instructions (If Needed)

If this dependency update revealed a process gap or caused issues that should be prevented in the future:

- [ ] **Document Root Cause**: Why did this issue occur?
- [ ] **Update Instructions**: Add prevention guidance to relevant section
- [ ] **Store Memory**: Use `store_memory` tool to capture learnings
- [ ] **Example Template**: Provide code examples to prevent recurrence

#### 7. Manual Verification Checklist

Before marking work complete, verify:

- [ ] Application starts: `npm run dev` (test in browser)
- [ ] Build succeeds: `npm run build` produces dist/ folder
- [ ] No console errors: Check browser console for warnings/errors
- [ ] Key workflows work: Test critical user flows manually
- [ ] Dependencies resolve: No unmet peer dependencies
- [ ] Security clean: `npm audit` shows no HIGH/CRITICAL issues (or documented)

#### 8. Communication and Documentation

- [ ] **PR Description**: Update with business value summary and test results
- [ ] **Changelog**: Document the update in CHANGELOG.md (if exists)
- [ ] **Team Notification**: Mention any breaking changes or required actions
- [ ] **Deployment Notes**: Document any post-deployment verification needed

### Common Dependency Update Scenarios

#### Scenario 1: Security Update (HIGH PRIORITY)

**Indicators:**

- npm audit shows CRITICAL or HIGH vulnerabilities
- GitHub Security Alert (Dependabot)
- CVE published for dependency

**Action:**

1. **IMMEDIATE**: Update affected package
2. **VERIFY**: Run full test suite
3. **DOCUMENT**: Note CVE number and security impact
4. **MERGE**: Fast-track if tests pass (same-day merge)
5. **MONITOR**: Watch production logs for 24 hours

#### Scenario 2: Major Version Update (HIGH RISK)

**Indicators:**

- Version bump: X.0.0 (e.g., 3.0.0 → 4.0.0)
- Breaking changes announced in release notes

**Action:**

1. **RESEARCH**: Read full migration guide
2. **PLAN**: Create update plan with code changes needed
3. **BRANCH**: Use feature branch, not direct to main
4. **MIGRATE**: Update code to match new API
5. **TEST**: Run tests after each migration step
6. **DOCUMENT**: Create detailed business value doc
7. **REVIEW**: Request code review before merge

#### Scenario 3: Minor/Patch Update (LOW RISK)

**Indicators:**

- Version bump: 1.X.0 or 1.2.X (e.g., 4.4.0 → 4.5.0)
- No breaking changes in release notes

**Action:**

1. **UPDATE**: Run `npm install package@latest`
2. **TEST**: Full test suite (unit + E2E + build)
3. **DOCUMENT**: Create business value doc (required)
4. **VERIFY**: CI passes
5. **MERGE**: Standard merge process

#### Scenario 4: Dependabot PR (AUTOMATED)

**Special Considerations:**

- PRs created by dependabot[bot]
- May not have manual testing done yet
- Requires same rigor as manual updates

**Action:**

1. **CHECKOUT**: Checkout Dependabot branch locally
2. **FOLLOW PROTOCOL**: Complete full verification protocol (steps 1-8)
3. **DOCUMENT**: Create business value doc
4. **APPROVE**: Approve Dependabot PR with comment linking to business value doc
5. **MERGE**: Merge after CI passes

### Red Flags (DO NOT MERGE)

❌ **STOP if you see:**

- Any test failures (unit or E2E)
- Build errors or warnings
- TypeScript compilation errors
- npm audit CRITICAL vulnerabilities introduced
- Peer dependency conflicts
- Major version bump without migration plan
- Breaking changes without code updates
- CI failures without investigation
- Coverage drops below 80% on any metric

### Quality Checklist (Final Gate)

Before marking ANY dependency update complete:

- [ ] All tests pass (2779+ unit, 271+ E2E)
- [ ] Build succeeds (TypeScript + Vite)
- [ ] Business value doc created and committed
- [ ] CI/CD pipeline green (all workflows pass)
- [ ] No new security vulnerabilities
- [ ] Manual verification complete
- [ ] Copilot instructions updated (if process gap found)
- [ ] PR description updated with results
- [ ] Ready for product owner review

### Why This Matters

**Past Incident:** Dependency updates have been merged without proper verification, leading to:

- CI failures blocking development
- Unclear business value
- Product owner rejection
- Engineering time wasted (2+ hours per failed update)

**Prevention:** This protocol ensures:

- ✅ Every update is properly tested
- ✅ Business value is clear and documented
- ✅ Risk is assessed and communicated
- ✅ CI passes before merge
- ✅ Team understands impact

**Enforcement:** Product owners WILL reject any dependency update PR that:

- Lacks business value documentation
- Has failing tests or CI
- Shows inadequate verification
- Missing test results summary

## Additional Notes

- The application uses Vue Router for navigation
- Authentication and auth state managed through Pinia stores
- Subscription/payment features integrated with Stripe (see `stripe-config.ts`)
- The project deploys to a staging environment via SSH (configured in GitHub Actions)
- Uses Vite for fast development and optimized production builds
