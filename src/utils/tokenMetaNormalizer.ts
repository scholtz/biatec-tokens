/**
 * Token Metadata Normalizer
 *
 * Provides utilities for normalizing and handling partial/missing token metadata
 * consistently across portfolio list and detail views. Ensures users always see
 * meaningful fallback values rather than empty or broken states.
 */

import type { Token } from '../stores/tokens'

export interface NormalizedTokenMeta {
  /** Display-safe token name, never empty */
  displayName: string
  /** Display-safe symbol, never empty */
  displaySymbol: string
  /** Display-safe description, never empty */
  displayDescription: string
  /** Resolved image URL or null when no image available */
  resolvedImageUrl: string | null
  /** Whether the token has a valid on-chain identifier */
  hasChainId: boolean
  /** The on-chain identifier (assetId or contractAddress), or null */
  chainId: string | null
  /** Display-safe supply string */
  displaySupply: string
  /** Display-safe decimals string */
  displayDecimals: string
  /** Whether metadata is considered complete (has name, symbol, description) */
  isComplete: boolean
  /** List of missing optional metadata fields */
  missingOptionalFields: string[]
  /** Whether the token is in a terminal state (deployed or failed) */
  isTerminal: boolean
  /** Status label with proper capitalisation */
  displayStatus: string
  /** CSS class name for the status badge colour */
  statusColorClass: string
}

/**
 * Fallback name derived from the token id when name is missing.
 */
function deriveFallbackName(id: string): string {
  // Use first 8 chars of id as a human-readable placeholder
  const short = id.replace(/-/g, '').slice(0, 8).toUpperCase()
  return `Token ${short}`
}

/**
 * Format a numeric supply value into a compact, human-readable string.
 */
export function formatTokenSupply(supply: number | undefined | null): string {
  if (supply == null || isNaN(supply)) return '—'
  if (supply >= 1_000_000_000) return `${(supply / 1_000_000_000).toFixed(2)}B`
  if (supply >= 1_000_000) return `${(supply / 1_000_000).toFixed(2)}M`
  if (supply >= 1_000) return `${(supply / 1_000).toFixed(2)}K`
  return supply.toLocaleString('en-US')
}

const STATUS_LABELS: Record<Token['status'], string> = {
  created: 'Created',
  deploying: 'Deploying…',
  deployed: 'Deployed',
  failed: 'Failed',
}

const STATUS_COLOR_CLASSES: Record<Token['status'], string> = {
  created: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  deploying: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  deployed: 'bg-green-500/20 text-green-400 border-green-500/30',
  failed: 'bg-red-500/20 text-red-400 border-red-500/30',
}

/**
 * Normalize a Token object into a display-safe NormalizedTokenMeta.
 * Always returns a fully-populated object so callers never need to handle
 * undefined/null at the rendering layer.
 */
export function normalizeTokenMeta(token: Token): NormalizedTokenMeta {
  const displayName =
    token.name && token.name.trim().length > 0
      ? token.name.trim()
      : deriveFallbackName(token.id)

  const displaySymbol =
    token.symbol && token.symbol.trim().length > 0
      ? token.symbol.trim().toUpperCase()
      : '—'

  const displayDescription =
    token.description && token.description.trim().length > 0
      ? token.description.trim()
      : 'No description provided.'

  // Validate image URL — reject data URIs and obviously bad strings
  let resolvedImageUrl: string | null = null
  if (
    token.imageUrl &&
    token.imageUrl.trim().length > 0 &&
    !token.imageUrl.startsWith('data:')
  ) {
    resolvedImageUrl = token.imageUrl.trim()
  }

  // Determine on-chain identifier
  let chainId: string | null = null
  if (token.assetId != null) {
    chainId = String(token.assetId)
  } else if (token.contractAddress && token.contractAddress.trim().length > 0) {
    chainId = token.contractAddress.trim()
  }

  const missingOptionalFields: string[] = []
  if (!token.imageUrl) missingOptionalFields.push('image')
  if (!token.txId) missingOptionalFields.push('txId')
  if (token.decimals == null) missingOptionalFields.push('decimals')

  const isComplete =
    (token.name?.trim().length ?? 0) > 0 &&
    (token.symbol?.trim().length ?? 0) > 0 &&
    (token.description?.trim().length ?? 0) > 0

  const displaySupply = formatTokenSupply(token.supply)

  const displayDecimals =
    token.decimals != null && !isNaN(token.decimals)
      ? String(token.decimals)
      : '—'

  const isTerminal = token.status === 'deployed' || token.status === 'failed'

  const displayStatus = STATUS_LABELS[token.status] ?? token.status

  const statusColorClass =
    STATUS_COLOR_CLASSES[token.status] ??
    'bg-gray-500/20 text-gray-400 border-gray-500/30'

  return {
    displayName,
    displaySymbol,
    displayDescription,
    resolvedImageUrl,
    hasChainId: chainId !== null,
    chainId,
    displaySupply,
    displayDecimals,
    isComplete,
    missingOptionalFields,
    isTerminal,
    displayStatus,
    statusColorClass,
  }
}

/**
 * Normalise an array of tokens, filtering out any null/undefined entries.
 */
export function normalizeTokenList(tokens: Token[]): Array<{ token: Token; meta: NormalizedTokenMeta }> {
  return tokens
    .filter((t): t is Token => t != null)
    .map(token => ({ token, meta: normalizeTokenMeta(token) }))
}

/**
 * Return a user-readable label for a token's metadata completeness.
 */
export function metaCompletenessLabel(meta: NormalizedTokenMeta): string {
  if (meta.isComplete && meta.missingOptionalFields.length === 0) {
    return 'Complete'
  }
  if (meta.isComplete) {
    return `Partial (missing: ${meta.missingOptionalFields.join(', ')})`
  }
  return 'Incomplete'
}
