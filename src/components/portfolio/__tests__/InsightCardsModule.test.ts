/**
 * InsightCardsModule component tests
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import InsightCardsModule from '../InsightCardsModule.vue'
import type { PortfolioInsight } from '../../../types/portfolioIntelligence'

const makeInsight = (id: string, severity: PortfolioInsight['severity'] = 'info'): PortfolioInsight => ({
  id,
  type: 'concentration_risk',
  severity,
  title: `Insight ${id}`,
  description: `Description for ${id}`,
  affectedAssets: [],
  priority: 1,
  dismissible: true,
})

describe('InsightCardsModule', () => {
  it('renders loading skeleton when loading=true', () => {
    const wrapper = mount(InsightCardsModule, {
      props: { insights: [], loading: true },
    })
    expect(wrapper.find('.animate-pulse').exists()).toBe(true)
  })

  it('has aria-live on loading skeleton', () => {
    const wrapper = mount(InsightCardsModule, {
      props: { insights: [], loading: true },
    })
    expect(wrapper.find('[aria-live="polite"]').exists()).toBe(true)
  })

  it('shows empty state message when insights empty and not loading', () => {
    const wrapper = mount(InsightCardsModule, {
      props: { insights: [], loading: false },
    })
    expect(wrapper.text()).toContain('No insights at this time')
  })

  it('renders InsightCard for each insight', () => {
    const wrapper = mount(InsightCardsModule, {
      props: { insights: [makeInsight('a'), makeInsight('b'), makeInsight('c')], loading: false },
    })
    const articles = wrapper.findAll('[role="article"]')
    expect(articles).toHaveLength(3)
  })

  it('limits cards shown with maxVisible', () => {
    const insights = [makeInsight('a'), makeInsight('b'), makeInsight('c'), makeInsight('d')]
    const wrapper = mount(InsightCardsModule, {
      props: { insights, loading: false, maxVisible: 2 },
    })
    const articles = wrapper.findAll('[role="article"]')
    expect(articles).toHaveLength(2)
  })

  it('shows count badge when insights present', () => {
    const wrapper = mount(InsightCardsModule, {
      props: { insights: [makeInsight('a'), makeInsight('b')], loading: false },
    })
    expect(wrapper.text()).toContain('2')
  })

  it('no count badge when loading', () => {
    const wrapper = mount(InsightCardsModule, {
      props: { insights: [makeInsight('a')], loading: true },
    })
    // Count badge should not be visible during loading
    expect(wrapper.find('.animate-pulse').exists()).toBe(true)
  })

  it('renders all insights when maxVisible is undefined', () => {
    const insights = Array.from({ length: 5 }, (_, i) => makeInsight(`ins-${i}`))
    const wrapper = mount(InsightCardsModule, {
      props: { insights, loading: false },
    })
    const articles = wrapper.findAll('[role="article"]')
    expect(articles).toHaveLength(5)
  })
})
