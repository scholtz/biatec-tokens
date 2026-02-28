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
})
