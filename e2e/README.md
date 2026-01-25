# End-to-End Tests with Playwright

This directory contains Playwright end-to-end tests for the Biatec Tokens application.

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

- `wallet-connection.spec.ts` - Tests for wallet connection flow and authentication
- `enhanced-ux.spec.ts` - Tests for enhanced UX features (network selection, error handling, responsive design)

## Writing Tests

### Best Practices

1. **Use Page Object Model** for complex pages
2. **Wait for elements** properly using `expect().toBeVisible()`
3. **Use semantic selectors** like `getByRole()`, `getByText()`
4. **Test user behavior**, not implementation details
5. **Keep tests independent** - each test should be able to run standalone
6. **Use descriptive test names** that explain what is being tested

### Example Test

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
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

1. **Authentication Flow**
   - Opening authentication modal
   - Displaying wallet options
   - Closing modal
   - Wallet connection (mocked)

2. **Navigation**
   - Page navigation
   - Route changes
   - Back button behavior

3. **Network Selection**
   - Network indicator display
   - Status indicators
   - Network switching

4. **Error Handling**
   - API connection errors
   - Graceful degradation
   - User feedback

5. **Responsive Design**
   - Mobile viewports
   - Tablet viewports
   - Desktop viewports

6. **Accessibility**
   - Semantic HTML
   - ARIA labels
   - Keyboard navigation

## Adding New Tests

When adding new features:

1. Create a new test file in `e2e/` directory
2. Name it `feature-name.spec.ts`
3. Follow existing patterns and best practices
4. Test critical user paths
5. Include negative test cases (error scenarios)
6. Test responsive behavior if UI changes
7. Update this README if adding new test categories

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
3. Avoid hard-coded `page.waitForTimeout()`
4. Use retry logic for assertions

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)
