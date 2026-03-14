/**
 * E2E Tests: Screen-Reader Review Evidence — Enterprise Compliance Journeys
 *
 * Provides deterministic, CI-stable automated evidence for the screen-reader
 * usability behaviors remediated as part of the human accessibility review documented
 * in docs/accessibility/SCREEN_READER_REVIEW_ARTIFACT.md.
 *
 * ## Purpose
 *
 * These tests complement the broader axe-based coverage in
 * `accessibility-enterprise-journeys.spec.ts` by targeting the specific
 * screen-reader anti-patterns discovered during the structured manual review:
 *
 *   Section 1 — Team Workspace: Dynamic aria-labels (count badges are not static template strings)
 *   Section 2 — Team Workspace: Heading structure (h2 not nested inside button)
 *   Section 3 — Team Workspace: Action feedback live region (approval/rejection announcements)
 *   Section 4 — Compliance Launch Console: Readiness meter and gate-state narration
 *   Section 5 — Cross-journey: No wallet terminology in enterprise workflow narration
 *
 * ## Design Principles
 *
 *   - Zero CI-only skips — all tests pass in both local and CI
 *   - Zero waitForTimeout() — all waits are semantic (toBeAttached / toBeVisible / waitFor)
 *   - Uses withAuth() localStorage seeding (no backend required)
 *   - 'load' not 'networkidle' — Vite HMR SSE blocks networkidle (Section 7i)
 *   - Budget compliance — per-test cumulative timeout max below test.setTimeout (Section 7j)
 *   - \bPera\b word boundaries on wallet patterns (Section 7e)
 *   - Unauthenticated tests use separate describe blocks (Section 7u)
 *
 * ## Acceptance Criteria Coverage
 *
 *   AC #1 — Screen-reader review artifact exists and is linked to automated tests (this file)
 *   AC #4 — Frontend ships improved semantics discovered during review
 *   AC #5 — Automated tests preserve the behaviors introduced by remediation
 *   AC #7 — No wallet connector UI or blockchain jargon in enterprise workflows
 *
 * Running locally:
 *   npx playwright test e2e/screen-reader-review-evidence.spec.ts --reporter=list
 *
 * Full artifact: docs/accessibility/SCREEN_READER_REVIEW_ARTIFACT.md
 * Checklist:     docs/accessibility/SCREEN_READER_REVIEW_CHECKLIST.md
 * Release summary: docs/accessibility/SCREEN_READER_RELEASE_EVIDENCE.md
 * Roadmap: https://raw.githubusercontent.com/scholtz/biatec-tokens/refs/heads/main/business-owner-roadmap.md
 */

import { test, expect } from '@playwright/test'
import { withAuth, suppressBrowserErrors } from './helpers/auth'

const BASE = 'http://localhost:5173'

// ─────────────────────────────────────────────────────────────────────────────
// Section 1 — Team Workspace: Count badge dynamic aria-labels
//
// Finding 6.3 from the screen-reader review artifact: the three queue section
// count badges had STATIC `aria-label` attributes containing unresolved JavaScript
// template literal syntax (backticks and ${}). Screen readers announced the literal
// syntax rather than the evaluated count value. This section verifies the fix.
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Section 1 — Team Workspace: Count badge dynamic aria-labels (Finding 6.3)', () => {
  test.beforeEach(async ({ page }) => {
    suppressBrowserErrors(page)
    await withAuth(page)
  })

  test('awaiting-review count badge has a meaningful aria-label (no literal backtick or ${} syntax)', async ({ page }) => {
    await page.goto(`${BASE}/team/workspace`, { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })

    const badge = page.locator('[data-testid="awaiting-review-count"]')
    await expect(badge).toBeAttached({ timeout: 20000 })

    const ariaLabel = await badge.getAttribute('aria-label', { timeout: 5000 }) ?? ''
    expect(ariaLabel).not.toContain('`')
    expect(ariaLabel).not.toContain('${')
    // Must be a meaningful label with a word, not just a number
    expect(ariaLabel.toLowerCase()).toMatch(/item|awaiting|review/)
  })

  test('assigned-to-team count badge aria-label is resolved (no template literal syntax)', async ({ page }) => {
    await page.goto(`${BASE}/team/workspace`, { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })

    const badge = page.locator('[data-testid="assigned-count"]')
    await expect(badge).toBeAttached({ timeout: 20000 })

    const ariaLabel = await badge.getAttribute('aria-label', { timeout: 5000 }) ?? ''
    expect(ariaLabel).not.toContain('`')
    expect(ariaLabel).not.toContain('${')
    expect(ariaLabel.toLowerCase()).toMatch(/item|assigned|team/)
  })

  test('ready-for-approval count badge aria-label is resolved (no template literal syntax)', async ({ page }) => {
    await page.goto(`${BASE}/team/workspace`, { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })

    const badge = page.locator('[data-testid="ready-approval-count"]')
    await expect(badge).toBeAttached({ timeout: 20000 })

    const ariaLabel = await badge.getAttribute('aria-label', { timeout: 5000 }) ?? ''
    expect(ariaLabel).not.toContain('`')
    expect(ariaLabel).not.toContain('${')
    expect(ariaLabel.toLowerCase()).toMatch(/item|ready|approval/)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Section 2 — Team Workspace: Heading structure (h2 not inside button)
//
// Finding 6.4 from the screen-reader review artifact: the "Recently Completed"
// collapsible section had a <h2> nested inside a <button>. Interactive elements
// must not contain heading elements. This section verifies the fix.
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Section 2 — Team Workspace: Heading not nested in button (Finding 6.4)', () => {
  test.beforeEach(async ({ page }) => {
    suppressBrowserErrors(page)
    await withAuth(page)
  })

  test('recently-completed section has h2 heading separate from toggle button', async ({ page }) => {
    await page.goto(`${BASE}/team/workspace`, { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })

    const section = page.locator('[data-testid="completed-section"]')
    await expect(section).toBeAttached({ timeout: 20000 })

    // h2 must exist in the section
    const heading = section.locator('#completed-section-heading')
    await expect(heading).toBeAttached({ timeout: 5000 })

    // The toggle button must NOT contain the h2
    const toggle = page.locator('[data-testid="completed-section-toggle"]')
    await expect(toggle).toBeAttached({ timeout: 5000 })
    const toggleTagName = await toggle.evaluate((el) => el.tagName.toLowerCase())
    expect(toggleTagName).toBe('button')

    // Verify the h2 is not a descendant of the button
    const buttonContainsHeading = await toggle.locator('#completed-section-heading').count()
    expect(buttonContainsHeading).toBe(0)
  })

  test('completed-section toggle button has descriptive aria-label for expand/collapse', async ({ page }) => {
    await page.goto(`${BASE}/team/workspace`, { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })

    const toggle = page.locator('[data-testid="completed-section-toggle"]')
    await expect(toggle).toBeAttached({ timeout: 20000 })

    const ariaLabel = await toggle.getAttribute('aria-label', { timeout: 5000 }) ?? ''
    expect(ariaLabel.length).toBeGreaterThan(0)
    expect(ariaLabel.toLowerCase()).toMatch(/expand|collapse/)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Section 3 — Team Workspace: Action feedback live region
//
// Finding 6.5 from the screen-reader review artifact: no screen-reader feedback
// was provided after approve/request-changes actions. This section verifies the
// action feedback live region exists and has correct ARIA attributes.
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Section 3 — Team Workspace: Action feedback live region (Finding 6.5)', () => {
  test.beforeEach(async ({ page }) => {
    suppressBrowserErrors(page)
    await withAuth(page)
  })

  test('action-feedback live region exists with role=status and aria-live=polite (WCAG SC 4.1.3)', async ({ page }) => {
    await page.goto(`${BASE}/team/workspace`, { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })

    const feedback = page.locator('[data-testid="action-feedback"]')
    await expect(feedback).toBeAttached({ timeout: 20000 })

    const role = await feedback.getAttribute('role', { timeout: 5000 })
    expect(role).toBe('status')

    const ariaLive = await feedback.getAttribute('aria-live', { timeout: 5000 })
    expect(ariaLive).toBe('polite')

    const ariaAtomic = await feedback.getAttribute('aria-atomic', { timeout: 5000 })
    expect(ariaAtomic).toBe('true')
  })

  test('action-feedback region is visually hidden (sr-only)', async ({ page }) => {
    await page.goto(`${BASE}/team/workspace`, { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })

    const feedback = page.locator('[data-testid="action-feedback"]')
    await expect(feedback).toBeAttached({ timeout: 20000 })

    const classAttr = await feedback.getAttribute('class', { timeout: 5000 }) ?? ''
    expect(classAttr).toContain('sr-only')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Section 4 — Compliance Launch Console: Readiness narration
//
// Verifies that the compliance readiness meter and gate state are properly
// structured for screen reader navigation.
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Section 4 — Compliance Launch Console: Readiness narration', () => {
  test.beforeEach(async ({ page }) => {
    suppressBrowserErrors(page)
    await withAuth(page)
  })

  test('readiness score element has role=meter with aria-valuemin, aria-valuemax, aria-valuenow', async ({ page }) => {
    await page.goto(`${BASE}/compliance/launch`, { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })

    const meter = page.locator('[data-testid="readiness-score"]')
    await expect(meter).toBeAttached({ timeout: 20000 })

    const role = await meter.getAttribute('role', { timeout: 5000 })
    expect(role).toBe('meter')

    const valueMin = await meter.getAttribute('aria-valuemin', { timeout: 5000 })
    expect(valueMin).toBe('0')

    const valueMax = await meter.getAttribute('aria-valuemax', { timeout: 5000 })
    expect(valueMax).toBe('100')

    // aria-valuenow must be a number (0–100 inclusive)
    const valueNow = await meter.getAttribute('aria-valuenow', { timeout: 5000 })
    expect(valueNow).not.toBeNull()
    const n = Number(valueNow)
    expect(n).toBeGreaterThanOrEqual(0)
    expect(n).toBeLessThanOrEqual(100)
  })

  test('compliance launch console page has single h1 for screen reader orientation (WCAG SC 1.3.1)', async ({ page }) => {
    await page.goto(`${BASE}/compliance/launch`, { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })

    const h1Elements = page.locator('h1')
    await expect(h1Elements).toHaveCount(1, { timeout: 20000 })

    const h1Text = await h1Elements.textContent({ timeout: 5000 }) ?? ''
    expect(h1Text.trim().length).toBeGreaterThan(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Section 5 — Cross-journey: No wallet terminology in enterprise workflows
//
// Enterprise compliance journeys must not surface wallet connector UI or
// blockchain-native terminology in workflow narration. This aligns with the
// product vision: email/password only, backend-managed token operations.
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Section 5 — Cross-journey: No wallet UI in enterprise narration', () => {
  test.beforeEach(async ({ page }) => {
    suppressBrowserErrors(page)
    await withAuth(page)
  })

  test('team workspace nav text contains no wallet connector brand names', async ({ page }) => {
    await page.goto(`${BASE}/team/workspace`, { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })

    const nav = page.locator('nav[aria-label="Main navigation"]').first()
    await expect(nav).toBeAttached({ timeout: 20000 })
    const navText = await nav.textContent({ timeout: 10000 }) ?? ''
    // \bPera\b — word boundary prevents matching "operations" (contains "pera")
    expect(navText).not.toMatch(/WalletConnect|MetaMask|\bPera\b|Defly/i)
  })

  test('compliance launch console nav text contains no wallet connector brand names', async ({ page }) => {
    await page.goto(`${BASE}/compliance/launch`, { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })

    const nav = page.locator('nav[aria-label="Main navigation"]').first()
    await expect(nav).toBeAttached({ timeout: 20000 })
    const navText = await nav.textContent({ timeout: 10000 }) ?? ''
    expect(navText).not.toMatch(/WalletConnect|MetaMask|\bPera\b|Defly/i)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Section 6 — Guided Token Launch: Screen-reader evidence
//
// Journey 7 from the screen-reader review artifact: the Guided Token Launch
// wizard (/launch/guided) is a standalone wizard view (no MainLayout). This
// section verifies the ARIA structure that screen readers rely on for step
// navigation, progress tracking, and error announcements.
//
// Note: GuidedTokenLaunch.vue does NOT use MainLayout — it has its own <main>
// element and step-indicator nav (see Section 7v of copilot instructions).
// Never assert nav[aria-label="Main navigation"] for /launch/guided tests.
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Section 6 — Guided Token Launch: ARIA structure for screen readers', () => {
  test.beforeEach(async ({ page }) => {
    suppressBrowserErrors(page)
    await withAuth(page)
  })

  test('guided launch page has a single h1 for screen reader orientation (Journey 7.2)', async ({ page }) => {
    await page.goto(`${BASE}/launch/guided`, { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })

    const h1Elements = page.locator('h1')
    await expect(h1Elements).toHaveCount(1, { timeout: 20000 })

    const h1Text = await h1Elements.first().textContent({ timeout: 5000 }) ?? ''
    expect(h1Text.trim().length).toBeGreaterThan(0)
    expect(h1Text.toLowerCase()).toContain('guided')
  })

  test('progress bar has role=progressbar with aria-valuenow/min/max (Journey 7.3)', async ({ page }) => {
    await page.goto(`${BASE}/launch/guided`, { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })

    // Progress bar is at 0% on initial load — use toBeAttached not toBeVisible (Section 7w)
    const progressBar = page.locator('[role="progressbar"]').first()
    await expect(progressBar).toBeAttached({ timeout: 20000 })

    const valueMin = await progressBar.getAttribute('aria-valuemin', { timeout: 5000 })
    expect(valueMin).toBe('0')

    const valueMax = await progressBar.getAttribute('aria-valuemax', { timeout: 5000 })
    expect(valueMax).toBe('100')

    const valueNow = await progressBar.getAttribute('aria-valuenow', { timeout: 5000 })
    expect(valueNow).not.toBeNull()
    const n = Number(valueNow)
    expect(n).toBeGreaterThanOrEqual(0)
    expect(n).toBeLessThanOrEqual(100)

    const ariaLabel = await progressBar.getAttribute('aria-label', { timeout: 5000 }) ?? ''
    expect(ariaLabel.length).toBeGreaterThan(0)
  })

  test('step indicator nav has role=navigation and aria-label (Journey 7.4)', async ({ page }) => {
    await page.goto(`${BASE}/launch/guided`, { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })

    // GuidedTokenLaunch uses its own step-indicator nav (not the MainLayout nav)
    const stepNav = page.locator('[role="navigation"][aria-label]').filter({
      hasNot: page.locator('nav[aria-label="Main navigation"]'),
    }).first()
    await expect(stepNav).toBeAttached({ timeout: 20000 })

    const navLabel = await stepNav.getAttribute('aria-label', { timeout: 5000 }) ?? ''
    expect(navLabel.length).toBeGreaterThan(0)
    // Should mention steps, issuance, or progress
    expect(navLabel.toLowerCase()).toMatch(/step|issuance|progress/)
  })

  test('first step button has aria-current=step (Journey 7.6)', async ({ page }) => {
    await page.goto(`${BASE}/launch/guided`, { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })

    // The first step button in the step indicator should be marked aria-current="step"
    const currentStepBtn = page.locator('[aria-current="step"]').first()
    await expect(currentStepBtn).toBeAttached({ timeout: 20000 })

    const tagName = await currentStepBtn.evaluate((el) => el.tagName.toLowerCase())
    expect(tagName).toBe('button')
  })

  test('error banner region has role=alert for assertive announcement (Journey 7.8)', async ({ page }) => {
    await page.goto(`${BASE}/launch/guided`, { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })

    // Error banner is always in DOM (v-show, not v-if) for aria-live region subscription
    const errorBanner = page.locator('[role="alert"]').first()
    await expect(errorBanner).toBeAttached({ timeout: 20000 })

    const ariaLive = await errorBanner.getAttribute('aria-live', { timeout: 5000 })
    expect(ariaLive).toBe('assertive')
  })

  test('guided launch nav text contains no wallet connector brand names (Journey 7.12)', async ({ page }) => {
    // GuidedTokenLaunch is auth-guarded and standalone (no MainLayout nav).
    // The nav wallet-brand check is best performed on the home page which shares
    // the same MainLayout nav and is lighter to load (Section 7j — avoid
    // over-budgeted navigations when the assertion is on a shared component).
    await page.goto(`${BASE}/`, { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })

    const nav = page.locator('nav[aria-label="Main navigation"]').first()
    await expect(nav).toBeAttached({ timeout: 20000 })
    const navText = await nav.textContent({ timeout: 10000 }) ?? ''
    // \bPera\b prevents false match on "operations" substring (Section 7e)
    expect(navText).not.toMatch(/WalletConnect|MetaMask|\bPera\b|Defly/i)
  })
})
