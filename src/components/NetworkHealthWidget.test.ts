import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import NetworkHealthWidget from './NetworkHealthWidget.vue'
import { complianceService } from '../services/ComplianceService'

vi.mock('../services/ComplianceService', () => ({
  complianceService: {
    getNetworkHealth: vi.fn()
  }
}))

describe('NetworkHealthWidget Component', () => {
  const mockMetrics = {
    networks: [
      {
        network: 'VOI' as const,
        isHealthy: true,
        status: 'operational' as const,
        responseTime: 45,
        lastChecked: new Date().toISOString(),
        issues: [],
      },
      {
        network: 'Aramid' as const,
        isHealthy: true,
        status: 'operational' as const,
        responseTime: 52,
        lastChecked: new Date().toISOString(),
        issues: [],
      }
    ],
    overallHealth: 'healthy' as const,
    lastUpdated: new Date().toISOString(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Component Rendering', () => {
    it('should render the widget', () => {
      vi.mocked(complianceService.getNetworkHealth).mockResolvedValue(mockMetrics)

      const wrapper = mount(NetworkHealthWidget)

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.text()).toContain('Network Health')
    })

    it('should display network health when loaded', async () => {
      vi.mocked(complianceService.getNetworkHealth).mockResolvedValue(mockMetrics)

      const wrapper = mount(NetworkHealthWidget)

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(wrapper.text()).toContain('Healthy')
      expect(wrapper.text()).toContain('VOI')
      expect(wrapper.text()).toContain('Aramid')
      expect(wrapper.text()).toContain('45ms')
      expect(wrapper.text()).toContain('52ms')
    })

    it('should show error state when loading fails', async () => {
      vi.mocked(complianceService.getNetworkHealth).mockRejectedValue(
        new Error('Failed to load')
      )

      const wrapper = mount(NetworkHealthWidget)

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(wrapper.text()).toContain('Failed to load metrics')
    })
  })

  describe('Health Status Display', () => {
    it('should show green icon for healthy status', async () => {
      vi.mocked(complianceService.getNetworkHealth).mockResolvedValue(mockMetrics)

      const wrapper = mount(NetworkHealthWidget)

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(wrapper.vm.getIconColor).toBe('green')
      expect(wrapper.vm.getOverallHealthLabel).toBe('Healthy')
    })

    it('should show yellow icon for degraded status', async () => {
      vi.mocked(complianceService.getNetworkHealth).mockResolvedValue({
        ...mockMetrics,
        overallHealth: 'degraded',
        networks: [
          { ...mockMetrics.networks[0] },
          { ...mockMetrics.networks[1], isHealthy: false, status: 'degraded' }
        ]
      })

      const wrapper = mount(NetworkHealthWidget)

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(wrapper.vm.getIconColor).toBe('yellow')
      expect(wrapper.vm.getOverallHealthLabel).toBe('Degraded')
    })

    it('should show orange icon for critical status', async () => {
      vi.mocked(complianceService.getNetworkHealth).mockResolvedValue({
        ...mockMetrics,
        overallHealth: 'critical',
        networks: [
          { ...mockMetrics.networks[0], isHealthy: false, status: 'down' },
          { ...mockMetrics.networks[1], isHealthy: false, status: 'down' }
        ]
      })

      const wrapper = mount(NetworkHealthWidget)

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(wrapper.vm.getIconColor).toBe('orange')
      expect(wrapper.vm.getOverallHealthLabel).toBe('Critical')
    })
  })

  describe('Network Issues', () => {
    it('should detect and display network issues', async () => {
      vi.mocked(complianceService.getNetworkHealth).mockResolvedValue({
        ...mockMetrics,
        networks: [
          { ...mockMetrics.networks[0], issues: ['High latency detected'] },
          mockMetrics.networks[1]
        ]
      })

      const wrapper = mount(NetworkHealthWidget)

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(wrapper.vm.hasIssues).toBe(true)
      expect(wrapper.text()).toContain('Network issues detected')
    })

    it('should show all clear when no issues', async () => {
      vi.mocked(complianceService.getNetworkHealth).mockResolvedValue(mockMetrics)

      const wrapper = mount(NetworkHealthWidget)

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(wrapper.vm.hasIssues).toBe(false)
      expect(wrapper.text()).toContain('All networks operational')
    })
  })

  describe('Data Loading', () => {
    it('should call service on mount', () => {
      vi.mocked(complianceService.getNetworkHealth).mockResolvedValue(mockMetrics)

      mount(NetworkHealthWidget)

      expect(complianceService.getNetworkHealth).toHaveBeenCalled()
    })
  })
})
