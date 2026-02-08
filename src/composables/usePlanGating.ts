import { computed } from 'vue'
import { useSubscriptionStore } from '../stores/subscription'
import { stripeProducts } from '../stripe-config'

export interface PlanRestriction {
  isAllowed: boolean
  requiredPlan: 'Basic Plan' | 'Professional Plan' | 'Enterprise Plan' | null
  currentPlan: string
  reason: string
}

export function usePlanGating() {
  const subscriptionStore = useSubscriptionStore()

  const currentPlan = computed(() => {
    return subscriptionStore.currentProduct?.tier || 'free'
  })

  const currentPlanName = computed(() => {
    return subscriptionStore.currentProduct?.name || 'Free Trial'
  })

  /**
   * Check if a network is allowed in the current plan
   */
  const checkNetworkAccess = (networkName: string): PlanRestriction => {
    const network = networkName.toLowerCase()
    
    // Testnet networks are available to all plans
    if (network.includes('testnet') || network.includes('sepolia')) {
      return {
        isAllowed: true,
        requiredPlan: null,
        currentPlan: currentPlanName.value,
        reason: 'Testnet access included in all plans'
      }
    }

    // Ethereum mainnet and other premium networks require Enterprise
    if (network.includes('ethereum') && !network.includes('sepolia') ||
        network.includes('arbitrum') && !network.includes('sepolia') ||
        network.includes('base') && !network.includes('sepolia') ||
        network.includes('aramid')) {
      if (currentPlan.value === 'enterprise') {
        return {
          isAllowed: true,
          requiredPlan: null,
          currentPlan: currentPlanName.value,
          reason: 'Enterprise plan includes all networks'
        }
      }
      return {
        isAllowed: false,
        requiredPlan: 'Enterprise Plan',
        currentPlan: currentPlanName.value,
        reason: 'Mainnet deployment on Ethereum, Arbitrum, Base, and Aramid requires Enterprise plan'
      }
    }

    // Algorand mainnet, VOI require Professional or Enterprise
    if (network.includes('algorand') && !network.includes('testnet') ||
        network.includes('voi')) {
      if (currentPlan.value === 'professional' || currentPlan.value === 'enterprise') {
        return {
          isAllowed: true,
          requiredPlan: null,
          currentPlan: currentPlanName.value,
          reason: 'Mainnet access included in Professional and Enterprise plans'
        }
      }
      return {
        isAllowed: false,
        requiredPlan: 'Professional Plan',
        currentPlan: currentPlanName.value,
        reason: 'Mainnet deployment requires Professional plan or higher'
      }
    }

    // Default: allow
    return {
      isAllowed: true,
      requiredPlan: null,
      currentPlan: currentPlanName.value,
      reason: 'Network available in your plan'
    }
  }

  /**
   * Check if a token standard is allowed in the current plan
   */
  const checkStandardAccess = (standard: string): PlanRestriction => {
    const std = standard.toUpperCase()

    // Basic standards available to all
    if (std === 'ASA' || std === 'ARC3FT' || std === 'ARC3' || std === 'ARC19') {
      return {
        isAllowed: true,
        requiredPlan: null,
        currentPlan: currentPlanName.value,
        reason: 'Basic standards included in all plans'
      }
    }

    // NFT standards (ARC72, ERC721) require Enterprise
    if (std === 'ARC72' || std === 'ERC721' || std.includes('ARC69')) {
      if (currentPlan.value === 'enterprise') {
        return {
          isAllowed: true,
          requiredPlan: null,
          currentPlan: currentPlanName.value,
          reason: 'NFT standards included in Enterprise plan'
        }
      }
      return {
        isAllowed: false,
        requiredPlan: 'Enterprise Plan',
        currentPlan: currentPlanName.value,
        reason: 'NFT standards (ARC-72, ERC-721) require Enterprise plan for enhanced metadata and smart contract features'
      }
    }

    // Advanced standards (ARC200, ERC20) require Professional or Enterprise
    if (std === 'ARC200' || std === 'ERC20') {
      if (currentPlan.value === 'professional' || currentPlan.value === 'enterprise') {
        return {
          isAllowed: true,
          requiredPlan: null,
          currentPlan: currentPlanName.value,
          reason: 'Advanced standards included in Professional and Enterprise plans'
        }
      }
      return {
        isAllowed: false,
        requiredPlan: 'Professional Plan',
        currentPlan: currentPlanName.value,
        reason: 'Advanced token standards with smart contract features require Professional plan or higher'
      }
    }

    // Default: allow
    return {
      isAllowed: true,
      requiredPlan: null,
      currentPlan: currentPlanName.value,
      reason: 'Standard available in your plan'
    }
  }

  /**
   * Check monthly token creation limit
   */
  const checkTokenCreationLimit = (): PlanRestriction => {
    const currentProduct = subscriptionStore.currentProduct
    
    if (!currentProduct) {
      // Free trial: limit to 3 tokens
      const tokensCreated = subscriptionStore.conversionMetrics.successfulCreations
      if (tokensCreated >= 3) {
        return {
          isAllowed: false,
          requiredPlan: 'Basic Plan',
          currentPlan: 'Free Trial',
          reason: 'Free trial limited to 3 tokens. Upgrade to create unlimited tokens.'
        }
      }
      return {
        isAllowed: true,
        requiredPlan: null,
        currentPlan: 'Free Trial',
        reason: `${3 - tokensCreated} tokens remaining in free trial`
      }
    }

    if (currentProduct.tokenLimit === 'unlimited') {
      return {
        isAllowed: true,
        requiredPlan: null,
        currentPlan: currentPlanName.value,
        reason: 'Unlimited token creation'
      }
    }

    // Check if limit reached for paid plans with limits
    const tokensCreated = subscriptionStore.conversionMetrics.successfulCreations
    const limit = currentProduct.tokenLimit as number
    
    if (tokensCreated >= limit) {
      return {
        isAllowed: false,
        requiredPlan: 'Professional Plan',
        currentPlan: currentPlanName.value,
        reason: `Monthly limit of ${limit} tokens reached. Upgrade for unlimited tokens.`
      }
    }

    return {
      isAllowed: true,
      requiredPlan: null,
      currentPlan: currentPlanName.value,
      reason: `${limit - tokensCreated} tokens remaining this month`
    }
  }

  /**
   * Get upgrade benefits for a specific plan
   */
  const getUpgradeBenefits = (requiredPlan: string): string[] => {
    const product = stripeProducts.find(p => p.name === requiredPlan)
    if (!product || !product.features) {
      return []
    }
    return product.features
  }

  /**
   * Get comparison items for upgrade modal
   */
  const getComparisonItems = (feature: string) => {
    // Default comparison based on feature type
    if (feature.includes('network') || feature.includes('Network')) {
      return [
        { feature: 'Testnet Deployment', current: true },
        { feature: 'Mainnet Deployment', current: false },
        { feature: 'Multiple Networks', current: false },
        { feature: 'Premium Networks (Ethereum, Arbitrum)', current: false }
      ]
    }
    
    if (feature.includes('standard') || feature.includes('Standard')) {
      return [
        { feature: 'Basic Token Standards (ASA, ARC3)', current: true },
        { feature: 'Advanced Standards (ARC200, ERC20)', current: false },
        { feature: 'NFT Standards (ARC72, ERC721)', current: false },
        { feature: 'Smart Contract Features', current: false }
      ]
    }

    return [
      { feature: 'Basic Features', current: true },
      { feature: 'Advanced Compliance', current: false },
      { feature: 'Priority Support', current: false },
      { feature: 'API Access', current: false }
    ]
  }

  return {
    currentPlan,
    currentPlanName,
    checkNetworkAccess,
    checkStandardAccess,
    checkTokenCreationLimit,
    getUpgradeBenefits,
    getComparisonItems
  }
}
