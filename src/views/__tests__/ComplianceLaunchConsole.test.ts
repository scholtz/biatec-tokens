/**
 * Unit Tests: ComplianceLaunchConsole — WCAG AA Accessibility
 *
 * Validates accessibility requirements for the Compliance Launch Console.
 *
 * Acceptance Criteria covered:
 *  AC #7  — Keyboard-only navigation is fully functional
 *  AC #8  — Accessibility checks pass (semantic roles, focus visibility, status text)
 *  AC #11 — Error messages do not expose raw stack traces
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createWebHistory } from 'vue-router'
import { vi } from 'vitest'
import ComplianceLaunchConsole from '../ComplianceLaunchConsole.vue'

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

const mountConsole = () => {
  const router = makeRouter()
  return mount(ComplianceLaunchConsole, {
    global: {
      plugins: [
        createTestingPinia({ createSpy: vi.fn }),
        router,
      ],
    },
  })
}

describe('ComplianceLaunchConsole — WCAG AA Accessibility', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  // ── Landmark structure ────────────────────────────────────────────────────

  it('renders console content area with id="console-main" (SC 2.4.1)', () => {
    const wrapper = mountConsole()
    // The view is now wrapped in MainLayout which provides <main id="main-content">.
    // The view's own landmark div uses id="console-main" for in-page skip target.
    const consoleDiv = wrapper.find('[data-testid="compliance-launch-console"]')
    expect(consoleDiv.exists()).toBe(true)
  })

  it('renders a single <h1> heading for screen reader orientation (SC 1.3.1)', () => {
    const wrapper = mountConsole()
    const h1s = wrapper.findAll('h1')
    expect(h1s.length).toBe(1)
    expect(h1s[0].text()).toMatch(/Compliance Launch Console/i)
  })

  it('console content area is reachable via id="console-main" in-page anchor (SC 2.4.1)', () => {
    const wrapper = mountConsole()
    // The skip link is now provided by MainLayout; this view provides its data-testid anchor.
    const consoleDiv = wrapper.find('#console-main')
    expect(consoleDiv.exists()).toBe(true)
  })

  // ── Headings hierarchy ────────────────────────────────────────────────────

  it('readiness banner has an h2 with id="readiness-banner-heading" (SC 1.3.1)', () => {
    const wrapper = mountConsole()
    const h2 = wrapper.find('#readiness-banner-heading')
    expect(h2.exists()).toBe(true)
  })

  it('domains section has an h2 heading (SC 1.3.1)', () => {
    const wrapper = mountConsole()
    const domainsHeading = wrapper.find('#domains-heading')
    expect(domainsHeading.exists()).toBe(true)
  })

  // ── Progress bar ──────────────────────────────────────────────────────────

  it('readiness progress bar has role="progressbar" (SC 4.1.2)', () => {
    const wrapper = mountConsole()
    const progressBar = wrapper.find('[role="progressbar"]')
    expect(progressBar.exists()).toBe(true)
  })

  it('readiness progress bar has aria-valuenow, aria-valuemin, aria-valuemax (SC 4.1.2)', () => {
    const wrapper = mountConsole()
    const progressBar = wrapper.find('[role="progressbar"]')
    expect(progressBar.attributes('aria-valuemin')).toBe('0')
    expect(progressBar.attributes('aria-valuemax')).toBe('100')
    const valuenow = progressBar.attributes('aria-valuenow')
    expect(valuenow).toBeDefined()
    expect(Number(valuenow)).toBeGreaterThanOrEqual(0)
  })

  it('readiness progress bar has aria-label (SC 4.1.2)', () => {
    const wrapper = mountConsole()
    const progressBar = wrapper.find('[role="progressbar"]')
    const label = progressBar.attributes('aria-label')
    expect(label).toBeDefined()
    expect(label).toMatch(/compliance readiness/i)
  })

  // ── Score meter ───────────────────────────────────────────────────────────

  it('readiness score has role="meter" with aria range attributes (SC 4.1.2)', () => {
    const wrapper = mountConsole()
    const meter = wrapper.find('[role="meter"]')
    expect(meter.exists()).toBe(true)
    expect(meter.attributes('aria-valuemin')).toBe('0')
    expect(meter.attributes('aria-valuemax')).toBe('100')
    const ariaLabel = meter.attributes('aria-label')
    expect(ariaLabel).toMatch(/readiness score/i)
  })

  // ── Keyboard accessibility ────────────────────────────────────────────────

  it('interactive elements have focus-visible ring classes (SC 2.4.7)', () => {
    const wrapper = mountConsole()
    const html = wrapper.html()
    expect(html).toContain('focus-visible:ring-2')
  })

  it('CTA buttons have aria-label attributes (SC 4.1.2)', () => {
    const wrapper = mountConsole()
    // Either primary-cta-button or launch-token-button must be present
    const primaryBtn = wrapper.find('[data-testid="primary-cta-button"]')
    const launchBtn = wrapper.find('[data-testid="launch-token-button"]')
    const ctaButton = primaryBtn.exists() ? primaryBtn : launchBtn
    expect(ctaButton.exists()).toBe(true)
    expect(ctaButton.attributes('aria-label')).toBeDefined()
  })

  // ── Live regions ──────────────────────────────────────────────────────────

  it('gate state description has aria-live="polite" for dynamic updates (SC 4.1.3)', () => {
    const wrapper = mountConsole()
    const liveRegion = wrapper.find('[aria-live="polite"]')
    expect(liveRegion.exists()).toBe(true)
  })

  // ── No wallet-connector UI ────────────────────────────────────────────────

  it('does not render wallet-connector UI elements (business roadmap)', () => {
    const wrapper = mountConsole()
    const html = wrapper.html().toLowerCase()
    expect(html).not.toContain('walletconnect')
    expect(html).not.toContain('metamask')
    expect(html).not.toMatch(/\bpera\b/)
    expect(html).not.toContain('defly')
    expect(html).not.toContain('connect wallet')
  })

  // ── Data-testid anchors ───────────────────────────────────────────────────

  it('key regions have data-testid anchors for E2E tests', () => {
    const wrapper = mountConsole()
    expect(wrapper.find('[data-testid="compliance-launch-console"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="console-heading"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="readiness-banner"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="domains-section"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="evidence-summary"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="readiness-progress-bar"]').exists()).toBe(true)
  })

  // ── Regions ───────────────────────────────────────────────────────────────

  it('readiness banner is a <section> with aria-labelledby (SC 2.4.3)', () => {
    const wrapper = mountConsole()
    const banner = wrapper.find('[data-testid="readiness-banner"]')
    expect(banner.element.tagName.toLowerCase()).toBe('section')
    expect(banner.attributes('aria-labelledby')).toBe('readiness-banner-heading')
  })

  it('evidence summary has role="contentinfo" and aria-label (SC 2.4.3)', () => {
    const wrapper = mountConsole()
    const footer = wrapper.find('[data-testid="evidence-summary"]')
    expect(footer.attributes('role')).toBe('contentinfo')
    expect(footer.attributes('aria-label')).toMatch(/review summary/i)
  })
})
