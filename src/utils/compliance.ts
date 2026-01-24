/**
 * Compliance utility functions for token management
 */

import type { Token } from '../stores/tokens';
import type { Network } from '../types/compliance';

/**
 * Algorand-based token standards that support VOI/Aramid networks
 */
export const ALGORAND_STANDARDS = ['ASA', 'ARC3FT', 'ARC3NFT', 'ARC3FNFT', 'ARC200', 'ARC72'] as const;

/**
 * Check if a token standard is Algorand-based (VOI/Aramid compatible)
 */
export function isAlgorandBasedToken(standard: string): boolean {
  return ALGORAND_STANDARDS.includes(standard as any);
}

/**
 * Calculate compliance score for a token based on its attestation metadata
 * @param token - The token to calculate compliance score for
 * @returns Compliance score from 0-100
 */
export function calculateComplianceScore(token: Token): number {
  let score = 0;
  
  // Base score for deployed tokens
  if (token.status === 'deployed') {
    score += 20;
  }
  
  // Check attestation metadata
  if (token.attestationMetadata?.enabled) {
    score += 30;
    
    const summary = token.attestationMetadata.complianceSummary;
    if (summary) {
      if (summary.kycCompliant) score += 20;
      if (summary.accreditedInvestor) score += 15;
      if (summary.jurisdictionApproved) score += 15;
    }
  }
  
  return Math.min(score, 100);
}

/**
 * Get the default network for an Algorand-based token
 * In production, this would be determined from token metadata or deployment info
 */
export function getDefaultNetwork(): Network {
  return 'VOI';
}
