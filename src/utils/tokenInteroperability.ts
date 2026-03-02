/**
 * Token Interoperability
 *
 * Standards-aware utilities for determining token standard compatibility
 * with wallets/platforms, mapping viable conversion paths between standards,
 * and generating actionable user-facing guidance.  All logic is pure and
 * deterministic so it can be used safely in computed properties and tests.
 */

// ─── Token standard catalogue ─────────────────────────────────────────────────

/** Every token standard the platform can reason about. */
export const TOKEN_STANDARDS = [
  'ASA',
  'ARC3',
  'ARC19',
  'ARC69',
  'ARC200',
  'ARC1400',
  'ARC72',
  'ERC20',
  'ERC721',
  'ERC1155',
] as const

export type TokenStandard = (typeof TOKEN_STANDARDS)[number]

// ─── Wallet catalogue ─────────────────────────────────────────────────────────

/** Every wallet identity the matrix knows about. */
export const WALLET_IDS = [
  'pera',
  'defly',
  'lute',
  'exodus',
  'metamask',
  'rainbow',
  'coinbase-wallet',
] as const

export type WalletId = (typeof WALLET_IDS)[number]

// ─── Support level ────────────────────────────────────────────────────────────

/**
 * How well a wallet supports a given token standard.
 * • `full`    – displays and interacts with the token natively
 * • `partial` – shows the token but some features (e.g. metadata) may be missing
 * • `view`    – read-only balance display; no native interaction
 * • `none`    – the wallet does not recognise the standard at all
 */
export type SupportLevel = 'full' | 'partial' | 'view' | 'none'

export interface WalletStandardSupport {
  walletId: WalletId
  standard: TokenStandard
  level: SupportLevel
  /** Human-readable notes, e.g. version requirements or known caveats */
  notes?: string
}

// ─── Compatibility matrix ─────────────────────────────────────────────────────

/**
 * Static compatibility matrix.  Each entry declares the support level for a
 * (wallet, standard) pair.  Pairs that are absent default to `none`.
 */
const COMPATIBILITY_MATRIX: WalletStandardSupport[] = [
  // ── Pera Wallet ──────────────────────────────────────────────────────────
  { walletId: 'pera', standard: 'ASA',    level: 'full' },
  { walletId: 'pera', standard: 'ARC3',   level: 'full',    notes: 'Full NFT metadata display' },
  { walletId: 'pera', standard: 'ARC19',  level: 'full',    notes: 'Dynamic metadata via IPFS' },
  { walletId: 'pera', standard: 'ARC69',  level: 'full',    notes: 'On-chain media metadata' },
  { walletId: 'pera', standard: 'ARC200', level: 'partial', notes: 'Balance shown; DeFi interactions limited' },
  { walletId: 'pera', standard: 'ARC72',  level: 'partial', notes: 'NFT balance shown; limited smart-contract ops' },

  // ── Defly Wallet ─────────────────────────────────────────────────────────
  { walletId: 'defly', standard: 'ASA',    level: 'full' },
  { walletId: 'defly', standard: 'ARC3',   level: 'full' },
  { walletId: 'defly', standard: 'ARC19',  level: 'partial', notes: 'Metadata may require manual refresh' },
  { walletId: 'defly', standard: 'ARC69',  level: 'full' },
  { walletId: 'defly', standard: 'ARC200', level: 'view',    notes: 'Balance visible; swaps require Defly DeFi tab' },
  { walletId: 'defly', standard: 'ARC72',  level: 'view' },

  // ── Lute Wallet ──────────────────────────────────────────────────────────
  { walletId: 'lute', standard: 'ASA',    level: 'full' },
  { walletId: 'lute', standard: 'ARC3',   level: 'full' },
  { walletId: 'lute', standard: 'ARC19',  level: 'full' },
  { walletId: 'lute', standard: 'ARC69',  level: 'full' },
  { walletId: 'lute', standard: 'ARC200', level: 'partial' },
  { walletId: 'lute', standard: 'ARC72',  level: 'partial' },
  { walletId: 'lute', standard: 'ARC1400',level: 'view',    notes: 'Security token balance visible' },

  // ── Exodus Wallet ────────────────────────────────────────────────────────
  { walletId: 'exodus', standard: 'ASA',   level: 'full' },
  { walletId: 'exodus', standard: 'ARC3',  level: 'partial', notes: 'Basic NFT display; metadata details limited' },
  { walletId: 'exodus', standard: 'ARC19', level: 'partial' },
  { walletId: 'exodus', standard: 'ARC69', level: 'partial' },

  // ── MetaMask ─────────────────────────────────────────────────────────────
  { walletId: 'metamask', standard: 'ERC20',   level: 'full' },
  { walletId: 'metamask', standard: 'ERC721',  level: 'full' },
  { walletId: 'metamask', standard: 'ERC1155', level: 'full' },

  // ── Rainbow ──────────────────────────────────────────────────────────────
  { walletId: 'rainbow', standard: 'ERC20',   level: 'full' },
  { walletId: 'rainbow', standard: 'ERC721',  level: 'full',    notes: 'Rich NFT gallery view' },
  { walletId: 'rainbow', standard: 'ERC1155', level: 'partial', notes: 'Multi-token display in progress' },

  // ── Coinbase Wallet ───────────────────────────────────────────────────────
  { walletId: 'coinbase-wallet', standard: 'ERC20',   level: 'full' },
  { walletId: 'coinbase-wallet', standard: 'ERC721',  level: 'full' },
  { walletId: 'coinbase-wallet', standard: 'ERC1155', level: 'full' },
]

// ─── Conversion paths ─────────────────────────────────────────────────────────

export interface ConversionPath {
  from: TokenStandard
  to: TokenStandard
  /** Whether the conversion is supported by the platform */
  supported: boolean
  /** Complexity of migration */
  effort: 'low' | 'medium' | 'high'
  /** User-facing description of what happens during migration */
  description: string
  /** Ordered steps the issuer must follow */
  steps: string[]
  /** Whether existing token holders are affected */
  holderImpact: 'none' | 'opt_in_required' | 'migration_required'
}

/**
 * All known conversion paths between token standards.
 * One-directional: each entry is from→to only.
 */
const CONVERSION_PATHS: ConversionPath[] = [
  {
    from: 'ASA', to: 'ARC3', supported: true, effort: 'low',
    description: 'Add ARC3-compliant metadata URL to existing ASA to upgrade display quality.',
    steps: [
      'Prepare JSON metadata file conforming to ARC3 schema',
      'Pin the metadata file on IPFS or a reliable host',
      'Use the manager account to update the ASA URL field',
      'Notify token holders — no opt-in change required',
    ],
    holderImpact: 'none',
  },
  {
    from: 'ARC3', to: 'ARC19', supported: true, effort: 'medium',
    description: 'Migrate to dynamic IPFS-based metadata so on-chain data can be updated without reissuance.',
    steps: [
      'Create ARC19-compliant reserve address encoding the IPFS CID template',
      'Upload initial metadata to IPFS',
      'Update ASA reserve field using manager account',
      'Update metadata URL to use arc19:// scheme',
      'Notify token holders of metadata URL change',
    ],
    holderImpact: 'none',
  },
  {
    from: 'ASA', to: 'ARC69', supported: true, effort: 'low',
    description: 'Store metadata in ASA note field transactions to comply with ARC69 on-chain media standard.',
    steps: [
      'Prepare ARC69-compliant JSON metadata',
      'Submit manager transaction with ARC69 JSON in the note field',
      'Wallet display will update automatically after confirmation',
    ],
    holderImpact: 'none',
  },
  {
    from: 'ARC3', to: 'ARC200', supported: false, effort: 'high',
    description: 'ARC3 (ASA-based NFT) and ARC200 (smart-contract fungible token) use incompatible underlying standards.',
    steps: [],
    holderImpact: 'migration_required',
  },
  {
    from: 'ERC20', to: 'ERC721', supported: false, effort: 'high',
    description: 'Fungible ERC20 and non-fungible ERC721 tokens have fundamentally different contract interfaces.',
    steps: [],
    holderImpact: 'migration_required',
  },
  {
    from: 'ERC721', to: 'ERC1155', supported: true, effort: 'medium',
    description: 'Migrate individual NFT contracts to the gas-efficient ERC1155 multi-token standard.',
    steps: [
      'Deploy new ERC1155 contract with equivalent token IDs',
      'Implement migration claim contract for existing ERC721 holders',
      'Communicate migration window and deadline to holders',
      'Holders exchange ERC721 tokens for ERC1155 equivalents',
      'Deprecate original ERC721 contract after migration window',
    ],
    holderImpact: 'opt_in_required',
  },
]

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Return all wallets that support a given token standard, ordered from best to
 * worst support level.
 */
export function getCompatibleWallets(
  standard: TokenStandard,
): WalletStandardSupport[] {
  const order: SupportLevel[] = ['full', 'partial', 'view', 'none']
  return COMPATIBILITY_MATRIX
    .filter(e => e.standard === standard && e.level !== 'none')
    .sort((a, b) => order.indexOf(a.level) - order.indexOf(b.level))
}

/**
 * Return the support level for a specific (wallet, standard) pair.
 * Returns `'none'` when the pair is absent from the matrix.
 */
export function getSupportLevel(
  walletId: WalletId,
  standard: TokenStandard,
): SupportLevel {
  return (
    COMPATIBILITY_MATRIX.find(
      e => e.walletId === walletId && e.standard === standard,
    )?.level ?? 'none'
  )
}

/**
 * Return all standards that a wallet supports at the given minimum level.
 */
export function getSupportedStandards(
  walletId: WalletId,
  minLevel: SupportLevel = 'view',
): TokenStandard[] {
  const order: SupportLevel[] = ['full', 'partial', 'view', 'none']
  const minIndex = order.indexOf(minLevel)
  return COMPATIBILITY_MATRIX
    .filter(e => e.walletId === walletId && order.indexOf(e.level) <= minIndex)
    .map(e => e.standard)
}

/**
 * Generate a user-facing compatibility message for a (wallet, standard) pair.
 */
export function getCompatibilityMessage(
  walletId: WalletId,
  standard: TokenStandard,
): string {
  const entry = COMPATIBILITY_MATRIX.find(
    e => e.walletId === walletId && e.standard === standard,
  )
  const level: SupportLevel = entry?.level ?? 'none'
  const walletLabel = walletId
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')

  const notesSuffix = entry?.notes ? ` ${entry.notes}.` : ''
  switch (level) {
    case 'full':
      return `${walletLabel} fully supports ${standard} tokens. Holders will see rich metadata and can interact natively.${notesSuffix}`
    case 'partial':
      return `${walletLabel} partially supports ${standard} tokens. Basic display works, but some features may be limited.${notesSuffix}`
    case 'view':
      return `${walletLabel} can display ${standard} token balances, but advanced interactions are not yet supported.${notesSuffix}`
    case 'none':
    default:
      return `${walletLabel} does not currently support ${standard} tokens. Holders may need to use a different wallet.`
  }
}

/**
 * Look up a conversion path between two standards.
 * Returns `undefined` when no path is registered.
 */
export function getConversionPath(
  from: TokenStandard,
  to: TokenStandard,
): ConversionPath | undefined {
  return CONVERSION_PATHS.find(p => p.from === from && p.to === to)
}

/**
 * Determine whether a direct conversion from one standard to another is
 * supported by the platform.
 */
export function isConversionSupported(
  from: TokenStandard,
  to: TokenStandard,
): boolean {
  return CONVERSION_PATHS.find(p => p.from === from && p.to === to)?.supported === true
}

/**
 * Return all target standards that a given standard can be converted to,
 * optionally filtered to supported conversions only.
 */
export function getConversionTargets(
  from: TokenStandard,
  supportedOnly = true,
): TokenStandard[] {
  return CONVERSION_PATHS
    .filter(p => p.from === from && (!supportedOnly || p.supported))
    .map(p => p.to)
}

/**
 * Validate whether a token standard meets the interoperability requirements
 * for a given set of target platforms/wallets.
 *
 * @param standard         The token standard to validate
 * @param requiredWallets  Wallet IDs that holders must be able to use
 * @param minLevel         Minimum acceptable support level (default `'view'`)
 * @returns Validation result with pass/fail per wallet and an overall verdict
 */
export interface InteroperabilityValidation {
  standard: TokenStandard
  overallPass: boolean
  results: Array<{
    walletId: WalletId
    level: SupportLevel
    pass: boolean
    message: string
  }>
}

export function validateInteroperabilityRequirements(
  standard: TokenStandard,
  requiredWallets: WalletId[],
  minLevel: SupportLevel = 'view',
): InteroperabilityValidation {
  const order: SupportLevel[] = ['full', 'partial', 'view', 'none']
  const minIndex = order.indexOf(minLevel)

  const results = requiredWallets.map(walletId => {
    const level = getSupportLevel(walletId, standard)
    const pass = order.indexOf(level) <= minIndex
    return {
      walletId,
      level,
      pass,
      message: getCompatibilityMessage(walletId, standard),
    }
  })

  return {
    standard,
    overallPass: results.every(r => r.pass),
    results,
  }
}

/**
 * Return standards grouped by their blockchain ecosystem.
 */
export type Ecosystem = 'avm' | 'evm'

export function getStandardEcosystem(standard: TokenStandard): Ecosystem {
  const evm: TokenStandard[] = ['ERC20', 'ERC721', 'ERC1155']
  return evm.includes(standard) ? 'evm' : 'avm'
}

/**
 * Return standards that belong to the same blockchain ecosystem as the given
 * standard (excluding the standard itself).
 */
export function getCompatibleEcosystemStandards(
  standard: TokenStandard,
): TokenStandard[] {
  const ecosystem = getStandardEcosystem(standard)
  return TOKEN_STANDARDS.filter(
    s => s !== standard && getStandardEcosystem(s) === ecosystem,
  )
}

/**
 * Return a human-readable label for a support level.
 */
export function formatSupportLevel(level: SupportLevel): string {
  switch (level) {
    case 'full':    return 'Fully Supported'
    case 'partial': return 'Partially Supported'
    case 'view':    return 'View Only'
    case 'none':    return 'Not Supported'
  }
}
