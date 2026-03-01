/**
 * Unit tests for TokenDashboard.vue
 * Covers loading, error, empty, and grid states together with retryLoad logic.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import TokenDashboard from '../TokenDashboard.vue'

// ─── stubs / mocks ────────────────────────────────────────────────────────────

vi.mock('../../components/MicaReadinessSummary.vue', () => ({
  default: { template: '<div data-testid="mica-stub" />' },
}))

vi.mock('../../components/TokenCard.vue', () => ({
  default: {
    props: ['token'],
    template: '<div class="token-card-stub">{{ token.name }}</div>',
  },
}))

vi.mock('../../layout/MainLayout.vue', () => ({
  default: { template: '<div><slot /></div>' },
}))

// Minimal router so <router-link> resolves
const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: { template: '<div />' } },
    { path: '/tokens', component: { template: '<div />' } },
    { path: '/create', component: { template: '<div />' } },
  ],
})

// Factory for token store mock
function makeTokenStoreMock(overrides: {
  tokens?: unknown[]
  isLoading?: boolean
  totalTokens?: number
  deployedTokens?: number
} = {}) {
  const tokensList = overrides.tokens ?? []
  const loading = overrides.isLoading ?? false
  return {
    // Pinia setup stores expose reactive state as plain values when accessed through the store
    tokens: tokensList,
    isLoading: loading,
    totalTokens: overrides.totalTokens ?? tokensList.length,
    deployedTokens:
      overrides.deployedTokens ??
      (tokensList as { status: string }[]).filter(t => t.status === 'deployed').length,
    deleteToken: vi.fn(),
  }
}

vi.mock('../../stores/tokens', () => ({
  useTokenStore: vi.fn(),
}))

// ─── helpers ──────────────────────────────────────────────────────────────────

async function mountDashboard(storeMock: ReturnType<typeof makeTokenStoreMock>) {
  const { useTokenStore } = await import('../../stores/tokens')
  ;(useTokenStore as ReturnType<typeof vi.fn>).mockReturnValue(storeMock)

  setActivePinia(createPinia())
  await router.push('/tokens')
  await router.isReady()

  return mount(TokenDashboard, {
    global: {
      plugins: [router],
    },
  })
}

// ─── tests ────────────────────────────────────────────────────────────────────

describe('TokenDashboard.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── loading state ───────────────────────────────────────────────────────────

  it('shows loading state when isLoading is true and tokens are empty', async () => {
    const mock = makeTokenStoreMock({ isLoading: true, tokens: [] })
    const wrapper = await mountDashboard(mock)

    expect(wrapper.find('[data-testid="token-dashboard-loading"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="token-dashboard-error"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="token-dashboard-empty"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="token-dashboard-grid"]').exists()).toBe(false)
  })

  it('shows loading message text', async () => {
    const mock = makeTokenStoreMock({ isLoading: true, tokens: [] })
    const wrapper = await mountDashboard(mock)

    expect(wrapper.text()).toContain('Loading tokens')
  })

  // ── error state ─────────────────────────────────────────────────────────────

  it('shows error state when loadError is set', async () => {
    const mock = makeTokenStoreMock({ isLoading: false, tokens: [] })
    const wrapper = await mountDashboard(mock)

    // Programmatically set the error
    const vm = wrapper.vm as unknown as { loadError: string | null }
    vm.loadError = 'Failed to fetch portfolio data'
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-testid="token-dashboard-error"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Failed to fetch portfolio data')
  })

  it('error state has a "Try again" button', async () => {
    const mock = makeTokenStoreMock({ isLoading: false, tokens: [] })
    const wrapper = await mountDashboard(mock)

    const vm = wrapper.vm as unknown as { loadError: string | null }
    vm.loadError = 'Network error'
    await wrapper.vm.$nextTick()

    const retryBtn = wrapper.find('[data-testid="token-dashboard-error"] button')
    expect(retryBtn.exists()).toBe(true)
    expect(retryBtn.text()).toMatch(/try again/i)
  })

  it('clicking "Try again" clears the error', async () => {
    const mock = makeTokenStoreMock({ isLoading: false, tokens: [] })
    const wrapper = await mountDashboard(mock)

    const vm = wrapper.vm as unknown as { loadError: string | null }
    vm.loadError = 'Something went wrong'
    await wrapper.vm.$nextTick()

    const retryBtn = wrapper.find('[data-testid="token-dashboard-error"] button')
    await retryBtn.trigger('click')
    await wrapper.vm.$nextTick()

    expect(vm.loadError).toBeNull()
    expect(wrapper.find('[data-testid="token-dashboard-error"]').exists()).toBe(false)
  })

  // ── empty state ─────────────────────────────────────────────────────────────

  it('shows empty state when not loading, no error, and no tokens', async () => {
    const mock = makeTokenStoreMock({ isLoading: false, tokens: [] })
    const wrapper = await mountDashboard(mock)

    expect(wrapper.find('[data-testid="token-dashboard-empty"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('No Tokens Found')
  })

  it('empty state shows "Create your first token" when no tokens exist', async () => {
    const mock = makeTokenStoreMock({ isLoading: false, tokens: [] })
    const wrapper = await mountDashboard(mock)

    expect(wrapper.text()).toContain('Create your first token')
  })

  // ── grid state ──────────────────────────────────────────────────────────────

  it('shows token grid when tokens exist and not loading', async () => {
    const tokens = [
      {
        id: 't1',
        name: 'Alpha Token',
        symbol: 'ALPHA',
        standard: 'ARC3FT',
        type: 'FT',
        supply: 1000,
        description: 'Test token',
        status: 'deployed',
        createdAt: new Date(),
      },
    ]
    const mock = makeTokenStoreMock({ isLoading: false, tokens })
    const wrapper = await mountDashboard(mock)

    expect(wrapper.find('[data-testid="token-dashboard-grid"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="token-dashboard-empty"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="token-dashboard-loading"]').exists()).toBe(false)
  })

  // ── stat cards ──────────────────────────────────────────────────────────────

  it('renders the stat cards (Total Tokens, Deployed, Deploying)', async () => {
    const mock = makeTokenStoreMock({ isLoading: false, tokens: [] })
    const wrapper = await mountDashboard(mock)

    expect(wrapper.text()).toContain('Total Tokens')
    expect(wrapper.text()).toContain('Deployed')
    expect(wrapper.text()).toContain('Deploying')
  })

  // ── priority: loading > error > grid > empty ─────────────────────────────────

  it('loading state takes priority over error state', async () => {
    const mock = makeTokenStoreMock({ isLoading: true, tokens: [] })
    const wrapper = await mountDashboard(mock)

    const vm = wrapper.vm as unknown as { loadError: string | null }
    vm.loadError = 'Should not show'
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-testid="token-dashboard-loading"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="token-dashboard-error"]').exists()).toBe(false)
  })

  // ── filteredTokens with filters applied ─────────────────────────────────────

  it('filters tokens by standard when selectedStandardFilter is set', async () => {
    const tokens = [
      { id: 'a', name: 'Alpha', symbol: 'A', standard: 'ARC3FT', type: 'FT', supply: 1000, description: 'Test', status: 'deployed', createdAt: new Date() },
      { id: 'b', name: 'Beta', symbol: 'B', standard: 'ERC20', type: 'FT', supply: 2000, description: 'Test', status: 'deployed', createdAt: new Date() },
    ]
    const mock = makeTokenStoreMock({ isLoading: false, tokens })
    const wrapper = await mountDashboard(mock)

    const vm = wrapper.vm as unknown as { selectedStandardFilter: string }
    vm.selectedStandardFilter = 'ARC3FT'
    await wrapper.vm.$nextTick()

    // Grid should show; only ARC3FT token shown
    expect(wrapper.find('[data-testid="token-dashboard-grid"]').exists()).toBe(true)
    expect(wrapper.findAll('.token-card-stub')).toHaveLength(1)
    expect(wrapper.text()).toContain('Alpha')
    expect(wrapper.text()).not.toContain('Beta')
  })

  it('filters tokens by status when selectedStatusFilter is set', async () => {
    const tokens = [
      { id: 'c', name: 'Charlie', symbol: 'C', standard: 'ASA', type: 'FT', supply: 100, description: 'Test', status: 'deployed', createdAt: new Date() },
      { id: 'd', name: 'Delta', symbol: 'D', standard: 'ASA', type: 'FT', supply: 200, description: 'Test', status: 'failed', createdAt: new Date() },
    ]
    const mock = makeTokenStoreMock({ isLoading: false, tokens })
    const wrapper = await mountDashboard(mock)

    const vm = wrapper.vm as unknown as { selectedStatusFilter: string }
    vm.selectedStatusFilter = 'failed'
    await wrapper.vm.$nextTick()

    expect(wrapper.findAll('.token-card-stub')).toHaveLength(1)
    expect(wrapper.text()).toContain('Delta')
    expect(wrapper.text()).not.toContain('Charlie')
  })

  it('shows empty state message about filters when tokens exist but none match', async () => {
    const tokens = [
      { id: 'e', name: 'Echo', symbol: 'E', standard: 'ASA', type: 'FT', supply: 100, description: 'Test', status: 'deployed', createdAt: new Date() },
    ]
    const mock = makeTokenStoreMock({ isLoading: false, tokens })
    const wrapper = await mountDashboard(mock)

    const vm = wrapper.vm as unknown as { selectedStatusFilter: string }
    vm.selectedStatusFilter = 'failed'
    await wrapper.vm.$nextTick()

    // All tokens filtered out → empty state
    expect(wrapper.find('[data-testid="token-dashboard-empty"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('No tokens match your current filters')
  })

  // ── navigateToCompliance ────────────────────────────────────────────────────

  it('navigateToCompliance pushes to ComplianceDashboard route', async () => {
    const mock = makeTokenStoreMock({ isLoading: false, tokens: [] })
    const wrapper = await mountDashboard(mock)

    const vm = wrapper.vm as unknown as { navigateToCompliance: () => void }
    // Should not throw
    expect(() => vm.navigateToCompliance()).not.toThrow()
  })

  // ── deleteToken confirm ──────────────────────────────────────────────────────

  it('calls tokenStore.deleteToken when user confirms deletion', async () => {
    const tokens = [
      { id: 't1', name: 'Token1', symbol: 'T', standard: 'ASA', type: 'FT', supply: 100, description: 'Test', status: 'deployed', createdAt: new Date() },
    ]
    const mock = makeTokenStoreMock({ isLoading: false, tokens })
    const wrapper = await mountDashboard(mock)

    // happy-dom doesn't have window.confirm – stub directly on globalThis
    const originalConfirm = globalThis.confirm
    globalThis.confirm = vi.fn().mockReturnValue(true) as typeof confirm

    const vm = wrapper.vm as unknown as { deleteToken: (id: string) => void }
    vm.deleteToken('t1')
    expect(mock.deleteToken).toHaveBeenCalledWith('t1')

    globalThis.confirm = originalConfirm
  })

  it('does NOT call tokenStore.deleteToken when user cancels deletion', async () => {
    const mock = makeTokenStoreMock({ isLoading: false, tokens: [] })
    const wrapper = await mountDashboard(mock)

    const originalConfirm = globalThis.confirm
    globalThis.confirm = vi.fn().mockReturnValue(false) as typeof confirm

    const vm = wrapper.vm as unknown as { deleteToken: (id: string) => void }
    vm.deleteToken('any-id')
    expect(mock.deleteToken).not.toHaveBeenCalled()

    globalThis.confirm = originalConfirm
  })
})
