/**
 * PortfolioIntelligenceView Tests
 *
 * Covers rendering, onboarding state, watchlist handlers, insight dismissal,
 * and portfolio loading — the core business logic of the portfolio intelligence surface.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createMemoryHistory } from 'vue-router'
import { nextTick } from 'vue'
import PortfolioIntelligenceView from '../PortfolioIntelligenceView.vue'

vi.mock('../../utils/portfolioAnalytics', () => ({
  trackOnboardingStarted: vi.fn(),
  trackOnboardingCompleted: vi.fn(),
  trackOnboardingSkipped: vi.fn(),
  trackInsightClicked: vi.fn(),
  trackInsightDismissed: vi.fn(),
  trackWatchlistAdded: vi.fn(),
  trackWatchlistRemoved: vi.fn(),
}))

vi.mock('../../utils/portfolioWatchlist', () => ({
  loadWatchlist: vi.fn(() => []),
  saveWatchlist: vi.fn(),
  addToWatchlist: vi.fn((list: unknown[], entry: unknown) => [...list, entry]),
  removeFromWatchlist: vi.fn((list: unknown[], id: string) =>
    (list as { assetId: string }[]).filter((e) => e.assetId !== id),
  ),
  PORTFOLIO_ONBOARDING_COMPLETED_KEY: 'portfolio_onboarding_completed',
}))

vi.mock('../../utils/portfolioIntelligence', () => ({
  computePortfolioSummary: vi.fn(() => ({
    totalValueUsd: 4500,
    totalAssets: 3,
    topNetwork: 'Algorand',
    liquidValueUsd: 4000,
  })),
  deriveInsights: vi.fn(() => [
    { id: 'insight-1', type: 'opportunity', title: 'Test Insight', description: 'Desc', severity: 'medium', actionLabel: 'Act', actionRoute: '/test' },
  ]),
  filterAndSortInsights: vi.fn((list: unknown[]) => list),
}))

const makeRouter = () =>
  createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', component: { template: '<div/>' } }],
  })

async function mountView() {
  const router = makeRouter()
  const wrapper = mount(PortfolioIntelligenceView, {
    global: {
      plugins: [createTestingPinia({ createSpy: vi.fn }), router],
      stubs: {
        MainLayout: { template: '<div><slot /></div>' },
        Card: { template: '<div><slot /></div>' },
        PortfolioSummaryPanel: { template: '<div data-testid="portfolio-summary" />' },
        InsightCardsModule: { template: '<div data-testid="insight-cards" />' },
        WatchlistModule: { template: '<div data-testid="watchlist-module" />' },
        PortfolioOnboardingWalkthrough: { template: '<div data-testid="onboarding-walkthrough" />' },
      },
    },
  })
  await router.isReady()
  await nextTick()
  return wrapper
}

describe('PortfolioIntelligenceView', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('renders without errors', async () => {
    const wrapper = await mountView()
    expect(wrapper.exists()).toBe(true)
  })

  it('detects first visit when onboarding key absent', async () => {
    const wrapper = await mountView()
    const vm = wrapper.vm as any
    expect(vm.isFirstVisit).toBe(true)
    expect(vm.hasCompletedOnboarding).toBe(false)
  })

  it('detects returning user when onboarding key present', async () => {
    localStorage.setItem('portfolio_onboarding_completed', '1')
    const wrapper = await mountView()
    const vm = wrapper.vm as any
    expect(vm.isFirstVisit).toBe(false)
    expect(vm.hasCompletedOnboarding).toBe(true)
  })

  it('loads portfolio summary on mount', async () => {
    const wrapper = await mountView()
    const vm = wrapper.vm as any
    expect(vm.summary).not.toBeNull()
    expect(vm.summary.totalValueUsd).toBe(4500)
  })

  it('loads insights on mount', async () => {
    const wrapper = await mountView()
    const vm = wrapper.vm as any
    expect(vm.allInsights).toHaveLength(1)
  })

  it('visibleInsights filters out dismissed insights', async () => {
    const wrapper = await mountView()
    const vm = wrapper.vm as any
    expect(vm.visibleInsights).toHaveLength(1)
    vm.dismissedInsightIds.add('insight-1')
    await nextTick()
    expect(vm.visibleInsights).toHaveLength(0)
  })

  it('onInsightDismissed adds to dismissedInsightIds', async () => {
    const wrapper = await mountView()
    const vm = wrapper.vm as any
    const insight = { id: 'insight-1', type: 'opportunity' }
    vm.onInsightDismissed(insight)
    expect(vm.dismissedInsightIds.has('insight-1')).toBe(true)
  })

  it('onOnboardingCompleted sets hasCompletedOnboarding = true', async () => {
    const wrapper = await mountView()
    const vm = wrapper.vm as any
    vm.onOnboardingCompleted()
    expect(vm.hasCompletedOnboarding).toBe(true)
  })

  it('onOnboardingSkipped sets hasCompletedOnboarding = true', async () => {
    const wrapper = await mountView()
    const vm = wrapper.vm as any
    vm.onOnboardingSkipped()
    expect(vm.hasCompletedOnboarding).toBe(true)
  })

  it('currentUserId returns anonymous when no user in localStorage', async () => {
    const wrapper = await mountView()
    const vm = wrapper.vm as any
    expect(vm.currentUserId()).toBe('anonymous')
  })

  it('currentUserId returns email from localStorage user', async () => {
    localStorage.setItem('algorand_user', JSON.stringify({ email: 'user@example.com' }))
    const wrapper = await mountView()
    const vm = wrapper.vm as any
    expect(vm.currentUserId()).toBe('user@example.com')
  })

  it('currentUserId returns anonymous on corrupt localStorage value', async () => {
    localStorage.setItem('algorand_user', 'NOT_VALID_JSON:::')
    const wrapper = await mountView()
    const vm = wrapper.vm as any
    expect(vm.currentUserId()).toBe('anonymous')
  })

  it('onWatchlistAdd appends entry to watchlist', async () => {
    const wrapper = await mountView()
    const vm = wrapper.vm as any
    vm.onWatchlistAdd({ assetId: 'usdc', symbol: 'USDC', name: 'USD Coin', network: 'Algorand' })
    expect(vm.watchlist.length).toBeGreaterThan(0)
  })

  it('onWatchlistRemove removes entry from watchlist', async () => {
    const wrapper = await mountView()
    const vm = wrapper.vm as any
    vm.watchlist = [{ assetId: 'usdc', symbol: 'USDC', name: 'USD Coin', network: 'Algorand' }]
    vm.onWatchlistRemove({ assetId: 'usdc', network: 'Algorand' })
    expect(vm.watchlist.length).toBe(0)
  })
})
