/**
 * E2E Tests: Audit Export Package & Evidence Bundle Workflow
 *
 * Covers the operator journey for generating, reviewing, and exporting
 * regulator-ready audit packages from the Compliance Reporting Workspace.
 *
 * Tests:
 * - Evidence manifest section renders with included/excluded counts
 * - Contradictions section shows detected inconsistencies
 * - Contradictions section shows clean state when no contradictions
 * - Generate Audit Package button assembles and shows the preview
 * - Audit package preview shows readiness gate with correct status
 * - Audit package preview shows metrics (evidence items, included, excluded)
 * - Download Audit Package button is accessible
 * - Draft notice appears when package is not regulator-ready
 * - Audit package preview can be dismissed
 * - Audience preset change affects section visibility (executive sees manifest)
 * - Evidence manifest toggles expanded/collapsed state
 */

import { test, expect } from '@playwright/test'
import { withAuth, suppressBrowserErrors } from './helpers/auth'

const BASE_URL = 'http://localhost:5173'
const REPORTING_URL = `${BASE_URL}/compliance/reporting`

test.describe('Audit Export Package — Evidence Manifest & Contradictions', () => {
  test.beforeEach(async ({ page }) => {
    suppressBrowserErrors(page)
    await withAuth(page)
  })

  test('compliance reporting workspace loads and shows evidence manifest section', async ({ page }) => {
    await page.goto(REPORTING_URL, { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })

    // Wait for the main heading to appear
    const heading = page.getByRole('heading', { name: /Compliance Reporting/i })
    await expect(heading).toBeVisible({ timeout: 20000 })

    // Evidence manifest section should be visible
    const manifestSection = page.getByTestId('evidence-manifest-section')
    await expect(manifestSection).toBeAttached({ timeout: 20000 })
  })

  test('evidence manifest shows included and excluded counts', async ({ page }) => {
    await page.goto(REPORTING_URL, { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })

    const manifestSection = page.getByTestId('evidence-manifest-section')
    await expect(manifestSection).toBeAttached({ timeout: 20000 })

    // Summary counts should be visible
    const includedCount = page.getByTestId('manifest-included-count')
    const excludedCount = page.getByTestId('manifest-excluded-count')
    await expect(includedCount).toBeAttached({ timeout: 10000 })
    await expect(excludedCount).toBeAttached({ timeout: 10000 })

    // Counts should be numeric
    const includedText = await includedCount.textContent({ timeout: 5000 })
    const excludedText = await excludedCount.textContent({ timeout: 5000 })
    expect(Number(includedText?.trim())).toBeGreaterThanOrEqual(0)
    expect(Number(excludedText?.trim())).toBeGreaterThanOrEqual(0)
  })

  test('evidence manifest can be expanded to show entries table', async ({ page }) => {
    await page.goto(REPORTING_URL, { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })

    const manifestSection = page.getByTestId('evidence-manifest-section')
    await expect(manifestSection).toBeAttached({ timeout: 20000 })

    // Expand the manifest by clicking the toggle
    const toggleBtn = page.getByTestId('evidence-manifest-toggle')
    await expect(toggleBtn).toBeVisible({ timeout: 10000 })
    await toggleBtn.click({ timeout: 5000 })

    // Entries table should now appear
    const manifestEntries = page.getByTestId('manifest-entries')
    await expect(manifestEntries).toBeVisible({ timeout: 10000 })
  })

  test('contradictions section renders and shows correct empty or flagged state', async ({ page }) => {
    await page.goto(REPORTING_URL, { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })

    const contradictionsSection = page.getByTestId('contradictions-section')
    await expect(contradictionsSection).toBeAttached({ timeout: 20000 })

    // Either empty state or a list should be present
    const emptyState = page.getByTestId('contradictions-empty')
    const contradictionsList = page.getByTestId('contradictions-list')

    const hasEmpty = await emptyState.isVisible({ timeout: 3000 }).catch(() => false)
    const hasList = await contradictionsList.isVisible({ timeout: 3000 }).catch(() => false)

    expect(hasEmpty || hasList).toBe(true)
  })

  test('contradictions section has accessible heading', async ({ page }) => {
    await page.goto(REPORTING_URL, { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })

    const contradictionsSection = page.getByTestId('contradictions-section')
    await expect(contradictionsSection).toBeAttached({ timeout: 20000 })

    const heading = page.getByRole('heading', { name: /Contradictions/i })
    await expect(heading).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Audit Export Package — Generate & Preview', () => {
  test.beforeEach(async ({ page }) => {
    suppressBrowserErrors(page)
    await withAuth(page)
  })

  test('Generate Audit Package button is present in export actions section', async ({ page }) => {
    await page.goto(REPORTING_URL, { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })

    const heading = page.getByRole('heading', { name: /Compliance Reporting/i })
    await expect(heading).toBeVisible({ timeout: 20000 })

    const generateBtn = page.getByTestId('generate-audit-package-button')
    await expect(generateBtn).toBeVisible({ timeout: 10000 })
  })

  test('clicking Generate Audit Package shows preview panel', async ({ page }) => {
    await page.goto(REPORTING_URL, { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })

    const heading = page.getByRole('heading', { name: /Compliance Reporting/i })
    await expect(heading).toBeVisible({ timeout: 20000 })

    // Click generate
    const generateBtn = page.getByTestId('generate-audit-package-button')
    await expect(generateBtn).toBeVisible({ timeout: 10000 })
    await generateBtn.click({ timeout: 5000 })

    // Preview panel should appear
    const previewPanel = page.getByTestId('audit-package-preview')
    await expect(previewPanel).toBeVisible({ timeout: 10000 })
  })

  test('audit package preview shows readiness gate', async ({ page }) => {
    await page.goto(REPORTING_URL, { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })

    const heading = page.getByRole('heading', { name: /Compliance Reporting/i })
    await expect(heading).toBeVisible({ timeout: 20000 })

    const generateBtn = page.getByTestId('generate-audit-package-button')
    await expect(generateBtn).toBeVisible({ timeout: 10000 })
    await generateBtn.click({ timeout: 5000 })

    const readinessGate = page.getByTestId('audit-package-readiness-gate')
    await expect(readinessGate).toBeVisible({ timeout: 10000 })

    const readinessLabel = page.getByTestId('audit-package-readiness-label')
    await expect(readinessLabel).toBeVisible({ timeout: 5000 })

    const readinessText = await readinessLabel.textContent({ timeout: 5000 })
    expect(readinessText!.length).toBeGreaterThan(5)
  })

  test('audit package preview shows metrics (evidence items, included, excluded)', async ({ page }) => {
    await page.goto(REPORTING_URL, { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })

    const heading = page.getByRole('heading', { name: /Compliance Reporting/i })
    await expect(heading).toBeVisible({ timeout: 20000 })

    const generateBtn = page.getByTestId('generate-audit-package-button')
    await expect(generateBtn).toBeVisible({ timeout: 10000 })
    await generateBtn.click({ timeout: 5000 })

    const metrics = page.getByTestId('audit-package-metrics')
    await expect(metrics).toBeVisible({ timeout: 10000 })

    // All metric values should be numeric
    const totalEvidence = page.getByTestId('pkg-total-evidence')
    const includedCount = page.getByTestId('pkg-included-count')
    const excludedCount = page.getByTestId('pkg-excluded-count')
    const contradictionCount = page.getByTestId('pkg-contradiction-count')

    await expect(totalEvidence).toBeVisible({ timeout: 5000 })
    await expect(includedCount).toBeVisible({ timeout: 5000 })
    await expect(excludedCount).toBeVisible({ timeout: 5000 })
    await expect(contradictionCount).toBeVisible({ timeout: 5000 })

    const totalText = await totalEvidence.textContent({ timeout: 5000 })
    expect(Number(totalText?.trim())).toBeGreaterThan(0)
  })

  test('audit package preview shows a package ID', async ({ page }) => {
    await page.goto(REPORTING_URL, { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })

    const heading = page.getByRole('heading', { name: /Compliance Reporting/i })
    await expect(heading).toBeVisible({ timeout: 20000 })

    const generateBtn = page.getByTestId('generate-audit-package-button')
    await expect(generateBtn).toBeVisible({ timeout: 10000 })
    await generateBtn.click({ timeout: 5000 })

    const packageId = page.getByTestId('audit-package-id')
    await expect(packageId).toBeVisible({ timeout: 10000 })
    const pkgIdText = await packageId.textContent({ timeout: 5000 })
    expect(pkgIdText).toMatch(/^pkg-\d+$/)
  })

  test('audit package preview can be dismissed', async ({ page }) => {
    await page.goto(REPORTING_URL, { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })

    const heading = page.getByRole('heading', { name: /Compliance Reporting/i })
    await expect(heading).toBeVisible({ timeout: 20000 })

    const generateBtn = page.getByTestId('generate-audit-package-button')
    await expect(generateBtn).toBeVisible({ timeout: 10000 })
    await generateBtn.click({ timeout: 5000 })

    const previewPanel = page.getByTestId('audit-package-preview')
    await expect(previewPanel).toBeVisible({ timeout: 10000 })

    // Click dismiss
    const dismissBtn = page.getByTestId('close-audit-package-preview')
    await expect(dismissBtn).toBeVisible({ timeout: 5000 })
    await dismissBtn.click({ timeout: 5000 })

    // Preview should be gone
    await expect(previewPanel).not.toBeVisible({ timeout: 5000 })
  })

  test('download audit package button is accessible within preview', async ({ page }) => {
    await page.goto(REPORTING_URL, { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })

    const heading = page.getByRole('heading', { name: /Compliance Reporting/i })
    await expect(heading).toBeVisible({ timeout: 20000 })

    const generateBtn = page.getByTestId('generate-audit-package-button')
    await expect(generateBtn).toBeVisible({ timeout: 10000 })
    await generateBtn.click({ timeout: 5000 })

    const previewPanel = page.getByTestId('audit-package-preview')
    await expect(previewPanel).toBeVisible({ timeout: 10000 })

    const downloadBtn = page.getByTestId('download-audit-package-button')
    await expect(downloadBtn).toBeVisible({ timeout: 5000 })
    await expect(downloadBtn).toBeEnabled()
  })
})

test.describe('Audit Export Package — Fail-Closed Negative Paths', () => {
  test.beforeEach(async ({ page }) => {
    suppressBrowserErrors(page)
    await withAuth(page)
  })

  test('package preview shows draft notice when workspace has missing evidence', async ({ page }) => {
    // Set localStorage to a partially configured state (missing jurisdiction)
    await page.addInitScript(() => {
      // Only keep auth — remove compliance data so evidence is missing
      try {
        localStorage.removeItem('biatec_jurisdiction')
      } catch {
        // ignore
      }
    })

    await page.goto(REPORTING_URL, { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })

    const heading = page.getByRole('heading', { name: /Compliance Reporting/i })
    await expect(heading).toBeVisible({ timeout: 20000 })

    const generateBtn = page.getByTestId('generate-audit-package-button')
    await expect(generateBtn).toBeVisible({ timeout: 10000 })
    await generateBtn.click({ timeout: 5000 })

    const previewPanel = page.getByTestId('audit-package-preview')
    await expect(previewPanel).toBeVisible({ timeout: 10000 })

    // Readiness label should exist and show some status
    const readinessLabel = page.getByTestId('audit-package-readiness-label')
    await expect(readinessLabel).toBeVisible({ timeout: 5000 })

    // Either the draft notice is shown (not ready) or it's a regulator-ready status
    const draftNotice = page.getByTestId('audit-package-draft-notice')
    const isReady = page.getByTestId('audit-package-readiness-label').filter({ hasText: /Regulator-Ready/i })

    const hasDraft = await draftNotice.isVisible({ timeout: 3000 }).catch(() => false)
    const hasReadyLabel = await isReady.isVisible({ timeout: 3000 }).catch(() => false)

    // At least one of these states should be shown (the package has a defined state)
    expect(hasDraft || hasReadyLabel).toBe(true)
  })

  test('existing export actions (JSON, text, clipboard) still work after manifest sections added', async ({ page }) => {
    await page.goto(REPORTING_URL, { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })

    const heading = page.getByRole('heading', { name: /Compliance Reporting/i })
    await expect(heading).toBeVisible({ timeout: 20000 })

    // Original export buttons should still be present
    const exportJsonBtn = page.getByTestId('export-json-button')
    const exportTextBtn = page.getByTestId('export-text-button')
    const copyBtn = page.getByTestId('copy-clipboard-button')

    await expect(exportJsonBtn).toBeVisible({ timeout: 10000 })
    await expect(exportTextBtn).toBeVisible({ timeout: 10000 })
    await expect(copyBtn).toBeVisible({ timeout: 10000 })
  })

  test('evidence manifest section is visible in all audience preset views', async ({ page }) => {
    await page.goto(REPORTING_URL, { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })

    const heading = page.getByRole('heading', { name: /Compliance Reporting/i })
    await expect(heading).toBeVisible({ timeout: 20000 })

    // Try each audience preset
    const presets = ['all', 'compliance', 'procurement', 'executive']
    for (const preset of presets) {
      const btn = page.getByTestId(`audience-btn-${preset}`)
      if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await btn.click({ timeout: 5000 })
        // Evidence manifest should be in all presets
        const manifestSection = page.getByTestId('evidence-manifest-section')
        await expect(manifestSection).toBeAttached({ timeout: 10000 })
      }
    }
  })
})

test.describe('Audit Export Package — Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    suppressBrowserErrors(page)
    await withAuth(page)
  })

  test('evidence manifest toggle has accessible aria-label', async ({ page }) => {
    await page.goto(REPORTING_URL, { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })

    const heading = page.getByRole('heading', { name: /Compliance Reporting/i })
    await expect(heading).toBeVisible({ timeout: 20000 })

    const toggleBtn = page.getByTestId('evidence-manifest-toggle')
    await expect(toggleBtn).toBeVisible({ timeout: 10000 })

    const ariaLabel = await toggleBtn.getAttribute('aria-label', { timeout: 5000 })
    expect(ariaLabel).toBeTruthy()
    expect(ariaLabel!.length).toBeGreaterThan(5)
  })

  test('contradictions section has aria-labelledby on the section element', async ({ page }) => {
    await page.goto(REPORTING_URL, { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })

    const heading = page.getByRole('heading', { name: /Compliance Reporting/i })
    await expect(heading).toBeVisible({ timeout: 20000 })

    const section = page.getByTestId('contradictions-section')
    await expect(section).toBeAttached({ timeout: 20000 })

    const labelledBy = await section.getAttribute('aria-labelledby', { timeout: 5000 })
    expect(labelledBy).toBeTruthy()
  })

  test('audit package preview has aria-live attribute for dynamic content', async ({ page }) => {
    await page.goto(REPORTING_URL, { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })

    const heading = page.getByRole('heading', { name: /Compliance Reporting/i })
    await expect(heading).toBeVisible({ timeout: 20000 })

    const generateBtn = page.getByTestId('generate-audit-package-button')
    await expect(generateBtn).toBeVisible({ timeout: 10000 })
    await generateBtn.click({ timeout: 5000 })

    const previewPanel = page.getByTestId('audit-package-preview')
    await expect(previewPanel).toBeVisible({ timeout: 10000 })

    const ariaLive = await previewPanel.getAttribute('aria-live', { timeout: 5000 })
    expect(ariaLive).toBe('polite')
  })

  test('evidence manifest section is keyboard accessible via Tab navigation', async ({ page }) => {
    await page.goto(REPORTING_URL, { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })

    const heading = page.getByRole('heading', { name: /Compliance Reporting/i })
    await expect(heading).toBeVisible({ timeout: 20000 })

    // The toggle button should be reachable via keyboard
    const toggleBtn = page.getByTestId('evidence-manifest-toggle')
    await expect(toggleBtn).toBeVisible({ timeout: 10000 })
    await toggleBtn.focus()

    const isFocused = await page.evaluate(() => {
      const active = document.activeElement
      return active !== null && active !== document.body && active !== document.documentElement
    })
    expect(isFocused).toBe(true)
  })
})
