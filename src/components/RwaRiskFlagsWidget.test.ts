import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import RwaRiskFlagsWidget from './RwaRiskFlagsWidget.vue'
import { complianceService } from '../services/ComplianceService'

vi.mock('../services/ComplianceService', () => ({
  complianceService: {
    getRwaRiskFlags: vi.fn()
  }
}))

describe('RwaRiskFlagsWidget Component', () => {
  const mockMetrics = {
    totalFlags: 2,
    criticalFlags: 0,
    highFlags: 1,
    mediumFlags: 1,
    lowFlags: 0,
    recentFlags: [
      {
        id: 'risk-1',
        severity: 'high' as const,
        category: 'compliance' as const,
        title: 'Jurisdiction restrictions not configured',
        description: 'Some tokens lack proper jurisdiction restrictions',
        detectedAt: new Date().toISOString(),
        status: 'active' as const,
      }
    ],
    lastUpdated: new Date().toISOString(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Component Rendering', () => {
    it('should render the widget', () => {
      vi.mocked(complianceService.getRwaRiskFlags).mockResolvedValue(mockMetrics)

      const wrapper = mount(RwaRiskFlagsWidget, {
        props: {
          network: 'VOI'
        }
      })

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.text()).toContain('RWA Risk Flags')
    })

    it('should display risk metrics when loaded', async () => {
      vi.mocked(complianceService.getRwaRiskFlags).mockResolvedValue(mockMetrics)

      const wrapper = mount(RwaRiskFlagsWidget, {
        props: {
          network: 'VOI'
        }
      })

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(wrapper.text()).toContain('2')
      expect(wrapper.text()).toContain('High')
      expect(wrapper.text()).toContain('Medium')
    })

    it('should show error state when loading fails', async () => {
      vi.mocked(complianceService.getRwaRiskFlags).mockRejectedValue(
        new Error('Failed to load')
      )

      const wrapper = mount(RwaRiskFlagsWidget, {
        props: {
          network: 'VOI'
        }
      })

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(wrapper.text()).toContain('Failed to load metrics')
    })
  })

  describe('Icon Color Logic', () => {
    it('should show pink icon for critical flags', async () => {
      vi.mocked(complianceService.getRwaRiskFlags).mockResolvedValue({
        ...mockMetrics,
        criticalFlags: 1,
        totalFlags: 3
      })

      const wrapper = mount(RwaRiskFlagsWidget, {
        props: {
          network: 'VOI'
        }
      })

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(wrapper.vm.getIconColor).toBe('pink')
    })

    it('should show orange icon for high flags', async () => {
      vi.mocked(complianceService.getRwaRiskFlags).mockResolvedValue(mockMetrics)

      const wrapper = mount(RwaRiskFlagsWidget, {
        props: {
          network: 'VOI'
        }
      })

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(wrapper.vm.getIconColor).toBe('orange')
    })

    it('should show green icon for zero flags', async () => {
      vi.mocked(complianceService.getRwaRiskFlags).mockResolvedValue({
        ...mockMetrics,
        totalFlags: 0,
        criticalFlags: 0,
        highFlags: 0,
        mediumFlags: 0,
        lowFlags: 0,
        recentFlags: []
      })

      const wrapper = mount(RwaRiskFlagsWidget, {
        props: {
          network: 'VOI'
        }
      })

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(wrapper.vm.getIconColor).toBe('green')
      expect(wrapper.text()).toContain('No active risk flags')
    })
  })

  describe('Data Loading', () => {
    it('should call service with correct parameters', () => {
      vi.mocked(complianceService.getRwaRiskFlags).mockResolvedValue(mockMetrics)

      mount(RwaRiskFlagsWidget, {
        props: {
          network: 'VOI'
        }
      })

      expect(complianceService.getRwaRiskFlags).toHaveBeenCalledWith('VOI')
    })

    it('should work without network parameter', () => {
      vi.mocked(complianceService.getRwaRiskFlags).mockResolvedValue(mockMetrics)

      mount(RwaRiskFlagsWidget, {
        props: {}
      })

      expect(complianceService.getRwaRiskFlags).toHaveBeenCalledWith(undefined)
    })
  })
})
