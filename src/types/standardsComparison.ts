/**
 * Enhanced Token Standards Comparison Types
 * 
 * Provides rich feature metadata for competitive advantage:
 * - Clear capability differences between standards
 * - RWA-specific feature highlighting
 * - Use case to feature mapping
 */

export interface StandardFeature {
  id: string;
  name: string;
  description: string;
  category: 'metadata' | 'compliance' | 'economics' | 'governance' | 'technical';
  importance: 'critical' | 'high' | 'medium' | 'low';
  rwaRelevance?: 'essential' | 'recommended' | 'optional';
}

export interface StandardCapability {
  feature: string;
  supported: boolean | 'partial' | 'planned';
  details?: string;
  limitations?: string[];
  benefits?: string[];
}

export interface StandardComparison {
  standard: string;
  displayName: string;
  description: string;
  capabilities: StandardCapability[];
  useCases: string[];
  rwaScore: number; // 0-100 score for RWA suitability
  complianceScore: number; // 0-100 score for compliance features
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
}

export const tokenFeatures: StandardFeature[] = [
  {
    id: 'rich_metadata',
    name: 'Rich Metadata',
    description: 'Support for detailed token information, images, and attributes',
    category: 'metadata',
    importance: 'high',
    rwaRelevance: 'essential',
  },
  {
    id: 'mutable_metadata',
    name: 'Mutable Metadata',
    description: 'Ability to update token metadata after deployment',
    category: 'metadata',
    importance: 'medium',
    rwaRelevance: 'recommended',
  },
  {
    id: 'whitelist_support',
    name: 'Transfer Whitelist',
    description: 'Restrict token transfers to approved addresses',
    category: 'compliance',
    importance: 'critical',
    rwaRelevance: 'essential',
  },
  {
    id: 'jurisdiction_controls',
    name: 'Jurisdiction Controls',
    description: 'Geographic restrictions for compliance',
    category: 'compliance',
    importance: 'critical',
    rwaRelevance: 'essential',
  },
  {
    id: 'kyc_integration',
    name: 'KYC Integration',
    description: 'Built-in identity verification requirements',
    category: 'compliance',
    importance: 'critical',
    rwaRelevance: 'essential',
  },
  {
    id: 'royalties',
    name: 'Creator Royalties',
    description: 'Automatic fees on secondary sales',
    category: 'economics',
    importance: 'medium',
    rwaRelevance: 'optional',
  },
  {
    id: 'fractional_ownership',
    name: 'Fractional Ownership',
    description: 'Support for splitting asset ownership',
    category: 'economics',
    importance: 'high',
    rwaRelevance: 'recommended',
  },
  {
    id: 'governance_rights',
    name: 'Governance Rights',
    description: 'Built-in voting and proposal mechanisms',
    category: 'governance',
    importance: 'medium',
    rwaRelevance: 'recommended',
  },
  {
    id: 'programmable_logic',
    name: 'Programmable Logic',
    description: 'Custom smart contract functionality',
    category: 'technical',
    importance: 'high',
    rwaRelevance: 'recommended',
  },
  {
    id: 'cross_chain',
    name: 'Cross-Chain Support',
    description: 'Native multi-chain compatibility',
    category: 'technical',
    importance: 'medium',
    rwaRelevance: 'optional',
  },
  {
    id: 'audit_trail',
    name: 'Audit Trail',
    description: 'Comprehensive transaction history and logging',
    category: 'compliance',
    importance: 'high',
    rwaRelevance: 'essential',
  },
  {
    id: 'attestations',
    name: 'Digital Attestations',
    description: 'Third-party verification signatures',
    category: 'compliance',
    importance: 'high',
    rwaRelevance: 'essential',
  },
];

export const standardComparisons: StandardComparison[] = [
  {
    standard: 'ARC3',
    displayName: 'ARC3 (Algorand NFT)',
    description: 'Algorand Standard Asset with rich metadata support, ideal for unique assets',
    capabilities: [
      {
        feature: 'rich_metadata',
        supported: true,
        details: 'IPFS/Arweave metadata with images, videos, and attributes',
        benefits: ['Immutable metadata storage', 'Decentralized hosting', 'Rich asset information'],
      },
      {
        feature: 'mutable_metadata',
        supported: false,
        limitations: ['Metadata is immutable after creation'],
      },
      {
        feature: 'whitelist_support',
        supported: 'partial',
        details: 'Can be implemented with freeze/clawback addresses',
        limitations: ['Requires additional configuration'],
      },
      {
        feature: 'jurisdiction_controls',
        supported: 'partial',
        details: 'Can be enforced through clawback logic',
      },
      {
        feature: 'kyc_integration',
        supported: 'partial',
        details: 'Requires external KYC service integration',
      },
      {
        feature: 'royalties',
        supported: true,
        details: 'Native support for creator fees on marketplace trades',
        benefits: ['Automatic royalty distribution', 'No additional infrastructure needed'],
      },
      {
        feature: 'fractional_ownership',
        supported: false,
        limitations: ['NFTs are non-divisible by standard'],
      },
      {
        feature: 'governance_rights',
        supported: false,
        limitations: ['No built-in governance mechanisms'],
      },
      {
        feature: 'programmable_logic',
        supported: 'partial',
        details: 'Limited via manager, freeze, and clawback addresses',
      },
      {
        feature: 'cross_chain',
        supported: false,
        limitations: ['Algorand-specific standard'],
      },
      {
        feature: 'audit_trail',
        supported: true,
        details: 'Full transaction history on Algorand blockchain',
        benefits: ['Transparent history', 'Immutable records'],
      },
      {
        feature: 'attestations',
        supported: 'partial',
        details: 'Can be added via metadata or separate transactions',
      },
    ],
    useCases: [
      'Digital Art NFTs',
      'Collectibles',
      'Certificates',
      'Event Tickets',
      'Real Estate Deeds (with compliance layer)',
    ],
    rwaScore: 65,
    complianceScore: 60,
    difficultyLevel: 'beginner',
  },
  {
    standard: 'ARC200',
    displayName: 'ARC200 (Algorand Fungible)',
    description: 'Algorand smart contract token standard with programmable features',
    capabilities: [
      {
        feature: 'rich_metadata',
        supported: 'partial',
        details: 'Basic metadata support, can be extended',
      },
      {
        feature: 'mutable_metadata',
        supported: true,
        details: 'Metadata can be updated through smart contract',
        benefits: ['Flexible updates', 'Responsive to market changes'],
      },
      {
        feature: 'whitelist_support',
        supported: true,
        details: 'Can implement whitelist in smart contract logic',
        benefits: ['Fine-grained control', 'Compliance-ready'],
      },
      {
        feature: 'jurisdiction_controls',
        supported: true,
        details: 'Smart contract can enforce geographic restrictions',
        benefits: ['MICA compliance support', 'Multi-jurisdiction management'],
      },
      {
        feature: 'kyc_integration',
        supported: true,
        details: 'Smart contract can verify KYC status on-chain',
        benefits: ['Automated compliance', 'Real-time verification'],
      },
      {
        feature: 'royalties',
        supported: true,
        details: 'Programmable fee mechanisms',
      },
      {
        feature: 'fractional_ownership',
        supported: true,
        details: 'Fungible tokens naturally support fractional ownership',
        benefits: ['Increased liquidity', 'Lower entry barriers'],
      },
      {
        feature: 'governance_rights',
        supported: true,
        details: 'Can implement voting and proposals in smart contract',
      },
      {
        feature: 'programmable_logic',
        supported: true,
        details: 'Full smart contract programmability',
        benefits: ['Custom business logic', 'Advanced features', 'Future-proof'],
      },
      {
        feature: 'cross_chain',
        supported: 'planned',
        details: 'Bridge support under development',
      },
      {
        feature: 'audit_trail',
        supported: true,
        details: 'Smart contract events provide detailed audit trail',
        benefits: ['Comprehensive logging', 'Compliance reporting'],
      },
      {
        feature: 'attestations',
        supported: true,
        details: 'Can embed attestation logic in smart contract',
        benefits: ['Automated verification', 'On-chain proof'],
      },
    ],
    useCases: [
      'Security Tokens (Equity, Debt)',
      'Real Estate Tokenization',
      'Commodity-Backed Tokens',
      'Regulated Stablecoins',
      'Utility Tokens with Compliance',
    ],
    rwaScore: 90,
    complianceScore: 95,
    difficultyLevel: 'advanced',
  },
  {
    standard: 'ERC20',
    displayName: 'ERC20 (Ethereum Fungible)',
    description: 'Most widely adopted fungible token standard, high liquidity and ecosystem support',
    capabilities: [
      {
        feature: 'rich_metadata',
        supported: false,
        details: 'Basic name, symbol, decimals only',
        limitations: ['Limited metadata', 'No built-in descriptions or images'],
      },
      {
        feature: 'mutable_metadata',
        supported: false,
        limitations: ['Name and symbol are immutable'],
      },
      {
        feature: 'whitelist_support',
        supported: 'partial',
        details: 'Must extend ERC20 with whitelist logic',
        limitations: ['Requires custom implementation'],
      },
      {
        feature: 'jurisdiction_controls',
        supported: 'partial',
        details: 'Can be added through contract extensions',
      },
      {
        feature: 'kyc_integration',
        supported: 'partial',
        details: 'Requires external KYC oracle integration',
      },
      {
        feature: 'royalties',
        supported: false,
        limitations: ['Not applicable to fungible tokens'],
      },
      {
        feature: 'fractional_ownership',
        supported: true,
        details: 'Fungible nature enables fractional ownership',
        benefits: ['High liquidity', 'Easy division'],
      },
      {
        feature: 'governance_rights',
        supported: 'partial',
        details: 'Requires separate governance contract (e.g., Governor)',
      },
      {
        feature: 'programmable_logic',
        supported: true,
        details: 'Full Solidity programmability',
        benefits: ['Ethereum ecosystem compatibility', 'Extensive libraries'],
      },
      {
        feature: 'cross_chain',
        supported: true,
        details: 'Wide bridge support across EVM chains',
        benefits: ['Multi-chain liquidity', 'Broad ecosystem'],
      },
      {
        feature: 'audit_trail',
        supported: true,
        details: 'Ethereum blockchain transaction history',
      },
      {
        feature: 'attestations',
        supported: 'partial',
        details: 'Can integrate with attestation protocols like EAS',
      },
    ],
    useCases: [
      'Payment Tokens',
      'Stablecoins',
      'DeFi Tokens',
      'Utility Tokens',
      'Governance Tokens (with extensions)',
    ],
    rwaScore: 55,
    complianceScore: 50,
    difficultyLevel: 'intermediate',
  },
  {
    standard: 'ARC1400',
    displayName: 'ARC1400 (Algorand Security Token)',
    description: 'Security token standard with built-in compliance and regulatory features',
    capabilities: [
      {
        feature: 'rich_metadata',
        supported: true,
        details: 'Comprehensive metadata for security issuance details',
        benefits: ['Regulatory information storage', 'Investor disclosures'],
      },
      {
        feature: 'mutable_metadata',
        supported: true,
        details: 'Can update compliance information as regulations evolve',
      },
      {
        feature: 'whitelist_support',
        supported: true,
        details: 'Built-in investor whitelist functionality',
        benefits: ['KYC/AML compliance', 'Accredited investor verification'],
      },
      {
        feature: 'jurisdiction_controls',
        supported: true,
        details: 'Native jurisdiction and restriction management',
        benefits: ['Multi-country compliance', 'Regulatory alignment'],
      },
      {
        feature: 'kyc_integration',
        supported: true,
        details: 'Built-in KYC/AML verification requirements',
        benefits: ['Automated compliance checks', 'Regulatory readiness'],
      },
      {
        feature: 'royalties',
        supported: false,
        limitations: ['Not typical for security tokens'],
      },
      {
        feature: 'fractional_ownership',
        supported: true,
        details: 'Divisible tokens for fractional ownership',
        benefits: ['Investment accessibility', 'Liquidity'],
      },
      {
        feature: 'governance_rights',
        supported: true,
        details: 'Built-in shareholder voting mechanisms',
        benefits: ['Automated governance', 'Transparent voting'],
      },
      {
        feature: 'programmable_logic',
        supported: true,
        details: 'Compliance logic and transfer restrictions',
        benefits: ['Regulatory automation', 'Risk management'],
      },
      {
        feature: 'cross_chain',
        supported: false,
        limitations: ['Algorand-specific, compliance may limit bridging'],
      },
      {
        feature: 'audit_trail',
        supported: true,
        details: 'Comprehensive audit trail for regulatory reporting',
        benefits: ['SEC compliance', 'Investor protection'],
      },
      {
        feature: 'attestations',
        supported: true,
        details: 'Built-in attestation and certification support',
        benefits: ['Third-party verification', 'Compliance proof'],
      },
    ],
    useCases: [
      'Equity Tokens',
      'Debt Securities',
      'Real Estate Investment Trusts (REITs)',
      'Private Placements',
      'Regulated Crowdfunding',
    ],
    rwaScore: 100,
    complianceScore: 100,
    difficultyLevel: 'advanced',
  },
];

/**
 * Get feature comparison matrix
 */
export function getFeatureComparisonMatrix(): {
  features: StandardFeature[];
  standards: string[];
  matrix: Map<string, Map<string, boolean | 'partial' | 'planned'>>;
} {
  const features = tokenFeatures;
  const standards = standardComparisons.map((s) => s.standard);
  const matrix = new Map<string, Map<string, boolean | 'partial' | 'planned'>>();

  standardComparisons.forEach((comparison) => {
    const standardMap = new Map<string, boolean | 'partial' | 'planned'>();
    comparison.capabilities.forEach((cap) => {
      standardMap.set(cap.feature, cap.supported);
    });
    matrix.set(comparison.standard, standardMap);
  });

  return { features, standards, matrix };
}

/**
 * Get RWA-specific recommendations
 */
export function getRWARecommendations(useCase: string): {
  recommended: string[];
  reasoning: string;
} {
  const useCaseLower = useCase.toLowerCase();

  if (useCaseLower.includes('security') || useCaseLower.includes('equity') || useCaseLower.includes('debt')) {
    return {
      recommended: ['ARC1400', 'ARC200'],
      reasoning: 'Securities require comprehensive compliance features, investor whitelisting, and regulatory reporting. ARC1400 is purpose-built for this, while ARC200 offers programmable flexibility.',
    };
  }

  if (useCaseLower.includes('real estate') || useCaseLower.includes('property')) {
    return {
      recommended: ['ARC1400', 'ARC200'],
      reasoning: 'Real estate tokenization needs fractional ownership, jurisdiction controls, and attestation support for property documentation.',
    };
  }

  if (useCaseLower.includes('art') || useCaseLower.includes('collectible')) {
    return {
      recommended: ['ARC3'],
      reasoning: 'Digital art benefits from rich metadata, immutable provenance, and creator royalties. ARC3 provides these features natively.',
    };
  }

  if (useCaseLower.includes('commodity') || useCaseLower.includes('backed')) {
    return {
      recommended: ['ARC200', 'ERC20'],
      reasoning: 'Commodity-backed tokens need fractional ownership and high liquidity. ARC200 offers compliance features, while ERC20 provides broad ecosystem access.',
    };
  }

  return {
    recommended: ['ARC200', 'ARC3'],
    reasoning: 'For most RWA use cases, ARC200 provides the best balance of compliance features and programmability. ARC3 is suitable for unique assets.',
  };
}

/**
 * Calculate compatibility score for a use case
 */
export function calculateUseCaseCompatibility(
  standard: string,
  requiredFeatures: string[]
): {
  score: number;
  supported: string[];
  partial: string[];
  missing: string[];
} {
  const comparison = standardComparisons.find((s) => s.standard === standard);
  if (!comparison) {
    return { score: 0, supported: [], partial: [], missing: requiredFeatures };
  }

  const supported: string[] = [];
  const partial: string[] = [];
  const missing: string[] = [];

  requiredFeatures.forEach((feature) => {
    const capability = comparison.capabilities.find((c) => c.feature === feature);
    if (!capability || capability.supported === false) {
      missing.push(feature);
    } else if (capability.supported === true) {
      supported.push(feature);
    } else {
      partial.push(feature);
    }
  });

  const score = (supported.length * 1.0 + partial.length * 0.5) / requiredFeatures.length * 100;
  return { score, supported, partial, missing };
}
