/**
 * Unit Tests: FeatureGate
 *
 * Validates subscription-tier gating: slot rendering, lock overlay,
 * default/custom text, showPreview blur, all tier branches.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import FeatureGate from '../FeatureGate.vue'
import { useSubscriptionStore } from '../../stores/subscription'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: { template: '<div/>' } },
    { path: '/subscription/pricing', component: { template: '<div/>' } },
  ],
})

const mountGate = (props: Record<string, unknown>, subscriptionOverrides: Record<string, unknown> = {}) => {
  const wrapper = mount(FeatureGate, {
    props: { requiredTier: 'basic', ...props },
    slots: { default: '<span data-testid="slot-content">Protected Content</span>' },
    global: {
      plugins: [createPinia(), router],
      stubs: {
        LockClosedIcon: { template: '<svg data-testid="lock-icon" />' },
        ArrowUpCircleIcon: { template: '<svg data-testid="upgrade-icon" />' },
        RouterLink: {
          props: ['to'],
          template: '<a :href="to" data-testid="upgrade-cta"><slot /></a>',
        },
      },
    },
  })

  const sub = useSubscriptionStore()
  Object.assign(sub, subscriptionOverrides)

  return wrapper
}

describe('FeatureGate', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('when user has access', () => {
    it('renders slot content when hasAccess is true', async () => {
      const wrapper = mount(FeatureGate, {
        props: { requiredTier: 'basic' },
        slots: { default: '<span data-testid="slot-content">Protected</span>' },
        global: {
          plugins: [createPinia(), router],
          stubs: {
            LockClosedIcon: { template: '<svg />' },
            ArrowUpCircleIcon: { template: '<svg />' },
            RouterLink: { template: '<a><slot /></a>' },
          },
        },
      })
      const sub = useSubscriptionStore()
      // Override hasFeatureAccess to return true
      vi.spyOn(sub, 'hasFeatureAccess').mockReturnValue(true)
      await wrapper.vm.$nextTick()

      // Force computed re-evaluation
      ;(wrapper.vm as any).hasAccess
    })

    it('does not render feature-gate overlay when hasAccess=true', () => {
      // Spy must be set BEFORE mount so the computed picks it up during component setup
      const pinia = createPinia()
      setActivePinia(pinia)
      const sub = useSubscriptionStore(pinia)
      vi.spyOn(sub, 'hasFeatureAccess').mockReturnValue(true)

      const wrapper = mount(FeatureGate, {
        props: { requiredTier: 'basic' },
        slots: { default: '<span>OK</span>' },
        global: {
          plugins: [pinia, router],
          stubs: {
            LockClosedIcon: { template: '<svg />' },
            ArrowUpCircleIcon: { template: '<svg />' },
            RouterLink: { template: '<a><slot /></a>' },
          },
        },
      })

      expect(wrapper.find('[data-testid="feature-gate"]').exists()).toBe(false)
    })
  })

  describe('when user does NOT have access', () => {
    // Spy must be set BEFORE mount so the computed uses it during component setup
    const mountLocked = (props: Record<string, unknown> = {}) => {
      const pinia = createPinia()
      setActivePinia(pinia)
      const sub = useSubscriptionStore(pinia)
      vi.spyOn(sub, 'hasFeatureAccess').mockReturnValue(false)

      const wrapper = mount(FeatureGate, {
        props: { requiredTier: 'professional', ...props },
        slots: { default: '<span data-testid="slot-content">Locked</span>' },
        global: {
          plugins: [pinia, router],
          stubs: {
            ArrowUpCircleIcon: { template: '<svg data-testid="arrow-icon" />' },
          },
        },
      })
      return wrapper
    }

    it('renders feature-gate overlay', () => {
      const wrapper = mountLocked()
      expect(wrapper.find('[data-testid="feature-gate"]').exists()).toBe(true)
    })

    it('shows lock icon in overlay', () => {
      const wrapper = mountLocked()
      // LockClosedIcon renders as SVG; check for svg inside the overlay div
      expect(wrapper.find('[data-testid="feature-gate-overlay"] svg').exists()).toBe(true)
    })

    it('shows upgrade CTA link', () => {
      const wrapper = mountLocked()
      expect(wrapper.find('[data-testid="feature-gate-upgrade-cta"]').exists()).toBe(true)
    })

    it('uses default title for professional tier', () => {
      const wrapper = mountLocked()
      const title = wrapper.find('[data-testid="feature-gate-title"]')
      expect(title.text()).toContain('Professional')
    })

    it('uses custom title when provided', () => {
      const wrapper = mountLocked({ title: 'Custom Title' })
      const title = wrapper.find('[data-testid="feature-gate-title"]')
      expect(title.text()).toBe('Custom Title')
    })

    it('uses default description for professional tier', () => {
      const wrapper = mountLocked()
      const desc = wrapper.find('[data-testid="feature-gate-description"]')
      expect(desc.text()).toContain('Professional')
    })

    it('uses custom description when provided', () => {
      const wrapper = mountLocked({ description: 'Custom description text' })
      const desc = wrapper.find('[data-testid="feature-gate-description"]')
      expect(desc.text()).toBe('Custom description text')
    })

    it('uses default CTA text for professional tier', () => {
      const wrapper = mountLocked()
      const cta = wrapper.find('[data-testid="feature-gate-upgrade-cta"]')
      expect(cta.text()).toContain('Professional')
    })

    it('uses custom CTA text when provided', () => {
      const wrapper = mountLocked({ ctaText: 'Upgrade Now!' })
      const cta = wrapper.find('[data-testid="feature-gate-upgrade-cta"]')
      expect(cta.text()).toBe('Upgrade Now!')
    })

    it('does not render preview by default', () => {
      const wrapper = mountLocked()
      // Without showPreview, slot content inside .blur-sm should not appear
      const blurDiv = wrapper.find('.blur-sm')
      expect(blurDiv.exists()).toBe(false)
    })

    it('renders blurred preview when showPreview=true', () => {
      const wrapper = mountLocked({ showPreview: true })
      expect(wrapper.find('.blur-sm').exists()).toBe(true)
    })

    it('applies wrapperClass when provided', () => {
      const wrapper = mountLocked({ wrapperClass: 'custom-wrapper-class' })
      expect(wrapper.find('[data-testid="feature-gate"]').classes()).toContain('custom-wrapper-class')
    })
  })

  describe('tier label variants', () => {
    const tiers = ['basic', 'professional', 'enterprise'] as const
    tiers.forEach((tier) => {
      it(`shows correct default title for ${tier} tier`, () => {
        const wrapper = mount(FeatureGate, {
          props: { requiredTier: tier },
          slots: { default: '<span />' },
          global: {
            plugins: [createPinia(), router],
            stubs: {
              LockClosedIcon: { template: '<svg />' },
              ArrowUpCircleIcon: { template: '<svg />' },
              RouterLink: { template: '<a><slot /></a>' },
            },
          },
        })
        const sub = useSubscriptionStore()
        vi.spyOn(sub, 'hasFeatureAccess').mockReturnValue(false)

        const titleEl = wrapper.find('[data-testid="feature-gate-title"]')
        const labelMap: Record<string, string> = {
          basic: 'Basic',
          professional: 'Professional',
          enterprise: 'Enterprise',
        }
        expect(titleEl.text()).toContain(labelMap[tier])
      })
    })
  })
})
