/**
 * Wallet Compatibility Matrix
 * 
 * Defines how major Algorand wallets display and interact with different token standards.
 * Data based on wallet documentation and testing as of February 2026.
 */

import type { AlgorandStandard } from './standardsValidation';

/**
 * Wallet information and compatibility
 */
export interface WalletInfo {
  id: string;
  name: string;
  description: string;
  website: string;
  logo?: string;
  /** Last verified date for compatibility info */
  lastVerified: string;
}

/**
 * How a wallet displays a specific standard
 */
export interface WalletStandardSupport {
  wallet: string;
  standard: AlgorandStandard;
  /** Whether the wallet recognizes and displays the standard */
  supported: boolean;
  /** Display quality rating */
  displayQuality: 'excellent' | 'good' | 'partial' | 'poor' | 'none';
  /** Specific behaviors and notes */
  behaviors: {
    /** How token name is displayed */
    nameDisplay: string;
    /** How unit name is displayed */
    unitDisplay: string;
    /** How images are handled */
    imageSupport: string;
    /** How metadata is fetched and displayed */
    metadataFetch: string;
    /** Special considerations */
    specialNotes?: string;
  };
}

/**
 * Complete wallet compatibility data
 */
export const WALLET_COMPATIBILITY: Record<string, WalletInfo> = {
  pera: {
    id: 'pera',
    name: 'Pera Wallet',
    description: 'Official Algorand mobile wallet with comprehensive ARC support',
    website: 'https://perawallet.app/',
    lastVerified: '2026-02-12',
  },
  defly: {
    id: 'defly',
    name: 'Defly Wallet',
    description: 'DeFi-focused Algorand wallet with advanced features',
    website: 'https://defly.app/',
    lastVerified: '2026-02-12',
  },
  lute: {
    id: 'lute',
    name: 'Lute Wallet',
    description: 'Browser extension wallet for Algorand',
    website: 'https://lute.app/',
    lastVerified: '2026-02-12',
  },
  exodus: {
    id: 'exodus',
    name: 'Exodus Wallet',
    description: 'Multi-chain wallet with Algorand support',
    website: 'https://www.exodus.com/',
    lastVerified: '2026-02-12',
  },
};

/**
 * Standard support matrix for each wallet
 */
export const WALLET_STANDARD_SUPPORT: WalletStandardSupport[] = [
  // Pera Wallet - ARC3
  {
    wallet: 'pera',
    standard: 'ARC3',
    supported: true,
    displayQuality: 'excellent',
    behaviors: {
      nameDisplay: 'Displays metadata name if available, falls back to asset name',
      unitDisplay: 'Shows unit name with proper decimals formatting',
      imageSupport: 'Full support for image URLs (HTTPS, IPFS). Renders thumbnails in asset list.',
      metadataFetch: 'Automatically fetches and caches ARC-3 metadata from URL. Follows #arc3 suffix convention.',
      specialNotes: 'Pera has excellent ARC-3 support with image rendering, metadata display, and IPFS gateway resolution.',
    },
  },
  // Pera Wallet - ARC19
  {
    wallet: 'pera',
    standard: 'ARC19',
    supported: true,
    displayQuality: 'excellent',
    behaviors: {
      nameDisplay: 'Displays metadata name from resolved template URL',
      unitDisplay: 'Shows unit name with decimals',
      imageSupport: 'Full support. Resolves template-ipfs:// URLs dynamically using reserve address.',
      metadataFetch: 'Resolves {id} placeholder in template-ipfs:// URL to current reserve address CID. Supports dynamic metadata updates.',
      specialNotes: 'Pera fully supports ARC-19 mutable NFTs. Changes to reserve address update metadata display.',
    },
  },
  // Pera Wallet - ARC69
  {
    wallet: 'pera',
    standard: 'ARC69',
    supported: true,
    displayQuality: 'good',
    behaviors: {
      nameDisplay: 'Displays asset name from on-chain params',
      unitDisplay: 'Shows unit name',
      imageSupport: 'Supports media_url field from note metadata',
      metadataFetch: 'Parses JSON from transaction note field (acfg). Limited to 1024 bytes.',
      specialNotes: 'ARC-69 metadata displayed but with less visual prominence than ARC-3/19. Size limit of 1KB.',
    },
  },
  // Pera Wallet - ASA
  {
    wallet: 'pera',
    standard: 'ASA',
    supported: true,
    displayQuality: 'good',
    behaviors: {
      nameDisplay: 'Shows asset name from on-chain parameters',
      unitDisplay: 'Shows unit name with decimals',
      imageSupport: 'No image support for plain ASA (no metadata)',
      metadataFetch: 'No metadata fetch for plain ASA',
      specialNotes: 'Standard ASA display without special features. Reliable for simple fungible tokens.',
    },
  },
  // Defly Wallet - ARC3
  {
    wallet: 'defly',
    standard: 'ARC3',
    supported: true,
    displayQuality: 'excellent',
    behaviors: {
      nameDisplay: 'Displays metadata name with fallback to asset name',
      unitDisplay: 'Shows unit name with proper formatting',
      imageSupport: 'Full image support (HTTPS, IPFS). High-quality rendering in collectibles view.',
      metadataFetch: 'Fetches ARC-3 metadata with caching. Supports #arc3 suffix and standard IPFS gateways.',
      specialNotes: 'Defly has excellent ARC-3 support, especially for NFT collections and marketplace integration.',
    },
  },
  // Defly Wallet - ARC19
  {
    wallet: 'defly',
    standard: 'ARC19',
    supported: true,
    displayQuality: 'good',
    behaviors: {
      nameDisplay: 'Displays metadata name from resolved URL',
      unitDisplay: 'Shows unit name',
      imageSupport: 'Supports template-ipfs:// resolution',
      metadataFetch: 'Resolves ARC-19 template URLs using reserve address',
      specialNotes: 'ARC-19 supported but may have slight delays in metadata updates when reserve changes.',
    },
  },
  // Defly Wallet - ARC69
  {
    wallet: 'defly',
    standard: 'ARC69',
    supported: true,
    displayQuality: 'good',
    behaviors: {
      nameDisplay: 'Shows asset name',
      unitDisplay: 'Shows unit name',
      imageSupport: 'Supports media_url from note',
      metadataFetch: 'Parses note field JSON',
      specialNotes: 'ARC-69 metadata displayed in asset details. 1KB limit applies.',
    },
  },
  // Defly Wallet - ASA
  {
    wallet: 'defly',
    standard: 'ASA',
    supported: true,
    displayQuality: 'good',
    behaviors: {
      nameDisplay: 'Shows asset name',
      unitDisplay: 'Shows unit name with decimals',
      imageSupport: 'No image support',
      metadataFetch: 'No metadata',
      specialNotes: 'Standard ASA display. Clean interface for fungible tokens.',
    },
  },
  // Lute Wallet - ARC3
  {
    wallet: 'lute',
    standard: 'ARC3',
    supported: true,
    displayQuality: 'good',
    behaviors: {
      nameDisplay: 'Displays metadata name',
      unitDisplay: 'Shows unit name',
      imageSupport: 'Basic image support (HTTPS preferred, IPFS may be slower)',
      metadataFetch: 'Fetches ARC-3 metadata. Browser extension may have CORS considerations.',
      specialNotes: 'ARC-3 supported but image loading may be slower. Recommend HTTPS URLs over IPFS.',
    },
  },
  // Lute Wallet - ARC19
  {
    wallet: 'lute',
    standard: 'ARC19',
    supported: false,
    displayQuality: 'partial',
    behaviors: {
      nameDisplay: 'Shows asset name (may not resolve template)',
      unitDisplay: 'Shows unit name',
      imageSupport: 'Limited - may not resolve template-ipfs://',
      metadataFetch: 'May not fully support template URL resolution',
      specialNotes: 'ARC-19 support is partial. May display as plain ASA if template resolution fails.',
    },
  },
  // Lute Wallet - ARC69
  {
    wallet: 'lute',
    standard: 'ARC69',
    supported: false,
    displayQuality: 'partial',
    behaviors: {
      nameDisplay: 'Shows asset name',
      unitDisplay: 'Shows unit name',
      imageSupport: 'May not parse note metadata',
      metadataFetch: 'Limited note parsing',
      specialNotes: 'ARC-69 metadata may not display. Token functions normally but without enhanced metadata.',
    },
  },
  // Lute Wallet - ASA
  {
    wallet: 'lute',
    standard: 'ASA',
    supported: true,
    displayQuality: 'good',
    behaviors: {
      nameDisplay: 'Shows asset name',
      unitDisplay: 'Shows unit name',
      imageSupport: 'No image support',
      metadataFetch: 'No metadata',
      specialNotes: 'Standard ASA display works well in browser extension.',
    },
  },
  // Exodus Wallet - ARC3
  {
    wallet: 'exodus',
    standard: 'ARC3',
    supported: false,
    displayQuality: 'poor',
    behaviors: {
      nameDisplay: 'Shows asset name only (ignores metadata)',
      unitDisplay: 'Shows unit name',
      imageSupport: 'No metadata image support',
      metadataFetch: 'Does not fetch ARC-3 metadata',
      specialNotes: 'Exodus has limited Algorand ARC support. Tokens display as plain ASA.',
    },
  },
  // Exodus Wallet - ARC19
  {
    wallet: 'exodus',
    standard: 'ARC19',
    supported: false,
    displayQuality: 'poor',
    behaviors: {
      nameDisplay: 'Shows asset name only',
      unitDisplay: 'Shows unit name',
      imageSupport: 'No support',
      metadataFetch: 'No template resolution',
      specialNotes: 'ARC-19 tokens display as plain ASA.',
    },
  },
  // Exodus Wallet - ARC69
  {
    wallet: 'exodus',
    standard: 'ARC69',
    supported: false,
    displayQuality: 'poor',
    behaviors: {
      nameDisplay: 'Shows asset name only',
      unitDisplay: 'Shows unit name',
      imageSupport: 'No support',
      metadataFetch: 'No note parsing',
      specialNotes: 'ARC-69 tokens display as plain ASA.',
    },
  },
  // Exodus Wallet - ASA
  {
    wallet: 'exodus',
    standard: 'ASA',
    supported: true,
    displayQuality: 'good',
    behaviors: {
      nameDisplay: 'Shows asset name',
      unitDisplay: 'Shows unit name',
      imageSupport: 'No image support',
      metadataFetch: 'No metadata',
      specialNotes: 'Standard ASA support. Multi-chain wallet focuses on basic functionality.',
    },
  },
];

/**
 * Get wallet support for a specific standard
 */
export function getWalletSupport(walletId: string, standard: AlgorandStandard): WalletStandardSupport | undefined {
  return WALLET_STANDARD_SUPPORT.find(s => s.wallet === walletId && s.standard === standard);
}

/**
 * Get all supported wallets for a standard
 */
export function getWalletsForStandard(standard: AlgorandStandard): WalletStandardSupport[] {
  return WALLET_STANDARD_SUPPORT.filter(s => s.standard === standard && s.supported);
}

/**
 * Get compatibility summary for a standard
 */
export function getCompatibilitySummary(standard: AlgorandStandard): {
  excellentCount: number;
  goodCount: number;
  partialCount: number;
  poorCount: number;
  totalWallets: number;
} {
  const supports = WALLET_STANDARD_SUPPORT.filter(s => s.standard === standard);
  return {
    excellentCount: supports.filter(s => s.displayQuality === 'excellent').length,
    goodCount: supports.filter(s => s.displayQuality === 'good').length,
    partialCount: supports.filter(s => s.displayQuality === 'partial').length,
    poorCount: supports.filter(s => s.displayQuality === 'poor' || s.displayQuality === 'none').length,
    totalWallets: supports.length,
  };
}
