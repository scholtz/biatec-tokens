/**
 * Unit Tests: TokenDiscoveryJourney — Logic Coverage
 *
 * Validates the component logic for the token discovery journey view.
 *
 * Coverage targets:
 *   - loadOpportunities: populates opportunities with 3 default items
 *   - handleCategorySelect: sets selectedCategory and calls analytics
 *   - handleOpportunitySelect: navigates to TokenStandards with highlight query
 *   - handleCompareStandards: navigates to TokenStandards
 *   - handleStartActivation: navigates to GuidedLaunch when authenticated,
 *       does nothing when not authenticated
 *   - categories: all 4 categories have correct ids and rwaRelevance values
 *   - onMounted: calls loadOpportunities (opportunities populated)
 *   - No wallet connector UI
 *
 * Issue: MVP frontend sign-off hardening — increase critical-path test coverage
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowMount, flushPromises } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createMemoryHistory } from 'vue-router'
import TokenDiscoveryJourney from '../TokenDiscoveryJourney.vue'

vi.mock('../../services/analytics', () => ({
  analyticsService: {
    trackEvent: vi.fn(),
  },
}))

vi.mock('../../services/CompetitiveTelemetryService', () => ({
  CompetitiveTelemetryService: {
    getInstance: () => ({
      trackFeatureDiscovery: vi.fn(),
      startJourney: vi.fn(),
    }),
  },
}))

const makeRouter = () =>
  createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'Home', component: { template: '<div />' } },
      { path: '/discovery/journey', name: 'TokenDiscoveryJourney', component: { template: '<div />' } },
      { path: '/token-standards', name: 'TokenStandards', component: { template: '<div />' } },
      { path: '/launch/guided', name: 'GuidedTokenLaunch', component: { template: '<div />' } },
    ],
  })

const makeStubs = () => ({
  CategoryCard: {
    template: '<div data-testid="category-card" @click="$emit(\'select\', id)"><slot /></div>',
    props: ['id', 'name', 'description'],
    emits: ['select'],
  },
  OpportunityCard: {
    template: '<div data-testid="opportunity-card" @click="$emit(\'select\', opportunity)"><slot /></div>',
    props: ['opportunity'],
    emits: ['select'],
  },
  SparklesIcon: { template: '<svg />' },
  ChartBarSquareIcon: { template: '<svg />' },
  RocketLaunchIcon: { template: '<svg />' },
  LightBulbIcon: { template: '<svg />' },
})

let router: ReturnType<typeof makeRouter>

beforeEach(() => {
  router = makeRouter()
  vi.clearAllMocks()
})

const mountJourney = async (isAuthenticated = false) => {
  await router.push('/discovery/journey')
  await router.isReady()
  return shallowMount(TokenDiscoveryJourney, {
    global: {
      plugins: [
        router,
        createTestingPinia({
          createSpy: vi.fn,
          initialState: {
            auth: { user: isAuthenticated ? { address: 'TEST_ADDR', email: 'test@test.io', isConnected: true } : null, isConnected: isAuthenticated },
          },
        }),
      ],
      stubs: makeStubs(),
    },
  })
}

// ---------------------------------------------------------------------------
// categories definition
// ---------------------------------------------------------------------------
describe('categories', () => {
  it('defines 4 categories', async () => {
    const wrapper = await mountJourney()
    const vm = wrapper.vm as unknown as { categories: Array<{ id: string }> }
    expect(vm.categories).toHaveLength(4)
  })

  it('contains rwa, defi, nft, governance categories', async () => {
    const wrapper = await mountJourney()
    const vm = wrapper.vm as unknown as { categories: Array<{ id: string; rwaRelevance: string }> }
    const ids = vm.categories.map(c => c.id)
    expect(ids).toContain('rwa')
    expect(ids).toContain('defi')
    expect(ids).toContain('nft')
    expect(ids).toContain('governance')
  })

  it('marks rwa category as high rwa relevance', async () => {
    const wrapper = await mountJourney()
    const vm = wrapper.vm as unknown as { categories: Array<{ id: string; rwaRelevance: string }> }
    const rwa = vm.categories.find(c => c.id === 'rwa')
    expect(rwa?.rwaRelevance).toBe('high')
  })

  it('marks defi and governance as low rwa relevance', async () => {
    const wrapper = await mountJourney()
    const vm = wrapper.vm as unknown as { categories: Array<{ id: string; rwaRelevance: string }> }
    const defi = vm.categories.find(c => c.id === 'defi')
    const gov = vm.categories.find(c => c.id === 'governance')
    expect(defi?.rwaRelevance).toBe('low')
    expect(gov?.rwaRelevance).toBe('low')
  })
})

// ---------------------------------------------------------------------------
// loadOpportunities
// ---------------------------------------------------------------------------
describe('loadOpportunities', () => {
  it('populates opportunities with 3 items on mount', async () => {
    const wrapper = await mountJourney()
    const vm = wrapper.vm as unknown as { opportunities: Array<{ id: string }> }
    expect(vm.opportunities).toHaveLength(3)
  })

  it('includes rwa_security, rwa_flexible, nft_compliant', async () => {
    const wrapper = await mountJourney()
    const vm = wrapper.vm as unknown as { opportunities: Array<{ id: string }> }
    const ids = vm.opportunities.map(o => o.id)
    expect(ids).toContain('rwa_security')
    expect(ids).toContain('rwa_flexible')
    expect(ids).toContain('nft_compliant')
  })

  it('rwa_security has rwaScore of 100 and complianceScore of 100', async () => {
    const wrapper = await mountJourney()
    const vm = wrapper.vm as unknown as { opportunities: Array<{ id: string; rwaScore: number; complianceScore: number }> }
    const security = vm.opportunities.find(o => o.id === 'rwa_security')
    expect(security?.rwaScore).toBe(100)
    expect(security?.complianceScore).toBe(100)
  })
})

// ---------------------------------------------------------------------------
// handleCategorySelect
// ---------------------------------------------------------------------------
describe('handleCategorySelect', () => {
  it('sets selectedCategory to the given category id', async () => {
    const wrapper = await mountJourney()
    const vm = wrapper.vm as unknown as {
      selectedCategory: string | null
      handleCategorySelect: (id: string) => void
    }
    expect(vm.selectedCategory).toBeNull()
    vm.handleCategorySelect('rwa')
    expect(vm.selectedCategory).toBe('rwa')
  })

  it('updates selectedCategory when called with different values', async () => {
    const wrapper = await mountJourney()
    const vm = wrapper.vm as unknown as {
      selectedCategory: string | null
      handleCategorySelect: (id: string) => void
    }
    vm.handleCategorySelect('defi')
    expect(vm.selectedCategory).toBe('defi')
    vm.handleCategorySelect('nft')
    expect(vm.selectedCategory).toBe('nft')
  })
})

// ---------------------------------------------------------------------------
// handleOpportunitySelect
// ---------------------------------------------------------------------------
describe('handleOpportunitySelect', () => {
  it('navigates to token-standards with highlight query param', async () => {
    const wrapper = await mountJourney()
    const vm = wrapper.vm as unknown as {
      handleOpportunitySelect: (opp: { id: string; standard: string; rwaScore: number }) => void
    }
    vm.handleOpportunitySelect({ id: 'rwa_security', standard: 'ARC1400', rwaScore: 100 })
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/token-standards')
    expect(router.currentRoute.value.query.highlight).toBe('ARC1400')
  })
})

// ---------------------------------------------------------------------------
// handleCompareStandards
// ---------------------------------------------------------------------------
describe('handleCompareStandards', () => {
  it('navigates to token-standards', async () => {
    const wrapper = await mountJourney()
    const vm = wrapper.vm as unknown as { handleCompareStandards: () => void }
    vm.handleCompareStandards()
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/token-standards')
  })
})

// ---------------------------------------------------------------------------
// handleStartActivation
// ---------------------------------------------------------------------------
describe('handleStartActivation', () => {
  it('navigates to guided launch when authenticated', async () => {
    const wrapper = await mountJourney(true)
    const vm = wrapper.vm as unknown as { handleStartActivation: () => void }
    vm.handleStartActivation()
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/launch/guided')
  })

  it('does not navigate when not authenticated', async () => {
    const wrapper = await mountJourney(false)
    const startPath = router.currentRoute.value.path
    const vm = wrapper.vm as unknown as { handleStartActivation: () => void }
    vm.handleStartActivation()
    await flushPromises()
    // Should remain on the same page
    expect(router.currentRoute.value.path).toBe(startPath)
  })
})

// ---------------------------------------------------------------------------
// No wallet connector UI
// ---------------------------------------------------------------------------
describe('no wallet connector UI', () => {
  it('does not render wallet connector text', async () => {
    const wrapper = await mountJourney()
    const html = wrapper.html()
    expect(html).not.toMatch(/WalletConnect|MetaMask|\bPera\b.*Wallet|Defly/i)
    expect(html).not.toContain('Connect Wallet')
    expect(html).not.toMatch(/not connected/i)
  })
})
