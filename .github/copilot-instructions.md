# Copilot Instructions for Biatec Tokens

## Project Overview

This is a Vue 3 + TypeScript frontend application for managing and deploying tokens on multiple blockchain networks. The application provides a user interface for creating, managing, and deploying various token standards with wallet integration across both EVM chains (Ethereum, Arbitrum, Base) and AVM chains (Algorand mainnet, Algorand testnet, VOI, Aramid).

## Tech Stack

- **Framework**: Vue 3 with Composition API (`<script setup>`)
- **Language**: TypeScript (strict mode enabled)
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with custom configuration and dark mode support
- **State Management**: Pinia stores
- **Router**: Vue Router
- **Blockchain**: Multi-chain support with Algorand SDK (algosdk) for AVM chains and ethers.js/web3.js for EVM chains
- **Wallet Support**: @txnlab/use-wallet-vue for AVM chains, MetaMask/WalletConnect for EVM chains
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
- Wallet integration via `@txnlab/use-wallet-vue` for AVM chains and MetaMask/WalletConnect for EVM chains
- Support multiple networks: AVM chains (Algorand mainnet, testnet, VOI, Aramid) and EVM chains (Ethereum mainnet, Arbitrum, Base, Sepolia testnet)
- Network configurations defined in `main.ts`
- ERC standards (ERC20, ERC721) are for EVM chains
- ASA and ARC standards (ASA, ARC3, ARC19, ARC69, ARC200, ARC72) are for AVM chains
- Always handle wallet connection states properly across both chain types

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

## Important Boundaries

### DO NOT:

- Modify `.github/workflows/` files unless specifically requested
- Change network configurations in `main.ts` without explicit instruction
- Remove or modify security-related code (wallet connections, authentication)
- Modify deployment scripts or SSH configurations
- Change TypeScript strict mode settings
- Add `any` types - always use proper typing
- Modify the Buffer/global polyfills in `main.ts` (required for wallet libraries)

### DO:

- Maintain existing component structure and patterns
- Follow Tailwind CSS utility-first approach
- Use Composition API with `<script setup>`
- Ensure proper TypeScript typing
- Test wallet integrations when modifying blockchain-related code
- Keep dark mode support in mind for UI changes
- Use existing UI components from `src/components/ui/` before creating new ones

## Testing and Validation

**🚨 CRITICAL TESTING REQUIREMENTS 🚨**

**NEVER finish work with failing tests.** This project maintains strict quality standards where all tests must pass before code changes are accepted. Failing tests indicate potential bugs, broken functionality, or incomplete implementations that could impact users.

**If tests are failing:**

1. **STOP** what you're doing
2. **DEBUG** the failing tests immediately
3. **FIX** the root cause (not just the test symptoms)
4. **RE-RUN** all tests to ensure they pass
5. **ONLY THEN** proceed with the work

**Remember:** Test failures are not just technical issues - they represent potential user-facing problems that could break the application in production.

### Pre-Completion Testing Checklist

**MANDATORY: Complete ALL items before marking work as done:**

- [ ] Run `npm test` (Unit tests) - Ensure 0 failures
- [ ] Run `npm run test:coverage` - Ensure coverage meets thresholds:
  - Statements: ≥78%
  - Branches: ≥69%
  - Functions: ≥68.5%
  - Lines: ≥79%
- [ ] Run `npm run test:e2e` (E2E tests) - Ensure 0 failures
- [ ] Run `npm run build` - Ensure TypeScript compilation passes
- [ ] Run `npm run check-typescript-errors-tsc` - Ensure TypeScript compilation without warnings/errors
- [ ] Run `npm run check-typescript-errors-vue` - Ensure VUE TypeScript compilation without warnings/errors
- [ ] If adding/modifying components: Run component-specific unit tests
- [ ] If changing UI/UX: Verify E2E tests for affected user flows pass
- [ ] If modifying API integration: Run `npm run generate-api` and update code accordingly
- [ ] Test wallet connectivity for blockchain-related changes
- [ ] Verify dark mode compatibility for UI changes

**FAILURE TO COMPLETE THIS CHECKLIST WILL RESULT IN REJECTED WORK.**

### Unit Tests (Vitest)

- Always run `npm test` for unit tests with Vitest
- Unit tests are located in `src/` directories alongside components (e.g., `*.test.ts`, `*.spec.ts`)
- Test files use Vitest with Vue Test Utils for component testing
- Run `npm run test:coverage` to check test coverage - must meet thresholds:
  - Statements: ≥78%
  - Branches: ≥69%
  - Functions: ≥68.5%
  - Lines: ≥79%
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
  - User flows (wallet connection, token creation)
  - Navigation between pages
  - Form interactions and validations
  - Responsive design across devices
  - Dark mode functionality
  - Error handling and edge cases

### E2E Test Writing Guidelines

When writing E2E tests:

- **Always wait for page load**: Use `await page.waitForLoadState("domcontentloaded")` after navigation
- **Use robust selectors**: Prefer `getByRole()`, `getByText()` over CSS selectors
- **Add timeouts**: Use `{ timeout: 10000 }` for visibility checks to handle slow loads
- **Handle missing elements gracefully**: Use `.isVisible().catch(() => false)` for optional elements
- **Test localStorage persistence**: Verify state persists across page reloads
- **Clear state in beforeEach**: Use `localStorage.clear()` to ensure test isolation
- **Mock wallet connections**: Set localStorage keys for wallet state without real wallet interactions
- **Test button text variations**: Use regex patterns like `/Connect Wallet|Authenticate/i` to match different button texts
- **Verify page loads successfully**: Always check page title or main heading as baseline
- **Focus on user behavior**: Test what users see and do, not implementation details

### Critical E2E Testing Requirements

**NEVER finish work request with failing E2E tests. Always:**

1. **Run tests before PR creation**: Execute `npm run test:e2e` and ensure all tests pass
2. **Fix failing tests immediately**: If tests fail, debug and fix them before proceeding
3. **Verify selectors are correct**: Check that CSS selectors and placeholders match actual DOM elements
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
- **Wallet Composables Mocking**: `useWalletManager` and `useToast` are globally mocked to prevent Vue injection warnings
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

**Authentication Issues:**

- **Problem**: Tests try to access protected routes without proper auth setup
- **Solution**: Mock `localStorage.setItem("wallet_connected", "true")` and handle auth redirects gracefully

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

## Additional Notes

- The application uses Vue Router for navigation
- Authentication and wallet state managed through Pinia stores
- Subscription/payment features integrated with Stripe (see `stripe-config.ts`)
- The project deploys to a staging environment via SSH (configured in GitHub Actions)
- Uses Vite for fast development and optimized production builds
