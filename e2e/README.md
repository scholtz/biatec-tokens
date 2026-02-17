# End-to-End Tests with Playwright

This directory contains Playwright end-to-end tests for the Biatec Tokens application.

## Authentication Model

**Email/Password Only - No Wallet Connectors**

This application uses an **auth-first** approach with email and password authentication. There are no wallet connectors (MetaMask, WalletConnect, Pera, Defly, etc.) in the MVP user experience.

All tests should reflect this authentication model:
- Use `localStorage.setItem('algorand_user', ...)` to simulate authenticated sessions
- Test routes with `requiresAuth: true` meta flag
- Verify auth-first redirects for unauthenticated users
- Ensure no wallet-related UI elements appear in navigation

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

## Test Structure

Tests are organized by feature:

- `auth-first-token-creation.spec.ts` - Auth-first journey and route guards (MVP critical)
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

**Legacy Tests (Deprecated):**
- `token-utility-recommendations.spec.ts` - Uses legacy `/create/wizard` path (skipped)
- `token-wizard-whitelist.spec.ts` - Uses legacy `/create/wizard` path (skipped)

**Note:** Tests using `/create/wizard` are deprecated in favor of `/launch/guided` which is the supported auth-first token creation flow.

## Writing Tests

### Best Practices

1. **Use Auth-First Pattern** - Set up localStorage auth before testing protected routes
2. **Wait for elements** properly using `expect().toBeVisible()`
3. **Use semantic selectors** like `getByRole()`, `getByText()`
4. **Test user behavior**, not implementation details
5. **Keep tests independent** - each test should be able to run standalone
6. **Use descriptive test names** that explain what is being tested
7. **Avoid hard-coded timeouts** - use `waitForLoadState()` and visibility checks instead
8. **Test auth-first routing** - verify unauthenticated users are redirected appropriately

### Example Test - Auth-First Pattern

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Set up authenticated session
    await page.addInitScript(() => {
      localStorage.setItem('algorand_user', JSON.stringify({
        address: 'TEST_ADDRESS',
        email: 'test@example.com',
        isConnected: true,
      }))
    });
    
    await page.goto('/protected-route');
    await page.waitForLoadState('networkidle');
  });

  test('should do something', async ({ page }) => {
    // Arrange
    const button = page.getByRole('button', { name: /Click Me/i });
    
    // Act
    await button.click();
    
    // Assert
    await expect(page.getByText(/Success/i)).toBeVisible();
  });
});
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
