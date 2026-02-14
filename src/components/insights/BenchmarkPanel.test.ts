import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BenchmarkPanel from './BenchmarkPanel.vue'
import type { CompetitorBenchmark } from '../../stores/insights'

describe('BenchmarkPanel', () => {
  const mockBenchmarks: CompetitorBenchmark[] = [
    {
      id: 'competitor-1',
      name: 'Similar Token A',
      metrics: {
        adoption: 2100,
        retention: 72,
        txQuality: 8.2,
      },
      source: 'DeFi Pulse',
      lastUpdated: new Date().toISOString(),
    },
    {
      id: 'competitor-2',
      name: 'Similar Token B',
      metrics: {
        adoption: 890,
        retention: 65,
        txQuality: 7.5,
      },
      source: 'CoinGecko',
      lastUpdated: new Date().toISOString(),
    },
  ]

  const mockCurrentMetrics = {
    adoption: '1,247',
    retention: '68%',
    txQuality: '7.8/10',
  }

  it('should render benchmark table', () => {
    const wrapper = mount(BenchmarkPanel, {
      props: {
        benchmarks: mockBenchmarks,
        currentMetrics: mockCurrentMetrics,
      },
    })

    expect(wrapper.text()).toContain('Competitor Benchmarks')
    expect(wrapper.find('table').exists()).toBe(true)
  })

  it('should display your token row with badge', () => {
    const wrapper = mount(BenchmarkPanel, {
      props: {
        benchmarks: mockBenchmarks,
        currentMetrics: mockCurrentMetrics,
      },
    })

    expect(wrapper.text()).toContain('Your Token')
    expect(wrapper.text()).toContain('You')
  })

  it('should display competitor data', () => {
    const wrapper = mount(BenchmarkPanel, {
      props: {
        benchmarks: mockBenchmarks,
        currentMetrics: mockCurrentMetrics,
      },
    })

    expect(wrapper.text()).toContain('Similar Token A')
    expect(wrapper.text()).toContain('Similar Token B')
    expect(wrapper.text()).toContain('DeFi Pulse')
    expect(wrapper.text()).toContain('CoinGecko')
  })

  it('should show comparison percentages', () => {
    const wrapper = mount(BenchmarkPanel, {
      props: {
        benchmarks: mockBenchmarks,
        currentMetrics: mockCurrentMetrics,
      },
    })

    // Should show percentage differences
    const html = wrapper.html()
    expect(html).toContain('%')
  })

  it('should handle empty benchmarks', () => {
    const wrapper = mount(BenchmarkPanel, {
      props: {
        benchmarks: [],
        currentMetrics: mockCurrentMetrics,
      },
    })

    expect(wrapper.text()).toContain('No benchmark data available')
  })

  it('should display data source information', () => {
    const wrapper = mount(BenchmarkPanel, {
      props: {
        benchmarks: mockBenchmarks,
        currentMetrics: mockCurrentMetrics,
      },
    })

    expect(wrapper.text()).toContain('Data sources and update frequency may vary')
    expect(wrapper.text()).toContain('Last updated:')
  })
})
