/**
 * Unit Tests: LifecycleCockpit — WCAG AA Accessibility
 *
 * Validates accessibility improvements added as part of the MVP UX
 * hardening issue — specifically the promotion of the root element from
 * a generic <div> to <main id="main-content" role="main">.
 *
 * Acceptance Criteria:
 *  AC #1 — Critical workflows pass WCAG 2.1 AA automated checks
 *  AC #2 — Keyboard-only traversal and visible focus indicators
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createWebHistory } from 'vue-router'
import { vi } from 'vitest'
import LifecycleCockpit from '../LifecycleCockpit.vue'

const makeRouter = () =>
  createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', name: 'Home', component: { template: '<div />' } },
      { path: '/cockpit', name: 'LifecycleCockpit', component: { template: '<div />' } },
    ],
  })

const mountCockpit = () => {
  const router = makeRouter()
  return mount(LifecycleCockpit, {
    global: {
      plugins: [
        createTestingPinia({ createSpy: vi.fn }),
        router,
      ],
      stubs: {
        Button: { template: '<button><slot /><slot name="default" /></button>', props: ['variant', 'size', 'disabled'] },
        ReadinessStatusWidget: { template: '<div data-testid="readiness-widget" />' },
        TelemetrySummaryWidget: { template: '<div data-testid="telemetry-widget" />' },
        GuidedActionsWidget: { template: '<div data-testid="guided-actions-widget" />' },
        WalletDiagnosticsWidget: { template: '<div data-testid="wallet-diag-widget" />' },
        RiskIndicatorsWidget: { template: '<div data-testid="risk-widget" />' },
        EvidenceLinksWidget: { template: '<div data-testid="evidence-widget" />' },
        TimelineWidget: { template: '<div data-testid="timeline-widget" />' },
      },
    },
  })
}

describe('LifecycleCockpit — WCAG AA Accessibility', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  // ── Landmark structure ────────────────────────────────────────────────────

  it('renders root element as <main> for skip-link target (WCAG SC 2.4.1)', () => {
    const wrapper = mountCockpit()
    const main = wrapper.find('main')
    expect(main.exists()).toBe(true)
  })

  it('root <main> has role="main" (WCAG SC 1.3.6)', () => {
    const wrapper = mountCockpit()
    const main = wrapper.find('main')
    expect(main.attributes('role')).toBe('main')
  })

  it('root <main> has id="main-content" as skip-link target (WCAG SC 2.4.1)', () => {
    const wrapper = mountCockpit()
    const main = wrapper.find('main')
    expect(main.attributes('id')).toBe('main-content')
  })

  it('renders a single <h1> heading for screen reader orientation (SC 1.3.1)', () => {
    const wrapper = mountCockpit()
    const h1s = wrapper.findAll('h1')
    expect(h1s.length).toBe(1)
    expect(h1s[0].text()).toMatch(/Token Lifecycle Cockpit/i)
  })

  // ── No wallet-connector UI ────────────────────────────────────────────────

  it('does not render wallet-connector UI elements (product definition)', () => {
    const wrapper = mountCockpit()
    const html = wrapper.html().toLowerCase()
    expect(html).not.toContain('walletconnect')
    expect(html).not.toContain('metamask')
    expect(html).not.toContain('connect wallet')
  })
})
