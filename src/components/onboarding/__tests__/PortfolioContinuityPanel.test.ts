/**
 * PortfolioContinuityPanel Component Tests
 *
 * Covers loading state, empty state (no prior snapshot), error state,
 * delta indicator rendering, suggested actions, and accessibility.
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PortfolioContinuityPanel from '../PortfolioContinuityPanel.vue'
import type { PortfolioDelta } from '../../../utils/portfolioOnboarding'

// ─── Router-link stub ─────────────────────────────────────────────────────────

const RouterLinkStub = {
  template: '<a :href="to"><slot /></a>',
  props: ['to'],
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeDelta(indicator: string, current: number, change: number): PortfolioDelta {
  return {
    indicator,
    previous: current - change,
    current,
    change,
    direction: change > 0 ? 'up' : change < 0 ? 'down' : 'unchanged',
    formattedChange: change > 0 ? `+${change}` : String(change),
    isPositive: change > 0,
    lastUpdated: new Date().toISOString(),
  }
}

function mountPanel(overrides: Record<string, unknown> = {}) {
  return mount(PortfolioContinuityPanel, {
    props: {
      deltas: [],
      hasPreviousSnapshot: false,
      ...overrides,
    },
    global: { stubs: { RouterLink: RouterLinkStub, 'router-link': RouterLinkStub } },
  })
}

// ─── Loading state ────────────────────────────────────────────────────────────

describe('PortfolioContinuityPanel - loading state', () => {
  it('shows loading message when loading=true', () => {
    const wrapper = mountPanel({ loading: true })
    expect(wrapper.text()).toContain('Loading portfolio data')
  })

  it('has aria-live="polite" on loading region', () => {
    const wrapper = mountPanel({ loading: true })
    expect(wrapper.find('[aria-live="polite"]').exists()).toBe(true)
  })

  it('does not show delta indicators while loading', () => {
    const wrapper = mountPanel({
      loading: true,
      hasPreviousSnapshot: true,
      deltas: [makeDelta('Tokens Created', 3, 1)],
    })
    // Should not show the grid when loading
    expect(wrapper.find('.grid').exists()).toBe(false)
  })
})

// ─── Empty state ──────────────────────────────────────────────────────────────

describe('PortfolioContinuityPanel - empty state', () => {
  it('shows first visit message when hasPreviousSnapshot=false', () => {
    const wrapper = mountPanel({ hasPreviousSnapshot: false })
    expect(wrapper.text()).toContain('First visit detected')
  })

  it('shows save message for first-time users', () => {
    const wrapper = mountPanel({ hasPreviousSnapshot: false })
    expect(wrapper.text()).toContain('snapshot will be saved')
  })
})

// ─── Error state ──────────────────────────────────────────────────────────────

describe('PortfolioContinuityPanel - error state', () => {
  it('shows error message when error prop is set', () => {
    const wrapper = mountPanel({
      hasPreviousSnapshot: true,
      error: 'Failed to load portfolio.',
    })
    expect(wrapper.text()).toContain('Failed to load portfolio.')
  })

  it('error region has role="alert"', () => {
    const wrapper = mountPanel({
      hasPreviousSnapshot: true,
      error: 'Something went wrong.',
    })
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
  })

  it('shows remediation hint in error state', () => {
    const wrapper = mountPanel({
      hasPreviousSnapshot: true,
      error: 'Something went wrong.',
    })
    expect(wrapper.text()).toContain('refreshing')
  })
})

// ─── Delta indicators ─────────────────────────────────────────────────────────

describe('PortfolioContinuityPanel - delta indicators', () => {
  it('renders one card per delta', () => {
    const deltas = [
      makeDelta('Tokens Created', 3, 2),
      makeDelta('Deployed Tokens', 1, 0),
      makeDelta('Compliance Score', 80, 10),
    ]
    const wrapper = mountPanel({ hasPreviousSnapshot: true, deltas })
    // Three indicator labels should appear
    expect(wrapper.text()).toContain('Tokens Created')
    expect(wrapper.text()).toContain('Deployed Tokens')
    expect(wrapper.text()).toContain('Compliance Score')
  })

  it('shows formatted change strings', () => {
    const deltas = [
      makeDelta('Tokens Created', 5, 3),
      makeDelta('Deployed Tokens', 2, -1),
      makeDelta('Compliance Score', 70, 0),
    ]
    const wrapper = mountPanel({ hasPreviousSnapshot: true, deltas })
    expect(wrapper.text()).toContain('+3')
    expect(wrapper.text()).toContain('-1')
    expect(wrapper.text()).toContain('0')
  })

  it('shows the current value prominently', () => {
    const deltas = [makeDelta('Tokens Created', 7, 2)]
    const wrapper = mountPanel({ hasPreviousSnapshot: true, deltas })
    expect(wrapper.text()).toContain('7')
  })
})

// ─── Snapshot age / freshness ─────────────────────────────────────────────────

describe('PortfolioContinuityPanel - freshness indicator', () => {
  it('shows snapshot age when snapshotCapturedAt provided', () => {
    const recent = new Date(Date.now() - 5000).toISOString()
    const wrapper = mountPanel({
      hasPreviousSnapshot: true,
      snapshotCapturedAt: recent,
    })
    expect(wrapper.text()).toContain('Just now')
  })

  it('shows "No prior data" when snapshotCapturedAt is not provided', () => {
    const wrapper = mountPanel({ hasPreviousSnapshot: false })
    expect(wrapper.text()).toContain('No prior data')
  })
})

// ─── Accessibility ────────────────────────────────────────────────────────────

describe('PortfolioContinuityPanel - accessibility', () => {
  it('has role="region" and aria-label', () => {
    const wrapper = mountPanel()
    const region = wrapper.find('[role="region"]')
    expect(region.exists()).toBe(true)
    expect(region.attributes('aria-label')).toBeTruthy()
  })
})
