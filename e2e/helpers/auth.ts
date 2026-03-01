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
 * test environment, replace `withAuth` with `loginWithBackend` (defined below
 * as a stub). The session shape and validation logic remain the same.
 *
 * Canonical auth-test migration path:
 *   1. Current:  withAuth(page)                      — localStorage seeding
 *   2. Next:     loginWithBackend(page, email, pass)  — real HTTP auth
 *   3. Both validate against ARC76SessionContract and expose identical
 *      test assertions, so E2E tests need zero changes between phases.
 *
 * Usage:
 *   import { withAuth, suppressBrowserErrors, setupAuthAndNavigate } from './helpers/auth'
 *
 *   test.beforeEach(async ({ page }) => {
 *     suppressBrowserErrors(page)
 *     await withAuth(page)
 *     await page.goto('/launch/guided')
 *     await page.waitForLoadState('networkidle')
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
 * This is the canonical pattern for auth-first E2E tests.
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
  }, session)
}

/**
 * Stub for future backend-auth integration. When the backend auth endpoint
 * is available in CI, replace the body of this function with a real HTTP
 * call and session storage. The E2E test call sites remain identical.
 *
 * @example
 *   // Future: loginWithBackend(page, 'test@biatec.io', process.env.E2E_PASSWORD)
 */
export async function loginWithBackend(
  _page: Page,
  _email: string,
  _password: string,
): Promise<void> {
  // TODO: implement real POST /api/auth/login when backend is stable in CI
  // For now, callers should use withAuth() which validates the session contract.
  throw new Error(
    '[auth-helper] loginWithBackend: backend auth endpoint not yet available in CI. Use withAuth() instead.',
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
 * Full beforeEach setup helper: suppresses errors, seeds auth, and navigates
 * to the given route, waiting for networkidle.
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
  await page.waitForLoadState('networkidle')
}
