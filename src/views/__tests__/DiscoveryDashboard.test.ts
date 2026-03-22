/**
 * Unit Tests: DiscoveryDashboard
 *
 * Validates rendering and key computed logic for the Token Discovery view.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createWebHistory } from 'vue-router'
import DiscoveryDashboard from '../DiscoveryDashboard.vue'

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

const mountView = (tokens: typeof sampleToken[] = []) => {
  const router = makeRouter()
  return mount(DiscoveryDashboard, {
    global: {
      plugins: [
        createTestingPinia({
          createSpy: vi.fn,
          initialState: {
            discovery: {
              filters: { standards: [], complianceStatus: [], chains: [], issuerTypes: [] },
              tokens: tokens,
              savedFilters: null,
            },
            onboarding: { completedSteps: [] },
            marketplace: { tokens: [], filters: {} },
          },
        }),
        router,
      ],
      stubs: {
        MainLayout: { template: '<div><slot /></div>' },
        DiscoveryFilterPanel: { template: '<div data-testid="discovery-filter-panel" />' },
        DiscoveryTokenCard: { template: '<div class="token-card" />' },
        TokenDetailDrawer: { template: '<div data-testid="token-detail-drawer" />' },
        OnboardingChecklist: { template: '<div data-testid="onboarding-checklist" />' },
      },
    },
  })
}

describe('DiscoveryDashboard', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  // ── Heading structure ────────────────────────────────────────────────────

  it('renders "Token Discovery" as main heading', () => {
    const wrapper = mountView()
    const h1 = wrapper.find('h1')
    expect(h1.exists()).toBe(true)
    expect(h1.text()).toContain('Token Discovery')
  })

  it('renders a single h1', () => {
    const wrapper = mountView()
    expect(wrapper.findAll('h1').length).toBe(1)
  })

  // ── Filter panel ──────────────────────────────────────────────────────────

  it('renders the discovery filter panel stub', () => {
    const wrapper = mountView()
    expect(wrapper.find('[data-testid="discovery-filter-panel"]').exists()).toBe(true)
  })

  // ── Token count display ───────────────────────────────────────────────────

  it('shows "0 tokens found" when no tokens exist', () => {
    const wrapper = mountView([])
    expect(wrapper.text()).toContain('0')
    expect(wrapper.text()).toContain('found')
  })

  it('shows correct count when tokens exist', () => {
    const wrapper = mountView([sampleToken as any])
    expect(wrapper.text()).toContain('1')
  })

  // ── Sort selector ─────────────────────────────────────────────────────────

  it('renders the sort-by select dropdown', () => {
    const wrapper = mountView()
    const select = wrapper.find('select#sort-by')
    expect(select.exists()).toBe(true)
  })

  it('starts with "relevance" sort option', () => {
    const wrapper = mountView()
    const vm = wrapper.vm as any
    expect(vm.sortBy).toBe('relevance')
  })

  // ── Pagination logic ──────────────────────────────────────────────────────

  it('starts on page 1', () => {
    const wrapper = mountView()
    const vm = wrapper.vm as any
    expect(vm.currentPage).toBe(1)
  })

  it('calculates totalPages correctly', () => {
    const tokens = Array.from({ length: 25 }, (_, i) => ({ ...sampleToken, id: `tok-${i}` }))
    const wrapper = mountView(tokens as any)
    const vm = wrapper.vm as any
    expect(vm.totalPages).toBe(3) // 25 / 12 = 3 pages
  })

  it('displayedTokens returns at most itemsPerPage items', () => {
    const tokens = Array.from({ length: 20 }, (_, i) => ({ ...sampleToken, id: `tok-${i}` }))
    const wrapper = mountView(tokens as any)
    const vm = wrapper.vm as any
    expect(vm.displayedTokens.length).toBeLessThanOrEqual(12)
  })

  // ── Watchlist ─────────────────────────────────────────────────────────────

  it('isInWatchlist returns false for unknown token', () => {
    const wrapper = mountView()
    const vm = wrapper.vm as any
    expect(vm.isInWatchlist('unknown-token')).toBe(false)
  })

  // ── Product alignment ─────────────────────────────────────────────────────

  it('does not contain wallet connector UI', () => {
    const wrapper = mountView()
    expect(wrapper.html()).not.toMatch(/WalletConnect|MetaMask|\bPera\b|Defly/i)
  })
})
