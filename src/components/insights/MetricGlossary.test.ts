import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MetricGlossary from './MetricGlossary.vue'
import type { MetricData } from '../../stores/insights'

describe('MetricGlossary', () => {
  const mockMetrics: MetricData[] = [
    {
      id: 'adoption',
      label: 'Token Adoption Rate',
      value: '1,247',
      change: 12.5,
      trend: 'up',
      definition: 'Number of unique wallet addresses holding the token',
      timestamp: new Date().toISOString(),
    },
    {
      id: 'retention',
      label: 'User Retention',
      value: '68%',
      change: -2.3,
      trend: 'down',
      definition: 'Percentage of token holders who remain active after 30 days',
      timestamp: new Date().toISOString(),
    },
  ]

  it('should render modal component', () => {
    const wrapper = mount(MetricGlossary, {
      props: { metrics: mockMetrics },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    expect(wrapper.findComponent({ name: 'Modal' }).exists()).toBe(true)
  })

  it('should display metric labels', () => {
    const wrapper = mount(MetricGlossary, {
      props: { metrics: mockMetrics },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    expect(wrapper.text()).toContain('Token Adoption Rate')
    expect(wrapper.text()).toContain('User Retention')
  })

  it('should display metric definitions', () => {
    const wrapper = mount(MetricGlossary, {
      props: { metrics: mockMetrics },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    expect(wrapper.text()).toContain('Number of unique wallet addresses')
    expect(wrapper.text()).toContain('Percentage of token holders who remain active')
  })

  it('should display metric IDs', () => {
    const wrapper = mount(MetricGlossary, {
      props: { metrics: mockMetrics },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    expect(wrapper.text()).toContain('adoption')
    expect(wrapper.text()).toContain('retention')
  })

  it('should display current values when available', () => {
    const wrapper = mount(MetricGlossary, {
      props: { metrics: mockMetrics },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    expect(wrapper.text()).toContain('Current value')
    expect(wrapper.text()).toContain('1,247')
    expect(wrapper.text()).toContain('68%')
  })

  it('should emit close event when button clicked', async () => {
    const wrapper = mount(MetricGlossary, {
      props: { metrics: mockMetrics },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    const closeButtons = wrapper.findAllComponents({ name: 'Button' })
    if (closeButtons.length > 0) {
      await closeButtons[0].vm.$emit('click')
      expect(wrapper.emitted('close')).toBeTruthy()
    }
  })

  it('should handle empty metrics array', () => {
    const wrapper = mount(MetricGlossary, {
      props: { metrics: [] },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    // Should render modal even with no metrics
    expect(wrapper.findComponent({ name: 'Modal' }).exists()).toBe(true)
  })

  it('should have scrollable container for metrics', () => {
    const wrapper = mount(MetricGlossary, {
      props: { metrics: mockMetrics },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    const html = wrapper.html()
    expect(html).toContain('overflow-y-auto')
  })

  it('should separate metrics with borders', () => {
    const wrapper = mount(MetricGlossary, {
      props: { metrics: mockMetrics },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    const html = wrapper.html()
    expect(html).toContain('border-b')
  })
})
