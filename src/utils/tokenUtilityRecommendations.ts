/**
 * Token Utility Recommendation Engine
 * 
 * Helps users select the best token standard based on their requirements
 */

import { TOKEN_UTILITIES, TokenUseCase, UtilityComparison, TokenStandardUtility } from '../types/tokenUtility'

/**
 * User requirements for token selection
 */
export interface TokenRequirements {
  /** Primary use case */
  useCase: TokenUseCase;
  /** Requires regulatory compliance */
  requiresCompliance?: boolean;
  /** Cost sensitivity (prefer low-cost chains) */
  costSensitive?: boolean;
  /** Requires maximum wallet compatibility */
  requiresWideCompatibility?: boolean;
  /** Preferred networks */
  preferredNetworks?: string[];
  /** Requires smart contract features */
  requiresSmartContract?: boolean;
  /** Is NFT or unique asset */
  isNFT?: boolean;
}

/**
 * Calculate utility score for a standard based on requirements
 */
export function calculateUtilityScore(
  utility: TokenStandardUtility,
  requirements: TokenRequirements
): number {
  let score = 0;

  // Use case match (40 points)
  if (utility.useCases.includes(requirements.useCase)) {
    score += 40;
  }

  // Compliance match (20 points)
  if (requirements.requiresCompliance) {
    score += utility.complianceReady ? 20 : 0;
  } else {
    score += 10; // Small bonus for not needing compliance
  }

  // Cost profile match (15 points)
  if (requirements.costSensitive) {
    if (utility.costProfile === 'low') score += 15;
    else if (utility.costProfile === 'medium') score += 7;
  } else {
    score += 8; // Small bonus for any cost profile when not sensitive
  }

  // Wallet compatibility (15 points)
  if (requirements.requiresWideCompatibility) {
    if (utility.walletCompatibility === 'excellent') score += 15;
    else if (utility.walletCompatibility === 'good') score += 10;
    else score += 3;
  } else {
    if (utility.walletCompatibility === 'excellent') score += 10;
    else if (utility.walletCompatibility === 'good') score += 7;
    else score += 5;
  }

  // Network availability (10 points)
  if (requirements.preferredNetworks && requirements.preferredNetworks.length > 0) {
    const matchedNetworks = utility.networks.filter(n =>
      requirements.preferredNetworks?.some(pn => n.toLowerCase().includes(pn.toLowerCase()))
    );
    score += Math.min(10, (matchedNetworks.length / requirements.preferredNetworks.length) * 10);
  } else {
    score += 5; // Small bonus for any networks
  }

  return Math.round(score);
}

/**
 * Get utility comparison for all standards based on requirements
 */
export function getUtilityComparisons(requirements: TokenRequirements): UtilityComparison[] {
  const comparisons: UtilityComparison[] = [];

  for (const utility of Object.values(TOKEN_UTILITIES)) {
    const score = calculateUtilityScore(utility, requirements);
    const matchedUseCases = utility.useCases.filter(uc => uc === requirements.useCase);

    const pros: string[] = [];
    const cons: string[] = [];

    // Build pros
    if (utility.complianceReady) pros.push('Compliance-ready with built-in regulatory metadata');
    if (utility.costProfile === 'low') pros.push('Very low transaction costs');
    if (utility.walletCompatibility === 'excellent') pros.push('Excellent wallet compatibility');
    if (utility.features.length > 4) pros.push(`Rich feature set (${utility.features.length} features)`);

    // Build cons
    if (!utility.complianceReady && requirements.requiresCompliance) {
      cons.push('No built-in compliance support');
    }
    if (utility.costProfile === 'high' && requirements.costSensitive) {
      cons.push('High transaction costs');
    }
    if (utility.walletCompatibility === 'limited') {
      cons.push('Limited wallet support');
    }
    if (utility.limitations.length > 0) {
      cons.push(...utility.limitations.slice(0, 2));
    }

    comparisons.push({
      standard: utility.standard,
      score,
      matchedUseCases,
      pros: pros.slice(0, 3),
      cons: cons.slice(0, 3),
    });
  }

  // Sort by score descending
  return comparisons.sort((a, b) => b.score - a.score);
}

/**
 * Get the best recommended standard for requirements
 */
export function getRecommendedStandard(requirements: TokenRequirements): string | null {
  const comparisons = getUtilityComparisons(requirements);
  return comparisons.length > 0 ? comparisons[0].standard : null;
}

/**
 * Get utility information for a specific standard
 */
export function getStandardUtility(standard: string): TokenStandardUtility | undefined {
  const normalizedStandard = standard.toUpperCase().replace(/-/g, '');
  return TOKEN_UTILITIES[normalizedStandard] || 
         Object.values(TOKEN_UTILITIES).find(u => 
           u.standard.toUpperCase().replace(/-/g, '') === normalizedStandard
         );
}

/**
 * Get use case display name
 */
export function getUseCaseDisplayName(useCase: TokenUseCase): string {
  const names: Record<TokenUseCase, string> = {
    [TokenUseCase.FUNGIBLE_TOKEN]: 'Fungible Token',
    [TokenUseCase.NFT]: 'NFT (Non-Fungible Token)',
    [TokenUseCase.FRACTIONAL_NFT]: 'Fractional NFT',
    [TokenUseCase.SECURITY_TOKEN]: 'Security Token',
    [TokenUseCase.UTILITY_TOKEN]: 'Utility Token',
    [TokenUseCase.GOVERNANCE_TOKEN]: 'Governance Token',
    [TokenUseCase.PAYMENT_TOKEN]: 'Payment Token',
    [TokenUseCase.REWARD_TOKEN]: 'Reward/Loyalty Token',
    [TokenUseCase.RWA_TOKEN]: 'Real-World Asset Token',
  };
  return names[useCase] || useCase;
}

/**
 * Get cost profile display with icon
 */
export function getCostProfileDisplay(costProfile: 'low' | 'medium' | 'high'): {
  text: string;
  color: string;
  icon: string;
} {
  const profiles = {
    low: { text: 'Low Cost', color: 'text-green-600 dark:text-green-400', icon: '💰' },
    medium: { text: 'Medium Cost', color: 'text-yellow-600 dark:text-yellow-400', icon: '💳' },
    high: { text: 'High Cost', color: 'text-red-600 dark:text-red-400', icon: '💸' },
  };
  return profiles[costProfile];
}

/**
 * Get wallet compatibility display
 */
export function getWalletCompatibilityDisplay(compatibility: 'excellent' | 'good' | 'limited'): {
  text: string;
  color: string;
  icon: string;
} {
  const displays = {
    excellent: { text: 'Excellent', color: 'text-green-600 dark:text-green-400', icon: '⭐⭐⭐' },
    good: { text: 'Good', color: 'text-blue-600 dark:text-blue-400', icon: '⭐⭐' },
    limited: { text: 'Limited', color: 'text-orange-600 dark:text-orange-400', icon: '⭐' },
  };
  return displays[compatibility];
}
