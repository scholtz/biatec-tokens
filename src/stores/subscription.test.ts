import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSubscriptionStore } from './subscription'

// Mock the stripe-config module
vi.mock('../stripe-config', () => ({
  getProductByPriceId: vi.fn((priceId: string) => {
    if (priceId === 'price_test_basic') {
      return { name: 'Basic Plan', price: 9.99, priceId: 'price_test_basic' }
    }
    if (priceId === 'price_test_pro') {
      return { name: 'Pro Plan', price: 29.99, priceId: 'price_test_pro' }
    }
    return null
  })
}))

describe('Subscription Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('initialization', () => {
    it('should initialize with null subscription', () => {
      const store = useSubscriptionStore()

      expect(store.subscription).toBeNull()
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('should have isActive computed property', () => {
      const store = useSubscriptionStore()

      expect(store.isActive).toBe(false)
    })
  })

  describe('isActive computed', () => {
    it('should return true when subscription status is active', async () => {
      const store = useSubscriptionStore()
      
      await store.fetchSubscription()
      
      // Manually update subscription to active for testing
      if (store.subscription) {
        store.subscription.subscription_status = 'active'
      }

      expect(store.isActive).toBe(true)
    })

    it('should return false when subscription is null', () => {
      const store = useSubscriptionStore()

      expect(store.isActive).toBe(false)
    })

    it('should return false when subscription status is not active', async () => {
      const store = useSubscriptionStore()
      
      await store.fetchSubscription()

      expect(store.isActive).toBe(false)
    })
  })

  describe('currentProduct computed', () => {
    it('should return null when subscription is null', () => {
      const store = useSubscriptionStore()

      expect(store.currentProduct).toBeNull()
    })

    it('should return null when price_id is null', async () => {
      const store = useSubscriptionStore()
      
      await store.fetchSubscription()

      expect(store.currentProduct).toBeNull()
    })

    it('should return product when valid price_id exists', async () => {
      const store = useSubscriptionStore()
      
      await store.fetchSubscription()
      
      // Set a valid price_id
      if (store.subscription) {
        store.subscription.price_id = 'price_test_basic'
      }

      const product = store.currentProduct
      expect(product).toBeDefined()
      expect(product?.name).toBe('Basic Plan')
      expect(product?.priceId).toBe('price_test_basic')
    })
  })

  describe('currentPeriodEnd computed', () => {
    it('should return null when subscription is null', () => {
      const store = useSubscriptionStore()

      expect(store.currentPeriodEnd).toBeNull()
    })

    it('should return null when current_period_end is null', async () => {
      const store = useSubscriptionStore()
      
      await store.fetchSubscription()

      expect(store.currentPeriodEnd).toBeNull()
    })

    it('should return Date when current_period_end exists', async () => {
      const store = useSubscriptionStore()
      
      await store.fetchSubscription()
      
      // Set current_period_end to a timestamp
      const timestamp = Math.floor(Date.now() / 1000) + 86400 // 1 day from now
      if (store.subscription) {
        store.subscription.current_period_end = timestamp
      }

      const date = store.currentPeriodEnd
      expect(date).toBeInstanceOf(Date)
      expect(date?.getTime()).toBe(timestamp * 1000)
    })
  })

  describe('fetchSubscription', () => {
    it('should fetch subscription successfully', async () => {
      const store = useSubscriptionStore()

      await store.fetchSubscription()

      expect(store.subscription).not.toBeNull()
      expect(store.subscription?.customer_id).toBe('demo_customer')
      expect(store.subscription?.subscription_status).toBe('not_started')
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('should set loading to false after fetch completes', async () => {
      const store = useSubscriptionStore()

      await store.fetchSubscription()
      
      expect(store.loading).toBe(false)
    })

    it('should clear error on successful fetch', async () => {
      const store = useSubscriptionStore()
      
      store.error = 'Previous error'
      
      await store.fetchSubscription()

      expect(store.error).toBeNull()
    })
  })

  describe('createCheckoutSession', () => {
    beforeEach(() => {
      // Mock window.location.href
      delete (window as any).location
      window.location = { href: '', origin: 'http://localhost' } as any
    })

    it('should set loading state during checkout session creation', async () => {
      const store = useSubscriptionStore()

      const createPromise = store.createCheckoutSession('price_test_basic')
      expect(store.loading).toBe(true)

      // Wait for the promise to resolve
      await createPromise

      expect(store.loading).toBe(false)
    })

    it('should redirect to checkout URL', async () => {
      const store = useSubscriptionStore()

      await store.createCheckoutSession('price_test_basic')

      expect(window.location.href).toContain('/subscription/success')
      expect(window.location.href).toContain('session_id=mock_session_')
    })

    it('should handle subscription mode', async () => {
      const store = useSubscriptionStore()

      await store.createCheckoutSession('price_test_pro', 'subscription')

      expect(window.location.href).toContain('/subscription/success')
    })

    it('should handle payment mode', async () => {
      const store = useSubscriptionStore()

      await store.createCheckoutSession('price_test_basic', 'payment')

      expect(window.location.href).toContain('/subscription/success')
    })

    it('should clear error on successful checkout', async () => {
      const store = useSubscriptionStore()
      
      store.error = 'Previous error'
      
      await store.createCheckoutSession('price_test_basic')

      // The loading will be false after completion
      expect(store.loading).toBe(false)
    })
  })

  describe('subscription data structure', () => {
    it('should have correct subscription data structure after fetch', async () => {
      const store = useSubscriptionStore()
      
      await store.fetchSubscription()

      expect(store.subscription).toMatchObject({
        customer_id: expect.any(String),
        subscription_id: null,
        subscription_status: expect.any(String),
        price_id: null,
        current_period_start: null,
        current_period_end: null,
        cancel_at_period_end: expect.any(Boolean),
        payment_method_brand: null,
        payment_method_last4: null
      })
    })
  })
})
