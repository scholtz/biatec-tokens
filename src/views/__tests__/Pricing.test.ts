import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import Pricing from '../subscription/Pricing.vue'
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
  ANNUAL_DISCOUNT_PERCENT: 20,
  stripeProducts: [
    { id: 'prod_basic', priceId: 'price_basic_monthly', name: 'Basic Plan', price: 29, interval: 'month', tier: 'basic', tokenLimit: 10 },
    { id: 'prod_professional', priceId: 'price_professional_monthly', name: 'Professional Plan', price: 99, interval: 'month', tier: 'professional', tokenLimit: 'unlimited' },
    { id: 'prod_enterprise', priceId: 'price_enterprise_monthly', name: 'Enterprise Plan', price: 299, interval: 'month', tier: 'enterprise', tokenLimit: 'unlimited' },
    { id: 'prod_basic_annual', priceId: 'price_basic_annual', name: 'Basic Plan', price: 278.40, interval: 'year', tier: 'basic', tokenLimit: 10 },
    { id: 'prod_professional_annual', priceId: 'price_professional_annual', name: 'Professional Plan', price: 950.40, interval: 'year', tier: 'professional', tokenLimit: 'unlimited' },
    { id: 'prod_enterprise_annual', priceId: 'price_enterprise_annual', name: 'Enterprise Plan', price: 2870.40, interval: 'year', tier: 'enterprise', tokenLimit: 'unlimited' },
  ],
  getProductByPriceId: vi.fn((priceId: string) => {
    const products: Record<string, unknown> = {
      'price_basic_monthly': { name: 'Basic Plan', price: 29, priceId: 'price_basic_monthly', tier: 'basic', tokenLimit: 10, interval: 'month' },
      'price_professional_monthly': { name: 'Professional Plan', price: 99, priceId: 'price_professional_monthly', tier: 'professional', tokenLimit: 'unlimited', interval: 'month' },
    }
    return products[priceId] ?? null
  }),
  getProductByTierAndInterval: vi.fn((tier: string, interval: string) => {
    const key = `${tier}_${interval}`
    const products: Record<string, unknown> = {
      'basic_month': { id: 'prod_basic', priceId: 'price_basic_monthly', name: 'Basic Plan', price: 29, interval: 'month', tier: 'basic', tokenLimit: 10 },
      'professional_month': { id: 'prod_professional', priceId: 'price_professional_monthly', name: 'Professional Plan', price: 99, interval: 'month', tier: 'professional', tokenLimit: 'unlimited' },
      'enterprise_month': { id: 'prod_enterprise', priceId: 'price_enterprise_monthly', name: 'Enterprise Plan', price: 299, interval: 'month', tier: 'enterprise', tokenLimit: 'unlimited' },
      'basic_year': { id: 'prod_basic_annual', priceId: 'price_basic_annual', name: 'Basic Plan', price: 278.40, interval: 'year', tier: 'basic', tokenLimit: 10 },
      'professional_year': { id: 'prod_professional_annual', priceId: 'price_professional_annual', name: 'Professional Plan', price: 950.40, interval: 'year', tier: 'professional', tokenLimit: 'unlimited' },
      'enterprise_year': { id: 'prod_enterprise_annual', priceId: 'price_enterprise_annual', name: 'Enterprise Plan', price: 2870.40, interval: 'year', tier: 'enterprise', tokenLimit: 'unlimited' },
    }
    return products[key] ?? null
  }),
  getMonthlyEquivalentPrice: vi.fn((product: { price: number; interval?: string }) => {
    if (product.interval === 'year') return product.price / 12
    return product.price
  }),
}))

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/subscription/pricing', name: 'Pricing', component: Pricing },
    { path: '/subscription/success', name: 'SubscriptionSuccess', component: { template: '<div>Success</div>' } },
    { path: '/account/subscription', name: 'SubscriptionManagement', component: { template: '<div>Sub</div>' } },
    { path: '/', name: 'Home', component: { template: '<div>Home</div>' } },
  ],
})

const mountComponent = () =>
  mount(Pricing, {
    global: { plugins: [createPinia(), router] },
  })

describe('Pricing View', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('page rendering', () => {
    it('renders the main heading', async () => {
      const wrapper = mountComponent()
      await flushPromises()
      expect(wrapper.text()).toContain('Simple, Predictable Pricing')
    })

    it('renders three plan cards with correct data-testid attributes', async () => {
      const wrapper = mountComponent()
      await flushPromises()
      expect(wrapper.find('[data-testid="plan-card-basic"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="plan-card-professional"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="plan-card-enterprise"]').exists()).toBe(true)
    })

    it('displays Basic, Professional, and Enterprise tier names', async () => {
      const wrapper = mountComponent()
      await flushPromises()
      const text = wrapper.text()
      expect(text).toContain('Basic')
      expect(text).toContain('Professional')
      expect(text).toContain('Enterprise')
    })

    it('shows $29 price for Basic plan', async () => {
      const wrapper = mountComponent()
      await flushPromises()
      const priceEl = wrapper.find('[data-testid="basic-price"]')
      expect(priceEl.exists()).toBe(true)
      expect(priceEl.text()).toContain('29')
    })

    it('shows $99 price for Professional plan', async () => {
      const wrapper = mountComponent()
      await flushPromises()
      const priceEl = wrapper.find('[data-testid="professional-price"]')
      expect(priceEl.exists()).toBe(true)
      expect(priceEl.text()).toContain('99')
    })

    it('shows select plan buttons with data-testid attributes', async () => {
      const wrapper = mountComponent()
      await flushPromises()
      expect(wrapper.find('[data-testid="select-basic-btn"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="select-professional-btn"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="select-enterprise-btn"]').exists()).toBe(true)
    })

    it('shows feature comparison section', async () => {
      const wrapper = mountComponent()
      await flushPromises()
      expect(wrapper.text()).toContain('Detailed Feature Comparison')
    })

    it('shows FAQ section', async () => {
      const wrapper = mountComponent()
      await flushPromises()
      expect(wrapper.text()).toContain('MICA')
    })

    it('does not contain wallet connector UI', async () => {
      const wrapper = mountComponent()
      await flushPromises()
      const html = wrapper.html()
      expect(html).not.toMatch(/WalletConnect|MetaMask|\bPera\b|Defly/i)
    })
  })

  describe('billing interval toggle', () => {
    it('renders the billing interval toggle', async () => {
      const wrapper = mountComponent()
      await flushPromises()
      const toggle = wrapper.find('[data-testid="billing-toggle"]')
      expect(toggle.exists()).toBe(true)
    })

    it('renders the annual discount badge', async () => {
      const wrapper = mountComponent()
      await flushPromises()
      const badge = wrapper.find('[data-testid="annual-discount-badge"]')
      expect(badge.exists()).toBe(true)
      expect(badge.text()).toContain('20%')
    })

    it('defaults to monthly billing interval', async () => {
      const wrapper = mountComponent()
      await flushPromises()
      const toggle = wrapper.find('[data-testid="billing-interval-toggle"]')
      expect(toggle.attributes('aria-checked')).toBe('false')
    })

    it('switches to annual billing when toggle is clicked', async () => {
      const wrapper = mountComponent()
      await flushPromises()
      const toggle = wrapper.find('[data-testid="billing-interval-toggle"]')
      await toggle.trigger('click')
      await flushPromises()
      expect(toggle.attributes('aria-checked')).toBe('true')
    })

    it('shows annual note after switching to annual billing', async () => {
      const wrapper = mountComponent()
      await flushPromises()
      const toggle = wrapper.find('[data-testid="billing-interval-toggle"]')
      await toggle.trigger('click')
      await flushPromises()
      const annualNote = wrapper.find('[data-testid="basic-annual-note"]')
      expect(annualNote.exists()).toBe(true)
    })

    it('shows lower per-month price when annual is selected', async () => {
      const wrapper = mountComponent()
      await flushPromises()

      const monthlyPriceEl = wrapper.find('[data-testid="basic-price"]')
      const monthlyText = monthlyPriceEl.text()
      const monthlyPrice = parseFloat(monthlyText.replace('$', ''))

      const toggle = wrapper.find('[data-testid="billing-interval-toggle"]')
      await toggle.trigger('click')
      await flushPromises()

      const annualPriceEl = wrapper.find('[data-testid="basic-price"]')
      const annualText = annualPriceEl.text()
      const annualPrice = parseFloat(annualText.replace('$', ''))

      expect(annualPrice).toBeLessThan(monthlyPrice)
    })
  })

  describe('unauthenticated state', () => {
    it('shows sign-in CTA for unauthenticated users', async () => {
      const wrapper = mountComponent()
      await flushPromises()
      expect(wrapper.text()).toContain('Sign In or Create Account')
    })

    it('shows "Sign In to Subscribe" button text in plan cards when not authenticated', async () => {
      const wrapper = mountComponent()
      await flushPromises()
      expect(wrapper.text()).toContain('Sign In to Subscribe')
    })

    it('does not show current subscription status card when not authenticated', async () => {
      const wrapper = mountComponent()
      await flushPromises()
      const subCard = wrapper.find('[data-testid="current-subscription-status"]')
      expect(subCard.exists()).toBe(false)
    })

    it('redirects to home with showAuth=true when sign-in button is clicked', async () => {
      const wrapper = mountComponent()
      await flushPromises()
      const signInBtn = wrapper.findAll('button').find(b => b.text().includes('Sign In or Create Account'))
      if (signInBtn) {
        await signInBtn.trigger('click')
        await flushPromises()
        // Router should have navigated to home with showAuth=true
        expect(router.currentRoute.value.query.showAuth).toBe('true')
      }
    })
  })

  describe('authenticated state', () => {
    it('shows "Select Plan" button text when authenticated with no subscription', async () => {
      const wrapper = mountComponent()
      const authStore = useAuthStore()
      authStore.user = { address: 'TEST', name: 'Test User', email: 'user@test.com' }
      authStore.isConnected = true
      await flushPromises()
      expect(wrapper.text()).toContain('Select Plan')
    })

    it('shows "Current Plan" button text for current plan tier', async () => {
      const wrapper = mountComponent()
      const authStore = useAuthStore()
      authStore.user = { address: 'TEST', name: 'Test User', email: 'user@test.com' }
      authStore.isConnected = true
      const subscriptionStore = useSubscriptionStore()
      subscriptionStore.subscription = {
        customer_id: 'cus_test',
        subscription_id: 'sub_test',
        subscription_status: 'active',
        price_id: 'price_basic_monthly',
        current_period_start: null,
        current_period_end: null,
        cancel_at_period_end: false,
        payment_method_brand: null,
        payment_method_last4: null,
        trial_end: null,
      }
      await flushPromises()
      expect(wrapper.text()).toContain('Current Plan')
    })

    it('calls createCheckoutSession when plan button is clicked for authenticated user', async () => {
      const wrapper = mountComponent()
      const authStore = useAuthStore()
      authStore.user = { address: 'TEST', name: 'Test User', email: 'user@test.com' }
      authStore.isConnected = true
      const subscriptionStore = useSubscriptionStore()
      const checkoutSpy = vi.spyOn(subscriptionStore, 'createCheckoutSession').mockResolvedValue()
      await flushPromises()

      const selectBtn = wrapper.find('[data-testid="select-professional-btn"]')
      await selectBtn.trigger('click')
      await flushPromises()

      expect(checkoutSpy).toHaveBeenCalled()
    })

    it('redirects unauthenticated user to login when plan button clicked', async () => {
      const wrapper = mountComponent()
      await flushPromises()

      const selectBtn = wrapper.find('[data-testid="select-basic-btn"]')
      await selectBtn.trigger('click')
      await flushPromises()

      expect(router.currentRoute.value.query.showAuth).toBe('true')
    })
  })

  describe('coupon code section', () => {
    it('renders the coupon code input', async () => {
      const wrapper = mountComponent()
      await flushPromises()
      const couponInput = wrapper.find('[data-testid="coupon-input"]')
      expect(couponInput.exists()).toBe(true)
    })

    it('renders the apply coupon button', async () => {
      const wrapper = mountComponent()
      await flushPromises()
      const applyBtn = wrapper.find('[data-testid="coupon-apply-btn"]')
      expect(applyBtn.exists()).toBe(true)
    })

    it('validates and shows success for a valid coupon code', async () => {
      const wrapper = mountComponent()
      await flushPromises()

      const subscriptionStore = useSubscriptionStore()
      vi.spyOn(subscriptionStore, 'validateCoupon').mockResolvedValue({
        valid: true,
        discountPercent: 20,
        code: 'LAUNCH20',
        message: '20% off your first 3 months',
      })

      const couponInput = wrapper.find('[data-testid="coupon-input"]')
      await couponInput.setValue('LAUNCH20')

      const applyBtn = wrapper.find('[data-testid="coupon-apply-btn"]')
      await applyBtn.trigger('click')
      await flushPromises()

      const message = wrapper.find('[data-testid="coupon-message"]')
      expect(message.exists()).toBe(true)
      expect(message.text()).toContain('20%')
    })

    it('shows error for an invalid coupon code', async () => {
      const wrapper = mountComponent()
      await flushPromises()

      const subscriptionStore = useSubscriptionStore()
      vi.spyOn(subscriptionStore, 'validateCoupon').mockResolvedValue({
        valid: false,
        message: 'Invalid or expired coupon code',
      })

      const couponInput = wrapper.find('[data-testid="coupon-input"]')
      await couponInput.setValue('BADCODE')

      const applyBtn = wrapper.find('[data-testid="coupon-apply-btn"]')
      await applyBtn.trigger('click')
      await flushPromises()

      const message = wrapper.find('[data-testid="coupon-message"]')
      expect(message.exists()).toBe(true)
      expect(message.text().toLowerCase()).toContain('invalid')
    })

    it('does not call validateCoupon when input is empty', async () => {
      const wrapper = mountComponent()
      await flushPromises()

      const subscriptionStore = useSubscriptionStore()
      const validateSpy = vi.spyOn(subscriptionStore, 'validateCoupon')

      // Coupon input is empty, so clicking apply should not call validateCoupon
      const applyBtn = wrapper.find('[data-testid="coupon-apply-btn"]')
      await applyBtn.trigger('click')
      await flushPromises()

      expect(validateSpy).not.toHaveBeenCalled()
    })

    it('apply button is disabled when coupon input is empty', async () => {
      const wrapper = mountComponent()
      await flushPromises()

      const applyBtn = wrapper.find('[data-testid="coupon-apply-btn"]')
      expect(applyBtn.element instanceof HTMLButtonElement && applyBtn.element.disabled).toBe(true)
    })
  })

  describe('getDisplayPrice logic', () => {
    it('returns monthly price when billing interval is monthly', async () => {
      const wrapper = mountComponent()
      await flushPromises()
      const priceEl = wrapper.find('[data-testid="basic-price"]')
      expect(priceEl.text()).toContain('29')
    })

    it('returns monthly-equivalent of annual price when annual billing is active', async () => {
      const wrapper = mountComponent()
      await flushPromises()

      const toggle = wrapper.find('[data-testid="billing-interval-toggle"]')
      await toggle.trigger('click')
      await flushPromises()

      // Annual: 278.40 / 12 = 23.2
      const priceEl = wrapper.find('[data-testid="basic-price"]')
      expect(priceEl.text()).toContain('23.2')
    })
  })

  describe('plan feature comparison table', () => {
    it('shows the feature comparison table heading', async () => {
      const wrapper = mountComponent()
      await flushPromises()
      expect(wrapper.text()).toContain('Detailed Feature Comparison')
    })

    it('shows token limit comparison row', async () => {
      const wrapper = mountComponent()
      await flushPromises()
      expect(wrapper.text()).toContain('Monthly token limit')
    })

    it('shows MICA compliance feature row', async () => {
      const wrapper = mountComponent()
      await flushPromises()
      expect(wrapper.text()).toContain('MICA Compliance Templates')
    })
  })

  describe('accessibility', () => {
    it('has aria-checked attribute on the billing interval toggle', async () => {
      const wrapper = mountComponent()
      await flushPromises()
      const toggle = wrapper.find('[data-testid="billing-interval-toggle"]')
      expect(toggle.attributes('aria-checked')).toBeDefined()
    })

    it('has aria-label on billing interval toggle', async () => {
      const wrapper = mountComponent()
      await flushPromises()
      const toggle = wrapper.find('[data-testid="billing-interval-toggle"]')
      expect(toggle.attributes('aria-label')).toBeTruthy()
    })

    it('renders role="switch" on billing interval toggle', async () => {
      const wrapper = mountComponent()
      await flushPromises()
      const toggle = wrapper.find('[data-testid="billing-interval-toggle"]')
      expect(toggle.attributes('role')).toBe('switch')
    })
  })
})
