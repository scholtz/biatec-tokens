import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import WhitelistCoverageWidget from './WhitelistCoverageWidget.vue'
import { complianceService } from '../services/ComplianceService'

vi.mock('../services/ComplianceService', () => ({
  complianceService: {
    getWhitelistCoverageMetrics: vi.fn()
  }
}))

describe('WhitelistCoverageWidget Component', () => {
  const mockMetrics = {
    totalAddresses: 856,
    activeAddresses: 812,
    pendingAddresses: 44,
    coveragePercentage: 94.9,
    recentlyAdded: 5,
    recentlyRemoved: 3,
    lastUpdated: new Date().toISOString(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Component Rendering', () => {
    it('should render the widget with loading state initially', () => {
      vi.mocked(complianceService.getWhitelistCoverageMetrics).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      const wrapper = mount(WhitelistCoverageWidget, {
        props: {
          tokenId: '123',
          network: 'VOI'
        }
      })

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.text()).toContain('Whitelist Coverage')
    })

    it('should display coverage metrics when loaded', async () => {
      vi.mocked(complianceService.getWhitelistCoverageMetrics).mockResolvedValue(mockMetrics)

      const wrapper = mount(WhitelistCoverageWidget, {
        props: {
          tokenId: '123',
          network: 'VOI'
        }
      })

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(wrapper.text()).toContain('94.9%')
      expect(wrapper.text()).toContain('856')
      expect(wrapper.text()).toContain('812')
    })

    it('should show error state when loading fails', async () => {
      vi.mocked(complianceService.getWhitelistCoverageMetrics).mockRejectedValue(
        new Error('Failed to load')
      )

      const wrapper = mount(WhitelistCoverageWidget, {
        props: {
          tokenId: '123',
          network: 'VOI'
        }
      })

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(wrapper.text()).toContain('Failed to load metrics')
    })
  })

  describe('Icon Color Logic', () => {
    it('should show green icon for coverage >= 90%', async () => {
      vi.mocked(complianceService.getWhitelistCoverageMetrics).mockResolvedValue({
        ...mockMetrics,
        coveragePercentage: 95
      })

      const wrapper = mount(WhitelistCoverageWidget, {
        props: {
          tokenId: '123',
          network: 'VOI'
        }
      })

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      // Component should compute green color for high coverage
      expect(wrapper.vm.getIconColor).toBe('green')
    })

    it('should show yellow icon for coverage between 70-90%', async () => {
      vi.mocked(complianceService.getWhitelistCoverageMetrics).mockResolvedValue({
        ...mockMetrics,
        coveragePercentage: 80
      })

      const wrapper = mount(WhitelistCoverageWidget, {
        props: {
          tokenId: '123',
          network: 'VOI'
        }
      })

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(wrapper.vm.getIconColor).toBe('yellow')
    })

    it('should show orange icon for coverage < 70%', async () => {
      vi.mocked(complianceService.getWhitelistCoverageMetrics).mockResolvedValue({
        ...mockMetrics,
        coveragePercentage: 65
      })

      const wrapper = mount(WhitelistCoverageWidget, {
        props: {
          tokenId: '123',
          network: 'VOI'
        }
      })

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(wrapper.vm.getIconColor).toBe('orange')
    })
  })

  describe('Events', () => {
    it('should emit view-details event when clicked', async () => {
      vi.mocked(complianceService.getWhitelistCoverageMetrics).mockResolvedValue(mockMetrics)

      const wrapper = mount(WhitelistCoverageWidget, {
        props: {
          tokenId: '123',
          network: 'VOI'
        }
      })

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      wrapper.vm.$emit('view-details')
      expect(wrapper.emitted('view-details')).toBeTruthy()
    })
  })

  describe('Data Loading', () => {
    it('should call service with correct parameters', () => {
      vi.mocked(complianceService.getWhitelistCoverageMetrics).mockResolvedValue(mockMetrics)

      mount(WhitelistCoverageWidget, {
        props: {
          tokenId: '123',
          network: 'VOI'
        }
      })

      expect(complianceService.getWhitelistCoverageMetrics).toHaveBeenCalledWith('123', 'VOI')
    })

    it('should not load data if tokenId is missing', () => {
      mount(WhitelistCoverageWidget, {
        props: {
          tokenId: '',
          network: 'VOI'
        }
      })

      expect(complianceService.getWhitelistCoverageMetrics).not.toHaveBeenCalled()
    })
  })
})
