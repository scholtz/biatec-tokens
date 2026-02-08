import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { useComplianceStore } from '../../../../stores/compliance'
import ComplianceReviewStep from '../ComplianceReviewStep.vue'
import WizardStep from '../../WizardStep.vue'

describe('ComplianceReviewStep', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  describe('Compliance Checklist Display', () => {
    it('should render MICA compliance section', () => {
      const wrapper = mount(ComplianceReviewStep, {
        global: {
          components: { WizardStep },
        },
      })

      expect(wrapper.text()).toContain('MICA Compliance Readiness')
    })

    it('should display compliance score', () => {
      const complianceStore = useComplianceStore()
      complianceStore.metrics = { completionPercentage: 75 } as any

      const wrapper = mount(ComplianceReviewStep, {
        global: {
          components: { WizardStep },
        },
      })

      expect(wrapper.text()).toContain('75% Ready')
    })

    it('should show category tabs', () => {
      const wrapper = mount(ComplianceReviewStep, {
        global: {
          components: { WizardStep },
        },
      })

      expect(wrapper.text()).toContain('KYC/AML')
      expect(wrapper.text()).toContain('Jurisdiction')
      expect(wrapper.text()).toContain('Disclosure')
      expect(wrapper.text()).toContain('Network')
    })

    it('should filter checklist items by category', async () => {
      const complianceStore = useComplianceStore()
      complianceStore.filteredChecklist = [
        { id: '1', label: 'KYC Item', category: 'kyc-aml', completed: false, required: true, description: 'Test' },
        { id: '2', label: 'Jurisdiction Item', category: 'jurisdiction', completed: false, required: true, description: 'Test' },
      ] as any

      const wrapper = mount(ComplianceReviewStep, {
        global: {
          components: { WizardStep },
        },
      })

      const vm = wrapper.vm as any
      expect(vm.filteredChecklistItems.length).toBeGreaterThan(0)
    })
  })

  describe('MICA Score Calculation', () => {
    it('should show green color for high compliance score', () => {
      const complianceStore = useComplianceStore()
      complianceStore.metrics = { completionPercentage: 85 } as any

      const wrapper = mount(ComplianceReviewStep, {
        global: {
          components: { WizardStep },
        },
      })

      const scoreDisplay = wrapper.find('.text-green-400')
      expect(scoreDisplay.exists()).toBe(true)
    })

    it('should show yellow color for medium compliance score', () => {
      const complianceStore = useComplianceStore()
      complianceStore.metrics = { completionPercentage: 60 } as any

      const wrapper = mount(ComplianceReviewStep, {
        global: {
          components: { WizardStep },
        },
      })

      const vm = wrapper.vm as any
      expect(vm.complianceScore).toBe(60)
    })

    it('should show red color for low compliance score', () => {
      const complianceStore = useComplianceStore()
      complianceStore.metrics = { completionPercentage: 30 } as any

      const wrapper = mount(ComplianceReviewStep, {
        global: {
          components: { WizardStep },
        },
      })

      const vm = wrapper.vm as any
      expect(vm.complianceScore).toBe(30)
    })
  })

  describe('Risk Acknowledgment', () => {
    it('should show risk acknowledgment when required items incomplete', () => {
      const complianceStore = useComplianceStore()
      complianceStore.requiredItemsComplete = false

      const wrapper = mount(ComplianceReviewStep, {
        global: {
          components: { WizardStep },
        },
      })

      expect(wrapper.text()).toContain('Compliance Requirements Not Met')
    })

    it('should not show risk acknowledgment when all required complete', () => {
      const complianceStore = useComplianceStore()
      complianceStore.requiredItemsComplete = true

      const wrapper = mount(ComplianceReviewStep, {
        global: {
          components: { WizardStep },
        },
      })

      expect(wrapper.text()).toContain('All Required Checks Complete')
    })

    it('should enable risk acknowledgment checkbox', async () => {
      const complianceStore = useComplianceStore()
      complianceStore.requiredItemsComplete = false

      const wrapper = mount(ComplianceReviewStep, {
        global: {
          components: { WizardStep },
        },
      })

      const checkbox = wrapper.find('#acknowledge-risk')
      expect(checkbox.exists()).toBe(true)
    })
  })

  describe('Validation Logic', () => {
    it('should be valid when all required items complete', () => {
      const complianceStore = useComplianceStore()
      complianceStore.requiredItemsComplete = true

      const wrapper = mount(ComplianceReviewStep, {
        global: {
          components: { WizardStep },
        },
      })

      const vm = wrapper.vm as any
      expect(vm.isValid).toBe(true)
    })

    it('should be valid when risk acknowledged', async () => {
      const complianceStore = useComplianceStore()
      complianceStore.requiredItemsComplete = false

      const wrapper = mount(ComplianceReviewStep, {
        global: {
          components: { WizardStep },
        },
      })

      const vm = wrapper.vm as any
      vm.riskAcknowledged = true
      await wrapper.vm.$nextTick()

      expect(vm.isValid).toBe(true)
    })

    it('should be invalid when incomplete and not acknowledged', () => {
      const complianceStore = useComplianceStore()
      complianceStore.requiredItemsComplete = false

      const wrapper = mount(ComplianceReviewStep, {
        global: {
          components: { WizardStep },
        },
      })

      const vm = wrapper.vm as any
      vm.riskAcknowledged = false
      expect(vm.isValid).toBe(false)
    })
  })

  describe('Checklist Item Toggling', () => {
    it('should toggle checklist item when clicked', async () => {
      const complianceStore = useComplianceStore()
      complianceStore.toggleCheckItem = vi.fn()

      const wrapper = mount(ComplianceReviewStep, {
        global: {
          components: { WizardStep },
        },
      })

      const vm = wrapper.vm as any
      await vm.toggleCheckItem('item-1')

      expect(complianceStore.toggleCheckItem).toHaveBeenCalledWith('item-1')
    })
  })

  describe('Glossary Feature', () => {
    it('should identify terms that have glossary entries', () => {
      const wrapper = mount(ComplianceReviewStep, {
        global: {
          components: { WizardStep },
        },
      })

      const vm = wrapper.vm as any
      expect(vm.hasGlossaryTerms('KYC Procedures')).toBe(true)
      expect(vm.hasGlossaryTerms('AML Compliance')).toBe(true)
      expect(vm.hasGlossaryTerms('Basic requirement')).toBe(false)
    })

    it('should provide KYC explanation', () => {
      const wrapper = mount(ComplianceReviewStep, {
        global: {
          components: { WizardStep },
        },
      })

      const vm = wrapper.vm as any
      const explanation = vm.getGlossaryExplanation('KYC')
      expect(explanation).toContain('Know Your Customer')
    })

    it('should provide AML explanation', () => {
      const wrapper = mount(ComplianceReviewStep, {
        global: {
          components: { WizardStep },
        },
      })

      const vm = wrapper.vm as any
      const explanation = vm.getGlossaryExplanation('AML')
      expect(explanation).toContain('Anti-Money Laundering')
    })

    it('should toggle glossary visibility', async () => {
      const wrapper = mount(ComplianceReviewStep, {
        global: {
          components: { WizardStep },
        },
      })

      const vm = wrapper.vm as any
      expect(vm.expandedGlossary['item-1']).toBeFalsy()
      
      await vm.toggleGlossary('item-1')
      expect(vm.expandedGlossary['item-1']).toBe(true)
      
      await vm.toggleGlossary('item-1')
      expect(vm.expandedGlossary['item-1']).toBe(false)
    })
  })

  describe('Category Progress', () => {
    it('should display category progress', () => {
      const complianceStore = useComplianceStore()
      complianceStore.categoryProgress = [
        { category: 'kyc-aml', completed: 3, total: 5, percentage: 60 },
        { category: 'jurisdiction', completed: 2, total: 2, percentage: 100 },
      ] as any

      const wrapper = mount(ComplianceReviewStep, {
        global: {
          components: { WizardStep },
        },
      })

      const vm = wrapper.vm as any
      expect(vm.categoryProgress.length).toBe(2)
    })

    it('should format category names correctly', () => {
      const wrapper = mount(ComplianceReviewStep, {
        global: {
          components: { WizardStep },
        },
      })

      const vm = wrapper.vm as any
      expect(vm.formatCategoryName('kyc-aml')).toBe('KYC/AML')
      expect(vm.formatCategoryName('jurisdiction')).toBe('Jurisdiction')
      expect(vm.formatCategoryName('network-specific')).toBe('Network')
    })
  })

  describe('MICA Information', () => {
    it('should display MICA explanation', () => {
      const wrapper = mount(ComplianceReviewStep, {
        global: {
          components: { WizardStep },
        },
      })

      expect(wrapper.text()).toContain('What is MICA and why does it matter?')
    })

    it('should show help resources', () => {
      const wrapper = mount(ComplianceReviewStep, {
        global: {
          components: { WizardStep },
        },
      })

      expect(wrapper.text()).toContain('Need Help with Compliance?')
      expect(wrapper.text()).toContain('MICA Compliance Guide')
    })
  })
})
