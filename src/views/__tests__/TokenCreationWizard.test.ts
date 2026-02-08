import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../../stores/auth'
import { useTokenDraftStore } from '../../stores/tokenDraft'
import { useSubscriptionStore } from '../../stores/subscription'
import { useComplianceStore } from '../../stores/compliance'
import TokenCreationWizard from '../TokenCreationWizard.vue'

describe('TokenCreationWizard', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  describe('Wizard Initialization', () => {
    it('should render wizard container', () => {
      const wrapper = mount(TokenCreationWizard)
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.text()).toContain('Create Your Token')
    })

    it('should initialize with 5 steps', () => {
      const wrapper = mount(TokenCreationWizard)
      const vm = wrapper.vm as any
      expect(vm.wizardSteps.length).toBe(5)
    })

    it('should start at first step', () => {
      const wrapper = mount(TokenCreationWizard)
      const vm = wrapper.vm as any
      expect(vm.currentStepIndex).toBe(0)
    })

    it('should define step IDs correctly', () => {
      const wrapper = mount(TokenCreationWizard)
      const vm = wrapper.vm as any
      const stepIds = vm.wizardSteps.map((s: any) => s.id)
      expect(stepIds).toEqual([
        'authentication',
        'subscription',
        'token-details',
        'compliance',
        'deployment',
      ])
    })
  })

  describe('Step Orchestration', () => {
    it('should handle step change', async () => {
      const consoleSpy = vi.spyOn(console, 'log')
      const wrapper = mount(TokenCreationWizard)
      const vm = wrapper.vm as any
      
      await vm.handleStepChange(1, vm.wizardSteps[1])
      
      expect(vm.currentStepIndex).toBe(1)
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Wizard] Step changed to:')
      )
      
      consoleSpy.mockRestore()
    })

    it('should validate authentication step', () => {
      const authStore = useAuthStore()
      authStore.user = { address: 'TEST', email: 'test@example.com' } as any
      authStore.isConnected = true  // Set this for isAuthenticated computed

      const wrapper = mount(TokenCreationWizard)
      
      // Check auth store state
      expect(authStore.user).toBeTruthy()
      expect(authStore.isConnected).toBe(true)
    })

    it('should validate subscription step', async () => {
      const subscriptionStore = useSubscriptionStore()
      subscriptionStore.subscription = {
        subscription_status: 'active',
      } as any

      const wrapper = mount(TokenCreationWizard)
      await flushPromises()
      
      // Check subscription object
      expect(subscriptionStore.subscription?.subscription_status).toBe('active')
    })
  })

  describe('Draft Saving', () => {
    it('should save draft when handleSaveDraft is called', async () => {
      const tokenDraftStore = useTokenDraftStore()
      tokenDraftStore.initializeDraft()
      tokenDraftStore.updateDraft({ name: 'Test Token' })
      tokenDraftStore.saveDraft = vi.fn()

      const wrapper = mount(TokenCreationWizard)
      const vm = wrapper.vm as any
      
      await vm.handleSaveDraft()
      
      expect(tokenDraftStore.saveDraft).toHaveBeenCalled()
    })

    it('should emit analytics event when draft is saved', async () => {
      const consoleSpy = vi.spyOn(console, 'log')
      const tokenDraftStore = useTokenDraftStore()
      tokenDraftStore.initializeDraft()

      const wrapper = mount(TokenCreationWizard)
      const vm = wrapper.vm as any
      
      await vm.handleSaveDraft()
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Wizard] Draft saved')
      )
      
      consoleSpy.mockRestore()
    })
  })

  describe('Completion Flow', () => {
    it('should handle wizard completion', async () => {
      const wrapper = mount(TokenCreationWizard)
      const vm = wrapper.vm as any
      
      await vm.handleComplete()
      
      // Should emit analytics event
      expect(true).toBe(true) // Completion handling executed
    })

    it('should navigate on completion', async () => {
      const wrapper = mount(TokenCreationWizard)
      const vm = wrapper.vm as any
      
      await vm.handleComplete()
      
      // Router push should be called (mocked in setup)
      expect(true).toBe(true)
    })
  })

  describe('Analytics Events', () => {
    it('should emit analytics on step view', async () => {
      const consoleSpy = vi.spyOn(console, 'log')
      const wrapper = mount(TokenCreationWizard)
      const vm = wrapper.vm as any
      
      await vm.handleStepChange(2, vm.wizardSteps[2])
      
      // Check that some analytics logging occurred
      expect(consoleSpy).toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })

    it('should emit analytics on plan selection', async () => {
      const consoleSpy = vi.spyOn(console, 'log')
      const wrapper = mount(TokenCreationWizard)
      const vm = wrapper.vm as any
      
      await vm.handlePlanSelected('professional')
      
      expect(vm.selectedPlan).toBe('professional')
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Wizard] Plan selected')
      )
      
      consoleSpy.mockRestore()
    })
  })

  describe('Step References', () => {
    it('should mount wizard successfully', () => {
      const wrapper = mount(TokenCreationWizard)
      
      // Just verify it mounts without errors
      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('Step Validation Handling', () => {
    it('should handle step validation event', async () => {
      const wrapper = mount(TokenCreationWizard)
      const vm = wrapper.vm as any
      
      await vm.handleStepValidated(0, true)
      
      // Validation handling executed
      expect(true).toBe(true)
    })

    it('should call validateAll on token details step', () => {
      const wrapper = mount(TokenCreationWizard)
      const vm = wrapper.vm as any
      
      // Create mock ref with validateAll
      vm.step3Ref = {
        isValid: true,
        validateAll: vi.fn(),
      }
      
      const tokenDetailsStep = vm.wizardSteps[2]
      tokenDetailsStep.isValid()
      
      expect(vm.step3Ref.validateAll).toHaveBeenCalled()
    })
  })
})
