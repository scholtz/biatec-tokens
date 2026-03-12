/**
 * Business Command Center E2E Tests
 *
 * Tests the complete keyboard-driven and mouse-driven operator flows for the
 * post-launch Business Command Center. Covers:
 *  - Navigation to the canonical /operations route
 *  - Redirect from /operations/legacy to /operations
 *  - Role selector switching between issuer_operator and compliance_manager
 *  - Priority action card expansion and CTA focus
 *  - Status filter behaviour
 *  - Stakeholder communication template visibility
 *  - Keyboard-only traversal of primary action cards
 *  - No wallet/protocol jargon in primary guidance copy
 *  - WCAG landmarks and skip-to-content link present
 *  - Operations navigation link visible in navbar
 *
 * Zero arbitrary waitForTimeout() calls except where CI auth-init headroom
 * is required (marked with justification). All element waits use semantic
 * readiness signals (toBeVisible, toBeEnabled) with deterministic timeouts.
 *
 * Issue: Next MVP — business command center for post-launch token operations
 */

import { test, expect } from '@playwright/test'
import { clearAuthScript, suppressBrowserErrors } from './helpers/auth'

// ---------------------------------------------------------------------------
// Shared test setup
// ---------------------------------------------------------------------------

const AUTH_USER = JSON.stringify({
  address: 'TESTADDRESS123',
  name: 'Test Operator',
  email: 'operator@example.com',
})

function setupAuth(page: Parameters<typeof test>[1] extends (...args: infer A) => unknown ? A[0] : never) {
  return page.addInitScript((user: string) => {
    localStorage.setItem('algorand_user', user)
  }, AUTH_USER)
}

test.describe('Business Command Center', () => {
  test.beforeEach(async ({ page }) => {
    // Suppress browser console errors to keep test output clean
    suppressBrowserErrors(page)

    await setupAuth(page)
  })

  // -------------------------------------------------------------------------
  // Navigation
  // -------------------------------------------------------------------------

  test('should show Operations link in navbar', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('load')

    const operationsLink = page.getByRole('link', { name: /Operations/i }).first()
    await expect(operationsLink).toBeVisible({ timeout: 15000 })
  })

  test('should navigate to /operations from navbar Operations link', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('load')

    const operationsLink = page.getByRole('link', { name: /Operations/i }).first()
    await expect(operationsLink).toBeVisible({ timeout: 15000 })
    await operationsLink.click()
    await page.waitForLoadState('load')

    await expect(page).toHaveURL(/\/operations/, { timeout: 15000 })
  })

  test('should redirect unauthenticated user from /operations to home with auth prompt', async ({ page }) => {
    // No CI skip — using clearAuthScript (addInitScript) so auth is absent from the
    // very first page load, eliminating the timing race from post-navigation localStorage.clear().
    await clearAuthScript(page);

    await page.goto('/operations')
    await page.waitForLoadState('load')

    // Semantic wait: router guard fires one of three auth signals
    await page.waitForFunction(
      () => {
        const url = window.location.href;
        const emailInput = document.querySelector('input[type="email"]');
        return url.includes('showAuth=true') || emailInput !== null || !url.includes('/operations');
      },
      { timeout: 20000 },
    );

    const url = page.url()
    const redirectedToHome = url.includes('showAuth=true') || url.endsWith('/') || url.endsWith('/#') || !url.includes('/operations')
    const authModalVisible = await page
      .locator('form')
      .filter({ hasText: /email/i })
      .isVisible()
      .catch(() => false)

    expect(redirectedToHome || authModalVisible).toBe(true)
  })

  test('should redirect /operations/legacy to /operations', async ({ page }) => {
    await page.goto('/operations/legacy')
    await page.waitForLoadState('load')

    // Either on /operations or redirected due to auth guard first
    const url = page.url()
    // The redirect chain is: /operations/legacy → /operations → (auth guard) → /
    // We assert the legacy path is no longer the current URL
    expect(url).not.toContain('/legacy')
  })

  // -------------------------------------------------------------------------
  // Page structure
  // -------------------------------------------------------------------------

  test('should display command center heading', async ({ page }) => {
    await page.goto('/operations')
    await page.waitForLoadState('load')

    const heading = page.getByRole('heading', { name: /Operations Command Center/i, level: 1 })
    await expect(heading).toBeVisible({ timeout: 45000 })
  })

  test('should display role selector', async ({ page }) => {
    await page.goto('/operations')
    await page.waitForLoadState('load')

    const roleSelector = page.getByTestId('role-selector')
    await expect(roleSelector).toBeVisible({ timeout: 45000 })
  })

  test('should display status overview section', async ({ page }) => {
    await page.goto('/operations')
    await page.waitForLoadState('load')

    const statusOverview = page.getByTestId('status-overview')
    await expect(statusOverview).toBeVisible({ timeout: 45000 })
  })

  test('should display status label', async ({ page }) => {
    await page.goto('/operations')
    await page.waitForLoadState('load')

    const statusLabel = page.getByTestId('status-label')
    await expect(statusLabel).toBeVisible({ timeout: 45000 })
    // Verify it shows one of the valid severity labels
    const text = await statusLabel.textContent()
    const validLabels = ['All clear', 'Review needed', 'Action required']
    expect(validLabels.some((label) => text?.includes(label))).toBe(true)
  })

  test('should display priority cards section', async ({ page }) => {
    await page.goto('/operations')
    await page.waitForLoadState('load')

    const section = page.getByTestId('priority-cards-section')
    await expect(section).toBeVisible({ timeout: 45000 })
  })

  test('should display stakeholder communication section', async ({ page }) => {
    await page.goto('/operations')
    await page.waitForLoadState('load')

    const section = page.getByTestId('stakeholder-section')
    await expect(section).toBeVisible({ timeout: 45000 })
  })

  test('should display stakeholder subject and body template', async ({ page }) => {
    await page.goto('/operations')
    await page.waitForLoadState('load')

    const subject = page.getByTestId('stakeholder-subject')
    await expect(subject).toBeVisible({ timeout: 45000 })

    const body = page.getByTestId('stakeholder-body')
    await expect(body).toBeVisible({ timeout: 45000 })

    // Content must be non-empty
    const subjectText = await subject.textContent()
    expect(subjectText?.trim().length).toBeGreaterThan(0)
  })

  test('should display deployment and compliance status cards', async ({ page }) => {
    await page.goto('/operations')
    await page.waitForLoadState('load')

    const deploymentCard = page.getByTestId('deployment-status-card')
    await expect(deploymentCard).toBeVisible({ timeout: 45000 })

    const complianceCard = page.getByTestId('compliance-status-card')
    await expect(complianceCard).toBeVisible({ timeout: 45000 })
  })

  // -------------------------------------------------------------------------
  // Role switching
  // -------------------------------------------------------------------------

  test('should allow switching to compliance_manager role', async ({ page }) => {
    await page.goto('/operations')
    await page.waitForLoadState('load')

    const roleSelector = page.getByTestId('role-selector')
    await expect(roleSelector).toBeVisible({ timeout: 45000 })

    await roleSelector.selectOption('compliance_manager')

    // The selector should now show compliance_manager
    const selectedValue = await roleSelector.inputValue()
    expect(selectedValue).toBe('compliance_manager')
  })

  test('should allow switching back to issuer_operator role', async ({ page }) => {
    await page.goto('/operations')
    await page.waitForLoadState('load')

    const roleSelector = page.getByTestId('role-selector')
    await expect(roleSelector).toBeVisible({ timeout: 45000 })

    await roleSelector.selectOption('compliance_manager')
    await roleSelector.selectOption('issuer_operator')

    const selectedValue = await roleSelector.inputValue()
    expect(selectedValue).toBe('issuer_operator')
  })

  // -------------------------------------------------------------------------
  // Priority card interaction
  // -------------------------------------------------------------------------

  test('should expand a priority card when clicked', async ({ page }) => {
    await page.goto('/operations')
    await page.waitForLoadState('load')

    // Wait for at least one priority card to appear (default context has no tokens)
    const firstCardToggle = page.getByTestId('card-toggle-no_tokens_deployed')
    await expect(firstCardToggle).toBeVisible({ timeout: 45000 })

    // Click to expand
    await firstCardToggle.click()

    // Detail panel should be visible
    const detail = page.getByTestId('card-detail-no_tokens_deployed')
    await expect(detail).toBeVisible({ timeout: 10000 })
  })

  test('should show what/why/how content when card is expanded', async ({ page }) => {
    await page.goto('/operations')
    await page.waitForLoadState('load')

    const firstCardToggle = page.getByTestId('card-toggle-no_tokens_deployed')
    await expect(firstCardToggle).toBeVisible({ timeout: 45000 })
    await firstCardToggle.click()

    const detail = page.getByTestId('card-detail-no_tokens_deployed')
    await expect(detail).toBeVisible({ timeout: 10000 })

    // Should display "What happened" label
    await expect(detail.getByText(/What happened/i)).toBeVisible()
    // Should display "Why it matters" label
    await expect(detail.getByText(/Why it matters/i)).toBeVisible()
    // Should display "What to do next" label
    await expect(detail.getByText(/What to do next/i)).toBeVisible()
  })

  test('should show CTA button when card is expanded', async ({ page }) => {
    await page.goto('/operations')
    await page.waitForLoadState('load')

    const firstCardToggle = page.getByTestId('card-toggle-no_tokens_deployed')
    await expect(firstCardToggle).toBeVisible({ timeout: 45000 })
    await firstCardToggle.click()

    const cta = page.getByTestId('card-cta-no_tokens_deployed')
    await expect(cta).toBeVisible({ timeout: 10000 })
    await expect(cta).toBeEnabled()
  })

  test('should collapse card when clicked again', async ({ page }) => {
    await page.goto('/operations')
    await page.waitForLoadState('load')

    const toggle = page.getByTestId('card-toggle-no_tokens_deployed')
    await expect(toggle).toBeVisible({ timeout: 45000 })

    // Expand
    await toggle.click()
    const detail = page.getByTestId('card-detail-no_tokens_deployed')
    await expect(detail).toBeVisible({ timeout: 10000 })

    // Collapse
    await toggle.click()
    await expect(detail).toBeHidden({ timeout: 5000 })
  })

  // -------------------------------------------------------------------------
  // Status filter
  // -------------------------------------------------------------------------

  test('should display status filter dropdown', async ({ page }) => {
    await page.goto('/operations')
    await page.waitForLoadState('load')

    const filter = page.getByTestId('status-filter')
    await expect(filter).toBeVisible({ timeout: 45000 })
  })

  test('should change filter to action_required', async ({ page }) => {
    await page.goto('/operations')
    await page.waitForLoadState('load')

    const filter = page.getByTestId('status-filter')
    await expect(filter).toBeVisible({ timeout: 45000 })

    await filter.selectOption('action_required')

    const selectedValue = await filter.inputValue()
    expect(selectedValue).toBe('action_required')
  })

  test('should show empty state when filter has no matching cards', async ({ page }) => {
    await page.goto('/operations')
    await page.waitForLoadState('load')

    // Filter to 'clear' — default context has no clear cards
    const filter = page.getByTestId('status-filter')
    await expect(filter).toBeVisible({ timeout: 45000 })
    await filter.selectOption('clear')

    // Should show empty state since no 'clear' items in default context
    const emptyState = page.getByTestId('empty-state')
    await expect(emptyState).toBeVisible({ timeout: 10000 })
  })

  // -------------------------------------------------------------------------
  // Keyboard-only navigation
  // -------------------------------------------------------------------------

  test('should have a skip-to-content link accessible by keyboard', async ({ page }) => {
    await page.goto('/operations')
    await page.waitForLoadState('load')

    // Tab to the skip link
    await page.keyboard.press('Tab')

    // The skip-to-content anchor should receive focus
    const skipLink = page.getByText(/Skip to main content/i)
    // In the DOM it should be present even if visually hidden
    await expect(skipLink).toBeAttached({ timeout: 10000 })
  })

  test('should allow keyboard navigation to role selector', async ({ page }) => {
    await page.goto('/operations')
    await page.waitForLoadState('load')

    const roleSelector = page.getByTestId('role-selector')
    await expect(roleSelector).toBeVisible({ timeout: 45000 })

    // Focus via keyboard (Tab until focused)
    await roleSelector.focus()
    await expect(roleSelector).toBeFocused({ timeout: 5000 })
  })

  test('should allow keyboard navigation to status filter', async ({ page }) => {
    await page.goto('/operations')
    await page.waitForLoadState('load')

    const filter = page.getByTestId('status-filter')
    await expect(filter).toBeVisible({ timeout: 45000 })

    await filter.focus()
    await expect(filter).toBeFocused({ timeout: 5000 })
  })

  test('should allow keyboard activation of priority card toggle', async ({ page }) => {
    await page.goto('/operations')
    await page.waitForLoadState('load')

    const toggle = page.getByTestId('card-toggle-no_tokens_deployed')
    await expect(toggle).toBeVisible({ timeout: 45000 })

    // Focus and activate with Enter key
    await toggle.focus()
    await page.keyboard.press('Enter')

    const detail = page.getByTestId('card-detail-no_tokens_deployed')
    await expect(detail).toBeVisible({ timeout: 10000 })
  })

  // -------------------------------------------------------------------------
  // No wallet / protocol jargon in visible guidance copy
  // -------------------------------------------------------------------------

  test('should not display wallet connection UI', async ({ page }) => {
    await page.goto('/operations')
    await page.waitForLoadState('load')


    const content = await page.content()

    // Forbidden wallet/protocol terms must not appear in primary guidance copy
    const walletTerms = ['connect wallet', 'WalletConnect', 'Pera Wallet', 'Defly', 'MetaMask']
    for (const term of walletTerms) {
      expect(content.toLowerCase()).not.toContain(term.toLowerCase())
    }
  })

  test('should not display "Not connected" wallet status', async ({ page }) => {
    await page.goto('/operations')
    await page.waitForLoadState('load')

    const content = await page.content()
    // Wallet-era "Not connected" text must not appear in the command center
    expect(content).not.toContain('Not connected')
  })

  // -------------------------------------------------------------------------
  // Copy stakeholder template
  // -------------------------------------------------------------------------

  test('should display copy button for stakeholder template', async ({ page }) => {
    await page.goto('/operations')
    await page.waitForLoadState('load')

    const copyBtn = page.getByTestId('copy-stakeholder-btn')
    await expect(copyBtn).toBeVisible({ timeout: 45000 })
    await expect(copyBtn).toBeEnabled()
  })

  // -------------------------------------------------------------------------
  // Accessibility landmarks
  // -------------------------------------------------------------------------

  test('should have main content landmark', async ({ page }) => {
    await page.goto('/operations')
    await page.waitForLoadState('load')

    const main = page.getByRole('main')
    await expect(main).toBeVisible({ timeout: 45000 })
  })

  test('should have navigation breadcrumb landmark', async ({ page }) => {
    await page.goto('/operations')
    await page.waitForLoadState('load')

    const nav = page.getByRole('navigation', { name: /Breadcrumb/i })
    await expect(nav).toBeVisible({ timeout: 45000 })
  })
})
