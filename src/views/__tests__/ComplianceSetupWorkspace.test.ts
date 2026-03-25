import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import ComplianceSetupWorkspace from '../ComplianceSetupWorkspace.vue'

vi.mock('vue-router')

describe('ComplianceSetupWorkspace', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function mountComponent() {
    return mount(ComplianceSetupWorkspace, {
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn })],
        stubs: {
          RouterLink: { template: '<a><slot /></a>' },
        },
      },
    })
  }

  it('renders the compliance setup workspace heading', () => {
    const wrapper = mountComponent()
    expect(wrapper.text()).toContain('Compliance Setup Workspace')
  })

  it('renders the main element with correct role', () => {
    const wrapper = mountComponent()
    const main = wrapper.find('main')
    expect(main.exists()).toBe(true)
    expect(main.attributes('role')).toBe('main')
  })

  it('renders the progress bar', () => {
    const wrapper = mountComponent()
    const progressbar = wrapper.find('[role="progressbar"]')
    expect(progressbar.exists()).toBe(true)
  })

  it('has correct accessibility attributes on progress bar', () => {
    const wrapper = mountComponent()
    const progressbar = wrapper.find('[role="progressbar"]')
    expect(progressbar.attributes('aria-valuemin')).toBe('0')
    expect(progressbar.attributes('aria-valuemax')).toBe('100')
  })
})
