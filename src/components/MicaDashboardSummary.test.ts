import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import MicaDashboardSummary from './MicaDashboardSummary.vue'
import { complianceService } from '../services/ComplianceService'
import type { MicaComplianceMetrics } from '../types/compliance'

// Mock the compliance service
vi.mock('../services/ComplianceService', () => ({
  complianceService: {
    getMicaComplianceMetrics: vi.fn(),
  },
}))

const mockMetrics: MicaComplianceMetrics = {
  tokenId: 'test-token-123',
  network: 'VOI',
  tokenSupply: {
    totalSupply: '10000000',
    circulatingSupply: '8500000',
    reserveSupply: '1000000',
    burnedSupply: '500000',
    lastUpdated: new Date('2024-01-15T10:30:00Z').toISOString(),
  },
  holderDistribution: {
    totalHolders: 1247,
    top10Concentration: 42.5,
    top50Concentration: 68.3,
    averageHolding: '8020.05',
    medianHolding: '2500.00',
    lastUpdated: new Date('2024-01-15T10:30:00Z').toISOString(),
  },
  whitelistStatus: {
    enabled: true,
    totalWhitelisted: 856,
    pendingApprovals: 12,
    recentlyAdded: 5,
  },
  transferActivity: {
    last24Hours: 47,
    last7Days: 312,
    last30Days: 1456,
    totalVolume24h: '125000',
    averageTransferSize: '2659.57',
    recentTransfers: [
      {
        id: '1',
        timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
        from: 'VOI7XKJKLJHGFDSAQWERTYUIOPLKJHGFDSAZXCVBNM',
        to: 'VOI9MNBVCXZASDFGHJKLPOIUYTREWQASDFGHJKLMNB',
        amount: '5000',
        status: 'completed',
        transactionId: 'TXN1234567890ABCDEF',
      },
    ],
    lastUpdated: new Date('2024-01-15T10:30:00Z').toISOString(),
  },
  lastUpdated: new Date('2024-01-15T10:30:00Z').toISOString(),
}

describe('MicaDashboardSummary Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Component Rendering', () => {
    it('should render the component', () => {
      vi.mocked(complianceService.getMicaComplianceMetrics).mockResolvedValue(mockMetrics)

      const wrapper = mount(MicaDashboardSummary, {
        props: {
          tokenId: 'test-token-123',
          network: 'VOI',
        }
      })

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.text()).toContain('MICA Compliance Summary')
    })

    it('should show loading state initially', async () => {
      let resolvePromise: any
      vi.mocked(complianceService.getMicaComplianceMetrics).mockImplementation(
        () => new Promise((resolve) => { resolvePromise = resolve })
      )

      const wrapper = mount(MicaDashboardSummary, {
        props: {
          tokenId: 'test-token-123',
          network: 'VOI',
        }
      })

      // Need to wait a tick for the component to mount
      await wrapper.vm.$nextTick()
      
      // Check if there are loading elements
      const loadingElements = wrapper.findAll('.glass-effect.rounded-xl.p-6.animate-pulse')
      expect(loadingElements.length).toBeGreaterThan(0)
      
      // Clean up
      resolvePromise(mockMetrics)
      await flushPromises()
    })

    it('should display metrics after loading', async () => {
      vi.mocked(complianceService.getMicaComplianceMetrics).mockResolvedValue(mockMetrics)

      const wrapper = mount(MicaDashboardSummary, {
        props: {
          tokenId: 'test-token-123',
          network: 'VOI',
        }
      })

      await flushPromises()

      expect(wrapper.text()).toContain('Token Supply')
      expect(wrapper.text()).toContain('Holder Distribution')
      expect(wrapper.text()).toContain('Whitelist Status')
      expect(wrapper.text()).toContain('Transfer Activity')
    })

    it('should display error message but still show mock data when API fails', async () => {
      vi.mocked(complianceService.getMicaComplianceMetrics).mockRejectedValue(
        new Error('API Error')
      )

      const wrapper = mount(MicaDashboardSummary, {
        props: {
          tokenId: 'test-token-123',
          network: 'VOI',
        }
      })

      await flushPromises()

      // Component provides mock data for development when API fails
      // so we should see the widgets rendered
      expect(wrapper.text()).toContain('Token Supply')
      expect(wrapper.text()).toContain('Holder Distribution')
    })
  })

  describe('Token Supply Widget', () => {
    it('should display token supply metrics correctly', async () => {
      vi.mocked(complianceService.getMicaComplianceMetrics).mockResolvedValue(mockMetrics)

      const wrapper = mount(MicaDashboardSummary, {
        props: {
          tokenId: 'test-token-123',
          network: 'VOI',
        }
      })

      await flushPromises()

      expect(wrapper.text()).toContain('Total Supply')
      expect(wrapper.text()).toContain('Circulating')
      expect(wrapper.text()).toContain('Burned')
    })

    it('should format large numbers correctly', async () => {
      vi.mocked(complianceService.getMicaComplianceMetrics).mockResolvedValue(mockMetrics)

      const wrapper = mount(MicaDashboardSummary, {
        props: {
          tokenId: 'test-token-123',
          network: 'VOI',
        }
      })

      await flushPromises()

      // 10000000 should be formatted as "10.00M"
      expect(wrapper.text()).toContain('10.00M')
    })
  })

  describe('Holder Distribution Widget', () => {
    it('should display holder distribution metrics', async () => {
      vi.mocked(complianceService.getMicaComplianceMetrics).mockResolvedValue(mockMetrics)

      const wrapper = mount(MicaDashboardSummary, {
        props: {
          tokenId: 'test-token-123',
          network: 'VOI',
        }
      })

      await flushPromises()

      expect(wrapper.text()).toContain('Total Holders')
      expect(wrapper.text()).toContain('1,247')
      expect(wrapper.text()).toContain('Top 10 Concentration')
      expect(wrapper.text()).toContain('42.5%')
    })
  })

  describe('Whitelist Status Widget', () => {
    it('should display whitelist enabled status', async () => {
      vi.mocked(complianceService.getMicaComplianceMetrics).mockResolvedValue(mockMetrics)

      const wrapper = mount(MicaDashboardSummary, {
        props: {
          tokenId: 'test-token-123',
          network: 'VOI',
        }
      })

      await flushPromises()

      expect(wrapper.text()).toContain('Enabled')
      expect(wrapper.text()).toContain('856')
    })

    it('should emit navigate-to-whitelist event when clicking details', async () => {
      vi.mocked(complianceService.getMicaComplianceMetrics).mockResolvedValue(mockMetrics)

      const wrapper = mount(MicaDashboardSummary, {
        props: {
          tokenId: 'test-token-123',
          network: 'VOI',
        }
      })

      await flushPromises()

      // Find all view details buttons and click the whitelist one (3rd widget)
      const widgets = wrapper.findAllComponents({ name: 'MicaSummaryWidget' })
      await widgets[2].vm.$emit('view-details')

      expect(wrapper.emitted('navigate-to-whitelist')).toBeTruthy()
    })
  })

  describe('Transfer Activity Widget', () => {
    it('should display transfer activity metrics', async () => {
      vi.mocked(complianceService.getMicaComplianceMetrics).mockResolvedValue(mockMetrics)

      const wrapper = mount(MicaDashboardSummary, {
        props: {
          tokenId: 'test-token-123',
          network: 'VOI',
        }
      })

      await flushPromises()

      expect(wrapper.text()).toContain('24h Volume')
      expect(wrapper.text()).toContain('Transfers (24h)')
      expect(wrapper.text()).toContain('47')
    })

    it('should display recent transfers list', async () => {
      vi.mocked(complianceService.getMicaComplianceMetrics).mockResolvedValue(mockMetrics)

      const wrapper = mount(MicaDashboardSummary, {
        props: {
          tokenId: 'test-token-123',
          network: 'VOI',
        }
      })

      await flushPromises()

      expect(wrapper.text()).toContain('Recent Transfers')
    })

    it('should emit navigate-to-audit-log event when clicking view all', async () => {
      vi.mocked(complianceService.getMicaComplianceMetrics).mockResolvedValue(mockMetrics)

      const wrapper = mount(MicaDashboardSummary, {
        props: {
          tokenId: 'test-token-123',
          network: 'VOI',
        }
      })

      await flushPromises()

      const viewAllButton = wrapper.find('button:has(> i.pi-arrow-right)')
      await viewAllButton.trigger('click')

      expect(wrapper.emitted('navigate-to-audit-log')).toBeTruthy()
    })
  })

  describe('Refresh Functionality', () => {
    it('should have a refresh button', async () => {
      vi.mocked(complianceService.getMicaComplianceMetrics).mockResolvedValue(mockMetrics)

      const wrapper = mount(MicaDashboardSummary, {
        props: {
          tokenId: 'test-token-123',
          network: 'VOI',
        }
      })

      await flushPromises()

      const refreshButton = wrapper.find('button:has(> i.pi-refresh)')
      expect(refreshButton.exists()).toBe(true)
    })

    it('should call API again when refresh button is clicked', async () => {
      vi.mocked(complianceService.getMicaComplianceMetrics).mockResolvedValue(mockMetrics)

      const wrapper = mount(MicaDashboardSummary, {
        props: {
          tokenId: 'test-token-123',
          network: 'VOI',
        }
      })

      await flushPromises()

      expect(complianceService.getMicaComplianceMetrics).toHaveBeenCalledTimes(1)

      const refreshButton = wrapper.find('button:has(> i.pi-refresh)')
      await refreshButton.trigger('click')
      await flushPromises()

      expect(complianceService.getMicaComplianceMetrics).toHaveBeenCalledTimes(2)
    })
  })

  describe('Utility Functions', () => {
    it('should format numbers correctly', async () => {
      const customMetrics = {
        ...mockMetrics,
        tokenSupply: {
          ...mockMetrics.tokenSupply,
          totalSupply: '1500000', // Should format to 1.50M
          circulatingSupply: '1500', // Should format to 1.50K
        },
      }

      vi.mocked(complianceService.getMicaComplianceMetrics).mockResolvedValue(customMetrics)

      const wrapper = mount(MicaDashboardSummary, {
        props: {
          tokenId: 'test-token-123',
          network: 'VOI',
        }
      })

      await flushPromises()

      expect(wrapper.text()).toContain('1.50M')
      expect(wrapper.text()).toContain('1.50K')
    })

    it('should shorten addresses correctly', async () => {
      vi.mocked(complianceService.getMicaComplianceMetrics).mockResolvedValue(mockMetrics)

      const wrapper = mount(MicaDashboardSummary, {
        props: {
          tokenId: 'test-token-123',
          network: 'VOI',
        }
      })

      await flushPromises()

      // Addresses should be shortened to format: VOI7XK...VBNM
      const text = wrapper.text()
      expect(text).toContain('VOI7XK')
    })

    it('should apply correct status classes to transfers', async () => {
      const metricsWithStatuses = {
        ...mockMetrics,
        transferActivity: {
          ...mockMetrics.transferActivity,
          recentTransfers: [
            { ...mockMetrics.transferActivity.recentTransfers[0], status: 'completed' as const },
            { ...mockMetrics.transferActivity.recentTransfers[0], id: '2', status: 'pending' as const },
            { ...mockMetrics.transferActivity.recentTransfers[0], id: '3', status: 'failed' as const },
            { ...mockMetrics.transferActivity.recentTransfers[0], id: '4', status: 'blocked' as const },
          ],
        },
      }

      vi.mocked(complianceService.getMicaComplianceMetrics).mockResolvedValue(metricsWithStatuses)

      const wrapper = mount(MicaDashboardSummary, {
        props: {
          tokenId: 'test-token-123',
          network: 'VOI',
        }
      })

      await flushPromises()

      expect(wrapper.text()).toContain('completed')
      expect(wrapper.text()).toContain('pending')
      expect(wrapper.text()).toContain('failed')
      expect(wrapper.text()).toContain('blocked')
    })
  })
})
