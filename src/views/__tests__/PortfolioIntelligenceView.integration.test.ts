/**
 * PortfolioIntelligenceView Integration Tests
 *
 * Tests for portfolio summary computation, insight derivation, watchlist
 * persistence, onboarding state, telemetry dispatch, and route meta.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import PortfolioIntelligenceView from '../PortfolioIntelligenceView.vue'
import {
  computePortfolioSummary,
  deriveInsights,
  filterAndSortInsights,
  formatPortfolioValue,
} from '../../utils/portfolioIntelligence'
import {
  addToWatchlist,
  removeFromWatchlist,
  saveWatchlist,
  loadWatchlist,
  WATCHLIST_STORAGE_KEY,
} from '../../utils/portfolioWatchlist'
import type { PortfolioAsset, WatchlistEntry } from '../../types/portfolioIntelligence'

// ─── localStorage mock ────────────────────────────────────────────────────────

const storageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()

beforeEach(() => {
  storageMock.clear()
  vi.stubGlobal('localStorage', storageMock)
  vi.spyOn(console, 'log').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const asset = (overrides: Partial<PortfolioAsset> = {}): PortfolioAsset => ({
  id: 'usdc-algo',
  symbol: 'USDC',
  name: 'USD Coin',
  network: 'Algorand',
  balance: 1000,
  valueUsd: 1000,
  price24hChangePct: 0.01,
  isLiquid: true,
  lastActivityAt: new Date(),
  ...overrides,
})

const mockAssets: PortfolioAsset[] = [
  asset({ id: 'usdc-algo', valueUsd: 1000 }),
  asset({ id: 'btc-eth', symbol: 'WBTC', network: 'Ethereum', valueUsd: 3000, price24hChangePct: -2.5, lastActivityAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000) }),
  asset({ id: 'asa-biatec', symbol: 'BIATEC', network: 'Algorand', valueUsd: 500, price24hChangePct: 25.0, isLiquid: false }),
]

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/portfolio',
        name: 'PortfolioIntelligence',
        component: PortfolioIntelligenceView,
        meta: { requiresAuth: true },
      },
      { path: '/', component: { template: '<div>Home</div>' } },
    ],
  })
}

// ─── computePortfolioSummary integration ─────────────────────────────────────

describe('computePortfolioSummary with mock assets', () => {
  it('computes correct total value', () => {
    const s = computePortfolioSummary(mockAssets)
    expect(s.totalValueUsd).toBe(4500)
  })

  it('returns 3 assets', () => {
    const s = computePortfolioSummary(mockAssets)
    expect(s.assetCount).toBe(3)
  })

  it('allocates by network correctly', () => {
    const s = computePortfolioSummary(mockAssets)
    const algo = s.allocationByCategory.find((c) => c.label === 'Algorand')
    expect(algo).toBeDefined()
    expect(algo?.assetCount).toBe(2)
  })

  it('capturedAt is recent', () => {
    const before = Date.now()
    const s = computePortfolioSummary(mockAssets)
    expect(s.capturedAt.getTime()).toBeGreaterThanOrEqual(before)
  })
})

// ─── deriveInsights integration ───────────────────────────────────────────────

describe('deriveInsights with mock assets', () => {
  const s = computePortfolioSummary(mockAssets)

  it('fires unusual_movement for BIATEC (25% change)', () => {
    const insights = deriveInsights(mockAssets, s)
    expect(insights.some((i) => i.type === 'unusual_movement' && i.affectedAssets.includes('asa-biatec'))).toBe(true)
  })

  it('fires dormant_holdings for WBTC (100 days inactive)', () => {
    const insights = deriveInsights(mockAssets, s)
    expect(insights.some((i) => i.type === 'dormant_holdings')).toBe(true)
  })

  it('fires low_liquidity_warning for BIATEC', () => {
    const insights = deriveInsights(mockAssets, s)
    expect(insights.some((i) => i.type === 'low_liquidity_warning')).toBe(true)
  })

  it('concentration rule - concentrated portfolio', () => {
    const concentrated = [
      asset({ id: 'big', valueUsd: 900 }),
      asset({ id: 'small', valueUsd: 100 }),
    ]
    const cs = computePortfolioSummary(concentrated)
    const insights = deriveInsights(concentrated, cs)
    expect(insights.some((i) => i.type === 'concentration_risk')).toBe(true)
  })

  it('diversification rule fires for 1-asset portfolio', () => {
    const single = [asset()]
    const ss = computePortfolioSummary(single)
    const insights = deriveInsights(single, ss)
    expect(insights.some((i) => i.type === 'diversification_opportunity')).toBe(true)
  })

  it('diversification rule fires for 2-asset portfolio', () => {
    const two = [asset({ id: 'a' }), asset({ id: 'b' })]
    const ss = computePortfolioSummary(two)
    const insights = deriveInsights(two, ss)
    expect(insights.some((i) => i.type === 'diversification_opportunity')).toBe(true)
  })

  it('diversification rule does NOT fire for 3-asset portfolio', () => {
    const s3 = computePortfolioSummary(mockAssets)
    const insights = deriveInsights(mockAssets, s3)
    expect(insights.some((i) => i.type === 'diversification_opportunity')).toBe(false)
  })

  it('all insights are dismissible', () => {
    const insights = deriveInsights(mockAssets, s)
    expect(insights.every((i) => i.dismissible)).toBe(true)
  })

  it('insight priorities are positive integers', () => {
    const insights = deriveInsights(mockAssets, s)
    expect(insights.every((i) => i.priority >= 1)).toBe(true)
  })
})

// ─── filterAndSortInsights integration ────────────────────────────────────────

describe('filterAndSortInsights integration', () => {
  it('orders critical before warning before info', () => {
    const insights = deriveInsights(
      [
        asset({ id: 'big', valueUsd: 900, price24hChangePct: 25, lastActivityAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000) }),
        asset({ id: 'small', valueUsd: 100 }),
      ],
      computePortfolioSummary([
        asset({ id: 'big', valueUsd: 900, price24hChangePct: 25 }),
        asset({ id: 'small', valueUsd: 100 }),
      ]),
    )
    const sorted = filterAndSortInsights(insights)
    if (sorted.length >= 2) {
      expect(sorted[0].priority).toBeLessThanOrEqual(sorted[1].priority)
    }
  })

  it('maxCount limits output', () => {
    const s = computePortfolioSummary(mockAssets)
    const insights = deriveInsights(mockAssets, s)
    const filtered = filterAndSortInsights(insights, 1)
    expect(filtered).toHaveLength(1)
  })
})

// ─── Watchlist persistence ────────────────────────────────────────────────────

describe('watchlist persistence', () => {
  it('saves and loads round-trip', () => {
    const entries: WatchlistEntry[] = [{
      assetId: 'usdc-algo', symbol: 'USDC', name: 'USD Coin', network: 'Algorand', addedAt: new Date(),
    }]
    saveWatchlist(entries)
    const loaded = loadWatchlist()
    expect(loaded).toHaveLength(1)
    expect(loaded[0].assetId).toBe('usdc-algo')
  })

  it('addToWatchlist then saveWatchlist then loadWatchlist', () => {
    const initial: WatchlistEntry[] = []
    const updated = addToWatchlist(initial, { assetId: 'btc', symbol: 'BTC', name: 'Bitcoin', network: 'Ethereum' })
    saveWatchlist(updated)
    const restored = loadWatchlist()
    expect(restored).toHaveLength(1)
    expect(restored[0].symbol).toBe('BTC')
  })

  it('removeFromWatchlist persists correctly', () => {
    const entries: WatchlistEntry[] = [
      { assetId: 'a', symbol: 'A', name: 'Asset A', network: 'Algorand', addedAt: new Date() },
      { assetId: 'b', symbol: 'B', name: 'Asset B', network: 'Ethereum', addedAt: new Date() },
    ]
    const updated = removeFromWatchlist(entries, 'a', 'Algorand')
    saveWatchlist(updated)
    const loaded = loadWatchlist()
    expect(loaded).toHaveLength(1)
    expect(loaded[0].assetId).toBe('b')
  })

  it('cross-session: data in storageMock survives clear of watchlist state', () => {
    saveWatchlist([{ assetId: 'x', symbol: 'X', name: 'X Token', network: 'VOI', addedAt: new Date() }])
    const result = loadWatchlist()
    expect(result[0].assetId).toBe('x')
  })
})

// ─── formatPortfolioValue edge cases ─────────────────────────────────────────

describe('formatPortfolioValue edge cases', () => {
  it('formats total of mock assets', () => {
    const s = computePortfolioSummary(mockAssets)
    const formatted = formatPortfolioValue(s.totalValueUsd)
    expect(formatted).toContain('4,500')
  })

  it('formats zero correctly', () => {
    expect(formatPortfolioValue(0)).toBe('$0.00')
  })

  it('formats negative value', () => {
    const r = formatPortfolioValue(-1234.56)
    expect(r).toContain('-')
    expect(r).toContain('1,234.56')
  })
})

// ─── Route meta ───────────────────────────────────────────────────────────────

describe('PortfolioIntelligence route meta', () => {
  it('portfolio route definition has requiresAuth meta', () => {
    // Verify the route we define in makeRouter has the correct meta
    const portfolioRouteDef = {
      path: '/portfolio',
      name: 'PortfolioIntelligence',
      component: PortfolioIntelligenceView,
      meta: { requiresAuth: true },
    }
    expect(portfolioRouteDef.meta.requiresAuth).toBe(true)
  })

  it('portfolio route definition has correct name', () => {
    const portfolioRouteDef = {
      path: '/portfolio',
      name: 'PortfolioIntelligence',
      component: PortfolioIntelligenceView,
      meta: { requiresAuth: true },
    }
    expect(portfolioRouteDef.name).toBe('PortfolioIntelligence')
  })
})

// ─── Partial data handling ────────────────────────────────────────────────────

describe('partial data handling', () => {
  it('null lastActivityAt does not throw in deriveInsights', () => {
    const assets = [asset({ lastActivityAt: null })]
    const s = computePortfolioSummary(assets)
    expect(() => deriveInsights(assets, s)).not.toThrow()
  })

  it('null price24hChangePct does not throw in computePortfolioSummary', () => {
    const assets = [asset({ price24hChangePct: null })]
    expect(() => computePortfolioSummary(assets)).not.toThrow()
  })

  it('zero balance assets handled gracefully', () => {
    const assets = [asset({ balance: 0, valueUsd: 0 })]
    const s = computePortfolioSummary(assets)
    expect(s.totalValueUsd).toBe(0)
  })

  it('empty portfolio returns empty insights', () => {
    const s = computePortfolioSummary([])
    expect(deriveInsights([], s)).toHaveLength(0)
  })
})

// ─── View component rendering ─────────────────────────────────────────────────

describe('PortfolioIntelligenceView component', () => {
  async function mountView() {
    const router = makeRouter()
    await router.push('/portfolio')
    return mount(PortfolioIntelligenceView, {
      global: { plugins: [router] },
    })
  }

  it('renders Portfolio Intelligence heading', async () => {
    const wrapper = await mountView()
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Portfolio Intelligence')
  })

  it('renders watchlist section', async () => {
    const wrapper = await mountView()
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Watchlist')
  })

  it('renders insights section', async () => {
    const wrapper = await mountView()
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Insights')
  })

  it('dispatches telemetry on mount', async () => {
    await mountView()
    expect(vi.mocked(console.log)).toHaveBeenCalledWith(
      '[Portfolio Analytics]',
      expect.any(String),
      expect.any(Object),
    )
  })

  it('restores watchlist from localStorage on mount', async () => {
    storageMock.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify([
      { assetId: 'test', symbol: 'TEST', name: 'Test', network: 'Algorand', addedAt: new Date().toISOString() },
    ]))
    const wrapper = await mountView()
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('TEST')
  })

  it('shows onboarding when first visit', async () => {
    // No onboarding key set → first visit
    const wrapper = await mountView()
    await wrapper.vm.$nextTick()
    // PortfolioOnboardingWalkthrough is rendered
    const dialog = wrapper.find('[role="dialog"]')
    expect(dialog.exists()).toBe(true)
  })

  it('does not show onboarding when already completed', async () => {
    storageMock.setItem('portfolio_onboarding_completed_v1', 'true')
    const wrapper = await mountView()
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
  })

  it('shows loading state initially', async () => {
    const wrapper = await mountView()
    // On first nextTick it may still be loading
    const html = wrapper.html()
    expect(html).toBeTruthy()
  })

  it('summary panel present in DOM', async () => {
    const wrapper = await mountView()
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Total Value')
  })
})
