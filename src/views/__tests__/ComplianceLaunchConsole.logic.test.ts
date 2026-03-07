/**
 * Unit Tests: ComplianceLaunchConsole — Logic Coverage
 *
 * Validates the interaction logic and state-based rendering not covered
 * by the WCAG accessibility tests.
 *
 * Coverage targets:
 *  - CTA renders correct label/button for each gate state
 *  - Domain card expand/collapse toggling
 *  - Blocker what/why/how sections render
 *  - Analytics events dispatched on view mount, blocker open, launch attempt
 *  - Readiness score colour classes
 *  - Launch Token button absent when blocked
 *  - Review summary counts are correct
 *  - Open full compliance setup link present
 *  - No wallet connector UI in any state
 *
 * AC coverage:
 *  AC #2  — console always shows deterministic overall state and single primary CTA
 *  AC #3  — all blockers rendered with what/why/how guidance
 *  AC #4  — Launch Token shown when all ready
 *  AC #5  — Launch Token NOT shown when blocked
 *  AC #9  — analytics events fire for view, blocker interactions, launch attempt
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createWebHistory } from 'vue-router'
import ComplianceLaunchConsole from '../ComplianceLaunchConsole.vue'

// ---------------------------------------------------------------------------
// Router helper
// ---------------------------------------------------------------------------
const makeRouter = () =>
  createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', name: 'Home', component: { template: '<div />' } },
      { path: '/compliance/launch', name: 'ComplianceLaunchConsole', component: { template: '<div />' } },
      { path: '/compliance/setup', name: 'ComplianceSetupWorkspace', component: { template: '<div />' } },
      { path: '/launch/guided', name: 'GuidedTokenLaunch', component: { template: '<div />' } },
    ],
  })

// ---------------------------------------------------------------------------
// Default store state helpers
// ---------------------------------------------------------------------------

const makeRequiredStep = (id: string, overrides = {}) => ({
  id,
  title: `Step ${id}`,
  description: `Desc ${id}`,
  status: 'not_started',
  isRequired: true,
  isComplete: false,
  isValid: false,
  ...overrides,
})

const notStartedState = () => ({
  complianceSetup: {
    currentForm: {
      currentStepIndex: 0,
      steps: [
        makeRequiredStep('jurisdiction'),
        makeRequiredStep('whitelist'),
        makeRequiredStep('kyc_aml'),
        makeRequiredStep('attestation'),
        makeRequiredStep('summary'),
      ],
    },
  },
})

const readyState = () => ({
  complianceSetup: {
    currentForm: {
      currentStepIndex: 4,
      steps: [
        makeRequiredStep('jurisdiction', { isComplete: true, status: 'completed' }),
        makeRequiredStep('whitelist', { isComplete: true, status: 'completed' }),
        makeRequiredStep('kyc_aml', { isComplete: true, status: 'completed' }),
        makeRequiredStep('attestation', { isComplete: true, status: 'completed' }),
        makeRequiredStep('summary', { isComplete: true, status: 'completed' }),
      ],
    },
  },
})

const blockedState = () => ({
  complianceSetup: {
    currentForm: {
      currentStepIndex: 0,
      // 1 step with status 'blocked' — makes gate='blocked', produces 1 blocker via store computed
      steps: [
        makeRequiredStep('jurisdiction', { status: 'blocked' }),
      ],
    },
  },
})

const mountConsole = (initialState = notStartedState()) => {
  const router = makeRouter()
  const wrapper = mount(ComplianceLaunchConsole, {
    global: {
      plugins: [
        createTestingPinia({
          createSpy: vi.fn,
          initialState,
        }),
        router,
      ],
    },
  })
  return { wrapper, router }
}

// ---------------------------------------------------------------------------
// CTA rendering
// ---------------------------------------------------------------------------

describe('ComplianceLaunchConsole — CTA rendering', () => {
  it('shows "Start Compliance Review" when gate is not_started', async () => {
    const { wrapper } = mountConsole(notStartedState())
    await nextTick()
    const btn = wrapper.find('[data-testid="primary-cta-button"]')
    expect(btn.exists()).toBe(true)
    expect(btn.text()).toMatch(/Start Compliance Review/i)
  })

  it('shows "Launch Token" button when gate is ready (AC #4)', async () => {
    const { wrapper } = mountConsole(readyState())
    await nextTick()
    const launchBtn = wrapper.find('[data-testid="launch-token-button"]')
    expect(launchBtn.exists()).toBe(true)
    expect(launchBtn.text()).toMatch(/Launch Token/i)
  })

  it('does NOT show "Launch Token" when blocked (AC #5)', async () => {
    const { wrapper } = mountConsole(blockedState())
    await nextTick()
    const launchBtn = wrapper.find('[data-testid="launch-token-button"]')
    expect(launchBtn.exists()).toBe(false)
  })

  it('shows "Resolve Blockers" when blocked', async () => {
    const { wrapper } = mountConsole(blockedState())
    await nextTick()
    const btn = wrapper.find('[data-testid="primary-cta-button"]')
    expect(btn.exists()).toBe(true)
    expect(btn.text()).toMatch(/Resolve Blockers/i)
  })
})

// ---------------------------------------------------------------------------
// Gate state label
// ---------------------------------------------------------------------------

describe('ComplianceLaunchConsole — gate state label', () => {
  it('shows "Not Started" label when not started', async () => {
    const { wrapper } = mountConsole(notStartedState())
    await nextTick()
    const label = wrapper.find('[data-testid="gate-state-label"]')
    expect(label.text()).toMatch(/Not Started/i)
  })

  it('shows "Ready to Launch" when all complete', async () => {
    const { wrapper } = mountConsole(readyState())
    await nextTick()
    const label = wrapper.find('[data-testid="gate-state-label"]')
    expect(label.text()).toMatch(/Ready to Launch/i)
  })

  it('shows "Blocked" when blocked', async () => {
    const { wrapper } = mountConsole(blockedState())
    await nextTick()
    const label = wrapper.find('[data-testid="gate-state-label"]')
    expect(label.text()).toMatch(/Blocked/i)
  })
})

// ---------------------------------------------------------------------------
// Blocker count badge
// ---------------------------------------------------------------------------

describe('ComplianceLaunchConsole — blocker count badge', () => {
  it('shows blocker count badge when there are blockers (AC #3)', async () => {
    const { wrapper } = mountConsole(blockedState())
    await nextTick()
    const badge = wrapper.find('[data-testid="blocker-count-badge"]')
    expect(badge.exists()).toBe(true)
    expect(badge.text()).toMatch(/1 blocker/i)
  })

  it('does NOT show blocker count badge when there are no blockers', async () => {
    const { wrapper } = mountConsole(readyState())
    await nextTick()
    const badge = wrapper.find('[data-testid="blocker-count-badge"]')
    expect(badge.exists()).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Domain cards
// ---------------------------------------------------------------------------

describe('ComplianceLaunchConsole — domain cards', () => {
  it('renders a domain card for each step', async () => {
    const { wrapper } = mountConsole(notStartedState())
    await nextTick()
    const cards = wrapper.findAll('[data-testid^="domain-card-"]')
    expect(cards.length).toBe(5)
  })

  it('shows domain label in card header', async () => {
    const { wrapper } = mountConsole(notStartedState())
    await nextTick()
    const label = wrapper.find('[data-testid="domain-label-jurisdiction"]')
    expect(label.exists()).toBe(true)
    expect(label.text()).toMatch(/Jurisdiction/i)
  })

  it('shows "Not Started" badge when step is not started', async () => {
    const { wrapper } = mountConsole(notStartedState())
    await nextTick()
    const badge = wrapper.find('[data-testid="domain-status-badge-jurisdiction"]')
    expect(badge.text()).toMatch(/Not Started/i)
  })

  it('shows "Ready" badge when step is complete', async () => {
    const { wrapper } = mountConsole(readyState())
    await nextTick()
    const badge = wrapper.find('[data-testid="domain-status-badge-jurisdiction"]')
    expect(badge.text()).toMatch(/Ready/i)
  })
})

// ---------------------------------------------------------------------------
// Expand/collapse domain detail
// ---------------------------------------------------------------------------

describe('ComplianceLaunchConsole — expand domain detail', () => {
  it('domain detail panel is hidden by default', async () => {
    const { wrapper } = mountConsole(notStartedState())
    await nextTick()
    const detail = wrapper.find('[data-testid="domain-detail-jurisdiction"]')
    expect(detail.exists()).toBe(false)
  })

  it('clicking domain header reveals the detail panel', async () => {
    const { wrapper } = mountConsole(notStartedState())
    await nextTick()
    const header = wrapper.find('[data-testid="domain-header-jurisdiction"]')
    await header.trigger('click')
    await nextTick()
    const detail = wrapper.find('[data-testid="domain-detail-jurisdiction"]')
    expect(detail.exists()).toBe(true)
  })

  it('clicking domain header again collapses the detail panel', async () => {
    const { wrapper } = mountConsole(notStartedState())
    await nextTick()
    const header = wrapper.find('[data-testid="domain-header-jurisdiction"]')
    await header.trigger('click')
    await nextTick()
    await header.trigger('click')
    await nextTick()
    const detail = wrapper.find('[data-testid="domain-detail-jurisdiction"]')
    expect(detail.exists()).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Blocker what/why/how (AC #3)
// ---------------------------------------------------------------------------

describe('ComplianceLaunchConsole — blocker guidance', () => {
  it('renders what / why / how sections for each blocker (AC #3)', async () => {
    const { wrapper } = mountConsole(blockedState())
    await nextTick()

    // Expand jurisdiction domain
    const header = wrapper.find('[data-testid="domain-header-jurisdiction"]')
    await header.trigger('click')
    await nextTick()

    const whatEl = wrapper.find('[data-testid^="blocker-what-"]')
    const whyEl = wrapper.find('[data-testid^="blocker-why-"]')
    const howEl = wrapper.find('[data-testid^="blocker-how-"]')

    expect(whatEl.exists()).toBe(true)
    expect(whatEl.text()).toBeTruthy()
    expect(whyEl.exists()).toBe(true)
    expect(whyEl.text()).toBeTruthy()
    expect(howEl.exists()).toBe(true)
    expect(howEl.text()).toBeTruthy()
  })

  it('renders a "Fix this now" remediation link for each blocker', async () => {
    const { wrapper } = mountConsole(blockedState())
    await nextTick()

    const header = wrapper.find('[data-testid="domain-header-jurisdiction"]')
    await header.trigger('click')
    await nextTick()

    const link = wrapper.find('[data-testid^="blocker-link-"]')
    expect(link.exists()).toBe(true)
    expect(link.text()).toMatch(/Fix this now/i)
  })
})

// ---------------------------------------------------------------------------
// Evidence summary
// ---------------------------------------------------------------------------

describe('ComplianceLaunchConsole — evidence summary', () => {
  it('shows correct total domains count', async () => {
    const { wrapper } = mountConsole(notStartedState())
    await nextTick()
    const el = wrapper.find('[data-testid="summary-total-domains"]')
    expect(el.text()).toBe('5')
  })

  it('shows 5 ready domains when all complete', async () => {
    const { wrapper } = mountConsole(readyState())
    await nextTick()
    const el = wrapper.find('[data-testid="summary-ready-count"]')
    expect(el.text()).toBe('5')
  })

  it('shows 0 ready when nothing started', async () => {
    const { wrapper } = mountConsole(notStartedState())
    await nextTick()
    const el = wrapper.find('[data-testid="summary-ready-count"]')
    expect(el.text()).toBe('0')
  })

  it('shows blocker count in summary', async () => {
    const { wrapper } = mountConsole(blockedState())
    await nextTick()
    const el = wrapper.find('[data-testid="summary-blocker-count"]')
    expect(el.text()).toBe('1')
  })

  it('has link to open full compliance setup', async () => {
    const { wrapper } = mountConsole(notStartedState())
    await nextTick()
    const link = wrapper.find('[data-testid="open-full-setup-link"]')
    expect(link.exists()).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Analytics events (AC #9)
// ---------------------------------------------------------------------------

describe('ComplianceLaunchConsole — analytics events', () => {
  it('dispatches compliance_console_viewed on mount (AC #9)', async () => {
    const events: CustomEvent[] = []
    const handler = (e: Event) => events.push(e as CustomEvent)
    window.addEventListener('compliance:analytics', handler)

    mountConsole(notStartedState())
    await nextTick()

    window.removeEventListener('compliance:analytics', handler)

    const viewEvent = events.find((e) => e.detail?.eventName === 'compliance_console_viewed')
    expect(viewEvent).toBeDefined()
  })

  it('dispatches compliance_blocker_opened when a blocked domain is expanded (AC #9)', async () => {
    const events: CustomEvent[] = []
    const handler = (e: Event) => events.push(e as CustomEvent)
    window.addEventListener('compliance:analytics', handler)

    const { wrapper } = mountConsole(blockedState())
    await nextTick()

    const header = wrapper.find('[data-testid="domain-header-jurisdiction"]')
    await header.trigger('click')
    await nextTick()

    window.removeEventListener('compliance:analytics', handler)

    const blockerEvent = events.find((e) => e.detail?.eventName === 'compliance_blocker_opened')
    expect(blockerEvent).toBeDefined()
  })

  it('dispatches compliance_launch_attempted when Launch Token is clicked (AC #9)', async () => {
    const events: CustomEvent[] = []
    const handler = (e: Event) => events.push(e as CustomEvent)
    window.addEventListener('compliance:analytics', handler)

    const { wrapper } = mountConsole(readyState())
    await nextTick()

    const launchBtn = wrapper.find('[data-testid="launch-token-button"]')
    await launchBtn.trigger('click')
    await nextTick()

    window.removeEventListener('compliance:analytics', handler)

    const launchEvent = events.find((e) => e.detail?.eventName === 'compliance_launch_attempted')
    expect(launchEvent).toBeDefined()
  })

  it('analytics events have stable schema fields (AC #9)', async () => {
    const events: CustomEvent[] = []
    const handler = (e: Event) => events.push(e as CustomEvent)
    window.addEventListener('compliance:analytics', handler)

    mountConsole(notStartedState())
    await nextTick()

    window.removeEventListener('compliance:analytics', handler)

    const viewEvent = events.find((e) => e.detail?.eventName === 'compliance_console_viewed')
    expect(viewEvent).toBeDefined()
    const { detail } = viewEvent!
    expect(typeof detail.gateState).toBe('string')
    expect(typeof detail.primaryAction).toBe('string')
    expect(typeof detail.totalBlockers).toBe('number')
    expect(typeof detail.readinessScore).toBe('number')
    expect(typeof detail.timestampMs).toBe('number')
  })
})

// ---------------------------------------------------------------------------
// No wallet connector UI
// ---------------------------------------------------------------------------

describe('ComplianceLaunchConsole — no wallet connector UI', () => {
  it('does not render wallet-connector elements in any state', async () => {
    for (const state of [notStartedState(), readyState(), blockedState()]) {
      const { wrapper } = mountConsole(state)
      await nextTick()
      const html = wrapper.html().toLowerCase()
      expect(html).not.toContain('walletconnect')
      expect(html).not.toContain('metamask')
      expect(html).not.toMatch(/\bpera\b/)
      expect(html).not.toContain('defly')
    }
  })
})
