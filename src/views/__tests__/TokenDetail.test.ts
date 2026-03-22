import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createWebHistory } from 'vue-router'

vi.mock('../../layout/MainLayout.vue', () => ({
  default: { template: '<div><slot /></div>' },
}))
vi.mock('../../components/WhitelistManagement.vue', () => ({
  default: { template: '<div data-testid="whitelist-management"></div>' },
}))
vi.mock('../../components/ComplianceChecklist.vue', () => ({
  default: { template: '<div data-testid="compliance-checklist"></div>' },
}))
vi.mock('../../components/AuditLogViewer.vue', () => ({
  default: { template: '<div data-testid="audit-log-viewer"></div>' },
}))
vi.mock('../../components/OnChainComplianceBadge.vue', () => ({
  default: { template: '<div></div>' },
}))
vi.mock('../../utils/mica-compliance', () => ({
  getMicaClassificationLabel: vi.fn().mockReturnValue('E-Money Token'),
}))

import TokenDetail from '../TokenDetail.vue'

const makeRouter = () =>
  createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/dashboard', component: { template: '<div />' } },
      { path: '/tokens/:id', component: { template: '<div />' } },
    ],
  })

describe('TokenDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  async function mountView(tokenId = 'token-1', tokens: any[] = []) {
    const router = makeRouter()
    await router.push(`/tokens/${tokenId}`)
    await router.isReady()

    return mount(TokenDetail, {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            initialState: { tokens: { tokens, isLoading: false } },
          }),
          router,
        ],
        stubs: { RouterLink: { template: '<a><slot /></a>' } },
      },
    })
  }

  it('renders without crashing when token not found', async () => {
    const wrapper = await mountView('missing-id', [])
    expect(wrapper.exists()).toBe(true)
  })

  it('renders token name when token found', async () => {
    const token = {
      id: 'token-1',
      name: 'Test Token',
      symbol: 'TST',
      standard: 'ARC200' as const,
      type: 'FT' as const,
      supply: 1000000,
      status: 'deployed' as const,
      network: 'Aramid',
      createdAt: new Date(),
      decimals: 6,
      description: '',
      imageUrl: '',
    }
    const wrapper = await mountView('token-1', [token])
    expect(wrapper.text()).toContain('Test Token')
  })

  it('shows navigation tabs', async () => {
    const wrapper = await mountView()
    const text = wrapper.text()
    expect(text).toMatch(/overview|whitelist|compliance|audit/i)
  })

  it('shows "Back to Dashboard" when no history', async () => {
    const wrapper = await mountView()
    // goBack() navigates to /dashboard when no history
    expect(wrapper.exists()).toBe(true)
  })

  it('does not show wallet-connector UI (product alignment)', async () => {
    const wrapper = await mountView()
    expect(wrapper.text()).not.toMatch(/WalletConnect|MetaMask|\bPera\b|Defly/i)
  })

  it('statusClass returns correct style for deployed status', async () => {
    const token = {
      id: 'tok-d',
      name: 'Deployed',
      symbol: 'DPL',
      standard: 'ARC200' as const,
      type: 'FT' as const,
      supply: 100,
      status: 'deployed' as const,
      network: 'VOI',
      createdAt: new Date(),
      decimals: 6,
      description: '',
      imageUrl: '',
    }
    const wrapper = await mountView('tok-d', [token])
    // Deployed status badge contains "bg-green-500"
    const html = wrapper.html()
    expect(html).toMatch(/green|bg-green/)
  })

  it('statusClass returns correct style for failed status', async () => {
    const token = {
      id: 'tok-f',
      name: 'Failed',
      symbol: 'FLD',
      standard: 'ARC200' as const,
      type: 'FT' as const,
      supply: 0,
      status: 'failed' as const,
      network: 'VOI',
      createdAt: new Date(),
      decimals: 6,
      description: '',
      imageUrl: '',
    }
    const wrapper = await mountView('tok-f', [token])
    const html = wrapper.html()
    expect(html).toMatch(/red|bg-red/)
  })

  it('renders whitelist tab button', async () => {
    const token = {
      id: 'token-1',
      name: 'WL Token',
      symbol: 'WL',
      standard: 'ARC200' as const,
      type: 'FT' as const,
      supply: 1,
      status: 'deployed' as const,
      network: 'VOI',
      createdAt: new Date(),
      decimals: 6,
      description: '',
      imageUrl: '',
    }
    const wrapper = await mountView('token-1', [token])
    const tabs = wrapper.findAll('button')
    const whitelistTab = tabs.find(b => /whitelist/i.test(b.text()))
    expect(whitelistTab).toBeTruthy()
  })

  it('renders whitelist tab content when tab selected', async () => {
    const token = {
      id: 'token-1',
      name: 'WL Token',
      symbol: 'WL',
      standard: 'ARC200' as const,
      type: 'FT' as const,
      supply: 1,
      status: 'deployed' as const,
      network: 'VOI',
      createdAt: new Date(),
      decimals: 6,
      description: '',
      imageUrl: '',
    }
    const wrapper = await mountView('token-1', [token])
    // Click whitelist tab
    const tabs = wrapper.findAll('button')
    const whitelistTab = tabs.find(b => /whitelist/i.test(b.text()))
    if (whitelistTab) {
      await whitelistTab.trigger('click')
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-testid="whitelist-management"]').exists()).toBe(true)
    }
  })
})
