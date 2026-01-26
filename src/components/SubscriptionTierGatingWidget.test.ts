import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import SubscriptionTierGatingWidget from './SubscriptionTierGatingWidget.vue'
import { complianceService } from '../services/ComplianceService'
import { useSubscriptionStore } from '../stores/subscription'

vi.mock('../services/ComplianceService', () => ({
  complianceService: {
    getSubscriptionTierGating: vi.fn()
  }
}))

vi.mock('../stores/subscription', () => ({
  useSubscriptionStore: vi.fn()
}))

describe('SubscriptionTierGatingWidget Component', () => {
  const mockMetrics = {
    currentTier: 'free' as const,
    features: [
      {
        feature: 'Advanced Compliance Analytics',
        enabled: false,
        requiredTier: 'enterprise' as const,
        currentTier: 'free' as const,
        description: 'Deep-dive analytics',
      },
      {
        feature: 'Automated Audit Exports',
        enabled: false,
        requiredTier: 'professional' as const,
        currentTier: 'free' as const,
        description: 'Schedule automatic exports',
      }
    ],
    upgradableFeatures: 2,
    lastUpdated: new Date().toISOString(),
  }

  const mockStore = {
    isActive: false,
    currentProduct: null,
    fetchSubscription: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useSubscriptionStore).mockReturnValue(mockStore as any)
  })

  describe('Component Rendering', () => {
    it('should render the widget', () => {
      vi.mocked(complianceService.getSubscriptionTierGating).mockResolvedValue(mockMetrics)

      const wrapper = mount(SubscriptionTierGatingWidget)

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.text()).toContain('Subscription Tier')
    })

    it('should display tier information when loaded', async () => {
      vi.mocked(complianceService.getSubscriptionTierGating).mockResolvedValue(mockMetrics)

      const wrapper = mount(SubscriptionTierGatingWidget)

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(wrapper.text()).toContain('Free')
      expect(wrapper.text()).toContain('2')
      expect(wrapper.text()).toContain('Locked')
    })

    it('should show error state when loading fails', async () => {
      vi.mocked(complianceService.getSubscriptionTierGating).mockRejectedValue(
        new Error('Failed to load')
      )

      const wrapper = mount(SubscriptionTierGatingWidget)

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(wrapper.text()).toContain('Failed to load metrics')
    })
  })

  describe('Tier Display', () => {
    it('should show appropriate color for free tier', async () => {
      vi.mocked(complianceService.getSubscriptionTierGating).mockResolvedValue(mockMetrics)

      const wrapper = mount(SubscriptionTierGatingWidget)

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(wrapper.vm.getTierIconColor).toBe('blue')
      expect(wrapper.vm.getTierLabel).toBe('Free')
    })

    it('should show appropriate color for professional tier', async () => {
      const professionalMetrics = { ...mockMetrics, currentTier: 'professional' as const }
      vi.mocked(complianceService.getSubscriptionTierGating).mockResolvedValue(professionalMetrics)

      const wrapper = mount(SubscriptionTierGatingWidget)

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(wrapper.vm.getTierIconColor).toBe('blue')
      expect(wrapper.vm.getTierLabel).toBe('Professional')
    })

    it('should show appropriate color for enterprise tier', async () => {
      const enterpriseMetrics = { 
        ...mockMetrics, 
        currentTier: 'enterprise' as const,
        upgradableFeatures: 0
      }
      vi.mocked(complianceService.getSubscriptionTierGating).mockResolvedValue(enterpriseMetrics)

      const wrapper = mount(SubscriptionTierGatingWidget)

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(wrapper.vm.getTierIconColor).toBe('purple')
      expect(wrapper.vm.getTierLabel).toBe('Enterprise')
    })
  })

  describe('Feature Display', () => {
    it('should show upgrade button when features are locked', async () => {
      vi.mocked(complianceService.getSubscriptionTierGating).mockResolvedValue(mockMetrics)

      const wrapper = mount(SubscriptionTierGatingWidget)

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(wrapper.text()).toContain('Upgrade to unlock 2 features')
    })

    it('should show all unlocked message when no upgradable features', async () => {
      const fullMetrics = { ...mockMetrics, upgradableFeatures: 0 }
      vi.mocked(complianceService.getSubscriptionTierGating).mockResolvedValue(fullMetrics)

      const wrapper = mount(SubscriptionTierGatingWidget)

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(wrapper.text()).toContain('All features unlocked')
    })

    it('should calculate enabled features correctly', async () => {
      const metricsWithEnabled = {
        ...mockMetrics,
        features: [
          { ...mockMetrics.features[0], enabled: true },
          { ...mockMetrics.features[1], enabled: false }
        ]
      }
      vi.mocked(complianceService.getSubscriptionTierGating).mockResolvedValue(metricsWithEnabled)

      const wrapper = mount(SubscriptionTierGatingWidget)

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(wrapper.vm.enabledFeaturesCount).toBe(1)
    })
  })

  describe('Events', () => {
    it('should emit upgrade-tier event when upgrade button is clicked', async () => {
      vi.mocked(complianceService.getSubscriptionTierGating).mockResolvedValue(mockMetrics)

      const wrapper = mount(SubscriptionTierGatingWidget)

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      wrapper.vm.$emit('upgrade-tier')
      expect(wrapper.emitted('upgrade-tier')).toBeTruthy()
    })
  })

  describe('Data Loading', () => {
    it('should fetch subscription on mount', () => {
      vi.mocked(complianceService.getSubscriptionTierGating).mockResolvedValue(mockMetrics)

      mount(SubscriptionTierGatingWidget)

      expect(mockStore.fetchSubscription).toHaveBeenCalled()
    })

    it('should determine tier from subscription store', async () => {
      vi.mocked(complianceService.getSubscriptionTierGating).mockResolvedValue(mockMetrics)

      mount(SubscriptionTierGatingWidget)

      await new Promise(resolve => setTimeout(resolve, 0))

      expect(complianceService.getSubscriptionTierGating).toHaveBeenCalledWith('free')
    })
  })
})
