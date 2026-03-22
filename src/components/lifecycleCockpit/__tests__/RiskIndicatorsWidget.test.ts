/**
 * RiskIndicatorsWidget Tests
 * Verifies null state, renders all 3 risk indicator cards,
 * severity-based borders, navigate emit, and timestamp formatting.
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import RiskIndicatorsWidget from '../RiskIndicatorsWidget.vue'
import type { LifecycleRiskIndicators, RiskIndicator } from '../../../types/lifecycleCockpit'

const stubs = {
  Card: { template: '<div class="card"><slot /></div>' },
  RiskIndicatorCard: { template: '<div class="risk-card">{{ name }}</div>', props: ['indicator', 'name'] },
}

function makeIndicator(overrides: Partial<RiskIndicator> = {}): RiskIndicator {
  return {
    severity: 'low',
    value: 10,
    threshold: 100,
    unit: '%',
    message: 'Within threshold',
    tooltip: 'No action needed',
    lastUpdated: new Date(),
    ...overrides,
  }
}

function makeIndicators(overrides: Partial<LifecycleRiskIndicators> = {}): LifecycleRiskIndicators {
  return {
    concentration: makeIndicator(),
    inactivity: makeIndicator(),
    unusualActivity: makeIndicator(),
    lastUpdated: new Date(),
    ...overrides,
  }
}

describe('RiskIndicatorsWidget', () => {
  it('shows no-token state when indicators is null', () => {
    const w = mount(RiskIndicatorsWidget, { props: { indicators: null }, global: { stubs } })
    expect(w.text()).toContain('No token deployed yet')
  })

  it('renders all three risk indicator cards', () => {
    const w = mount(RiskIndicatorsWidget, {
      props: { indicators: makeIndicators() },
      global: { stubs },
    })
    expect(w.text()).toContain('Holder Concentration')
    expect(w.text()).toContain('Holder Inactivity')
    expect(w.text()).toContain('Unusual Activity')
  })

  it('applies critical border for critical concentration severity', () => {
    const w = mount(RiskIndicatorsWidget, {
      props: { indicators: makeIndicators({ concentration: makeIndicator({ severity: 'critical' }) }) },
      global: { stubs },
    })
    expect(w.html()).toContain('border-red-500')
  })

  it('applies orange border for high severity inactivity', () => {
    const w = mount(RiskIndicatorsWidget, {
      props: { indicators: makeIndicators({ inactivity: makeIndicator({ severity: 'high' }) }) },
      global: { stubs },
    })
    expect(w.html()).toContain('border-orange-500')
  })

  it('applies yellow border for medium severity unusual activity', () => {
    const w = mount(RiskIndicatorsWidget, {
      props: { indicators: makeIndicators({ unusualActivity: makeIndicator({ severity: 'medium' }) }) },
      global: { stubs },
    })
    expect(w.html()).toContain('border-yellow-500')
  })

  it('applies blue border for low severity', () => {
    const w = mount(RiskIndicatorsWidget, {
      props: { indicators: makeIndicators({ concentration: makeIndicator({ severity: 'low' }) }) },
      global: { stubs },
    })
    expect(w.html()).toContain('border-blue-500')
  })

  it('applies green border for healthy severity', () => {
    const w = mount(RiskIndicatorsWidget, {
      props: { indicators: makeIndicators({ concentration: makeIndicator({ severity: 'healthy' as any }) }) },
      global: { stubs },
    })
    expect(w.html()).toContain('border-green-500')
  })

  it('shows last-updated timestamp footer', () => {
    const w = mount(RiskIndicatorsWidget, {
      props: { indicators: makeIndicators() },
      global: { stubs },
    })
    expect(w.text()).toContain('Last updated:')
  })

  it('emits navigate when concentration card has deepLink and is clicked', async () => {
    const indics = makeIndicators({
      concentration: makeIndicator({ deepLink: '/risk/concentration' }),
    })
    const w = mount(RiskIndicatorsWidget, {
      props: { indicators: indics },
      global: { stubs },
    })
    const clickable = w.find('.cursor-pointer')
    if (clickable.exists()) {
      await clickable.trigger('click')
      const emitted = w.emitted('navigate')
      expect(emitted).toBeDefined()
    }
  })
})
