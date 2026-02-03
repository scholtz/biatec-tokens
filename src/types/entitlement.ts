/**
 * Entitlement and subscription types for feature gating
 */

/**
 * Subscription tier levels
 */
export enum SubscriptionTier {
  FREE = "free",
  BASIC = "basic",
  PRO = "pro",
  ENTERPRISE = "enterprise",
}

/**
 * Feature flags for entitlement checking
 */
export enum FeatureFlag {
  // Token creation
  TOKEN_CREATION_ASA = "token_creation_asa",
  TOKEN_CREATION_ARC3 = "token_creation_arc3",
  TOKEN_CREATION_ARC19 = "token_creation_arc19",
  TOKEN_CREATION_ARC69 = "token_creation_arc69",
  TOKEN_CREATION_ARC200 = "token_creation_arc200",
  TOKEN_CREATION_ARC72 = "token_creation_arc72",
  TOKEN_CREATION_ERC20 = "token_creation_erc20",
  TOKEN_CREATION_ERC721 = "token_creation_erc721",

  // Compliance features
  COMPLIANCE_WHITELIST = "compliance_whitelist",
  COMPLIANCE_BLACKLIST = "compliance_blacklist",
  COMPLIANCE_KYC = "compliance_kyc",
  COMPLIANCE_ATTESTATIONS = "compliance_attestations",
  COMPLIANCE_MICA = "compliance_mica",
  COMPLIANCE_EXPORT = "compliance_export",

  // Advanced features
  BATCH_DEPLOYMENT = "batch_deployment",
  API_ACCESS = "api_access",
  CUSTOM_BRANDING = "custom_branding",
  PRIORITY_SUPPORT = "priority_support",
  ADVANCED_ANALYTICS = "advanced_analytics",

  // Network access
  NETWORK_VOI = "network_voi",
  NETWORK_ARAMID = "network_aramid",
  NETWORK_ETHEREUM = "network_ethereum",
  NETWORK_ARBITRUM = "network_arbitrum",
  NETWORK_BASE = "network_base",
  NETWORK_TESTNET = "network_testnet",
}

/**
 * Usage limits for different tiers
 */
export interface UsageLimits {
  tokensPerMonth: number | null; // null = unlimited
  deploymentPerDay: number | null;
  whitelistAddresses: number | null;
  attestationsPerMonth: number | null;
  apiCallsPerDay: number | null;
}

/**
 * Current usage tracking
 */
export interface CurrentUsage {
  tokensThisMonth: number;
  deploymentsToday: number;
  whitelistAddresses: number;
  attestationsThisMonth: number;
  apiCallsToday: number;
  periodStart: Date;
  periodEnd: Date;
}

/**
 * Entitlement status
 */
export interface Entitlement {
  tier: SubscriptionTier;
  features: FeatureFlag[];
  limits: UsageLimits;
  usage: CurrentUsage;
  isActive: boolean;
  expiresAt: Date | null;
}

/**
 * Feature access result
 */
export interface FeatureAccessResult {
  allowed: boolean;
  reason?: string;
  upgradeRequired?: SubscriptionTier;
  usageInfo?: {
    current: number;
    limit: number | null;
    percentage: number;
  };
}

/**
 * Upgrade prompt configuration
 */
export interface UpgradePrompt {
  title: string;
  message: string;
  targetTier: SubscriptionTier;
  features: string[];
  ctaText: string;
  ctaLink: string;
}

/**
 * Default tier configurations
 */
export const TIER_CONFIGS: Record<SubscriptionTier, { features: FeatureFlag[]; limits: UsageLimits }> = {
  [SubscriptionTier.FREE]: {
    features: [
      FeatureFlag.TOKEN_CREATION_ASA,
      FeatureFlag.NETWORK_VOI,
      FeatureFlag.NETWORK_TESTNET,
    ],
    limits: {
      tokensPerMonth: 3,
      deploymentPerDay: 5,
      whitelistAddresses: 100,
      attestationsPerMonth: 10,
      apiCallsPerDay: 100,
    },
  },
  [SubscriptionTier.BASIC]: {
    features: [
      FeatureFlag.TOKEN_CREATION_ASA,
      FeatureFlag.TOKEN_CREATION_ARC3,
      FeatureFlag.TOKEN_CREATION_ARC19,
      FeatureFlag.TOKEN_CREATION_ARC69,
      FeatureFlag.COMPLIANCE_WHITELIST,
      FeatureFlag.NETWORK_VOI,
      FeatureFlag.NETWORK_ARAMID,
      FeatureFlag.NETWORK_TESTNET,
    ],
    limits: {
      tokensPerMonth: 10,
      deploymentPerDay: 20,
      whitelistAddresses: 1000,
      attestationsPerMonth: 50,
      apiCallsPerDay: 500,
    },
  },
  [SubscriptionTier.PRO]: {
    features: [
      FeatureFlag.TOKEN_CREATION_ASA,
      FeatureFlag.TOKEN_CREATION_ARC3,
      FeatureFlag.TOKEN_CREATION_ARC19,
      FeatureFlag.TOKEN_CREATION_ARC69,
      FeatureFlag.TOKEN_CREATION_ARC200,
      FeatureFlag.TOKEN_CREATION_ARC72,
      FeatureFlag.TOKEN_CREATION_ERC20,
      FeatureFlag.TOKEN_CREATION_ERC721,
      FeatureFlag.COMPLIANCE_WHITELIST,
      FeatureFlag.COMPLIANCE_BLACKLIST,
      FeatureFlag.COMPLIANCE_KYC,
      FeatureFlag.COMPLIANCE_ATTESTATIONS,
      FeatureFlag.COMPLIANCE_MICA,
      FeatureFlag.BATCH_DEPLOYMENT,
      FeatureFlag.API_ACCESS,
      FeatureFlag.ADVANCED_ANALYTICS,
      FeatureFlag.NETWORK_VOI,
      FeatureFlag.NETWORK_ARAMID,
      FeatureFlag.NETWORK_ETHEREUM,
      FeatureFlag.NETWORK_ARBITRUM,
      FeatureFlag.NETWORK_BASE,
      FeatureFlag.NETWORK_TESTNET,
    ],
    limits: {
      tokensPerMonth: 100,
      deploymentPerDay: 100,
      whitelistAddresses: 10000,
      attestationsPerMonth: 500,
      apiCallsPerDay: 5000,
    },
  },
  [SubscriptionTier.ENTERPRISE]: {
    features: Object.values(FeatureFlag), // All features
    limits: {
      tokensPerMonth: null, // Unlimited
      deploymentPerDay: null,
      whitelistAddresses: null,
      attestationsPerMonth: null,
      apiCallsPerDay: null,
    },
  },
};
