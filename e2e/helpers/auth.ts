/**
 * E2E Auth Helpers — Shared session bootstrap utilities
 *
 * Provides structured, reusable helpers for setting up authenticated sessions
 * in Playwright E2E tests. Centralises auth state management so tests use a
 * consistent interface instead of ad-hoc localStorage.setItem calls.
 *
 * Note: These helpers currently use localStorage seeding because the frontend
 * development server runs without a live backend. When the backend auth endpoint
 * (`POST /api/auth/login`) is available in the test environment, the `loginHelper`
 * function should be updated to call it and store the real session token.
 * Tracked in issue #495.
 *
 * Usage:
 *   import { withAuth, withAuthUser, suppressBrowserErrors } from './helpers/auth'
 *
 *   test.beforeEach(async ({ page }) => {
 *     suppressBrowserErrors(page)
 *     await withAuth(page)
 *     await page.goto('/launch/guided')
 *     await page.waitForLoadState('networkidle')
 *   })
 */

import type { Page } from '@playwright/test'

export interface AuthUser {
  address: string
  email: string
  name?: string
  isConnected?: boolean
  provisioningStatus?: string
  canDeploy?: boolean
}

/** Default test user used across canonical E2E flows */
export const DEFAULT_TEST_USER: AuthUser = {
  address: 'E2E_TEST_ARC76_ADDRESS_BIATEC_TOKENS',
  email: 'e2e-test@biatec.io',
  name: 'E2E Test User',
  isConnected: true,
  provisioningStatus: 'active',
  canDeploy: true,
}

/**
 * Seeds localStorage with an authenticated user via addInitScript.
 * Must be called before page.goto() to ensure auth state is available
 * when the app initialises.
 *
 * This is the canonical pattern for auth-first E2E tests. Replace with
 * a real backend login call once the backend auth endpoint is stable (#495).
 */
export async function withAuth(page: Page, user: AuthUser = DEFAULT_TEST_USER): Promise<void> {
  await page.addInitScript((userData: AuthUser) => {
    localStorage.setItem('algorand_user', JSON.stringify(userData))
  }, user)
}

/**
 * Clears all auth state from localStorage. Use in tests that verify
 * unauthenticated (guest) behaviour.
 */
export async function clearAuth(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.removeItem('algorand_user')
    localStorage.removeItem('arc76_session')
    localStorage.removeItem('arc76_account')
    localStorage.removeItem('arc76_email')
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
  user: AuthUser = DEFAULT_TEST_USER
): Promise<void> {
  suppressBrowserErrors(page)
  await withAuth(page, user)
  await page.goto(route)
  await page.waitForLoadState('networkidle')
}
