import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import FeatureGate from './FeatureGate.vue'
import { useSubscriptionStore } from '../stores/subscription'

vi.mock('../stores/subscription', () => ({
  useSubscriptionStore: vi.fn()
}))

vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
  RouterLink: {
    name: 'RouterLink',
    props: ['to'],
    template: '<a :href="to"><slot /></a>',
  },
}))

const mockStore = (hasAccess: boolean) => {
  vi.mocked(useSubscriptionStore).mockReturnValue({
    hasFeatureAccess: vi.fn(() => hasAccess),
    isActive: hasAccess,
    isInTrial: false,
    currentTier: hasAccess ? 'professional' : null,
  } as ReturnType<typeof useSubscriptionStore>)
}

describe('FeatureGate Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('when user has access', () => {
    it('should render slot content when user has required tier', () => {
      mockStore(true)

      const wrapper = mount(FeatureGate, {
        props: { requiredTier: 'professional' },
        slots: { default: '<div data-testid="protected-content">Premium Feature</div>' },
        global: {
          stubs: { RouterLink: { template: '<a><slot /></a>' } },
        },
      })

      expect(wrapper.find('[data-testid="protected-content"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="feature-gate"]').exists()).toBe(false)
    })
  })

  describe('when user lacks access', () => {
    it('should show gate overlay when user lacks required tier', () => {
      mockStore(false)

      const wrapper = mount(FeatureGate, {
        props: { requiredTier: 'professional' },
        slots: { default: '<div>Premium Feature</div>' },
        global: {
          stubs: { RouterLink: { template: '<a><slot /></a>' } },
        },
      })

      expect(wrapper.find('[data-testid="feature-gate"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="feature-gate-overlay"]').exists()).toBe(true)
    })

    it('should show default title based on requiredTier', () => {
      mockStore(false)

      const wrapper = mount(FeatureGate, {
        props: { requiredTier: 'enterprise' },
        global: {
          stubs: { RouterLink: { template: '<a><slot /></a>' } },
        },
      })

      expect(wrapper.find('[data-testid="feature-gate-title"]').text()).toContain('Enterprise')
    })

    it('should show custom title when provided', () => {
      mockStore(false)

      const wrapper = mount(FeatureGate, {
        props: { requiredTier: 'professional', title: 'Unlock Advanced Analytics' },
        global: {
          stubs: { RouterLink: { template: '<a><slot /></a>' } },
        },
      })

      expect(wrapper.find('[data-testid="feature-gate-title"]').text()).toBe('Unlock Advanced Analytics')
    })

    it('should show custom description when provided', () => {
      mockStore(false)

      const wrapper = mount(FeatureGate, {
        props: { requiredTier: 'professional', description: 'Upgrade now to unlock this feature' },
        global: {
          stubs: { RouterLink: { template: '<a><slot /></a>' } },
        },
      })

      expect(wrapper.find('[data-testid="feature-gate-description"]').text()).toBe(
        'Upgrade now to unlock this feature'
      )
    })

    it('should show upgrade CTA link', () => {
      mockStore(false)

      const wrapper = mount(FeatureGate, {
        props: { requiredTier: 'professional' },
        global: {
          stubs: { RouterLink: { template: '<a :href="to"><slot /></a>' } },
        },
      })

      const cta = wrapper.find('[data-testid="feature-gate-upgrade-cta"]')
      expect(cta.exists()).toBe(true)
    })

    it('should show custom CTA text when provided', () => {
      mockStore(false)

      const wrapper = mount(FeatureGate, {
        props: { requiredTier: 'basic', ctaText: 'Get Basic Plan' },
        global: {
          stubs: { RouterLink: { template: '<a><slot /></a>' } },
        },
      })

      expect(wrapper.find('[data-testid="feature-gate-upgrade-cta"]').text()).toBe('Get Basic Plan')
    })

    it('should show default description mentioning the required tier', () => {
      mockStore(false)

      const wrapper = mount(FeatureGate, {
        props: { requiredTier: 'enterprise' },
        global: {
          stubs: { RouterLink: { template: '<a><slot /></a>' } },
        },
      })

      const desc = wrapper.find('[data-testid="feature-gate-description"]').text()
      expect(desc).toContain('Enterprise')
    })

    it('should not render slot content in gate mode (no showPreview)', () => {
      mockStore(false)

      const wrapper = mount(FeatureGate, {
        props: { requiredTier: 'professional' },
        slots: { default: '<div data-testid="protected-content">Protected</div>' },
        global: {
          stubs: { RouterLink: { template: '<a><slot /></a>' } },
        },
      })

      // Without showPreview, slot content should not be in DOM
      expect(wrapper.find('[data-testid="protected-content"]').exists()).toBe(false)
    })

    it('should render blurred preview slot when showPreview is true', () => {
      mockStore(false)

      const wrapper = mount(FeatureGate, {
        props: { requiredTier: 'professional', showPreview: true },
        slots: { default: '<div data-testid="protected-preview">Blurred Content</div>' },
        global: {
          stubs: { RouterLink: { template: '<a><slot /></a>' } },
        },
      })

      expect(wrapper.find('[data-testid="protected-preview"]').exists()).toBe(true)
    })
  })

  describe('tier labels', () => {
    it.each([
      ['basic', 'Basic'],
      ['professional', 'Professional'],
      ['enterprise', 'Enterprise'],
    ] as const)('should display correct label for %s tier', (tier, label) => {
      mockStore(false)

      const wrapper = mount(FeatureGate, {
        props: { requiredTier: tier },
        global: {
          stubs: { RouterLink: { template: '<a><slot /></a>' } },
        },
      })

      expect(wrapper.find('[data-testid="feature-gate-title"]').text()).toContain(label)
    })
  })
})
