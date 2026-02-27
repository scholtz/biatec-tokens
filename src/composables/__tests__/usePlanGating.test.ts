import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePlanGating } from '../usePlanGating'
import { useSubscriptionStore } from '../../stores/subscription'

// Helper: set subscription to enterprise plan via price_id
function setEnterprisePlan() {
  const store = useSubscriptionStore()
  store.subscription = {
    customer_id: 'cust',
    subscription_id: 'sub_ent',
    subscription_status: 'active',
    price_id: 'price_enterprise_monthly',
    current_period_start: null,
    current_period_end: null,
    cancel_at_period_end: false,
  } as any
}

function setProfessionalPlan() {
  const store = useSubscriptionStore()
  store.subscription = {
    customer_id: 'cust',
    subscription_id: 'sub_pro',
    subscription_status: 'active',
    price_id: 'price_professional_monthly',
    current_period_start: null,
    current_period_end: null,
    cancel_at_period_end: false,
  } as any
}

function setBasicPlan(tokenLimit = 10) {
  const store = useSubscriptionStore()
  store.subscription = {
    customer_id: 'cust',
    subscription_id: 'sub_basic',
    subscription_status: 'active',
    price_id: 'price_basic_monthly',
    current_period_start: null,
    current_period_end: null,
    cancel_at_period_end: false,
  } as any
  // Override tokenLimit if needed — note: currentProduct is a computed,
  // we rely on stripe-config to provide the actual value
  void tokenLimit
}

describe('usePlanGating', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  // ────────────────────────────────────────────────────────────────────────────
  // checkNetworkAccess
  // ────────────────────────────────────────────────────────────────────────────
  describe('checkNetworkAccess', () => {
    it('allows testnet for free plan', () => {
      const { checkNetworkAccess } = usePlanGating()
      const result = checkNetworkAccess('Algorand Testnet')
      expect(result.isAllowed).toBe(true)
      expect(result.requiredPlan).toBeNull()
    })

    it('allows sepolia for free plan', () => {
      const { checkNetworkAccess } = usePlanGating()
      expect(checkNetworkAccess('Ethereum Sepolia').isAllowed).toBe(true)
    })

    it('blocks ethereum mainnet for non-enterprise plan', () => {
      const { checkNetworkAccess } = usePlanGating()
      const result = checkNetworkAccess('Ethereum')
      expect(result.isAllowed).toBe(false)
      expect(result.requiredPlan).toBe('Enterprise Plan')
    })

    it('allows ethereum mainnet for enterprise plan', () => {
      setEnterprisePlan()
      const { checkNetworkAccess } = usePlanGating()
      expect(checkNetworkAccess('Ethereum').isAllowed).toBe(true)
    })

    it('blocks arbitrum mainnet for non-enterprise', () => {
      const { checkNetworkAccess } = usePlanGating()
      const result = checkNetworkAccess('Arbitrum')
      expect(result.isAllowed).toBe(false)
      expect(result.requiredPlan).toBe('Enterprise Plan')
    })

    it('blocks base mainnet for non-enterprise', () => {
      const { checkNetworkAccess } = usePlanGating()
      expect(checkNetworkAccess('Base').isAllowed).toBe(false)
    })

    it('blocks aramid for non-enterprise', () => {
      const { checkNetworkAccess } = usePlanGating()
      expect(checkNetworkAccess('Aramid').isAllowed).toBe(false)
    })

    it('allows aramid for enterprise', () => {
      setEnterprisePlan()
      const { checkNetworkAccess } = usePlanGating()
      expect(checkNetworkAccess('Aramid').isAllowed).toBe(true)
    })

    it('blocks algorand mainnet for free plan', () => {
      const { checkNetworkAccess } = usePlanGating()
      const result = checkNetworkAccess('Algorand')
      expect(result.isAllowed).toBe(false)
      expect(result.requiredPlan).toBe('Professional Plan')
    })

    it('allows algorand mainnet for professional plan', () => {
      setProfessionalPlan()
      const { checkNetworkAccess } = usePlanGating()
      expect(checkNetworkAccess('Algorand').isAllowed).toBe(true)
    })

    it('allows algorand mainnet for enterprise plan', () => {
      setEnterprisePlan()
      const { checkNetworkAccess } = usePlanGating()
      expect(checkNetworkAccess('Algorand').isAllowed).toBe(true)
    })

    it('blocks voi for free plan', () => {
      const { checkNetworkAccess } = usePlanGating()
      const result = checkNetworkAccess('VOI')
      expect(result.isAllowed).toBe(false)
      expect(result.requiredPlan).toBe('Professional Plan')
    })

    it('allows voi for professional plan', () => {
      setProfessionalPlan()
      const { checkNetworkAccess } = usePlanGating()
      expect(checkNetworkAccess('VOI').isAllowed).toBe(true)
    })

    it('allows unknown networks by default', () => {
      const { checkNetworkAccess } = usePlanGating()
      const result = checkNetworkAccess('Some Other Network')
      expect(result.isAllowed).toBe(true)
      expect(result.requiredPlan).toBeNull()
    })
  })

  // ────────────────────────────────────────────────────────────────────────────
  // checkStandardAccess
  // ────────────────────────────────────────────────────────────────────────────
  describe('checkStandardAccess', () => {
    it('allows ASA for all plans', () => {
      const { checkStandardAccess } = usePlanGating()
      expect(checkStandardAccess('ASA').isAllowed).toBe(true)
    })

    it('allows ARC3 for all plans', () => {
      const { checkStandardAccess } = usePlanGating()
      expect(checkStandardAccess('ARC3').isAllowed).toBe(true)
    })

    it('allows ARC3FT for all plans', () => {
      const { checkStandardAccess } = usePlanGating()
      expect(checkStandardAccess('ARC3FT').isAllowed).toBe(true)
    })

    it('allows ARC19 for all plans', () => {
      const { checkStandardAccess } = usePlanGating()
      expect(checkStandardAccess('ARC19').isAllowed).toBe(true)
    })

    it('blocks ARC72 for non-enterprise', () => {
      const { checkStandardAccess } = usePlanGating()
      const result = checkStandardAccess('ARC72')
      expect(result.isAllowed).toBe(false)
      expect(result.requiredPlan).toBe('Enterprise Plan')
    })

    it('allows ARC72 for enterprise', () => {
      setEnterprisePlan()
      const { checkStandardAccess } = usePlanGating()
      expect(checkStandardAccess('ARC72').isAllowed).toBe(true)
    })

    it('blocks ERC721 for non-enterprise', () => {
      const { checkStandardAccess } = usePlanGating()
      expect(checkStandardAccess('ERC721').isAllowed).toBe(false)
    })

    it('blocks ARC69 for non-enterprise', () => {
      const { checkStandardAccess } = usePlanGating()
      expect(checkStandardAccess('ARC69').isAllowed).toBe(false)
    })

    it('allows ARC69 for enterprise', () => {
      setEnterprisePlan()
      const { checkStandardAccess } = usePlanGating()
      expect(checkStandardAccess('ARC69').isAllowed).toBe(true)
    })

    it('blocks ARC200 for free plan', () => {
      const { checkStandardAccess } = usePlanGating()
      const result = checkStandardAccess('ARC200')
      expect(result.isAllowed).toBe(false)
      expect(result.requiredPlan).toBe('Professional Plan')
    })

    it('allows ARC200 for professional plan', () => {
      setProfessionalPlan()
      const { checkStandardAccess } = usePlanGating()
      expect(checkStandardAccess('ARC200').isAllowed).toBe(true)
    })

    it('allows ARC200 for enterprise plan', () => {
      setEnterprisePlan()
      const { checkStandardAccess } = usePlanGating()
      expect(checkStandardAccess('ARC200').isAllowed).toBe(true)
    })

    it('blocks ERC20 for free plan', () => {
      const { checkStandardAccess } = usePlanGating()
      expect(checkStandardAccess('ERC20').isAllowed).toBe(false)
    })

    it('allows ERC20 for professional plan', () => {
      setProfessionalPlan()
      const { checkStandardAccess } = usePlanGating()
      expect(checkStandardAccess('ERC20').isAllowed).toBe(true)
    })

    it('allows unknown standard by default', () => {
      const { checkStandardAccess } = usePlanGating()
      expect(checkStandardAccess('UNKNOWN').isAllowed).toBe(true)
    })
  })

  // ────────────────────────────────────────────────────────────────────────────
  // checkTokenCreationLimit
  // ────────────────────────────────────────────────────────────────────────────
  describe('checkTokenCreationLimit', () => {
    it('allows creation for free trial under limit', () => {
      const subscriptionStore = useSubscriptionStore()
      subscriptionStore.conversionMetrics.successfulCreations = 1
      const { checkTokenCreationLimit } = usePlanGating()
      const result = checkTokenCreationLimit()
      expect(result.isAllowed).toBe(true)
      expect(result.reason).toContain('2 tokens remaining')
    })

    it('allows creation for free trial at 0 tokens', () => {
      const subscriptionStore = useSubscriptionStore()
      subscriptionStore.conversionMetrics.successfulCreations = 0
      const { checkTokenCreationLimit } = usePlanGating()
      const result = checkTokenCreationLimit()
      expect(result.isAllowed).toBe(true)
    })

    it('blocks creation for free trial at limit (3)', () => {
      const subscriptionStore = useSubscriptionStore()
      subscriptionStore.conversionMetrics.successfulCreations = 3
      const { checkTokenCreationLimit } = usePlanGating()
      const result = checkTokenCreationLimit()
      expect(result.isAllowed).toBe(false)
      expect(result.requiredPlan).toBe('Basic Plan')
    })

    it('allows unlimited for professional plan (tokenLimit=unlimited)', () => {
      setProfessionalPlan()
      const { checkTokenCreationLimit } = usePlanGating()
      const result = checkTokenCreationLimit()
      expect(result.isAllowed).toBe(true)
      expect(result.reason).toContain('Unlimited')
    })

    it('allows unlimited for enterprise plan (tokenLimit=unlimited)', () => {
      setEnterprisePlan()
      const { checkTokenCreationLimit } = usePlanGating()
      const result = checkTokenCreationLimit()
      expect(result.isAllowed).toBe(true)
    })

    it('blocks creation for basic plan at numeric limit', () => {
      setBasicPlan()
      const subscriptionStore = useSubscriptionStore()
      // Basic plan from stripe-config has tokenLimit: 10
      subscriptionStore.conversionMetrics.successfulCreations = 10
      const { checkTokenCreationLimit } = usePlanGating()
      const result = checkTokenCreationLimit()
      expect(result.isAllowed).toBe(false)
      expect(result.reason).toContain('10')
    })

    it('allows creation for basic plan under numeric limit', () => {
      setBasicPlan()
      const subscriptionStore = useSubscriptionStore()
      subscriptionStore.conversionMetrics.successfulCreations = 5
      const { checkTokenCreationLimit } = usePlanGating()
      const result = checkTokenCreationLimit()
      expect(result.isAllowed).toBe(true)
      expect(result.reason).toContain('5 tokens remaining')
    })
  })

  // ────────────────────────────────────────────────────────────────────────────
  // getUpgradeBenefits
  // ────────────────────────────────────────────────────────────────────────────
  describe('getUpgradeBenefits', () => {
    it('returns features for Professional Plan', () => {
      const { getUpgradeBenefits } = usePlanGating()
      const benefits = getUpgradeBenefits('Professional Plan')
      expect(Array.isArray(benefits)).toBe(true)
      expect(benefits.length).toBeGreaterThan(0)
    })

    it('returns features for Enterprise Plan', () => {
      const { getUpgradeBenefits } = usePlanGating()
      const benefits = getUpgradeBenefits('Enterprise Plan')
      expect(Array.isArray(benefits)).toBe(true)
      expect(benefits.length).toBeGreaterThan(0)
    })

    it('returns empty array for unknown plan', () => {
      const { getUpgradeBenefits } = usePlanGating()
      expect(getUpgradeBenefits('Non-Existent Plan')).toEqual([])
    })
  })

  // ────────────────────────────────────────────────────────────────────────────
  // getComparisonItems
  // ────────────────────────────────────────────────────────────────────────────
  describe('getComparisonItems', () => {
    it('returns network comparison for network feature', () => {
      const { getComparisonItems } = usePlanGating()
      const items = getComparisonItems('network deployment')
      expect(items.some(i => i.feature.toLowerCase().includes('testnet'))).toBe(true)
    })

    it('returns Network comparison (capital N)', () => {
      const { getComparisonItems } = usePlanGating()
      const items = getComparisonItems('Network Access')
      expect(items.some(i => i.feature.toLowerCase().includes('testnet'))).toBe(true)
    })

    it('returns standard comparison for standard feature', () => {
      const { getComparisonItems } = usePlanGating()
      const items = getComparisonItems('token standard selection')
      expect(items.some(i => i.feature.toLowerCase().includes('standard'))).toBe(true)
    })

    it('returns Standard comparison (capital S)', () => {
      const { getComparisonItems } = usePlanGating()
      const items = getComparisonItems('Standard Selection')
      expect(items.some(i => i.feature.toLowerCase().includes('standard'))).toBe(true)
    })

    it('returns default comparison for generic feature', () => {
      const { getComparisonItems } = usePlanGating()
      const items = getComparisonItems('some generic feature')
      expect(items.some(i => i.feature === 'Basic Features')).toBe(true)
    })
  })

  // ────────────────────────────────────────────────────────────────────────────
  // currentPlan / currentPlanName computed
  // ────────────────────────────────────────────────────────────────────────────
  describe('computed plan values', () => {
    it('returns free when no subscription', () => {
      const { currentPlan } = usePlanGating()
      expect(currentPlan.value).toBe('free')
    })

    it('returns Free Trial when no subscription', () => {
      const { currentPlanName } = usePlanGating()
      expect(currentPlanName.value).toBe('Free Trial')
    })

    it('returns professional tier from currentProduct', () => {
      setProfessionalPlan()
      const { currentPlan } = usePlanGating()
      expect(currentPlan.value).toBe('professional')
    })

    it('returns Professional Plan name from currentProduct', () => {
      setProfessionalPlan()
      const { currentPlanName } = usePlanGating()
      expect(currentPlanName.value).toBe('Professional Plan')
    })

    it('returns enterprise tier from currentProduct', () => {
      setEnterprisePlan()
      const { currentPlan } = usePlanGating()
      expect(currentPlan.value).toBe('enterprise')
    })
  })
})
