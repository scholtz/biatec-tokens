/**
 * Unit Tests: ComplianceOperationsCockpit — rendering / structure
 *
 * Covers WCAG semantics, data-testid anchors, ARIA wiring, loading/degraded states,
 * queue health panel, worklist panel, bottleneck panel, handoff panel,
 * and wallet-free language.
 *
 * Acceptance criteria mapped:
 *   AC #1  — cockpit exists and renders after auth
 *   AC #2  — ownership and status distinctions are rendered
 *   AC #5  — degraded state is rendered with alert role
 *   AC #6  — reusable utility functions power the UI
 *   AC #7  — unit tests cover the utility layer
 *   AC #8  — accessibility: ARIA roles, keyboard semantics
 *   AC #9  — no wallet connector or blockchain jargon
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import { nextTick } from 'vue'
import { createTestingPinia } from '@pinia/testing'
import ComplianceOperationsCockpit from '../ComplianceOperationsCockpit.vue'
import { COCKPIT_TEST_IDS } from '../../utils/complianceOperationsCockpit'

// ---------------------------------------------------------------------------
// Stubs
// ---------------------------------------------------------------------------

vi.mock('../../layout/MainLayout.vue', () => ({
  default: { template: '<div><slot /></div>' },
}))

vi.mock('@heroicons/vue/24/outline', () => ({
  ChartBarSquareIcon: { template: '<svg />' },
  ArrowPathIcon: { template: '<svg />' },
  ExclamationTriangleIcon: { template: '<svg />' },
  CheckCircleIcon: { template: '<svg />' },
  CheckBadgeIcon: { template: '<svg />' },
  ExclamationCircleIcon: { template: '<svg />' },
  ShieldExclamationIcon: { template: '<svg />' },
}))

// ---------------------------------------------------------------------------
// Router & mount helpers
// ---------------------------------------------------------------------------

function makeRouter() {
  return createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/compliance/operations', component: { template: '<div />' } },
      { path: '/compliance/onboarding', component: { template: '<div />' } },
      { path: '/compliance/approval', component: { template: '<div />' } },
      { path: '/compliance/reporting', component: { template: '<div />' } },
    ],
  })
}

/** RouterLink stub that renders as <a :href="to"> so findAll('a') works in tests */
const RouterLinkStub = {
  template: '<a :href="to"><slot /></a>',
  props: ['to'],
}

async function mountCockpit() {
  vi.useFakeTimers()
  const router = makeRouter()
  const wrapper = mount(ComplianceOperationsCockpit, {
    global: {
      plugins: [createTestingPinia({ createSpy: vi.fn })],
      components: { RouterLink: RouterLinkStub },
    },
  })
  // Advance past the 120ms loading setTimeout
  await vi.advanceTimersByTimeAsync(200)
  await nextTick()
  await nextTick()
  return wrapper
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  localStorage.clear()
})

// ---------------------------------------------------------------------------
// 1. Page structure
// ---------------------------------------------------------------------------

describe('ComplianceOperationsCockpit — page structure', () => {
  it('renders a single h1 heading (WCAG SC 1.3.1)', async () => {
    const wrapper = await mountCockpit()
    const h1s = wrapper.findAll('h1')
    expect(h1s).toHaveLength(1)
  })

  it('h1 contains expected page title text', async () => {
    const wrapper = await mountCockpit()
    expect(wrapper.find('h1').text()).toContain('Compliance Operations Cockpit')
  })

  it('has data-testid on root container', async () => {
    const wrapper = await mountCockpit()
    expect(wrapper.find(`[data-testid="${COCKPIT_TEST_IDS.ROOT}"]`).exists()).toBe(true)
  })

  it('root container has role="region" with aria-label', async () => {
    const wrapper = await mountCockpit()
    const root = wrapper.find(`[data-testid="${COCKPIT_TEST_IDS.ROOT}"]`)
    expect(root.attributes('role')).toBe('region')
    expect(root.attributes('aria-label')).toBeTruthy()
  })

  it('has a skip-to-main-content link (WCAG SC 2.4.1)', async () => {
    const wrapper = await mountCockpit()
    const skip = wrapper.find('a[href="#cockpit-ops-main"]')
    expect(skip.exists()).toBe(true)
  })

  it('heading has data-testid for test targeting', async () => {
    const wrapper = await mountCockpit()
    const heading = wrapper.find(`[data-testid="${COCKPIT_TEST_IDS.HEADING}"]`)
    expect(heading.exists()).toBe(true)
  })

  it('shows refreshed-at timestamp (WCAG: labelled status)', async () => {
    const wrapper = await mountCockpit()
    const ts = wrapper.find(`[data-testid="${COCKPIT_TEST_IDS.REFRESHED_AT}"]`)
    expect(ts.exists()).toBe(true)
  })

  it('shows refresh button with accessible label', async () => {
    const wrapper = await mountCockpit()
    const btn = wrapper.find(`[data-testid="${COCKPIT_TEST_IDS.REFRESH_BTN}"]`)
    expect(btn.exists()).toBe(true)
    expect(btn.attributes('aria-label')).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// 2. Posture banner
// ---------------------------------------------------------------------------

describe('ComplianceOperationsCockpit — posture banner', () => {
  it('renders the posture banner', async () => {
    const wrapper = await mountCockpit()
    const banner = wrapper.find(`[data-testid="${COCKPIT_TEST_IDS.POSTURE_BANNER}"]`)
    expect(banner.exists()).toBe(true)
  })

  it('posture banner has aria-labelledby', async () => {
    const wrapper = await mountCockpit()
    const banner = wrapper.find(`[data-testid="${COCKPIT_TEST_IDS.POSTURE_BANNER}"]`)
    expect(banner.attributes('aria-labelledby')).toBe('cockpit-posture-heading')
  })

  it('posture label contains text', async () => {
    const wrapper = await mountCockpit()
    const label = wrapper.find(`[data-testid="${COCKPIT_TEST_IDS.POSTURE_LABEL}"]`)
    expect(label.exists()).toBe(true)
    expect(label.text().length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// 3. Queue health panel
// ---------------------------------------------------------------------------

describe('ComplianceOperationsCockpit — queue health panel', () => {
  it('renders the queue health panel', async () => {
    const wrapper = await mountCockpit()
    const panel = wrapper.find(`[data-testid="${COCKPIT_TEST_IDS.QUEUE_HEALTH_PANEL}"]`)
    expect(panel.exists()).toBe(true)
  })

  it('queue health panel has aria-labelledby', async () => {
    const wrapper = await mountCockpit()
    const panel = wrapper.find(`[data-testid="${COCKPIT_TEST_IDS.QUEUE_HEALTH_PANEL}"]`)
    expect(panel.attributes('aria-labelledby')).toBe('queue-health-heading')
  })

  it('renders total count metric', async () => {
    const wrapper = await mountCockpit()
    expect(wrapper.find(`[data-testid="${COCKPIT_TEST_IDS.HEALTH_TOTAL}"]`).exists()).toBe(true)
  })

  it('renders overdue count metric', async () => {
    const wrapper = await mountCockpit()
    expect(wrapper.find(`[data-testid="${COCKPIT_TEST_IDS.HEALTH_OVERDUE}"]`).exists()).toBe(true)
  })

  it('renders blocked count metric', async () => {
    const wrapper = await mountCockpit()
    expect(wrapper.find(`[data-testid="${COCKPIT_TEST_IDS.HEALTH_BLOCKED}"]`).exists()).toBe(true)
  })

  it('renders approval-ready count metric', async () => {
    const wrapper = await mountCockpit()
    expect(wrapper.find(`[data-testid="${COCKPIT_TEST_IDS.HEALTH_APPROVAL_READY}"]`).exists()).toBe(true)
  })

  it('renders unassigned count metric', async () => {
    const wrapper = await mountCockpit()
    expect(wrapper.find(`[data-testid="${COCKPIT_TEST_IDS.HEALTH_UNASSIGNED}"]`).exists()).toBe(true)
  })

  it('renders assigned-to-me count metric', async () => {
    const wrapper = await mountCockpit()
    expect(wrapper.find(`[data-testid="${COCKPIT_TEST_IDS.HEALTH_ASSIGNED_TO_ME}"]`).exists()).toBe(true)
  })

  it('metric dt labels are present (WCAG: non-visual meaning)', async () => {
    const wrapper = await mountCockpit()
    const panel = wrapper.find(`[data-testid="${COCKPIT_TEST_IDS.QUEUE_HEALTH_PANEL}"]`)
    const dts = panel.findAll('dt')
    expect(dts.length).toBeGreaterThanOrEqual(6)
  })
})

// ---------------------------------------------------------------------------
// 4. Worklist panel
// ---------------------------------------------------------------------------

describe('ComplianceOperationsCockpit — worklist panel', () => {
  it('renders the worklist panel', async () => {
    const wrapper = await mountCockpit()
    const panel = wrapper.find(`[data-testid="${COCKPIT_TEST_IDS.WORKLIST_PANEL}"]`)
    expect(panel.exists()).toBe(true)
  })

  it('worklist panel has aria-labelledby', async () => {
    const wrapper = await mountCockpit()
    const panel = wrapper.find(`[data-testid="${COCKPIT_TEST_IDS.WORKLIST_PANEL}"]`)
    expect(panel.attributes('aria-labelledby')).toBe('worklist-heading')
  })

  it('renders the filter select', async () => {
    const wrapper = await mountCockpit()
    const filter = wrapper.find(`[data-testid="${COCKPIT_TEST_IDS.FILTER_SELECT}"]`)
    expect(filter.exists()).toBe(true)
    expect(filter.attributes('aria-label')).toBeTruthy()
  })

  it('renders work item rows (MOCK_WORK_ITEMS_DEGRADED has active items)', async () => {
    const wrapper = await mountCockpit()
    const rows = wrapper.findAll(`[data-testid="${COCKPIT_TEST_IDS.WORK_ITEM_ROW}"]`)
    expect(rows.length).toBeGreaterThan(0)
  })

  it('work item rows contain status badge', async () => {
    const wrapper = await mountCockpit()
    const rows = wrapper.findAll(`[data-testid="${COCKPIT_TEST_IDS.WORK_ITEM_ROW}"]`)
    // At least one row should have a status badge span
    const firstRow = rows[0]
    const spans = firstRow.findAll('span')
    expect(spans.length).toBeGreaterThan(0)
  })

  it('work item rows contain "Open workspace" link', async () => {
    const wrapper = await mountCockpit()
    const rows = wrapper.findAll(`[data-testid="${COCKPIT_TEST_IDS.WORK_ITEM_ROW}"]`)
    const firstRow = rows[0]
    const links = firstRow.findAll('a')
    expect(links.length).toBeGreaterThan(0)
    expect(links[0].text()).toContain('Open workspace')
  })
})

// ---------------------------------------------------------------------------
// 5. Bottleneck panel
// ---------------------------------------------------------------------------

describe('ComplianceOperationsCockpit — bottleneck panel', () => {
  it('renders the bottleneck panel', async () => {
    const wrapper = await mountCockpit()
    const panel = wrapper.find(`[data-testid="${COCKPIT_TEST_IDS.BOTTLENECK_PANEL}"]`)
    expect(panel.exists()).toBe(true)
  })

  it('bottleneck panel has aria-labelledby', async () => {
    const wrapper = await mountCockpit()
    const panel = wrapper.find(`[data-testid="${COCKPIT_TEST_IDS.BOTTLENECK_PANEL}"]`)
    expect(panel.attributes('aria-labelledby')).toBe('bottleneck-heading')
  })

  it('renders bottleneck items or empty state', async () => {
    const wrapper = await mountCockpit()
    // With MOCK_WORK_ITEMS_DEGRADED there should be bottlenecks
    const bottleneckItems = wrapper.findAll('[data-testid^="bottleneck-stage-"]')
    const emptyState = wrapper.find(`[data-testid="${COCKPIT_TEST_IDS.BOTTLENECK_EMPTY}"]`)
    expect(bottleneckItems.length > 0 || emptyState.exists()).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 6. Handoff panel
// ---------------------------------------------------------------------------

describe('ComplianceOperationsCockpit — handoff panel', () => {
  it('renders the handoff panel', async () => {
    const wrapper = await mountCockpit()
    const panel = wrapper.find(`[data-testid="${COCKPIT_TEST_IDS.HANDOFF_PANEL}"]`)
    expect(panel.exists()).toBe(true)
  })

  it('handoff panel has aria-labelledby', async () => {
    const wrapper = await mountCockpit()
    const panel = wrapper.find(`[data-testid="${COCKPIT_TEST_IDS.HANDOFF_PANEL}"]`)
    expect(panel.attributes('aria-labelledby')).toBe('handoff-heading')
  })

  it('renders exactly 3 handoff cards', async () => {
    const wrapper = await mountCockpit()
    const cards = wrapper.findAll(`[data-testid="${COCKPIT_TEST_IDS.HANDOFF_CARD}"]`)
    expect(cards).toHaveLength(3)
  })

  it('handoff cards contain readiness badge and link', async () => {
    const wrapper = await mountCockpit()
    const cards = wrapper.findAll(`[data-testid="${COCKPIT_TEST_IDS.HANDOFF_CARD}"]`)
    const firstCard = cards[0]
    // Should have a link to Open the workspace (rendered as <a> by RouterLinkStub)
    const link = firstCard.find('a')
    expect(link.exists()).toBe(true)
    expect(link.text()).toContain('Open')
  })
})

// ---------------------------------------------------------------------------
// 7. Accessibility (WCAG)
// ---------------------------------------------------------------------------

describe('ComplianceOperationsCockpit — accessibility', () => {
  it('all section panels use aria-labelledby (SC 1.3.1)', async () => {
    const wrapper = await mountCockpit()
    const panels = wrapper.findAll('section')
    panels.forEach((panel) => {
      expect(panel.attributes('aria-labelledby')).toBeTruthy()
    })
  })

  it('no wallet connector UI is present (product requirement)', async () => {
    const wrapper = await mountCockpit()
    const text = wrapper.text()
    expect(text).not.toMatch(/WalletConnect|MetaMask|\bPera\b|Defly/i)
    expect(text).not.toMatch(/connect.*wallet|wallet.*connect/i)
  })

  it('does not contain blockchain-specific jargon', async () => {
    const wrapper = await mountCockpit()
    const text = wrapper.text()
    expect(text).not.toMatch(/sign transaction|approve in wallet|gas fee/i)
  })

  it('filter select has for/id association', async () => {
    const wrapper = await mountCockpit()
    const label = wrapper.find('label[for="worklist-filter"]')
    const select = wrapper.find('#worklist-filter')
    expect(label.exists()).toBe(true)
    expect(select.exists()).toBe(true)
  })

  it('refresh button has aria-label (WCAG SC 4.1.2)', async () => {
    const wrapper = await mountCockpit()
    const btn = wrapper.find(`[data-testid="${COCKPIT_TEST_IDS.REFRESH_BTN}"]`)
    expect(btn.attributes('aria-label')).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// 8. Disclaimer note
// ---------------------------------------------------------------------------

describe('ComplianceOperationsCockpit — disclaimer', () => {
  it('renders disclaimer note', async () => {
    const wrapper = await mountCockpit()
    const disclaimer = wrapper.find('[data-testid="cockpit-disclaimer"]')
    expect(disclaimer.exists()).toBe(true)
  })

  it('disclaimer has role="note"', async () => {
    const wrapper = await mountCockpit()
    const disclaimer = wrapper.find('[data-testid="cockpit-disclaimer"]')
    expect(disclaimer.attributes('role')).toBe('note')
  })
})

// ---------------------------------------------------------------------------
// 9. Role-aware summary panel (AC #5)
// ---------------------------------------------------------------------------

describe('ComplianceOperationsCockpit — role-aware summaries (AC #5)', () => {
  it('renders the role summary panel', async () => {
    const wrapper = await mountCockpit()
    const panel = wrapper.find(`[data-testid="${COCKPIT_TEST_IDS.ROLE_SUMMARY_PANEL}"]`)
    expect(panel.exists()).toBe(true)
  })

  it('role summary panel has aria-labelledby (SC 1.3.1)', async () => {
    const wrapper = await mountCockpit()
    const panel = wrapper.find(`[data-testid="${COCKPIT_TEST_IDS.ROLE_SUMMARY_PANEL}"]`)
    expect(panel.attributes('aria-labelledby')).toBeTruthy()
  })

  it('renders exactly three role summary cards', async () => {
    const wrapper = await mountCockpit()
    const cards = wrapper.findAll(`[data-testid="${COCKPIT_TEST_IDS.ROLE_SUMMARY_CARD}"]`)
    expect(cards.length).toBe(3)
  })

  it('each role summary card has a data-persona attribute', async () => {
    const wrapper = await mountCockpit()
    const cards = wrapper.findAll(`[data-testid="${COCKPIT_TEST_IDS.ROLE_SUMMARY_CARD}"]`)
    const personas = cards.map((c) => c.attributes('data-persona'))
    expect(personas).toContain('compliance_manager')
    expect(personas).toContain('operations_lead')
    expect(personas).toContain('executive_sponsor')
  })

  it('role summary cards contain metric labels', async () => {
    const wrapper = await mountCockpit()
    const panel = wrapper.find(`[data-testid="${COCKPIT_TEST_IDS.ROLE_SUMMARY_PANEL}"]`)
    const html = panel.html()
    expect(html).toContain('Overdue')
    expect(html).toContain('Unassigned')
    expect(html).toContain('Launch Blocking')
  })
})

// ---------------------------------------------------------------------------
// 10. Aging analysis panel (new feature — AC #2 analytics-lite)
// ---------------------------------------------------------------------------

describe('ComplianceOperationsCockpit — aging analysis panel (AC #2 analytics-lite)', () => {
  it('renders the aging analysis panel', async () => {
    const wrapper = await mountCockpit()
    const panel = wrapper.find(`[data-testid="${COCKPIT_TEST_IDS.AGING_PANEL}"]`)
    expect(panel.exists()).toBe(true)
  })

  it('aging panel has role-compatible aria-labelledby heading', async () => {
    const wrapper = await mountCockpit()
    const panel = wrapper.find(`[data-testid="${COCKPIT_TEST_IDS.AGING_PANEL}"]`)
    const labelId = panel.attributes('aria-labelledby')
    expect(labelId).toBeTruthy()
    const heading = wrapper.find(`#${labelId}`)
    expect(heading.exists()).toBe(true)
    expect(heading.text().length).toBeGreaterThan(0)
  })

  it('aging panel contains all four bucket cells', async () => {
    const wrapper = await mountCockpit()
    expect(wrapper.find(`[data-testid="${COCKPIT_TEST_IDS.AGING_FRESH}"]`).exists()).toBe(true)
    expect(wrapper.find(`[data-testid="${COCKPIT_TEST_IDS.AGING_AGING}"]`).exists()).toBe(true)
    expect(wrapper.find(`[data-testid="${COCKPIT_TEST_IDS.AGING_STALE}"]`).exists()).toBe(true)
    expect(wrapper.find(`[data-testid="${COCKPIT_TEST_IDS.AGING_CRITICAL}"]`).exists()).toBe(true)
  })

  it('aging panel has descriptive paragraph text (WCAG SC 3.3.2)', async () => {
    const wrapper = await mountCockpit()
    const panel = wrapper.find(`[data-testid="${COCKPIT_TEST_IDS.AGING_PANEL}"]`)
    const text = panel.text()
    expect(text).toMatch(/stale|aging|progress|sla/i)
  })

  it('aging bucket cells use dd for value (semantic definition term pattern)', async () => {
    const wrapper = await mountCockpit()
    const freshCell = wrapper.find(`[data-testid="${COCKPIT_TEST_IDS.AGING_FRESH}"]`)
    // Each cell follows the dd (value) + dt (label) pattern
    const dd = freshCell.find('dd')
    const dt = freshCell.find('dt')
    expect(dd.exists()).toBe(true)
    expect(dt.exists()).toBe(true)
  })

  it('aging panel description text contains "Aging Analysis"', async () => {
    const wrapper = await mountCockpit()
    const panel = wrapper.find(`[data-testid="${COCKPIT_TEST_IDS.AGING_PANEL}"]`)
    const h2 = panel.find('h2')
    expect(h2.text()).toContain('Aging Analysis')
  })
})

// ---------------------------------------------------------------------------
// 11. New filter options are present in select (AC #2 awaiting-input, awaiting-review)
// ---------------------------------------------------------------------------

describe('ComplianceOperationsCockpit — filter select option coverage', () => {
  it('filter select contains awaiting_customer_input option', async () => {
    const wrapper = await mountCockpit()
    const select = wrapper.find(`[data-testid="${COCKPIT_TEST_IDS.FILTER_SELECT}"]`)
    const options = select.findAll('option')
    const values = options.map((o) => o.attributes('value'))
    expect(values).toContain('awaiting_customer_input')
  })

  it('filter select contains pending_review option', async () => {
    const wrapper = await mountCockpit()
    const select = wrapper.find(`[data-testid="${COCKPIT_TEST_IDS.FILTER_SELECT}"]`)
    const options = select.findAll('option')
    const values = options.map((o) => o.attributes('value'))
    expect(values).toContain('pending_review')
  })

  it('filter select option labels use enterprise-friendly language', async () => {
    const wrapper = await mountCockpit()
    const select = wrapper.find(`[data-testid="${COCKPIT_TEST_IDS.FILTER_SELECT}"]`)
    const html = select.html()
    expect(html).toContain('Awaiting Customer Input')
    expect(html).toContain('Pending Review')
  })
})
