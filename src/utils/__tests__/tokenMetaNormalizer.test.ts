/**
 * Unit tests for tokenMetaNormalizer
 */

import { describe, it, expect } from 'vitest'
import type { Token } from '../../stores/tokens'
import {
  normalizeTokenMeta,
  normalizeTokenList,
  formatTokenSupply,
  metaCompletenessLabel,
} from '../tokenMetaNormalizer'

// ─── helpers ────────────────────────────────────────────────────────────────

function makeToken(overrides: Partial<Token> = {}): Token {
  return {
    id: 'abc12345-0000-0000-0000-000000000000',
    name: 'My Token',
    symbol: 'MTK',
    standard: 'ARC3FT',
    type: 'FT',
    supply: 1_000_000,
    decimals: 6,
    description: 'A test token',
    imageUrl: 'https://example.com/image.png',
    status: 'deployed',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    txId: 'TX123',
    assetId: 99999,
    ...overrides,
  }
}

// ─── formatTokenSupply ───────────────────────────────────────────────────────

describe('formatTokenSupply', () => {
  it('returns em-dash for undefined', () => {
    expect(formatTokenSupply(undefined)).toBe('—')
  })

  it('returns em-dash for null', () => {
    expect(formatTokenSupply(null)).toBe('—')
  })

  it('returns em-dash for NaN', () => {
    expect(formatTokenSupply(NaN)).toBe('—')
  })

  it('formats small numbers as plain locale string', () => {
    expect(formatTokenSupply(500)).toBe('500')
  })

  it('formats thousands with K suffix', () => {
    expect(formatTokenSupply(5_000)).toBe('5.00K')
  })

  it('formats millions with M suffix', () => {
    expect(formatTokenSupply(2_500_000)).toBe('2.50M')
  })

  it('formats billions with B suffix', () => {
    expect(formatTokenSupply(1_200_000_000)).toBe('1.20B')
  })

  it('formats zero', () => {
    expect(formatTokenSupply(0)).toBe('0')
  })
})

// ─── normalizeTokenMeta – display fields ────────────────────────────────────

describe('normalizeTokenMeta – display fields', () => {
  it('returns the token name when present', () => {
    const meta = normalizeTokenMeta(makeToken({ name: 'Cool Token' }))
    expect(meta.displayName).toBe('Cool Token')
  })

  it('falls back to id-derived name when name is empty', () => {
    const meta = normalizeTokenMeta(makeToken({ name: '' }))
    expect(meta.displayName).toMatch(/^Token [A-F0-9]+$/)
  })

  it('trims whitespace from name', () => {
    const meta = normalizeTokenMeta(makeToken({ name: '  Padded  ' }))
    expect(meta.displayName).toBe('Padded')
  })

  it('upper-cases the symbol', () => {
    const meta = normalizeTokenMeta(makeToken({ symbol: 'mtk' }))
    expect(meta.displaySymbol).toBe('MTK')
  })

  it('returns em-dash for empty symbol', () => {
    const meta = normalizeTokenMeta(makeToken({ symbol: '' }))
    expect(meta.displaySymbol).toBe('—')
  })

  it('returns description when present', () => {
    const meta = normalizeTokenMeta(makeToken({ description: 'Hello' }))
    expect(meta.displayDescription).toBe('Hello')
  })

  it('returns fallback description when empty', () => {
    const meta = normalizeTokenMeta(makeToken({ description: '' }))
    expect(meta.displayDescription).toBe('No description provided.')
  })

  it('resolves valid imageUrl', () => {
    const meta = normalizeTokenMeta(makeToken({ imageUrl: 'https://cdn.test/img.png' }))
    expect(meta.resolvedImageUrl).toBe('https://cdn.test/img.png')
  })

  it('rejects data URI as imageUrl', () => {
    const meta = normalizeTokenMeta(makeToken({ imageUrl: 'data:image/png;base64,ABC' }))
    expect(meta.resolvedImageUrl).toBeNull()
  })

  it('returns null resolvedImageUrl when imageUrl is undefined', () => {
    const meta = normalizeTokenMeta(makeToken({ imageUrl: undefined }))
    expect(meta.resolvedImageUrl).toBeNull()
  })
})

// ─── normalizeTokenMeta – chain ID ──────────────────────────────────────────

describe('normalizeTokenMeta – chain ID', () => {
  it('prefers assetId over contractAddress', () => {
    const meta = normalizeTokenMeta(makeToken({ assetId: 42, contractAddress: '0xABC' }))
    expect(meta.chainId).toBe('42')
    expect(meta.hasChainId).toBe(true)
  })

  it('falls back to contractAddress when assetId is undefined', () => {
    const meta = normalizeTokenMeta(makeToken({ assetId: undefined, contractAddress: '0xDEF' }))
    expect(meta.chainId).toBe('0xDEF')
    expect(meta.hasChainId).toBe(true)
  })

  it('returns null chainId when neither assetId nor contractAddress is set', () => {
    const meta = normalizeTokenMeta(makeToken({ assetId: undefined, contractAddress: undefined }))
    expect(meta.chainId).toBeNull()
    expect(meta.hasChainId).toBe(false)
  })
})

// ─── normalizeTokenMeta – supply and decimals ────────────────────────────────

describe('normalizeTokenMeta – supply and decimals', () => {
  it('formats supply correctly', () => {
    const meta = normalizeTokenMeta(makeToken({ supply: 8_000_000 }))
    expect(meta.displaySupply).toBe('8.00M')
  })

  it('shows decimals as string', () => {
    const meta = normalizeTokenMeta(makeToken({ decimals: 6 }))
    expect(meta.displayDecimals).toBe('6')
  })

  it('returns em-dash for undefined decimals', () => {
    const meta = normalizeTokenMeta(makeToken({ decimals: undefined }))
    expect(meta.displayDecimals).toBe('—')
  })
})

// ─── normalizeTokenMeta – completeness ───────────────────────────────────────

describe('normalizeTokenMeta – completeness', () => {
  it('marks as complete when name, symbol, description are present', () => {
    const meta = normalizeTokenMeta(makeToken())
    expect(meta.isComplete).toBe(true)
  })

  it('marks as incomplete when name is empty', () => {
    const meta = normalizeTokenMeta(makeToken({ name: '' }))
    expect(meta.isComplete).toBe(false)
  })

  it('marks as incomplete when description is empty', () => {
    const meta = normalizeTokenMeta(makeToken({ description: '' }))
    expect(meta.isComplete).toBe(false)
  })

  it('lists missing optional fields', () => {
    const meta = normalizeTokenMeta(makeToken({ imageUrl: undefined, txId: undefined, decimals: undefined }))
    expect(meta.missingOptionalFields).toContain('image')
    expect(meta.missingOptionalFields).toContain('txId')
    expect(meta.missingOptionalFields).toContain('decimals')
  })

  it('has no missing optional fields for fully populated token', () => {
    const meta = normalizeTokenMeta(makeToken())
    expect(meta.missingOptionalFields).toHaveLength(0)
  })
})

// ─── normalizeTokenMeta – status ─────────────────────────────────────────────

describe('normalizeTokenMeta – status', () => {
  it('labels deployed status correctly', () => {
    const meta = normalizeTokenMeta(makeToken({ status: 'deployed' }))
    expect(meta.displayStatus).toBe('Deployed')
    expect(meta.isTerminal).toBe(true)
  })

  it('labels failed status correctly', () => {
    const meta = normalizeTokenMeta(makeToken({ status: 'failed' }))
    expect(meta.displayStatus).toBe('Failed')
    expect(meta.isTerminal).toBe(true)
  })

  it('labels deploying status correctly', () => {
    const meta = normalizeTokenMeta(makeToken({ status: 'deploying' }))
    expect(meta.displayStatus).toBe('Deploying…')
    expect(meta.isTerminal).toBe(false)
  })

  it('labels created status correctly', () => {
    const meta = normalizeTokenMeta(makeToken({ status: 'created' }))
    expect(meta.displayStatus).toBe('Created')
    expect(meta.isTerminal).toBe(false)
  })

  it('assigns green colour class for deployed', () => {
    const meta = normalizeTokenMeta(makeToken({ status: 'deployed' }))
    expect(meta.statusColorClass).toContain('green')
  })

  it('assigns red colour class for failed', () => {
    const meta = normalizeTokenMeta(makeToken({ status: 'failed' }))
    expect(meta.statusColorClass).toContain('red')
  })

  it('assigns yellow colour class for deploying', () => {
    const meta = normalizeTokenMeta(makeToken({ status: 'deploying' }))
    expect(meta.statusColorClass).toContain('yellow')
  })

  it('assigns blue colour class for created', () => {
    const meta = normalizeTokenMeta(makeToken({ status: 'created' }))
    expect(meta.statusColorClass).toContain('blue')
  })
})

// ─── normalizeTokenList ──────────────────────────────────────────────────────

describe('normalizeTokenList', () => {
  it('returns empty array for empty input', () => {
    expect(normalizeTokenList([])).toEqual([])
  })

  it('maps each token to a { token, meta } pair', () => {
    const tokens = [makeToken({ id: 'a-0', name: 'A' }), makeToken({ id: 'b-0', name: 'B' })]
    const result = normalizeTokenList(tokens)
    expect(result).toHaveLength(2)
    expect(result[0].token.id).toBe('a-0')
    expect(result[0].meta.displayName).toBe('A')
    expect(result[1].token.id).toBe('b-0')
    expect(result[1].meta.displayName).toBe('B')
  })

  it('filters out null/undefined entries', () => {
    // Cast to bypass TypeScript for the test
    const tokens = [null, makeToken({ id: 'c-0' }), undefined] as unknown as Token[]
    const result = normalizeTokenList(tokens)
    expect(result).toHaveLength(1)
    expect(result[0].token.id).toBe('c-0')
  })
})

// ─── normalizeTokenMeta – null optional fields ───────────────────────────────

describe('normalizeTokenMeta – null optional fields (branch coverage)', () => {
  it('handles null name gracefully (null-safe trim)', () => {
    // null triggers the `?.` optional chaining fallback
    const meta = normalizeTokenMeta(makeToken({ name: null as unknown as string }))
    expect(meta.displayName).toMatch(/^Token [A-F0-9]+$/)
    expect(meta.isComplete).toBe(false)
  })

  it('handles null symbol gracefully', () => {
    const meta = normalizeTokenMeta(makeToken({ symbol: null as unknown as string }))
    expect(meta.displaySymbol).toBe('—')
  })

  it('handles null description gracefully (covers ?? 0 branch)', () => {
    const meta = normalizeTokenMeta(makeToken({ description: null as unknown as string }))
    expect(meta.displayDescription).toBe('No description provided.')
    expect(meta.isComplete).toBe(false)
  })

  it('handles unknown token status (covers ?? fallback in STATUS_LABELS and STATUS_COLOR_CLASSES)', () => {
    const meta = normalizeTokenMeta(makeToken({ status: 'unknown_status' as Token['status'] }))
    // Should fall back to the raw status string
    expect(meta.displayStatus).toBe('unknown_status')
    // Should fall back to the gray default colour class
    expect(meta.statusColorClass).toContain('gray')
  })

  it('handles empty imageUrl string (treated same as missing)', () => {
    const meta = normalizeTokenMeta(makeToken({ imageUrl: '' }))
    expect(meta.resolvedImageUrl).toBeNull()
  })

  it('handles NaN decimals (covers !isNaN branch)', () => {
    const meta = normalizeTokenMeta(makeToken({ decimals: NaN }))
    expect(meta.displayDecimals).toBe('—')
  })
})

// ─── metaCompletenessLabel ───────────────────────────────────────────────────

describe('metaCompletenessLabel', () => {
  it('returns "Complete" for fully populated token', () => {
    const meta = normalizeTokenMeta(makeToken())
    expect(metaCompletenessLabel(meta)).toBe('Complete')
  })

  it('returns "Partial" label when optional fields are missing', () => {
    const meta = normalizeTokenMeta(makeToken({ imageUrl: undefined }))
    expect(metaCompletenessLabel(meta)).toContain('Partial')
    expect(metaCompletenessLabel(meta)).toContain('image')
  })

  it('returns "Incomplete" label when required fields are missing', () => {
    const meta = normalizeTokenMeta(makeToken({ name: '', description: '' }))
    expect(metaCompletenessLabel(meta)).toBe('Incomplete')
  })
})
