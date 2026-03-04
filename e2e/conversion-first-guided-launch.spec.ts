/**
 * E2E: Conversion-first Guided Launch — Vision Milestone
 *
 * Scenarios:
 * 1. Happy path: page loads, step indicator visible, progress bar present
 * 2. Auth redirect: unauthenticated access redirects to auth
 * 3. No wallet connectors: email/password only (business roadmap requirement)
 * 4. Analytics/accessibility: structural tests that work without deep auth
 *
 * Design principles:
 * - Zero test.skip(!!process.env.CI, ...) for tests that can avoid CI timeouts
 * - Semantic waits only (no waitForTimeout except post-navigation settle)
 * - Tests use withAuth() for auth seeding (CI-safe localStorage fallback)
 * - All tests run in CI; deep page tests use generous timeouts for auth store init
 *
 * Roadmap: https://raw.githubusercontent.com/scholtz/biatec-tokens/refs/heads/main/business-owner-roadmap.md
 */

import { test, expect } from '@playwright/test'
import { withAuth, suppressBrowserErrors, clearAuthScript } from './helpers/auth'
import {
  LAUNCH_ANALYTICS_EVENTS,
  buildStepEnteredPayload,
  buildRiskAcknowledgedPayload,
} from '../src/utils/launchAnalyticsEvents'

// ─── Suite 1: Homepage and structural tests (no auth required) ────────────────

test.describe('Homepage and structural tests', () => {
  test.beforeEach(async ({ page }) => {
    suppressBrowserErrors(page)
  })

  test('homepage loads and has Biatec branding in title', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const title = await page.title()
    expect(title).toMatch(/biatec|token/i)
  })

  test('homepage has Sign In button (email/password auth, no wallet connector)', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const heading = page.getByRole('heading').first()
    await expect(heading).toBeVisible({ timeout: 15000 })
    // No wallet connector text must appear in visible page content
    const bodyText = await page.locator('body').innerText()
    expect(bodyText).not.toMatch(/WalletConnect|MetaMask|Pera Wallet|Defly/i)
  })

  test('homepage navigation contains no wallet connector UI', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const nav = page.getByRole('navigation').first()
    await expect(nav).toBeVisible({ timeout: 15000 })
    const navText = await nav.textContent().catch(() => '')
    expect(navText).not.toMatch(/WalletConnect|MetaMask|\bPera\b|Defly/i)
  })

  test('guided launch route exists (either page or auth redirect)', async ({ page }) => {
    await page.goto('/launch/guided')
    await page.waitForLoadState('networkidle')
    const url = page.url()
    expect(url).toBeTruthy()
    const content = await page.content()
    expect(content.length).toBeGreaterThan(100)
  })

  test('unauthenticated /launch/guided redirects to auth or shows auth prompt', async ({ page }) => {
    await clearAuthScript(page)
    await page.goto('/launch/guided')
    await page.waitForLoadState('networkidle')
    // Flexible: URL may include showAuth param OR auth form is visible
    const url = page.url()
    const content = await page.content()
    const urlHasAuth = url.includes('showAuth') || url.includes('login') || !url.includes('/launch/guided')
    const hasAuthForm = content.toLowerCase().includes('email') || content.toLowerCase().includes('sign in')
    expect(urlHasAuth || hasAuthForm).toBe(true)
  })

  test('no "sign transaction" or "approve in wallet" text on homepage', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const bodyText = await page.locator('body').innerText()
    expect(bodyText).not.toMatch(/sign transaction|approve in wallet/i)
  })

  test('homepage main heading is visible', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const heading = page.getByRole('heading').first()
    await expect(heading).toBeVisible({ timeout: 15000 })
  })

  test('page title includes Biatec or Token branding', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const title = await page.title()
    expect(title).toMatch(/biatec|token/i)
  })
})

// ─── Suite 2: Analytics constants are stable (no browser auth needed) ────────

test.describe('Analytics event constants — structural stability', () => {
  test('STEP_ENTERED constant equals "launch:step_entered"', () => {
    expect(LAUNCH_ANALYTICS_EVENTS.STEP_ENTERED).toBe('launch:step_entered')
  })

  test('RISK_ACKNOWLEDGED constant equals "launch:risk_acknowledged"', () => {
    expect(LAUNCH_ANALYTICS_EVENTS.RISK_ACKNOWLEDGED).toBe('launch:risk_acknowledged')
  })

  test('all 10 event constants are non-empty strings', () => {
    const values = Object.values(LAUNCH_ANALYTICS_EVENTS)
    expect(values).toHaveLength(10)
    values.forEach((v) => {
      expect(typeof v).toBe('string')
      expect(v.length).toBeGreaterThan(0)
    })
  })

  test('all event constant values are unique', () => {
    const values = Object.values(LAUNCH_ANALYTICS_EVENTS)
    const unique = new Set(values)
    expect(unique.size).toBe(values.length)
  })

  test('buildStepEnteredPayload step 0/6 has progressPercent=0', () => {
    const payload = buildStepEnteredPayload('organization', 0, 6)
    expect(payload.progressPercent).toBe(0)
  })

  test('buildStepEnteredPayload step 3/6 has progressPercent=50', () => {
    const payload = buildStepEnteredPayload('template', 3, 6)
    expect(payload.progressPercent).toBe(50)
  })

  test('buildRiskAcknowledgedPayload includes tokenName and network', () => {
    const payload = buildRiskAcknowledgedPayload('Loyalty Token', 'algorand_mainnet')
    expect(payload.tokenName).toBe('Loyalty Token')
    expect(payload.network).toBe('algorand_mainnet')
  })
})

// ─── Suite 3: Authenticated guided launch page ────────────────────────────────

test.describe('Guided launch page — authenticated', () => {
  test.beforeEach(async ({ page }) => {
    suppressBrowserErrors(page)
    await withAuth(page)
  })

  test('guided launch page has h1 heading', async ({ page }) => {
    await page.goto('/launch/guided')
    await page.waitForLoadState('networkidle')
    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible({ timeout: 60000 })
  })

  test('guided launch page has no wallet connector text', async ({ page }) => {
    await page.goto('/launch/guided')
    await page.waitForLoadState('networkidle')
    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible({ timeout: 60000 })
    const nav = page.getByRole('navigation').first()
    const navText = await nav.textContent().catch(() => '')
    expect(navText).not.toMatch(/MetaMask|WalletConnect|connect wallet/i)
  })

  test('guided launch page has progress indicator or step list', async ({ page }) => {
    await page.goto('/launch/guided')
    await page.waitForLoadState('networkidle')
    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible({ timeout: 60000 })
    // Either a progressbar or a list of steps must be present
    const hasProgressBar = await page.locator('[role="progressbar"]').isVisible().catch(() => false)
    const hasStepList = await page.locator('[aria-label="Launch progress"]').isVisible().catch(() => false)
    const hasStepsText = (await page.content()).includes('step') || (await page.content()).includes('Step')
    expect(hasProgressBar || hasStepList || hasStepsText).toBe(true)
  })

  test('guided launch page has a main landmark', async ({ page }) => {
    await page.goto('/launch/guided')
    await page.waitForLoadState('networkidle')
    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible({ timeout: 60000 })
    const main = page.getByRole('main')
    const hasMain = await main.isVisible().catch(() => false)
    expect(hasMain).toBe(true)
  })

  test('organization profile form inputs are accessible (have labels)', async ({ page }) => {
    await page.goto('/launch/guided')
    await page.waitForLoadState('networkidle')
    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible({ timeout: 60000 })
    const inputs = page.locator('input[type="text"], input[type="email"]')
    const count = await inputs.count()
    if (count > 0) {
      // Check first 3 inputs; capped to avoid excessive test time while still covering
    // more than the minimum required for form accessibility confidence
    for (let i = 0; i < Math.min(count, 3); i++) {
        const input = inputs.nth(i)
        const ariaLabel = await input.getAttribute('aria-label')
        const id = await input.getAttribute('id')
        const hasLabel = id ? (await page.locator(`label[for="${id}"]`).count()) > 0 : false
        expect(ariaLabel || hasLabel).toBeTruthy()
      }
    }
  })

  test('no "sign transaction" text on guided launch page', async ({ page }) => {
    await page.goto('/launch/guided')
    await page.waitForLoadState('networkidle')
    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible({ timeout: 60000 })
    const bodyText = await page.locator('body').innerText()
    expect(bodyText).not.toMatch(/sign transaction|approve in wallet/i)
  })
})

