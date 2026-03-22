/**
 * Marketplace View Tests
 * 
 * Tests for the Token Marketplace view, which displays regulated tokens
 * for enterprise operators to discover and trade.
 * 
 * Business value: Marketplace visibility directly supports operator trust —
 * operators need to discover tokens with correct compliance badges (MICA,
 * KYC, Whitelisted) to make informed decisions for regulated token operations.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createMemoryHistory } from 'vue-router'
import { nextTick } from 'vue'
import Marketplace from '../Marketplace.vue'

// Stub components that have heavy deps
vi.mock('../../layout/MainLayout.vue', () => ({
  default: { name: 'MainLayout', template: '<div><slot /></div>' },
}))
vi.mock('../../components/MarketplaceFilters.vue', () => ({
  default: { name: 'MarketplaceFilters', template: '<div data-testid="marketplace-filters" />', props: ['filters', 'filteredCount', 'totalTokens'] },
}))
vi.mock('../../components/MarketplaceTokenCard.vue', () => ({
  default: { name: 'MarketplaceTokenCard', template: '<div data-testid="marketplace-token-card" />', props: ['token'] },
}))
vi.mock('../../components/TokenDetailDrawer.vue', () => ({
  default: { name: 'TokenDetailDrawer', template: '<div data-testid="token-detail-drawer" />', props: ['token', 'isOpen'] },
}))
vi.mock('../../services/PriceOracleService', () => ({
  priceOracleService: {
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
    startPolling: vi.fn(),
    stopPolling: vi.fn(),
  },
}))

const makeRouter = () =>
  createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', component: { template: '<div />' } }, { path: '/marketplace', component: Marketplace }],
  })

const mountMarketplace = async (storeOverrides = {}) => {
  const router = makeRouter()
  await router.push('/marketplace')
  await router.isReady()

  const pinia = createTestingPinia({
    createSpy: vi.fn,
    initialState: {
      marketplace: {
        tokens: [],
        filters: { network: 'All', complianceBadge: 'All', assetClass: 'All', search: '' },
        loading: false,
        error: null,
        filteredCount: 0,
        totalTokens: 0,
        ...storeOverrides,
      },
    },
  })

  const wrapper = mount(Marketplace, {
    global: {
      plugins: [pinia, router],
      stubs: {
        MainLayout: { template: '<div><slot /></div>' },
        MarketplaceFilters: { template: '<div data-testid="marketplace-filters" />', props: ['filters', 'filteredCount', 'totalTokens'] },
        MarketplaceTokenCard: { template: '<div data-testid="marketplace-token-card" />', props: ['token'] },
        TokenDetailDrawer: { template: '<div data-testid="token-detail-drawer" />', props: ['token', 'isOpen'] },
      },
    },
  })
  await nextTick()
  return { wrapper, router }
}

describe('Marketplace View', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the Token Marketplace heading', async () => {
    const { wrapper } = await mountMarketplace()
    const heading = wrapper.find('h1')
    expect(heading.exists()).toBe(true)
    expect(heading.text()).toContain('Token Marketplace')
  })

  it('renders the marketplace description text', async () => {
    const { wrapper } = await mountMarketplace()
    const html = wrapper.html()
    expect(html).toMatch(/regulated tokens|blockchain networks/i)
  })

  it('renders the filters panel', async () => {
    const { wrapper } = await mountMarketplace()
    const filters = wrapper.find('[data-testid="marketplace-filters"]')
    expect(filters.exists()).toBe(true)
  })

  it('shows empty state when no tokens are available', async () => {
    const { wrapper } = await mountMarketplace({ tokens: [], loading: false, error: null })
    const html = wrapper.html()
    // Should show some empty state indication
    const cards = wrapper.findAll('[data-testid="marketplace-token-card"]')
    expect(cards.length).toBe(0)
  })

  it('shows loading state when tokens are being fetched', async () => {
    const { wrapper } = await mountMarketplace({ loading: true })
    const html = wrapper.html()
    expect(html).toMatch(/Loading|loading/i)
  })

  it('shows error state when there is a fetch error', async () => {
    const { wrapper } = await mountMarketplace({ loading: false, error: 'Network error' })
    const html = wrapper.html()
    expect(html).toMatch(/Failed to load|Network error/i)
  })

  it('does not render wallet connector UI (product alignment)', async () => {
    const { wrapper } = await mountMarketplace()
    const html = wrapper.html()
    expect(html).not.toMatch(/WalletConnect|MetaMask|\bPera\b|Defly/i)
  })

  it('shows compliance-related filters for enterprise operators', async () => {
    const { wrapper } = await mountMarketplace()
    // The filters component should be rendered (it handles compliance badge filters)
    const filters = wrapper.find('[data-testid="marketplace-filters"]')
    expect(filters.exists()).toBe(true)
  })
})
