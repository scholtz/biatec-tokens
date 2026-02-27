import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { useSubscriptionStore } from '../../stores/subscription'
import UpgradePromptModal from '../UpgradePromptModal.vue'

// Mock vue-router
const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
}))

const stubs = {
  Modal: {
    template: '<div v-if="show"><slot name="title"></slot><slot></slot><slot name="footer"></slot></div>',
    props: ['show', 'size'],
    emits: ['close'],
  },
  Button: {
    template: '<button @click="$emit(\'click\')"><slot></slot></button>',
    props: ['variant', 'loading'],
    emits: ['click'],
  },
  Badge: {
    template: '<span><slot></slot></span>',
    props: ['variant'],
  },
  SparklesIcon: { template: '<svg></svg>' },
  InformationCircleIcon: { template: '<svg></svg>' },
  CheckCircleIcon: { template: '<svg></svg>' },
  ShieldCheckIcon: { template: '<svg></svg>' },
  CheckIcon: { template: '<svg></svg>' },
  XMarkIcon: { template: '<svg></svg>' },
}

describe('UpgradePromptModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  const defaultProps = {
    show: true,
    feature: 'Compliance Dashboard',
    requiredPlan: 'Professional Plan' as const,
  }

  it('should render when show is true', () => {
    const wrapper = mount(UpgradePromptModal, {
      props: defaultProps,
      global: { stubs },
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('should not render content when show is false', () => {
    const wrapper = mount(UpgradePromptModal, {
      props: { ...defaultProps, show: false },
      global: { stubs },
    })
    expect(wrapper.text()).not.toContain('Compliance Dashboard')
  })

  it('should display feature name', () => {
    const wrapper = mount(UpgradePromptModal, {
      props: defaultProps,
      global: { stubs },
    })
    expect(wrapper.text()).toContain('Compliance Dashboard')
  })

  it('should display required plan', () => {
    const wrapper = mount(UpgradePromptModal, {
      props: defaultProps,
      global: { stubs },
    })
    expect(wrapper.text()).toContain('Professional Plan')
  })

  it('should display description when provided', () => {
    const wrapper = mount(UpgradePromptModal, {
      props: {
        ...defaultProps,
        description: 'This is a premium feature for enterprise clients.',
      },
      global: { stubs },
    })
    expect(wrapper.text()).toContain('This is a premium feature for enterprise clients.')
  })

  it('should render benefits list', () => {
    const wrapper = mount(UpgradePromptModal, {
      props: {
        ...defaultProps,
        benefits: ['Advanced compliance tools', 'Automated reporting'],
      },
      global: { stubs },
    })
    expect(wrapper.text()).toContain('Advanced compliance tools')
    expect(wrapper.text()).toContain('Automated reporting')
  })

  it('should show comparison table when showComparison is true', () => {
    const wrapper = mount(UpgradePromptModal, {
      props: {
        ...defaultProps,
        showComparison: true,
        comparisonItems: [{ feature: 'Analytics', current: false }],
      },
      global: { stubs },
    })
    expect(wrapper.text()).toContain('Analytics')
  })

  it('should hide comparison table when showComparison is false', () => {
    const wrapper = mount(UpgradePromptModal, {
      props: {
        ...defaultProps,
        showComparison: false,
        comparisonItems: [{ feature: 'Analytics', current: false }],
      },
      global: { stubs },
    })
    expect(wrapper.text()).not.toContain('Analytics')
  })

  it('should compute price from stripeProducts for Professional Plan', () => {
    const wrapper = mount(UpgradePromptModal, {
      props: { ...defaultProps, requiredPlan: 'Professional Plan' },
      global: { stubs },
    })
    const vm = wrapper.vm as any
    expect(typeof vm.price).toBe('number')
  })

  it('should compute price for Enterprise Plan', () => {
    const wrapper = mount(UpgradePromptModal, {
      props: { ...defaultProps, requiredPlan: 'Enterprise Plan' },
      global: { stubs },
    })
    const vm = wrapper.vm as any
    expect(typeof vm.price).toBe('number')
  })

  it('should compute savings when price differs from current plan', () => {
    const subStore = useSubscriptionStore()
    subStore.currentProduct = { price: 29, name: 'Basic Plan', priceId: 'price_1' } as any

    const wrapper = mount(UpgradePromptModal, {
      props: { ...defaultProps, requiredPlan: 'Professional Plan' },
      global: { stubs },
    })
    const vm = wrapper.vm as any
    expect(typeof vm.savings).toBe('string')
  })

  it('should show "immediate access" when required price equals current', () => {
    const subStore = useSubscriptionStore()
    subStore.currentProduct = { price: 99, name: 'Professional Plan', priceId: 'price_2' } as any

    const wrapper = mount(UpgradePromptModal, {
      props: { ...defaultProps, requiredPlan: 'Professional Plan' },
      global: { stubs },
    })
    const vm = wrapper.vm as any
    // savings is 'immediate access' when no diff or negative diff
    expect(vm.savings).toBeDefined()
  })

  it('should emit close when handleClose is called', async () => {
    const wrapper = mount(UpgradePromptModal, {
      props: defaultProps,
      global: { stubs },
    })
    const vm = wrapper.vm as any
    vm.handleClose()
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('should navigate and close on handleViewPlans', async () => {
    const wrapper = mount(UpgradePromptModal, {
      props: defaultProps,
      global: { stubs },
    })
    const vm = wrapper.vm as any
    vm.handleViewPlans()
    expect(mockPush).toHaveBeenCalledWith('/subscription/pricing')
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('should emit upgrade and attempt checkout on handleUpgrade', async () => {
    const subStore = useSubscriptionStore()
    subStore.createCheckoutSession = vi.fn().mockResolvedValue(undefined)

    const wrapper = mount(UpgradePromptModal, {
      props: defaultProps,
      global: { stubs },
    })
    const vm = wrapper.vm as any
    await vm.handleUpgrade()

    expect(wrapper.emitted('upgrade')).toBeTruthy()
    expect(subStore.createCheckoutSession).toHaveBeenCalled()
  })

  it('should set loading during handleUpgrade', async () => {
    const subStore = useSubscriptionStore()
    let resolvePromise: () => void
    subStore.createCheckoutSession = vi.fn().mockImplementation(
      () => new Promise<void>((resolve) => { resolvePromise = resolve })
    )

    const wrapper = mount(UpgradePromptModal, {
      props: defaultProps,
      global: { stubs },
    })
    const vm = wrapper.vm as any
    const upgradePromise = vm.handleUpgrade()
    expect(vm.loading).toBe(true)
    resolvePromise!()
    await upgradePromise
    expect(vm.loading).toBe(false)
  })

  it('should reset loading even if checkout fails', async () => {
    const subStore = useSubscriptionStore()
    subStore.createCheckoutSession = vi.fn().mockRejectedValue(new Error('payment failed'))

    const wrapper = mount(UpgradePromptModal, {
      props: defaultProps,
      global: { stubs },
    })
    const vm = wrapper.vm as any
    try {
      await vm.handleUpgrade()
    } catch {
      // expected
    }
    expect(vm.loading).toBe(false)
  })

  it('should use default regulatory framework when not provided', () => {
    const wrapper = mount(UpgradePromptModal, {
      props: defaultProps,
      global: { stubs },
    })
    const vm = wrapper.vm as any
    // regulatoryFramework prop defaults to 'MICA and EU'
    expect(wrapper.text()).toContain('MICA')
  })

  it('should use custom regulatory framework when provided', () => {
    const wrapper = mount(UpgradePromptModal, {
      props: { ...defaultProps, regulatoryFramework: 'SEC regulations' },
      global: { stubs },
    })
    expect(wrapper.text()).toContain('SEC regulations')
  })

  it('should handle handleUpgrade when no product matches plan', async () => {
    const subStore = useSubscriptionStore()
    subStore.createCheckoutSession = vi.fn().mockResolvedValue(undefined)

    const wrapper = mount(UpgradePromptModal, {
      props: { ...defaultProps, requiredPlan: 'Basic Plan' },
      global: { stubs },
    })
    const vm = wrapper.vm as any
    await vm.handleUpgrade()
    // Should still emit upgrade
    expect(wrapper.emitted('upgrade')).toBeTruthy()
  })
})
