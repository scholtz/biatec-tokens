import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import Success from '../subscription/Success.vue'
import Cancel from '../subscription/Cancel.vue'

vi.mock('../../services/TelemetryService', () => ({
  telemetryService: {
    track: vi.fn(),
    trackPlanUpgradeCompleted: vi.fn(),
  },
}))

vi.mock('../../stripe-config', () => ({
  getProductByPriceId: vi.fn((priceId: string) => {
    if (priceId === 'price_basic_monthly') {
      return { name: 'Basic Plan', price: 29, priceId: 'price_basic_monthly', tier: 'basic' }
    }
    return null
  }),
  stripeProducts: [],
}))

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/subscription/success', name: 'SubscriptionSuccess', component: Success },
    { path: '/subscription/cancel', name: 'SubscriptionCancel', component: Cancel },
    { path: '/subscription/pricing', name: 'Pricing', component: { template: '<div>Pricing</div>' } },
    { path: '/dashboard', name: 'TokenDashboard', component: { template: '<div>Dashboard</div>' } },
    { path: '/create', name: 'TokenCreator', component: { template: '<div>Create</div>' } },
    { path: '/', name: 'Home', component: { template: '<div>Home</div>' } },
  ],
})

describe('Subscription Success View', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    localStorage.clear()
  })

  const mountSuccess = () =>
    mount(Success, {
      global: { plugins: [createPinia(), router] },
    })

  it('renders the success page', async () => {
    const wrapper = mountSuccess()
    await flushPromises()
    expect(wrapper.exists()).toBe(true)
  })

  it('displays "Payment Successful!" heading', async () => {
    const wrapper = mountSuccess()
    await flushPromises()
    expect(wrapper.text()).toContain('Payment Successful!')
  })

  it('shows confirmation message', async () => {
    const wrapper = mountSuccess()
    await flushPromises()
    expect(wrapper.text()).toContain('Thank you for your subscription')
  })

  it('shows "Go to Dashboard" button', async () => {
    const wrapper = mountSuccess()
    await flushPromises()
    const dashboardBtn = wrapper.findAll('button').find(btn => btn.text().includes('Go to Dashboard'))
    expect(dashboardBtn).toBeTruthy()
  })

  it('shows "Create Your First Token" button', async () => {
    const wrapper = mountSuccess()
    await flushPromises()
    const createBtn = wrapper.findAll('button').find(btn => btn.text().includes('Create Your First Token'))
    expect(createBtn).toBeTruthy()
  })

  it('calls fetchSubscription on mount', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const { useSubscriptionStore } = await import('../../stores/subscription')
    const subscriptionStore = useSubscriptionStore()
    const fetchSpy = vi.spyOn(subscriptionStore, 'fetchSubscription').mockResolvedValue()

    mount(Success, {
      global: { plugins: [pinia, router] },
    })
    await flushPromises()

    expect(fetchSpy).toHaveBeenCalledOnce()
  })

  it('tracks plan upgrade completion on mount', async () => {
    const { telemetryService } = await import('../../services/TelemetryService')
    const wrapper = mountSuccess()
    await flushPromises()
    expect(telemetryService.trackPlanUpgradeCompleted).toHaveBeenCalledWith({
      fromPlan: 'free',
      toPlan: 'premium',
    })
  })

  it('uses active subscription product name if available', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const { useSubscriptionStore } = await import('../../stores/subscription')
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
    const { telemetryService } = await import('../../services/TelemetryService')

    mount(Success, {
      global: { plugins: [pinia, router] },
    })
    await flushPromises()

    expect(telemetryService.trackPlanUpgradeCompleted).toHaveBeenCalledWith({
      fromPlan: 'free',
      toPlan: 'Basic Plan',
    })
  })
})

describe('Subscription Cancel View', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    localStorage.clear()
  })

  const mountCancel = () =>
    mount(Cancel, {
      global: { plugins: [createPinia(), router] },
    })

  it('renders the cancel page', async () => {
    const wrapper = mountCancel()
    await flushPromises()
    expect(wrapper.exists()).toBe(true)
  })

  it('displays "Payment Cancelled" heading', async () => {
    const wrapper = mountCancel()
    await flushPromises()
    expect(wrapper.text()).toContain('Payment Cancelled')
  })

  it('shows no-charges message', async () => {
    const wrapper = mountCancel()
    await flushPromises()
    expect(wrapper.text()).toContain('No charges have been made')
  })

  it('shows "Try Again" button that navigates to pricing', async () => {
    const wrapper = mountCancel()
    await flushPromises()
    const tryAgainBtn = wrapper.findAll('button').find(btn => btn.text().includes('Try Again'))
    expect(tryAgainBtn).toBeTruthy()
  })

  it('shows "Back to Home" button', async () => {
    const wrapper = mountCancel()
    await flushPromises()
    const homeBtn = wrapper.findAll('button').find(btn => btn.text().includes('Back to Home'))
    expect(homeBtn).toBeTruthy()
  })
})
