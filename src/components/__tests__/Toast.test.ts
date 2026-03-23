import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Toast from '../Toast.vue'

// Mock useToast composable
const mockToasts = vi.hoisted(() => ({ value: [] as any[] }))
const mockRemoveToast = vi.hoisted(() => vi.fn())

vi.mock('../../composables/useToast', () => ({
  useToast: () => ({
    toasts: mockToasts,
    removeToast: mockRemoveToast,
  }),
}))

describe('Toast', () => {
  beforeEach(() => {
    mockToasts.value = []
    mockRemoveToast.mockClear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders without errors when no toasts', () => {
    const wrapper = mount(Toast, { attachTo: document.body })
    expect(wrapper.exists()).toBe(true)
    wrapper.unmount()
  })

  it('renders a success toast message', () => {
    mockToasts.value = [{ id: '1', message: 'Success!', type: 'success' }]
    const wrapper = mount(Toast, { attachTo: document.body })
    expect(document.body.textContent).toContain('Success!')
    wrapper.unmount()
  })

  it('renders an error toast message', () => {
    mockToasts.value = [{ id: '2', message: 'Error occurred', type: 'error' }]
    const wrapper = mount(Toast, { attachTo: document.body })
    expect(document.body.textContent).toContain('Error occurred')
    wrapper.unmount()
  })

  it('renders a warning toast message', () => {
    mockToasts.value = [{ id: '3', message: 'Warning!', type: 'warning' }]
    const wrapper = mount(Toast, { attachTo: document.body })
    expect(document.body.textContent).toContain('Warning!')
    wrapper.unmount()
  })

  it('renders an info toast message', () => {
    mockToasts.value = [{ id: '4', message: 'Info message', type: 'info' }]
    const wrapper = mount(Toast, { attachTo: document.body })
    expect(document.body.textContent).toContain('Info message')
    wrapper.unmount()
  })

  it('renders multiple toasts', () => {
    mockToasts.value = [
      { id: '1', message: 'First', type: 'success' },
      { id: '2', message: 'Second', type: 'error' },
    ]
    const wrapper = mount(Toast, { attachTo: document.body })
    expect(document.body.textContent).toContain('First')
    expect(document.body.textContent).toContain('Second')
    wrapper.unmount()
  })
})
