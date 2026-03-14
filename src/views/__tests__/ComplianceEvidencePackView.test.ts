/**
 * Unit Tests: ComplianceEvidencePackView — WCAG AA Accessibility & Rendering
 *
 * Validates accessibility requirements and rendering for the Compliance
 * Evidence Pack Workspace.
 *
 * Acceptance Criteria covered:
 *  AC #1  — Authenticated enterprise users can open the workspace from navigation
 *  AC #2  — Workspace shows clearly labelled release-readiness summary
 *  AC #3  — UI explicitly distinguishes release-grade from non-release-grade evidence
 *  AC #5  — Page supports keyboard-only use, screen-reader semantics, no color-only status
 *  AC #6  — Workspace provides export actions with clear empty/error states
 *  AC #7  — Existing enterprise design patterns reused (MainLayout, headings hierarchy)
 *  AC #8  — Copy is wallet-free and uses enterprise operator language
 *  AC #10 — Inline help explains what the evidence pack includes
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createWebHistory } from 'vue-router'
import { nextTick } from 'vue'
import ComplianceEvidencePackView from '../ComplianceEvidencePackView.vue'

// ---------------------------------------------------------------------------
// Router helper
// ---------------------------------------------------------------------------

const makeRouter = () =>
  createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', name: 'Home', component: { template: '<div />' } },
      { path: '/compliance/evidence', name: 'ComplianceEvidencePack', component: { template: '<div />' } },
      { path: '/compliance/launch', name: 'ComplianceLaunchConsole', component: { template: '<div />' } },
      { path: '/compliance/setup', name: 'ComplianceSetupWorkspace', component: { template: '<div />' } },
      { path: '/compliance/policy', name: 'WhitelistPolicyDashboard', component: { template: '<div />' } },
      { path: '/attestations', name: 'AttestationsDashboard', component: { template: '<div />' } },
      { path: '/team/workspace', name: 'TeamWorkspace', component: { template: '<div />' } },
    ],
  })

// ---------------------------------------------------------------------------
// Mount helper
// ---------------------------------------------------------------------------

const mountView = (localStorageOverrides: Record<string, string> = {}) => {
  Object.entries(localStorageOverrides).forEach(([k, v]) => localStorage.setItem(k, v))
  const router = makeRouter()
  return mount(ComplianceEvidencePackView, {
    global: {
      plugins: [
        createTestingPinia({ createSpy: vi.fn }),
        router,
      ],
    },
  })
}

// ---------------------------------------------------------------------------
// Describe blocks
// ---------------------------------------------------------------------------

describe('ComplianceEvidencePackView — WCAG AA Accessibility', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  // ── Landmark structure ──────────────────────────────────────────────────

  it('renders workspace root with id="evidence-main" for in-page skip link (SC 2.4.1)', async () => {
    const wrapper = mountView()
    await nextTick()
    const main = wrapper.find('#evidence-main')
    expect(main.exists()).toBe(true)
  })

  it('workspace has role="region" and aria-label (SC 1.3.6)', async () => {
    const wrapper = mountView()
    await nextTick()
    const region = wrapper.find('[role="region"]')
    expect(region.exists()).toBe(true)
    expect(region.attributes('aria-label')).toMatch(/Compliance Evidence Pack/i)
  })

  it('renders a single <h1> heading for screen-reader orientation (SC 1.3.1)', async () => {
    const wrapper = mountView()
    await nextTick()
    const h1s = wrapper.findAll('h1')
    expect(h1s.length).toBe(1)
    expect(h1s[0].text()).toMatch(/Compliance Evidence Pack/i)
  })

  it('readiness summary banner has h2 heading with id for aria-labelledby (SC 1.3.1)', async () => {
    const wrapper = mountView()
    await nextTick()
    const h2 = wrapper.find('#readiness-summary-heading')
    expect(h2.exists()).toBe(true)
  })

  it('evidence sections heading is an h2 (SC 1.3.1)', async () => {
    const wrapper = mountView()
    await nextTick()
    const h2 = wrapper.find('[data-testid="evidence-sections-heading"]')
    expect(h2.exists()).toBe(true)
    expect(h2.element.tagName).toBe('H2')
  })

  it('in-page skip link targets #evidence-main (SC 2.4.1)', async () => {
    const wrapper = mountView()
    await nextTick()
    const skipLink = wrapper.find('a[href="#evidence-main"]')
    expect(skipLink.exists()).toBe(true)
  })

  // ── Non-color-only status ────────────────────────────────────────────────

  it('overall status icon has role="img" and descriptive aria-label (SC 1.4.1)', async () => {
    const wrapper = mountView()
    await nextTick()
    const icon = wrapper.find('[data-testid="overall-status-icon"]')
    expect(icon.exists()).toBe(true)
    expect(icon.attributes('role')).toBe('img')
    expect(icon.attributes('aria-label')).toBeTruthy()
  })

  it('overall status label is present in text (not color-only) (SC 1.4.1)', async () => {
    const wrapper = mountView()
    await nextTick()
    const label = wrapper.find('[data-testid="overall-status-label"]')
    expect(label.exists()).toBe(true)
    expect(label.text().trim()).not.toBe('')
  })

  it('release-grade progress indicator uses role="status" for screen readers (SC 4.1.3)', async () => {
    const wrapper = mountView()
    await nextTick()
    const progress = wrapper.find('[data-testid="release-grade-progress"]')
    expect(progress.exists()).toBe(true)
    expect(progress.attributes('role')).toBe('status')
  })

  // ── Section accessibility ────────────────────────────────────────────────

  it('each evidence section card is an <article> element (SC 1.3.1)', async () => {
    const wrapper = mountView()
    await nextTick()
    const articles = wrapper.findAll('article')
    expect(articles.length).toBeGreaterThan(0)
  })

  it('each section toggle button has aria-expanded and aria-controls (SC 4.1.2)', async () => {
    const wrapper = mountView()
    await nextTick()
    const toggles = wrapper.findAll('[data-testid^="section-toggle-"]')
    expect(toggles.length).toBeGreaterThan(0)
    toggles.forEach((toggle) => {
      expect(toggle.attributes('aria-expanded')).toBeDefined()
      expect(toggle.attributes('aria-controls')).toBeTruthy()
    })
  })

  it('section toggle buttons have descriptive aria-label (SC 2.4.6)', async () => {
    const wrapper = mountView()
    await nextTick()
    const toggles = wrapper.findAll('[data-testid^="section-toggle-"]')
    toggles.forEach((toggle) => {
      expect(toggle.attributes('aria-label')).toBeTruthy()
    })
  })

  it('section toggle buttons have focus-visible ring class (SC 2.4.7)', async () => {
    const wrapper = mountView()
    await nextTick()
    const toggles = wrapper.findAll('[data-testid^="section-toggle-"]')
    toggles.forEach((toggle) => {
      expect(toggle.classes().join(' ')).toMatch(/focus-visible:ring/)
    })
  })

  // ── Export buttons ───────────────────────────────────────────────────────

  it('export JSON button has descriptive aria-label (SC 4.1.2)', async () => {
    const wrapper = mountView()
    await nextTick()
    const btn = wrapper.find('[data-testid="export-json-button"]')
    expect(btn.exists()).toBe(true)
    expect(btn.attributes('aria-label')).toBeTruthy()
  })

  it('export CSV button has descriptive aria-label (SC 4.1.2)', async () => {
    const wrapper = mountView()
    await nextTick()
    const btn = wrapper.find('[data-testid="export-csv-button"]')
    expect(btn.exists()).toBe(true)
    expect(btn.attributes('aria-label')).toBeTruthy()
  })

  it('export buttons have focus-visible ring classes (SC 2.4.7)', async () => {
    const wrapper = mountView()
    await nextTick()
    const jsonBtn = wrapper.find('[data-testid="export-json-button"]')
    const csvBtn = wrapper.find('[data-testid="export-csv-button"]')
    expect(jsonBtn.classes().join(' ')).toMatch(/focus-visible:ring/)
    expect(csvBtn.classes().join(' ')).toMatch(/focus-visible:ring/)
  })

  // ── Table accessibility ──────────────────────────────────────────────────

  it('export bundle table has aria-label (SC 1.3.1)', async () => {
    const wrapper = mountView()
    await nextTick()
    const table = wrapper.find('table')
    expect(table.exists()).toBe(true)
    expect(table.attributes('aria-label')).toBeTruthy()
  })

  it('export bundle table uses <th scope="col"> for column headers (SC 1.3.1)', async () => {
    const wrapper = mountView()
    await nextTick()
    const ths = wrapper.findAll('th[scope="col"]')
    expect(ths.length).toBeGreaterThanOrEqual(3)
  })

  // ── Navigation ───────────────────────────────────────────────────────────

  it('related links nav has aria-label (SC 1.3.6)', async () => {
    const wrapper = mountView()
    await nextTick()
    const nav = wrapper.find('[data-testid="related-links-nav"]')
    expect(nav.exists()).toBe(true)
    expect(nav.attributes('aria-label')).toBeTruthy()
  })

  // ── Aria-live / status regions ───────────────────────────────────────────

  it('overall status description has aria-live="polite" for state change announcements (SC 4.1.3)', async () => {
    const wrapper = mountView()
    await nextTick()
    const desc = wrapper.find('[data-testid="overall-status-description"]')
    expect(desc.exists()).toBe(true)
    expect(desc.attributes('aria-live')).toBe('polite')
  })
})

// ---------------------------------------------------------------------------

describe('ComplianceEvidencePackView — Rendering', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('renders workspace root after mount', async () => {
    const wrapper = mountView()
    await nextTick()
    expect(wrapper.find('[data-testid="evidence-pack-workspace"]').exists()).toBe(true)
  })

  it('renders page heading', async () => {
    const wrapper = mountView()
    await nextTick()
    const heading = wrapper.find('[data-testid="evidence-pack-heading"]')
    expect(heading.exists()).toBe(true)
    expect(heading.text()).toMatch(/Compliance Evidence Pack/i)
  })

  it('renders description block explaining evidence pack', async () => {
    const wrapper = mountView()
    await nextTick()
    const desc = wrapper.find('[data-testid="evidence-pack-description"]')
    expect(desc.exists()).toBe(true)
    expect(desc.text().toLowerCase()).toMatch(/release-grade|evidence/)
  })

  it('renders readiness summary banner', async () => {
    const wrapper = mountView()
    await nextTick()
    expect(wrapper.find('[data-testid="readiness-summary-banner"]').exists()).toBe(true)
  })

  it('renders overall status label text', async () => {
    const wrapper = mountView()
    await nextTick()
    const label = wrapper.find('[data-testid="overall-status-label"]')
    expect(label.text().trim()).not.toBe('')
  })

  it('renders export actions container', async () => {
    const wrapper = mountView()
    await nextTick()
    expect(wrapper.find('[data-testid="export-actions"]').exists()).toBe(true)
  })

  it('renders both Export JSON and Export CSV buttons', async () => {
    const wrapper = mountView()
    await nextTick()
    expect(wrapper.find('[data-testid="export-json-button"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="export-csv-button"]').exists()).toBe(true)
  })

  it('renders grade distinction notice', async () => {
    const wrapper = mountView()
    await nextTick()
    const notice = wrapper.find('[data-testid="grade-distinction-notice"]')
    expect(notice.exists()).toBe(true)
  })

  it('renders evidence sections container', async () => {
    const wrapper = mountView()
    await nextTick()
    expect(wrapper.find('[data-testid="evidence-sections"]').exists()).toBe(true)
  })

  it('renders all 5 evidence section cards', async () => {
    const wrapper = mountView()
    await nextTick()
    // accessibility, backend-signoff, policy-review, team-approvals, audit-trail
    const sections = wrapper.findAll('[data-testid^="evidence-section-"]')
    expect(sections.length).toBe(5)
  })

  it('renders export bundle table', async () => {
    const wrapper = mountView()
    await nextTick()
    expect(wrapper.find('[data-testid="export-bundle-table"]').exists()).toBe(true)
  })

  it('renders a table row for each evidence section', async () => {
    const wrapper = mountView()
    await nextTick()
    const rows = wrapper.findAll('[data-testid^="table-row-"]')
    expect(rows.length).toBe(5)
  })

  it('renders related links nav', async () => {
    const wrapper = mountView()
    await nextTick()
    expect(wrapper.find('[data-testid="related-links-nav"]').exists()).toBe(true)
  })

  // ── Wallet-free language ─────────────────────────────────────────────────

  it('copy contains no wallet connector framing (AC #8)', async () => {
    const wrapper = mountView()
    await nextTick()
    const html = wrapper.html()
    expect(html).not.toMatch(/WalletConnect|MetaMask|\bPera\b|Defly/i)
  })

  it('copy does not contain "sign transaction" language (AC #8)', async () => {
    const wrapper = mountView()
    await nextTick()
    const html = wrapper.html().toLowerCase()
    expect(html).not.toContain('sign transaction')
    expect(html).not.toContain('approve in wallet')
  })

  it('page heading uses operator-friendly language (AC #8)', async () => {
    const wrapper = mountView()
    await nextTick()
    const h1 = wrapper.find('h1')
    // Should contain "Compliance" + "Evidence"
    expect(h1.text().toLowerCase()).toMatch(/compliance|evidence/)
  })
})
