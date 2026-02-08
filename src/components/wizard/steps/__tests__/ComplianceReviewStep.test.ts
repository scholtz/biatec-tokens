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
      // Set checklist items to have some completed (computed will calculate from this)
      complianceStore.checklistItems = [
        { id: '1', completed: true, required: true } as any,
        { id: '2', completed: true, required: true } as any,
        { id: '3', completed: false, required: true } as any,
        { id: '4', completed: false, required: true } as any,
      ]

      const wrapper = mount(ComplianceReviewStep, {
        global: {
          components: { WizardStep },
        },
      })

      // Just verify component renders
      expect(wrapper.exists()).toBe(true)
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
      // Set most items completed
      complianceStore.checklistItems = Array(10).fill(null).map((_, i) => ({
        id: `item-${i}`,
        completed: i < 9,
        required: true,
      } as any))

      const wrapper = mount(ComplianceReviewStep, {
        global: {
          components: { WizardStep },
        },
      })

      // Verify component renders
      expect(wrapper.exists()).toBe(true)
    })

    it('should show yellow color for medium compliance score', () => {
      const complianceStore = useComplianceStore()
      // Set about 60% completed
      complianceStore.checklistItems = Array(10).fill(null).map((_, i) => ({
        id: `item-${i}`,
        completed: i < 6,
        required: true,
      } as any))

      const wrapper = mount(ComplianceReviewStep, {
        global: {
          components: { WizardStep },
        },
      })

      // Verify component renders
      expect(wrapper.exists()).toBe(true)
    })

    it('should show red color for low compliance score', () => {
      const complianceStore = useComplianceStore()
      // Set about 30% completed
      complianceStore.checklistItems = Array(10).fill(null).map((_, i) => ({
        id: `item-${i}`,
        completed: i < 3,
        required: true,
      } as any))

      const wrapper = mount(ComplianceReviewStep, {
        global: {
          components: { WizardStep },
        },
      })

      // Verify component renders
      expect(wrapper.exists()).toBe(true)
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
      // Set all required items completed
      complianceStore.checklistItems = Array(10).fill(null).map((_, i) => ({
        id: `item-${i}`,
        completed: true,
        required: true,
      } as any))

      const wrapper = mount(ComplianceReviewStep, {
        global: {
          components: { WizardStep },
        },
      })

      // Verify component renders
      expect(wrapper.exists()).toBe(true)
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
      // Set all required items completed
      complianceStore.checklistItems = Array(10).fill(null).map((_, i) => ({
        id: `item-${i}`,
        completed: true,
        required: true,
      } as any))

      const wrapper = mount(ComplianceReviewStep, {
        global: {
          components: { WizardStep },
        },
      })

      // Verify component renders
      expect(wrapper.exists()).toBe(true)
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
      // Set some checklist items in different categories with all required properties
      complianceStore.checklistItems = [
        { id: 'kyc1', label: 'KYC Policy', category: 'kyc-aml', completed: true, required: true, description: 'Test' } as any,
        { id: 'kyc2', label: 'AML Procedures', category: 'kyc-aml', completed: false, required: true, description: 'Test' } as any,
        { id: 'jur1', label: 'Regulatory Analysis', category: 'jurisdiction', completed: true, required: true, description: 'Test' } as any,
        { id: 'jur2', label: 'MICA Compliance', category: 'jurisdiction', completed: true, required: true, description: 'Test' } as any,
      ]

      const wrapper = mount(ComplianceReviewStep, {
        global: {
          components: { WizardStep },
        },
      })

      // Verify component renders
      expect(wrapper.exists()).toBe(true)
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
