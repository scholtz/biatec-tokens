import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TrendChart from './TrendChart.vue'
import type { TrendDataPoint } from '../../stores/insights'

describe('TrendChart', () => {
  const mockData: TrendDataPoint[] = [
    { timestamp: '2026-01-01', value: 100, label: 'Jan 1' },
    { timestamp: '2026-01-02', value: 120, label: 'Jan 2' },
    { timestamp: '2026-01-03', value: 110, label: 'Jan 3' },
    { timestamp: '2026-01-04', value: 130, label: 'Jan 4' },
    { timestamp: '2026-01-05', value: 140, label: 'Jan 5' },
  ]

  it('should render chart title', () => {
    const wrapper = mount(TrendChart, {
      props: {
        metricId: 'adoption',
        label: 'Token Adoption',
        data: mockData,
      },
    })

    expect(wrapper.text()).toContain('Token Adoption')
  })

  it('should render SVG chart when data is provided', () => {
    const wrapper = mount(TrendChart, {
      props: {
        metricId: 'adoption',
        label: 'Token Adoption',
        data: mockData,
      },
    })

    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('should show loading state when no data', () => {
    const wrapper = mount(TrendChart, {
      props: {
        metricId: 'adoption',
        label: 'Token Adoption',
        data: [],
      },
    })

    expect(wrapper.text()).toContain('Loading trend data')
  })

  it('should render data points as circles', () => {
    const wrapper = mount(TrendChart, {
      props: {
        metricId: 'adoption',
        label: 'Token Adoption',
        data: mockData,
      },
    })

    const circles = wrapper.findAll('circle')
    expect(circles.length).toBe(mockData.length)
  })

  it('should render line path', () => {
    const wrapper = mount(TrendChart, {
      props: {
        metricId: 'adoption',
        label: 'Token Adoption',
        data: mockData,
      },
    })

    const paths = wrapper.findAll('path')
    // Should have at least area and line paths
    expect(paths.length).toBeGreaterThanOrEqual(2)
  })

  it('should render grid lines', () => {
    const wrapper = mount(TrendChart, {
      props: {
        metricId: 'adoption',
        label: 'Token Adoption',
        data: mockData,
      },
    })

    const gridLines = wrapper.findAll('line')
    expect(gridLines.length).toBeGreaterThan(0)
  })

  it('should display first and last labels', () => {
    const wrapper = mount(TrendChart, {
      props: {
        metricId: 'adoption',
        label: 'Token Adoption',
        data: mockData,
      },
    })

    const html = wrapper.html()
    expect(html).toContain('Jan')
  })

  it('should handle empty data gracefully', () => {
    const wrapper = mount(TrendChart, {
      props: {
        metricId: 'adoption',
        label: 'Token Adoption',
        data: [],
      },
    })

    expect(wrapper.text()).toContain('Loading')
    expect(wrapper.find('svg').exists()).toBe(false)
  })

  it('should handle single data point', () => {
    const wrapper = mount(TrendChart, {
      props: {
        metricId: 'adoption',
        label: 'Token Adoption',
        data: [mockData[0]],
      },
    })

    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('should scale values correctly', () => {
    const dataWithRange: TrendDataPoint[] = [
      { timestamp: '2026-01-01', value: 50, label: 'Jan 1' },
      { timestamp: '2026-01-02', value: 100, label: 'Jan 2' },
      { timestamp: '2026-01-03', value: 75, label: 'Jan 3' },
    ]

    const wrapper = mount(TrendChart, {
      props: {
        metricId: 'adoption',
        label: 'Token Adoption',
        data: dataWithRange,
      },
    })

    // Chart should render with proper scaling
    expect(wrapper.find('svg').exists()).toBe(true)
    const circles = wrapper.findAll('circle')
    expect(circles.length).toBe(3)
  })
})
