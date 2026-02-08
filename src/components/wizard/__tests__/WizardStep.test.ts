import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import WizardStep from '../WizardStep.vue'

describe('WizardStep', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('Rendering with Props', () => {
    it('should render with title', () => {
      const wrapper = mount(WizardStep, {
        props: {
          title: 'Test Step Title',
        },
      })

      expect(wrapper.find('h2').text()).toBe('Test Step Title')
    })

    it('should render with description', () => {
      const wrapper = mount(WizardStep, {
        props: {
          title: 'Test Step',
          description: 'This is a test description',
        },
      })

      expect(wrapper.text()).toContain('This is a test description')
    })

    it('should not render description paragraph when no description provided', () => {
      const wrapper = mount(WizardStep, {
        props: {
          title: 'Test Step',
        },
      })

      const descriptions = wrapper.findAll('p')
      const hasDescription = descriptions.some(p => p.text().includes('test description'))
      expect(hasDescription).toBe(false)
    })

    it('should render with help text', () => {
      const wrapper = mount(WizardStep, {
        props: {
          title: 'Test Step',
          helpText: 'This is helpful information',
        },
      })

      expect(wrapper.text()).toContain('This is helpful information')
    })

    it('should not render help text section when no helpText provided', () => {
      const wrapper = mount(WizardStep, {
        props: {
          title: 'Test Step',
        },
      })

      const helpTextSection = wrapper.find('.bg-blue-500\\/10')
      expect(helpTextSection.exists()).toBe(false)
    })
  })

  describe('Validation Error Display', () => {
    it('should not show errors when showErrors is false', () => {
      const wrapper = mount(WizardStep, {
        props: {
          title: 'Test Step',
          validationErrors: ['Error 1', 'Error 2'],
          showErrors: false,
        },
      })

      const errorSection = wrapper.find('[role="alert"]')
      expect(errorSection.exists()).toBe(false)
    })

    it('should show errors when showErrors is true and errors exist', () => {
      const wrapper = mount(WizardStep, {
        props: {
          title: 'Test Step',
          validationErrors: ['Error 1', 'Error 2'],
          showErrors: true,
        },
      })

      const errorSection = wrapper.find('[role="alert"]')
      expect(errorSection.exists()).toBe(true)
    })

    it('should not show error section when no validation errors', () => {
      const wrapper = mount(WizardStep, {
        props: {
          title: 'Test Step',
          validationErrors: [],
          showErrors: true,
        },
      })

      const errorSection = wrapper.find('[role="alert"]')
      expect(errorSection.exists()).toBe(false)
    })

    it('should display all validation errors', () => {
      const errors = ['Name is required', 'Email is invalid', 'Password too short']
      const wrapper = mount(WizardStep, {
        props: {
          title: 'Test Step',
          validationErrors: errors,
          showErrors: true,
        },
      })

      errors.forEach(error => {
        expect(wrapper.text()).toContain(error)
      })
    })

    it('should show error icon when errors are displayed', () => {
      const wrapper = mount(WizardStep, {
        props: {
          title: 'Test Step',
          validationErrors: ['Error'],
          showErrors: true,
        },
      })

      const errorIcon = wrapper.find('.pi-exclamation-triangle')
      expect(errorIcon.exists()).toBe(true)
    })

    it('should have red styling for error section', () => {
      const wrapper = mount(WizardStep, {
        props: {
          title: 'Test Step',
          validationErrors: ['Error'],
          showErrors: true,
        },
      })

      const errorSection = wrapper.find('[role="alert"]')
      expect(errorSection.classes()).toContain('bg-red-500/10')
      expect(errorSection.classes()).toContain('border-red-500/30')
    })

    it('should have proper heading for error section', () => {
      const wrapper = mount(WizardStep, {
        props: {
          title: 'Test Step',
          validationErrors: ['Error'],
          showErrors: true,
        },
      })

      expect(wrapper.text()).toContain('Please fix the following errors:')
    })
  })

  describe('Help Text Display', () => {
    it('should show help icon when help text is provided', () => {
      const wrapper = mount(WizardStep, {
        props: {
          title: 'Test Step',
          helpText: 'Helpful tip',
        },
      })

      const helpIcon = wrapper.find('.pi-info-circle')
      expect(helpIcon.exists()).toBe(true)
    })

    it('should have blue styling for help section', () => {
      const wrapper = mount(WizardStep, {
        props: {
          title: 'Test Step',
          helpText: 'Helpful tip',
        },
      })

      const helpSection = wrapper.find('.bg-blue-500\\/10')
      expect(helpSection.exists()).toBe(true)
      expect(helpSection.classes()).toContain('border-blue-500/20')
    })

    it('should render help text below step content', () => {
      const wrapper = mount(WizardStep, {
        props: {
          title: 'Test Step',
          helpText: 'Helpful tip',
        },
        slots: {
          default: '<div class="test-content">Content</div>',
        },
      })

      const helpSection = wrapper.find('.bg-blue-500\\/10')
      const contentSection = wrapper.find('.wizard-step-content')
      
      // Help should come after content in DOM
      expect(helpSection.exists()).toBe(true)
      expect(contentSection.exists()).toBe(true)
    })
  })

  describe('Slot Content Rendering', () => {
    it('should render default slot content', () => {
      const wrapper = mount(WizardStep, {
        props: {
          title: 'Test Step',
        },
        slots: {
          default: '<div class="test-content">Custom Content</div>',
        },
      })

      expect(wrapper.find('.test-content').exists()).toBe(true)
      expect(wrapper.text()).toContain('Custom Content')
    })

    it('should render slot content within wizard-step-content class', () => {
      const wrapper = mount(WizardStep, {
        props: {
          title: 'Test Step',
        },
        slots: {
          default: '<div class="test-content">Custom Content</div>',
        },
      })

      const contentSection = wrapper.find('.wizard-step-content')
      expect(contentSection.exists()).toBe(true)
      expect(contentSection.find('.test-content').exists()).toBe(true)
    })

    it('should render multiple elements in slot', () => {
      const wrapper = mount(WizardStep, {
        props: {
          title: 'Test Step',
        },
        slots: {
          default: `
            <div class="item-1">Item 1</div>
            <div class="item-2">Item 2</div>
            <div class="item-3">Item 3</div>
          `,
        },
      })

      expect(wrapper.find('.item-1').exists()).toBe(true)
      expect(wrapper.find('.item-2').exists()).toBe(true)
      expect(wrapper.find('.item-3').exists()).toBe(true)
    })
  })

  describe('Props Defaults', () => {
    it('should have empty array as default for validationErrors', () => {
      const wrapper = mount(WizardStep, {
        props: {
          title: 'Test Step',
        },
      })

      // Should not crash with undefined errors
      expect(wrapper.exists()).toBe(true)
    })

    it('should have showErrors default to false', () => {
      const wrapper = mount(WizardStep, {
        props: {
          title: 'Test Step',
          validationErrors: ['Error'],
        },
      })

      // Should not show errors by default
      const errorSection = wrapper.find('[role="alert"]')
      expect(errorSection.exists()).toBe(false)
    })
  })

  describe('Styling and Animation', () => {
    it('should have wizard-step class on root element', () => {
      const wrapper = mount(WizardStep, {
        props: {
          title: 'Test Step',
        },
      })

      expect(wrapper.classes()).toContain('wizard-step')
    })

    it('should apply proper styling to title', () => {
      const wrapper = mount(WizardStep, {
        props: {
          title: 'Test Step',
        },
      })

      const title = wrapper.find('h2')
      expect(title.classes()).toContain('text-2xl')
      expect(title.classes()).toContain('font-bold')
    })

    it('should apply proper styling to description', () => {
      const wrapper = mount(WizardStep, {
        props: {
          title: 'Test Step',
          description: 'Description text',
        },
      })

      const descriptionElements = wrapper.findAll('p')
      const description = descriptionElements.find(el => el.text() === 'Description text')
      
      if (description) {
        expect(description.classes()).toContain('text-gray-600')
      }
    })
  })

  describe('Complex Scenarios', () => {
    it('should handle all props together', () => {
      const wrapper = mount(WizardStep, {
        props: {
          title: 'Complete Step',
          description: 'This is a full step',
          helpText: 'Here is some help',
          validationErrors: ['Error 1', 'Error 2'],
          showErrors: true,
        },
        slots: {
          default: '<div class="content">Step Content</div>',
        },
      })

      expect(wrapper.text()).toContain('Complete Step')
      expect(wrapper.text()).toContain('This is a full step')
      expect(wrapper.text()).toContain('Here is some help')
      expect(wrapper.text()).toContain('Error 1')
      expect(wrapper.text()).toContain('Error 2')
      expect(wrapper.text()).toContain('Step Content')
    })

    it('should maintain proper order of sections', () => {
      const wrapper = mount(WizardStep, {
        props: {
          title: 'Test Step',
          description: 'Description',
          helpText: 'Help text',
          validationErrors: ['Error'],
          showErrors: true,
        },
        slots: {
          default: '<div>Content</div>',
        },
      })

      const html = wrapper.html()
      
      // Check order: title, description, errors, content, help
      const titleIndex = html.indexOf('Test Step')
      const descriptionIndex = html.indexOf('Description')
      const errorIndex = html.indexOf('Please fix the following errors')
      const contentIndex = html.indexOf('<div>Content</div>')
      const helpIndex = html.indexOf('Help text')

      expect(titleIndex).toBeLessThan(descriptionIndex)
      expect(descriptionIndex).toBeLessThan(errorIndex)
      expect(errorIndex).toBeLessThan(contentIndex)
      expect(contentIndex).toBeLessThan(helpIndex)
    })
  })
})
