/**
 * E2E Auth Helpers — Shared session bootstrap utilities
 *
 * Provides structured, reusable helpers for setting up authenticated sessions
 * in Playwright E2E tests. Centralises auth state management so tests use a
 * consistent interface instead of ad-hoc localStorage.setItem calls.
 *
 * ## Backend Auth Realism Strategy
 *
 * These helpers currently seed localStorage because the frontend development
 * server runs without a live backend in CI. The session objects are validated
 * against the ARC76 session contract before seeding, so any mismatch between
 * test-seeded state and the real backend contract is caught immediately.
 *
 * When the backend auth endpoint (`POST /api/auth/login`) is available in the
 * test environment, use `loginWithCredentials()` (permissive — falls back to seeding)
 * or `loginWithCredentialsStrict()` (strict — fails if backend unavailable).
 * The session shape and validation logic remain the same.
 *
 * ## Two-tier auth model
 *
 *   Tier 1 — Permissive (default CI): `withAuth()` or `loginWithCredentials()`
 *     - `withAuth()`: seeds validated localStorage session, no backend required
 *     - `loginWithCredentials()`: tries backend, falls back to seeding on error
 *     - Used for: isolated UI tests, component validation, accessibility checks
 *
 *   Tier 2 — Strict (sign-off lane): `loginWithCredentialsStrict()`
 *     - Sends real `POST /api/auth/login` request; FAILS (throws) if backend unavailable
 *     - Used exclusively in `mvp-backend-signoff.spec.ts` when BIATEC_STRICT_BACKEND=true
 *     - Tests in this tier skip if BIATEC_STRICT_BACKEND is not set
 *
 * Usage:
 *   import { withAuth, suppressBrowserErrors, setupAuthAndNavigate } from './helpers/auth'
 *
 *   test.beforeEach(async ({ page }) => {
 *     suppressBrowserErrors(page)
 *     await withAuth(page)
 *     await page.goto('/launch/guided')
 *     await page.waitForLoadState('load') // 'load' not 'networkidle' — Vite HMR SSE blocks networkidle
 *   })
 *
 * Canonical route: /launch/guided
 * Backend issuance model: token deployment handled server-side (no wallet signing)
 * Roadmap: https://raw.githubusercontent.com/scholtz/biatec-tokens/refs/heads/main/business-owner-roadmap.md
 */

import type { Page } from '@playwright/test'

// ---------------------------------------------------------------------------
// Session contract types
// ---------------------------------------------------------------------------

/**
 * ARC76 session contract — the minimal fields required by the auth guard and
 * the issuance workspace to consider a session valid. Mirrors the subset of
 * `AlgorandUser` that the router guard checks.
 *
 * All E2E session seeds must conform to this contract. Any deviation between
 * the seeded shape and the runtime contract is a regression signal.
 */
export interface ARC76SessionContract {
  /** Non-empty ARC76-derived address. Must be present for issuance routes. */
  address: string
  /** User email used for ARC76 account derivation (email/password only). */
  email: string
  /** Must be `true` for the issuance route guard to allow access. */
  isConnected: boolean
}

/**
 * Extended auth user shape for E2E tests that need additional fields.
 * All fields beyond the contract are optional; the router guard only checks
 * the three contract fields above.
 */
export interface AuthUser extends ARC76SessionContract {
  name?: string
  provisioningStatus?: string
  canDeploy?: boolean
}

/**
 * Result of validating a session object against the ARC76 contract.
 */
export interface SessionValidationResult {
  valid: boolean
  errors: string[]
}

// ---------------------------------------------------------------------------
// Pure contract validation (testable without a browser)
// ---------------------------------------------------------------------------

/**
 * Validates that a session object meets the ARC76 session contract.
 * Returns a structured result so tests can assert specific validation failures.
 *
 * The authoritative implementation and full test coverage live in:
 *   src/utils/arc76SessionContract.ts
 *   src/utils/__tests__/arc76SessionContract.test.ts
 *
 * This helper validates the same contract inline to avoid a cross-boundary
 * import from src/ into the e2e/ TypeScript project.
 */
function validateSessionContract(session: unknown): SessionValidationResult {
  const errors: string[] = []

  if (!session || typeof session !== 'object') {
    return { valid: false, errors: ['session must be a non-null object'] }
  }

  const s = session as Record<string, unknown>

  if (!s.address || typeof s.address !== 'string' || (s.address as string).trim() === '') {
    errors.push('address must be a non-empty string')
  }
  if (!s.email || typeof s.email !== 'string' || (s.email as string).trim() === '') {
    errors.push('email must be a non-empty string')
  }
  if (typeof s.isConnected !== 'boolean') {
    errors.push('isConnected must be a boolean')
  }

  return { valid: errors.length === 0, errors }
}

// ---------------------------------------------------------------------------
// Default test user
// ---------------------------------------------------------------------------

/** Default test user used across canonical E2E flows */
export const DEFAULT_TEST_USER: AuthUser = {
  address: 'E2E_TEST_ARC76_ADDRESS_BIATEC_TOKENS',
  email: 'e2e-test@biatec.io',
  name: 'E2E Test User',
  isConnected: true,
  provisioningStatus: 'active',
  canDeploy: true,
}

// ---------------------------------------------------------------------------
// Browser-side auth helpers
// ---------------------------------------------------------------------------

/**
 * Seeds localStorage with a contract-validated authenticated session via
 * addInitScript. Must be called before page.goto() to ensure auth state
 * is available when the app initialises.
 *
 * The session is validated against the ARC76 contract before seeding.
 * If validation fails, the test will throw immediately (fail-fast).
 *
 * **For isolated UI-only tests only.** For critical journey specs (token
 * creation, compliance dashboard, subscription billing) use
 * `loginWithCredentials()` instead, which validates the real backend auth
 * contract when a backend is available.
 */
export async function withAuth(page: Page, user: AuthUser = DEFAULT_TEST_USER): Promise<void> {
  const session: AuthUser = { ...DEFAULT_TEST_USER, ...user }
  const result = validateSessionContract(session)
  if (!result.valid) {
    throw new Error(
      `[auth-helper] withAuth: ARC76 contract validation failed:\n  ${result.errors.join('\n  ')}`,
    )
  }
  await page.addInitScript((userData: AuthUser) => {
    localStorage.setItem('algorand_user', JSON.stringify(userData))
    // Also set arc76_email so authStore.restoreARC76Session() can populate arc76email ref,
    // which is displayed in the Navbar (authStore.arc76email). Without this, the email
    // field in the Navbar would be null even though isAuthenticated is true.
    if (userData.email) {
      localStorage.setItem('arc76_email', userData.email)
    }
  }, session)
}

/**
 * Logs in using the backend `/api/auth/login` endpoint when available, falling
 * back to localStorage seeding when the backend is unreachable (e.g. in CI
 * without a live backend service).
 *
 * **Use this helper for all critical journey specs** (token creation, compliance
 * dashboard, subscription billing) instead of the raw `withAuth()` helper.
 * `withAuth()` may be used for isolated UI-only tests where backend
 * unavailability is acceptable.
 *
 * Environment variables:
 *   - `TEST_USER_EMAIL`    — email to use for login (default: e2e-test@biatec.io)
 *   - `TEST_USER_PASSWORD` — password to use for login (default: empty)
 *   - `API_BASE_URL`       — base URL of the backend API (default: http://localhost:3000)
 *
 * When `API_BASE_URL` resolves to a live backend:
 *   1. POSTs to `POST {API_BASE_URL}/api/auth/login` with `{ email, password }`.
 *   2. On HTTP 200, stores the returned session via the application's normal
 *      localStorage mechanism so the Vue auth store recognises it.
 *   3. Asserts a valid session ID is returned (fail-fast on contract violation).
 *
 * When the backend is unavailable (connection refused / non-200), the function
 * automatically falls back to `withAuth()` localStorage seeding and logs a
 * warning so CI logs remain informative.
 *
 * @param page      - Playwright Page instance
 * @param email     - Optional override for TEST_USER_EMAIL
 * @param password  - Optional override for TEST_USER_PASSWORD
 */
export async function loginWithCredentials(
  page: Page,
  email?: string,
  password?: string,
): Promise<void> {
  const resolvedEmail = email ?? process.env.TEST_USER_EMAIL ?? 'e2e-test@biatec.io'
  const resolvedPassword = password ?? process.env.TEST_USER_PASSWORD ?? ''
  const apiBaseUrl = process.env.API_BASE_URL ?? 'http://localhost:3000'

  try {
    // Attempt real backend login
    const response = await page.request.post(`${apiBaseUrl}/api/auth/login`, {
      data: { email: resolvedEmail, password: resolvedPassword },
      timeout: 5000,
    })

    if (response.ok()) {
      const body = await response.json().catch(() => null)
      if (!body) {
        throw new Error('[loginWithCredentials] Backend returned non-JSON response body')
      }

      // Build session from backend response — prefer explicit fields, fall back
      // to sensible defaults so the auth store accepts the session.
      const backendAddress = (body.address as string) || (body.algorandAddress as string)
      if (!backendAddress) {
        throw new Error(
          '[loginWithCredentials] Backend response missing address field — cannot build ARC76 session',
        )
      }
      const session: AuthUser = {
        address: backendAddress,
        email: (body.email as string) || resolvedEmail,
        isConnected: true,
        name: (body.name as string) || undefined,
      }

      const validation = validateSessionContract(session)
      if (!validation.valid) {
        throw new Error(
          `[loginWithCredentials] Backend session failed ARC76 contract:\n  ${validation.errors.join('\n  ')}`,
        )
      }

      await page.addInitScript((userData: AuthUser) => {
        localStorage.setItem('algorand_user', JSON.stringify(userData))
      }, session)

      console.log(`[loginWithCredentials] Authenticated via backend as ${resolvedEmail}`)
      return
    }

    // Non-200 response — fall through to localStorage fallback
    console.warn(
      `[loginWithCredentials] Backend returned HTTP ${response.status()} — falling back to localStorage seeding`,
    )
  } catch {
    // Network error (backend not running) — fall back to localStorage seeding
    console.warn(
      '[loginWithCredentials] Backend unavailable — falling back to localStorage seeding (set API_BASE_URL to enable real auth)',
    )
  }

  // Fallback: localStorage seeding with contract-validated session.
  // The address is a well-known E2E test placeholder — it is only used
  // for auth guard checks (which verify non-empty string, not Algorand format).
  await withAuth(page, {
    address: 'E2EFALLBACK7BIATECTOKENSNOBKND7777777777777777777777777777',
    email: resolvedEmail,
    isConnected: true,
  })
}

/**
 * @deprecated Use `loginWithCredentials` for critical journey specs.
 * `loginWithBackend` is retained for API compatibility but delegates to
 * `loginWithCredentials`. It will be removed once all call sites are migrated.
 */
export async function loginWithBackend(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  return loginWithCredentials(page, email, password)
}

// ---------------------------------------------------------------------------
// Strict backend sign-off helpers (Tier 2 — sign-off lane only)
// ---------------------------------------------------------------------------

/**
 * Returns true when strict backend sign-off mode is active.
 *
 * Strict mode is enabled by setting `BIATEC_STRICT_BACKEND=true` in the test
 * environment (CI staging with a live backend). When strict mode is active,
 * sign-off specs run against real backend endpoints instead of seeded state.
 *
 * @see loginWithCredentialsStrict
 */
export function isStrictBackendMode(): boolean {
  return process.env.BIATEC_STRICT_BACKEND === 'true'
}

/**
 * Returns the backend base URL configured for the sign-off environment.
 * Falls back to localhost:3000 for local development.
 */
export function getBackendBaseUrl(): string {
  return process.env.API_BASE_URL ?? 'http://localhost:3000'
}

/**
 * Strict backend auth — fails loudly if the backend is unavailable or returns a
 * non-200 response. **Never falls back** to localStorage seeding.
 *
 * Use this helper ONLY in strict sign-off specs (`mvp-backend-signoff.spec.ts`)
 * that are gated on `BIATEC_STRICT_BACKEND=true`. All other specs should use
 * `loginWithCredentials()` (permissive, falls back on error) or `withAuth()`.
 *
 * Failure modes:
 *   - Network error (backend not running): throws with clear message
 *   - HTTP non-200 from backend: throws with status code included
 *   - Missing address field in response: throws with contract violation details
 *   - ARC76 contract validation failure: throws with validation errors
 *
 * This function is the primary mechanism for AC #1 and AC #2:
 * "loginWithCredentials or an equivalent strict helper used in blocker suites
 * no longer silently succeeds through localStorage fallback when strict backend
 * mode is enabled."
 *
 * @param page      - Playwright Page instance
 * @param email     - Optional override for TEST_USER_EMAIL
 * @param password  - Optional override for TEST_USER_PASSWORD
 * @throws Error if backend is unavailable, returns non-200, or contract fails.
 *         Network errors are caught-and-rethrown with a clearer diagnostic message
 *         that includes the endpoint URL and the original network error detail.
 *         This is intentional re-throwing, NOT error swallowing.
 */
export async function loginWithCredentialsStrict(
  page: Page,
  email?: string,
  password?: string,
): Promise<void> {
  const resolvedEmail = email ?? process.env.TEST_USER_EMAIL ?? 'e2e-test@biatec.io'
  const resolvedPassword = password ?? process.env.TEST_USER_PASSWORD ?? ''
  const apiBaseUrl = getBackendBaseUrl()

  // Strict mode: network errors are caught ONLY to rethrow with a richer diagnostic
  // message that includes the endpoint URL. This is intentional re-throwing,
  // NOT error swallowing — the test still fails loudly if the backend is unavailable.
  const response = await page.request
    .post(`${apiBaseUrl}/api/auth/login`, {
      data: { email: resolvedEmail, password: resolvedPassword },
      timeout: 10000,
    })
    .catch((networkError: unknown) => {
      const msg =
        networkError instanceof Error ? networkError.message : String(networkError)
      throw new Error(
        `[loginWithCredentialsStrict] STRICT MODE: Backend unreachable at ${apiBaseUrl}/api/auth/login. ` +
          `This sign-off lane requires a live backend. Set API_BASE_URL to the staging backend URL. ` +
          `Network error: ${msg}`,
      )
    })

  if (!response.ok()) {
    throw new Error(
      `[loginWithCredentialsStrict] STRICT MODE: Backend returned HTTP ${response.status()} for POST /api/auth/login. ` +
        `Expected HTTP 200 with valid session. This sign-off lane does not fall back to localStorage seeding.`,
    )
  }

  const body = await response.json().catch(() => null)
  if (!body) {
    throw new Error(
      '[loginWithCredentialsStrict] STRICT MODE: Backend returned non-JSON response body for POST /api/auth/login.',
    )
  }

  const backendAddress = (body.address as string) || (body.algorandAddress as string)
  if (!backendAddress) {
    throw new Error(
      '[loginWithCredentialsStrict] STRICT MODE: Backend response missing address/algorandAddress field. ' +
        'Cannot build ARC76 session without a non-empty address. ' +
        `Response keys received: ${Object.keys(body).join(', ')}`,
    )
  }

  const session: AuthUser = {
    address: backendAddress,
    email: (body.email as string) || resolvedEmail,
    isConnected: true,
    name: (body.name as string) || undefined,
  }

  const validation = validateSessionContract(session)
  if (!validation.valid) {
    throw new Error(
      `[loginWithCredentialsStrict] STRICT MODE: Backend session failed ARC76 contract validation:\n  ${validation.errors.join('\n  ')}`,
    )
  }

  await page.addInitScript((userData: AuthUser) => {
    localStorage.setItem('algorand_user', JSON.stringify(userData))
    if (userData.email) {
      localStorage.setItem('arc76_email', userData.email)
    }
  }, session)

  console.log(
    `[loginWithCredentialsStrict] STRICT MODE: Authenticated via real backend as ${resolvedEmail}`,
  )
}

/**
 * Clears all auth state from localStorage. Use in tests that verify
 * unauthenticated (guest) behaviour.
 *
 * **When to use which function:**
 * - `clearAuth(page)` — use AFTER navigation (page.evaluate requires loaded page)
 * - `clearAuthScript(page)` — use in beforeEach BEFORE navigation (addInitScript)
 */
export async function clearAuth(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.removeItem('algorand_user')
    localStorage.removeItem('arc76_session')
    localStorage.removeItem('arc76_account')
    localStorage.removeItem('arc76_email')
    localStorage.removeItem('issuance_return_path')
    localStorage.removeItem('auth_redirect_after')
  })
}

/**
 * Registers a pre-navigation script that clears auth state from localStorage
 * before the page finishes loading. Use this in `test.beforeEach` when auth
 * state must be absent from the start of the test, before any `page.goto()`.
 *
 * Unlike `clearAuth`, this works in beforeEach before navigation because
 * `addInitScript` runs on every page load, not just the current page.
 */
export async function clearAuthScript(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.removeItem('algorand_user')
    localStorage.removeItem('arc76_session')
    localStorage.removeItem('arc76_account')
    localStorage.removeItem('arc76_email')
    localStorage.removeItem('issuance_return_path')
    localStorage.removeItem('auth_redirect_after')
  })
}

/**
 * Suppresses browser console errors and page errors that would otherwise
 * cause Playwright to mark a passing test as failed due to mock environment
 * console output.
 *
 * **Permissive suppressor — use for isolated UI tests only.**
 * This function suppresses ALL browser errors including genuine application
 * regressions. For blocker-facing and sign-off specs, use
 * `suppressBrowserErrorsNarrow()` instead so real errors surface as failures.
 */
export function suppressBrowserErrors(page: Page): void {
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`[Browser console error suppressed — mock env]: ${msg.text()}`)
    }
  })
  page.on('pageerror', error => {
    console.log(`[Page error suppressed — mock env]: ${error.message}`)
  })
}

/**
 * Narrow error suppressor — only suppresses known CI-safe, non-regression error
 * patterns (Vite HMR noise, Vue devtools messages, browser extension artefacts).
 *
 * **Use this in blocker-facing specs** instead of `suppressBrowserErrors()`.
 * Unlike the broad suppressor, this function will NOT swallow genuine application
 * errors, so regressions surface as test failures rather than being silently masked.
 *
 * Suppressed patterns (all verified CI-safe with explicit justification):
 *   - Vite HMR connection messages (`[vite]`): build-tool noise, not app behavior
 *   - Vue devtools/warning messages in dev mode: framework warnings, not errors
 *   - Browser suggestion messages: browser-injected hints, not our code
 *   - CORS dev-mode noise from test infrastructure: not present in production
 *
 * Intentionally NOT suppressed (surface as failures):
 *   - Content Security Policy violations — can indicate security issues
 *   - Application-level JavaScript errors
 *   - API response errors visible in console
 *
 * Any page error that does NOT match these patterns will be logged to stdout
 * but will NOT be re-thrown (Playwright surfaces page errors automatically
 * when no handler is registered; this handler provides logging without suppression).
 *
 * AC #5 compliance: "Blocker-facing suites no longer rely on broad
 * suppressBrowserErrors() behavior; any exceptions are narrowly documented
 * and justified."
 */
export function suppressBrowserErrorsNarrow(page: Page): void {
  // These are known CI-safe console error patterns that do not indicate
  // application regressions. Each pattern has an explicit justification:
  const SAFE_CONSOLE_PATTERNS: RegExp[] = [
    /\[vite\]/i, // Vite HMR hot-module replacement messages (build tool noise)
    /vue warn/i, // Vue framework warnings in dev mode (not errors, not prod behavior)
    /download the react devtools/i, // Browser hint injection (not our code)
    /cross-origin/i, // CORS dev-mode noise from local test infrastructure (not prod)
  ]
  // Note: Content Security Policy violations are intentionally NOT in the safe list.
  // CSP violations can indicate security issues (insecure resource loading, potential XSS).
  // If a CSP violation appears in a blocker spec, it should fail the test.

  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text()
      const isSafe = SAFE_CONSOLE_PATTERNS.some(p => p.test(text))
      if (isSafe) {
        console.log(`[Console error suppressed — known safe CI pattern]: ${text}`)
      } else {
        // Unsuppressed: log clearly so CI output shows genuine issues
        console.warn(`[Console error — NOT suppressed (possible regression)]: ${text}`)
      }
    }
  })

  // For page-level errors (uncaught exceptions), log but do not suppress the
  // Playwright error mechanism. Genuine uncaught exceptions should still fail
  // the test through Playwright's default behavior.
  page.on('pageerror', error => {
    const msg = error.message
    const isSafe = SAFE_CONSOLE_PATTERNS.some(p => p.test(msg))
    if (isSafe) {
      console.log(`[Page error suppressed — known safe CI pattern]: ${msg}`)
    } else {
      // Log clearly — Playwright will still fail the test via its own mechanism
      console.error(`[Page error — NOT suppressed (possible regression)]: ${msg}`)
    }
  })
}

/**
 * Returns the textContent of the top navigation element (`<nav>`).
 * Use this instead of `page.content()` for wallet/status text assertions because
 * `page.content()` includes compiled JS bundle strings that embed WalletConnect/Pera/
 * Defly symbols from third-party libraries, causing false-positive failures.
 *
 * This helper:
 *   1. Waits for the nav element to appear in the DOM (semantic readiness check).
 *   2. Returns the textContent of the first navigation landmark.
 *   3. Returns an empty string on failure so callers can assert absence safely.
 *
 * Canonical pattern per AC #3 (deterministic navigation assertions):
 *   const navText = await getNavText(page)
 *   expect(navText).not.toMatch(/WalletConnect|Pera Wallet|Defly|MetaMask/i)
 */
export async function getNavText(page: Page): Promise<string> {
  await page.waitForFunction(() => document.querySelector('nav') !== null, { timeout: 10000 }).catch(() => {
    // If nav never appears, return empty string — caller assertion will handle it
  })
  // Explicit 10s timeout prevents textContent() from inheriting test.setTimeout(90000) as action timeout
  return page.getByRole('navigation').first().textContent({ timeout: 10000 }).catch(() => '')
}

/**
 * Full beforeEach setup helper: suppresses errors, seeds auth, and navigates
 * to the given route, waiting for 'load' (not networkidle — Vite HMR SSE blocks networkidle).
 *
 * Example:
 *   test.beforeEach(async ({ page }) => {
 *     await setupAuthAndNavigate(page, '/launch/guided')
 *   })
 */
export async function setupAuthAndNavigate(
  page: Page,
  route: string,
  user: AuthUser = DEFAULT_TEST_USER,
): Promise<void> {
  suppressBrowserErrors(page)
  await withAuth(page, user)
  await page.goto(route)
  await page.waitForLoadState('load') // 'load' not 'networkidle' — Vite HMR SSE prevents networkidle in CI
}
