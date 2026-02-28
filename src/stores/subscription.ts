import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getProductByPriceId } from '../stripe-config'
import type { StripeProduct } from '../stripe-config'

interface SubscriptionData {
  customer_id: string
  subscription_id: string | null
  subscription_status: string
  price_id: string | null
  current_period_start: number | null
  current_period_end: number | null
  cancel_at_period_end: boolean
  payment_method_brand: string | null
  payment_method_last4: string | null
}

export interface ConversionMetrics {
  tokenCreationAttempts: number
  successfulCreations: number
  templateUsageCount: Record<string, number>
  standardUsageCount: Record<string, number>
  networkPreference: Record<string, number>
  guidanceInteractions: number
  lastActivity: Date | null
}

export const useSubscriptionStore = defineStore('subscription', () => {
  const subscription = ref<SubscriptionData | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const conversionMetrics = ref<ConversionMetrics>({
    tokenCreationAttempts: 0,
    successfulCreations: 0,
    templateUsageCount: {},
    standardUsageCount: {},
    networkPreference: {},
    guidanceInteractions: 0,
    lastActivity: null
  })

  const isActive = computed(() => {
    return subscription.value?.subscription_status === 'active'
  })

  const currentProduct = computed((): StripeProduct | null => {
    if (!subscription.value?.price_id) return null
    return getProductByPriceId(subscription.value.price_id) || null
  })

  const currentPeriodEnd = computed(() => {
    if (!subscription.value?.current_period_end) return null
    return new Date(subscription.value.current_period_end * 1000)
  })

  const fetchSubscription = async () => {
    // Don't refetch if already loaded and active
    if (subscription.value && subscription.value.subscription_status === 'active') {
      console.log('[Subscription Store] Already loaded active subscription, skipping fetch')
      return
    }

    loading.value = true
    error.value = null

    try {
      // First, try to load from cache (for testing and offline scenarios)
      const cached = localStorage.getItem('subscription_cache')
      if (cached) {
        try {
          const cachedData = JSON.parse(cached)
          subscription.value = {
            customer_id: cachedData.customer_id || 'demo_customer',
            subscription_id: cachedData.subscription_id || null,
            subscription_status: cachedData.subscription_status || 'not_started',
            price_id: cachedData.price_id || null,
            current_period_start: cachedData.current_period_start || null,
            current_period_end: cachedData.current_period_end || null,
            cancel_at_period_end: cachedData.cancel_at_period_end || false,
            payment_method_brand: cachedData.payment_method_brand || null,
            payment_method_last4: cachedData.payment_method_last4 || null
          }
          console.log('[Subscription Store] Loaded from cache:', subscription.value)
          loading.value = false
          return
        } catch (e) {
          console.warn('Failed to parse subscription cache:', e)
        }
      }

      // If no cache or cache failed, use mock data
      // In a real app, this would fetch from your backend
      const mockSubscription: SubscriptionData = {
        customer_id: 'demo_customer',
        subscription_id: null,
        subscription_status: 'not_started',
        price_id: null,
        current_period_start: null,
        current_period_end: null,
        cancel_at_period_end: false,
        payment_method_brand: null,
        payment_method_last4: null
      }

      subscription.value = mockSubscription
      console.log('[Subscription Store] Using mock data:', mockSubscription)
    } catch (err) {
      console.error('Error fetching subscription:', err)
      error.value = err instanceof Error ? err.message : 'Failed to fetch subscription'
    } finally {
      loading.value = false
    }
  }

  const cancelSubscription = async () => {
    loading.value = true
    error.value = null
    try {
      // In a real app, this would call /api/subscription/cancel
      await new Promise(resolve => setTimeout(resolve, 800))
      if (subscription.value) {
        subscription.value.cancel_at_period_end = true
        subscription.value.subscription_status = 'active' // remains active until period end
      }
    } catch (err) {
      console.error('Error cancelling subscription:', err)
      error.value = err instanceof Error ? err.message : 'Failed to cancel subscription'
    } finally {
      loading.value = false
    }
  }

  const reactivateSubscription = async () => {
    loading.value = true
    error.value = null
    try {
      // In a real app, this would call /api/subscription/reactivate
      await new Promise(resolve => setTimeout(resolve, 800))
      if (subscription.value) {
        subscription.value.cancel_at_period_end = false
        subscription.value.subscription_status = 'active'
      }
    } catch (err) {
      console.error('Error reactivating subscription:', err)
      error.value = err instanceof Error ? err.message : 'Failed to reactivate subscription'
    } finally {
      loading.value = false
    }
  }

  const createCheckoutSession = async (priceId: string, mode: 'payment' | 'subscription' = 'subscription') => {
    loading.value = true
    error.value = null

    try {
      // Mock checkout session creation
      // In a real app, this would call your backend to create a Stripe checkout session
      console.log('Creating checkout session for:', { priceId, mode })
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // For demo purposes, just redirect to a mock success page
      const mockCheckoutUrl = `${window.location.origin}/subscription/success?session_id=mock_session_${Date.now()}`
      window.location.href = mockCheckoutUrl
    } catch (err) {
      console.error('Error creating checkout session:', err)
      error.value = err instanceof Error ? err.message : 'Failed to create checkout session'
    } finally {
      loading.value = false
    }
  }

  const trackTokenCreationAttempt = () => {
    conversionMetrics.value.tokenCreationAttempts++
    conversionMetrics.value.lastActivity = new Date()
  }

  const trackTokenCreationSuccess = (standard: string, template?: string, network?: string) => {
    conversionMetrics.value.successfulCreations++
    conversionMetrics.value.lastActivity = new Date()
    
    if (standard) {
      conversionMetrics.value.standardUsageCount[standard] = 
        (conversionMetrics.value.standardUsageCount[standard] || 0) + 1
    }
    
    if (template) {
      conversionMetrics.value.templateUsageCount[template] = 
        (conversionMetrics.value.templateUsageCount[template] || 0) + 1
    }
    
    if (network) {
      conversionMetrics.value.networkPreference[network] = 
        (conversionMetrics.value.networkPreference[network] || 0) + 1
    }
  }

  const trackGuidanceInteraction = () => {
    conversionMetrics.value.guidanceInteractions++
    conversionMetrics.value.lastActivity = new Date()
  }

  const getConversionRate = computed(() => {
    if (conversionMetrics.value.tokenCreationAttempts === 0) return 0
    return (conversionMetrics.value.successfulCreations / conversionMetrics.value.tokenCreationAttempts) * 100
  })

  const getMostUsedTemplate = computed(() => {
    const templates = conversionMetrics.value.templateUsageCount
    if (Object.keys(templates).length === 0) return null
    return Object.entries(templates).sort((a, b) => b[1] - a[1])[0]
  })

  const getMostUsedStandard = computed(() => {
    const standards = conversionMetrics.value.standardUsageCount
    if (Object.keys(standards).length === 0) return null
    return Object.entries(standards).sort((a, b) => b[1] - a[1])[0]
  })

  return {
    subscription,
    loading,
    error,
    isActive,
    currentProduct,
    currentPeriodEnd,
    fetchSubscription,
    createCheckoutSession,
    cancelSubscription,
    reactivateSubscription,
    conversionMetrics,
    trackTokenCreationAttempt,
    trackTokenCreationSuccess,
    trackGuidanceInteraction,
    getConversionRate,
    getMostUsedTemplate,
    getMostUsedStandard,
  }
})