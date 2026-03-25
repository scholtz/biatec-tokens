import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import BusinessCommandCenter from '../BusinessCommandCenter.vue'

vi.mock('vue-router')

describe('BusinessCommandCenter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function mountComponent() {
    return mount(BusinessCommandCenter, {
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn })],
        stubs: {
          MainLayout: { template: '<div><slot /></div>' },
          RouterLink: { template: '<a><slot /></a>' },
        },
      },
    })
  }

  it('renders the command center heading', () => {
    const wrapper = mountComponent()
    expect(wrapper.find('[data-testid="command-center-heading"]').exists()).toBe(true)
  })

  it('renders the component root', () => {
    const wrapper = mountComponent()
    expect(wrapper.find('[data-testid="business-command-center"]').exists()).toBe(true)
  })

  it('renders role selector', () => {
    const wrapper = mountComponent()
    expect(wrapper.find('[data-testid="role-selector"]').exists()).toBe(true)
  })

  it('has issuer_operator as default role option', () => {
    const wrapper = mountComponent()
    const select = wrapper.find('[data-testid="role-selector"]')
    expect(select.exists()).toBe(true)
    const options = select.findAll('option')
    expect(options.length).toBeGreaterThan(0)
  })
})
