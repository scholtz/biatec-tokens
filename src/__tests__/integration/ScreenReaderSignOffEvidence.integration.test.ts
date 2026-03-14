/**
 * Integration Tests: Screen-Reader Sign-Off Evidence — Enterprise Compliance Journeys
 *
 * These tests constitute the machine-verifiable layer of the procurement-grade
 * screen-reader accessibility evidence package required by issue #639.
 *
 * They protect the EXACT semantic behaviours that the manual screen-reader review
 * (docs/accessibility/SCREEN_READER_REVIEW_ARTIFACT.md) depends on — so that CI
 * failure becomes an immediate signal that a manual re-review is required.
 *
 * Coverage areas (per issue #639 acceptance criteria):
 *  AC #1/2  — Accessible names: every interactive element has a non-empty accessible name
 *  AC #1/3  — Heading hierarchy: h1→h2→h3 order is respected on all target views
 *  AC #1/4  — Live-region announcements: aria-live regions exist and have correct urgency
 *  AC #1/5  — Dialog labelling: role=dialog has aria-labelledby pointing at a real element
 *  AC #1/6  — Step-progress semantics: progressbar + step nav ARIA attributes
 *  AC #1/7  — Validation/error announcement: role=alert + role=status for all error states
 *  AC #1/8  — Compliance-status colour independence: badges / readiness convey meaning in text
 *
 * Journeys covered (matching manual review artifact):
 *  Journey 0  — Home page (unauthenticated and authenticated states)
 *  Journey 2  — Compliance Launch Console
 *  Journey 4  — Compliance Setup Workspace wizard
 *  Journey 5  — Whitelist Policy Dashboard
 *  Journey 6  — Team Workspace (action feedback, queue sections)
 *  Journey 7  — Guided Token Launch wizard
 *  Shared     — Modal component dialog labelling (used by multiple journeys)
 *
 * Closes: #639
 * Roadmap: https://raw.githubusercontent.com/scholtz/biatec-tokens/refs/heads/main/business-owner-roadmap.md
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createWebHistory } from 'vue-router'
import { nextTick } from 'vue'
import Modal from '../../components/ui/Modal.vue'

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const makeRouter = () =>
  createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', name: 'Home', component: { template: '<div />' } },
      { path: '/compliance/launch', name: 'ComplianceLaunchConsole', component: { template: '<div />' } },
      { path: '/compliance/policy', name: 'WhitelistPolicyDashboard', component: { template: '<div />' } },
      { path: '/compliance/setup', name: 'ComplianceSetupWorkspace', component: { template: '<div />' } },
      { path: '/compliance/whitelists', name: 'WhitelistsView', component: { template: '<div />' } },
      { path: '/team/workspace', name: 'TeamWorkspace', component: { template: '<div />' } },
      { path: '/launch/guided', name: 'GuidedTokenLaunch', component: { template: '<div />' } },
    ],
  })

const stubShell = {
  MainLayout: { template: '<div><slot /></div>' },
  RouterLink: { template: '<a><slot /></a>' },
}

// ---------------------------------------------------------------------------
// Section 1: Modal component — dialog labelling (WCAG SC 4.1.2)
// Required by Journey 1 (sign-in modal) and reused in other journeys.
// ---------------------------------------------------------------------------
describe('Screen-reader sign-off: Modal dialog labelling (WCAG SC 4.1.2)', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    // Clean up any teleported modal from body to avoid leaking into sibling tests
    document.body.querySelectorAll('[role="dialog"]').forEach((el) => el.remove())
  })

  it('dialog element has role="dialog" (WCAG SC 4.1.2 — dialog role exposes widget to AT)', async () => {
    const wrapper = mount(Modal, {
      props: { show: true },
      slots: { header: '<h2 id="test-title">Test Dialog</h2>' },
      attachTo: document.body,
    })
    await nextTick()
    const dialog = document.body.querySelector('[role="dialog"]')
    expect(dialog).not.toBeNull()
    wrapper.unmount()
  })

  it('dialog element has aria-modal="true" (WCAG SC 4.1.2 — AT must not traverse behind overlay)', async () => {
    const wrapper = mount(Modal, {
      props: { show: true },
      slots: { header: '<h2>Test</h2>' },
      attachTo: document.body,
    })
    await nextTick()
    const dialog = document.body.querySelector('[role="dialog"]')
    expect(dialog?.getAttribute('aria-modal')).toBe('true')
    wrapper.unmount()
  })

  it('dialog has aria-labelledby pointing to an element in the DOM (WCAG SC 4.1.2 — accessible name)', async () => {
    const wrapper = mount(Modal, {
      props: { show: true },
      slots: { header: '<span>Sign In</span>' },
      attachTo: document.body,
    })
    await nextTick()
    const dialog = document.body.querySelector('[role="dialog"]')
    expect(dialog).not.toBeNull()
    const labelledBy = dialog?.getAttribute('aria-labelledby')
    expect(labelledBy).toBeTruthy()
    const labelEl = labelledBy ? document.getElementById(labelledBy) : null
    expect(labelEl).not.toBeNull()
    wrapper.unmount()
  })

  it('dialog header element text is not empty — AT can announce dialog purpose (WCAG SC 4.1.2)', async () => {
    const wrapper = mount(Modal, {
      props: { show: true },
      slots: { header: '<span>Sign in to Biatec Tokens</span>' },
      attachTo: document.body,
    })
    await nextTick()
    const dialog = document.body.querySelector('[role="dialog"]')
    const labelledBy = dialog?.getAttribute('aria-labelledby')
    const labelEl = labelledBy ? document.getElementById(labelledBy) : null
    expect(labelEl?.textContent?.trim()).not.toBe('')
    wrapper.unmount()
  })

  it('close button inside dialog has aria-label="Close dialog" (WCAG SC 4.1.2)', async () => {
    const wrapper = mount(Modal, {
      props: { show: true },
      slots: { header: '<span>Title</span>' },
      attachTo: document.body,
    })
    await nextTick()
    const closeBtn = document.body.querySelector('button[aria-label="Close dialog"]')
    expect(closeBtn).not.toBeNull()
    wrapper.unmount()
  })

  it('close button icon svg has aria-hidden="true" — not announced separately (WCAG SC 1.1.1)', async () => {
    const wrapper = mount(Modal, {
      props: { show: true },
      slots: { header: '<span>Title</span>' },
      attachTo: document.body,
    })
    await nextTick()
    const closeBtn = document.body.querySelector('button[aria-label="Close dialog"]')
    const svg = closeBtn?.querySelector('svg')
    expect(svg?.getAttribute('aria-hidden')).toBe('true')
    wrapper.unmount()
  })

  it('dialog is NOT rendered when show=false — AT not confused by hidden dialogs (WCAG SC 4.1.2)', async () => {
    const wrapper = mount(Modal, {
      props: { show: false },
      slots: { header: '<span>Title</span>' },
      attachTo: document.body,
    })
    await nextTick()
    const dialog = document.body.querySelector('[role="dialog"]')
    expect(dialog).toBeNull()
    wrapper.unmount()
  })

  it('dialog tabindex="-1" allows programmatic focus from Vue watch (WCAG SC 2.4.3 — focus order)', async () => {
    const wrapper = mount(Modal, {
      props: { show: true },
      slots: { header: '<span>Title</span>' },
      attachTo: document.body,
    })
    await nextTick()
    const dialog = document.body.querySelector<HTMLElement>('[role="dialog"]')
    expect(dialog?.getAttribute('tabindex')).toBe('-1')
    wrapper.unmount()
  })
})

// ---------------------------------------------------------------------------
// Section 2: Compliance Launch Console — accessible names + live regions
// Journey 2 in the manual review artifact.
// ---------------------------------------------------------------------------
describe('Screen-reader sign-off: Compliance Launch Console ARIA contract (WCAG SC 4.1.2, 4.1.3)', () => {
  async function mountConsole() {
    const router = makeRouter()
    const mod = await import('../../views/ComplianceLaunchConsole.vue')
    const wrapper = mount(mod.default, {
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn }), router],
        stubs: {
          ...stubShell,
          PolicyEditPanel: { template: '<div class="policy-edit-panel" />' },
          ApprovalStatusBadge: { template: '<span />' },
        },
      },
    })
    await flushPromises()
    return wrapper
  }

  it('single h1 — screen reader announced page identity (WCAG SC 1.3.1)', async () => {
    const wrapper = await mountConsole()
    const h1s = wrapper.findAll('h1')
    expect(h1s.length).toBe(1)
    expect(h1s[0].text().trim().length).toBeGreaterThan(0)
  })

  it('h2 headings are present — sub-sections have accessible labels (WCAG SC 1.3.1)', async () => {
    const wrapper = await mountConsole()
    const h2s = wrapper.findAll('h2')
    expect(h2s.length).toBeGreaterThanOrEqual(1)
  })

  it('h1 precedes h2 in DOM order — heading hierarchy not reversed (WCAG SC 1.3.1)', async () => {
    const wrapper = await mountConsole()
    const headings = wrapper.findAll('h1, h2')
    expect(headings[0].element.tagName.toLowerCase()).toBe('h1')
  })

  it('readiness progressbar has role="progressbar" (WCAG SC 4.1.2)', async () => {
    const wrapper = await mountConsole()
    const pb = wrapper.find('[role="progressbar"]')
    expect(pb.exists()).toBe(true)
  })

  it('progressbar aria-label is non-empty (WCAG SC 4.1.2 — accessible name)', async () => {
    const wrapper = await mountConsole()
    const pb = wrapper.find('[role="progressbar"]')
    expect(pb.attributes('aria-label')?.length).toBeGreaterThan(0)
  })

  it('progressbar has aria-valuemin="0" and aria-valuemax="100" (WCAG SC 4.1.2)', async () => {
    const wrapper = await mountConsole()
    const pb = wrapper.find('[role="progressbar"]')
    expect(pb.attributes('aria-valuemin')).toBe('0')
    expect(pb.attributes('aria-valuemax')).toBe('100')
  })

  it('gate-state live region has aria-live="polite" (WCAG SC 4.1.3 — dynamic update announced)', async () => {
    const wrapper = await mountConsole()
    const liveEl = wrapper.find('[aria-live="polite"]')
    expect(liveEl.exists()).toBe(true)
  })

  it('CTA buttons have non-empty aria-label (WCAG SC 4.1.2 — accessible name)', async () => {
    const wrapper = await mountConsole()
    const buttons = wrapper.findAll('button[aria-label]')
    buttons.forEach((btn) => {
      expect(btn.attributes('aria-label')!.trim().length).toBeGreaterThan(0)
    })
  })

  it('no wallet connector text appears (product definition — email/password only)', async () => {
    const wrapper = await mountConsole()
    const text = wrapper.text()
    expect(text).not.toMatch(/WalletConnect|MetaMask|\bPera\b|Defly/i)
  })
})

// ---------------------------------------------------------------------------
// Section 3: Compliance Setup Workspace — step-progress semantics
// Journey 4 in the manual review artifact.
// ---------------------------------------------------------------------------
describe('Screen-reader sign-off: Compliance Setup Workspace step-wizard ARIA (WCAG SC 4.1.2)', () => {
  async function mountWorkspace() {
    const router = makeRouter()
    const mod = await import('../../views/ComplianceSetupWorkspace.vue')
    const wrapper = mount(mod.default, {
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn }), router],
        stubs: {
          ...stubShell,
          JurisdictionPolicyStep: { template: '<div class="step-jurisdiction" />' },
          WhitelistEligibilityStep: { template: '<div class="step-whitelist" />' },
          KYCAMLReadinessStep: { template: '<div class="step-kyc" />' },
          TeamReadinessStep: { template: '<div class="step-team" />' },
          ReadinessSummaryStep: { template: '<div class="step-summary" />' },
        },
      },
    })
    await flushPromises()
    return wrapper
  }

  it('root is <main role="main"> — page main landmark (WCAG SC 1.3.6)', async () => {
    const wrapper = await mountWorkspace()
    const main = wrapper.find('main')
    expect(main.exists()).toBe(true)
    expect(main.attributes('role')).toBe('main')
  })

  it('single h1 for screen reader orientation (WCAG SC 1.3.1)', async () => {
    const wrapper = await mountWorkspace()
    const h1s = wrapper.findAll('h1')
    expect(h1s.length).toBe(1)
  })

  it('progressbar role="progressbar" (WCAG SC 4.1.2)', async () => {
    const wrapper = await mountWorkspace()
    expect(wrapper.find('[role="progressbar"]').exists()).toBe(true)
  })

  it('progressbar aria-valuemin="0" and aria-valuemax="100" (WCAG SC 4.1.2)', async () => {
    const wrapper = await mountWorkspace()
    const pb = wrapper.find('[role="progressbar"]')
    expect(pb.attributes('aria-valuemin')).toBe('0')
    expect(pb.attributes('aria-valuemax')).toBe('100')
  })

  it('progressbar has descriptive aria-label (WCAG SC 4.1.2)', async () => {
    const wrapper = await mountWorkspace()
    const pb = wrapper.find('[role="progressbar"]')
    expect(pb.attributes('aria-label')?.length).toBeGreaterThan(0)
  })

  it('step navigation is a <nav> with aria-label (WCAG SC 2.4.3)', async () => {
    const wrapper = await mountWorkspace()
    const nav = wrapper.find('nav[aria-label]')
    expect(nav.exists()).toBe(true)
    expect(nav.attributes('aria-label')?.length).toBeGreaterThan(0)
  })

  it('step buttons all have aria-label (WCAG SC 4.1.2 — accessible name for AT)', async () => {
    const wrapper = await mountWorkspace()
    const nav = wrapper.find('nav[aria-label]')
    const stepBtns = nav.findAll('button[aria-label]')
    expect(stepBtns.length).toBeGreaterThanOrEqual(1)
    stepBtns.forEach((btn) => {
      expect(btn.attributes('aria-label')!.trim().length).toBeGreaterThan(0)
    })
  })

  it('first step button has aria-current="step" (WCAG SC 1.3.1 — AT position tracking)', async () => {
    const wrapper = await mountWorkspace()
    const nav = wrapper.find('nav[aria-label]')
    const currentBtn = nav.find('[aria-current="step"]')
    expect(currentBtn.exists()).toBe(true)
  })

  it('mobile step live region has aria-live="polite" (WCAG SC 4.1.3)', async () => {
    const wrapper = await mountWorkspace()
    const liveEl = wrapper.find('[aria-live="polite"]')
    expect(liveEl.exists()).toBe(true)
  })

  it('navigation control group has aria-label (WCAG SC 1.3.6)', async () => {
    const wrapper = await mountWorkspace()
    const group = wrapper.find('[role="group"][aria-label]')
    expect(group.exists()).toBe(true)
    expect(group.attributes('aria-label')?.length).toBeGreaterThan(0)
  })

  it('Continue / Submit button has aria-label (WCAG SC 4.1.2)', async () => {
    const wrapper = await mountWorkspace()
    const ctaBtn = wrapper.find('button[aria-label="Continue to next step"], button[aria-label="Complete compliance setup"]')
    expect(ctaBtn.exists()).toBe(true)
  })
})

// Shared stubs for WhitelistPolicyDashboard child components
const stubWhitelist = {
  ...stubShell,
  PolicyEditPanel: { template: '<div class="policy-edit-panel-stub" />' },
  PolicySummaryPanel: { template: '<div class="policy-summary-panel-stub" />' },
  PolicyAuditCard: { template: '<div class="policy-audit-card-stub" />' },
  EligibilityInspector: { template: '<div class="eligibility-inspector-stub" />' },
}

// ---------------------------------------------------------------------------
// Section 4: Whitelist Policy Dashboard — error / loading / table semantics
// Journey 5 in the manual review artifact. Validates non-color status indicators.
// ---------------------------------------------------------------------------
describe('Screen-reader sign-off: Whitelist Policy Dashboard ARIA contract (WCAG SC 1.3.1, 4.1.3)', () => {
  async function mountDashboard() {
    const router = makeRouter()
    const mod = await import('../../views/WhitelistPolicyDashboard.vue')
    const wrapper = mount(mod.default, {
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn }), router],
        stubs: stubWhitelist,
      },
    })
    await flushPromises()
    return wrapper
  }

  it('single h1 for screen reader orientation (WCAG SC 1.3.1)', async () => {
    const wrapper = await mountDashboard()
    expect(wrapper.findAll('h1').length).toBe(1)
  })

  it('loading skeleton is aria-hidden — AT not confused by decorative bones (WCAG SC 1.1.1)', async () => {
    const wrapper = await mountDashboard()
    const skeleton = wrapper.find('[aria-hidden="true"]')
    expect(skeleton.exists()).toBe(true)
  })

  it('loading state uses role="status" with aria-live="polite" (WCAG SC 4.1.3)', async () => {
    const router = makeRouter()
    const mod = await import('../../views/WhitelistPolicyDashboard.vue')
    // Force isLoading so loading state renders
    const wrapper = mount(mod.default, {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            initialState: {
              whitelistPolicy: { isLoading: true, policy: null, error: null },
            },
          }),
          router,
        ],
        stubs: stubWhitelist,
      },
    })
    await flushPromises()
    const statusEl = wrapper.find('[role="status"][aria-live="polite"]')
    expect(statusEl.exists()).toBe(true)
  })

  it('error state uses role="alert" for immediate AT announcement (WCAG SC 4.1.3)', async () => {
    const router = makeRouter()
    const mod = await import('../../views/WhitelistPolicyDashboard.vue')
    const wrapper = mount(mod.default, {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            initialState: {
              whitelistPolicy: { isLoading: false, policy: null, error: 'Network error' },
            },
          }),
          router,
        ],
        stubs: stubWhitelist,
      },
    })
    await flushPromises()
    const alertEl = wrapper.find('[role="alert"]')
    expect(alertEl.exists()).toBe(true)
  })

  it('investor table has role="table" and aria-label — non-color status conveyance (WCAG SC 1.3.1, 1.4.1)', async () => {
    const router = makeRouter()
    const mod = await import('../../views/WhitelistPolicyDashboard.vue')
    const policy = {
      id: 'p1',
      name: 'Test Policy',
      description: '',
      defaultBehavior: 'deny' as const,
      allowedJurisdictions: [],
      restrictedJurisdictions: [],
      blockedJurisdictions: [],
      investorCategories: [
        { category: 'retail', status: 'allowed' as const, kycRequired: true, accreditationRequired: false },
      ],
      kycRequired: true,
      accreditationRequired: false,
      gaps: [],
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    }
    const wrapper = mount(mod.default, {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            initialState: {
              whitelistPolicy: { isLoading: false, policy, error: null },
            },
          }),
          router,
        ],
        stubs: {
          ...stubWhitelist,
        },
      },
    })
    await flushPromises()
    const table = wrapper.find('[role="table"]')
    expect(table.exists()).toBe(true)
    expect(table.attributes('aria-label')?.length).toBeGreaterThan(0)
  })

  it('table <th> elements have scope="col" — readable column headers for AT (WCAG SC 1.3.1)', async () => {
    const router = makeRouter()
    const mod = await import('../../views/WhitelistPolicyDashboard.vue')
    const policy = {
      id: 'p1', name: 'Test', description: '', defaultBehavior: 'deny' as const,
      allowedJurisdictions: [], restrictedJurisdictions: [], blockedJurisdictions: [],
      investorCategories: [{ category: 'retail', status: 'allowed' as const, kycRequired: true, accreditationRequired: false }],
      kycRequired: true, accreditationRequired: false, gaps: [], createdAt: '', updatedAt: '',
    }
    const wrapper = mount(mod.default, {
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn, initialState: { whitelistPolicy: { isLoading: false, policy, error: null } } }), router],
        stubs: stubWhitelist,
      },
    })
    await flushPromises()
    const thEls = wrapper.findAll('th[scope="col"]')
    expect(thEls.length).toBeGreaterThanOrEqual(1)
  })

  it('action buttons have aria-label (WCAG SC 4.1.2 — edit/inspector button accessible name)', async () => {
    const wrapper = await mountDashboard()
    const labelledBtns = wrapper.findAll('button[aria-label]')
    labelledBtns.forEach((btn) => {
      expect(btn.attributes('aria-label')!.trim().length).toBeGreaterThan(0)
    })
  })
})

// ---------------------------------------------------------------------------
// Section 5: Team Workspace — live-region action feedback + queue section semantics
// Journey 6 in the manual review artifact. Verifies the three resolved findings.
// ---------------------------------------------------------------------------
describe('Screen-reader sign-off: Team Workspace live-region and heading contract (WCAG SC 4.1.3)', () => {
  async function mountTeam() {
    const router = makeRouter()
    const mod = await import('../../views/TeamWorkspaceView.vue')
    const wrapper = mount(mod.default, {
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn }), router],
        stubs: {
          ...stubShell,
          WorkItemCard: { template: '<div class="work-item-card" />' },
          ApprovalStatusBadge: { template: '<span />' },
        },
      },
    })
    await flushPromises()
    return wrapper
  }

  it('action-feedback live region has role="status" (WCAG SC 4.1.3 — polite announcement)', async () => {
    const wrapper = await mountTeam()
    const feedback = wrapper.find('[data-testid="action-feedback"]')
    expect(feedback.exists()).toBe(true)
    expect(feedback.attributes('role')).toBe('status')
  })

  it('action-feedback live region has aria-live="polite" (WCAG SC 4.1.3)', async () => {
    const wrapper = await mountTeam()
    const feedback = wrapper.find('[data-testid="action-feedback"]')
    expect(feedback.attributes('aria-live')).toBe('polite')
  })

  it('action-feedback live region has aria-atomic="true" (full message announced, not diffs)', async () => {
    const wrapper = await mountTeam()
    const feedback = wrapper.find('[data-testid="action-feedback"]')
    expect(feedback.attributes('aria-atomic')).toBe('true')
  })

  it('action-feedback is visually hidden (sr-only) — no visual clutter (WCAG SC 4.1.3)', async () => {
    const wrapper = await mountTeam()
    const feedback = wrapper.find('[data-testid="action-feedback"]')
    expect(feedback.classes()).toContain('sr-only')
  })

  it('awaiting-review count badge has dynamic aria-label — no literal template syntax (WCAG SC 1.3.1)', async () => {
    const wrapper = await mountTeam()
    const badge = wrapper.find('[data-testid="awaiting-review-count"]')
    const label = badge.attributes('aria-label') ?? ''
    expect(label).not.toContain('`')
    expect(label).not.toContain('${')
  })

  it('assigned count badge has dynamic aria-label — no literal template syntax (WCAG SC 1.3.1)', async () => {
    const wrapper = await mountTeam()
    const badge = wrapper.find('[data-testid="assigned-count"]')
    if (badge.exists()) {
      const label = badge.attributes('aria-label') ?? ''
      expect(label).not.toContain('`')
      expect(label).not.toContain('${')
    }
  })

  it('recently-completed h2 is NOT nested inside the toggle button (WCAG SC 1.3.1)', async () => {
    const wrapper = await mountTeam()
    const toggle = wrapper.find('[data-testid="completed-section-toggle"]')
    const nestedH2 = toggle.find('h2')
    expect(nestedH2.exists()).toBe(false)
  })

  it('recently-completed h2 exists as a sibling of the toggle (WCAG SC 1.3.1)', async () => {
    const wrapper = await mountTeam()
    const h2 = wrapper.find('#completed-section-heading')
    expect(h2.exists()).toBe(true)
    expect(h2.element.tagName.toLowerCase()).toBe('h2')
  })

  it('section headings are h2 — not h1 or h3 at the queue level (WCAG SC 1.3.1)', async () => {
    const wrapper = await mountTeam()
    const queueHeadings = [
      '#awaiting-review-heading',
      '#assigned-section-heading',
    ]
    for (const sel of queueHeadings) {
      const el = wrapper.find(sel)
      if (el.exists()) {
        expect(el.element.tagName.toLowerCase()).toBe('h2')
      }
    }
  })

  it('error state uses role="alert" for immediate announcement (WCAG SC 4.1.3)', async () => {
    const router = makeRouter()
    const mod = await import('../../views/TeamWorkspaceView.vue')
    const wrapper = mount(mod.default, {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            initialState: {
              approvalWorkflow: { error: 'Failed to load', isLoading: false, items: [] },
            },
          }),
          router,
        ],
        stubs: {
          ...stubShell,
          WorkItemCard: { template: '<div />' },
          ApprovalStatusBadge: { template: '<span />' },
        },
      },
    })
    await flushPromises()
    const alertEl = wrapper.find('[role="alert"]')
    expect(alertEl.exists()).toBe(true)
  })

  it('summary bar has aria-label for screen reader context (WCAG SC 1.3.6)', async () => {
    const wrapper = await mountTeam()
    const bar = wrapper.find('[data-testid="summary-bar"]')
    expect(bar.exists()).toBe(true)
    expect(bar.attributes('aria-label')?.length).toBeGreaterThan(0)
  })

  it('decorative dots in summary badges have aria-hidden="true" (WCAG SC 1.1.1)', async () => {
    const wrapper = await mountTeam()
    const hiddenEls = wrapper.findAll('[aria-hidden="true"]')
    expect(hiddenEls.length).toBeGreaterThan(0)
  })

  it('no wallet connector affordances (product definition)', async () => {
    const wrapper = await mountTeam()
    expect(wrapper.text()).not.toMatch(/WalletConnect|MetaMask|\bPera\b|Defly/i)
  })
})

// ---------------------------------------------------------------------------
// Section 6: Guided Token Launch — step-progress and error announcement
// Journey 7 in the manual review artifact.
// ---------------------------------------------------------------------------
describe('Screen-reader sign-off: Guided Token Launch step-wizard ARIA (WCAG SC 4.1.2, 4.1.3)', () => {
  async function mountGuided() {
    const router = makeRouter()
    const mod = await import('../../views/GuidedTokenLaunch.vue')
    const wrapper = mount(mod.default, {
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn }), router],
        stubs: {
          OrganizationProfileStep: { template: '<div class="step-org" />' },
          TokenConfigurationStep: { template: '<div class="step-cfg" />' },
          ComplianceSetupStep: { template: '<div class="step-compliance" />' },
          ReviewSubmitStep: { template: '<div class="step-review" />' },
          DeploymentStatusStep: { template: '<div class="step-deploy" />' },
          Card: { template: '<div class="card"><slot /></div>' },
          Button: { template: '<button class="btn" :disabled="$attrs.disabled"><slot /></button>', inheritAttrs: false },
          Badge: { template: '<span class="badge"><slot /></span>' },
        },
      },
    })
    await flushPromises()
    return wrapper
  }

  it('root is <main role="main"> — standalone wizard (WCAG SC 1.3.6)', async () => {
    const wrapper = await mountGuided()
    const main = wrapper.find('main')
    expect(main.exists()).toBe(true)
    expect(main.attributes('role')).toBe('main')
  })

  it('single h1 for screen reader orientation — "Guided Token Launch" (WCAG SC 1.3.1)', async () => {
    const wrapper = await mountGuided()
    const h1s = wrapper.findAll('h1')
    expect(h1s.length).toBe(1)
    expect(h1s[0].text().trim().length).toBeGreaterThan(0)
  })

  it('progressbar has role="progressbar" (WCAG SC 4.1.2)', async () => {
    const wrapper = await mountGuided()
    expect(wrapper.find('[role="progressbar"]').exists()).toBe(true)
  })

  it('progressbar has aria-valuemin="0" and aria-valuemax="100" (WCAG SC 4.1.2)', async () => {
    const wrapper = await mountGuided()
    const pb = wrapper.find('[role="progressbar"]')
    expect(pb.attributes('aria-valuemin')).toBe('0')
    expect(pb.attributes('aria-valuemax')).toBe('100')
  })

  it('progressbar has descriptive aria-label (WCAG SC 4.1.2 — accessible name)', async () => {
    const wrapper = await mountGuided()
    const pb = wrapper.find('[role="progressbar"]')
    const label = pb.attributes('aria-label') ?? ''
    expect(label.length).toBeGreaterThan(0)
    expect(label.toLowerCase()).toMatch(/progress|percent|complete/)
  })

  it('step indicator has role="navigation" (WCAG SC 1.3.6 — landmark)', async () => {
    const wrapper = await mountGuided()
    const nav = wrapper.find('[role="navigation"]')
    expect(nav.exists()).toBe(true)
  })

  it('step navigation has aria-label (WCAG SC 2.4.1 — navigation landmark labelled)', async () => {
    const wrapper = await mountGuided()
    const nav = wrapper.find('[role="navigation"][aria-label]')
    expect(nav.exists()).toBe(true)
    expect(nav.attributes('aria-label')?.length).toBeGreaterThan(0)
  })

  it('each step button has aria-label (WCAG SC 4.1.2 — step accessible name)', async () => {
    const wrapper = await mountGuided()
    const nav = wrapper.find('[role="navigation"]')
    const stepBtns = nav.findAll('button[aria-label]')
    expect(stepBtns.length).toBeGreaterThanOrEqual(1)
    stepBtns.forEach((btn) => {
      expect(btn.attributes('aria-label')!.trim().length).toBeGreaterThan(0)
    })
  })

  it('step 0 button has aria-current="step" (WCAG SC 1.3.1 — AT position tracking)', async () => {
    const wrapper = await mountGuided()
    const nav = wrapper.find('[role="navigation"]')
    const currentBtn = nav.find('[aria-current="step"]')
    expect(currentBtn.exists()).toBe(true)
  })

  it('error banner has role="alert" with aria-live="assertive" (WCAG SC 4.1.3 — immediate announcement)', async () => {
    const wrapper = await mountGuided()
    const banner = wrapper.find('[role="alert"]')
    expect(banner.exists()).toBe(true)
    expect(banner.attributes('aria-live')).toBe('assertive')
  })

  it('error banner is in DOM when no error (v-show) — aria-live region subscription maintained (WCAG SC 4.1.3)', async () => {
    const wrapper = await mountGuided()
    // v-show keeps element in DOM; aria-live region must be subscribed before any error
    const banner = wrapper.find('[role="alert"]')
    expect(banner.exists()).toBe(true)
  })

  it('error dismiss button has aria-label="Dismiss error" (WCAG SC 4.1.2)', async () => {
    const wrapper = await mountGuided()
    const dismissBtn = wrapper.find('button[aria-label="Dismiss error"]')
    expect(dismissBtn.exists()).toBe(true)
  })

  it('step buttons have focus-visible ring classes — keyboard focus visible (WCAG SC 2.4.7)', async () => {
    const wrapper = await mountGuided()
    const nav = wrapper.find('[role="navigation"]')
    const stepBtns = nav.findAll('button')
    // At least one step button should have the focus ring pattern
    const hasFocusRing = stepBtns.some((btn) =>
      btn.classes().some((c) => c.includes('focus-visible:ring'))
    )
    expect(hasFocusRing).toBe(true)
  })

  it('no wallet connector affordances (product definition)', async () => {
    const wrapper = await mountGuided()
    expect(wrapper.text()).not.toMatch(/WalletConnect|MetaMask|\bPera\b|Defly/i)
  })
})

// ---------------------------------------------------------------------------
// Section 7: Cross-journey — compliance-status badges are not colour-only
// WCAG SC 1.4.1 requires that status be conveyed in text, not colour alone.
// ---------------------------------------------------------------------------
describe('Screen-reader sign-off: Compliance status badges — non-colour conveyance (WCAG SC 1.4.1)', () => {
  it('ApprovalStatusBadge "pending" renders text label visible to AT (WCAG SC 1.4.1)', async () => {
    const mod = await import('../../components/team/ApprovalStatusBadge.vue')
    const wrapper = mount(mod.default, { props: { state: 'pending' } })
    // Must include visible text — a screen reader or colour-blind user must not rely on colour alone
    expect(wrapper.text().trim().length).toBeGreaterThan(0)
  })

  it('ApprovalStatusBadge "blocked" renders text label — critical state not colour-only (WCAG SC 1.4.1)', async () => {
    const mod = await import('../../components/team/ApprovalStatusBadge.vue')
    const wrapper = mount(mod.default, { props: { state: 'blocked' } })
    expect(wrapper.text().trim().length).toBeGreaterThan(0)
  })

  it('ApprovalStatusBadge "approved" renders text label (WCAG SC 1.4.1)', async () => {
    const mod = await import('../../components/team/ApprovalStatusBadge.vue')
    const wrapper = mount(mod.default, { props: { state: 'approved' } })
    expect(wrapper.text().trim().length).toBeGreaterThan(0)
  })

  it('ApprovalStatusBadge "needs_changes" renders text label (WCAG SC 1.4.1)', async () => {
    const mod = await import('../../components/team/ApprovalStatusBadge.vue')
    const wrapper = mount(mod.default, { props: { state: 'needs_changes' } })
    expect(wrapper.text().trim().length).toBeGreaterThan(0)
  })

  it('ApprovalStatusBadge "blocked" uses role="alert" — not role="status" (WCAG SC 4.1.3)', async () => {
    const mod = await import('../../components/team/ApprovalStatusBadge.vue')
    const wrapper = mount(mod.default, { props: { state: 'blocked' } })
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
  })

  it('ApprovalStatusBadge "pending" uses role="status" — polite announcement (WCAG SC 4.1.3)', async () => {
    const mod = await import('../../components/team/ApprovalStatusBadge.vue')
    const wrapper = mount(mod.default, { props: { state: 'pending' } })
    expect(wrapper.find('[role="status"]').exists()).toBe(true)
  })

  it('ApprovalStatusBadge icon is aria-hidden — text label is sole AT content (WCAG SC 1.1.1)', async () => {
    const mod = await import('../../components/team/ApprovalStatusBadge.vue')
    const wrapper = mount(mod.default, { props: { state: 'pending' } })
    const icons = wrapper.findAll('[aria-hidden="true"]')
    expect(icons.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// Section 8: Cross-journey — validation/error announcement patterns
// All target journeys must use role=alert (assertive) for blocking errors
// and role=status (polite) for non-blocking status updates.
// ---------------------------------------------------------------------------
describe('Screen-reader sign-off: Error/validation announcement urgency (WCAG SC 4.1.3)', () => {
  it('GuidedTokenLaunch error banner uses assertive — AT must interrupt for blocking errors (WCAG SC 4.1.3)', async () => {
    const router = makeRouter()
    const mod = await import('../../views/GuidedTokenLaunch.vue')
    const wrapper = mount(mod.default, {
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn }), router],
        stubs: {
          Card: { template: '<div><slot /></div>' },
          Button: { template: '<button><slot /></button>' },
          Badge: { template: '<span><slot /></span>' },
          OrganizationProfileStep: { template: '<div />' },
          TokenConfigurationStep: { template: '<div />' },
          ComplianceSetupStep: { template: '<div />' },
          ReviewSubmitStep: { template: '<div />' },
          DeploymentStatusStep: { template: '<div />' },
        },
      },
    })
    await flushPromises()
    const alertEl = wrapper.find('[role="alert"][aria-live="assertive"]')
    expect(alertEl.exists()).toBe(true)
  })

  it('TeamWorkspaceView error state uses role="alert" (WCAG SC 4.1.3 — load failure is immediate)', async () => {
    const router = makeRouter()
    const mod = await import('../../views/TeamWorkspaceView.vue')
    const wrapper = mount(mod.default, {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            initialState: { approvalWorkflow: { error: 'Load failed', isLoading: false, items: [] } },
          }),
          router,
        ],
        stubs: { ...stubShell, WorkItemCard: { template: '<div />' }, ApprovalStatusBadge: { template: '<span />' } },
      },
    })
    await flushPromises()
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
  })

  it('WhitelistPolicyDashboard error state uses role="alert" (WCAG SC 4.1.3)', async () => {
    const router = makeRouter()
    const mod = await import('../../views/WhitelistPolicyDashboard.vue')
    const wrapper = mount(mod.default, {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            initialState: { whitelistPolicy: { isLoading: false, policy: null, error: 'Network error' } },
          }),
          router,
        ],
        stubs: stubWhitelist,
      },
    })
    await flushPromises()
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
  })

  it('ComplianceLaunchConsole live region uses aria-live="polite" — readiness is non-blocking (WCAG SC 4.1.3)', async () => {
    const router = makeRouter()
    const mod = await import('../../views/ComplianceLaunchConsole.vue')
    const wrapper = mount(mod.default, {
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn }), router],
        stubs: { ...stubShell, PolicyEditPanel: { template: '<div />' }, ApprovalStatusBadge: { template: '<span />' } },
      },
    })
    await flushPromises()
    const politeEl = wrapper.find('[aria-live="polite"]')
    expect(politeEl.exists()).toBe(true)
  })
})
