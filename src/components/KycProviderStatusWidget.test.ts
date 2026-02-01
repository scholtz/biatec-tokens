import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import KycProviderStatusWidget from './KycProviderStatusWidget.vue'
import { complianceService } from '../services/ComplianceService'
import type { KycProviderMetrics } from '../types/compliance'

vi.mock('../services/ComplianceService', () => ({
  complianceService: {
    getKycProviderStatus: vi.fn()
  }
}))

// Create a mock router
const createMockRouter = () => {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div>Home</div>' } },
      { path: '/settings', component: { template: '<div>Settings</div>' } }
    ]
  })
}

describe('KycProviderStatusWidget Component', () => {
  const now = Date.now()
  const mockMetrics: KycProviderMetrics = {
    providers: [
      {
        id: 'kyc-provider-1',
        name: 'Jumio Verification',
        status: 'connected',
        lastSyncTime: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
        jurisdiction: ['US', 'EU', 'UK', 'CA'],
        coverage: 92,
        checksPerformed: 1247,
        failedChecks: 23,
        isStale: false,
      },
      {
        id: 'kyc-provider-2',
        name: 'Onfido Identity',
        status: 'syncing',
        lastSyncTime: new Date(now - 30 * 60 * 1000).toISOString(),
        jurisdiction: ['EU', 'UK', 'AU', 'NZ'],
        coverage: 78,
        checksPerformed: 856,
        failedChecks: 12,
        isStale: false,
      },
      {
        id: 'kyc-provider-3',
        name: 'Trulioo GlobalGateway',
        status: 'error',
        lastSyncTime: new Date(now - 26 * 60 * 60 * 1000).toISOString(),
        jurisdiction: ['BR', 'MX', 'AR'],
        coverage: 34,
        checksPerformed: 189,
        failedChecks: 45,
        isStale: true,
        errorMessage: 'API rate limit exceeded',
      },
    ],
    totalCoverage: 69.4,
    activeProviders: 2,
    staleProviders: 1,
    failedProviders: 1,
    integrationComplete: 60,
    lastUpdated: new Date().toISOString(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Component Rendering', () => {
    it('should render the widget', async () => {
      const router = createMockRouter()
      vi.mocked(complianceService.getKycProviderStatus).mockResolvedValue(mockMetrics)

      const wrapper = mount(KycProviderStatusWidget, {
        global: {
          plugins: [router]
        }
      })

      await wrapper.vm.$nextTick()

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.text()).toContain('KYC Provider Integration')
    })

    it('should display KYC provider metrics when loaded', async () => {
      const router = createMockRouter()
      vi.mocked(complianceService.getKycProviderStatus).mockResolvedValue(mockMetrics)

      const wrapper = mount(KycProviderStatusWidget, {
        global: {
          plugins: [router]
        }
      })

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(wrapper.text()).toContain('60%') // Integration complete
      expect(wrapper.text()).toContain('69.4%') // Overall coverage
      expect(wrapper.text()).toContain('Jumio Verification')
      expect(wrapper.text()).toContain('Onfido Identity')
      expect(wrapper.text()).toContain('Trulioo GlobalGateway')
    })

    it('should show error state when loading fails', async () => {
      const router = createMockRouter()
      vi.mocked(complianceService.getKycProviderStatus).mockRejectedValue(
        new Error('Failed to load')
      )

      const wrapper = mount(KycProviderStatusWidget, {
        global: {
          plugins: [router]
        }
      })

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(wrapper.text()).toContain('Failed to load metrics')
    })
  })

  describe('Status Mapping', () => {
    it('should show green icon when all providers healthy', async () => {
      const router = createMockRouter()
      const healthyMetrics: KycProviderMetrics = {
        ...mockMetrics,
        integrationComplete: 100,
        staleProviders: 0,
        failedProviders: 0,
        providers: mockMetrics.providers.filter(p => p.status === 'connected')
      }
      vi.mocked(complianceService.getKycProviderStatus).mockResolvedValue(healthyMetrics)

      const wrapper = mount(KycProviderStatusWidget, {
        global: {
          plugins: [router]
        }
      })

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(wrapper.vm.getIconColor).toBe('green')
    })

    it('should show orange icon when providers are stale', async () => {
      const router = createMockRouter()
      vi.mocked(complianceService.getKycProviderStatus).mockResolvedValue(mockMetrics)

      const wrapper = mount(KycProviderStatusWidget, {
        global: {
          plugins: [router]
        }
      })

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(wrapper.vm.getIconColor).toBe('orange')
      expect(wrapper.vm.hasAlerts).toBe(true)
    })

    it('should show orange icon when integration incomplete', async () => {
      const router = createMockRouter()
      const incompleteMetrics: KycProviderMetrics = {
        ...mockMetrics,
        integrationComplete: 60,
        staleProviders: 0,
        failedProviders: 0,
      }
      vi.mocked(complianceService.getKycProviderStatus).mockResolvedValue(incompleteMetrics)

      const wrapper = mount(KycProviderStatusWidget, {
        global: {
          plugins: [router]
        }
      })

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(wrapper.vm.getIconColor).toBe('orange')
    })
  })

  describe('Provider Status Display', () => {
    it('should display stale badge for providers >24h', async () => {
      const router = createMockRouter()
      vi.mocked(complianceService.getKycProviderStatus).mockResolvedValue(mockMetrics)

      const wrapper = mount(KycProviderStatusWidget, {
        global: {
          plugins: [router]
        }
      })

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(wrapper.text()).toContain('Stale')
    })

    it('should show alert when providers need attention', async () => {
      const router = createMockRouter()
      vi.mocked(complianceService.getKycProviderStatus).mockResolvedValue(mockMetrics)

      const wrapper = mount(KycProviderStatusWidget, {
        global: {
          plugins: [router]
        }
      })

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(wrapper.text()).toContain('provider(s) need attention')
      expect(wrapper.vm.hasAlerts).toBe(true)
    })

    it('should show all clear when no alerts', async () => {
      const router = createMockRouter()
      const healthyMetrics: KycProviderMetrics = {
        ...mockMetrics,
        staleProviders: 0,
        failedProviders: 0,
        providers: mockMetrics.providers.map(p => ({ ...p, isStale: false, status: 'connected' as const }))
      }
      vi.mocked(complianceService.getKycProviderStatus).mockResolvedValue(healthyMetrics)

      const wrapper = mount(KycProviderStatusWidget, {
        global: {
          plugins: [router]
        }
      })

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(wrapper.text()).toContain('All active providers synced')
      expect(wrapper.vm.hasAlerts).toBe(false)
    })

    it('should display quick stats correctly', async () => {
      const router = createMockRouter()
      vi.mocked(complianceService.getKycProviderStatus).mockResolvedValue(mockMetrics)

      const wrapper = mount(KycProviderStatusWidget, {
        global: {
          plugins: [router]
        }
      })

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(wrapper.text()).toContain('2') // Active providers
      expect(wrapper.text()).toContain('1') // Stale providers
      expect(wrapper.text()).toContain('1') // Failed providers
    })
  })

  describe('Navigation', () => {
    it('should have configure button that navigates to settings', async () => {
      const router = createMockRouter()
      vi.mocked(complianceService.getKycProviderStatus).mockResolvedValue(mockMetrics)

      const wrapper = mount(KycProviderStatusWidget, {
        global: {
          plugins: [router]
        }
      })

      // Wait for component to load data
      await new Promise(resolve => setTimeout(resolve, 150))

      // The button should exist and contain the configure text
      const html = wrapper.html()
      expect(html).toContain('Configure KYC Providers')
    })

    it('should emit view-details event', async () => {
      const router = createMockRouter()
      vi.mocked(complianceService.getKycProviderStatus).mockResolvedValue(mockMetrics)

      const wrapper = mount(KycProviderStatusWidget, {
        global: {
          plugins: [router]
        }
      })

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      wrapper.vm.$emit('view-details')

      expect(wrapper.emitted('view-details')).toBeTruthy()
    })
  })

  describe('Data Loading', () => {
    it('should call service on mount', () => {
      const router = createMockRouter()
      vi.mocked(complianceService.getKycProviderStatus).mockResolvedValue(mockMetrics)

      mount(KycProviderStatusWidget, {
        global: {
          plugins: [router]
        }
      })

      expect(complianceService.getKycProviderStatus).toHaveBeenCalled()
    })

    it('should pass network prop to service', () => {
      const router = createMockRouter()
      vi.mocked(complianceService.getKycProviderStatus).mockResolvedValue(mockMetrics)

      mount(KycProviderStatusWidget, {
        props: {
          network: 'VOI'
        },
        global: {
          plugins: [router]
        }
      })

      expect(complianceService.getKycProviderStatus).toHaveBeenCalledWith('VOI')
    })
  })

  describe('Coverage Display', () => {
    it('should display total coverage with one decimal', async () => {
      const router = createMockRouter()
      vi.mocked(complianceService.getKycProviderStatus).mockResolvedValue(mockMetrics)

      const wrapper = mount(KycProviderStatusWidget, {
        global: {
          plugins: [router]
        }
      })

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(wrapper.text()).toContain('69.4%')
    })

    it('should display integration progress bar', async () => {
      const router = createMockRouter()
      vi.mocked(complianceService.getKycProviderStatus).mockResolvedValue(mockMetrics)

      const wrapper = mount(KycProviderStatusWidget, {
        global: {
          plugins: [router]
        }
      })

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      const progressBar = wrapper.find('.bg-gradient-to-r')
      expect(progressBar.exists()).toBe(true)
    })
  })
})
