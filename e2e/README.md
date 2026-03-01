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

### Backend Auth Readiness

Current E2E tests seed localStorage because the test environment has no live backend. When the backend auth endpoint is available in CI, replace `withAuth()` with `loginWithBackend()` (defined in helpers/auth.ts as a stub). The session contract and all E2E assertions remain identical.

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

**Redirect compatibility is tested separately** in `confidence-hardening-deterministic.spec.ts` and `auth-first-onboarding-closure.spec.ts`.

## Test Structure

Tests are organized by feature:

- `auth-first-token-creation.spec.ts` - Auth-first journey and route guards (MVP critical)
- `confidence-hardening-deterministic.spec.ts` - Deterministic auth/nav state assertions (MVP CI gate)
- `auth-first-confidence-hardening.spec.ts` - Auth-first onboarding confidence (all entry points)
- `auth-first-issuance-workspace.spec.ts` - Canonical issuance workspace e2e flow
- `arc76-validation.spec.ts` - ARC76 account derivation and session persistence
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

Playwright tests run automatically in CI/CD pipelines. Make sure to:

1. Install dependencies: `npm ci`
2. Install Playwright browsers: `npx playwright install --with-deps`
3. Run tests: `npm run test:e2e`

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
2. Use `page.waitForLoadState('networkidle')`
3. Avoid hard-coded `page.waitForTimeout()` where possible
4. Use retry logic for assertions
5. For auth-required routes in CI, increase initial wait to 10000ms
6. Use generous visibility timeouts (45000ms) for CI environments

### Auth Store Initialization in CI

Auth-required routes need extra time in CI:
- Auth store initializes async in main.ts
- Component then mounts and renders
- Total CI time: 5-10 seconds minimum
- Use pattern: `await page.waitForTimeout(10000)` after navigation
- Then check for specific visible element with 45000ms timeout

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)
