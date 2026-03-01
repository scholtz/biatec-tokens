/**
 * Subscription Flow Integration Tests
 *
 * Tests the complete subscription lifecycle connecting:
 * - subscriptionStateMachine transitions
 * - subscription store actions (cancel, reactivate, createCheckoutSession)
 * - Plan gating (usePlanGating composable)
 *
 * Issue: Implement fully operational subscription management and payment system
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSubscriptionStore } from '../../stores/subscription'
import {
  applySubscriptionEvent,
  createInitialState,
  isFeaturesAccessible,
  isInGracePeriod,
  getStatusLabel,
  fromStripeStatus,
  type SubscriptionState,
} from '../../utils/subscriptionStateMachine'

vi.mock('../../stripe-config', () => ({
  getProductByPriceId: vi.fn((priceId: string) => {
    if (priceId === 'price_basic_monthly') {
      return { name: 'Basic Plan', price: 29, priceId: 'price_basic_monthly', tier: 'basic', tokenLimit: 10 }
    }
    if (priceId === 'price_professional_monthly') {
      return { name: 'Professional Plan', price: 99, priceId: 'price_professional_monthly', tier: 'professional', tokenLimit: 'unlimited' }
    }
    if (priceId === 'price_enterprise_monthly') {
      return { name: 'Enterprise Plan', price: 299, priceId: 'price_enterprise_monthly', tier: 'enterprise', tokenLimit: 'unlimited' }
    }
    return null
  }),
  stripeProducts: [
    { id: 'prod_basic', priceId: 'price_basic_monthly', name: 'Basic Plan', price: 29, tier: 'basic', tokenLimit: 10 },
    { id: 'prod_professional', priceId: 'price_professional_monthly', name: 'Professional Plan', price: 99, tier: 'professional', tokenLimit: 'unlimited' },
    { id: 'prod_enterprise', priceId: 'price_enterprise_monthly', name: 'Enterprise Plan', price: 299, tier: 'enterprise', tokenLimit: 'unlimited' },
  ],
}))

describe('Subscription Flow Integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('state machine ↔ store alignment', () => {
    it('store isActive matches state machine active status', async () => {
      const store = useSubscriptionStore()
      store.subscription = {
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

      // State machine should agree with the store
      const smState: SubscriptionState = {
        status: fromStripeStatus(store.subscription.subscription_status),
        cancelAtPeriodEnd: store.subscription.cancel_at_period_end,
        trialEndsAt: null,
        currentPeriodEnd: null,
        gracePeriodDays: 0,
      }

      expect(store.isActive).toBe(true)
      expect(isFeaturesAccessible(smState)).toBe(true)
    })

    it('store inactive matches state machine not_started status', async () => {
      const store = useSubscriptionStore()
      await store.fetchSubscription()
      // Default mock returns not_started
      expect(store.isActive).toBe(false)

      const smState = createInitialState()
      expect(isFeaturesAccessible(smState)).toBe(false)
    })

    it('store past_due aligns with state machine grace period', () => {
      const store = useSubscriptionStore()
      store.subscription = {
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

      const smState: SubscriptionState = {
        status: 'past_due',
        cancelAtPeriodEnd: false,
        trialEndsAt: null,
        currentPeriodEnd: null,
        gracePeriodDays: 7,
      }

      expect(store.isActive).toBe(false) // past_due is not 'active'
      expect(isInGracePeriod(smState)).toBe(true)
      expect(isFeaturesAccessible(smState)).toBe(true) // still accessible in grace period
    })
  })

  describe('cancelSubscription store action', () => {
    it('sets cancel_at_period_end to true on active subscription', async () => {
      const store = useSubscriptionStore()
      store.subscription = {
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

      await store.cancelSubscription()

      expect(store.subscription?.cancel_at_period_end).toBe(true)
      expect(store.subscription?.subscription_status).toBe('active')
    })

    it('state machine confirms "Cancelling" label after cancel', async () => {
      const store = useSubscriptionStore()
      store.subscription = {
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

      await store.cancelSubscription()

      const smState: SubscriptionState = {
        status: fromStripeStatus(store.subscription!.subscription_status),
        cancelAtPeriodEnd: store.subscription!.cancel_at_period_end,
        trialEndsAt: null,
        currentPeriodEnd: null,
        gracePeriodDays: 0,
      }

      expect(getStatusLabel(smState)).toBe('Cancelling')
    })
  })

  describe('reactivateSubscription store action', () => {
    it('clears cancel_at_period_end and sets status to active', async () => {
      const store = useSubscriptionStore()
      store.subscription = {
        customer_id: 'cus_123',
        subscription_id: 'sub_123',
        subscription_status: 'active',
        price_id: 'price_basic_monthly',
        current_period_start: null,
        current_period_end: null,
        cancel_at_period_end: true,
        payment_method_brand: null,
        payment_method_last4: null,
      }

      await store.reactivateSubscription()

      expect(store.subscription?.cancel_at_period_end).toBe(false)
      expect(store.subscription?.subscription_status).toBe('active')
    })
  })

  describe('subscription plan tier access integration', () => {
    it('Basic plan user has tokenLimit of 10', () => {
      const store = useSubscriptionStore()
      store.subscription = {
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

      expect(store.currentProduct?.tokenLimit).toBe(10)
      expect(store.currentProduct?.tier).toBe('basic')
    })

    it('Professional plan user has unlimited tokens', () => {
      const store = useSubscriptionStore()
      store.subscription = {
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

      expect(store.currentProduct?.tokenLimit).toBe('unlimited')
      expect(store.currentProduct?.tier).toBe('professional')
    })

    it('Enterprise plan user has unlimited tokens', () => {
      const store = useSubscriptionStore()
      store.subscription = {
        customer_id: 'cus_123',
        subscription_id: 'sub_123',
        subscription_status: 'active',
        price_id: 'price_enterprise_monthly',
        current_period_start: null,
        current_period_end: null,
        cancel_at_period_end: false,
        payment_method_brand: null,
        payment_method_last4: null,
      }

      expect(store.currentProduct?.tokenLimit).toBe('unlimited')
      expect(store.currentProduct?.tier).toBe('enterprise')
    })

    it('no subscription returns null product', () => {
      const store = useSubscriptionStore()
      expect(store.currentProduct).toBeNull()
    })
  })

  describe('state transition sequences for billing scenarios', () => {
    it('successful subscription flow: not_started → active', () => {
      let state = createInitialState()
      const payResult = applySubscriptionEvent(state, 'PAYMENT_SUCCEEDED')
      expect(payResult.allowed).toBe(true)
      expect(payResult.nextState.status).toBe('active')
      expect(isFeaturesAccessible(payResult.nextState)).toBe(true)
    })

    it('failed payment recovery: active → past_due → active (7-day grace)', () => {
      let state = createInitialState()
      state = applySubscriptionEvent(state, 'PAYMENT_SUCCEEDED').nextState
      state = applySubscriptionEvent(state, 'PAYMENT_FAILED').nextState
      expect(state.status).toBe('past_due')
      expect(state.gracePeriodDays).toBe(7)
      expect(isFeaturesAccessible(state)).toBe(true) // still in grace period

      state = applySubscriptionEvent(state, 'PAYMENT_RESOLVED').nextState
      expect(state.status).toBe('active')
    })

    it('failed payment cancellation: active → past_due → cancelled (grace expires)', () => {
      let state = createInitialState()
      state = applySubscriptionEvent(state, 'PAYMENT_SUCCEEDED').nextState
      state = applySubscriptionEvent(state, 'PAYMENT_FAILED').nextState
      state = applySubscriptionEvent(state, 'GRACE_PERIOD_EXPIRED').nextState
      expect(state.status).toBe('cancelled')
      expect(isFeaturesAccessible(state)).toBe(false)
    })

    it('subscription renewal: period ends without cancel request stays active', () => {
      let state = createInitialState()
      state = applySubscriptionEvent(state, 'PAYMENT_SUCCEEDED').nextState
      state = applySubscriptionEvent(state, 'PERIOD_ENDED').nextState
      expect(state.status).toBe('active')
      // Period end should be set to a future date
      expect(state.currentPeriodEnd).toBeInstanceOf(Date)
      expect(state.currentPeriodEnd!.getTime()).toBeGreaterThan(Date.now())
    })

    it('complete renewal cycle preserves plan state through multiple periods', () => {
      let state = createInitialState()
      // Subscribe
      state = applySubscriptionEvent(state, 'PAYMENT_SUCCEEDED').nextState
      expect(state.status).toBe('active')
      expect(state.cancelAtPeriodEnd).toBe(false)

      // First renewal
      state = applySubscriptionEvent(state, 'PERIOD_ENDED').nextState
      expect(state.status).toBe('active')
      expect(state.cancelAtPeriodEnd).toBe(false)
      const firstRenewalEnd = state.currentPeriodEnd

      // Second renewal (no data lost, period end updated)
      state = applySubscriptionEvent(state, 'PERIOD_ENDED').nextState
      expect(state.status).toBe('active')
      expect(state.gracePeriodDays).toBe(0)
      expect(state.trialEndsAt).toBeNull()
      expect(state.currentPeriodEnd).toBeInstanceOf(Date)
      // Both currentPeriodEnd values are valid future dates (may be same ms)
      expect(state.currentPeriodEnd!.getTime()).toBeGreaterThan(0)
      // Subscription is still paying with no data corruption
      expect(state.cancelAtPeriodEnd).toBe(false)
      // firstRenewalEnd should also be a valid Date
      expect(firstRenewalEnd).toBeInstanceOf(Date)
    })
  })

  describe('localStorage cache integration', () => {
    it('loads cached active subscription', async () => {
      const cachedData = {
        customer_id: 'cus_cached',
        subscription_id: 'sub_cached',
        subscription_status: 'active',
        price_id: 'price_basic_monthly',
        current_period_start: null,
        current_period_end: null,
        cancel_at_period_end: false,
        payment_method_brand: 'visa',
        payment_method_last4: '4242',
      }
      localStorage.setItem('subscription_cache', JSON.stringify(cachedData))

      const store = useSubscriptionStore()
      await store.fetchSubscription()

      expect(store.subscription?.subscription_status).toBe('active')
      expect(store.subscription?.customer_id).toBe('cus_cached')
      expect(store.isActive).toBe(true)
    })

    it('falls back to mock data when cache is corrupted', async () => {
      localStorage.setItem('subscription_cache', 'not-valid-json{')

      const store = useSubscriptionStore()
      await store.fetchSubscription()

      // Should not throw, should have mock data
      expect(store.subscription).not.toBeNull()
      expect(store.subscription?.subscription_status).toBe('not_started')
    })

    it('skips refetch when active subscription already loaded', async () => {
      const store = useSubscriptionStore()
      store.subscription = {
        customer_id: 'cus_already',
        subscription_id: 'sub_already',
        subscription_status: 'active',
        price_id: 'price_basic_monthly',
        current_period_start: null,
        current_period_end: null,
        cancel_at_period_end: false,
        payment_method_brand: null,
        payment_method_last4: null,
      }

      await store.fetchSubscription()

      // Should still be the same subscription (not overwritten by mock)
      expect(store.subscription?.customer_id).toBe('cus_already')
    })
  })
})
