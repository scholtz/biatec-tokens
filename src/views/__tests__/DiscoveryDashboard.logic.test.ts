/**
 * Logic Tests: DiscoveryDashboard
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createWebHistory } from 'vue-router'
import { useDiscoveryStore } from '../../stores/discovery'
import { useOnboardingStore } from '../../stores/onboarding'
import { useMarketplaceStore } from '../../stores/marketplace'

vi.mock('../../services/TelemetryService', () => ({
  telemetryService: {
    trackDiscoveryDashboardViewed: vi.fn(),
    trackDiscoveryFilterApplied: vi.fn(),
    trackDiscoveryFilterSaved: vi.fn(),
    trackDiscoveryFilterCleared: vi.fn(),
    trackTokenView: vi.fn(),
    trackWatchlistAdd: vi.fn(),
    trackWatchlistRemove: vi.fn(),
    trackOnboardingStepComplete: vi.fn(),
  },
}))

import DiscoveryDashboard from '../DiscoveryDashboard.vue'

const makeRouter = () =>
  createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', name: 'Home', component: { template: '<div />' } },
      { path: '/discovery', name: 'DiscoveryDashboard', component: { template: '<div />' } },
    ],
  })

const sampleToken = {
  id: 'tok-001',
  name: 'Test Token',
  symbol: 'TST',
  standard: 'ARC20',
  chain: 'VOI',
  complianceStatus: 'compliant',
  price: '1.00',
  marketCap: '1000000',
  volume24h: '50000',
  change24h: 2.5,
  issuer: 'Test Corp',
  issuerType: 'corporate',
}

const mountView = (tokens: any[] = []) => {
  const router = makeRouter()
  return mount(DiscoveryDashboard, {
    global: {
      plugins: [
        router,
        createTestingPinia({
          createSpy: vi.fn,
          stubActions: false,
          initialState: {
            discovery: {
              filters: { standards: [], complianceStatus: [], chains: [], issuerTypes: [] },
              tokens,
              filteredTokens: tokens,
              savedFilters: null,
              loading: false,
              error: null,
              activeFilterCount: 0,
              hasActiveFilters: false,
            },
            onboarding: { steps: [], initialized: false },
            marketplace: { tokens: [], loading: false, error: null },
          },
        }),
      ],
      stubs: {
        MainLayout: { template: '<div><slot /><slot name="default" /></div>' },
        DiscoveryFilterPanel: true,
        DiscoveryTokenCard: true,
        TokenDetailDrawer: true,
        OnboardingChecklist: true,
      },
    },
  })
}

describe('DiscoveryDashboard — logic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('mounts successfully', () => {
    const wrapper = mountView()
    expect(wrapper.exists()).toBe(true)
  })

  it('handleFilterUpdate calls discoveryStore.updateFilters and resets currentPage to 1', async () => {
    const wrapper = mountView()
    const store = useDiscoveryStore()
    const vm = wrapper.vm as any
    vm.currentPage = 3
    const filters = { standards: ['ARC20'], complianceStatus: [], chains: [], issuerTypes: [] }
    vm.handleFilterUpdate(filters)
    await nextTick()
    expect(store.updateFilters).toHaveBeenCalledWith(filters)
    expect(vm.currentPage).toBe(1)
  })

  it('handleSaveFilters calls discoveryStore.saveFilters and onboardingStore.markStepComplete', async () => {
    const wrapper = mountView()
    const discoveryStore = useDiscoveryStore()
    const onboardingStore = useOnboardingStore()
    const vm = wrapper.vm as any
    vm.handleSaveFilters()
    await nextTick()
    expect(discoveryStore.saveFilters).toHaveBeenCalled()
    expect(onboardingStore.markStepComplete).toHaveBeenCalledWith('save-filters')
  })

  it('handleLoadFilters calls discoveryStore.loadSavedFilters and resets page', async () => {
    const wrapper = mountView()
    const store = useDiscoveryStore()
    const vm = wrapper.vm as any
    vm.currentPage = 5
    vm.handleLoadFilters()
    await nextTick()
    expect(store.loadSavedFilters).toHaveBeenCalled()
    expect(vm.currentPage).toBe(1)
  })

  it('handleResetFilters calls discoveryStore.resetFilters and resets page', async () => {
    const wrapper = mountView()
    const store = useDiscoveryStore()
    const vm = wrapper.vm as any
    vm.currentPage = 4
    vm.handleResetFilters()
    await nextTick()
    expect(store.resetFilters).toHaveBeenCalled()
    expect(vm.currentPage).toBe(1)
  })

  it('handleTokenSelect sets selectedToken and showDetailDrawer', async () => {
    const wrapper = mountView()
    const vm = wrapper.vm as any
    expect(vm.showDetailDrawer).toBe(false)
    vm.handleTokenSelect(sampleToken as any)
    await nextTick()
    expect(vm.selectedToken).toEqual(sampleToken)
    expect(vm.showDetailDrawer).toBe(true)
  })

  it('closeDetailDrawer resets showDetailDrawer and selectedToken to null', async () => {
    const wrapper = mountView()
    const vm = wrapper.vm as any
    vm.selectedToken = sampleToken as any
    vm.showDetailDrawer = true
    await nextTick()
    vm.closeDetailDrawer()
    await nextTick()
    expect(vm.showDetailDrawer).toBe(false)
    expect(vm.selectedToken).toBeNull()
  })

  it('handleWatchlistToggle adds then removes token from watchlist', async () => {
    const wrapper = mountView()
    const vm = wrapper.vm as any
    expect(vm.isInWatchlist(sampleToken.id)).toBe(false)
    vm.handleWatchlistToggle(sampleToken as any)
    await nextTick()
    expect(vm.isInWatchlist(sampleToken.id)).toBe(true)
    vm.handleWatchlistToggle(sampleToken as any)
    await nextTick()
    expect(vm.isInWatchlist(sampleToken.id)).toBe(false)
  })

  it('nextPage increments currentPage', async () => {
    const tokens = Array.from({ length: 25 }, (_, i) => ({ ...sampleToken, id: `tok-${i}` }))
    const wrapper = mountView(tokens)
    const vm = wrapper.vm as any
    expect(vm.currentPage).toBe(1)
    vm.nextPage()
    await nextTick()
    expect(vm.currentPage).toBe(2)
  })

  it('nextPage does not exceed totalPages boundary', async () => {
    const tokens = Array.from({ length: 10 }, (_, i) => ({ ...sampleToken, id: `tok-${i}` }))
    const wrapper = mountView(tokens)
    const vm = wrapper.vm as any
    vm.currentPage = vm.totalPages // already at last page
    vm.nextPage()
    await nextTick()
    expect(vm.currentPage).toBe(vm.totalPages)
  })

  it('previousPage decrements currentPage', async () => {
    const tokens = Array.from({ length: 25 }, (_, i) => ({ ...sampleToken, id: `tok-${i}` }))
    const wrapper = mountView(tokens)
    const vm = wrapper.vm as any
    vm.currentPage = 2
    vm.previousPage()
    await nextTick()
    expect(vm.currentPage).toBe(1)
  })

  it('previousPage does not go below page 1', async () => {
    const wrapper = mountView()
    const vm = wrapper.vm as any
    vm.currentPage = 1
    vm.previousPage()
    await nextTick()
    expect(vm.currentPage).toBe(1)
  })

  it('loadTokens calls marketplaceStore.loadTokens', async () => {
    const wrapper = mountView()
    const marketplaceStore = useMarketplaceStore()
    const vm = wrapper.vm as any
    await vm.loadTokens()
    expect(marketplaceStore.loadTokens).toHaveBeenCalled()
  })

  it('loadTokens sets discoveryStore error on failure', async () => {
    const wrapper = mountView()
    const marketplaceStore = useMarketplaceStore()
    const discoveryStore = useDiscoveryStore()
    vi.mocked(marketplaceStore.loadTokens).mockRejectedValueOnce(new Error('Network error'))
    const vm = wrapper.vm as any
    await vm.loadTokens()
    expect(discoveryStore.setError).toHaveBeenCalledWith('Network error')
  })
})
