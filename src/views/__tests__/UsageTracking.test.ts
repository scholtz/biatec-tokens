import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import UsageTracking from '../subscription/UsageTracking.vue'
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
      return { name: 'Basic Plan', price: 29, priceId: 'price_basic_monthly', tier: 'basic', tokenLimit: 10, networks: ['Algorand Testnet', 'VOI Testnet'] }
    }
    if (priceId === 'price_professional_monthly') {
      return { name: 'Professional Plan', price: 99, priceId: 'price_professional_monthly', tier: 'professional', tokenLimit: 'unlimited', networks: ['Algorand Mainnet', 'Algorand Testnet', 'VOI'] }
    }
    return null
  }),
  stripeProducts: [],
}))

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/account/usage', name: 'UsageTracking', component: UsageTracking },
    { path: '/account/subscription', name: 'SubscriptionManagement', component: { template: '<div>Sub</div>' } },
    { path: '/subscription/pricing', name: 'Pricing', component: { template: '<div>Pricing</div>' } },
    { path: '/', name: 'Home', component: { template: '<div>Home</div>' } },
  ],
})

const mountComponent = () =>
  mount(UsageTracking, {
    global: { plugins: [createPinia(), router] },
  })

describe('UsageTracking View', () => {
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

    it('does not show plan summary when not authenticated', async () => {
      const wrapper = mountComponent()
      await flushPromises()
      expect(wrapper.find('[data-testid="plan-summary"]').exists()).toBe(false)
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
      expect(wrapper.text()).toContain('Usage & Limits')
    })

    it('shows plan summary card when authenticated', async () => {
      const wrapper = mountComponent()
      const authStore = useAuthStore()
      authStore.isConnected = true
      authStore.user = { address: 'TESTADDR123', email: 'test@example.com' } as any
      await flushPromises()
      expect(wrapper.find('[data-testid="plan-summary"]').exists()).toBe(true)
    })

    it('shows "Free" plan name when no subscription product', async () => {
      const wrapper = mountComponent()
      const authStore = useAuthStore()
      authStore.isConnected = true
      authStore.user = { address: 'TESTADDR123', email: 'test@example.com' } as any
      await flushPromises()
      expect(wrapper.find('[data-testid="current-plan-name"]').text()).toBe('Free')
    })

    it('shows plan name from subscription product', async () => {
      const wrapper = mountComponent()
      const authStore = useAuthStore()
      authStore.isConnected = true
      authStore.user = { address: 'TESTADDR123', email: 'test@example.com' } as any
      const subscriptionStore = useSubscriptionStore()
      subscriptionStore.subscription = {
        customer_id: 'cus_123',
        subscription_id: 'sub_123',
        subscription_status: 'active',
        price_id: 'price_professional_monthly',
        current_period_start: null,
        current_period_end: null,
        cancel_at_period_end: false,
        payment_method_brand: null,
        payment_method_last4: null,
      }
      await flushPromises()
      expect(wrapper.find('[data-testid="current-plan-name"]').text()).toBe('Professional Plan')
    })

    it('shows tokens usage card', async () => {
      const wrapper = mountComponent()
      const authStore = useAuthStore()
      authStore.isConnected = true
      authStore.user = { address: 'TESTADDR123', email: 'test@example.com' } as any
      await flushPromises()
      expect(wrapper.find('[data-testid="tokens-usage-card"]').exists()).toBe(true)
    })

    it('shows networks usage card', async () => {
      const wrapper = mountComponent()
      const authStore = useAuthStore()
      authStore.isConnected = true
      authStore.user = { address: 'TESTADDR123', email: 'test@example.com' } as any
      await flushPromises()
      expect(wrapper.find('[data-testid="networks-usage-card"]').exists()).toBe(true)
    })

    it('shows API usage card', async () => {
      const wrapper = mountComponent()
      const authStore = useAuthStore()
      authStore.isConnected = true
      authStore.user = { address: 'TESTADDR123', email: 'test@example.com' } as any
      await flushPromises()
      expect(wrapper.find('[data-testid="api-usage-card"]').exists()).toBe(true)
    })

    it('shows upgrade prompt when API access not available on free plan', async () => {
      const wrapper = mountComponent()
      const authStore = useAuthStore()
      authStore.isConnected = true
      authStore.user = { address: 'TESTADDR123', email: 'test@example.com' } as any
      await flushPromises()
      // Free plan has no API access
      const apiCard = wrapper.find('[data-testid="api-usage-card"]')
      expect(apiCard.text()).toContain('Upgrade to Professional to access the API')
    })

    it('shows token limit as "Unlimited" for professional plan', async () => {
      const wrapper = mountComponent()
      const authStore = useAuthStore()
      authStore.isConnected = true
      authStore.user = { address: 'TESTADDR123', email: 'test@example.com' } as any
      const subscriptionStore = useSubscriptionStore()
      subscriptionStore.subscription = {
        customer_id: 'cus_123',
        subscription_id: 'sub_123',
        subscription_status: 'active',
        price_id: 'price_professional_monthly',
        current_period_start: null,
        current_period_end: null,
        cancel_at_period_end: false,
        payment_method_brand: null,
        payment_method_last4: null,
      }
      await flushPromises()
      expect(wrapper.find('[data-testid="tokens-limit"]').text()).toBe('Unlimited')
    })

    it('shows "10" token limit for basic plan', async () => {
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
      expect(wrapper.find('[data-testid="tokens-limit"]').text()).toBe('10')
    })

    it('shows network badges for available networks', async () => {
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
      const badges = wrapper.find('[data-testid="network-badges"]')
      expect(badges.exists()).toBe(true)
    })

    it('shows back to subscription button', async () => {
      const wrapper = mountComponent()
      const authStore = useAuthStore()
      authStore.isConnected = true
      authStore.user = { address: 'TESTADDR123', email: 'test@example.com' } as any
      await flushPromises()
      expect(wrapper.find('[data-testid="back-to-subscription-btn"]').exists()).toBe(true)
    })
  })

  describe('progress bar coloring', () => {
    it('shows approaching limit warning at 80% usage', async () => {
      // Set up store BEFORE mounting so onMounted reads correct values
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
      // Set metrics to 8/10 = 80%
      subscriptionStore.conversionMetrics.successfulCreations = 8
      const wrapper = mount(UsageTracking, {
        global: { plugins: [pinia, router] },
      })
      await flushPromises()
      expect(wrapper.find('[data-testid="tokens-approaching-limit-warning"]').exists()).toBe(true)
    })

    it('shows at-limit warning at 100% usage', async () => {
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
      // Set metrics to 10/10 = 100%
      subscriptionStore.conversionMetrics.successfulCreations = 10
      const wrapper = mount(UsageTracking, {
        global: { plugins: [pinia, router] },
      })
      await flushPromises()
      expect(wrapper.find('[data-testid="tokens-at-limit-warning"]').exists()).toBe(true)
    })

    it('does not show warning when usage is below 80%', async () => {
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
      subscriptionStore.conversionMetrics.successfulCreations = 3
      const wrapper = mount(UsageTracking, {
        global: { plugins: [pinia, router] },
      })
      await flushPromises()
      expect(wrapper.find('[data-testid="tokens-approaching-limit-warning"]').exists()).toBe(false)
      expect(wrapper.find('[data-testid="tokens-at-limit-warning"]').exists()).toBe(false)
    })
  })
})
