/**
 * Policy Guardrails Utility
 *
 * Provides policy-aware, pre-submission validation for token parameters:
 * - Network ↔ standard compatibility (e.g. ASA only on Algorand chains)
 * - Decimal precision limits per token standard
 * - Token naming and symbol conventions per standard
 * - Total supply bounds for each standard
 *
 * All validation functions are pure and side-effect free so they can be
 * used in computed properties, form validators, and unit tests without
 * any mock setup.
 *
 * Design goals:
 * - Fail-fast: surface policy violations before the user reaches the
 *   submission step so corrections are low-cost.
 * - Actionable: every violation includes a `suggestion` the user can act on.
 * - Standard-safe: never assumes a token standard maps to a single network;
 *   always validates the pair explicitly.
 * - Zero blockchain jargon in user-facing messages.
 *
 * Related files:
 * - src/utils/tokenValidation.ts      (field-level validation primitives)
 * - src/utils/metadataValidation.ts   (ARC metadata quality scoring)
 * - src/stores/guidedLaunch.ts        (consumes policy guardrails pre-submit)
 *
 * Issue: Roadmap — production-grade auth-first issuance UX
 * Roadmap: https://raw.githubusercontent.com/scholtz/biatec-tokens/refs/heads/main/business-owner-roadmap.md
 */

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export interface PolicyViolation {
  /** Unique violation code for programmatic handling */
  code: string
  /** Affected field or parameter */
  field: string
  /** Severity of the violation */
  severity: 'error' | 'warning'
  /** Human-readable problem description (no jargon) */
  message: string
  /** Actionable suggestion for the user */
  suggestion: string
}

export interface PolicyCheckResult {
  /** True only when there are zero error-severity violations */
  isValid: boolean
  /** All violations found, including warnings */
  violations: PolicyViolation[]
  /** Convenience accessor for error-only violations */
  errors: PolicyViolation[]
  /** Convenience accessor for warning-only violations */
  warnings: PolicyViolation[]
}

// ---------------------------------------------------------------------------
// Network ↔ standard compatibility
// ---------------------------------------------------------------------------

/**
 * Algorand-family network identifiers (AVM chains).
 * These networks only support ARC and ASA standards, never ERC.
 */
export const AVM_NETWORKS = [
  'algorand-mainnet',
  'algorand-testnet',
  'voi-mainnet',
  'voi-testnet',
  'aramid-mainnet',
  'aramid-testnet',
] as const

export type AvmNetwork = (typeof AVM_NETWORKS)[number]

/**
 * EVM-family network identifiers.
 * These networks only support ERC standards, never ARC or ASA.
 */
export const EVM_NETWORKS = [
  'ethereum-mainnet',
  'ethereum-sepolia',
  'arbitrum-mainnet',
  'arbitrum-testnet',
  'base-mainnet',
  'base-testnet',
] as const

export type EvmNetwork = (typeof EVM_NETWORKS)[number]

/**
 * AVM-only token standards. Cannot be deployed on EVM chains.
 */
export const AVM_STANDARDS = ['ASA', 'ARC3', 'ARC19', 'ARC69', 'ARC200', 'ARC72'] as const
export type AvmStandard = (typeof AVM_STANDARDS)[number]

/**
 * EVM-only token standards. Cannot be deployed on AVM chains.
 */
export const EVM_STANDARDS = ['ERC20', 'ERC721', 'ERC1155'] as const
export type EvmStandard = (typeof EVM_STANDARDS)[number]

export type TokenStandard = AvmStandard | EvmStandard

/**
 * Check whether a token standard is compatible with the given network.
 *
 * Returns a PolicyViolation when the combination is incompatible, or null
 * when the pair is valid or unknown (unknown values are allowed through to
 * avoid false-positive blocking on new networks/standards).
 *
 * Network identifiers are normalized (underscores → dashes) before matching
 * so both 'algorand_mainnet' and 'algorand-mainnet' are accepted.
 *
 * @param standard  Token standard identifier (e.g. 'ASA', 'ERC20')
 * @param network   Network identifier (e.g. 'algorand-mainnet' or 'algorand_mainnet')
 */
export function validateNetworkCompatibility(
  standard: string,
  network: string,
): PolicyViolation | null {
  if (!standard || !network) return null

  // Normalise separators: the app's TokenTemplate type uses underscores
  // (e.g. 'algorand_mainnet') while the canonical lists use dashes.
  const normalizedNetwork = network.replace(/_/g, '-')

  const isAvmStandard = (AVM_STANDARDS as readonly string[]).includes(standard)
  const isEvmStandard = (EVM_STANDARDS as readonly string[]).includes(standard)
  const isAvmNetwork = (AVM_NETWORKS as readonly string[]).includes(normalizedNetwork)
  const isEvmNetwork = (EVM_NETWORKS as readonly string[]).includes(normalizedNetwork)

  if (isAvmStandard && isEvmNetwork) {
    return {
      code: 'NETWORK_INCOMPATIBLE_AVM_ON_EVM',
      field: 'network',
      severity: 'error',
      message: `${standard} tokens cannot be deployed on EVM-family networks.`,
      suggestion: `Select an Algorand-family network (e.g. Algorand Mainnet) to deploy ${standard} tokens.`,
    }
  }

  if (isEvmStandard && isAvmNetwork) {
    return {
      code: 'NETWORK_INCOMPATIBLE_EVM_ON_AVM',
      field: 'network',
      severity: 'error',
      message: `${standard} tokens cannot be deployed on Algorand-family networks.`,
      suggestion: `Select an EVM-family network (e.g. Ethereum Mainnet) to deploy ${standard} tokens.`,
    }
  }

  return null
}

// ---------------------------------------------------------------------------
// Decimal precision limits per standard
// ---------------------------------------------------------------------------

/**
 * Maximum allowed decimals for each standard.
 * AVM standards use a smaller upper bound than EVM.
 */
export const MAX_DECIMALS_BY_STANDARD: Record<string, number> = {
  // AVM
  ASA: 19,
  ARC3: 19,
  ARC19: 19,
  ARC69: 19,
  ARC200: 6,   // ARC200 fungible tokens: protocol convention limits decimals to 6 for display/UX safety
  ARC72: 0,    // ARC72 = NFT, no decimals
  // EVM
  ERC20: 18,
  ERC721: 0,   // NFT, no decimals
  ERC1155: 0,  // Semi-fungible, no decimals by convention
}

/**
 * NFT standards that must always have 0 decimals.
 */
export const NFT_STANDARDS = ['ARC72', 'ERC721', 'ERC1155'] as const

/**
 * Validate that the decimal precision is within the policy bounds for the standard.
 *
 * @param decimals  Proposed decimal count
 * @param standard  Token standard identifier
 */
export function validateDecimalPrecision(
  decimals: number | undefined | null,
  standard: string,
): PolicyViolation | null {
  if (!standard) return null

  const isNft = (NFT_STANDARDS as readonly string[]).includes(standard)
  const maxDecimals = MAX_DECIMALS_BY_STANDARD[standard]

  if (isNft) {
    if (decimals !== undefined && decimals !== null && decimals !== 0) {
      return {
        code: 'DECIMALS_INVALID_FOR_NFT',
        field: 'decimals',
        severity: 'error',
        message: `${standard} tokens do not support decimal places.`,
        suggestion: 'Set decimals to 0 for non-fungible token standards.',
      }
    }
    return null
  }

  if (decimals === undefined || decimals === null) return null

  if (!Number.isInteger(decimals)) {
    return {
      code: 'DECIMALS_NOT_INTEGER',
      field: 'decimals',
      severity: 'error',
      message: 'Decimal places must be a whole number.',
      suggestion: 'Enter a whole number between 0 and ' + (maxDecimals ?? 18) + '.',
    }
  }

  if (decimals < 0) {
    return {
      code: 'DECIMALS_NEGATIVE',
      field: 'decimals',
      severity: 'error',
      message: 'Decimal places cannot be negative.',
      suggestion: 'Enter a value between 0 and ' + (maxDecimals ?? 18) + '.',
    }
  }

  if (maxDecimals !== undefined && decimals > maxDecimals) {
    return {
      code: 'DECIMALS_EXCEEDS_STANDARD_LIMIT',
      field: 'decimals',
      severity: 'error',
      message: `${standard} supports at most ${maxDecimals} decimal places, but ${decimals} was provided.`,
      suggestion: `Reduce decimals to ${maxDecimals} or fewer for the ${standard} standard.`,
    }
  }

  // Soft warning for unusual high decimals (>12) only for standards where max ≤ 12
  // ERC20 uses 18 as the canonical standard, so skip the warning for standards with high max
  const standardMax = MAX_DECIMALS_BY_STANDARD[standard]
  if (decimals > 12 && !isNft && (standardMax === undefined || standardMax <= 12)) {
    return {
      code: 'DECIMALS_UNUSUALLY_HIGH',
      field: 'decimals',
      severity: 'warning',
      message: `Using ${decimals} decimal places is uncommon and may cause display precision issues.`,
      suggestion:
        'Most fungible tokens use 6–18 decimals. Consider 6 or 18 for widest compatibility.',
    }
  }

  return null
}

// ---------------------------------------------------------------------------
// Token naming conventions
// ---------------------------------------------------------------------------

/** Maximum allowed length for a token name */
export const MAX_TOKEN_NAME_LENGTH = 32

/** Maximum allowed length for a token symbol/unit name */
export const MAX_TOKEN_SYMBOL_LENGTH = 8

/** Minimum required length for a token name */
export const MIN_TOKEN_NAME_LENGTH = 1

/** Minimum required length for a token symbol */
export const MIN_TOKEN_SYMBOL_LENGTH = 1

/**
 * Validate token name against policy conventions.
 *
 * Checks:
 * - Non-empty after trim
 * - Within max length limit (32 chars, ARC convention)
 * - No leading/trailing whitespace (warn)
 * - Printable ASCII only (warn if non-ASCII detected)
 *
 * @param name  Proposed token name
 */
export function validateTokenName(name: string | undefined | null): PolicyViolation | null {
  if (!name) {
    return {
      code: 'NAME_REQUIRED',
      field: 'name',
      severity: 'error',
      message: 'A token name is required.',
      suggestion: 'Enter a descriptive name for your token (e.g. "My Company Token").',
    }
  }

  if (name !== name.trim()) {
    return {
      code: 'NAME_LEADING_TRAILING_SPACE',
      field: 'name',
      severity: 'warning',
      message: 'The token name has leading or trailing spaces.',
      suggestion: 'Remove extra spaces from the beginning and end of the name.',
    }
  }

  const trimmed = name.trim()

  if (trimmed.length < MIN_TOKEN_NAME_LENGTH) {
    return {
      code: 'NAME_TOO_SHORT',
      field: 'name',
      severity: 'error',
      message: 'Token name is too short.',
      suggestion: `Enter at least ${MIN_TOKEN_NAME_LENGTH} character.`,
    }
  }

  if (trimmed.length > MAX_TOKEN_NAME_LENGTH) {
    return {
      code: 'NAME_TOO_LONG',
      field: 'name',
      severity: 'error',
      message: `Token name exceeds the maximum length of ${MAX_TOKEN_NAME_LENGTH} characters.`,
      suggestion: `Shorten the name to ${MAX_TOKEN_NAME_LENGTH} characters or fewer.`,
    }
  }

  // Non-ASCII warning (some wallets / explorers may not render correctly)
  if (/[^\x20-\x7E]/.test(trimmed)) {
    return {
      code: 'NAME_NON_ASCII',
      field: 'name',
      severity: 'warning',
      message: 'The token name contains non-ASCII characters.',
      suggestion:
        'Use only standard letters, numbers, and common punctuation for widest compatibility.',
    }
  }

  return null
}

/**
 * Validate token symbol/unit name against policy conventions.
 *
 * Checks:
 * - Non-empty after trim
 * - Within max length (8 chars for ARC/ASA, wider for ERC)
 * - Uppercase convention (warn if not)
 * - Alphanumeric + limited specials only (warn otherwise)
 *
 * @param symbol   Proposed symbol / unit name
 * @param standard Token standard (affects max length)
 */
export function validateTokenSymbol(
  symbol: string | undefined | null,
  standard: string,
): PolicyViolation | null {
  if (!symbol) {
    return {
      code: 'SYMBOL_REQUIRED',
      field: 'symbol',
      severity: 'error',
      message: 'A token symbol is required.',
      suggestion: 'Enter a short uppercase symbol (e.g. "MYT").',
    }
  }

  const trimmed = symbol.trim()

  if (trimmed.length < MIN_TOKEN_SYMBOL_LENGTH) {
    return {
      code: 'SYMBOL_TOO_SHORT',
      field: 'symbol',
      severity: 'error',
      message: 'Token symbol is too short.',
      suggestion: `Enter at least ${MIN_TOKEN_SYMBOL_LENGTH} character.`,
    }
  }

  const maxLength =
    (AVM_STANDARDS as readonly string[]).includes(standard)
      ? MAX_TOKEN_SYMBOL_LENGTH       // ARC/ASA: 8 chars
      : MAX_TOKEN_SYMBOL_LENGTH * 3   // ERC: 24 chars (relaxed, but guarded)

  if (trimmed.length > maxLength) {
    return {
      code: 'SYMBOL_TOO_LONG',
      field: 'symbol',
      severity: 'error',
      message: `Token symbol exceeds the maximum length of ${maxLength} characters for ${standard || 'this standard'}.`,
      suggestion: `Shorten the symbol to ${maxLength} characters or fewer.`,
    }
  }

  if (trimmed !== trimmed.toUpperCase()) {
    return {
      code: 'SYMBOL_NOT_UPPERCASE',
      field: 'symbol',
      severity: 'warning',
      message: 'Token symbol should be uppercase.',
      suggestion: `Use the uppercase version: "${trimmed.toUpperCase()}"`,
    }
  }

  return null
}

// ---------------------------------------------------------------------------
// Supply bounds
// ---------------------------------------------------------------------------

/** Minimum allowed supply for any token */
export const MIN_TOKEN_SUPPLY = 1

/** Maximum supply for AVM tokens (2^64 - 1, capped at safe-integer here) */
export const MAX_AVM_SUPPLY = Number.MAX_SAFE_INTEGER

/** Maximum supply for EVM tokens (practical upper bound; not enforced at protocol level) */
export const MAX_EVM_SUPPLY = Number.MAX_SAFE_INTEGER

/**
 * Validate total supply bounds against policy limits.
 *
 * @param supply    Proposed total supply
 * @param standard  Token standard
 */
export function validateSupplyBounds(
  supply: number | undefined | null,
  standard: string,
): PolicyViolation | null {
  if (supply === undefined || supply === null) {
    return {
      code: 'SUPPLY_REQUIRED',
      field: 'supply',
      severity: 'error',
      message: 'A total supply is required.',
      suggestion: 'Enter the total number of tokens to create.',
    }
  }

  if (!Number.isFinite(supply)) {
    return {
      code: 'SUPPLY_NOT_FINITE',
      field: 'supply',
      severity: 'error',
      message: 'Supply must be a valid finite number.',
      suggestion: 'Enter a whole number greater than 0.',
    }
  }

  if (supply < MIN_TOKEN_SUPPLY) {
    return {
      code: 'SUPPLY_TOO_LOW',
      field: 'supply',
      severity: 'error',
      message: `Supply must be at least ${MIN_TOKEN_SUPPLY}.`,
      suggestion: `Set supply to ${MIN_TOKEN_SUPPLY} or higher.`,
    }
  }

  const isNft = (NFT_STANDARDS as readonly string[]).includes(standard)
  if (isNft && supply !== 1) {
    return {
      code: 'SUPPLY_INVALID_FOR_NFT',
      field: 'supply',
      severity: 'warning',
      message: `${standard} non-fungible tokens typically have a supply of 1.`,
      suggestion: 'Set supply to 1 unless you intend to create a semi-fungible collection.',
    }
  }

  return null
}

// ---------------------------------------------------------------------------
// Aggregate policy check
// ---------------------------------------------------------------------------

/**
 * Run all applicable policy guardrails against the provided token parameters.
 *
 * Returns a consolidated result with all violations and a top-level `isValid`
 * flag that is true only when there are no error-severity violations.
 *
 * @param params  Token parameter object
 */
export function runPolicyGuardrails(params: {
  standard?: string
  network?: string
  decimals?: number | null
  name?: string | null
  /** Pass a string value to validate, omit the key entirely to skip symbol validation. */
  symbol?: string | null
  supply?: number | null
}): PolicyCheckResult {
  const violations: PolicyViolation[] = []

  const networkViolation = validateNetworkCompatibility(
    params.standard ?? '',
    params.network ?? '',
  )
  if (networkViolation) violations.push(networkViolation)

  const decimalViolation = validateDecimalPrecision(params.decimals, params.standard ?? '')
  if (decimalViolation) violations.push(decimalViolation)

  const nameViolation = validateTokenName(params.name)
  if (nameViolation) violations.push(nameViolation)

  // Only validate symbol when the caller explicitly includes the key (even as null/empty).
  // Omitting 'symbol' from params means the caller doesn't yet have a symbol to check.
  if ('symbol' in params) {
    const symbolViolation = validateTokenSymbol(params.symbol, params.standard ?? '')
    if (symbolViolation) violations.push(symbolViolation)
  }

  const supplyViolation = validateSupplyBounds(params.supply, params.standard ?? '')
  if (supplyViolation) violations.push(supplyViolation)

  const errors = violations.filter((v) => v.severity === 'error')
  const warnings = violations.filter((v) => v.severity === 'warning')

  return {
    isValid: errors.length === 0,
    violations,
    errors,
    warnings,
  }
}
