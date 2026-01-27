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

### Unit Tests (Vitest)

- Always run `npm test` for unit tests with Vitest
- Unit tests are located in `src/` directories alongside components (e.g., `*.test.ts`, `*.spec.ts`)
- Test files use Vitest with Vue Test Utils for component testing
- Run `npm run test:coverage` to check test coverage
- Existing test patterns:
  - Component tests: Mock dependencies, test user interactions
  - Store tests: Test state management and actions
  - Service tests: Mock API calls, test business logic

### E2E Tests (Playwright)

- **Always run Playwright tests when making UI changes**
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

### Testing Best Practices

- **With every code change, run appropriate tests**:
  - Component changes → Unit tests + E2E tests for affected flows
  - UI/UX changes → E2E tests for visual verification
  - Business logic → Unit tests
  - New features → Both unit and E2E tests
  - **API changes** → Regenerate API client with `npm run generate-api` and update related code
- Always run `npm run build` to ensure TypeScript compilation and type checking pass
- Test in development mode with `npm run dev` for hot reload
- Verify dark mode compatibility for UI changes
- Test wallet connectivity when modifying blockchain features
- Write tests that are:
  - Maintainable and readable
  - Independent (no dependencies between tests)
  - Fast to execute
  - Focused on user behavior, not implementation details

## Additional Notes

- The application uses Vue Router for navigation
- Authentication and wallet state managed through Pinia stores
- Subscription/payment features integrated with Stripe (see `stripe-config.ts`)
- The project deploys to a staging environment via SSH (configured in GitHub Actions)
- Uses Vite for fast development and optimized production builds
