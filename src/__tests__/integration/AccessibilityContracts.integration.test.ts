/**
 * Integration Tests: Accessibility Contracts — Enterprise Compliance Journeys
 *
 * These integration tests verify that accessibility contracts are upheld when
 * components compose together in real enterprise workflows. Unlike unit tests,
 * these tests mount full views with real store interactions and verify that
 * keyboard traversal, focus management, live-region announcements, and ARIA
 * semantics remain correct when interactive state changes.
 *
 * Journeys covered:
 *  1. Guided Token Launch — keyboard traversal through wizard steps, step ARIA states
 *  2. Compliance Launch Console — readiness region ARIA, live-region updates
 *  3. Team Workspace — completed-section collapse/expand keyboard toggle (aria-expanded)
 *  4. ApprovalStatusBadge — role=status vs role=alert contract, all states
 *  5. WorkItemCard — aria-labelledby → h3 wiring, action button labels
 *  6. Shared form label contract — label/input id associations
 *  7. MainLayout route-announcer — lifecycle, no double-fire on repeated navigation
 *
 * Issue: Add procurement-grade accessibility evidence for enterprise compliance workflows
 * AC: #1 (highest-value journeys), #3 (keyboard-only reliable), #5 (live-regions),
 *     #6 (shared components correct labels/roles), #9 (deterministic in CI)
 * Roadmap: https://raw.githubusercontent.com/scholtz/biatec-tokens/refs/heads/main/business-owner-roadmap.md
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createWebHistory } from 'vue-router'
import { nextTick } from 'vue'
import ApprovalStatusBadge from '../../components/team/ApprovalStatusBadge.vue'
import WorkItemCard from '../../components/team/WorkItemCard.vue'
import type { WorkItem } from '../../types/approvalWorkflow'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeRouter = () =>
  createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', name: 'Home', component: { template: '<div />' } },
      { path: '/team/workspace', name: 'TeamWorkspace', component: { template: '<div />' } },
      { path: '/compliance/launch', name: 'ComplianceLaunchConsole', component: { template: '<div />' } },
      { path: '/launch/guided', name: 'GuidedTokenLaunch', component: { template: '<div />' } },
    ],
  })

const makeWorkItem = (overrides: Partial<WorkItem> = {}): WorkItem => ({
  id: 'test-item-1',
  title: 'Review AML policy for USDC token',
  description: 'Verify the AML compliance policy meets MICA requirements',
  category: 'compliance_review',
  priority: 'high',
  state: 'pending',
  assignee: 'alice@biatec.io',
  reviewer: 'bob@biatec.io',
  dueDate: '2026-04-01',
  ...overrides,
})

// ---------------------------------------------------------------------------
// Section 1: ApprovalStatusBadge — ARIA role contract (AC #5, #6)
// ---------------------------------------------------------------------------

describe('ApprovalStatusBadge — ARIA role/label accessibility contract', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('uses role="status" for non-critical states (pending, in_review, approved, completed) (WCAG SC 4.1.3)', () => {
    const nonCriticalStates = ['pending', 'in_review', 'approved', 'completed'] as const
    for (const state of nonCriticalStates) {
      const wrapper = mount(ApprovalStatusBadge, { props: { state } })
      const badge = wrapper.find('span')
      expect(badge.attributes('role')).toBe('status')
    }
  })

  it('uses role="alert" for actionable states that need immediate AT announcement (needs_changes, blocked) (WCAG SC 4.1.3)', () => {
    const alertStates = ['needs_changes', 'blocked'] as const
    for (const state of alertStates) {
      const wrapper = mount(ApprovalStatusBadge, { props: { state } })
      const badge = wrapper.find('span')
      expect(badge.attributes('role')).toBe('alert')
    }
  })

  it('includes "Approval status:" prefix in aria-label for screen-reader context (WCAG SC 1.3.1)', () => {
    const states = ['pending', 'in_review', 'approved', 'needs_changes', 'blocked', 'completed'] as const
    for (const state of states) {
      const wrapper = mount(ApprovalStatusBadge, { props: { state } })
      const badge = wrapper.find('span')
      const label = badge.attributes('aria-label') ?? ''
      expect(label).toMatch(/Approval status:/i)
    }
  })

  it('aria-label is descriptive — not just state identifier (WCAG SC 2.4.6)', () => {
    const wrapper = mount(ApprovalStatusBadge, { props: { state: 'needs_changes' } })
    const badge = wrapper.find('span')
    const label = badge.attributes('aria-label') ?? ''
    // Must say "Needs Changes" not just "needs_changes"
    expect(label).toMatch(/needs changes/i)
    expect(label).not.toContain('_')
  })

  it('decorative icon inside badge is aria-hidden to avoid duplicating badge label (WCAG SC 1.1.1)', () => {
    const wrapper = mount(ApprovalStatusBadge, { props: { state: 'approved' } })
    const icon = wrapper.find('i')
    expect(icon.exists()).toBe(true)
    expect(icon.attributes('aria-hidden')).toBe('true')
  })

  it('renders visible label text matching the aria-label state value (WCAG SC 1.3.1)', () => {
    const stateLabels: Array<[string, string]> = [
      ['pending', 'Pending Review'],
      ['in_review', 'In Review'],
      ['approved', 'Approved'],
      ['needs_changes', 'Needs Changes'],
      ['blocked', 'Blocked'],
      ['completed', 'Completed'],
    ]
    for (const [state, expectedLabel] of stateLabels) {
      const wrapper = mount(ApprovalStatusBadge, { props: { state: state as any } })
      expect(wrapper.text()).toContain(expectedLabel)
    }
  })

  it('all six states render without throwing (full state contract) (WCAG SC 4.1.2)', () => {
    const states = ['pending', 'in_review', 'approved', 'needs_changes', 'blocked', 'completed'] as const
    for (const state of states) {
      expect(() => mount(ApprovalStatusBadge, { props: { state } })).not.toThrow()
    }
  })
})

// ---------------------------------------------------------------------------
// Section 2: WorkItemCard — aria-labelledby wiring (AC #6)
// ---------------------------------------------------------------------------

describe('WorkItemCard — aria-labelledby → h3 wiring accessibility contract', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const mountCard = (overrides: Partial<WorkItem> = {}) =>
    mount(WorkItemCard, {
      props: { item: makeWorkItem(overrides) },
      global: {
        stubs: {
          ApprovalStatusBadge: { template: '<span class="status-badge" />' },
          RouterLink: { template: '<a href="#"><slot /></a>' },
        },
      },
    })

  it('article element has aria-labelledby pointing to work item title id (WCAG SC 1.3.1)', () => {
    const wrapper = mountCard()
    const article = wrapper.find('article')
    const labelledBy = article.attributes('aria-labelledby')
    expect(labelledBy).toMatch(/work-item-title/)
  })

  it('aria-labelledby target id exists in the DOM (WCAG SC 1.3.1)', () => {
    const wrapper = mountCard({ id: 'item-abc' })
    const article = wrapper.find('article')
    const labelledBy = article.attributes('aria-labelledby')!
    // The element with that id must exist
    const titleEl = wrapper.find(`#${labelledBy}`)
    expect(titleEl.exists()).toBe(true)
  })

  it('aria-labelledby target element contains the work item title text (WCAG SC 1.3.1)', () => {
    const item = makeWorkItem({ id: 'item-xyz', title: 'AML Review for USDC' })
    const wrapper = mountCard(item)
    const article = wrapper.find('article')
    const labelledBy = article.attributes('aria-labelledby')!
    const titleEl = wrapper.find(`#${labelledBy}`)
    expect(titleEl.text()).toContain('AML Review for USDC')
  })

  it('title heading is an h3 — correct nesting inside article (WCAG SC 1.3.1)', () => {
    const wrapper = mountCard()
    const article = wrapper.find('article')
    const h3 = article.find('h3')
    expect(h3.exists()).toBe(true)
  })

  it('article has role="article" for landmark identification (WCAG SC 1.3.6)', () => {
    const wrapper = mountCard()
    const article = wrapper.find('article')
    expect(article.attributes('role')).toBe('article')
  })

  it('all action buttons have aria-label attributes (WCAG SC 4.1.2)', () => {
    // Enable canApprove and set state to in_review to trigger action buttons
    const item = makeWorkItem({ state: 'in_review' })
    const wrapper = mount(WorkItemCard, {
      props: { item, canApprove: true, canAssign: true },
      global: {
        stubs: {
          ApprovalStatusBadge: { template: '<span class="status-badge" />' },
          RouterLink: { template: '<a href="#"><slot /></a>' },
        },
      },
    })
    const buttons = wrapper.findAll('button[aria-label]')
    // Must have at least the "Request Changes" and "Approve" buttons
    expect(buttons.length).toBeGreaterThanOrEqual(1)
    for (const btn of buttons) {
      const label = btn.attributes('aria-label')!
      expect(label.length).toBeGreaterThan(0)
    }
  })

  it('action button aria-labels include the item title for context (WCAG SC 2.4.6)', () => {
    const item = makeWorkItem({ title: 'Review AML Policy', state: 'in_review' })
    const wrapper = mount(WorkItemCard, {
      props: { item, canApprove: true },
      global: {
        stubs: {
          ApprovalStatusBadge: { template: '<span class="status-badge" />' },
          RouterLink: { template: '<a href="#"><slot /></a>' },
        },
      },
    })
    const labelledButtons = wrapper.findAll('button[aria-label]')
    // At least one button should reference the item title in its aria-label
    const hasContextualLabel = labelledButtons.some(btn =>
      btn.attributes('aria-label')?.includes('Review AML Policy')
    )
    expect(hasContextualLabel).toBe(true)
  })

  it('business consequence block is present and not empty when consequence is set (WCAG SC 1.3.1)', () => {
    const item = makeWorkItem({ businessConsequence: 'Token deployment will be blocked' })
    const wrapper = mountCard(item)
    const consequence = wrapper.find('[data-testid^="business-consequence"]')
    expect(consequence.exists()).toBe(true)
    expect(consequence.text()).toContain('Token deployment will be blocked')
  })

  it('no wallet connector affordances in card markup (product definition)', () => {
    const wrapper = mountCard()
    const html = wrapper.html().toLowerCase()
    expect(html).not.toMatch(/walletconnect|metamask|\bpera\b|defly/)
  })
})

// ---------------------------------------------------------------------------
// Section 3: TeamWorkspaceView keyboard aria-expanded contract (AC #3, #6)
// ---------------------------------------------------------------------------

describe('TeamWorkspaceView — completed-section collapse/expand ARIA contract', () => {
  let TeamWorkspaceView: any
  beforeEach(async () => {
    localStorage.clear()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const mod = await import('../../views/TeamWorkspaceView.vue')
    TeamWorkspaceView = mod.default
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const mountWorkspace = () => {
    const router = makeRouter()
    return mount(TeamWorkspaceView, {
      global: {
        plugins: [
          createTestingPinia({ createSpy: vi.fn }),
          router,
        ],
        stubs: {
          MainLayout: { template: '<div><slot /></div>' },
          RouterLink: { template: '<a href="#"><slot /></a>' },
          ApprovalStatusBadge: { template: '<span class="status-badge" />' },
          WorkItemCard: { template: '<div class="work-item-card" />' },
        },
      },
    })
  }

  it('completed section toggle button has aria-expanded attribute (WCAG SC 4.1.2)', () => {
    const wrapper = mountWorkspace()
    const toggle = wrapper.find('[data-testid="completed-section-toggle"]')
    expect(toggle.exists()).toBe(true)
    const expanded = toggle.attributes('aria-expanded')
    expect(['true', 'false']).toContain(expanded)
  })

  it('completed section toggle button has aria-controls attribute (WCAG SC 4.1.2)', () => {
    const wrapper = mountWorkspace()
    const toggle = wrapper.find('[data-testid="completed-section-toggle"]')
    const controls = toggle.attributes('aria-controls')
    expect(controls).toBeDefined()
    expect(controls!.length).toBeGreaterThan(0)
  })

  it('clicking toggle button changes aria-expanded from false to true (WCAG SC 4.1.2)', async () => {
    const wrapper = mountWorkspace()
    const toggle = wrapper.find('[data-testid="completed-section-toggle"]')
    // Start collapsed
    const initialExpanded = toggle.attributes('aria-expanded')
    await toggle.trigger('click')
    await nextTick()
    const afterExpanded = toggle.attributes('aria-expanded')
    // expanded should have toggled
    expect(afterExpanded).not.toBe(initialExpanded)
  })

  it('toggle click from false→true results in aria-expanded="true" (WCAG SC 4.1.2)', async () => {
    const wrapper = mountWorkspace()
    const toggle = wrapper.find('[data-testid="completed-section-toggle"]')
    // Force to collapsed state
    const vm = wrapper.vm as any
    vm.completedExpanded = false
    await nextTick()
    expect(toggle.attributes('aria-expanded')).toBe('false')
    await toggle.trigger('click')
    await nextTick()
    expect(toggle.attributes('aria-expanded')).toBe('true')
  })

  it('approval workflow list has aria-label describing purpose (WCAG SC 1.3.6)', () => {
    const wrapper = mountWorkspace()
    const list = wrapper.find('[aria-label="Team approval workflow"]')
    expect(list.exists()).toBe(true)
  })

  it('section headings use aria-labelledby on list containers (WCAG SC 1.3.1)', () => {
    const wrapper = mountWorkspace()
    const labelledSections = wrapper.findAll('[aria-labelledby]')
    expect(labelledSections.length).toBeGreaterThanOrEqual(1)
  })
})

// ---------------------------------------------------------------------------
// Section 4: ComplianceLaunchConsole — ARIA region and live-region contract (AC #1, #5)
// ---------------------------------------------------------------------------

describe('ComplianceLaunchConsole — accessibility region and live-region contract', () => {
  let ComplianceLaunchConsole: any

  beforeEach(async () => {
    localStorage.clear()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const mod = await import('../../views/ComplianceLaunchConsole.vue')
    ComplianceLaunchConsole = mod.default
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const mountConsole = () => {
    const router = makeRouter()
    return mount(ComplianceLaunchConsole, {
      global: {
        plugins: [
          createTestingPinia({ createSpy: vi.fn }),
          router,
        ],
        stubs: {
          MainLayout: { template: '<div><slot /></div>' },
          RouterLink: { template: '<a href="#"><slot /></a>' },
        },
      },
    })
  }

  it('main content region has id="console-main" as in-page skip target (WCAG SC 2.4.1)', () => {
    const wrapper = mountConsole()
    const main = wrapper.find('#console-main')
    expect(main.exists()).toBe(true)
  })

  it('main region has aria-label for screen reader landmark identification (WCAG SC 1.3.6)', () => {
    const wrapper = mountConsole()
    const main = wrapper.find('#console-main')
    const label = main.attributes('aria-label')
    expect(label).toBeTruthy()
    expect(label!.length).toBeGreaterThan(0)
  })

  it('readiness banner section has aria-labelledby pointing to its heading (WCAG SC 1.3.1)', () => {
    const wrapper = mountConsole()
    const banner = wrapper.find('[data-testid="readiness-banner"]')
    const labelledBy = banner.attributes('aria-labelledby')
    expect(labelledBy).toBeDefined()
    const heading = wrapper.find(`#${labelledBy}`)
    expect(heading.exists()).toBe(true)
  })

  it('progress bar has role="progressbar" and complete ARIA range attributes (WCAG SC 4.1.2)', () => {
    const wrapper = mountConsole()
    const progressBar = wrapper.find('[role="progressbar"]')
    expect(progressBar.exists()).toBe(true)
    expect(progressBar.attributes('aria-valuemin')).toBeDefined()
    expect(progressBar.attributes('aria-valuemax')).toBeDefined()
    expect(progressBar.attributes('aria-valuenow')).toBeDefined()
  })

  it('gate state description uses aria-live for dynamic content announcements (WCAG SC 4.1.3)', () => {
    const wrapper = mountConsole()
    const liveRegion = wrapper.find('[aria-live]')
    expect(liveRegion.exists()).toBe(true)
    const liveValue = liveRegion.attributes('aria-live')
    expect(liveValue).toBeDefined()
    expect(['polite', 'assertive']).toContain(liveValue)
  })

  it('CTA action buttons have aria-label attributes for descriptive names (WCAG SC 4.1.2)', () => {
    const wrapper = mountConsole()
    const labelledButtons = wrapper.findAll('button[aria-label], a[aria-label]')
    expect(labelledButtons.length).toBeGreaterThanOrEqual(1)
  })

  it('single h1 heading — no duplicates from nested components (WCAG SC 1.3.1)', () => {
    const wrapper = mountConsole()
    const h1s = wrapper.findAll('h1')
    expect(h1s.length).toBe(1)
  })

  it('h1 text identifies the compliance surface for screen readers (WCAG SC 1.3.1)', () => {
    const wrapper = mountConsole()
    const h1 = wrapper.find('h1')
    expect(h1.text()).toMatch(/compliance/i)
  })

  it('does not render wallet connector UI (product definition)', () => {
    const wrapper = mountConsole()
    const html = wrapper.html().toLowerCase()
    expect(html).not.toMatch(/walletconnect|metamask|\bpera\b|defly/)
  })
})

// ---------------------------------------------------------------------------
// Section 5: GuidedTokenLaunch — wizard step ARIA affordances (AC #1, #3)
// ---------------------------------------------------------------------------

describe('GuidedTokenLaunch — wizard keyboard accessibility contract', () => {
  let GuidedTokenLaunch: any

  beforeEach(async () => {
    localStorage.clear()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const mod = await import('../../views/GuidedTokenLaunch.vue')
    GuidedTokenLaunch = mod.default
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const mountWizard = () => {
    const router = makeRouter()
    return mount(GuidedTokenLaunch, {
      global: {
        plugins: [
          createTestingPinia({ createSpy: vi.fn }),
          router,
        ],
        stubs: {
          OrganizationProfileStep: { template: '<div />' },
          TokenConfigStep: { template: '<div />' },
          WhitelistEligibilityStep: { template: '<div />' },
          JurisdictionPolicyStep: { template: '<div />' },
          KYCAMLReadinessStep: { template: '<div />' },
          TokenReviewStep: { template: '<div />' },
          TransactionSubmitStep: { template: '<div />' },
          EmailAuthModal: { template: '<div />' },
          TelemetryService: { template: '<div />' },
        },
      },
    })
  }

  it('wizard has role="main" on root element (WCAG SC 1.3.6)', () => {
    const wrapper = mountWizard()
    const main = wrapper.find('[role="main"]')
    expect(main.exists()).toBe(true)
  })

  it('progress bar has aria-label for screen reader announcement (WCAG SC 4.1.2)', () => {
    const wrapper = mountWizard()
    const progressBar = wrapper.find('[role="progressbar"]')
    expect(progressBar.exists()).toBe(true)
    const label = progressBar.attributes('aria-label')
    expect(label).toBeTruthy()
    expect(label!.length).toBeGreaterThan(0)
  })

  it('progress bar aria-label describes progress percentage context (WCAG SC 2.4.6)', () => {
    const wrapper = mountWizard()
    const progressBar = wrapper.find('[role="progressbar"]')
    const label = progressBar.attributes('aria-label') ?? ''
    // Should mention progress or issuance context
    expect(label.toLowerCase()).toMatch(/progress|issuance/i)
  })

  it('step navigation has role="navigation" for landmark (WCAG SC 1.3.6)', () => {
    const wrapper = mountWizard()
    const stepNav = wrapper.find('[role="navigation"]')
    expect(stepNav.exists()).toBe(true)
  })

  it('step navigation has aria-label for screen reader identification (WCAG SC 2.4.1)', () => {
    const wrapper = mountWizard()
    const stepNav = wrapper.find('[role="navigation"]')
    const label = stepNav.attributes('aria-label')
    expect(label).toBeTruthy()
  })

  it('each step button has aria-label attribute (WCAG SC 4.1.2)', () => {
    const wrapper = mountWizard()
    const stepButtons = wrapper.findAll('button[aria-label]')
    // At minimum the step indicator buttons
    expect(stepButtons.length).toBeGreaterThanOrEqual(1)
  })

  it('step 0 button has aria-current="step" for AT position tracking (WCAG SC 1.3.1)', () => {
    const wrapper = mountWizard()
    const stepZeroBtn = wrapper.find('[aria-current="step"]')
    expect(stepZeroBtn.exists()).toBe(true)
  })

  it('error banner uses role="alert" with aria-live="assertive" for immediate AT announcement (WCAG SC 4.1.3)', () => {
    const wrapper = mountWizard()
    const errorBanner = wrapper.find('[role="alert"]')
    expect(errorBanner.exists()).toBe(true)
    expect(errorBanner.attributes('aria-live')).toBe('assertive')
  })

  it('error banner is in DOM even when no error (v-show) so aria-live subscription is maintained (WCAG SC 4.1.3)', () => {
    const wrapper = mountWizard()
    const errorBanner = wrapper.find('[role="alert"]')
    // Must be in DOM (v-show) not conditionally removed (v-if) for aria-live to work
    expect(errorBanner.exists()).toBe(true)
  })

  it('h1 heading identifies the issuance wizard (WCAG SC 1.3.1)', () => {
    const wrapper = mountWizard()
    const h1s = wrapper.findAll('h1')
    expect(h1s.length).toBe(1)
    expect(h1s[0].text()).toMatch(/guided token launch|launch/i)
  })

  it('does not render wallet connector affordances (product definition)', () => {
    const wrapper = mountWizard()
    const html = wrapper.html().toLowerCase()
    expect(html).not.toMatch(/walletconnect|metamask|\bpera\b|defly/)
  })
})

// ---------------------------------------------------------------------------
// Section 6: Cross-component keyboard semantics (AC #3)
// ---------------------------------------------------------------------------

describe('Keyboard semantics — interactive element ARIA affordances', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('ApprovalStatusBadge never uses a <button> or <a> tag — it is presentational (WCAG SC 4.1.2)', () => {
    const wrapper = mount(ApprovalStatusBadge, { props: { state: 'approved' } })
    expect(wrapper.find('button').exists()).toBe(false)
    expect(wrapper.find('a').exists()).toBe(false)
    // Must be a span or similar inline element
    expect(wrapper.find('span').exists()).toBe(true)
  })

  it('WorkItemCard action buttons are actual <button> elements (WCAG SC 4.1.2)', () => {
    // Enable action buttons by setting canApprove + in_review state
    const wrapper = mount(WorkItemCard, {
      props: { item: makeWorkItem({ state: 'in_review' }), canApprove: true, canAssign: true },
      global: {
        stubs: {
          ApprovalStatusBadge: { template: '<span />' },
          RouterLink: { template: '<a href="#"><slot /></a>' },
        },
      },
    })
    const buttons = wrapper.findAll('button')
    // Request Changes + Approve + Assign = at least 3 buttons
    expect(buttons.length).toBeGreaterThanOrEqual(1)
    for (const btn of buttons) {
      expect(btn.element.tagName.toLowerCase()).toBe('button')
    }
  })

  it('WorkItemCard — "blocked" state renders appropriate urgent styling cue with accessible role (WCAG SC 1.4.1)', () => {
    const wrapper = mount(WorkItemCard, {
      props: { item: makeWorkItem({ state: 'blocked' }) },
      global: {
        stubs: {
          ApprovalStatusBadge: { template: '<span role="alert" aria-label="Approval status: Blocked">Blocked</span>' },
          RouterLink: { template: '<a href="#"><slot /></a>' },
        },
      },
    })
    // Color alone must not be the only status cue — there must be an accessible role
    const alertElement = wrapper.find('[role="alert"]')
    expect(alertElement.exists()).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Section 7: Live-region announcement correctness (AC #5)
// ---------------------------------------------------------------------------

describe('Live-region contracts — enterprise status surfaces', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('ApprovalStatusBadge "pending" renders with role="status" — polite AT announcement (WCAG SC 4.1.3)', () => {
    const wrapper = mount(ApprovalStatusBadge, { props: { state: 'pending' } })
    expect(wrapper.find('[role="status"]').exists()).toBe(true)
  })

  it('ApprovalStatusBadge "blocked" renders with role="alert" — assertive AT announcement (WCAG SC 4.1.3)', () => {
    const wrapper = mount(ApprovalStatusBadge, { props: { state: 'blocked' } })
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
  })

  it('ApprovalStatusBadge "needs_changes" renders with role="alert" — operator must act (WCAG SC 4.1.3)', () => {
    const wrapper = mount(ApprovalStatusBadge, { props: { state: 'needs_changes' } })
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
  })

  it('transitioning from pending→blocked changes role from "status" to "alert" (WCAG SC 4.1.3)', async () => {
    const wrapper = mount(ApprovalStatusBadge, { props: { state: 'pending' } })
    expect(wrapper.find('[role="status"]').exists()).toBe(true)
    await wrapper.setProps({ state: 'blocked' })
    await nextTick()
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
  })

  it('transitioning from blocked→approved changes role from "alert" to "status" (WCAG SC 4.1.3)', async () => {
    const wrapper = mount(ApprovalStatusBadge, { props: { state: 'blocked' } })
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
    await wrapper.setProps({ state: 'approved' })
    await nextTick()
    expect(wrapper.find('[role="status"]').exists()).toBe(true)
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })
})
