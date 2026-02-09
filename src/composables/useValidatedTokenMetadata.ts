/**
 * Composable for integrating token metadata with validation
 * Provides validated and normalized metadata for token display
 */

import { ref, computed } from 'vue'
import type { AssetMetadata } from './useTokenMetadata'
import {
  validateTokenMetadata,
  normalizeMetadata,
  determineTokenStandard,
  type MetadataValidationResult,
  type NormalizedMetadata,
  type MetadataStandard
} from '../utils/metadataValidation'

export interface ValidatedTokenMetadata {
  original: AssetMetadata | null
  normalized: NormalizedMetadata | null
  validation: MetadataValidationResult | null
  isLoading: boolean
  error: string | null
}

/**
 * Composable that combines token metadata fetching with validation
 */
export function useValidatedTokenMetadata() {
  const validatedMetadata = ref<Map<number, ValidatedTokenMetadata>>(new Map())

  /**
   * Validates and normalizes token metadata
   */
  const validateAndNormalize = (
    assetMetadata: AssetMetadata
  ): ValidatedTokenMetadata => {
    const assetId = assetMetadata.assetId

    try {
      // Determine standard
      const standard = determineTokenStandard(assetMetadata.url, !!assetMetadata.arc3) as MetadataStandard

      // Validate metadata
      const validation = validateTokenMetadata(
        standard,
        assetMetadata.url,
        assetMetadata.arc3,
        undefined // ARC69 metadata - not supported yet in AssetMetadata interface
      )

      // Normalize metadata for display
      const assetParams = {
        assetId,
        name: assetMetadata.name,
        unitName: assetMetadata.unitName,
        decimals: assetMetadata.decimals,
        total: assetMetadata.total,
        creator: assetMetadata.creator
      }

      const normalized = normalizeMetadata(
        standard,
        assetParams,
        assetMetadata.arc3
      )

      const result: ValidatedTokenMetadata = {
        original: assetMetadata,
        normalized,
        validation,
        isLoading: false,
        error: null
      }

      validatedMetadata.value.set(assetId, result)
      return result
    } catch (error: any) {
      const errorResult: ValidatedTokenMetadata = {
        original: assetMetadata,
        normalized: null,
        validation: null,
        isLoading: false,
        error: error.message || 'Failed to validate metadata'
      }

      validatedMetadata.value.set(assetId, errorResult)
      return errorResult
    }
  }

  /**
   * Gets validated metadata for an asset
   */
  const getValidatedMetadata = (assetMetadata: AssetMetadata | null): ValidatedTokenMetadata | null => {
    if (!assetMetadata) return null

    const cached = validatedMetadata.value.get(assetMetadata.assetId)
    if (cached && !cached.isLoading) {
      return cached
    }

    return validateAndNormalize(assetMetadata)
  }

  /**
   * Clears the cache
   */
  const clearCache = () => {
    validatedMetadata.value.clear()
  }

  /**
   * Gets validation summary text
   */
  const getValidationSummary = (validation: MetadataValidationResult | null): string => {
    if (!validation) return 'No validation available'
    return validation.summary
  }

  /**
   * Checks if metadata has any critical issues
   */
  const hasCriticalIssues = (validation: MetadataValidationResult | null): boolean => {
    if (!validation) return false
    return validation.issues.some(issue => issue.severity === 'error')
  }

  /**
   * Gets the count of issues by severity
   */
  const getIssueCounts = (validation: MetadataValidationResult | null) => {
    if (!validation) {
      return { errors: 0, warnings: 0, info: 0 }
    }

    return {
      errors: validation.issues.filter(i => i.severity === 'error').length,
      warnings: validation.issues.filter(i => i.severity === 'warning').length,
      info: validation.issues.filter(i => i.severity === 'info').length
    }
  }

  return {
    validatedMetadata: computed(() => validatedMetadata.value),
    getValidatedMetadata,
    validateAndNormalize,
    clearCache,
    getValidationSummary,
    hasCriticalIssues,
    getIssueCounts
  }
}
