/**
 * WatchlistModule component tests
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import WatchlistModule from '../WatchlistModule.vue'
import type { WatchlistEntry, PortfolioAsset } from '../../../types/portfolioIntelligence'

const entry = (overrides: Partial<WatchlistEntry> = {}): WatchlistEntry => ({
  assetId: 'usdc-algo',
  symbol: 'USDC',
  name: 'USD Coin',
  network: 'Algorand',
  addedAt: new Date('2024-01-01'),
  ...overrides,
})

const asset = (overrides: Partial<PortfolioAsset> = {}): PortfolioAsset => ({
  id: 'usdc-algo',
  symbol: 'USDC',
  name: 'USD Coin',
  network: 'Algorand',
  balance: 100,
  valueUsd: 100,
  price24hChangePct: 0,
  isLiquid: true,
  lastActivityAt: new Date(),
  ...overrides,
})

describe('WatchlistModule', () => {
  it('shows empty state when watchlist is empty', () => {
    const wrapper = mount(WatchlistModule, {
      props: { watchlist: [] },
    })
    expect(wrapper.text()).toContain('Pin assets for quick access')
  })

  it('renders each watchlist entry', () => {
    const wrapper = mount(WatchlistModule, {
      props: {
        watchlist: [
          entry({ symbol: 'USDC' }),
          entry({ assetId: 'btc', symbol: 'WBTC', network: 'Ethereum' }),
        ],
      },
    })
    expect(wrapper.text()).toContain('USDC')
    expect(wrapper.text()).toContain('WBTC')
  })

  it('has remove button for each entry', () => {
    const wrapper = mount(WatchlistModule, {
      props: { watchlist: [entry(), entry({ assetId: 'btc', network: 'Ethereum' })] },
    })
    const removeButtons = wrapper.findAll('button[aria-label*="Remove"]')
    expect(removeButtons).toHaveLength(2)
  })

  it('emits remove event with correct payload when remove button clicked', async () => {
    const wrapper = mount(WatchlistModule, {
      props: { watchlist: [entry({ assetId: 'usdc-algo', network: 'Algorand' })] },
    })
    await wrapper.find('button[aria-label*="Remove USDC"]').trigger('click')
    const emitted = wrapper.emitted('remove')
    expect(emitted).toBeTruthy()
    expect(emitted![0][0]).toEqual({ assetId: 'usdc-algo', network: 'Algorand' })
  })

  it('renders available assets list when availableAssets provided', () => {
    const wrapper = mount(WatchlistModule, {
      props: {
        watchlist: [],
        availableAssets: [asset({ symbol: 'WBTC' })],
      },
    })
    expect(wrapper.text()).toContain('WBTC')
  })

  it('emits add event when add button clicked', async () => {
    const avAsset = asset({ id: 'wbtc', symbol: 'WBTC', network: 'Ethereum' })
    const wrapper = mount(WatchlistModule, {
      props: { watchlist: [], availableAssets: [avAsset] },
    })
    await wrapper.find('button[aria-label*="Add WBTC"]').trigger('click')
    const emitted = wrapper.emitted('add')
    expect(emitted).toBeTruthy()
    expect(emitted![0][0]).toMatchObject({ assetId: 'wbtc', symbol: 'WBTC', network: 'Ethereum' })
  })

  it('shows network label for each entry', () => {
    const wrapper = mount(WatchlistModule, {
      props: { watchlist: [entry({ network: 'Algorand' })] },
    })
    expect(wrapper.text()).toContain('Algorand')
  })

  it('remove button has accessible aria-label', () => {
    const wrapper = mount(WatchlistModule, {
      props: { watchlist: [entry({ symbol: 'USDC' })] },
    })
    const btn = wrapper.find('button[aria-label*="Remove USDC"]')
    expect(btn.exists()).toBe(true)
  })
})
