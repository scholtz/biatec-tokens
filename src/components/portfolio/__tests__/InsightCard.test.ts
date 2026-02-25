/**
 * InsightCard component tests
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import InsightCard from '../InsightCard.vue'
import type { PortfolioInsight } from '../../../types/portfolioIntelligence'

const makeInsight = (overrides: Partial<PortfolioInsight> = {}): PortfolioInsight => ({
  id: 'test-insight',
  type: 'concentration_risk',
  severity: 'critical',
  title: 'High Concentration Risk',
  description: 'USDC represents 80% of your portfolio.',
  actionLabel: 'Explore Diversification',
  actionPath: '/portfolio',
  affectedAssets: ['usdc-algo'],
  priority: 1,
  dismissible: true,
  ...overrides,
})

describe('InsightCard', () => {
  it('renders title', () => {
    const wrapper = mount(InsightCard, { props: { insight: makeInsight() } })
    expect(wrapper.text()).toContain('High Concentration Risk')
  })

  it('renders description', () => {
    const wrapper = mount(InsightCard, { props: { insight: makeInsight() } })
    expect(wrapper.text()).toContain('USDC represents 80%')
  })

  it('shows severity badge', () => {
    const wrapper = mount(InsightCard, { props: { insight: makeInsight({ severity: 'critical' }) } })
    expect(wrapper.text()).toContain('Critical')
  })

  it('shows warning severity badge', () => {
    const wrapper = mount(InsightCard, { props: { insight: makeInsight({ severity: 'warning' }) } })
    expect(wrapper.text()).toContain('Warning')
  })

  it('shows info severity badge', () => {
    const wrapper = mount(InsightCard, { props: { insight: makeInsight({ severity: 'info' }) } })
    expect(wrapper.text()).toContain('Info')
  })

  it('renders action button when actionLabel is set', () => {
    const wrapper = mount(InsightCard, { props: { insight: makeInsight({ actionLabel: 'Take Action' }) } })
    expect(wrapper.text()).toContain('Take Action')
  })

  it('emits clicked with insight when action button clicked', async () => {
    const insight = makeInsight()
    const wrapper = mount(InsightCard, { props: { insight } })
    await wrapper.find('button[aria-label*="Explore Diversification"]').trigger('click')
    const emitted = wrapper.emitted('clicked')
    expect(emitted).toBeTruthy()
    expect(emitted![0][0]).toEqual(insight)
  })

  it('shows dismiss button when dismissible=true', () => {
    const wrapper = mount(InsightCard, { props: { insight: makeInsight({ dismissible: true }) } })
    expect(wrapper.find('button[aria-label="Dismiss insight"]').exists()).toBe(true)
  })

  it('emits dismissed when dismiss button clicked', async () => {
    const insight = makeInsight({ dismissible: true })
    const wrapper = mount(InsightCard, { props: { insight } })
    await wrapper.find('button[aria-label="Dismiss insight"]').trigger('click')
    const emitted = wrapper.emitted('dismissed')
    expect(emitted).toBeTruthy()
    expect(emitted![0][0]).toEqual(insight)
  })

  it('does not show dismiss button when dismissible=false', () => {
    const wrapper = mount(InsightCard, { props: { insight: makeInsight({ dismissible: false }) } })
    expect(wrapper.find('button[aria-label="Dismiss insight"]').exists()).toBe(false)
  })

  it('has role="article"', () => {
    const wrapper = mount(InsightCard, { props: { insight: makeInsight() } })
    expect(wrapper.find('[role="article"]').exists()).toBe(true)
  })

  it('has aria-label on article', () => {
    const wrapper = mount(InsightCard, { props: { insight: makeInsight() } })
    const article = wrapper.find('[role="article"]')
    expect(article.attributes('aria-label')).toContain('High Concentration Risk')
  })
})
