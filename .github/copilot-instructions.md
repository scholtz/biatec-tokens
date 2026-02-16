# Copilot Instructions for Biatec Tokens

## 🚨 ABSOLUTE PRIORITY: TESTING COMPLIANCE 🚨

**CRITICAL ENFORCEMENT:** Under NO circumstances shall any work be completed with failing tests or insufficient test coverage. Previous violations have resulted in production bugs and must never recur.

- **IMMEDIATE ACTION REQUIRED:** If any test fails or coverage drops below thresholds (see Testing section for exact values), STOP ALL WORK and fix immediately.
- **ZERO TOLERANCE:** Failing tests block all progress. Coverage below thresholds blocks completion.
- **VERIFICATION MANDATORY:** Run full test suite and coverage check before ANY code changes and after EVERY change.
- **NEW CODE STANDARDS:** Aim for 70%+ branch coverage on all new code. The project threshold (68.5%) accounts for legacy technical debt.

**PAST VIOLATIONS:** Copilot has previously finished work with failing tests and reduced coverage, violating these instructions. This has introduced bugs and reduced quality. This MUST NOT happen again.

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
- [ ] **No Regressions**: All existing tests still pass
- [ ] **ALL CI Checks Green**: Every required check must pass, including pre-existing test suites
- [ ] **Accessibility Check**: WCAG 2.1 AA baseline (labels, contrast, keyboard)

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

### 8. Feature Accessibility (MANDATORY FOR NEW ROUTES)
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

---

## FAILURE TO MEET REQUIREMENTS = IMMEDIATE REJECTION

**Product Owner will reject ANY PR that lacks:**
1. Comprehensive test coverage (unit + E2E + testing matrix doc)
2. Implementation summary with business value
3. Manual verification checklist
4. Acceptance criteria mapping with test evidence
5. All tests passing locally with exact counts
6. Build success verification

**When Product Owner rejects for quality, you MUST:**
1. Create detailed testing matrix document
2. Add missing unit/E2E tests until minimums met
3. Document business value and risk controls
4. Provide test execution evidence (counts, duration)
5. Map every acceptance criterion to tests
6. Re-request review with ALL evidence attached

**QUALITY DOCUMENTATION REQUIREMENTS:** Every significant feature MUST include a comprehensive testing matrix document that details:
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
   - ✅ GOOD: Wait for networkidle + explicit timeout + long visibility checks
   
2. **E2E Test Pattern**:
```typescript
// Good: Wait for async data properly
test('should display element', async ({ page }) => {
  await page.goto('/route');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500); // Let mock data load (500-800ms typical)
  
  const element = page.getByRole('button', { name: /Action/i });
  await expect(element).toBeVisible({ timeout: 15000 }); // Long timeout for CI
});

// Bad: Check immediately (flaky in CI)
test('should display element', async ({ page }) => {
  await page.goto('/route');
  await page.waitForLoadState('networkidle');
  const element = page.getByRole('button', { name: /Action/i });
  await expect(element).toBeVisible(); // May fail if data still loading!
});
```

3. **Auth-Dependent Routes** (CRITICAL for CI): Routes requiring authentication need EXTRA time in CI
   - Auth store initializes async in main.ts → component mounts → renders (5-10 seconds in CI)
   - ❌ BAD: 3s wait, 20s timeouts (fails in CI but passes locally)
   - ⚠️ PARTIAL: 5s wait, 30s timeouts (may still fail in CI for complex flows)
   - ✅ GOOD: 10s wait, 45s timeouts (passes reliably in CI and locally)
   
```typescript
// Pattern for auth-dependent routes (e.g., /launch/guided, /compliance/*, /tokens/*)
test('should display auth-required page', async ({ page }) => {
  await page.goto('/launch/guided');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(10000); // CI needs EXTRA time for auth store init + mount + render
  
  // Wait for SPECIFIC element that proves page loaded
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

**Product Owner Requirement**: E2E tests must pass in CI. If tests are flaky due to timing, fix the waits - never skip or disable tests.

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
