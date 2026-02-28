import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import SubscriptionManagement from '../subscription/SubscriptionManagement.vue'
import { useAuthStore } from '../../stores/auth'
import { useSubscriptionStore } from '../../stores/subscription'

vi.mock('../../services/TelemetryService', () => ({
  telemetryService: {
    track: vi.fn(),
    trackPlanUpgradeStarted: vi.fn(),
    trackPlanUpgradeCompleted: vi.fn(),
  },
}))

vi.mock('../../stripe-config', () => ({
  getProductByPriceId: vi.fn((priceId: string) => {
    if (priceId === 'price_basic_monthly') {
      return { name: 'Basic Plan', price: 29, priceId: 'price_basic_monthly', tier: 'basic', tokenLimit: 10 }
    }
    if (priceId === 'price_professional_monthly') {
      return { name: 'Professional Plan', price: 99, priceId: 'price_professional_monthly', tier: 'professional', tokenLimit: 'unlimited' }
    }
    return null
  }),
  stripeProducts: [],
}))

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/account/subscription', name: 'SubscriptionManagement', component: SubscriptionManagement },
    { path: '/subscription/pricing', name: 'Pricing', component: { template: '<div>Pricing</div>' } },
    { path: '/account/billing', name: 'BillingHistory', component: { template: '<div>Billing</div>' } },
    { path: '/account/usage', name: 'UsageTracking', component: { template: '<div>Usage</div>' } },
    { path: '/', name: 'Home', component: { template: '<div>Home</div>' } },
  ],
})

const mountComponent = () =>
  mount(SubscriptionManagement, {
    global: { plugins: [createPinia(), router] },
  })

describe('SubscriptionManagement View', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('unauthenticated state', () => {
    it('shows sign-in required message when not authenticated', async () => {
      const wrapper = mountComponent()
      await flushPromises()
      expect(wrapper.text()).toContain('Sign In Required')
    })

    it('does not show current plan card when not authenticated', async () => {
      const wrapper = mountComponent()
      await flushPromises()
      expect(wrapper.find('[data-testid="current-plan-card"]').exists()).toBe(false)
    })
  })

  describe('authenticated state', () => {
    beforeEach(() => {
      localStorage.setItem('algorand_user', JSON.stringify({
        address: 'TESTADDR123',
        email: 'test@example.com',
        isConnected: true,
      }))
    })

    it('shows current plan card when authenticated', async () => {
      const wrapper = mountComponent()
      const authStore = useAuthStore()
      authStore.isConnected = true
      authStore.user = { address: 'TESTADDR123', email: 'test@example.com' } as any
      await flushPromises()
      expect(wrapper.find('[data-testid="current-plan-card"]').exists()).toBe(true)
    })

    it('shows "Free" plan name when no subscription', async () => {
      const wrapper = mountComponent()
      const authStore = useAuthStore()
      authStore.isConnected = true
      authStore.user = { address: 'TESTADDR123', email: 'test@example.com' } as any
      await flushPromises()
      expect(wrapper.find('[data-testid="plan-name"]').text()).toBe('Free')
    })

    it('shows active plan name when subscribed', async () => {
      const wrapper = mountComponent()
      const authStore = useAuthStore()
      authStore.isConnected = true
      authStore.user = { address: 'TESTADDR123', email: 'test@example.com' } as any
      const subscriptionStore = useSubscriptionStore()
      subscriptionStore.subscription = {
        customer_id: 'cus_123',
        subscription_id: 'sub_123',
        subscription_status: 'active',
        price_id: 'price_basic_monthly',
        current_period_start: null,
        current_period_end: Math.floor(Date.now() / 1000) + 86400 * 30,
        cancel_at_period_end: false,
        payment_method_brand: null,
        payment_method_last4: null,
      }
      await flushPromises()
      expect(wrapper.find('[data-testid="plan-name"]').text()).toBe('Basic Plan')
    })

    it('shows "Active" status badge for active subscription', async () => {
      const wrapper = mountComponent()
      const authStore = useAuthStore()
      authStore.isConnected = true
      authStore.user = { address: 'TESTADDR123', email: 'test@example.com' } as any
      const subscriptionStore = useSubscriptionStore()
      subscriptionStore.subscription = {
        customer_id: 'cus_123',
        subscription_id: 'sub_123',
        subscription_status: 'active',
        price_id: 'price_basic_monthly',
        current_period_start: null,
        current_period_end: null,
        cancel_at_period_end: false,
        payment_method_brand: null,
        payment_method_last4: null,
      }
      await flushPromises()
      expect(wrapper.find('[data-testid="plan-status"]').text()).toBe('Active')
    })

    it('shows "Cancelling" status when cancel_at_period_end is true', async () => {
      const wrapper = mountComponent()
      const authStore = useAuthStore()
      authStore.isConnected = true
      authStore.user = { address: 'TESTADDR123', email: 'test@example.com' } as any
      const subscriptionStore = useSubscriptionStore()
      subscriptionStore.subscription = {
        customer_id: 'cus_123',
        subscription_id: 'sub_123',
        subscription_status: 'active',
        price_id: 'price_basic_monthly',
        current_period_start: null,
        current_period_end: Math.floor(Date.now() / 1000) + 86400 * 30,
        cancel_at_period_end: true,
        payment_method_brand: null,
        payment_method_last4: null,
      }
      await flushPromises()
      expect(wrapper.find('[data-testid="plan-status"]').text()).toBe('Cancelling')
    })

    it('shows past due banner when subscription is past_due', async () => {
      const wrapper = mountComponent()
      const authStore = useAuthStore()
      authStore.isConnected = true
      authStore.user = { address: 'TESTADDR123', email: 'test@example.com' } as any
      const subscriptionStore = useSubscriptionStore()
      subscriptionStore.subscription = {
        customer_id: 'cus_123',
        subscription_id: 'sub_123',
        subscription_status: 'past_due',
        price_id: 'price_basic_monthly',
        current_period_start: null,
        current_period_end: null,
        cancel_at_period_end: false,
        payment_method_brand: null,
        payment_method_last4: null,
      }
      await flushPromises()
      expect(wrapper.find('[data-testid="past-due-banner"]').exists()).toBe(true)
      expect(wrapper.text()).toContain('Payment Past Due')
    })

    it('shows payment method details when available', async () => {
      const wrapper = mountComponent()
      const authStore = useAuthStore()
      authStore.isConnected = true
      authStore.user = { address: 'TESTADDR123', email: 'test@example.com' } as any
      const subscriptionStore = useSubscriptionStore()
      subscriptionStore.subscription = {
        customer_id: 'cus_123',
        subscription_id: 'sub_123',
        subscription_status: 'active',
        price_id: 'price_basic_monthly',
        current_period_start: null,
        current_period_end: null,
        cancel_at_period_end: false,
        payment_method_brand: 'visa',
        payment_method_last4: '4242',
      }
      await flushPromises()
      expect(wrapper.find('[data-testid="payment-brand"]').text()).toBe('visa')
      expect(wrapper.find('[data-testid="payment-last4"]').text()).toContain('4242')
    })

    it('shows "No payment method on file" when no payment method', async () => {
      const wrapper = mountComponent()
      const authStore = useAuthStore()
      authStore.isConnected = true
      authStore.user = { address: 'TESTADDR123', email: 'test@example.com' } as any
      const subscriptionStore = useSubscriptionStore()
      subscriptionStore.subscription = {
        customer_id: 'cus_123',
        subscription_id: null,
        subscription_status: 'not_started',
        price_id: null,
        current_period_start: null,
        current_period_end: null,
        cancel_at_period_end: false,
        payment_method_brand: null,
        payment_method_last4: null,
      }
      await flushPromises()
      expect(wrapper.find('[data-testid="payment-method-card"]').text()).toContain('No payment method on file')
    })

    it('shows cancel subscription button for active subscriptions', async () => {
      const wrapper = mountComponent()
      const authStore = useAuthStore()
      authStore.isConnected = true
      authStore.user = { address: 'TESTADDR123', email: 'test@example.com' } as any
      const subscriptionStore = useSubscriptionStore()
      subscriptionStore.subscription = {
        customer_id: 'cus_123',
        subscription_id: 'sub_123',
        subscription_status: 'active',
        price_id: 'price_basic_monthly',
        current_period_start: null,
        current_period_end: Math.floor(Date.now() / 1000) + 86400 * 30,
        cancel_at_period_end: false,
        payment_method_brand: null,
        payment_method_last4: null,
      }
      await flushPromises()
      expect(wrapper.find('[data-testid="cancel-subscription-btn"]').exists()).toBe(true)
    })

    it('shows reactivate button when cancel_at_period_end is true', async () => {
      const wrapper = mountComponent()
      const authStore = useAuthStore()
      authStore.isConnected = true
      authStore.user = { address: 'TESTADDR123', email: 'test@example.com' } as any
      const subscriptionStore = useSubscriptionStore()
      subscriptionStore.subscription = {
        customer_id: 'cus_123',
        subscription_id: 'sub_123',
        subscription_status: 'active',
        price_id: 'price_basic_monthly',
        current_period_start: null,
        current_period_end: Math.floor(Date.now() / 1000) + 86400 * 30,
        cancel_at_period_end: true,
        payment_method_brand: null,
        payment_method_last4: null,
      }
      await flushPromises()
      expect(wrapper.find('[data-testid="reactivate-btn"]').exists()).toBe(true)
    })

    it('shows quick links to billing history and usage tracking', async () => {
      const wrapper = mountComponent()
      const authStore = useAuthStore()
      authStore.isConnected = true
      authStore.user = { address: 'TESTADDR123', email: 'test@example.com' } as any
      await flushPromises()
      expect(wrapper.find('[data-testid="billing-history-link"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="usage-tracking-link"]').exists()).toBe(true)
    })

    it('opens cancel modal when cancel button is clicked', async () => {
      const wrapper = mountComponent()
      const authStore = useAuthStore()
      authStore.isConnected = true
      authStore.user = { address: 'TESTADDR123', email: 'test@example.com' } as any
      const subscriptionStore = useSubscriptionStore()
      subscriptionStore.subscription = {
        customer_id: 'cus_123',
        subscription_id: 'sub_123',
        subscription_status: 'active',
        price_id: 'price_basic_monthly',
        current_period_start: null,
        current_period_end: Math.floor(Date.now() / 1000) + 86400 * 30,
        cancel_at_period_end: false,
        payment_method_brand: null,
        payment_method_last4: null,
      }
      await flushPromises()
      await wrapper.find('[data-testid="cancel-subscription-btn"]').trigger('click')
      await flushPromises()
      expect(wrapper.find('[data-testid="cancel-modal"]').exists()).toBe(true)
    })

    it('shows page heading', async () => {
      const wrapper = mountComponent()
      await flushPromises()
      expect(wrapper.text()).toContain('Subscription Management')
    })
  })
})
