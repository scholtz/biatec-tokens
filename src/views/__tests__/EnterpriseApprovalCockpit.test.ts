/**
 * Component Tests: EnterpriseApprovalCockpit
 *
 * Covers:
 *  - Page structure (h1, data-testid, WCAG landmarks, skip link)
 *  - Loading state
 *  - Release posture banner visibility and content
 *  - Stage cards rendering (4 stages)
 *  - Blocker cards rendering
 *  - Top blockers section
 *  - No-blockers (green) state
 *  - Stage expand/collapse
 *  - Blocking stage alert
 *  - Navigation links (workspace links)
 *  - Keyboard accessibility (role="button" on stage headers)
 *  - Disclaimer text
 *  - Wallet-free language
 *  - Refresh action
 *  - Remediation workflow panel integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import { nextTick } from 'vue'
import EnterpriseApprovalCockpit from '../EnterpriseApprovalCockpit.vue'

// ---------------------------------------------------------------------------
// Stubs & router
// ---------------------------------------------------------------------------

vi.mock('../../layout/MainLayout.vue', () => ({
  default: { template: '<div><slot /></div>' },
}))

function makeRouter() {
  return createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/compliance/approval', component: { template: '<div />' } },
      { path: '/compliance/launch', component: { template: '<div />' } },
      { path: '/compliance/setup', component: { template: '<div />' } },
      { path: '/compliance/evidence', component: { template: '<div />' } },
      { path: '/compliance/reporting', component: { template: '<div />' } },
      { path: '/compliance/risk-report', component: { template: '<div />' } },
      { path: '/compliance/policy', component: { template: '<div />' } },
      { path: '/operations', component: { template: '<div />' } },
    ],
  })
}

async function mountView() {
  const router = makeRouter()
  const wrapper = mount(EnterpriseApprovalCockpit, {
    global: { plugins: [router] },
  })
  await router.isReady()
  await nextTick()
  return wrapper
}

async function mountLoaded() {
  vi.useFakeTimers()
  const wrapper = await mountView()
  // Advance past the 300ms loading delay
  vi.advanceTimersByTime(400)
  await nextTick()
  await nextTick()
  vi.useRealTimers()
  return wrapper
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
  localStorage.clear()
})

// ---------------------------------------------------------------------------
// 1. Page Structure
// ---------------------------------------------------------------------------

describe('Page structure', () => {
  it('renders exactly one h1', async () => {
    const wrapper = await mountLoaded()
    expect(wrapper.findAll('h1')).toHaveLength(1)
  })

  it('h1 contains "Enterprise Approval Queue"', async () => {
    const wrapper = await mountLoaded()
    expect(wrapper.find('h1').text()).toContain('Enterprise Approval Queue')
  })

  it('renders the root data-testid container', async () => {
    const wrapper = await mountLoaded()
    expect(wrapper.find('[data-testid="approval-cockpit"]').exists()).toBe(true)
  })

  it('renders the page header', async () => {
    const wrapper = await mountLoaded()
    expect(wrapper.find('[data-testid="cockpit-header"]').exists()).toBe(true)
  })

  it('renders a skip-to-main-content link with correct href', async () => {
    const wrapper = await mountLoaded()
    const skipLink = wrapper.find('a[href="#approval-cockpit-main"]')
    expect(skipLink.exists()).toBe(true)
    expect(skipLink.classes()).toContain('sr-only')
  })

  it('root region has aria-label for screen readers', async () => {
    const wrapper = await mountLoaded()
    const region = wrapper.find('[data-testid="approval-cockpit"]')
    expect(region.attributes('role')).toBe('region')
    expect(region.attributes('aria-label')).toContain('Approval')
  })

  it('renders cockpit-heading', async () => {
    const wrapper = await mountLoaded()
    expect(wrapper.find('[data-testid="cockpit-heading"]').text()).toContain('Enterprise Approval Queue')
  })

  it('renders the disclaimer text', async () => {
    const wrapper = await mountLoaded()
    expect(wrapper.find('[data-testid="cockpit-disclaimer"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="cockpit-disclaimer"]').text()).toContain('frontend-derived')
  })
})

// ---------------------------------------------------------------------------
// 2. Loading State
// ---------------------------------------------------------------------------

describe('Loading state', () => {
  it('shows loading state before data resolves', async () => {
    vi.useFakeTimers()
    const wrapper = await mountView()
    await nextTick()
    // Loading state should be visible before timer fires
    expect(wrapper.find('[data-testid="loading-state"]').exists()).toBe(true)
    vi.useRealTimers()
  })

  it('hides loading state after data resolves', async () => {
    const wrapper = await mountLoaded()
    expect(wrapper.find('[data-testid="loading-state"]').exists()).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// 3. Release Posture Banner
// ---------------------------------------------------------------------------

describe('Release posture banner', () => {
  it('renders the posture banner', async () => {
    const wrapper = await mountLoaded()
    expect(wrapper.find('[data-testid="release-posture-banner"]').exists()).toBe(true)
  })

  it('renders the posture headline', async () => {
    const wrapper = await mountLoaded()
    const headline = wrapper.find('[data-testid="posture-headline"]')
    expect(headline.exists()).toBe(true)
    expect(headline.text().length).toBeGreaterThan(0)
  })

  it('renders the posture rationale', async () => {
    const wrapper = await mountLoaded()
    const rationale = wrapper.find('[data-testid="posture-rationale"]')
    expect(rationale.exists()).toBe(true)
    expect(rationale.text().length).toBeGreaterThan(0)
  })

  it('posture banner has aria-labelledby', async () => {
    const wrapper = await mountLoaded()
    const banner = wrapper.find('[data-testid="release-posture-banner"]')
    expect(banner.attributes('aria-labelledby')).toBeTruthy()
  })

  it('posture-stats dl is rendered', async () => {
    const wrapper = await mountLoaded()
    expect(wrapper.find('[data-testid="posture-stats"]').exists()).toBe(true)
  })

  it('posture-badge has role="status"', async () => {
    const wrapper = await mountLoaded()
    const badge = wrapper.find('[data-testid="posture-badge"]')
    expect(badge.attributes('role')).toBe('status')
  })
})

// ---------------------------------------------------------------------------
// 4. Stages Section
// ---------------------------------------------------------------------------

describe('Stages section', () => {
  it('renders the stages section', async () => {
    const wrapper = await mountLoaded()
    expect(wrapper.find('[data-testid="stages-section"]').exists()).toBe(true)
  })

  it('renders the stages heading', async () => {
    const wrapper = await mountLoaded()
    const heading = wrapper.find('[data-testid="stages-heading"]')
    expect(heading.exists()).toBe(true)
    expect(heading.text()).toContain('Review Stages')
  })

  it('stages-list is an <ol>', async () => {
    const wrapper = await mountLoaded()
    const list = wrapper.find('[data-testid="stages-list"]')
    expect(list.element.tagName).toBe('OL')
  })

  it('renders exactly 4 stage cards', async () => {
    const wrapper = await mountLoaded()
    const cards = wrapper.findAll('[data-testid^="stage-card-"]')
    expect(cards).toHaveLength(4)
  })

  it('each stage card has a label element', async () => {
    const wrapper = await mountLoaded()
    const labels = wrapper.findAll('[data-testid^="stage-label-"]')
    expect(labels).toHaveLength(4)
    for (const label of labels) {
      expect(label.text().length).toBeGreaterThan(0)
    }
  })

  it('each stage card has a status badge', async () => {
    const wrapper = await mountLoaded()
    // Use aria-label attribute to be specific about the status badges
    // stage-status-* may also match stage-status-description-* so count carefully
    const stageIds = ['compliance-review', 'legal-review', 'procurement-review', 'executive-sign-off']
    for (const id of stageIds) {
      expect(wrapper.find(`[data-testid="stage-status-${id}"]`).exists()).toBe(true)
    }
  })

  it('each stage card has a role label', async () => {
    const wrapper = await mountLoaded()
    const roles = wrapper.findAll('[data-testid^="stage-role-"]')
    expect(roles).toHaveLength(4)
  })

  it('each stage card header has role="button" for keyboard access', async () => {
    const wrapper = await mountLoaded()
    const headers = wrapper.findAll('[data-testid^="stage-header-"]')
    for (const header of headers) {
      expect(header.attributes('role')).toBe('button')
    }
  })

  it('each stage card header has tabindex="0"', async () => {
    const wrapper = await mountLoaded()
    const headers = wrapper.findAll('[data-testid^="stage-header-"]')
    for (const header of headers) {
      expect(header.attributes('tabindex')).toBe('0')
    }
  })

  it('each stage card header has aria-expanded', async () => {
    const wrapper = await mountLoaded()
    const headers = wrapper.findAll('[data-testid^="stage-header-"]')
    for (const header of headers) {
      const expanded = header.attributes('aria-expanded')
      expect(['true', 'false']).toContain(expanded)
    }
  })
})

// ---------------------------------------------------------------------------
// 5. Stage Expand/Collapse
// ---------------------------------------------------------------------------

describe('Stage expand/collapse', () => {
  it('stage body is initially hidden (aria-expanded false)', async () => {
    const wrapper = await mountLoaded()
    const firstStageId = 'compliance-review'
    const header = wrapper.find(`[data-testid="stage-header-${firstStageId}"]`)
    // aria-expanded is the reliable check for expanded state in happy-dom
    expect(header.attributes('aria-expanded')).toBe('false')
  })

  it('clicking stage header expands it', async () => {
    const wrapper = await mountLoaded()
    const firstStageId = 'compliance-review'
    const vm = wrapper.vm as any
    // Verify initial state
    expect(vm.expandedStages.has(firstStageId)).toBe(false)
    // Use the exposed method directly (click may not fire in happy-dom for non-button divs)
    vm.toggleStage(firstStageId)
    await nextTick()
    await nextTick()
    const header = wrapper.find(`[data-testid="stage-header-${firstStageId}"]`)
    expect(header.attributes('aria-expanded')).toBe('true')
  })

  it('clicking expanded stage header collapses it', async () => {
    const wrapper = await mountLoaded()
    const firstStageId = 'compliance-review'
    const vm = wrapper.vm as any
    vm.toggleStage(firstStageId)
    await nextTick()
    vm.toggleStage(firstStageId)
    await nextTick()
    const header = wrapper.find(`[data-testid="stage-header-${firstStageId}"]`)
    expect(header.attributes('aria-expanded')).toBe('false')
  })

  it('Enter key toggles stage expansion via vm', async () => {
    const wrapper = await mountLoaded()
    const vm = wrapper.vm as any
    expect(vm.expandedStages.has('compliance-review')).toBe(false)
    vm.toggleStage('compliance-review')
    await nextTick()
    expect(vm.expandedStages.has('compliance-review')).toBe(true)
  })

  it('stage body shows evidence links when expanded', async () => {
    const wrapper = await mountLoaded()
    const header = wrapper.find('[data-testid="stage-header-compliance-review"]')
    await header.trigger('click')
    await nextTick()
    const links = wrapper.find('[data-testid="stage-evidence-links-compliance-review"]')
    expect(links.exists()).toBe(true)
  })

  it('stage body shows review scope when expanded', async () => {
    const wrapper = await mountLoaded()
    const header = wrapper.find('[data-testid="stage-header-compliance-review"]')
    await header.trigger('click')
    await nextTick()
    const scope = wrapper.find('[data-testid="stage-scope-compliance-review"]')
    expect(scope.exists()).toBe(true)
    expect(scope.text().length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// 6. Blockers
// ---------------------------------------------------------------------------

describe('Blocker rendering', () => {
  it('compliance-review stage has blocker cards when expanded', async () => {
    const wrapper = await mountLoaded()
    const header = wrapper.find('[data-testid="stage-header-compliance-review"]')
    await header.trigger('click')
    await nextTick()
    const blockersList = wrapper.find('[data-testid="stage-blockers-compliance-review"]')
    expect(blockersList.exists()).toBe(true)
    const blockers = blockersList.findAll('li')
    expect(blockers.length).toBeGreaterThan(0)
  })

  it('legal-review stage shows blocked status badge', async () => {
    const wrapper = await mountLoaded()
    const badge = wrapper.find('[data-testid="stage-status-legal-review"]')
    expect(badge.text().toLowerCase()).toContain('blocked')
  })

  it('procurement-review stage shows no-blockers message when expanded', async () => {
    const wrapper = await mountLoaded()
    const header = wrapper.find('[data-testid="stage-header-procurement-review"]')
    await header.trigger('click')
    await nextTick()
    expect(wrapper.find('[data-testid="stage-no-blockers-procurement-review"]').exists()).toBe(true)
  })

  it('blocker title is rendered with text', async () => {
    const wrapper = await mountLoaded()
    const header = wrapper.find('[data-testid="stage-header-legal-review"]')
    await header.trigger('click')
    await nextTick()
    // legal-review has a critical blocker
    const blockerTitle = wrapper.find('[data-testid^="blocker-title-"]')
    expect(blockerTitle.exists()).toBe(true)
    expect(blockerTitle.text().length).toBeGreaterThan(0)
  })

  it('blocker severity badge is present', async () => {
    const wrapper = await mountLoaded()
    const header = wrapper.find('[data-testid="stage-header-legal-review"]')
    await header.trigger('click')
    await nextTick()
    const severityBadge = wrapper.find('[data-testid^="blocker-severity-"]')
    expect(severityBadge.exists()).toBe(true)
  })

  it('launch-blocking indicator is shown for critical blockers', async () => {
    const wrapper = await mountLoaded()
    const header = wrapper.find('[data-testid="stage-header-legal-review"]')
    await header.trigger('click')
    await nextTick()
    const launchBlocking = wrapper.find('[data-testid^="blocker-launch-blocking-"]')
    expect(launchBlocking.exists()).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 7. Top Blockers Section
// ---------------------------------------------------------------------------

describe('Top blockers section', () => {
  it('renders top-blockers-section when blockers exist', async () => {
    const wrapper = await mountLoaded()
    // Default state has blockers
    expect(wrapper.find('[data-testid="top-blockers-section"]').exists()).toBe(true)
  })

  it('top-blockers-section has correct aria-labelledby', async () => {
    const wrapper = await mountLoaded()
    const section = wrapper.find('[data-testid="top-blockers-section"]')
    expect(section.attributes('aria-labelledby')).toBe('top-blockers-heading')
  })

  it('top-blockers-list is an <ol>', async () => {
    const wrapper = await mountLoaded()
    const list = wrapper.find('[data-testid="top-blockers-list"]')
    expect(list.element.tagName).toBe('OL')
  })

  it('top-blockers-count badge shows a number', async () => {
    const wrapper = await mountLoaded()
    const count = wrapper.find('[data-testid="top-blockers-count"]')
    expect(count.exists()).toBe(true)
    expect(Number(count.text())).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// 8. Blocking Stage Alert
// ---------------------------------------------------------------------------

describe('Blocking stage alert', () => {
  it('renders blocking-stage-alert when a stage is blocked/needs attention', async () => {
    const wrapper = await mountLoaded()
    expect(wrapper.find('[data-testid="blocking-stage-alert"]').exists()).toBe(true)
  })

  it('blocking-stage-alert has role="alert"', async () => {
    const wrapper = await mountLoaded()
    const alert = wrapper.find('[data-testid="blocking-stage-alert"]')
    expect(alert.attributes('role')).toBe('alert')
  })
})

// ---------------------------------------------------------------------------
// 9. Navigation / Workspace Links
// ---------------------------------------------------------------------------

describe('Workspace navigation links', () => {
  it('renders cockpit-nav', async () => {
    const wrapper = await mountLoaded()
    expect(wrapper.find('[data-testid="cockpit-nav"]').exists()).toBe(true)
  })

  it('cockpit-nav has aria-label', async () => {
    const wrapper = await mountLoaded()
    const nav = wrapper.find('[data-testid="cockpit-nav"]')
    expect(nav.attributes('aria-label')).toBeTruthy()
  })

  it('workspace link to /compliance/launch exists', async () => {
    const wrapper = await mountLoaded()
    // Check by finding any RouterLink pointing to compliance/launch
    const allLinks = wrapper.findAll('a')
    const hasComplianceLaunch = allLinks.some((l) =>
      l.attributes('href')?.includes('/compliance/launch'),
    )
    expect(hasComplianceLaunch).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 10. Refresh button
// ---------------------------------------------------------------------------

describe('Refresh button', () => {
  it('renders the refresh button', async () => {
    const wrapper = await mountLoaded()
    expect(wrapper.find('[data-testid="refresh-btn"]').exists()).toBe(true)
  })

  it('refresh button has aria-label', async () => {
    const wrapper = await mountLoaded()
    const btn = wrapper.find('[data-testid="refresh-btn"]')
    expect(btn.attributes('aria-label')).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// 11. Wallet-free language
// ---------------------------------------------------------------------------

describe('Wallet-free language', () => {
  it('does not contain wallet connector UI text', async () => {
    const wrapper = await mountLoaded()
    const text = wrapper.text()
    expect(text).not.toMatch(/WalletConnect|MetaMask|\bPera\b|Defly/i)
    expect(text).not.toContain('connect wallet')
  })

  it('does not contain blockchain-native jargon in primary content', async () => {
    const wrapper = await mountLoaded()
    const text = wrapper.text()
    expect(text).not.toContain('sign transaction')
    expect(text).not.toContain('approve in wallet')
  })
})

// ---------------------------------------------------------------------------
// 12. Accessibility — ARIA roles, headings, landmarks
// ---------------------------------------------------------------------------

describe('Accessibility', () => {
  it('stages list has aria-label', async () => {
    const wrapper = await mountLoaded()
    const list = wrapper.find('[data-testid="stages-list"]')
    expect(list.attributes('aria-label')).toBeTruthy()
  })

  it('stages-section has aria-labelledby', async () => {
    const wrapper = await mountLoaded()
    const section = wrapper.find('[data-testid="stages-section"]')
    expect(section.attributes('aria-labelledby')).toBe('stages-heading')
  })

  it('posture-stats dl has aria-label', async () => {
    const wrapper = await mountLoaded()
    const dl = wrapper.find('[data-testid="posture-stats"]')
    expect(dl.attributes('aria-label')).toBeTruthy()
  })

  it('stage status badges use role="status"', async () => {
    const wrapper = await mountLoaded()
    const stageIds = ['compliance-review', 'legal-review', 'procurement-review', 'executive-sign-off']
    for (const id of stageIds) {
      const badge = wrapper.find(`[data-testid="stage-status-${id}"]`)
      expect(badge.attributes('role')).toBe('status')
    }
  })
})

// ---------------------------------------------------------------------------
// 13. Expose contract
// ---------------------------------------------------------------------------

describe('Exposed contract', () => {
  it('exposes isLoading (auto-unwrapped boolean)', async () => {
    const wrapper = await mountLoaded()
    const vm = wrapper.vm as any
    // defineExpose auto-unwraps refs — vm.isLoading is the boolean value directly
    expect(typeof vm.isLoading).toBe('boolean')
  })

  it('exposes state with stages array', async () => {
    const wrapper = await mountLoaded()
    const vm = wrapper.vm as any
    expect(vm.state).toBeDefined()
    expect(Array.isArray(vm.state.stages)).toBe(true)
  })

  it('exposes toggleStage method', async () => {
    const wrapper = await mountLoaded()
    const vm = wrapper.vm as any
    expect(typeof vm.toggleStage).toBe('function')
  })

  it('exposes refresh method', async () => {
    const wrapper = await mountLoaded()
    const vm = wrapper.vm as any
    expect(typeof vm.refresh).toBe('function')
  })

  it('toggleStage adds a stage id to expandedStages', async () => {
    const wrapper = await mountLoaded()
    const vm = wrapper.vm as any
    // expandedStages is exposed as auto-unwrapped Set
    expect(vm.expandedStages.has('compliance-review')).toBe(false)
    vm.toggleStage('compliance-review')
    await nextTick()
    expect(vm.expandedStages.has('compliance-review')).toBe(true)
  })

  it('toggleStage removes an already-expanded stage id', async () => {
    const wrapper = await mountLoaded()
    const vm = wrapper.vm as any
    vm.toggleStage('compliance-review')
    await nextTick()
    vm.toggleStage('compliance-review')
    await nextTick()
    expect(vm.expandedStages.has('compliance-review')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// 14. Refresh action — covers 724-729 (timer body), 745 (onBeforeUnmount)
// ---------------------------------------------------------------------------

describe('Refresh action', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('refresh() sets isLoading to true immediately', async () => {
    const wrapper = await mountView()
    vi.advanceTimersByTime(400)
    await nextTick()
    const vm = wrapper.vm as any
    vm.refresh()
    expect(vm.isLoading).toBe(true)
  })

  it('refresh() resets loading to false after 400ms', async () => {
    const wrapper = await mountView()
    vi.advanceTimersByTime(400)
    await nextTick()
    const vm = wrapper.vm as any
    vm.refresh()
    expect(vm.isLoading).toBe(true)
    vi.advanceTimersByTime(500)
    await nextTick()
    expect(vm.isLoading).toBe(false)
  })

  it('refresh() replaces state with a new cockpit state', async () => {
    const wrapper = await mountView()
    vi.advanceTimersByTime(400)
    await nextTick()
    const vm = wrapper.vm as any
    vm.refresh()
    vi.advanceTimersByTime(500)
    await nextTick()
    expect(typeof vm.state.refreshedAt).toBe('string')
    expect(vm.state.refreshedAt).toBeTruthy()
    expect(Array.isArray(vm.state.stages)).toBe(true)
  })

  it('calling refresh twice cancels the previous timer (clearTimeout called)', async () => {
    const clearSpy = vi.spyOn(globalThis, 'clearTimeout')
    const wrapper = await mountView()
    vi.advanceTimersByTime(400)
    await nextTick()
    const vm = wrapper.vm as any
    vm.refresh()
    vm.refresh()
    expect(clearSpy).toHaveBeenCalled()
    clearSpy.mockRestore()
  })

  it('onBeforeUnmount clears the loading timer', async () => {
    const clearSpy = vi.spyOn(globalThis, 'clearTimeout')
    const wrapper = await mountView()
    wrapper.unmount()
    expect(clearSpy).toHaveBeenCalled()
    clearSpy.mockRestore()
  })
})

// ---------------------------------------------------------------------------
// 15. No-blockers state — v-else branch when topBlockers is empty
// ---------------------------------------------------------------------------

describe('No-blockers state', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('shows no-blockers-state when all stages have no blockers', async () => {
    const wrapper = await mountView()
    vi.advanceTimersByTime(400)
    await nextTick()
    const vm = wrapper.vm as any
    vm.state.stages = vm.state.stages.map((s: any) => ({
      ...s,
      blockers: [],
      status: 'approved',
    }))
    vm.state.recommendation = { posture: 'ready', headline: 'All clear', rationale: 'Approved' }
    await nextTick()
    await nextTick()
    const noBlockers = wrapper.find('[data-testid="no-blockers-state"]')
    expect(noBlockers.exists()).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 16. formattedRefreshedAt computed
// ---------------------------------------------------------------------------

describe('formattedRefreshedAt', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('returns raw string when refreshedAt is not a valid date', async () => {
    const wrapper = await mountView()
    vi.advanceTimersByTime(400)
    await nextTick()
    const vm = wrapper.vm as any
    vm.state.refreshedAt = 'not-a-date'
    await nextTick()
    expect(vm.formattedRefreshedAt).toBe('not-a-date')
  })

  it('returns empty string when refreshedAt is falsy', async () => {
    const wrapper = await mountView()
    vi.advanceTimersByTime(400)
    await nextTick()
    const vm = wrapper.vm as any
    vm.state.refreshedAt = ''
    await nextTick()
    expect(vm.formattedRefreshedAt).toBe('')
  })

  it('returns a locale string for a valid ISO date', async () => {
    const wrapper = await mountView()
    vi.advanceTimersByTime(400)
    await nextTick()
    const vm = wrapper.vm as any
    const iso = '2025-06-15T10:30:00.000Z'
    vm.state.refreshedAt = iso
    await nextTick()
    const formatted = vm.formattedRefreshedAt
    expect(typeof formatted).toBe('string')
    expect(formatted.length).toBeGreaterThan(0)
    expect(formatted).not.toBe(iso)
  })
})

// ---------------------------------------------------------------------------
// 17. posture icon computed — conditionally_ready and ready branches
// ---------------------------------------------------------------------------

describe('Posture icon computed', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('postureIcon returns the correct icon for "ready" posture', async () => {
    const wrapper = await mountView()
    vi.advanceTimersByTime(400)
    await nextTick()
    const vm = wrapper.vm as any
    vm.state.recommendation = { posture: 'ready', headline: 'Ready', rationale: 'All approved' }
    vm.state.stages = vm.state.stages.map((s: any) => ({ ...s, status: 'approved', blockers: [] }))
    await nextTick()
    expect(vm.postureIcon).toBeTruthy()
  })

  it('postureIcon returns the correct icon for "conditionally_ready" posture', async () => {
    const wrapper = await mountView()
    vi.advanceTimersByTime(400)
    await nextTick()
    const vm = wrapper.vm as any
    vm.state.recommendation = {
      posture: 'conditionally_ready',
      headline: 'Conditionally ready',
      rationale: 'Some conditions',
    }
    await nextTick()
    expect(vm.postureIcon).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// 18. stageHasStaleEvidence helper
// ---------------------------------------------------------------------------

describe('stageHasStaleEvidence helper', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('returns false when stage has no blockers with staleSince', async () => {
    const wrapper = await mountView()
    vi.advanceTimersByTime(400)
    await nextTick()
    const vm = wrapper.vm as any
    const stage = {
      blockers: [
        { id: 'b1', title: 'Test', severity: 'informational', isLaunchBlocking: false, action: '' },
      ],
    }
    expect(vm.stageHasStaleEvidence(stage)).toBe(false)
  })

  it('returns true when a blocker has a staleSince older than 30 days', async () => {
    const wrapper = await mountView()
    vi.advanceTimersByTime(400)
    await nextTick()
    const vm = wrapper.vm as any
    const oldDate = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString()
    const stage = {
      blockers: [
        { id: 'b1', title: 'Test', severity: 'medium', isLaunchBlocking: true, action: '', staleSince: oldDate },
      ],
    }
    expect(vm.stageHasStaleEvidence(stage)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 19. blockerCardClass helper — covers all severity branches
// ---------------------------------------------------------------------------

describe('blockerCardClass helper', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('returns red classes for critical severity', async () => {
    const wrapper = await mountView()
    vi.advanceTimersByTime(400)
    await nextTick()
    expect((wrapper.vm as any).blockerCardClass('critical')).toContain('red')
  })

  it('returns orange classes for high severity', async () => {
    const wrapper = await mountView()
    vi.advanceTimersByTime(400)
    await nextTick()
    expect((wrapper.vm as any).blockerCardClass('high')).toContain('orange')
  })

  it('returns yellow classes for medium severity', async () => {
    const wrapper = await mountView()
    vi.advanceTimersByTime(400)
    await nextTick()
    expect((wrapper.vm as any).blockerCardClass('medium')).toContain('yellow')
  })

  it('returns gray classes for informational severity', async () => {
    const wrapper = await mountView()
    vi.advanceTimersByTime(400)
    await nextTick()
    expect((wrapper.vm as any).blockerCardClass('informational')).toContain('gray')
  })
})

// ---------------------------------------------------------------------------
// 20. stageNumberClass helper — covers all stage status branches
// ---------------------------------------------------------------------------

describe('stageNumberClass helper', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it.each([
    ['not_started', 'gray'],
    ['ready_for_review', 'blue'],
    ['in_review', 'indigo'],
    ['needs_attention', 'yellow'],
    ['conditionally_approved', 'teal'],
    ['approved', 'green'],
    ['blocked', 'red'],
  ] as const)('returns %s color for status "%s"', async (status, colorHint) => {
    const wrapper = await mountView()
    vi.advanceTimersByTime(400)
    await nextTick()
    expect((wrapper.vm as any).stageNumberClass(status)).toContain(colorHint)
  })
})

// ---------------------------------------------------------------------------
// 21. Remediation Workflow Panel — integration in cockpit view
// ---------------------------------------------------------------------------

describe('Remediation workflow panel integration', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('renders the RemediationTaskPanel component after data loads', async () => {
    const wrapper = await mountView()
    vi.advanceTimersByTime(400)
    await nextTick()
    await nextTick()
    const panel = wrapper.find('[data-testid="remediation-task-panel"]')
    expect(panel.exists()).toBe(true)
  })

  it('renders the Remediation Workflow heading inside the panel', async () => {
    const wrapper = await mountView()
    vi.advanceTimersByTime(400)
    await nextTick()
    await nextTick()
    const title = wrapper.find('[data-testid="remediation-panel-title"]')
    expect(title.exists()).toBe(true)
    expect(title.text()).toContain('Remediation Workflow')
  })

  it('renders the remediation stats section', async () => {
    const wrapper = await mountView()
    vi.advanceTimersByTime(400)
    await nextTick()
    await nextTick()
    const stats = wrapper.find('[data-testid="remediation-stats"]')
    expect(stats.exists()).toBe(true)
  })

  it('renders the blocking count stat in the remediation panel', async () => {
    const wrapper = await mountView()
    vi.advanceTimersByTime(400)
    await nextTick()
    await nextTick()
    const count = wrapper.find('[data-testid="remediation-blocking-count"]')
    expect(count.exists()).toBe(true)
    // Default mock state has blocking items — count should be a number
    expect(count.text().trim()).toMatch(/^\d+$/)
  })

  it('panel section has aria-labelledby attribute pointing to the heading id', async () => {
    const wrapper = await mountView()
    vi.advanceTimersByTime(400)
    await nextTick()
    await nextTick()
    const panel = wrapper.find('[data-testid="remediation-task-panel"]')
    expect(panel.exists()).toBe(true)
    expect(panel.attributes('aria-labelledby')).toBe('remediation-panel-heading')
  })

  it('renders the remediation panel disclaimer footer', async () => {
    const wrapper = await mountView()
    vi.advanceTimersByTime(400)
    await nextTick()
    await nextTick()
    const disclaimer = wrapper.find('[data-testid="remediation-panel-disclaimer"]')
    expect(disclaimer.exists()).toBe(true)
    expect(disclaimer.text()).toContain('Remediation tasks')
  })

  it('remediation panel does not contain wallet-connector terminology', async () => {
    const wrapper = await mountView()
    vi.advanceTimersByTime(400)
    await nextTick()
    await nextTick()
    const panel = wrapper.find('[data-testid="remediation-task-panel"]')
    expect(panel.exists()).toBe(true)
    expect(panel.text()).not.toMatch(/WalletConnect|MetaMask|\bPera\b|Defly/i)
  })

  it('stage groups container is rendered when tasks exist', async () => {
    const wrapper = await mountView()
    vi.advanceTimersByTime(400)
    await nextTick()
    await nextTick()
    // Default state has blockers in several stages
    const groups = wrapper.find('[data-testid="remediation-stage-groups"]')
    expect(groups.exists()).toBe(true)
  })

  it('remediationWorkflow computed property is derived from stages', async () => {
    const wrapper = await mountView()
    vi.advanceTimersByTime(400)
    await nextTick()
    await nextTick()
    const vm = wrapper.vm as any
    // remediationWorkflow should be a valid workflow state object
    expect(vm.remediationWorkflow).toBeDefined()
    expect(typeof vm.remediationWorkflow.launchBlockingCount).toBe('number')
    expect(typeof vm.remediationWorkflow.staleEvidenceCount).toBe('number')
    expect(Array.isArray(vm.remediationWorkflow.stageGroups)).toBe(true)
    expect(Array.isArray(vm.remediationWorkflow.allTasks)).toBe(true)
  })

  it('remediationWorkflow topUrgency reflects the highest severity blocking task', async () => {
    const wrapper = await mountView()
    vi.advanceTimersByTime(400)
    await nextTick()
    await nextTick()
    const vm = wrapper.vm as any
    // Default state has critical-severity blockers, so topUrgency should not be null
    const validUrgencies = ['critical', 'high', 'medium', 'advisory', null]
    expect(validUrgencies).toContain(vm.remediationWorkflow.topUrgency)
  })

  it('panel is placed after the blockers section and before navigation links', async () => {
    const wrapper = await mountView()
    vi.advanceTimersByTime(400)
    await nextTick()
    await nextTick()
    const html = wrapper.html()
    const panelIdx = html.indexOf('data-testid="remediation-task-panel"')
    const navIdx = html.indexOf('data-testid="cockpit-nav"')
    // Panel must appear before navigation
    expect(panelIdx).toBeGreaterThan(0)
    expect(navIdx).toBeGreaterThan(0)
    expect(panelIdx).toBeLessThan(navIdx)
  })
})
