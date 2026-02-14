import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import MetricCard from './MetricCard.vue'
import type { MetricData } from '../../stores/insights'

describe('MetricCard', () => {
  const mockMetric: MetricData = {
    id: 'adoption',
    label: 'Token Adoption Rate',
    value: '1,247',
    change: 12.5,
    trend: 'up',
    definition: 'Number of unique wallet addresses holding the token',
    timestamp: new Date().toISOString(),
  }

  it('should render metric data correctly', () => {
    const wrapper = mount(MetricCard, {
      props: { metric: mockMetric },
    })

    expect(wrapper.text()).toContain('Token Adoption Rate')
    expect(wrapper.text()).toContain('1,247')
    expect(wrapper.text()).toContain('+12.5%')
  })

  it('should display positive trend with green color', () => {
    const wrapper = mount(MetricCard, {
      props: { metric: { ...mockMetric, trend: 'up', change: 10 } },
    })

    expect(wrapper.find('.text-green-400').exists()).toBe(true)
    expect(wrapper.text()).toContain('+10.0%')
  })

  it('should display negative trend with red color', () => {
    const wrapper = mount(MetricCard, {
      props: { metric: { ...mockMetric, trend: 'down', change: -5.2 } },
    })

    expect(wrapper.find('.text-red-400').exists()).toBe(true)
    expect(wrapper.text()).toContain('-5.2%')
  })

  it('should display stable trend with gray color', () => {
    const wrapper = mount(MetricCard, {
      props: { metric: { ...mockMetric, trend: 'stable', change: 0 } },
    })

    expect(wrapper.find('.text-gray-400').exists()).toBe(true)
    expect(wrapper.text()).toContain('0.0%')
  })

  it('should display metric definition in tooltip', () => {
    const wrapper = mount(MetricCard, {
      props: { metric: mockMetric },
    })

    // Tooltip component should receive the definition
    const tooltip = wrapper.findComponent({ name: 'Tooltip' })
    expect(tooltip.exists()).toBe(true)
  })

  it('should be clickable', async () => {
    const wrapper = mount(MetricCard, {
      props: { metric: mockMetric },
    })

    expect(wrapper.classes()).toContain('cursor-pointer')
  })
})
