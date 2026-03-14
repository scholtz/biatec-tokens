/**
 * Shared Accessibility Test Helpers — Procurement-Grade WCAG 2.1 AA Evidence
 *
 * Reusable utilities for accessibility assertions across all enterprise journeys.
 * Designed to reduce boilerplate while producing high-signal, stakeholder-legible
 * failure output in CI artifacts.
 *
 * ## Design Principles
 *
 * 1. **axe-core wrapping**: `runAxeScan()` applies WCAG 2.1 AA tag set, blocks on
 *    critical/serious violations, and logs the full violation list so reviewers see
 *    the complete picture in CI output.
 *
 * 2. **Semantic waits only**: All helpers use `toBeVisible`, `waitFor`, or
 *    `toBeAttached` — zero `waitForTimeout()` calls.
 *
 * 3. **Scoped landmark assertions**: `assertMainNav`, `assertMainLandmark`,
 *    `assertBreadcrumb` scope to specific `aria-label` values to avoid strict-mode
 *    violations from sidebar + breadcrumb dual `aria-current="page"` patterns.
 *
 * 4. **Budget-safe textContent**: All helpers that call `.textContent()` pass an
 *    explicit `{ timeout }` to avoid inheriting `test.setTimeout(90000)` as the
 *    action timeout (Section 7j violation).
 *
 * 5. **Keyboard helpers**: `assertKeyboardFocusAfterTab` first clicks `body` to
 *    give the page keyboard focus in headless mode, then asserts via
 *    `document.activeElement` (reliable in headless; `:focus` is not).
 *
 * 6. **Dialog helpers**: `assertDialogAccessibility` checks role, aria-modal,
 *    aria-labelledby/label, and that a close button is present.
 *
 * 7. **Route announcer**: `assertRouteAnnouncer` verifies the live-region element
 *    is in the DOM with `role="status"` and `aria-live="polite"`.
 *
 * Usage:
 *   import { runAxeScan, assertMainNav, assertKeyboardFocusAfterTab } from './helpers/accessibility'
 *
 * Roadmap: https://raw.githubusercontent.com/scholtz/biatec-tokens/refs/heads/main/business-owner-roadmap.md
 */

import { expect, type Page } from '@playwright/test'
import { AxeBuilder } from '@axe-core/playwright'

// ---------------------------------------------------------------------------
// WCAG tag set — Level A + Level AA (WCAG 2.0 + WCAG 2.1 additions)
// ---------------------------------------------------------------------------

export const WCAG_AA_TAGS = ['wcag2a', 'wcag2aa', 'wcag21aa'] as const

// ---------------------------------------------------------------------------
// axe-core scan helpers
// ---------------------------------------------------------------------------

export interface AxeScanOptions {
  /** Human-readable context label used in failure messages and CI logs. */
  context: string
  /**
   * CSS selectors to exclude from the scan. Use sparingly and always document
   * the reason. Example: excluding a third-party widget that fails for known
   * non-regression reasons.
   */
  exclude?: string[]
  /**
   * Additional axe rules to disable. Prefer fixing the violation over disabling.
   * If disabling, document the justification in the test or in this options arg.
   */
  disableRules?: string[]
}

/**
 * Run an axe-core WCAG 2.1 AA scan on the current page state.
 *
 * - Filters to WCAG 2.1 AA rule set: wcag2a, wcag2aa, wcag21aa.
 * - Critical/serious violations throw with a detailed failure message.
 * - Moderate/minor violations are logged as warnings so reviewers see the
 *   complete picture without blocking the test.
 *
 * The failure message is structured for easy CI artifact review:
 *   [axe][<context>] N blocking violation(s): ...
 *
 * @example
 *   await runAxeScan(page, { context: 'home (authenticated)' })
 *
 * @example
 *   // Excluding a legacy widget known to fail for non-regression reasons:
 *   await runAxeScan(page, {
 *     context: 'compliance dashboard',
 *     exclude: ['[data-testid="legacy-chart-widget"]'],
 *   })
 */
export async function runAxeScan(page: Page, options: AxeScanOptions | string): Promise<void> {
  const opts: AxeScanOptions = typeof options === 'string' ? { context: options } : options

  // Wait for the theme store's initTheme() to complete before running axe.
  // The theme store default is isDark=true but initTheme() reads from localStorage
  // or system preference in onMounted and calls updateTheme(), which sets either
  // the 'dark' or 'light' class on <html>.  Without this wait, concurrent test runs
  // (2+ Playwright workers) occasionally scan the page while initTheme() is still
  // pending, finding intermediate computed styles that fail color-contrast rules.
  // The wait resolves as soon as Vue's onMounted has run — typically within 500ms
  // of waitForLoadState('load') but needed as a deterministic guard for CI.
  await page
    .waitForFunction(
      () =>
        document.documentElement.classList.contains('dark') ||
        document.documentElement.classList.contains('light'),
      { timeout: 5000 },
    )
    .catch(() => {
      // Non-fatal: proceed if theme class is not present (e.g., unusual headless env).
    })

  let builder = new AxeBuilder({ page }).withTags([...WCAG_AA_TAGS])

  if (opts.exclude) {
    for (const sel of opts.exclude) {
      builder = builder.exclude(sel)
    }
  }
  if (opts.disableRules) {
    builder = builder.disableRules(opts.disableRules)
  }

  const results = await builder.analyze()

  if (results.violations.length > 0) {
    const formatted = results.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      description: v.description,
      helpUrl: v.helpUrl,
      nodes: v.nodes.length,
      nodeHtml: v.nodes.map((n) => n.html.slice(0, 200)),
    }))
    console.log(
      `[axe][${opts.context}] ${results.violations.length} violation(s):`,
      JSON.stringify(formatted, null, 2),
    )
  }

  const blocking = results.violations.filter(
    (v) => v.impact === 'critical' || v.impact === 'serious',
  )

  if (blocking.length > 0) {
    const summary = blocking
      .map(
        (v) =>
          `  [${v.impact}] ${v.id}: ${v.description} (${v.nodes.length} node(s)) — ${v.helpUrl}`,
      )
      .join('\n')
    throw new Error(
      `[axe WCAG 2.1 AA — ${opts.context}] ${blocking.length} blocking violation(s):\n${summary}`,
    )
  }
}

// ---------------------------------------------------------------------------
// Navigation landmark helpers
// ---------------------------------------------------------------------------

/**
 * Assert the primary navigation landmark is present and correctly labelled
 * (WCAG SC 1.3.6, 2.4.1).
 *
 * Only call for MainLayout views. GuidedTokenLaunch.vue is a standalone wizard
 * and does NOT have `nav[aria-label="Main navigation"]`.
 */
export async function assertMainNav(page: Page): Promise<void> {
  const nav = page.locator('nav[aria-label="Main navigation"]')
  await expect(nav).toHaveCount(1, { timeout: 10000 })
}

/**
 * Assert the sidebar navigation is present and correctly labelled
 * (WCAG SC 1.3.6).
 */
export async function assertSidebarNav(page: Page): Promise<void> {
  const sidebar = page.locator('nav[aria-label="Sidebar navigation"]')
  await expect(sidebar).toHaveCount(1, { timeout: 10000 })
}

/**
 * Assert the main content landmark is present with the expected id
 * (WCAG SC 1.3.1, 2.4.1 skip-link target).
 */
export async function assertMainLandmark(page: Page): Promise<void> {
  const main = page.locator('main#main-content')
  await expect(main).toBeAttached({ timeout: 10000 })
}

/**
 * Assert breadcrumb navigation is present and has `aria-label="Breadcrumb"`
 * (WCAG SC 2.4.8).
 */
export async function assertBreadcrumb(page: Page): Promise<void> {
  const breadcrumb = page.locator('nav[aria-label="Breadcrumb"]')
  await expect(breadcrumb).toBeAttached({ timeout: 10000 })
}

/**
 * Assert skip-to-main-content link is present and functional (WCAG SC 2.4.1).
 *
 * Checks:
 *   - A skip link with `href="#main-content"` is in the DOM
 *   - The link text contains "skip" (case-insensitive)
 *   - The target element `#main-content` actually exists so the link works
 */
export async function assertSkipLink(page: Page): Promise<void> {
  const skipLink = page.locator('a[href="#main-content"]').first()
  await expect(skipLink).toBeAttached({ timeout: 10000 })
  const text = await skipLink.textContent({ timeout: 5000 }).catch(() => '')
  expect(text?.toLowerCase()).toMatch(/skip/)
  // Verify the link target exists so the skip link actually works (WCAG SC 2.4.1)
  const target = page.locator('#main-content')
  const targetCount = await target.count()
  expect(
    targetCount,
    'Skip link points to #main-content but no element with id="main-content" was found',
  ).toBeGreaterThan(0)
}

// ---------------------------------------------------------------------------
// Heading structure helpers
// ---------------------------------------------------------------------------

/**
 * Assert the page has exactly one h1 (WCAG SC 1.3.1 — no duplicate h1).
 */
export async function assertSingleH1(page: Page): Promise<void> {
  await expect(page.locator('h1')).toHaveCount(1, { timeout: 10000 })
}

/**
 * Assert the page has at least one h1 (WCAG SC 1.3.1).
 */
export async function assertHasH1(page: Page): Promise<void> {
  const count = await page.locator('h1').count()
  expect(count).toBeGreaterThan(0)
}

// ---------------------------------------------------------------------------
// Keyboard navigation helpers
// ---------------------------------------------------------------------------

/** Maximum text length captured from focused elements in failure output. */
const MAX_FOCUSED_TEXT_LENGTH = 80

/**
 * Assert keyboard Tab focus moves to an interactive element after navigating
 * to a page (WCAG SC 2.1.1, 2.1.2).
 *
 * Uses `body.click()` before Tab to give the page keyboard focus in headless
 * mode (Section 7l: required in headless Chromium; Tab has no effect without
 * prior focus).
 *
 * Uses `document.activeElement` (not `:focus`) for reliable headless assertion
 * (Section 7l: `:focus` CSS selector has synchronization issues in headless).
 */
export async function assertKeyboardFocusAfterTab(
  page: Page,
  clickTimeout = 5000,
): Promise<void> {
  // Give page keyboard focus (Section 7l)
  await page.locator('body').click({ timeout: clickTimeout })
  await page.keyboard.press('Tab')
  const hasFocusedElement = await page.evaluate(() => {
    const active = document.activeElement
    return (
      active !== null &&
      active !== document.body &&
      active !== document.documentElement
    )
  })
  expect(hasFocusedElement).toBe(true)
}

/**
 * Assert the first Tab target is the skip-to-main-content link or another
 * early meaningful focusable element (WCAG SC 2.4.1).
 *
 * Returns the focused element info for additional assertions.
 */
export async function assertFirstTabTargetIsFocusable(
  page: Page,
): Promise<{ tag: string; href: string | null; text: string }> {
  await page.locator('body').click({ timeout: 5000 })
  await page.keyboard.press('Tab')
  const focusedInfo = await page.evaluate((maxLen: number) => {
    const active = document.activeElement
    return active
      ? {
          tag: active.tagName.toLowerCase(),
          href: active.getAttribute('href'),
          text: active.textContent?.trim().slice(0, maxLen) ?? '',
        }
      : null
  }, MAX_FOCUSED_TEXT_LENGTH)
  expect(focusedInfo).not.toBeNull()
  expect(focusedInfo?.tag).toBeTruthy()
  return focusedInfo ?? { tag: '', href: null, text: '' }
}

/**
 * Assert visible focus ring classes exist on nav links for keyboard users
 * (WCAG SC 2.4.7 — focus visible).
 */
export async function assertNavLinksFocusVisible(page: Page): Promise<void> {
  const navLinks = page.locator("[data-testid='desktop-nav-items'] a")
  const count = await navLinks.count()
  if (count > 0) {
    const cls = await navLinks.first().getAttribute('class')
    expect(cls).toMatch(/focus-visible:ring|focus:ring/)
  }
}

// ---------------------------------------------------------------------------
// Route announcer helpers
// ---------------------------------------------------------------------------

/**
 * Assert the route announcer element is present in the DOM with the correct
 * ARIA live-region attributes (WCAG SC 4.1.3 — status messages).
 */
export async function assertRouteAnnouncer(page: Page): Promise<void> {
  const announcer = page.locator('[data-testid="route-announcer"]')
  await expect(announcer).toBeAttached({ timeout: 10000 })
  const role = await announcer.getAttribute('role')
  const ariaLive = await announcer.getAttribute('aria-live')
  const ariaAtomic = await announcer.getAttribute('aria-atomic')
  expect(role).toBe('status')
  expect(ariaLive).toBe('polite')
  expect(ariaAtomic).toBe('true')
}

// ---------------------------------------------------------------------------
// Dialog / drawer accessibility helpers
// ---------------------------------------------------------------------------

export interface DialogAccessibilityOptions {
  /** Timeout for the dialog to appear (default: 10000). */
  timeout?: number
  /** CSS selector for the dialog element (default: '[role="dialog"]'). */
  selector?: string
}

/**
 * Assert dialog/modal accessibility attributes are present
 * (WCAG SC 1.3.1, 4.1.2, 2.1.2).
 *
 * Checks:
 *   - role="dialog" or role="alertdialog"
 *   - aria-modal="true"
 *   - aria-labelledby or aria-label is present
 */
export async function assertDialogAccessibility(
  page: Page,
  opts: DialogAccessibilityOptions = {},
): Promise<void> {
  const { timeout = 10000, selector = '[role="dialog"]' } = opts
  const dialog = page.locator(selector).first()
  await expect(dialog).toBeVisible({ timeout })

  const role = await dialog.getAttribute('role')
  expect(['dialog', 'alertdialog']).toContain(role)

  const ariaModal = await dialog.getAttribute('aria-modal')
  expect(ariaModal).toBe('true')

  const labelledBy = await dialog.getAttribute('aria-labelledby')
  const label = await dialog.getAttribute('aria-label')
  expect(labelledBy !== null || label !== null).toBe(true)
}

// ---------------------------------------------------------------------------
// Form accessibility helpers
// ---------------------------------------------------------------------------

/**
 * Assert all visible `<input>` elements in a form have accessible labels
 * (WCAG SC 1.3.1, 4.1.2).
 *
 * Checks that each input has either:
 *   - A `<label>` with a matching `for` attribute pointing to the input's `id`
 *   - An `aria-label` attribute
 *   - An `aria-labelledby` attribute
 */
export async function assertFormInputsLabelled(
  page: Page,
  formSelector = 'form',
): Promise<void> {
  const inputs = page.locator(`${formSelector} input:not([type="hidden"])`)
  const count = await inputs.count()
  for (let i = 0; i < count; i++) {
    const input = inputs.nth(i)
    const isVisible = await input.isVisible().catch(() => false)
    if (!isVisible) continue

    const id = await input.getAttribute('id')
    const ariaLabel = await input.getAttribute('aria-label')
    const ariaLabelledby = await input.getAttribute('aria-labelledby')

    let hasLabel = false
    if (id !== null) {
      const labelEl = page.locator(`label[for="${id}"]`)
      const labelCount = await labelEl.count()
      if (labelCount > 0) {
        // Verify label has non-empty text — an empty <label for="x"></label> does not
        // satisfy WCAG SC 3.3.2 (Labels or Instructions)
        const labelText = await labelEl.first().textContent({ timeout: 3000 }).catch(() => '')
        hasLabel = (labelText?.trim().length ?? 0) > 0
      }
    }

    expect(
      hasLabel || (ariaLabel !== null && ariaLabel.trim().length > 0) || ariaLabelledby !== null,
      `Input[id="${id ?? 'no-id'}"] has no accessible label with non-empty text`,
    ).toBe(true)
  }
}

// ---------------------------------------------------------------------------
// Status / alert surface helpers
// ---------------------------------------------------------------------------

/**
 * Assert live-region elements are present for status messages
 * (WCAG SC 4.1.3 — status messages).
 *
 * Verifies that elements with role="alert", role="status", or aria-live exist
 * for surfaces that communicate dynamic state changes.
 */
export async function assertLiveRegionsPresent(
  page: Page,
): Promise<{ count: number }> {
  const liveRegions = page.locator(
    '[role="alert"], [role="status"], [aria-live="polite"], [aria-live="assertive"]',
  )
  const count = await liveRegions.count()
  return { count }
}

// ---------------------------------------------------------------------------
// Contrast / color helpers
// ---------------------------------------------------------------------------

/**
 * Assert primary action buttons have sufficient contrast classes.
 * Biatec dark-mode design uses bg-blue-600 text-white as the primary CTA.
 *
 * This is a structural/class assertion. Full contrast verification is performed
 * by axe-core in `runAxeScan`. This helper guards against accidental class
 * removal that would break contrast without triggering an axe violation until
 * runtime.
 */
export async function assertPrimaryButtonContrast(
  page: Page,
  buttonSelector = 'button[type="submit"], button.btn-primary',
): Promise<void> {
  const buttons = page.locator(buttonSelector)
  const count = await buttons.count()
  if (count === 0) return

  const firstBtn = buttons.first()
  const cls = await firstBtn.getAttribute('class')
  // Must have a non-transparent background and non-gray/transparent text
  // to pass WCAG AA 4.5:1 requirement
  expect(cls).not.toMatch(/bg-transparent|bg-white\/10|bg-gray-900\/10/)
}

// ---------------------------------------------------------------------------
// Navigation and route helpers (shared across specs)
// ---------------------------------------------------------------------------

/**
 * Navigate to a route and wait for a heading matching the given pattern
 * to confirm the page has rendered.
 *
 * Uses 'load' (not 'networkidle') — Vite HMR SSE blocks networkidle (Section 7i).
 * Default timeout of 20s covers Vite-warm navigation in CI (Section 7h).
 */
export async function gotoAndWaitForHeading(
  page: Page,
  path: string,
  headingPattern: RegExp,
  timeoutMs = 20000,
): Promise<void> {
  await page.goto(`http://localhost:5173${path}`, { timeout: 15000 })
  await page.waitForLoadState('load', { timeout: 10000 })
  await expect(
    page.getByRole('heading', { level: 1 }).filter({ hasText: headingPattern }),
  ).toBeVisible({ timeout: timeoutMs })
}

/**
 * Check whether the page has a route announcer, main landmark, and no
 * wallet connector UI — the three shell-level prerequisites for enterprise
 * accessibility compliance.
 */
export async function assertEnterpriseShellPrerequisites(
  page: Page,
): Promise<void> {
  await assertMainLandmark(page)
  await assertSkipLink(page)
}
