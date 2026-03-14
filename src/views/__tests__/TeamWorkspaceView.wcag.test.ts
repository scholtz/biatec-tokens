/**
 * Unit Tests: TeamWorkspaceView — WCAG AA Accessibility
 *
 * Validates WCAG 2.1 AA requirements for the Team Operations Workspace, including:
 *  - In-page skip link present with sr-only class (SC 2.4.1)
 *  - Single h1 heading for screen reader orientation (SC 1.3.1)
 *  - H2 headings for queue sections (SC 1.3.1)
 *  - Workflow summary bar has aria-label (SC 1.3.6)
 *  - Count badges use aria-hidden on decorative dots (SC 1.1.1)
 *  - No-role notice uses role=status for non-disruptive announcement (SC 4.1.3)
 *  - Action button aria-labels (SC 4.1.2)
 *  - No wallet connector UI (product definition)
 *
 * Issue: Automate accessibility verification and trust-grade shell evidence
 * Roadmap: https://raw.githubusercontent.com/scholtz/biatec-tokens/refs/heads/main/business-owner-roadmap.md
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createWebHistory } from 'vue-router'
import { vi } from 'vitest'
import TeamWorkspaceView from '../TeamWorkspaceView.vue'

const makeRouter = () =>
  createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', name: 'Home', component: { template: '<div />' } },
      { path: '/team/workspace', name: 'TeamWorkspace', component: { template: '<div />' } },
      { path: '/compliance', name: 'ComplianceDashboard', component: { template: '<div />' } },
    ],
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
        RouterLink: { template: '<a><slot /></a>' },
        ApprovalStatusBadge: { template: '<span class="status-badge" />' },
        WorkItemCard: { template: '<div class="work-item-card" />' },
      },
    },
  })
}

describe('TeamWorkspaceView — WCAG AA Accessibility', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  // ── In-page skip link (WCAG SC 2.4.1) ────────────────────────────────────

  it('renders an in-page skip link for keyboard users (WCAG SC 2.4.1)', () => {
    const wrapper = mountWorkspace()
    const skipLink = wrapper.find('[data-testid="skip-to-main"], a[href="#workspace-main"]')
    expect(skipLink.exists()).toBe(true)
  })

  it('skip link has sr-only class — hidden visually but reachable by keyboard (WCAG SC 2.4.1)', () => {
    const wrapper = mountWorkspace()
    const skipLink = wrapper.find('[data-testid="skip-to-main"]')
    expect(skipLink.exists()).toBe(true)
    expect(skipLink.classes()).toContain('sr-only')
  })

  it('skip link text includes "skip" for screen reader comprehension (WCAG SC 2.4.1)', () => {
    const wrapper = mountWorkspace()
    const skipLink = wrapper.find('[data-testid="skip-to-main"]')
    expect(skipLink.text().toLowerCase()).toContain('skip')
  })

  // ── Heading hierarchy (WCAG SC 1.3.1) ────────────────────────────────────

  it('renders a single h1 heading for screen reader orientation (WCAG SC 1.3.1)', () => {
    const wrapper = mountWorkspace()
    const h1s = wrapper.findAll('h1')
    expect(h1s.length).toBe(1)
  })

  it('h1 has data-testid="workspace-heading" anchor (WCAG evidence)', () => {
    const wrapper = mountWorkspace()
    const h1 = wrapper.find('h1[data-testid="workspace-heading"]')
    expect(h1.exists()).toBe(true)
    expect(h1.text().length).toBeGreaterThan(0)
  })

  it('h2 headings are present for queue sections (WCAG SC 1.3.1)', () => {
    const wrapper = mountWorkspace()
    const h2s = wrapper.findAll('h2')
    expect(h2s.length).toBeGreaterThanOrEqual(2)
  })

  it('heading hierarchy is well-ordered — h1 precedes h2 (WCAG SC 1.3.1)', () => {
    const wrapper = mountWorkspace()
    const headings = wrapper.findAll('h1, h2')
    expect(headings.length).toBeGreaterThan(0)
    expect(headings[0].element.tagName.toLowerCase()).toBe('h1')
  })

  // ── Workflow summary bar (WCAG SC 1.3.6) ─────────────────────────────────

  it('summary bar has aria-label for screen readers (WCAG SC 1.3.6)', () => {
    const wrapper = mountWorkspace()
    const summaryBar = wrapper.find('[data-testid="summary-bar"]')
    expect(summaryBar.exists()).toBe(true)
    expect(summaryBar.attributes('aria-label')).toBeTruthy()
  })

  it('summary bar aria-label describes workflow counts (WCAG SC 1.3.6)', () => {
    const wrapper = mountWorkspace()
    const summaryBar = wrapper.find('[data-testid="summary-bar"]')
    const ariaLabel = summaryBar.attributes('aria-label') ?? ''
    expect(ariaLabel.toLowerCase()).toMatch(/summary|workflow|count/i)
  })

  // ── Decorative status dots hidden from AT (WCAG SC 1.1.1) ────────────────

  it('decorative status dots in summary badges have aria-hidden=true (WCAG SC 1.1.1)', () => {
    const wrapper = mountWorkspace()
    const pendingBadge = wrapper.find('[data-testid="pending-count-badge"]')
    if (pendingBadge.exists()) {
      const ariaHiddenDots = pendingBadge.findAll('[aria-hidden="true"]')
      expect(ariaHiddenDots.length).toBeGreaterThan(0)
    }
  })

  // ── No-role notice uses role=status (WCAG SC 4.1.3) ──────────────────────

  it('no-role notice uses role=status for non-disruptive announcement (WCAG SC 4.1.3)', () => {
    const wrapper = mountWorkspace()
    // The no-role notice uses role=status
    const notice = wrapper.find('[data-testid="no-role-message"]')
    if (notice.exists()) {
      expect(notice.attributes('role')).toBe('status')
    }
    // If hidden (user has a role), the element may not be present — that's fine
  })

  // ── No wallet connector UI (product definition) ───────────────────────────

  it('does not render wallet connector UI (product definition)', () => {
    const wrapper = mountWorkspace()
    const html = wrapper.html().toLowerCase()
    expect(html).not.toContain('walletconnect')
    expect(html).not.toContain('metamask')
    expect(html).not.toContain('connect wallet')
    expect(html).not.toContain('not connected')
  })

  // ── data-testid anchors for evidence-grade test automation ───────────────

  it('has data-testid="team-workspace" on root element (test anchor)', () => {
    const wrapper = mountWorkspace()
    const root = wrapper.find('[data-testid="team-workspace"]')
    expect(root.exists()).toBe(true)
  })

  it('has data-testid="summary-bar" present for automated evidence (test anchor)', () => {
    const wrapper = mountWorkspace()
    const bar = wrapper.find('[data-testid="summary-bar"]')
    expect(bar.exists()).toBe(true)
  })

  // ── Collapse/expand keyboard ARIA contract (WCAG SC 4.1.2) ───────────────

  it('completed-section toggle button has aria-expanded attribute (WCAG SC 4.1.2)', () => {
    const wrapper = mountWorkspace()
    const toggle = wrapper.find('[data-testid="completed-section-toggle"]')
    expect(toggle.exists()).toBe(true)
    const expanded = toggle.attributes('aria-expanded')
    expect(['true', 'false']).toContain(expanded)
  })

  it('completed-section toggle button has aria-controls attribute (WCAG SC 4.1.2)', () => {
    const wrapper = mountWorkspace()
    const toggle = wrapper.find('[data-testid="completed-section-toggle"]')
    const controls = toggle.attributes('aria-controls')
    expect(controls).toBeDefined()
    expect(controls!.length).toBeGreaterThan(0)
  })

  it('clicking toggle changes aria-expanded from false to true (WCAG SC 4.1.2)', async () => {
    const wrapper = mountWorkspace()
    const toggle = wrapper.find('[data-testid="completed-section-toggle"]')
    const vm = wrapper.vm as any
    vm.completedExpanded = false
    await wrapper.vm.$nextTick()
    expect(toggle.attributes('aria-expanded')).toBe('false')
    await toggle.trigger('click')
    await wrapper.vm.$nextTick()
    expect(toggle.attributes('aria-expanded')).toBe('true')
  })

  it('completed-section toggle button is NOT a heading element — h2 is a sibling (WCAG SC 1.3.1)', () => {
    // Interactive elements must not contain heading elements (screen readers may
    // skip or misannounce headings nested inside buttons).
    const wrapper = mountWorkspace()
    const toggle = wrapper.find('[data-testid="completed-section-toggle"]')
    expect(toggle.element.tagName.toLowerCase()).toBe('button')
    // The button must not contain an h2
    expect(toggle.find('h2').exists()).toBe(false)
  })

  it('completed-section heading h2 is a sibling of the toggle, not its child (WCAG SC 1.3.1)', () => {
    const wrapper = mountWorkspace()
    const section = wrapper.find('[data-testid="completed-section"]')
    // h2 must exist in the section
    const heading = section.find('[id="completed-section-heading"]')
    expect(heading.exists()).toBe(true)
    // h2 must not be inside the toggle button
    const toggle = section.find('[data-testid="completed-section-toggle"]')
    expect(toggle.find('#completed-section-heading').exists()).toBe(false)
  })

  it('completed-section toggle button has an aria-label describing expand/collapse (WCAG SC 4.1.2)', () => {
    const wrapper = mountWorkspace()
    const toggle = wrapper.find('[data-testid="completed-section-toggle"]')
    const ariaLabel = toggle.attributes('aria-label') ?? ''
    expect(ariaLabel.length).toBeGreaterThan(0)
    // Should mention expand or collapse
    expect(ariaLabel.toLowerCase()).toMatch(/expand|collapse/)
  })

  // ── Count badge dynamic aria-label (WCAG SC 1.3.1, SC 4.1.3) ────────────
  // Count badge aria-labels MUST be v-bind (:aria-label) so they reflect actual
  // queue sizes. Static aria-label with template literal syntax (without : prefix)
  // would announce literal backtick characters and unresolved "${}" syntax.

  it('awaiting-review count badge has a meaningful aria-label (not literal backticks) (WCAG SC 1.3.1)', () => {
    const wrapper = mountWorkspace()
    const badge = wrapper.find('[data-testid="awaiting-review-count"]')
    expect(badge.exists()).toBe(true)
    const ariaLabel = badge.attributes('aria-label') ?? ''
    // Must not contain literal backtick or unresolved template literal syntax
    expect(ariaLabel).not.toContain('`')
    expect(ariaLabel).not.toContain('${')
    // Must contain a meaningful word
    expect(ariaLabel.toLowerCase()).toMatch(/item|awaiting|review/)
  })

  it('assigned count badge has a meaningful aria-label (not literal backticks) (WCAG SC 1.3.1)', () => {
    const wrapper = mountWorkspace()
    const badge = wrapper.find('[data-testid="assigned-count"]')
    expect(badge.exists()).toBe(true)
    const ariaLabel = badge.attributes('aria-label') ?? ''
    expect(ariaLabel).not.toContain('`')
    expect(ariaLabel).not.toContain('${')
    expect(ariaLabel.toLowerCase()).toMatch(/item|assigned|team/)
  })

  it('ready-approval count badge has a meaningful aria-label (not literal backticks) (WCAG SC 1.3.1)', () => {
    const wrapper = mountWorkspace()
    const badge = wrapper.find('[data-testid="ready-approval-count"]')
    expect(badge.exists()).toBe(true)
    const ariaLabel = badge.attributes('aria-label') ?? ''
    expect(ariaLabel).not.toContain('`')
    expect(ariaLabel).not.toContain('${')
    expect(ariaLabel.toLowerCase()).toMatch(/item|ready|approval/)
  })

  // ── Action feedback live region (WCAG SC 4.1.3) ───────────────────────────
  // Screen readers must receive a polite announcement when approval actions
  // complete, so keyboard users know the result without relying on visual cues.

  it('renders an action-feedback live region with role=status and aria-live=polite (WCAG SC 4.1.3)', () => {
    const wrapper = mountWorkspace()
    const feedback = wrapper.find('[data-testid="action-feedback"]')
    expect(feedback.exists()).toBe(true)
    expect(feedback.attributes('role')).toBe('status')
    expect(feedback.attributes('aria-live')).toBe('polite')
  })

  it('action-feedback region has aria-atomic=true to announce full message (WCAG SC 4.1.3)', () => {
    const wrapper = mountWorkspace()
    const feedback = wrapper.find('[data-testid="action-feedback"]')
    expect(feedback.attributes('aria-atomic')).toBe('true')
  })

  it('action-feedback region is visually hidden (sr-only) to avoid visual clutter (WCAG SC 4.1.3)', () => {
    const wrapper = mountWorkspace()
    const feedback = wrapper.find('[data-testid="action-feedback"]')
    expect(feedback.classes()).toContain('sr-only')
  })

  // ── Approval section landmarks (WCAG SC 1.3.6) ───────────────────────────

  it('each approval queue section is wrapped in a <section> element (WCAG SC 1.3.6)', () => {
    const wrapper = mountWorkspace()
    const sections = wrapper.findAll('section[aria-labelledby]')
    expect(sections.length).toBeGreaterThanOrEqual(1)
  })

  it('list containers have aria-label describing their workflow queue (WCAG SC 1.3.6)', () => {
    const wrapper = mountWorkspace()
    const labelledList = wrapper.find('[aria-label="Team approval workflow"]')
    expect(labelledList.exists()).toBe(true)
  })
})
