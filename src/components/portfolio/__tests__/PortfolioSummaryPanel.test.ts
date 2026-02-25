/**
 * PortfolioSummaryPanel component tests
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PortfolioSummaryPanel from '../PortfolioSummaryPanel.vue'
import type { PortfolioSummary } from '../../../types/portfolioIntelligence'

const makeSummary = (overrides: Partial<PortfolioSummary> = {}): PortfolioSummary => ({
  totalValueUsd: 4500,
  change24hUsd: 150,
  change24hPct: 3.45,
  allocationByCategory: [
    { label: 'Algorand', valueUsd: 1500, pct: 33.33, assetCount: 2 },
    { label: 'Ethereum', valueUsd: 3000, pct: 66.67, assetCount: 1 },
  ],
  assetCount: 3,
  capturedAt: new Date(),
  ...overrides,
})

describe('PortfolioSummaryPanel', () => {
  it('renders loading skeleton when loading=true', () => {
    const wrapper = mount(PortfolioSummaryPanel, {
      props: { summary: null, loading: true },
    })
    expect(wrapper.find('.animate-pulse').exists()).toBe(true)
  })

  it('has aria-live="polite" on loading state', () => {
    const wrapper = mount(PortfolioSummaryPanel, {
      props: { summary: null, loading: true },
    })
    expect(wrapper.find('[aria-live="polite"]').exists()).toBe(true)
  })

  it('shows error message when error prop provided', () => {
    const wrapper = mount(PortfolioSummaryPanel, {
      props: { summary: null, loading: false, error: 'Network error' },
    })
    expect(wrapper.text()).toContain('Network error')
  })

  it('shows retry button in error state', () => {
    const wrapper = mount(PortfolioSummaryPanel, {
      props: { summary: null, loading: false, error: 'Failed' },
    })
    expect(wrapper.find('button[aria-label="Retry loading portfolio"]').exists()).toBe(true)
  })

  it('emits retry when retry button clicked', async () => {
    const wrapper = mount(PortfolioSummaryPanel, {
      props: { summary: null, loading: false, error: 'Failed' },
    })
    await wrapper.find('button[aria-label="Retry loading portfolio"]').trigger('click')
    expect(wrapper.emitted('retry')).toBeTruthy()
  })

  it('shows empty state when summary is null and not loading', () => {
    const wrapper = mount(PortfolioSummaryPanel, {
      props: { summary: null, loading: false },
    })
    expect(wrapper.text()).toContain('No portfolio data yet')
  })

  it('shows total value in loaded state', () => {
    const wrapper = mount(PortfolioSummaryPanel, {
      props: { summary: makeSummary({ totalValueUsd: 4500 }), loading: false },
    })
    expect(wrapper.text()).toContain('4,500')
  })

  it('uses green class for positive 24h change', () => {
    const wrapper = mount(PortfolioSummaryPanel, {
      props: { summary: makeSummary({ change24hPct: 3.45 }), loading: false },
    })
    const changeEl = wrapper.find('.text-green-500, .dark\\:text-green-400')
    expect(changeEl.exists()).toBe(true)
  })

  it('uses red class for negative 24h change', () => {
    const wrapper = mount(PortfolioSummaryPanel, {
      props: { summary: makeSummary({ change24hPct: -2.5 }), loading: false },
    })
    const changeEl = wrapper.find('.text-red-500, .dark\\:text-red-400')
    expect(changeEl.exists()).toBe(true)
  })

  it('shows asset count', () => {
    const wrapper = mount(PortfolioSummaryPanel, {
      props: { summary: makeSummary({ assetCount: 7 }), loading: false },
    })
    expect(wrapper.text()).toContain('7')
  })

  it('has aria-label on root element', () => {
    const wrapper = mount(PortfolioSummaryPanel, {
      props: { summary: null, loading: false },
    })
    expect(wrapper.find('[aria-label]').exists()).toBe(true)
  })
})
