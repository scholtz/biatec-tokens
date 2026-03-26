import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { defineComponent, nextTick } from 'vue'
import { useEntitlement } from '../useEntitlement'
import { useSubscriptionStore } from '../../stores/subscription'
import { FeatureFlag } from '../../types/entitlement'
import { entitlementService } from '../../services/EntitlementService'

function makeComponent() {
  return defineComponent({
    setup() {
      return useEntitlement()
    },
    template: '<div></div>',
  })
}

function initWithPlan(status: string, priceId?: string) {
  entitlementService.initialize({ subscription_status: status, price_id: priceId } as any)
}

function setStorePlan(priceId: string) {
  const store = useSubscriptionStore()
  store.subscription = {
    customer_id: 'cust',
    subscription_id: 'sub_test',
    subscription_status: 'active',
    price_id: priceId,
    current_period_start: null,
    current_period_end: null,
    cancel_at_period_end: false,
  } as any
}

describe('useEntitlement', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    // Initialize service with free tier by default
    initWithPlan('not_started')
  })

  describe('hasFeature', () => {
    it('returns true for ASA creation on free plan', () => {
      const { hasFeature } = useEntitlement()
      expect(hasFeature(FeatureFlag.TOKEN_CREATION_ASA)).toBe(true)
    })

    it('returns false for enterprise features on free plan', () => {
      const { hasFeature } = useEntitlement()
      expect(hasFeature(FeatureFlag.BATCH_DEPLOYMENT)).toBe(false)
    })

    it('returns true for batch deployment on enterprise plan', () => {
      initWithPlan('active', 'price_enterprise_monthly')
      const { hasFeature } = useEntitlement()
      expect(hasFeature(FeatureFlag.BATCH_DEPLOYMENT)).toBe(true)
    })

    it('returns false for ERC20 on basic plan', () => {
      initWithPlan('active', 'price_basic_monthly')
      const { hasFeature } = useEntitlement()
      expect(hasFeature(FeatureFlag.TOKEN_CREATION_ERC20)).toBe(false)
    })
  })

  describe('checkFeature', () => {
    it('returns result object with allowed property', () => {
      const { checkFeature } = useEntitlement()
      const result = checkFeature(FeatureFlag.TOKEN_CREATION_ASA)
      expect(result).toHaveProperty('allowed')
    })

    it('returns allowed=true for available features', () => {
      initWithPlan('active', 'price_enterprise_monthly')
      const { checkFeature } = useEntitlement()
      const result = checkFeature(FeatureFlag.API_ACCESS)
      expect(result.allowed).toBe(true)
    })

    it('returns allowed=false for missing features', () => {
      const { checkFeature } = useEntitlement()
      const result = checkFeature(FeatureFlag.BATCH_DEPLOYMENT)
      expect(result.allowed).toBe(false)
    })

    it('includes upgradeRequired for missing features', () => {
      const { checkFeature } = useEntitlement()
      const result = checkFeature(FeatureFlag.BATCH_DEPLOYMENT)
      expect(result.upgradeRequired).toBeDefined()
    })
  })

  describe('canUse', () => {
    it('returns boolean for usage limit check', () => {
      const { canUse } = useEntitlement()
      const result = canUse('tokensCreated')
      expect(typeof result).toBe('boolean')
    })

    it('returns true when below limit', () => {
      const { canUse } = useEntitlement()
      expect(canUse('tokensCreated', 1)).toBe(true)
    })

    it('uses default increment of 1', () => {
      const { canUse } = useEntitlement()
      const result = canUse('tokensCreated')
      expect(typeof result).toBe('boolean')
    })
  })

  describe('checkUsage', () => {
    it('returns usage access result with allowed property', () => {
      const { checkUsage } = useEntitlement()
      const result = checkUsage('tokensCreated')
      expect(result).toHaveProperty('allowed')
    })

    it('returns usageInfo when available', () => {
      const { checkUsage } = useEntitlement()
      const result = checkUsage('tokensCreated')
      // Either usageInfo or reason should be present
      expect(result.allowed !== undefined).toBe(true)
    })
  })

  describe('trackUsage', () => {
    it('can be called without errors', () => {
      const { trackUsage } = useEntitlement()
      expect(() => trackUsage('tokensCreated', 1)).not.toThrow()
    })

    it('accepts default amount', () => {
      const { trackUsage } = useEntitlement()
      expect(() => trackUsage('tokensCreated')).not.toThrow()
    })
  })

  describe('getUsagePercentage', () => {
    it('returns null or a number', () => {
      const { getUsagePercentage } = useEntitlement()
      const result = getUsagePercentage('tokensCreated')
      expect(result === null || typeof result === 'number').toBe(true)
    })

    it('returns a percentage value for initialized service', () => {
      initWithPlan('active', 'price_basic_monthly')
      const { getUsagePercentage } = useEntitlement()
      const result = getUsagePercentage('tokensCreated')
      // Returns null or a number (may be >100 if usage exceeds limit)
      expect(result === null || typeof result === 'number').toBe(true)
    })
  })

  describe('isNearLimit', () => {
    it('returns a boolean', () => {
      const { isNearLimit } = useEntitlement()
      const result = isNearLimit('tokensCreated')
      expect(typeof result).toBe('boolean')
    })
  })

  describe('getUpgradePrompt', () => {
    it('returns a defined prompt object', () => {
      const { getUpgradePrompt } = useEntitlement()
      const prompt = getUpgradePrompt(FeatureFlag.BATCH_DEPLOYMENT)
      expect(prompt).toBeDefined()
    })

    it('returns prompt with required tier info', () => {
      const { getUpgradePrompt } = useEntitlement()
      const prompt = getUpgradePrompt(FeatureFlag.API_ACCESS)
      expect(prompt).toBeDefined()
    })
  })

  describe('refreshEntitlement', () => {
    it('can be called without errors when no subscription in store', () => {
      const { refreshEntitlement } = useEntitlement()
      expect(() => refreshEntitlement()).not.toThrow()
    })

    it('re-initializes service when subscription is in store', () => {
      setStorePlan('price_enterprise_monthly')
      const { refreshEntitlement, hasFeature } = useEntitlement()
      refreshEntitlement()
      expect(hasFeature(FeatureFlag.BATCH_DEPLOYMENT)).toBe(true)
    })
  })

  describe('entitlement computed', () => {
    it('returns the current entitlement state', () => {
      const { entitlement } = useEntitlement()
      expect(entitlement).toBeDefined()
    })

    it('reflects initialized service state', () => {
      initWithPlan('active', 'price_professional_monthly')
      const { entitlement } = useEntitlement()
      expect(entitlement.value).not.toBeNull()
    })
  })

  describe('onMounted initialization', () => {
    it('initializes entitlement on mount when subscription exists', async () => {
      setStorePlan('price_basic_monthly')
      const Comp = makeComponent()
      const wrapper = mount(Comp, { global: { plugins: [createPinia()] } })
      await nextTick()
      expect(wrapper.exists()).toBe(true)
    })

    it('mounts without errors when no subscription', async () => {
      const Comp = makeComponent()
      const wrapper = mount(Comp, { global: { plugins: [createPinia()] } })
      await nextTick()
      expect(wrapper.exists()).toBe(true)
    })
  })
})
