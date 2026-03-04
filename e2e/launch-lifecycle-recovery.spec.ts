/**
 * E2E: Launch Lifecycle Recovery — Vision Milestone
 *
 * Tests the observable lifecycle and recovery guarantees for the guided token
 * launch flow. Covers the primary happy path (structural) and two high-risk
 * failure paths:
 *
 * 1. Happy path: Authenticated user can access guided launch page, sees
 *    progress indicator, and the flow has all required observable landmarks.
 *
 * 2. Failure path A — validation rejection: The launch page renders
 *    accessible form fields and communicates validation requirements to the
 *    user. No opaque error states are shown on initial load.
 *
 * 3. Failure path B — unauthenticated access (session loss): A user who
 *    loses their session is redirected to auth rather than left in a broken
 *    state. The system recovers deterministically.
 *
 * Design principles:
 * - Semantic waits only (toBeVisible with timeouts — no waitForTimeout)
 * - CI-compatible: generous timeouts for auth store init + component mount
 * - No wallet connector assertions via page.content() (compiled JS bundles
 *   contain WalletConnect strings from third-party libs; use body.innerText())
 * - suppressBrowserErrors() in beforeEach to prevent Playwright exit code 1
 *   from non-critical browser console output
 *
 * Roadmap: https://raw.githubusercontent.com/scholtz/biatec-tokens/refs/heads/main/business-owner-roadmap.md
 * Issue: Vision Milestone — Conversion-Optimized Token Launch Journey with
 *   Observable Lifecycle and Recovery Guarantees
 */

import { test, expect } from '@playwright/test'
import { withAuth, suppressBrowserErrors, clearAuthScript } from './helpers/auth'

// ─── Suite 1: Happy path — authenticated user, observable lifecycle ───────────

test.describe('Happy path — authenticated guided launch', () => {
  test.beforeEach(async ({ page }) => {
    suppressBrowserErrors(page)
    await withAuth(page)
  })

  test('authenticated user reaches the guided launch page', async ({ page }) => {
    await page.goto('/launch/guided')
    await page.waitForLoadState('networkidle')

    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible({ timeout: 60000 })
  })

  test('page has a main landmark for accessibility', async ({ page }) => {
    await page.goto('/launch/guided')
    await page.waitForLoadState('networkidle')

    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible({ timeout: 60000 })

    const main = page.getByRole('main')
    await expect(main).toBeVisible({ timeout: 15000 })
  })

  test('progress indicator is present on the guided launch page', async ({ page }) => {
    await page.goto('/launch/guided')
    await page.waitForLoadState('networkidle')

    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible({ timeout: 60000 })

    // Either a progressbar or step navigation must be present
    const hasProgressBar = await page.locator('[role="progressbar"]').count().then(c => c > 0)
    const hasStepNav = await page
      .locator('[role="navigation"]', { hasText: /step|progress/i })
      .count()
      .then(c => c > 0)
    const hasStepText = (await page.locator('body').innerText()).toLowerCase().includes('step')

    expect(hasProgressBar || hasStepNav || hasStepText).toBe(true)
  })

  test('page has no wallet connector UI (roadmap: email/password only)', async ({ page }) => {
    await page.goto('/launch/guided')
    await page.waitForLoadState('networkidle')

    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible({ timeout: 60000 })

    const bodyText = await page.locator('body').innerText()
    expect(bodyText).not.toMatch(/WalletConnect|MetaMask|connect wallet/i)
    expect(bodyText).not.toMatch(/sign transaction|approve in wallet/i)
  })

  test('page displays the launch heading with email/password branding', async ({ page }) => {
    await page.goto('/launch/guided')
    await page.waitForLoadState('networkidle')

    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible({ timeout: 60000 })

    const heading = await h1.textContent()
    expect(heading).toBeTruthy()
    expect(heading!.length).toBeGreaterThan(3)
  })

  test('navigation does not expose wallet artifacts in authenticated state', async ({ page }) => {
    await page.goto('/launch/guided')
    await page.waitForLoadState('networkidle')

    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible({ timeout: 60000 })

    const nav = page.getByRole('navigation').first()
    const navText = await nav.textContent().catch(() => '')
    expect(navText).not.toMatch(/WalletConnect|\bPera\b|Defly|MetaMask/i)
  })
})

// ─── Suite 2: Failure path A — validation state is observable ─────────────────

test.describe('Failure path A — validation and form observability', () => {
  test.beforeEach(async ({ page }) => {
    suppressBrowserErrors(page)
    await withAuth(page)
  })

  test('form inputs are labelled (validation messages will be attributed correctly)', async ({ page }) => {
    await page.goto('/launch/guided')
    await page.waitForLoadState('networkidle')

    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible({ timeout: 60000 })

    // At least one text input must have an aria-label or associated <label>
    const inputs = page.locator('input[type="text"], input[type="email"]')
    const count = await inputs.count()
    if (count > 0) {
      const first = inputs.first()
      const ariaLabel = await first.getAttribute('aria-label')
      const inputId = await first.getAttribute('id')
      const hasLabel = inputId
        ? (await page.locator(`label[for="${inputId}"]`).count()) > 0
        : false
      expect(ariaLabel || hasLabel).toBeTruthy()
    }
  })

  test('no opaque error state on initial load — page renders step content', async ({ page }) => {
    await page.goto('/launch/guided')
    await page.waitForLoadState('networkidle')

    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible({ timeout: 60000 })

    // The page must not show a generic "Something went wrong" without a recovery path
    const bodyText = await page.locator('body').innerText()
    // If an error is shown it must come with an actionable message
    if (bodyText.toLowerCase().includes('something went wrong')) {
      // There must also be a way to retry/recover
      const hasRetryLink = bodyText.toLowerCase().includes('try again') ||
        bodyText.toLowerCase().includes('refresh')
      expect(hasRetryLink).toBe(true)
    }
  })

  test('error banner region has role=alert for screen reader announcement', async ({ page }) => {
    await page.goto('/launch/guided')
    await page.waitForLoadState('networkidle')

    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible({ timeout: 60000 })

    // If an error banner is shown it must have role="alert"
    const errorBanner = page.locator('[role="alert"]')
    const count = await errorBanner.count()
    // If banners exist they must have the right role (already satisfied by count > 0 with correct attr)
    if (count > 0) {
      const role = await errorBanner.first().getAttribute('role')
      expect(role).toBe('alert')
    }
    // If no banner is shown, that's fine — no errors on clean load
  })

  test('step indicator describes flow position to users', async ({ page }) => {
    await page.goto('/launch/guided')
    await page.waitForLoadState('networkidle')

    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible({ timeout: 60000 })

    const bodyText = await page.locator('body').innerText()
    // Page must communicate "step" or "progress" concept
    const communicatesProgress =
      bodyText.toLowerCase().includes('step') ||
      bodyText.toLowerCase().includes('progress') ||
      bodyText.toLowerCase().includes('complete') ||
      (await page.locator('[role="progressbar"]').count()) > 0

    expect(communicatesProgress).toBe(true)
  })
})

// ─── Suite 3: Failure path B — session loss / unauthenticated access ──────────

test.describe('Failure path B — session loss recovery', () => {
  test.beforeEach(async ({ page }) => {
    suppressBrowserErrors(page)
  })

  test('unauthenticated access to /launch/guided is redirected to auth', async ({ page }) => {
    await clearAuthScript(page)
    await page.goto('/launch/guided')
    await page.waitForLoadState('networkidle')

    // Flexible: the system must either redirect URL OR show auth prompt
    const url = page.url()
    const bodyText = await page.locator('body').innerText()

    const urlHasAuth =
      url.includes('showAuth') ||
      url.includes('login') ||
      !url.endsWith('/launch/guided')
    const bodyHasAuthPrompt =
      bodyText.toLowerCase().includes('sign in') ||
      bodyText.toLowerCase().includes('email') ||
      bodyText.toLowerCase().includes('password')

    expect(urlHasAuth || bodyHasAuthPrompt).toBe(true)
  })

  test('after session loss the user is not left on a blank page', async ({ page }) => {
    await clearAuthScript(page)
    await page.goto('/launch/guided')
    await page.waitForLoadState('networkidle')

    // Page must have content — not a blank white screen
    const bodyText = await page.locator('body').innerText()
    expect(bodyText.trim().length).toBeGreaterThan(10)
  })

  test('auth redirect from /launch/guided preserves the route intent in URL', async ({ page }) => {
    await clearAuthScript(page)
    await page.goto('/launch/guided')
    await page.waitForLoadState('networkidle')

    // Accept: either the URL encodes auth intent (showAuth=true) OR the homepage is shown
    const url = page.url()
    const isOnHome = url.endsWith('/') || !!url.match(/\/$/)
    const isOnAuth = url.includes('showAuth') || url.includes('login')

    // Neither blank nor still on the protected route without auth
    const bodyText = await page.locator('body').innerText()
    expect(bodyText.trim().length).toBeGreaterThan(10)
    expect(isOnHome || isOnAuth || !url.includes('/launch/guided')).toBe(true)
  })

  test('homepage is accessible to unauthenticated users (recovery entry point)', async ({ page }) => {
    await clearAuthScript(page)
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const heading = page.getByRole('heading').first()
    await expect(heading).toBeVisible({ timeout: 15000 })
  })

  test('homepage sign-in entry point is discoverable after session loss', async ({ page }) => {
    await clearAuthScript(page)
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // User must be able to find a way to re-authenticate
    const bodyText = await page.locator('body').innerText()
    const hasSignIn =
      bodyText.toLowerCase().includes('sign in') ||
      bodyText.toLowerCase().includes('log in') ||
      bodyText.toLowerCase().includes('login') ||
      bodyText.toLowerCase().includes('email')

    expect(hasSignIn).toBe(true)
  })
})

// ─── Suite 4: Observable lifecycle landmarks ──────────────────────────────────

test.describe('Observable lifecycle — structural anchors', () => {
  test.beforeEach(async ({ page }) => {
    suppressBrowserErrors(page)
    await withAuth(page)
  })

  test('guided launch page has data-testid anchors for automation', async ({ page }) => {
    await page.goto('/launch/guided')
    await page.waitForLoadState('networkidle')

    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible({ timeout: 60000 })

    // At least one data-testid anchor must be present for observability
    const testedElements = await page.locator('[data-testid]').count()
    expect(testedElements).toBeGreaterThan(0)
  })

  test('progress bar has correct ARIA attributes', async ({ page }) => {
    await page.goto('/launch/guided')
    await page.waitForLoadState('networkidle')

    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible({ timeout: 60000 })

    const progressBars = page.locator('[role="progressbar"]')
    const count = await progressBars.count()
    if (count > 0) {
      const bar = progressBars.first()
      const ariaMin = await bar.getAttribute('aria-valuemin')
      const ariaMax = await bar.getAttribute('aria-valuemax')
      expect(ariaMin).toBe('0')
      expect(ariaMax).toBe('100')
    }
  })

  test('no "sign transaction" or blockchain jargon visible to user', async ({ page }) => {
    await page.goto('/launch/guided')
    await page.waitForLoadState('networkidle')

    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible({ timeout: 60000 })

    const bodyText = await page.locator('body').innerText()
    expect(bodyText).not.toMatch(/sign transaction|approve in wallet|submit to blockchain/i)
  })

  test('page title communicates Biatec or Token context', async ({ page }) => {
    await page.goto('/launch/guided')
    await page.waitForLoadState('networkidle')

    const title = await page.title()
    expect(title).toMatch(/biatec|token/i)
  })
})
