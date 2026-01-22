import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import MicaSummaryWidget from './MicaSummaryWidget.vue'

describe('MicaSummaryWidget Component', () => {
  describe('Component Rendering', () => {
    it('should render the component with required props', () => {
      const wrapper = mount(MicaSummaryWidget, {
        props: {
          title: 'Test Widget',
          icon: 'pi pi-test',
        }
      })

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find('h3').text()).toBe('Test Widget')
      expect(wrapper.find('i').classes()).toContain('pi-test')
    })

    it('should display subtitle when provided', () => {
      const wrapper = mount(MicaSummaryWidget, {
        props: {
          title: 'Test Widget',
          subtitle: 'Test subtitle',
          icon: 'pi pi-test',
        }
      })

      expect(wrapper.text()).toContain('Test subtitle')
    })

    it('should display value and description when provided', () => {
      const wrapper = mount(MicaSummaryWidget, {
        props: {
          title: 'Test Widget',
          icon: 'pi pi-test',
          value: '1,234',
          description: 'Test description',
        }
      })

      expect(wrapper.text()).toContain('1,234')
      expect(wrapper.text()).toContain('Test description')
    })

    it('should format and display last updated timestamp', () => {
      const timestamp = new Date('2024-01-15T10:30:00Z').toISOString()
      const wrapper = mount(MicaSummaryWidget, {
        props: {
          title: 'Test Widget',
          icon: 'pi pi-test',
          lastUpdated: timestamp,
        }
      })

      expect(wrapper.text()).toContain('Last updated:')
    })

    it('should show details button when hasDetails is true', () => {
      const wrapper = mount(MicaSummaryWidget, {
        props: {
          title: 'Test Widget',
          icon: 'pi pi-test',
          hasDetails: true,
        }
      })

      const button = wrapper.find('button[title="View details"]')
      expect(button.exists()).toBe(true)
    })

    it('should not show details button when hasDetails is false', () => {
      const wrapper = mount(MicaSummaryWidget, {
        props: {
          title: 'Test Widget',
          icon: 'pi pi-test',
          hasDetails: false,
        }
      })

      const button = wrapper.find('button[title="View details"]')
      expect(button.exists()).toBe(false)
    })
  })

  describe('Icon Colors', () => {
    it.each([
      ['blue', 'text-blue-400', 'bg-blue-500/10'],
      ['green', 'text-green-400', 'bg-green-500/10'],
      ['yellow', 'text-yellow-400', 'bg-yellow-500/10'],
      ['purple', 'text-purple-400', 'bg-purple-500/10'],
      ['orange', 'text-orange-400', 'bg-orange-500/10'],
      ['pink', 'text-pink-400', 'bg-pink-500/10'],
    ])('should apply correct color classes for %s', (color, textClass, bgClass) => {
      const wrapper = mount(MicaSummaryWidget, {
        props: {
          title: 'Test Widget',
          icon: 'pi pi-test',
          iconColor: color as any,
        }
      })

      const iconElement = wrapper.find('.pi-test')
      const iconBg = iconElement.element.parentElement
      
      expect(iconElement.classes()).toContain(textClass)
      expect(iconBg?.classList.contains(bgClass)).toBe(true)
    })
  })

  describe('Events', () => {
    it('should emit view-details event when details button is clicked', async () => {
      const wrapper = mount(MicaSummaryWidget, {
        props: {
          title: 'Test Widget',
          icon: 'pi pi-test',
          hasDetails: true,
        }
      })

      const button = wrapper.find('button[title="View details"]')
      await button.trigger('click')

      expect(wrapper.emitted('view-details')).toBeTruthy()
      expect(wrapper.emitted('view-details')?.length).toBe(1)
    })
  })

  describe('Slots', () => {
    it('should render content slot', () => {
      const wrapper = mount(MicaSummaryWidget, {
        props: {
          title: 'Test Widget',
          icon: 'pi pi-test',
        },
        slots: {
          content: '<div class="custom-content">Custom Content</div>'
        }
      })

      expect(wrapper.find('.custom-content').text()).toBe('Custom Content')
    })

    it('should render metrics slot', () => {
      const wrapper = mount(MicaSummaryWidget, {
        props: {
          title: 'Test Widget',
          icon: 'pi pi-test',
        },
        slots: {
          metrics: '<div class="custom-metrics">Custom Metrics</div>'
        }
      })

      expect(wrapper.find('.custom-metrics').text()).toBe('Custom Metrics')
    })
  })
})
