/**
 * RiskIndicatorCard Tests
 * Verifies severity badge, progress bar colouring, trend display, and deep-link arrow.
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import RiskIndicatorCard from '../RiskIndicatorCard.vue'
import type { RiskIndicator } from '../../../types/lifecycleCockpit'

const baseIndicator: RiskIndicator = {
  severity: 'medium',
  value: 50,
  threshold: 100,
  unit: '%',
  message: 'Concentration risk within acceptable range',
  tooltip: 'Top holder concentration is 50% of supply',
  lastUpdated: new Date(),
}

function mountCard(overrides: Partial<RiskIndicator> = {}, name = 'Concentration Risk') {
  return mount(RiskIndicatorCard, {
    props: { indicator: { ...baseIndicator, ...overrides }, name },
    global: { stubs: { Badge: { template: '<span class="badge"><slot /></span>' } } },
  })
}

describe('RiskIndicatorCard', () => {
  it('renders the indicator name', () => {
    const w = mountCard()
    expect(w.text()).toContain('Concentration Risk')
  })

  it('renders the severity badge text', () => {
    const w = mountCard({ severity: 'critical' })
    expect(w.text()).toContain('critical')
  })

  it('renders the indicator message', () => {
    const w = mountCard()
    expect(w.text()).toContain('Concentration risk within acceptable range')
  })

  it('renders the tooltip text', () => {
    const w = mountCard()
    expect(w.text()).toContain('Top holder concentration is 50% of supply')
  })

  it('renders current value and threshold', () => {
    const w = mountCard({ value: 42, threshold: 80, unit: '%' })
    expect(w.text()).toContain('42%')
    expect(w.text()).toContain('80%')
  })

  it('shows trend when provided', () => {
    const w = mountCard({ trend: 'increasing' })
    expect(w.text()).toContain('increasing')
  })

  it('shows trend when decreasing', () => {
    const w = mountCard({ trend: 'decreasing' })
    expect(w.text()).toContain('decreasing')
  })

  it('shows trend when stable', () => {
    const w = mountCard({ trend: 'stable' })
    expect(w.text()).toContain('stable')
  })

  it('hides trend section when no trend provided', () => {
    const w = mountCard({ trend: undefined })
    expect(w.text()).not.toContain('Trend')
  })

  it('shows deep-link arrow icon when deepLink is set', () => {
    const w = mountCard({ deepLink: '/compliance/setup' })
    const arrow = w.find('.pi-arrow-right')
    expect(arrow.exists()).toBe(true)
  })

  it('hides deep-link arrow when deepLink is absent', () => {
    const w = mountCard({ deepLink: undefined })
    const arrow = w.find('.pi-arrow-right')
    expect(arrow.exists()).toBe(false)
  })

  it('applies red progress bar for critical severity', () => {
    const w = mountCard({ severity: 'critical' })
    const bar = w.find('.bg-red-500')
    expect(bar.exists()).toBe(true)
  })

  it('applies yellow progress bar for medium severity', () => {
    const w = mountCard({ severity: 'medium' })
    const bar = w.find('.bg-yellow-500')
    expect(bar.exists()).toBe(true)
  })

  it('applies blue progress bar for low severity', () => {
    const w = mountCard({ severity: 'low' })
    const bar = w.find('.bg-blue-500')
    expect(bar.exists()).toBe(true)
  })

  it('applies green progress bar for healthy severity', () => {
    const w = mountCard({ severity: 'healthy' as any })
    const bar = w.find('.bg-green-500')
    expect(bar.exists()).toBe(true)
  })

  it('progress bar width does not exceed 100%', () => {
    // value > threshold should cap at 100%
    const w = mountCard({ value: 200, threshold: 100 })
    const bar = w.find('[style]')
    expect(bar.attributes('style')).toContain('width: 100%')
  })
})
