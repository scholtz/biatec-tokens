import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'

vi.mock('../MicaSummaryWidget.vue', () => ({
  default: {
    name: 'MicaSummaryWidget',
    template: `<div data-testid="kyc-widget"><slot name="content" /></div>`,
    props: ['title', 'subtitle', 'icon', 'iconColor', 'lastUpdated', 'hasDetails'],
    emits: ['view-details'],
  },
}))

const mockGetKycProviderStatus = vi.fn()

vi.mock('../../services/ComplianceService', () => ({
  complianceService: {
    getKycProviderStatus: () => mockGetKycProviderStatus(),
  },
}))

import KycProviderStatusWidget from '../KycProviderStatusWidget.vue'

const makeRouter = () =>
  createRouter({ history: createMemoryHistory(), routes: [{ path: '/', component: { template: '<div/>' } }, { path: '/settings', component: { template: '<div/>' } }] })

const baseMetrics = {
  integrationComplete: 100,
  totalCoverage: 95.5,
  activeProviders: 2,
  totalProviders: 2,
  staleProviders: 0,
  failedProviders: 0,
  lastUpdated: new Date(),
  providers: [
    { id: 'prov1', name: 'Sumsub', status: 'connected', coverage: 90, isStale: false },
    { id: 'prov2', name: 'Jumio', status: 'syncing', coverage: 88, isStale: false },
  ],
}

describe('KycProviderStatusWidget.vue', () => {
  let router: ReturnType<typeof makeRouter>

  beforeEach(() => {
    router = makeRouter()
    vi.clearAllMocks()
  })

  const mountWidget = (metricsData = baseMetrics) => {
    mockGetKycProviderStatus.mockResolvedValue(metricsData)
    return mount(KycProviderStatusWidget, { global: { plugins: [router] } })
  }

  it('renders the widget container', () => {
    const wrapper = mountWidget()
    expect(wrapper.find('[data-testid="kyc-widget"]').exists()).toBe(true)
  })

  it('shows error state when metrics load fails', async () => {
    mockGetKycProviderStatus.mockRejectedValue(new Error('network error'))
    const wrapper = mount(KycProviderStatusWidget, { global: { plugins: [router] } })
    await new Promise(r => setTimeout(r, 50))
    expect(wrapper.text()).toContain('Failed to load metrics')
  })

  it('shows metrics content after successful load', async () => {
    const wrapper = mountWidget()
    await new Promise(r => setTimeout(r, 50))
    expect(wrapper.text()).toContain('95.5%')
  })

  it('shows provider list after load', async () => {
    const wrapper = mountWidget()
    await new Promise(r => setTimeout(r, 50))
    expect(wrapper.text()).toContain('Sumsub')
    expect(wrapper.text()).toContain('Jumio')
  })

  it('getProviderStatusDotColor returns green for connected provider', async () => {
    const wrapper = mountWidget()
    await new Promise(r => setTimeout(r, 50))
    const vm = wrapper.vm as any
    const color = vm.getProviderStatusDotColor({ status: 'connected', isStale: false })
    expect(color).toBe('bg-green-500')
  })

  it('getProviderStatusDotColor returns orange for stale provider', async () => {
    const wrapper = mountWidget()
    await new Promise(r => setTimeout(r, 50))
    const vm = wrapper.vm as any
    const color = vm.getProviderStatusDotColor({ status: 'connected', isStale: true })
    expect(color).toBe('bg-orange-500')
  })

  it('getProviderStatusDotColor returns orange for error provider', async () => {
    const wrapper = mountWidget()
    await new Promise(r => setTimeout(r, 50))
    const vm = wrapper.vm as any
    const color = vm.getProviderStatusDotColor({ status: 'error', isStale: false })
    expect(color).toBe('bg-orange-500')
  })

  it('getProviderStatusDotColor returns blue for syncing provider', async () => {
    const wrapper = mountWidget()
    await new Promise(r => setTimeout(r, 50))
    const vm = wrapper.vm as any
    const color = vm.getProviderStatusDotColor({ status: 'syncing', isStale: false })
    expect(color).toContain('bg-blue-500')
  })

  it('getProviderStatusDotColor returns gray for disconnected provider', async () => {
    const wrapper = mountWidget()
    await new Promise(r => setTimeout(r, 50))
    const vm = wrapper.vm as any
    const color = vm.getProviderStatusDotColor({ status: 'disconnected', isStale: false })
    expect(color).toBe('bg-gray-500')
  })

  it('getProviderStatusDotColor returns gray for unknown status', async () => {
    const wrapper = mountWidget()
    await new Promise(r => setTimeout(r, 50))
    const vm = wrapper.vm as any
    const color = vm.getProviderStatusDotColor({ status: 'unknown', isStale: false })
    expect(color).toBe('bg-gray-500')
  })

  it('getIconColor returns blue when no metrics loaded', () => {
    mockGetKycProviderStatus.mockReturnValue(new Promise(() => {}))
    const wrapper = mount(KycProviderStatusWidget, { global: { plugins: [router] } })
    const vm = wrapper.vm as any
    expect(vm.getIconColor).toBe('blue')
  })

  it('getIconColor returns orange when integration incomplete', async () => {
    const wrapper = mountWidget({ ...baseMetrics, integrationComplete: 80 })
    await new Promise(r => setTimeout(r, 50))
    const vm = wrapper.vm as any
    expect(vm.getIconColor).toBe('orange')
  })

  it('getIconColor returns green when fully integrated and no alerts', async () => {
    const wrapper = mountWidget(baseMetrics)
    await new Promise(r => setTimeout(r, 50))
    const vm = wrapper.vm as any
    expect(vm.getIconColor).toBe('green')
  })

  it('getIconColor returns orange when there are stale providers', async () => {
    const wrapper = mountWidget({ ...baseMetrics, staleProviders: 1 })
    await new Promise(r => setTimeout(r, 50))
    const vm = wrapper.vm as any
    expect(vm.getIconColor).toBe('orange')
  })
})
