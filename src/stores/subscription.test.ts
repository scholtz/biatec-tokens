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

  describe('fetchSubscription edge cases', () => {
    it('should skip refetch when subscription is already active', async () => {
      const store = useSubscriptionStore()
      await store.fetchSubscription()
      if (store.subscription) store.subscription.subscription_status = 'active'

      const consoleSpy = vi.spyOn(console, 'log')
      await store.fetchSubscription()

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Already loaded active subscription')
      )
    })

    it('should load subscription from localStorage cache', async () => {
      const cached = {
        customer_id: 'cached_customer',
        subscription_id: 'sub_cached',
        subscription_status: 'active',
        price_id: 'price_test_basic',
        current_period_start: 1700000000,
        current_period_end: 1702000000,
        cancel_at_period_end: false,
        payment_method_brand: 'visa',
        payment_method_last4: '4242',
      }
      localStorage.setItem('subscription_cache', JSON.stringify(cached))

      const store = useSubscriptionStore()
      await store.fetchSubscription()

      expect(store.subscription?.customer_id).toBe('cached_customer')
      expect(store.subscription?.subscription_status).toBe('active')
      expect(store.subscription?.price_id).toBe('price_test_basic')
    })

    it('should fall back to mock data when cache is invalid JSON', async () => {
      localStorage.setItem('subscription_cache', 'invalid-json{{{')

      const store = useSubscriptionStore()
      await store.fetchSubscription()

      expect(store.subscription?.customer_id).toBe('demo_customer')
      expect(store.subscription?.subscription_status).toBe('not_started')
    })

    it('should handle fetch errors and set error state', async () => {
      const store = useSubscriptionStore()
      // Spy on localStorage directly (happy-dom doesn't use Storage.prototype chain)
      const spy = vi.spyOn(localStorage, 'getItem').mockImplementationOnce(() => {
        throw new Error('Storage error')
      })

      await store.fetchSubscription()

      expect(store.error).toBeTruthy()
      expect(store.loading).toBe(false)
      spy.mockRestore()
    })
  })

  describe('createCheckoutSession error handling', () => {
    it('should set error when checkout fails', async () => {
      const store = useSubscriptionStore()
      delete (window as any).location
      window.location = { href: '', origin: 'http://localhost' } as any
      // Spy on setTimeout to throw synchronously, triggering the catch block
      const spy = vi.spyOn(global, 'setTimeout').mockImplementationOnce((_cb: any) => {
        throw new Error('Network error')
      })

      await store.createCheckoutSession('price_test_basic')

      expect(store.error).toBeTruthy()
      expect(store.loading).toBe(false)
      spy.mockRestore()
    })
  })

  describe('conversion metrics', () => {
    it('should track token creation attempt', () => {
      const store = useSubscriptionStore()

      store.trackTokenCreationAttempt()

      expect(store.conversionMetrics.tokenCreationAttempts).toBe(1)
      expect(store.conversionMetrics.lastActivity).toBeInstanceOf(Date)
    })

    it('should track multiple token creation attempts', () => {
      const store = useSubscriptionStore()

      store.trackTokenCreationAttempt()
      store.trackTokenCreationAttempt()
      store.trackTokenCreationAttempt()

      expect(store.conversionMetrics.tokenCreationAttempts).toBe(3)
    })

    it('should track token creation success with standard only', () => {
      const store = useSubscriptionStore()

      store.trackTokenCreationSuccess('ARC200')

      expect(store.conversionMetrics.successfulCreations).toBe(1)
      expect(store.conversionMetrics.standardUsageCount['ARC200']).toBe(1)
      expect(store.conversionMetrics.lastActivity).toBeInstanceOf(Date)
    })

    it('should track token creation success with template and network', () => {
      const store = useSubscriptionStore()

      store.trackTokenCreationSuccess('ARC200', 'loyalty-token', 'algorand')

      expect(store.conversionMetrics.successfulCreations).toBe(1)
      expect(store.conversionMetrics.standardUsageCount['ARC200']).toBe(1)
      expect(store.conversionMetrics.templateUsageCount['loyalty-token']).toBe(1)
      expect(store.conversionMetrics.networkPreference['algorand']).toBe(1)
    })

    it('should accumulate counts for repeated standard/template/network usage', () => {
      const store = useSubscriptionStore()

      store.trackTokenCreationSuccess('ARC200', 'loyalty-token', 'algorand')
      store.trackTokenCreationSuccess('ARC200', 'loyalty-token', 'algorand')

      expect(store.conversionMetrics.standardUsageCount['ARC200']).toBe(2)
      expect(store.conversionMetrics.templateUsageCount['loyalty-token']).toBe(2)
      expect(store.conversionMetrics.networkPreference['algorand']).toBe(2)
    })

    it('should track guidance interaction', () => {
      const store = useSubscriptionStore()

      store.trackGuidanceInteraction()
      store.trackGuidanceInteraction()

      expect(store.conversionMetrics.guidanceInteractions).toBe(2)
      expect(store.conversionMetrics.lastActivity).toBeInstanceOf(Date)
    })

    it('should return 0 conversion rate when no attempts', () => {
      const store = useSubscriptionStore()

      expect(store.getConversionRate).toBe(0)
    })

    it('should calculate conversion rate correctly', () => {
      const store = useSubscriptionStore()

      store.trackTokenCreationAttempt()
      store.trackTokenCreationAttempt()
      store.trackTokenCreationSuccess('ARC200')

      expect(store.getConversionRate).toBe(50)
    })

    it('should return null getMostUsedTemplate when no templates recorded', () => {
      const store = useSubscriptionStore()

      expect(store.getMostUsedTemplate).toBeNull()
    })

    it('should return most used template', () => {
      const store = useSubscriptionStore()

      store.trackTokenCreationSuccess('ARC200', 'loyalty-token')
      store.trackTokenCreationSuccess('ARC200', 'loyalty-token')
      store.trackTokenCreationSuccess('ARC200', 'utility-token')

      const result = store.getMostUsedTemplate
      expect(result).not.toBeNull()
      expect(result![0]).toBe('loyalty-token')
      expect(result![1]).toBe(2)
    })

    it('should return null getMostUsedStandard when no standards recorded', () => {
      const store = useSubscriptionStore()

      expect(store.getMostUsedStandard).toBeNull()
    })

    it('should return most used standard', () => {
      const store = useSubscriptionStore()

      store.trackTokenCreationSuccess('ARC200')
      store.trackTokenCreationSuccess('ARC200')
      store.trackTokenCreationSuccess('ERC20')

      const result = store.getMostUsedStandard
      expect(result).not.toBeNull()
      expect(result![0]).toBe('ARC200')
      expect(result![1]).toBe(2)
    })
  })

  describe('fetchSubscription - additional branch coverage', () => {
    it('should handle null current_period_end in cached data', async () => {
      const store = useSubscriptionStore()
      localStorage.setItem('subscription_cache', JSON.stringify({
        customer_id: 'cust_abc',
        subscription_id: 'sub_abc',
        subscription_status: 'trialing',
        price_id: null,
        current_period_start: null,
        current_period_end: null,
        cancel_at_period_end: false,
        payment_method_brand: 'visa',
        payment_method_last4: '4242',
      }))
      
      await store.fetchSubscription()
      
      expect(store.subscription?.subscription_status).toBe('trialing')
      expect(store.subscription?.payment_method_brand).toBe('visa')
      expect(store.subscription?.payment_method_last4).toBe('4242')
    })

    it('should use defaults for missing cache fields', async () => {
      const store = useSubscriptionStore()
      localStorage.setItem('subscription_cache', JSON.stringify({
        // Minimal cache - missing most fields
      }))
      
      await store.fetchSubscription()
      
      expect(store.subscription?.customer_id).toBe('demo_customer')
      expect(store.subscription?.subscription_status).toBe('not_started')
      expect(store.subscription?.cancel_at_period_end).toBe(false)
    })

    it('should handle valid cache with active status', async () => {
      const store = useSubscriptionStore()
      localStorage.setItem('subscription_cache', JSON.stringify({
        customer_id: 'cust_xyz',
        subscription_id: 'sub_xyz',
        subscription_status: 'active',
        price_id: 'price_test_pro',
        current_period_start: 1700000000,
        current_period_end: 1702600000,
        cancel_at_period_end: true,
        payment_method_brand: 'mastercard',
        payment_method_last4: '5555',
      }))
      
      await store.fetchSubscription()
      
      expect(store.subscription?.subscription_status).toBe('active')
      expect(store.subscription?.cancel_at_period_end).toBe(true)
      expect(store.isActive).toBe(true)
    })
  })

  describe('currentPeriodEnd - additional cases', () => {
    it('should compute currentPeriodEnd as Date from timestamp', async () => {
      const store = useSubscriptionStore()
      const timestamp = 1700000000
      store.subscription = {
        customer_id: 'cust',
        subscription_id: 'sub',
        subscription_status: 'active',
        price_id: null,
        current_period_start: null,
        current_period_end: timestamp,
        cancel_at_period_end: false,
        payment_method_brand: null,
        payment_method_last4: null,
        trial_end: null,
      } as any
      
      const date = store.currentPeriodEnd
      expect(date).toBeInstanceOf(Date)
      expect(date?.getTime()).toBe(timestamp * 1000)
    })
  })

  describe('trackTokenCreationSuccess - edge cases', () => {
    it('should handle success with no template or network', () => {
      const store = useSubscriptionStore()
      store.trackTokenCreationAttempt()
      store.trackTokenCreationSuccess('ARC20')
      
      expect(store.conversionMetrics.successfulCreations).toBe(1)
      expect(store.conversionMetrics.standardUsageCount['ARC20']).toBe(1)
      expect(Object.keys(store.conversionMetrics.templateUsageCount)).toHaveLength(0)
      expect(Object.keys(store.conversionMetrics.networkPreference)).toHaveLength(0)
    })

    it('should accumulate standard/template/network counts', () => {
      const store = useSubscriptionStore()
      store.trackTokenCreationSuccess('ERC20', 'defi', 'ethereum')
      store.trackTokenCreationSuccess('ERC20', 'defi', 'ethereum')
      
      expect(store.conversionMetrics.standardUsageCount['ERC20']).toBe(2)
      expect(store.conversionMetrics.templateUsageCount['defi']).toBe(2)
      expect(store.conversionMetrics.networkPreference['ethereum']).toBe(2)
    })
  })

  describe('cancelSubscription', () => {
    it('should set cancel_at_period_end to true', async () => {
      const store = useSubscriptionStore()
      store.subscription = {
        customer_id: 'cus_123',
        subscription_id: 'sub_123',
        subscription_status: 'active',
        price_id: 'price_test_basic',
        current_period_start: null,
        current_period_end: null,
        cancel_at_period_end: false,
        payment_method_brand: null,
        payment_method_last4: null,
        trial_end: null,
      }
      await store.cancelSubscription()
      expect(store.subscription?.cancel_at_period_end).toBe(true)
      expect(store.subscription?.subscription_status).toBe('active')
    })

    it('should set loading to false after completion', async () => {
      const store = useSubscriptionStore()
      store.subscription = {
        customer_id: 'cus_123',
        subscription_id: 'sub_123',
        subscription_status: 'active',
        price_id: 'price_test_basic',
        current_period_start: null,
        current_period_end: null,
        cancel_at_period_end: false,
        payment_method_brand: null,
        payment_method_last4: null,
        trial_end: null,
      }
      await store.cancelSubscription()
      expect(store.loading).toBe(false)
    })

    it('should handle null subscription gracefully', async () => {
      const store = useSubscriptionStore()
      store.subscription = null
      await store.cancelSubscription()
      expect(store.subscription).toBeNull()
      expect(store.loading).toBe(false)
    })
  })

  describe('reactivateSubscription', () => {
    it('should set cancel_at_period_end to false and status to active', async () => {
      const store = useSubscriptionStore()
      store.subscription = {
        customer_id: 'cus_123',
        subscription_id: 'sub_123',
        subscription_status: 'active',
        price_id: 'price_test_basic',
        current_period_start: null,
        current_period_end: null,
        cancel_at_period_end: true,
        payment_method_brand: null,
        payment_method_last4: null,
        trial_end: null,
      }
      await store.reactivateSubscription()
      expect(store.subscription?.cancel_at_period_end).toBe(false)
      expect(store.subscription?.subscription_status).toBe('active')
    })

    it('should set loading to false after completion', async () => {
      const store = useSubscriptionStore()
      store.subscription = {
        customer_id: 'cus_123',
        subscription_id: 'sub_123',
        subscription_status: 'cancelled',
        price_id: 'price_test_basic',
        current_period_start: null,
        current_period_end: null,
        cancel_at_period_end: false,
        payment_method_brand: null,
        payment_method_last4: null,
        trial_end: null,
      }
      await store.reactivateSubscription()
      expect(store.loading).toBe(false)
    })

    it('should handle null subscription gracefully', async () => {
      const store = useSubscriptionStore()
      store.subscription = null
      await store.reactivateSubscription()
      expect(store.subscription).toBeNull()
      expect(store.loading).toBe(false)
    })
  })

  describe('isInTrial computed', () => {
    it('should return true when status is trialing and trial_end is in the future', () => {
      const store = useSubscriptionStore()
      const futureTimestamp = Math.floor(Date.now() / 1000) + 7 * 86400 // 7 days from now
      store.subscription = {
        customer_id: 'cus_trial',
        subscription_id: null,
        subscription_status: 'trialing',
        price_id: null,
        current_period_start: null,
        current_period_end: null,
        cancel_at_period_end: false,
        payment_method_brand: null,
        payment_method_last4: null,
        trial_end: futureTimestamp,
      }
      expect(store.isInTrial).toBe(true)
    })

    it('should return false when status is not trialing', () => {
      const store = useSubscriptionStore()
      store.subscription = {
        customer_id: 'cus_123',
        subscription_id: 'sub_123',
        subscription_status: 'active',
        price_id: 'price_test_basic',
        current_period_start: null,
        current_period_end: null,
        cancel_at_period_end: false,
        payment_method_brand: null,
        payment_method_last4: null,
        trial_end: Math.floor(Date.now() / 1000) + 86400,
      }
      expect(store.isInTrial).toBe(false)
    })

    it('should return false when trial_end is in the past', () => {
      const store = useSubscriptionStore()
      const pastTimestamp = Math.floor(Date.now() / 1000) - 86400
      store.subscription = {
        customer_id: 'cus_trial',
        subscription_id: null,
        subscription_status: 'trialing',
        price_id: null,
        current_period_start: null,
        current_period_end: null,
        cancel_at_period_end: false,
        payment_method_brand: null,
        payment_method_last4: null,
        trial_end: pastTimestamp,
      }
      expect(store.isInTrial).toBe(false)
    })

    it('should return false when subscription is null', () => {
      const store = useSubscriptionStore()
      store.subscription = null
      expect(store.isInTrial).toBe(false)
    })
  })

  describe('trialDaysRemaining computed', () => {
    it('should return correct days remaining when in trial', () => {
      const store = useSubscriptionStore()
      const daysAhead = 10
      const trialEnd = Math.floor(Date.now() / 1000) + daysAhead * 86400
      store.subscription = {
        customer_id: 'cus_trial',
        subscription_id: null,
        subscription_status: 'trialing',
        price_id: null,
        current_period_start: null,
        current_period_end: null,
        cancel_at_period_end: false,
        payment_method_brand: null,
        payment_method_last4: null,
        trial_end: trialEnd,
      }
      // Allow 1 day variance due to millisecond timing
      expect(store.trialDaysRemaining).toBeGreaterThanOrEqual(daysAhead - 1)
      expect(store.trialDaysRemaining).toBeLessThanOrEqual(daysAhead + 1)
    })

    it('should return 0 when not in trial', () => {
      const store = useSubscriptionStore()
      store.subscription = null
      expect(store.trialDaysRemaining).toBe(0)
    })
  })

  describe('validateCoupon', () => {
    it('should return valid result for a known coupon code', async () => {
      const store = useSubscriptionStore()
      const result = await store.validateCoupon('LAUNCH20')
      expect(result.valid).toBe(true)
      expect(result.discountPercent).toBe(20)
      expect(store.appliedCoupon).not.toBeNull()
    })

    it('should return invalid result for an unknown coupon code', async () => {
      const store = useSubscriptionStore()
      const result = await store.validateCoupon('INVALID999')
      expect(result.valid).toBe(false)
      expect(store.appliedCoupon).toBeNull()
    })

    it('should be case-insensitive for coupon codes', async () => {
      const store = useSubscriptionStore()
      const result = await store.validateCoupon('launch20')
      expect(result.valid).toBe(true)
    })
  })

  describe('clearCoupon', () => {
    it('should clear the applied coupon', async () => {
      const store = useSubscriptionStore()
      await store.validateCoupon('LAUNCH20')
      expect(store.appliedCoupon).not.toBeNull()
      store.clearCoupon()
      expect(store.appliedCoupon).toBeNull()
    })
  })

  describe('currentTier computed', () => {
    it('should return null when no subscription', () => {
      const store = useSubscriptionStore()
      store.subscription = null
      expect(store.currentTier).toBeNull()
    })
  })

  describe('hasFeatureAccess', () => {
    it('should return false when not active and not trialing', () => {
      const store = useSubscriptionStore()
      store.subscription = null
      expect(store.hasFeatureAccess('basic')).toBe(false)
    })

    it('should return false when active but tier is lower than required', () => {
      const store = useSubscriptionStore()
      store.subscription = {
        customer_id: 'cus_123',
        subscription_id: 'sub_123',
        subscription_status: 'active',
        price_id: 'price_test_basic',
        current_period_start: null,
        current_period_end: null,
        cancel_at_period_end: false,
        payment_method_brand: null,
        payment_method_last4: null,
        trial_end: null,
      }
      // With price_test_basic, getProductByPriceId returns { tier: undefined }
      // hasFeatureAccess('professional') should be false
      expect(store.hasFeatureAccess('professional')).toBe(false)
    })
  })
});
