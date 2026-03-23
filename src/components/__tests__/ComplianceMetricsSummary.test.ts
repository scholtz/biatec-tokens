import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ComplianceMetricsSummary from '../ComplianceMetricsSummary.vue'
import type { NetworkComplianceMetrics } from '../../stores/complianceDashboard'

vi.mock('../ui/Card.vue', () => ({
  default: {
    name: 'Card',
    template: '<div data-testid="card"><slot /></div>',
    props: ['variant', 'hover']
  }
}))

vi.mock('../ui/Badge.vue', () => ({
  default: {
    name: 'Badge',
    template: '<span data-testid="badge" :data-variant="variant"><slot /></span>',
    props: ['variant']
  }
}))

const makeMetrics = (overrides: Partial<NetworkComplianceMetrics>[] = []): NetworkComplianceMetrics[] => {
  const defaults: NetworkComplianceMetrics[] = [
    { network: 'VOI', totalAssets: 10, compliantAssets: 7, restrictedAssets: 2, micaReadyAssets: 5, whitelistedAssets: 8 },
    { network: 'Aramid', totalAssets: 20, compliantAssets: 15, restrictedAssets: 3, micaReadyAssets: 10, whitelistedAssets: 18 }
  ]
  return overrides.length > 0
    ? overrides.map((o, i) => ({ ...defaults[i], ...o }))
    : defaults
}

describe('ComplianceMetricsSummary', () => {
  it('renders without errors with valid props', () => {
    const wrapper = mount(ComplianceMetricsSummary, {
      props: { networkMetrics: makeMetrics() }
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('computes totalAssets correctly as sum across networks', () => {
    const wrapper = mount(ComplianceMetricsSummary, {
      props: { networkMetrics: makeMetrics() }
    })
    // 10 + 20 = 30
    expect(wrapper.text()).toContain('30')
  })

  it('computes compliantAssets correctly as sum across networks', () => {
    const wrapper = mount(ComplianceMetricsSummary, {
      props: { networkMetrics: makeMetrics() }
    })
    // 7 + 15 = 22
    expect(wrapper.text()).toContain('22')
  })

  it('computes micaReadyAssets correctly as sum across networks', () => {
    const wrapper = mount(ComplianceMetricsSummary, {
      props: { networkMetrics: makeMetrics() }
    })
    // 5 + 10 = 15
    expect(wrapper.text()).toContain('15')
  })

  it('computes restrictedAssets correctly as sum across networks', () => {
    const wrapper = mount(ComplianceMetricsSummary, {
      props: { networkMetrics: makeMetrics() }
    })
    // 2 + 3 = 5
    expect(wrapper.text()).toContain('5')
  })

  it('computes compliantPercentage rounded correctly', () => {
    // 22 / 30 = 73.33... -> 73%
    const wrapper = mount(ComplianceMetricsSummary, {
      props: { networkMetrics: makeMetrics() }
    })
    expect(wrapper.text()).toContain('73%')
  })

  it('computes compliantPercentage as 0 when totalAssets is 0', () => {
    const wrapper = mount(ComplianceMetricsSummary, {
      props: {
        networkMetrics: [
          { network: 'VOI', totalAssets: 0, compliantAssets: 0, restrictedAssets: 0, micaReadyAssets: 0, whitelistedAssets: 0 }
        ]
      }
    })
    expect(wrapper.text()).toContain('0%')
  })

  it('clamps compliantPercentage to 100 if computed exceeds bounds', () => {
    const wrapper = mount(ComplianceMetricsSummary, {
      props: {
        networkMetrics: [
          { network: 'VOI', totalAssets: 5, compliantAssets: 10, restrictedAssets: 0, micaReadyAssets: 0, whitelistedAssets: 0 }
        ]
      }
    })
    expect(wrapper.text()).toContain('100%')
  })

  it('shows transfer impact warning when restrictedAssets > 0', () => {
    const wrapper = mount(ComplianceMetricsSummary, {
      props: { networkMetrics: makeMetrics() }
    })
    expect(wrapper.text()).toContain('Transfer Impact')
  })

  it('does not show transfer impact warning when restrictedAssets is 0', () => {
    const wrapper = mount(ComplianceMetricsSummary, {
      props: {
        networkMetrics: [
          { network: 'VOI', totalAssets: 10, compliantAssets: 8, restrictedAssets: 0, micaReadyAssets: 5, whitelistedAssets: 9 }
        ]
      }
    })
    expect(wrapper.text()).not.toContain('Transfer Impact')
  })

  it('shows network breakdown section when showNetworkBreakdown is true (default)', () => {
    const wrapper = mount(ComplianceMetricsSummary, {
      props: { networkMetrics: makeMetrics() }
    })
    expect(wrapper.text()).toContain('Network Breakdown')
  })

  it('hides network breakdown when showNetworkBreakdown is false', () => {
    const wrapper = mount(ComplianceMetricsSummary, {
      props: { networkMetrics: makeMetrics(), showNetworkBreakdown: false }
    })
    expect(wrapper.text()).not.toContain('Network Breakdown')
  })

  it('renders a row per network in the breakdown', () => {
    const wrapper = mount(ComplianceMetricsSummary, {
      props: { networkMetrics: makeMetrics() }
    })
    expect(wrapper.text()).toContain('VOI')
    expect(wrapper.text()).toContain('Aramid')
  })

  it('handles empty networkMetrics array gracefully', () => {
    const wrapper = mount(ComplianceMetricsSummary, {
      props: { networkMetrics: [] }
    })
    expect(wrapper.exists()).toBe(true)
    // totalAssets = 0, compliantPercentage = 0
    expect(wrapper.text()).toContain('0%')
  })
})
