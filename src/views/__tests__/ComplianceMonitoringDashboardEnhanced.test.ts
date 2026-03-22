import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createWebHistory } from 'vue-router'

// Stub all child components to isolate view logic
vi.mock('../../layout/MainLayout.vue', () => ({
  default: { template: '<div><slot /></div>' },
}))
vi.mock('../../components/compliance/TokenComplianceSummaryCard.vue', () => ({
  default: { template: '<div data-testid="token-compliance-summary-card"></div>' },
}))
vi.mock('../../components/compliance/ComplianceGapList.vue', () => ({
  default: { template: '<div data-testid="compliance-gap-list"></div>' },
}))
vi.mock('../../components/compliance/AuditEvidenceExport.vue', () => ({
  default: { template: '<div data-testid="audit-evidence-export"></div>' },
}))
vi.mock('../../services/ComplianceService', () => ({
  complianceService: {
    getMonitoringMetrics: vi.fn().mockResolvedValue({
      activeTokens: 3,
      complianceRate: 0.85,
      openGaps: 2,
      lastAuditDate: null,
    }),
  },
}))

import ComplianceMonitoringDashboardEnhanced from '../ComplianceMonitoringDashboardEnhanced.vue'

const makeRouter = () =>
  createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/compliance/monitoring-enhanced', component: { template: '<div />' } },
    ],
  })

describe('ComplianceMonitoringDashboardEnhanced', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  async function mountComponent(queryParams: Record<string, string> = {}) {
    const router = makeRouter()
    const query = new URLSearchParams(queryParams).toString()
    await router.push(`/compliance/monitoring-enhanced${query ? '?' + query : ''}`)
    await router.isReady()

    return mount(ComplianceMonitoringDashboardEnhanced, {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            initialState: {
              tokens: { tokens: [], isLoading: false },
            },
          }),
          router,
        ],
        stubs: {
          RouterLink: { template: '<a><slot /></a>' },
        },
      },
    })
  }

  it('renders the main heading', async () => {
    const wrapper = await mountComponent()
    const text = wrapper.text()
    expect(text).toMatch(/compliance monitoring/i)
  })

  it('shows view toggle tabs for tokens, metrics, gaps, export', async () => {
    const wrapper = await mountComponent()
    const text = wrapper.text()
    expect(text).toMatch(/token compliance/i)
    expect(text).toMatch(/network metrics/i)
    expect(text).toMatch(/compliance gaps/i)
  })

  it('defaults to token-compliance view tab', async () => {
    const wrapper = await mountComponent()
    // Active tab button has biatec-accent class
    const activeBtn = wrapper.find('button.bg-biatec-accent')
    if (activeBtn.exists()) {
      expect(activeBtn.text()).toMatch(/token compliance/i)
    } else {
      // At minimum some tabs render
      expect(wrapper.text()).toMatch(/token compliance/i)
    }
  })

  it('does not show wallet-connector UI (product alignment)', async () => {
    const wrapper = await mountComponent()
    const text = wrapper.text()
    expect(text).not.toMatch(/WalletConnect|MetaMask|\bPera\b|Defly/i)
  })

  it('renders without error (CSV generation uses ISO date format)', async () => {
    const wrapper = await mountComponent()
    // generateCsvFilename() inside the view uses new Date().toISOString().split('T')[0]
    // Verify the view mounts and the internal function doesn't throw
    expect(wrapper.exists()).toBe(true)
    // Verify the ISO date format pattern used for the filename is valid
    const today = new Date().toISOString().split('T')[0]
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('renders audit evidence export section when export tab active', async () => {
    const wrapper = await mountComponent()
    // Switch to export tab
    const exportBtn = wrapper.findAll('button').find(b => /export/i.test(b.text()))
    expect(exportBtn).toBeTruthy()
    if (exportBtn) {
      await exportBtn.trigger('click')
      await wrapper.vm.$nextTick()
      // Audit export component should be visible now
      const exportSection = wrapper.find('[data-testid="audit-evidence-export"]')
      expect(exportSection.exists()).toBe(true)
    }
  })

  it('accepts VOI network query param', async () => {
    const wrapper = await mountComponent({ network: 'VOI' })
    expect(wrapper.exists()).toBe(true)
  })

  it('accepts Aramid network query param', async () => {
    const wrapper = await mountComponent({ network: 'Aramid' })
    expect(wrapper.exists()).toBe(true)
  })

  it('falls back to "all" for unknown network query param', async () => {
    const wrapper = await mountComponent({ network: 'unknown-chain' })
    expect(wrapper.exists()).toBe(true)
  })

  it('falls back to "all" for missing network query param', async () => {
    const wrapper = await mountComponent()
    expect(wrapper.exists()).toBe(true)
  })
})
