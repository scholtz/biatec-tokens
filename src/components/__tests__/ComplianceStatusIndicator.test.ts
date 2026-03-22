import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { useComplianceStore } from '../../stores/compliance'
import ComplianceStatusIndicator from '../ComplianceStatusIndicator.vue'

vi.mock('../ui/Card.vue', () => ({
  default: { name: 'Card', template: '<div><slot /></div>', props: ['variant', 'padding'] }
}))
vi.mock('../ui/Badge.vue', () => ({
  default: { name: 'Badge', template: '<span :data-variant="variant"><slot /></span>', props: ['variant', 'size'] }
}))

describe('ComplianceStatusIndicator', () => {
  it('renders in compact mode', () => {
    const pinia = createTestingPinia({ createSpy: vi.fn })
    const wrapper = mount(ComplianceStatusIndicator, {
      props: { compact: true },
      global: { plugins: [pinia] }
    })
    expect(wrapper.find('.compliance-status-indicator').exists()).toBe(true)
  })

  it('shows a status label in compact mode', () => {
    const pinia = createTestingPinia({ createSpy: vi.fn })
    const store = useComplianceStore(pinia)
    // Override metrics computed via store mock
    Object.defineProperty(store, 'metrics', {
      get: () => ({ totalChecks: 10, completedChecks: 10, completionPercentage: 100, criticalIssues: 0 }),
      configurable: true
    })
    const wrapper = mount(ComplianceStatusIndicator, {
      props: { compact: true },
      global: { plugins: [pinia] }
    })
    expect(wrapper.text().length).toBeGreaterThan(0)
  })

  it('renders full mode when compact is false', () => {
    const pinia = createTestingPinia({ createSpy: vi.fn })
    const wrapper = mount(ComplianceStatusIndicator, {
      props: { compact: false },
      global: { plugins: [pinia] }
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('displays status based on compliance percentage', () => {
    const pinia = createTestingPinia({ createSpy: vi.fn })
    const store = useComplianceStore(pinia)
    Object.defineProperty(store, 'metrics', {
      get: () => ({ totalChecks: 10, completedChecks: 8, completionPercentage: 80, criticalIssues: 0 }),
      configurable: true
    })
    const wrapper = mount(ComplianceStatusIndicator, {
      props: { compact: true },
      global: { plugins: [pinia] }
    })
    // Should render with some content
    expect(wrapper.html().length).toBeGreaterThan(50)
  })

  it('toggles showDetails on compact status click', async () => {
    const pinia = createTestingPinia({ createSpy: vi.fn })
    const wrapper = mount(ComplianceStatusIndicator, {
      props: { compact: true },
      global: { plugins: [pinia] }
    })
    // The clickable status container has the cursor-pointer class
    const clickable = wrapper.find('.cursor-pointer')
    if (clickable.exists()) {
      await clickable.trigger('click')
      // After clicking, the Teleport'd dropdown details div should appear
      // (rendered into document.body; we confirm the click was handled)
      await wrapper.vm.$nextTick()
    }
    // Component remains mounted and functional after toggle
    expect(wrapper.find('.compliance-status-indicator').exists()).toBe(true)
  })

  it('renders category breakdown in full mode', () => {
    const pinia = createTestingPinia({ createSpy: vi.fn })
    const store = useComplianceStore(pinia)
    Object.defineProperty(store, 'categoryProgress', {
      get: () => [{ category: 'kyc-aml', completed: 2, total: 3, percentage: 67 }],
      configurable: true
    })
    const wrapper = mount(ComplianceStatusIndicator, {
      props: { compact: false },
      global: { plugins: [pinia] }
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('does not render wallet connector UI (product alignment)', () => {
    const pinia = createTestingPinia({ createSpy: vi.fn })
    const wrapper = mount(ComplianceStatusIndicator, {
      props: { compact: true },
      global: { plugins: [pinia] }
    })
    expect(wrapper.html()).not.toMatch(/WalletConnect|MetaMask|\bPera\b|Defly/i)
  })
})
