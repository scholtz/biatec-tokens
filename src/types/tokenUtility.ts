/**
 * Token Utility Type Definitions
 * 
 * Defines utility information for different token standards to help users
 * understand which standard best fits their use case
 */

/**
 * Use case categories for tokens
 */
export enum TokenUseCase {
  FUNGIBLE_TOKEN = 'fungible_token',
  NFT = 'nft',
  FRACTIONAL_NFT = 'fractional_nft',
  SECURITY_TOKEN = 'security_token',
  UTILITY_TOKEN = 'utility_token',
  GOVERNANCE_TOKEN = 'governance_token',
  PAYMENT_TOKEN = 'payment_token',
  REWARD_TOKEN = 'reward_token',
  RWA_TOKEN = 'rwa_token',
}

/**
 * Token standard utility information
 */
export interface TokenStandardUtility {
  /** Standard name (e.g., "ARC-200", "ERC-20") */
  standard: string;
  /** Short description of the standard */
  description: string;
  /** Primary use cases this standard supports */
  useCases: TokenUseCase[];
  /** Key features of this standard */
  features: string[];
  /** Limitations or considerations */
  limitations: string[];
  /** Typical gas/transaction costs */
  costProfile: 'low' | 'medium' | 'high';
  /** Network availability */
  networks: string[];
  /** Wallet compatibility level */
  walletCompatibility: 'excellent' | 'good' | 'limited';
  /** Compliance readiness */
  complianceReady: boolean;
  /** Best for description */
  bestFor: string[];
  /** Not recommended for */
  notRecommendedFor: string[];
  /** Example use cases */
  examples: string[];
}

/**
 * Utility comparison between standards
 */
export interface UtilityComparison {
  standard: string;
  score: number; // 0-100
  matchedUseCases: TokenUseCase[];
  pros: string[];
  cons: string[];
}

/**
 * Token utility configuration
 */
export const TOKEN_UTILITIES: Record<string, TokenStandardUtility> = {
  'ARC200': {
    standard: 'ARC-200',
    description: 'Algorand smart contract fungible token with enhanced features and MICA compliance support',
    useCases: [
      TokenUseCase.FUNGIBLE_TOKEN,
      TokenUseCase.UTILITY_TOKEN,
      TokenUseCase.PAYMENT_TOKEN,
      TokenUseCase.REWARD_TOKEN,
      TokenUseCase.RWA_TOKEN,
    ],
    features: [
      'Smart contract-based with programmable logic',
      'Built-in MICA compliance metadata',
      'Low transaction costs',
      'Fast finality (4-5 seconds)',
      'Regulatory-ready with jurisdiction controls',
      'Allowance and approval mechanisms',
    ],
    limitations: [
      'Requires smart contract deployment',
      'Lower wallet compatibility than ASA',
      'More complex than basic ASA',
    ],
    costProfile: 'low',
    networks: ['Algorand Mainnet', 'Algorand Testnet', 'VOI', 'Aramid'],
    walletCompatibility: 'good',
    complianceReady: true,
    bestFor: [
      'Regulated token offerings',
      'RWA tokenization with compliance',
      'DeFi applications requiring smart contract features',
      'Payment tokens with geographic restrictions',
    ],
    notRecommendedFor: [
      'Simple utility tokens without compliance needs',
      'Maximum wallet compatibility requirements',
    ],
    examples: [
      'Regulated security tokens under MICA',
      'RWA tokens (real estate, bonds) with investor restrictions',
      'Payment tokens for specific jurisdictions',
    ],
  },
  'ARC3': {
    standard: 'ARC-3',
    description: 'Algorand Standard Asset with metadata URL for NFTs and fractional NFTs',
    useCases: [
      TokenUseCase.NFT,
      TokenUseCase.FRACTIONAL_NFT,
    ],
    features: [
      'Native Algorand asset with metadata',
      'Supports both unique (total=1) and fractional (total>1) NFTs',
      'IPFS and HTTPS URL support',
      'Freeze, clawback, and manager controls',
      'Excellent wallet compatibility',
      'Very low transaction costs',
    ],
    limitations: [
      'Metadata is immutable unless mutable features used',
      'URL must end with #arc3',
      'Basic asset without smart contract logic',
    ],
    costProfile: 'low',
    networks: ['Algorand Mainnet', 'Algorand Testnet', 'VOI', 'Aramid'],
    walletCompatibility: 'excellent',
    complianceReady: false,
    bestFor: [
      'NFT collections',
      'Digital art and collectibles',
      'Fractional ownership of assets',
      'Gaming assets',
    ],
    notRecommendedFor: [
      'Fungible tokens',
      'Tokens requiring regulatory compliance metadata',
      'Smart contract-based functionality',
    ],
    examples: [
      'Digital art NFT collections',
      'Gaming character NFTs',
      'Fractional real estate ownership',
    ],
  },
  'ARC19': {
    standard: 'ARC-19',
    description: 'Mutable NFTs with template-based metadata for dynamic content',
    useCases: [
      TokenUseCase.NFT,
    ],
    features: [
      'Mutable metadata using template system',
      'Dynamic NFT content updates',
      'Reserve address required for security',
      'Supports evolving NFTs (game characters, achievements)',
    ],
    limitations: [
      'Requires template-ipfs:// URL format',
      'Must have reserve address set',
      'More complex setup than ARC-3',
      'Limited wallet support',
    ],
    costProfile: 'low',
    networks: ['Algorand Mainnet', 'Algorand Testnet'],
    walletCompatibility: 'limited',
    complianceReady: false,
    bestFor: [
      'Gaming NFTs with evolving traits',
      'Achievement badges',
      'Dynamic digital assets',
    ],
    notRecommendedFor: [
      'Static NFTs',
      'Fungible tokens',
      'Collections requiring wide wallet support',
    ],
    examples: [
      'Game character NFTs that level up',
      'Dynamic achievement badges',
      'Evolving digital art',
    ],
  },
  'ARC69': {
    standard: 'ARC-69',
    description: 'On-chain metadata storage for NFTs with mutable properties',
    useCases: [
      TokenUseCase.NFT,
    ],
    features: [
      'Metadata stored on-chain in transaction notes',
      'No external URL dependencies',
      'Mutable metadata via config transactions',
      '1024-byte metadata limit',
      'Standard JSON format',
    ],
    limitations: [
      'Limited metadata size (1024 bytes)',
      'More expensive than URL-based metadata',
      'Requires parsing transaction notes',
    ],
    costProfile: 'medium',
    networks: ['Algorand Mainnet', 'Algorand Testnet'],
    walletCompatibility: 'good',
    complianceReady: false,
    bestFor: [
      'NFTs with compact metadata',
      'Projects avoiding external dependencies',
      'Metadata that may need updates',
    ],
    notRecommendedFor: [
      'Rich media NFTs with large metadata',
      'Static NFT collections',
    ],
    examples: [
      'Certificate NFTs',
      'Badge systems',
      'Simple collectibles',
    ],
  },
  'ASA': {
    standard: 'ASA (Algorand Standard Asset)',
    description: 'Basic Algorand native asset without metadata support',
    useCases: [
      TokenUseCase.FUNGIBLE_TOKEN,
      TokenUseCase.UTILITY_TOKEN,
    ],
    features: [
      'Native Algorand Layer-1 asset',
      'Lowest possible transaction costs',
      'Excellent wallet compatibility',
      'Simple and straightforward',
      'Fast finality',
    ],
    limitations: [
      'No metadata support',
      'No smart contract logic',
      'Basic features only',
      'Not recommended for new projects (migrate to ARC standards)',
    ],
    costProfile: 'low',
    networks: ['Algorand Mainnet', 'Algorand Testnet', 'VOI', 'Aramid'],
    walletCompatibility: 'excellent',
    complianceReady: false,
    bestFor: [
      'Legacy token migrations',
      'Simple utility tokens',
    ],
    notRecommendedFor: [
      'New projects (use ARC-200 instead)',
      'NFTs (use ARC-3, ARC-19, or ARC-69)',
      'Regulated tokens (use ARC-200 with MICA)',
    ],
    examples: [
      'Simple loyalty points',
      'Basic utility tokens',
    ],
  },
  'ERC20': {
    standard: 'ERC-20',
    description: 'Ethereum fungible token standard, widely adopted across EVM chains',
    useCases: [
      TokenUseCase.FUNGIBLE_TOKEN,
      TokenUseCase.UTILITY_TOKEN,
      TokenUseCase.GOVERNANCE_TOKEN,
      TokenUseCase.PAYMENT_TOKEN,
    ],
    features: [
      'Most widely adopted token standard',
      'Excellent DeFi integration',
      'Universal wallet support',
      'Smart contract-based with custom logic',
      'Works across all EVM chains',
    ],
    limitations: [
      'Higher gas costs than Algorand',
      'Slower finality than Algorand',
      'No built-in compliance metadata',
    ],
    costProfile: 'high',
    networks: ['Ethereum', 'Arbitrum', 'Base', 'Sepolia Testnet'],
    walletCompatibility: 'excellent',
    complianceReady: false,
    bestFor: [
      'DeFi applications',
      'Tokens requiring maximum ecosystem reach',
      'Governance tokens',
      'Cross-chain applications',
    ],
    notRecommendedFor: [
      'Cost-sensitive applications',
      'High-frequency transactions',
    ],
    examples: [
      'DeFi protocol tokens',
      'DAO governance tokens',
      'Stablecoins',
    ],
  },
  'ERC721': {
    standard: 'ERC-721',
    description: 'Ethereum non-fungible token standard for unique digital assets',
    useCases: [
      TokenUseCase.NFT,
    ],
    features: [
      'Industry standard for NFTs',
      'Universal NFT marketplace support',
      'Rich metadata support',
      'Proven security model',
      'Wide wallet and platform integration',
    ],
    limitations: [
      'High gas costs for minting and transfers',
      'Slower than Algorand NFTs',
      'More expensive to deploy',
    ],
    costProfile: 'high',
    networks: ['Ethereum', 'Arbitrum', 'Base', 'Sepolia Testnet'],
    walletCompatibility: 'excellent',
    complianceReady: false,
    bestFor: [
      'High-value NFT collections',
      'Art marketplaces',
      'Gaming assets requiring wide compatibility',
    ],
    notRecommendedFor: [
      'High-volume, low-value NFTs',
      'Cost-sensitive projects',
    ],
    examples: [
      'Digital art collections',
      'Virtual real estate',
      'Gaming items',
    ],
  },
};
