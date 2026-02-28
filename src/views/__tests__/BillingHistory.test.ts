import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import BillingHistory from '../subscription/BillingHistory.vue'
import { useAuthStore } from '../../stores/auth'
import { useSubscriptionStore } from '../../stores/subscription'

vi.mock('../../services/TelemetryService', () => ({
  telemetryService: {
    track: vi.fn(),
  },
}))

vi.mock('../../stripe-config', () => ({
  getProductByPriceId: vi.fn((priceId: string) => {
    if (priceId === 'price_basic_monthly') {
      return { name: 'Basic Plan', price: 29, priceId: 'price_basic_monthly', tier: 'basic' }
    }
    if (priceId === 'price_professional_monthly') {
      return { name: 'Professional Plan', price: 99, priceId: 'price_professional_monthly', tier: 'professional' }
    }
    return null
  }),
  stripeProducts: [],
}))

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/account/billing', name: 'BillingHistory', component: BillingHistory },
    { path: '/account/subscription', name: 'SubscriptionManagement', component: { template: '<div>Sub</div>' } },
    { path: '/subscription/pricing', name: 'Pricing', component: { template: '<div>Pricing</div>' } },
    { path: '/', name: 'Home', component: { template: '<div>Home</div>' } },
  ],
})

const mountComponent = () =>
  mount(BillingHistory, {
    global: { plugins: [createPinia(), router] },
  })

describe('BillingHistory View', () => {
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

    it('does not show invoice list when not authenticated', async () => {
      const wrapper = mountComponent()
      await flushPromises()
      expect(wrapper.find('[data-testid="invoice-list"]').exists()).toBe(false)
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

    it('shows page heading', async () => {
      const wrapper = mountComponent()
      await flushPromises()
      expect(wrapper.text()).toContain('Billing History')
    })

    it('shows invoice list when authenticated', async () => {
      const wrapper = mountComponent()
      const authStore = useAuthStore()
      authStore.isConnected = true
      authStore.user = { address: 'TESTADDR123', email: 'test@example.com' } as any
      await flushPromises()
      expect(wrapper.find('[data-testid="invoice-list"]').exists()).toBe(true)
    })

    it('shows empty state when no subscription product', async () => {
      const wrapper = mountComponent()
      const authStore = useAuthStore()
      authStore.isConnected = true
      authStore.user = { address: 'TESTADDR123', email: 'test@example.com' } as any
      const subscriptionStore = useSubscriptionStore()
      subscriptionStore.subscription = null
      await flushPromises()
      // Wait for async fetchInvoices (500ms delay)
      await new Promise(r => setTimeout(r, 600))
      await flushPromises()
      expect(wrapper.find('[data-testid="empty-state"]').exists()).toBe(true)
      expect(wrapper.text()).toContain('No invoices yet')
    })

    it('shows invoice rows when subscribed', async () => {
      // Set up store BEFORE mounting so fetchSubscription skips (already active)
      const pinia = createPinia()
      setActivePinia(pinia)
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
      const wrapper = mount(BillingHistory, {
        global: { plugins: [pinia, router] },
      })
      await flushPromises()
      await new Promise(r => setTimeout(r, 600))
      await flushPromises()
      const rows = wrapper.findAll('[data-testid="invoice-row"]')
      expect(rows.length).toBeGreaterThan(0)
    })

    it('shows failed payment banner for past_due subscriptions', async () => {
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
      expect(wrapper.find('[data-testid="failed-payment-banner"]').exists()).toBe(true)
      expect(wrapper.text()).toContain('Payment Failed')
    })

    it('shows back to subscription button', async () => {
      const wrapper = mountComponent()
      const authStore = useAuthStore()
      authStore.isConnected = true
      authStore.user = { address: 'TESTADDR123', email: 'test@example.com' } as any
      await flushPromises()
      expect(wrapper.find('[data-testid="back-to-subscription-btn"]').exists()).toBe(true)
    })

    it('shows update payment CTA in failed payment banner', async () => {
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
      const banner = wrapper.find('[data-testid="failed-payment-banner"]')
      expect(banner.find('[data-testid="update-payment-cta"]').exists()).toBe(true)
    })
  })
})
