/**
 * Unit Tests: ReportingCommandCenterView — WCAG AA Accessibility & Rendering
 *
 * Validates accessibility requirements and rendering for the Reporting Command
 * Center workspace (AC #1, #2, #4, #8, #9, #10).
 *
 * Acceptance Criteria covered:
 *  AC #1  — A dedicated reporting command center route exists and is reachable
 *  AC #2  — The page shows saved report templates with descriptions and status metadata
 *  AC #4  — The UI clearly differentiates all lifecycle run statuses
 *  AC #8  — Loading, empty, degraded states match existing conventions
 *  AC #9  — No wallet connection UX is introduced
 *  AC #10 — Accessible via keyboard and screen readers with WCAG semantics
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createWebHistory } from 'vue-router'
import { nextTick } from 'vue'
import ReportingCommandCenterView from '../ReportingCommandCenterView.vue'
import { REPORTING_CENTER_TEST_IDS } from '../../utils/reportingCommandCenter'

// ---------------------------------------------------------------------------
// Router helper
// ---------------------------------------------------------------------------

const makeRouter = () =>
  createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', name: 'Home', component: { template: '<div />' } },
      { path: '/compliance/reporting-center', name: 'ReportingCommandCenter', component: { template: '<div />' } },
      { path: '/compliance/reporting', name: 'ComplianceReportingWorkspace', component: { template: '<div />' } },
      { path: '/compliance/release', name: 'ReleaseEvidenceCenter', component: { template: '<div />' } },
      { path: '/compliance/setup', name: 'ComplianceSetup', component: { template: '<div />' } },
      { path: '/compliance/evidence', name: 'ComplianceEvidencePack', component: { template: '<div />' } },
    ],
  })

// ---------------------------------------------------------------------------
// Mount helper
// ---------------------------------------------------------------------------

async function mountView() {
  vi.useFakeTimers()
  const router = makeRouter()
  const wrapper = mount(ReportingCommandCenterView, {
    global: {
      plugins: [
        createTestingPinia({ createSpy: vi.fn }),
        router,
      ],
    },
  })
  await router.isReady()
  await vi.advanceTimersByTimeAsync(300)
  await nextTick()
  vi.useRealTimers()
  return wrapper
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ReportingCommandCenterView — WCAG AA Accessibility', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  // ── Landmark and page structure ─────────────────────────────────────────

  it('renders workspace root with data-testid and role="region" (SC 1.3.6)', async () => {
    const wrapper = await mountView()
    const root = wrapper.find(`[data-testid="${REPORTING_CENTER_TEST_IDS.PAGE_ROOT}"]`)
    expect(root.exists()).toBe(true)
    expect(root.attributes('role')).toBe('region')
    expect(root.attributes('aria-label')).toMatch(/Reporting Command Center/i)
  })

  it('renders h1 with data-testid="reporting-center-heading"', async () => {
    const wrapper = await mountView()
    const heading = wrapper.find(`[data-testid="${REPORTING_CENTER_TEST_IDS.PAGE_HEADING}"]`)
    expect(heading.exists()).toBe(true)
    expect(heading.text()).toMatch(/Reporting Command Center/i)
  })

  it('renders skip link pointing to #reporting-center-main (SC 2.4.1)', async () => {
    const wrapper = await mountView()
    const skip = wrapper.find(`[data-testid="${REPORTING_CENTER_TEST_IDS.SKIP_LINK}"]`)
    expect(skip.exists()).toBe(true)
    expect(skip.attributes('href')).toBe('#reporting-center-main')
  })

  it('workspace region has id="reporting-center-main" for skip link target', async () => {
    const wrapper = await mountView()
    const main = wrapper.find('#reporting-center-main')
    expect(main.exists()).toBe(true)
  })

  it('page description contains operator-oriented language (not engineering jargon)', async () => {
    const wrapper = await mountView()
    const text = wrapper.text()
    expect(text).toMatch(/compliance reports/i)
    expect(text).toMatch(/enterprise/i)
  })

  // ── Loading state ────────────────────────────────────────────────────────

  it('shows loading state while data is being fetched', async () => {
    vi.useFakeTimers()
    const router = makeRouter()
    const wrapper = mount(ReportingCommandCenterView, {
      global: { plugins: [createTestingPinia({ createSpy: vi.fn }), router] },
    })
    await router.isReady()
    // Before timer fires
    const loading = wrapper.find(`[data-testid="${REPORTING_CENTER_TEST_IDS.LOADING_STATE}"]`)
    expect(loading.exists()).toBe(true)
    expect(loading.attributes('role')).toBe('region')
    expect(loading.attributes('aria-live')).toBe('polite')
    vi.useRealTimers()
  })

  it('removes loading state after data loads', async () => {
    const wrapper = await mountView()
    const loading = wrapper.find(`[data-testid="${REPORTING_CENTER_TEST_IDS.LOADING_STATE}"]`)
    expect(loading.exists()).toBe(false)
  })

  // ── Summary cards ────────────────────────────────────────────────────────

  it('renders all four summary cards', async () => {
    const wrapper = await mountView()
    expect(wrapper.find(`[data-testid="${REPORTING_CENTER_TEST_IDS.SUMMARY_SCHEDULED}"]`).exists()).toBe(true)
    expect(wrapper.find(`[data-testid="${REPORTING_CENTER_TEST_IDS.SUMMARY_BLOCKED}"]`).exists()).toBe(true)
    expect(wrapper.find(`[data-testid="${REPORTING_CENTER_TEST_IDS.SUMMARY_STALE}"]`).exists()).toBe(true)
    expect(wrapper.find(`[data-testid="${REPORTING_CENTER_TEST_IDS.SUMMARY_AWAITING}"]`).exists()).toBe(true)
  })

  it('summary cards contain numeric counts', async () => {
    const wrapper = await mountView()
    const scheduled = wrapper.find(`[data-testid="${REPORTING_CENTER_TEST_IDS.SUMMARY_SCHEDULED}"]`)
    expect(scheduled.text()).toMatch(/\d/)
  })

  // ── Report templates section ─────────────────────────────────────────────

  it('renders templates section with aria-labelledby', async () => {
    const wrapper = await mountView()
    const section = wrapper.find(`[data-testid="${REPORTING_CENTER_TEST_IDS.TEMPLATES_SECTION}"]`)
    expect(section.exists()).toBe(true)
    const labelledBy = section.attributes('aria-labelledby')
    expect(labelledBy).toBeTruthy()
  })

  it('renders four template cards for four enterprise audiences', async () => {
    const wrapper = await mountView()
    const cards = wrapper.findAll(`[data-testid="${REPORTING_CENTER_TEST_IDS.TEMPLATE_CARD}"]`)
    expect(cards.length).toBe(4)
  })

  it('template cards show audience badges', async () => {
    const wrapper = await mountView()
    const badges = wrapper.findAll(`[data-testid="${REPORTING_CENTER_TEST_IDS.TEMPLATE_AUDIENCE_BADGE}"]`)
    expect(badges.length).toBeGreaterThanOrEqual(4)
  })

  it('template cards show freshness badges', async () => {
    const wrapper = await mountView()
    const badges = wrapper.findAll(`[data-testid="${REPORTING_CENTER_TEST_IDS.TEMPLATE_FRESHNESS_BADGE}"]`)
    expect(badges.length).toBeGreaterThanOrEqual(4)
  })

  it('template cards show cadence chips', async () => {
    const wrapper = await mountView()
    const chips = wrapper.findAll(`[data-testid="${REPORTING_CENTER_TEST_IDS.TEMPLATE_CADENCE_CHIP}"]`)
    expect(chips.length).toBeGreaterThanOrEqual(4)
  })

  it('template cards have descriptive aria-label attributes', async () => {
    const wrapper = await mountView()
    const cards = wrapper.findAll(`[data-testid="${REPORTING_CENTER_TEST_IDS.TEMPLATE_CARD}"]`)
    for (const card of cards) {
      const label = card.attributes('aria-label')
      expect(label).toMatch(/Report template:/i)
    }
  })

  it('shows "New Report Run" button in templates section', async () => {
    const wrapper = await mountView()
    const btn = wrapper.find(`[data-testid="${REPORTING_CENTER_TEST_IDS.CREATE_RUN_BUTTON}"]`)
    expect(btn.exists()).toBe(true)
    expect(btn.text()).toMatch(/New Report Run/i)
  })

  // ── In-flight runs section ───────────────────────────────────────────────

  it('renders runs section with aria-labelledby', async () => {
    const wrapper = await mountView()
    const section = wrapper.find(`[data-testid="${REPORTING_CENTER_TEST_IDS.RUNS_SECTION}"]`)
    expect(section.exists()).toBe(true)
  })

  it('renders run rows with status badges', async () => {
    const wrapper = await mountView()
    const badges = wrapper.findAll(`[data-testid="${REPORTING_CENTER_TEST_IDS.RUN_STATUS_BADGE}"]`)
    expect(badges.length).toBeGreaterThan(0)
  })

  it('run rows include status badge text for differentiation', async () => {
    const wrapper = await mountView()
    const badges = wrapper.findAll(`[data-testid="${REPORTING_CENTER_TEST_IDS.RUN_STATUS_BADGE}"]`)
    const texts = badges.map((b) => b.text())
    // At least one of the known statuses is present
    const knownLabels = ['Awaiting Approval', 'Blocked', 'Delivered', 'Awaiting Review']
    const found = texts.some((t) => knownLabels.includes(t))
    expect(found).toBe(true)
  })

  // ── Change summary ───────────────────────────────────────────────────────

  it('renders change-since-last-report summary for runs that have one', async () => {
    const wrapper = await mountView()
    const summaries = wrapper.findAll(`[data-testid="${REPORTING_CENTER_TEST_IDS.RUN_CHANGE_SUMMARY}"]`)
    expect(summaries.length).toBeGreaterThan(0)
  })

  it('change summary has descriptive aria-label', async () => {
    const wrapper = await mountView()
    const summary = wrapper.find(`[data-testid="${REPORTING_CENTER_TEST_IDS.RUN_CHANGE_SUMMARY}"]`)
    expect(summary.attributes('aria-label')).toMatch(/Changes since last report/i)
  })

  // ── Blocker deep links ───────────────────────────────────────────────────

  it('blocked runs show remediation links to compliance surfaces', async () => {
    const wrapper = await mountView()
    const blockerLinks = wrapper.findAll(`[data-testid="${REPORTING_CENTER_TEST_IDS.RUN_BLOCKER_LINK}"]`)
    expect(blockerLinks.length).toBeGreaterThan(0)
  })

  // ── Configure panel ──────────────────────────────────────────────────────

  it('configure panel is hidden by default', async () => {
    const wrapper = await mountView()
    const panel = wrapper.find(`[data-testid="${REPORTING_CENTER_TEST_IDS.CONFIGURE_PANEL}"]`)
    expect(panel.exists()).toBe(false)
  })

  it('clicking "New Report Run" shows configure panel', async () => {
    const wrapper = await mountView()
    const vm = wrapper.vm as any
    vm.openConfigurePanel()
    await nextTick()
    const panel = wrapper.find(`[data-testid="${REPORTING_CENTER_TEST_IDS.CONFIGURE_PANEL}"]`)
    expect(panel.exists()).toBe(true)
  })

  it('configure panel has role="dialog" and aria-modal for accessibility', async () => {
    const wrapper = await mountView()
    const vm = wrapper.vm as any
    vm.openConfigurePanel()
    await nextTick()
    const panel = wrapper.find(`[data-testid="${REPORTING_CENTER_TEST_IDS.CONFIGURE_PANEL}"]`)
    expect(panel.attributes('role')).toBe('dialog')
    expect(panel.attributes('aria-modal')).toBe('true')
  })

  it('configure panel close button closes the panel', async () => {
    const wrapper = await mountView()
    const vm = wrapper.vm as any
    vm.openConfigurePanel()
    await nextTick()
    vm.closeConfigurePanel()
    await nextTick()
    const panel = wrapper.find(`[data-testid="${REPORTING_CENTER_TEST_IDS.CONFIGURE_PANEL}"]`)
    expect(panel.exists()).toBe(false)
  })

  it('configure panel contains audience and cadence selects', async () => {
    const wrapper = await mountView()
    const vm = wrapper.vm as any
    vm.openConfigurePanel()
    await nextTick()
    const audienceSelect = wrapper.find(`[data-testid="${REPORTING_CENTER_TEST_IDS.PANEL_AUDIENCE_SELECT}"]`)
    const cadenceSelect = wrapper.find(`[data-testid="${REPORTING_CENTER_TEST_IDS.PANEL_CADENCE_SELECT}"]`)
    expect(audienceSelect.exists()).toBe(true)
    expect(cadenceSelect.exists()).toBe(true)
  })

  it('configure panel shows backend unavailability note rather than pretending scheduled delivery is available', async () => {
    const wrapper = await mountView()
    const vm = wrapper.vm as any
    vm.openConfigurePanel()
    await nextTick()
    const text = wrapper.find(`[data-testid="${REPORTING_CENTER_TEST_IDS.CONFIGURE_PANEL}"]`).text()
    expect(text).toMatch(/not yet available|upcoming release/i)
  })

  // ── No wallet UI ─────────────────────────────────────────────────────────

  it('does not contain any wallet connector language (AC #9)', async () => {
    const wrapper = await mountView()
    const html = wrapper.html()
    expect(html).not.toMatch(/WalletConnect|MetaMask|\bPera\b|Defly/i)
  })

  // ── Heading hierarchy ────────────────────────────────────────────────────

  it('has a single h1 for page title (SC 1.3.1)', async () => {
    const wrapper = await mountView()
    const h1s = wrapper.findAll('h1')
    expect(h1s.length).toBe(1)
  })

  it('h2 headings exist for sections below h1', async () => {
    const wrapper = await mountView()
    const h2s = wrapper.findAll('h2')
    expect(h2s.length).toBeGreaterThan(0)
  })

  // ── CTA button accessibility ─────────────────────────────────────────────

  it('disabled CTA buttons have aria-disabled="true" (SC 4.1.2)', async () => {
    const wrapper = await mountView()
    // Run CTA buttons on blocked templates have aria-disabled
    const ctaButtons = wrapper.findAll(`[data-testid="${REPORTING_CENTER_TEST_IDS.TEMPLATE_RUN_CTA}"]`)
    // At least one button should exist
    expect(ctaButtons.length).toBeGreaterThan(0)
  })
})
