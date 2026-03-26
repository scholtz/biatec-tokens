import { describe, it, expect, beforeEach } from 'vitest'
import { useValidatedTokenMetadata } from '../useValidatedTokenMetadata'
import type { AssetMetadata } from '../useTokenMetadata'

function makeAsset(overrides: Partial<AssetMetadata> = {}): AssetMetadata {
  return {
    assetId: 123,
    name: 'Test Token',
    unitName: 'TT',
    decimals: 6,
    total: 1000000,
    creator: 'CREATOR_ADDRESS',
    isVerified: false,
    isLoading: false,
    ...overrides,
  }
}

describe('useValidatedTokenMetadata', () => {
  let composable: ReturnType<typeof useValidatedTokenMetadata>

  beforeEach(() => {
    composable = useValidatedTokenMetadata()
  })

  describe('validateAndNormalize', () => {
    it('returns a ValidatedTokenMetadata for a basic ASA asset', () => {
      const asset = makeAsset()
      const result = composable.validateAndNormalize(asset)
      expect(result).toBeDefined()
      expect(result.original).toBe(asset)
      expect(result.isLoading).toBe(false)
      expect(result.error).toBeNull()
    })

    it('sets normalized metadata', () => {
      const asset = makeAsset()
      const result = composable.validateAndNormalize(asset)
      expect(result.normalized).not.toBeNull()
    })

    it('sets validation result', () => {
      const asset = makeAsset()
      const result = composable.validateAndNormalize(asset)
      expect(result.validation).not.toBeNull()
    })

    it('handles ARC3 asset with arc3 metadata', () => {
      const asset = makeAsset({
        url: 'ipfs://QmTest',
        arc3: { name: 'ARC3 Token', decimals: 6 },
      })
      const result = composable.validateAndNormalize(asset)
      expect(result.original).toBe(asset)
      expect(result.isLoading).toBe(false)
    })

    it('stores result in cache', () => {
      const asset = makeAsset({ assetId: 999 })
      composable.validateAndNormalize(asset)
      expect(composable.validatedMetadata.value.has(999)).toBe(true)
    })

    it('handles validation error gracefully', () => {
      // Passing an asset that might cause an error in validation
      const asset = makeAsset({ assetId: 0, name: '', unitName: '' })
      const result = composable.validateAndNormalize(asset)
      expect(result).toBeDefined()
      expect(result.isLoading).toBe(false)
    })
  })

  describe('getValidatedMetadata', () => {
    it('returns null for null input', () => {
      const result = composable.getValidatedMetadata(null)
      expect(result).toBeNull()
    })

    it('validates and returns result for an asset', () => {
      const asset = makeAsset({ assetId: 42 })
      const result = composable.getValidatedMetadata(asset)
      expect(result).not.toBeNull()
      expect(result?.original).toBe(asset)
    })

    it('returns cached result on second call', () => {
      const asset = makeAsset({ assetId: 55 })
      const first = composable.getValidatedMetadata(asset)
      const second = composable.getValidatedMetadata(asset)
      expect(first).toEqual(second)
    })
  })

  describe('clearCache', () => {
    it('clears cached metadata', () => {
      const asset = makeAsset({ assetId: 77 })
      composable.validateAndNormalize(asset)
      expect(composable.validatedMetadata.value.size).toBeGreaterThan(0)
      composable.clearCache()
      expect(composable.validatedMetadata.value.size).toBe(0)
    })
  })

  describe('getValidationSummary', () => {
    it('returns "No validation available" for null', () => {
      expect(composable.getValidationSummary(null)).toBe('No validation available')
    })

    it('returns the summary from validation result', () => {
      const asset = makeAsset()
      const result = composable.validateAndNormalize(asset)
      if (result.validation) {
        const summary = composable.getValidationSummary(result.validation)
        expect(typeof summary).toBe('string')
      }
    })
  })

  describe('hasCriticalIssues', () => {
    it('returns false for null validation', () => {
      expect(composable.hasCriticalIssues(null)).toBe(false)
    })

    it('returns boolean for actual validation result', () => {
      const asset = makeAsset()
      const result = composable.validateAndNormalize(asset)
      const critical = composable.hasCriticalIssues(result.validation)
      expect(typeof critical).toBe('boolean')
    })
  })

  describe('getIssueCounts', () => {
    it('returns zero counts for null validation', () => {
      const counts = composable.getIssueCounts(null)
      expect(counts).toEqual({ errors: 0, warnings: 0, info: 0 })
    })

    it('returns counts for actual validation result', () => {
      const asset = makeAsset()
      const result = composable.validateAndNormalize(asset)
      const counts = composable.getIssueCounts(result.validation)
      expect(counts).toHaveProperty('errors')
      expect(counts).toHaveProperty('warnings')
      expect(counts).toHaveProperty('info')
    })

    it('counts are non-negative numbers', () => {
      const asset = makeAsset()
      const result = composable.validateAndNormalize(asset)
      const counts = composable.getIssueCounts(result.validation)
      expect(counts.errors).toBeGreaterThanOrEqual(0)
      expect(counts.warnings).toBeGreaterThanOrEqual(0)
      expect(counts.info).toBeGreaterThanOrEqual(0)
    })
  })
})
