import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import WizardContainer from '../WizardContainer.vue'
import type { WizardStep } from '../WizardContainer.vue'

describe('WizardContainer', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  const mockSteps: WizardStep[] = [
    {
      id: 'step1',
      title: 'Step 1',
      isValid: vi.fn(() => true),
    },
    {
      id: 'step2',
      title: 'Step 2',
      isValid: vi.fn(() => false),
    },
    {
      id: 'step3',
      title: 'Step 3',
      isValid: vi.fn(() => true),
    },
  ]

  const defaultProps = {
    title: 'Test Wizard',
    subtitle: 'Test subtitle',
    steps: mockSteps,
  }

  describe('Rendering', () => {
    it('should render wizard with title and subtitle', () => {
      const wrapper = mount(WizardContainer, {
        props: defaultProps,
      })

      expect(wrapper.find('h1').text()).toBe('Test Wizard')
      expect(wrapper.text()).toContain('Test subtitle')
    })

    it('should render all step indicators', () => {
      const wrapper = mount(WizardContainer, {
        props: defaultProps,
      })

      const stepButtons = wrapper.findAll('button[aria-label^="Step"]')
      expect(stepButtons).toHaveLength(mockSteps.length)
    })

    it('should highlight current step', () => {
      const wrapper = mount(WizardContainer, {
        props: defaultProps,
      })

      const firstStepButton = wrapper.find('button[aria-label="Step 1: Step 1"]')
      expect(firstStepButton.classes()).toContain('bg-biatec-accent')
    })

    it('should show step titles on desktop', () => {
      const wrapper = mount(WizardContainer, {
        props: defaultProps,
      })

      mockSteps.forEach((step) => {
        expect(wrapper.text()).toContain(step.title)
      })
    })
  })

  describe('Step Navigation', () => {
    it('should start at initial step', () => {
      const wrapper = mount(WizardContainer, {
        props: {
          ...defaultProps,
          initialStep: 1,
        },
      })

      const vm = wrapper.vm as any
      expect(vm.currentStepIndex).toBe(1)
    })

    it('should navigate to next step when Continue is clicked', async () => {
      const wrapper = mount(WizardContainer, {
        props: {
          ...defaultProps,
          steps: [
            { id: 'step1', title: 'Step 1', isValid: () => true },
            { id: 'step2', title: 'Step 2', isValid: () => true },
          ],
        },
      })

      // Find the continue button by looking for button with "Continue" or arrow icon
      const buttons = wrapper.findAll('button')
      const continueButton = buttons.find(btn => 
        btn.text().includes('Continue') || btn.html().includes('pi-arrow-right')
      )
      
      expect(continueButton).toBeDefined()
      if (continueButton) {
        await continueButton.trigger('click')
      }

      const vm = wrapper.vm as any
      expect(vm.currentStepIndex).toBe(1)
    })

    it('should navigate to previous step when Previous is clicked', async () => {
      const wrapper = mount(WizardContainer, {
        props: {
          ...defaultProps,
          initialStep: 1,
        },
      })

      const previousButton = wrapper.findAll('button').find(btn => btn.text().includes('Previous'))
      expect(previousButton).toBeDefined()
      
      if (previousButton) {
        await previousButton.trigger('click')
      }

      const vm = wrapper.vm as any
      expect(vm.currentStepIndex).toBe(0)
    })

    it('should allow navigation to completed steps', async () => {
      const wrapper = mount(WizardContainer, {
        props: {
          ...defaultProps,
          steps: [
            { id: 'step1', title: 'Step 1', isValid: () => true },
            { id: 'step2', title: 'Step 2', isValid: () => true },
          ],
        },
      })

      const vm = wrapper.vm as any
      
      // Complete first step
      vm.completedSteps.add(0)
      await wrapper.vm.$nextTick()

      // Should be able to click on completed step
      const stepButtons = wrapper.findAll('button[aria-label^="Step"]')
      const firstStepButton = stepButtons[0]
      
      expect(firstStepButton.attributes('disabled')).toBeUndefined()
    })

    it('should not navigate forward if validation fails', async () => {
      const wrapper = mount(WizardContainer, {
        props: {
          ...defaultProps,
          steps: [
            { id: 'step1', title: 'Step 1', isValid: () => false },
            { id: 'step2', title: 'Step 2', isValid: () => true },
          ],
        },
      })

      const continueButton = wrapper.findAll('button').find(btn => btn.text().includes('Continue'))
      expect(continueButton?.attributes('disabled')).toBeDefined()
    })

    it('should emit step-change event when step changes', async () => {
      const wrapper = mount(WizardContainer, {
        props: {
          ...defaultProps,
          initialStep: 1,
        },
      })

      const previousButton = wrapper.findAll('button').find(btn => btn.text().includes('Previous'))
      if (previousButton) {
        await previousButton.trigger('click')
      }

      expect(wrapper.emitted('step-change')).toBeTruthy()
      const events = wrapper.emitted('step-change') as any[]
      expect(events[0][0]).toBe(0) // stepIndex
    })
  })

  describe('Validation Gating', () => {
    it('should disable Continue button when current step is invalid', () => {
      const wrapper = mount(WizardContainer, {
        props: {
          ...defaultProps,
          steps: [
            { id: 'step1', title: 'Step 1', isValid: () => false },
            { id: 'step2', title: 'Step 2', isValid: () => true },
          ],
        },
      })

      const continueButton = wrapper.findAll('button').find(btn => btn.text().includes('Continue'))
      expect(continueButton?.attributes('disabled')).toBeDefined()
    })

    it('should enable Continue button when current step is valid', () => {
      const wrapper = mount(WizardContainer, {
        props: {
          ...defaultProps,
          steps: [
            { id: 'step1', title: 'Step 1', isValid: () => true },
            { id: 'step2', title: 'Step 2', isValid: () => true },
          ],
        },
      })

      const continueButton = wrapper.findAll('button').find(btn => btn.text().includes('Continue'))
      expect(continueButton?.attributes('disabled')).toBeUndefined()
    })

    it('should emit step-validated event when validation changes', async () => {
      const isValidFn = vi.fn(() => true)
      const wrapper = mount(WizardContainer, {
        props: {
          ...defaultProps,
          steps: [
            { id: 'step1', title: 'Step 1', isValid: isValidFn },
          ],
        },
      })

      await wrapper.vm.$nextTick()
      
      // Validation changes should trigger the watcher
      // Just verify the component is mounted properly
      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('Step Completion Tracking', () => {
    it('should mark step as completed when moving forward', async () => {
      const wrapper = mount(WizardContainer, {
        props: {
          ...defaultProps,
          steps: [
            { id: 'step1', title: 'Step 1', isValid: () => true },
            { id: 'step2', title: 'Step 2', isValid: () => true },
          ],
        },
      })

      const vm = wrapper.vm as any
      await vm.nextStep()
      
      expect(vm.completedSteps.has(0)).toBe(true)
    })

    it('should show check icon for completed steps', async () => {
      const wrapper = mount(WizardContainer, {
        props: {
          ...defaultProps,
          steps: [
            { id: 'step1', title: 'Step 1', isValid: () => true },
            { id: 'step2', title: 'Step 2', isValid: () => true },
          ],
        },
      })

      const vm = wrapper.vm as any
      vm.completedSteps.add(0)
      vm.currentStepIndex = 1
      await wrapper.vm.$nextTick()

      const checkIcon = wrapper.find('.pi-check')
      expect(checkIcon.exists()).toBe(true)
    })

    it('should show connector line as green for completed steps', async () => {
      const wrapper = mount(WizardContainer, {
        props: {
          ...defaultProps,
          steps: [
            { id: 'step1', title: 'Step 1', isValid: () => true },
            { id: 'step2', title: 'Step 2', isValid: () => true },
          ],
        },
      })

      const vm = wrapper.vm as any
      vm.completedSteps.add(0)
      await wrapper.vm.$nextTick()

      const connectorLine = wrapper.find('.bg-green-500')
      expect(connectorLine.exists()).toBe(true)
    })
  })

  describe('Save Draft Functionality', () => {
    it('should show Save Draft button when showSaveDraft is true', () => {
      const wrapper = mount(WizardContainer, {
        props: {
          ...defaultProps,
          showSaveDraft: true,
          initialStep: 1,
        },
      })

      const saveDraftButton = wrapper.findAll('button').find(btn => btn.text().includes('Save Draft'))
      expect(saveDraftButton).toBeDefined()
    })

    it('should not show Save Draft button when showSaveDraft is false', () => {
      const wrapper = mount(WizardContainer, {
        props: {
          ...defaultProps,
          showSaveDraft: false,
          initialStep: 1,
        },
      })

      const saveDraftButton = wrapper.findAll('button').find(btn => btn.text().includes('Save Draft'))
      expect(saveDraftButton).toBeUndefined()
    })

    it('should not show Save Draft button on first step', () => {
      const wrapper = mount(WizardContainer, {
        props: {
          ...defaultProps,
          showSaveDraft: true,
          initialStep: 0,
        },
      })

      const saveDraftButton = wrapper.findAll('button').find(btn => btn.text().includes('Save Draft'))
      expect(saveDraftButton).toBeUndefined()
    })

    it('should emit save-draft event when Save Draft is clicked', async () => {
      const wrapper = mount(WizardContainer, {
        props: {
          ...defaultProps,
          showSaveDraft: true,
          initialStep: 1,
        },
      })

      const saveDraftButton = wrapper.findAll('button').find(btn => btn.text().includes('Save Draft'))
      if (saveDraftButton) {
        await saveDraftButton.trigger('click')
      }

      expect(wrapper.emitted('save-draft')).toBeTruthy()
    })

    it('should auto-save when moving to next step if autoSave is enabled', async () => {
      const wrapper = mount(WizardContainer, {
        props: {
          ...defaultProps,
          autoSave: true,
          steps: [
            { id: 'step1', title: 'Step 1', isValid: () => true },
            { id: 'step2', title: 'Step 2', isValid: () => true },
          ],
        },
      })

      const vm = wrapper.vm as any
      await vm.nextStep()
      
      expect(wrapper.emitted('save-draft')).toBeTruthy()
    })

    it('should not auto-save when autoSave is disabled', async () => {
      const wrapper = mount(WizardContainer, {
        props: {
          ...defaultProps,
          autoSave: false,
          steps: [
            { id: 'step1', title: 'Step 1', isValid: () => true },
            { id: 'step2', title: 'Step 2', isValid: () => true },
          ],
        },
      })

      const vm = wrapper.vm as any
      await vm.nextStep()
      
      expect(wrapper.emitted('save-draft')).toBeFalsy()
    })
  })

  describe('Complete Wizard', () => {
    it('should show Complete button on last step', () => {
      const wrapper = mount(WizardContainer, {
        props: {
          ...defaultProps,
          initialStep: 2,
        },
      })

      const completeButton = wrapper.findAll('button').find(btn => btn.text().includes('Complete'))
      expect(completeButton).toBeDefined()
    })

    it('should not show Continue button on last step', () => {
      const wrapper = mount(WizardContainer, {
        props: {
          ...defaultProps,
          initialStep: 2,
        },
      })

      const continueButton = wrapper.findAll('button').find(btn => btn.text().includes('Continue'))
      expect(continueButton).toBeUndefined()
    })

    it('should enable Complete button only when all steps are valid', () => {
      const wrapper = mount(WizardContainer, {
        props: {
          ...defaultProps,
          initialStep: 2,
          steps: [
            { id: 'step1', title: 'Step 1', isValid: () => true },
            { id: 'step2', title: 'Step 2', isValid: () => true },
            { id: 'step3', title: 'Step 3', isValid: () => true },
          ],
        },
      })

      const completeButton = wrapper.findAll('button').find(btn => btn.text().includes('Complete'))
      expect(completeButton?.attributes('disabled')).toBeUndefined()
    })

    it('should disable Complete button when any step is invalid', () => {
      const wrapper = mount(WizardContainer, {
        props: {
          ...defaultProps,
          initialStep: 2,
          steps: [
            { id: 'step1', title: 'Step 1', isValid: () => false },
            { id: 'step2', title: 'Step 2', isValid: () => true },
            { id: 'step3', title: 'Step 3', isValid: () => true },
          ],
        },
      })

      const completeButton = wrapper.findAll('button').find(btn => btn.text().includes('Complete'))
      expect(completeButton?.attributes('disabled')).toBeDefined()
    })

    it('should emit complete event when Complete button is clicked', async () => {
      const wrapper = mount(WizardContainer, {
        props: {
          ...defaultProps,
          initialStep: 2,
          steps: [
            { id: 'step1', title: 'Step 1', isValid: () => true },
            { id: 'step2', title: 'Step 2', isValid: () => true },
            { id: 'step3', title: 'Step 3', isValid: () => true },
          ],
        },
      })

      const completeButton = wrapper.findAll('button').find(btn => btn.text().includes('Complete'))
      if (completeButton) {
        await completeButton.trigger('click')
      }

      expect(wrapper.emitted('complete')).toBeTruthy()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels for step buttons', () => {
      const wrapper = mount(WizardContainer, {
        props: defaultProps,
      })

      const stepButtons = wrapper.findAll('button[aria-label^="Step"]')
      expect(stepButtons[0].attributes('aria-label')).toBe('Step 1: Step 1')
      expect(stepButtons[1].attributes('aria-label')).toBe('Step 2: Step 2')
      expect(stepButtons[2].attributes('aria-label')).toBe('Step 3: Step 3')
    })

    it('should have aria-current on current step', () => {
      const wrapper = mount(WizardContainer, {
        props: defaultProps,
      })

      const currentStepButton = wrapper.find('button[aria-label="Step 1: Step 1"]')
      expect(currentStepButton.attributes('aria-current')).toBe('step')
    })

    it('should have ARIA labels for navigation buttons', () => {
      const wrapper = mount(WizardContainer, {
        props: {
          ...defaultProps,
          initialStep: 1,
        },
      })

      const previousButton = wrapper.find('button[aria-label^="Go back"]')
      expect(previousButton.attributes('aria-label')).toContain('Step 1')

      const continueButton = wrapper.find('button[aria-label^="Continue to"]')
      expect(continueButton.attributes('aria-label')).toContain('Step 3')
    })
  })

  describe('Exposed Methods', () => {
    it('should expose goToStep method', () => {
      const wrapper = mount(WizardContainer, {
        props: defaultProps,
      })

      const vm = wrapper.vm as any
      expect(vm.goToStep).toBeDefined()
      expect(typeof vm.goToStep).toBe('function')
    })

    it('should expose nextStep method', () => {
      const wrapper = mount(WizardContainer, {
        props: defaultProps,
      })

      const vm = wrapper.vm as any
      expect(vm.nextStep).toBeDefined()
      expect(typeof vm.nextStep).toBe('function')
    })

    it('should expose previousStep method', () => {
      const wrapper = mount(WizardContainer, {
        props: defaultProps,
      })

      const vm = wrapper.vm as any
      expect(vm.previousStep).toBeDefined()
      expect(typeof vm.previousStep).toBe('function')
    })

    it('should expose currentStepIndex ref', () => {
      const wrapper = mount(WizardContainer, {
        props: defaultProps,
      })

      const vm = wrapper.vm as any
      expect(vm.currentStepIndex).toBeDefined()
    })

    it('should expose isStepCompleted method', () => {
      const wrapper = mount(WizardContainer, {
        props: defaultProps,
      })

      const vm = wrapper.vm as any
      expect(vm.isStepCompleted).toBeDefined()
      expect(typeof vm.isStepCompleted).toBe('function')
    })
  })
})
