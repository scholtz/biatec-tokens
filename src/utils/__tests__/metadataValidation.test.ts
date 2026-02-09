/**
 * Unit tests for metadata validation utilities
 * Tests ARC3, ARC69, and ARC19 validation and normalization
 */

import { describe, it, expect } from 'vitest'
import {
  validateUrl,
  resolveIpfsUrl,
  normalizeMetadataUrl,
  validateARC3Metadata,
  validateARC69Metadata,
  validateARC19Metadata,
  determineTokenStandard,
  validateTokenMetadata,
  normalizeMetadata,
  getScoreColorClass,
  getScoreBadgeLabel
} from '../metadataValidation'

import {
  validARC3Metadata,
  minimalARC3Metadata,
  invalidARC3Metadata,
  missingNameARC3,
  invalidImageUrlARC3,
  validARC69Metadata,
  minimalARC69Metadata,
  invalidARC69Metadata,
  validARC19Url,
  validARC19UrlWithCid,
  invalidARC19UrlNoPlaceholder,
  invalidARC19UrlWrongProtocol,
  invalidARC19UrlNone,
  sampleAssetParamsARC3,
  sampleAssetParamsARC19,
  sampleAssetParamsASA,
  sampleAssetParamsNoUrl,
  urlTestCases,
  imageUrlResolutionCases,
  normalizationTestCases,
  nullMetadata,
  undefinedMetadata
} from '../../test/fixtures/metadataFixtures'

describe('metadataValidation', () => {
  describe('validateUrl', () => {
    it('should validate HTTP URLs', () => {
      expect(validateUrl(urlTestCases.validHttp)).toBe(true)
      expect(validateUrl(urlTestCases.validHttps)).toBe(true)
    })

    it('should validate IPFS URLs', () => {
      expect(validateUrl(urlTestCases.validIpfs)).toBe(true)
      expect(validateUrl(urlTestCases.validTemplateIpfs)).toBe(true)
    })

    it('should reject invalid URLs', () => {
      expect(validateUrl(urlTestCases.invalidFtp)).toBe(false)
      expect(validateUrl(urlTestCases.invalidEmpty)).toBe(false)
      expect(validateUrl(urlTestCases.invalidNoProtocol)).toBe(false)
    })
  })

  describe('resolveIpfsUrl', () => {
    it('should resolve ipfs:// URLs to HTTP gateway', () => {
      const result = resolveIpfsUrl(imageUrlResolutionCases.ipfsUrl)
      expect(result).toBe(imageUrlResolutionCases.expectedIpfsResolved)
    })

    it('should resolve template-ipfs:// URLs', () => {
      const result = resolveIpfsUrl('template-ipfs://QmTest')
      expect(result).toBe('https://ipfs.io/ipfs/QmTest')
    })

    it('should not modify HTTP URLs', () => {
      const result = resolveIpfsUrl(imageUrlResolutionCases.httpUrl)
      expect(result).toBe(imageUrlResolutionCases.httpUrl)
    })

    it('should use custom gateway if provided', () => {
      const customGateway = 'https://custom.gateway/'
      const result = resolveIpfsUrl('ipfs://QmTest', customGateway)
      expect(result).toBe('https://custom.gateway/QmTest')
    })
  })

  describe('normalizeMetadataUrl', () => {
    it('should remove #arc3 fragment and resolve IPFS', () => {
      const result = normalizeMetadataUrl(imageUrlResolutionCases.arc3Url)
      expect(result).toBe(imageUrlResolutionCases.expectedArc3Resolved)
    })

    it('should return null for undefined URL', () => {
      expect(normalizeMetadataUrl(undefined)).toBeNull()
    })

    it('should handle HTTP URLs', () => {
      const result = normalizeMetadataUrl(imageUrlResolutionCases.httpUrl)
      expect(result).toBe(imageUrlResolutionCases.expectedHttpResolved)
    })
  })

  describe('validateARC3Metadata', () => {
    it('should pass validation for valid ARC3 metadata', () => {
      const issues = validateARC3Metadata(validARC3Metadata)
      expect(issues).toHaveLength(0)
    })

    it('should report missing name as error', () => {
      const issues = validateARC3Metadata(missingNameARC3)
      expect(issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'name',
            severity: 'error',
            message: expect.stringContaining('required')
          })
        ])
      )
    })

    it('should report empty name as error', () => {
      const issues = validateARC3Metadata(invalidARC3Metadata)
      const nameIssue = issues.find(i => i.field === 'name')
      expect(nameIssue).toBeDefined()
      expect(nameIssue?.severity).toBe('error')
    })

    it('should report missing description as warning', () => {
      const issues = validateARC3Metadata(minimalARC3Metadata)
      const descIssue = issues.find(i => i.field === 'description')
      expect(descIssue).toBeDefined()
      expect(descIssue?.severity).toBe('warning')
    })

    it('should report missing image as warning', () => {
      const issues = validateARC3Metadata(minimalARC3Metadata)
      const imgIssue = issues.find(i => i.field === 'image')
      expect(imgIssue).toBeDefined()
      expect(imgIssue?.severity).toBe('warning')
    })

    it('should report invalid image URL as error', () => {
      const issues = validateARC3Metadata(invalidImageUrlARC3)
      const imgIssue = issues.find(i => i.field === 'image')
      expect(imgIssue).toBeDefined()
      expect(imgIssue?.severity).toBe('error')
      expect(imgIssue?.message).toContain('invalid')
    })

    it('should report missing image_integrity as info', () => {
      const metadataWithImage = {
        ...validARC3Metadata,
        image_integrity: undefined
      }
      const issues = validateARC3Metadata(metadataWithImage)
      const integrityIssue = issues.find(i => i.field === 'image_integrity')
      expect(integrityIssue).toBeDefined()
      expect(integrityIssue?.severity).toBe('info')
    })

    it('should report missing image_mimetype as info', () => {
      const metadataWithImage = {
        ...validARC3Metadata,
        image_mimetype: undefined
      }
      const issues = validateARC3Metadata(metadataWithImage)
      const mimetypeIssue = issues.find(i => i.field === 'image_mimetype')
      expect(mimetypeIssue).toBeDefined()
      expect(mimetypeIssue?.severity).toBe('info')
    })

    it('should report invalid decimals as error', () => {
      const issues = validateARC3Metadata(invalidARC3Metadata)
      const decimalsIssue = issues.find(i => i.field === 'decimals')
      expect(decimalsIssue).toBeDefined()
      expect(decimalsIssue?.severity).toBe('error')
      expect(decimalsIssue?.message).toContain('0 and 19')
    })

    it('should report invalid external_url as warning', () => {
      const metadataWithBadUrl = {
        ...validARC3Metadata,
        external_url: 'not-a-valid-url'
      }
      const issues = validateARC3Metadata(metadataWithBadUrl)
      const urlIssue = issues.find(i => i.field === 'external_url')
      expect(urlIssue).toBeDefined()
      expect(urlIssue?.severity).toBe('warning')
    })

    it('should handle null metadata', () => {
      const issues = validateARC3Metadata(nullMetadata)
      expect(issues).toHaveLength(1)
      expect(issues[0]).toMatchObject({
        field: 'metadata',
        severity: 'error',
        message: expect.stringContaining('missing')
      })
    })

    it('should handle undefined metadata', () => {
      const issues = validateARC3Metadata(undefinedMetadata)
      expect(issues).toHaveLength(1)
      expect(issues[0]).toMatchObject({
        field: 'metadata',
        severity: 'error'
      })
    })
  })

  describe('validateARC69Metadata', () => {
    it('should pass validation for valid ARC69 metadata', () => {
      const issues = validateARC69Metadata(validARC69Metadata)
      // May have info about standard field, but no errors/warnings
      const errors = issues.filter(i => i.severity === 'error')
      const warnings = issues.filter(i => i.severity === 'warning')
      expect(errors).toHaveLength(0)
      expect(warnings).toHaveLength(0)
    })

    it('should report missing standard field as info', () => {
      const issues = validateARC69Metadata(minimalARC69Metadata)
      const standardIssue = issues.find(i => i.field === 'standard')
      expect(standardIssue).toBeDefined()
      expect(standardIssue?.severity).toBe('info')
    })

    it('should report missing description as warning', () => {
      const issues = validateARC69Metadata({ standard: 'arc69' })
      const descIssue = issues.find(i => i.field === 'description')
      expect(descIssue).toBeDefined()
      expect(descIssue?.severity).toBe('warning')
    })

    it('should report invalid external_url as warning', () => {
      const issues = validateARC69Metadata(invalidARC69Metadata)
      const urlIssue = issues.find(i => i.field === 'external_url')
      expect(urlIssue).toBeDefined()
      expect(urlIssue?.severity).toBe('warning')
    })

    it('should report invalid media_url as warning', () => {
      const issues = validateARC69Metadata(invalidARC69Metadata)
      const mediaIssue = issues.find(i => i.field === 'media_url')
      expect(mediaIssue).toBeDefined()
      expect(mediaIssue?.severity).toBe('warning')
    })

    it('should report invalid properties type as error', () => {
      const issues = validateARC69Metadata(invalidARC69Metadata)
      const propsIssue = issues.find(i => i.field === 'properties')
      expect(propsIssue).toBeDefined()
      expect(propsIssue?.severity).toBe('error')
    })

    it('should handle null metadata', () => {
      const issues = validateARC69Metadata(null)
      expect(issues).toHaveLength(1)
      expect(issues[0]).toMatchObject({
        field: 'metadata',
        severity: 'error'
      })
    })
  })

  describe('validateARC19Metadata', () => {
    it('should pass validation for valid ARC19 URL', () => {
      const issues = validateARC19Metadata(validARC19Url)
      expect(issues).toHaveLength(0)
    })

    it('should pass validation for valid ARC19 URL with CID', () => {
      const issues = validateARC19Metadata(validARC19UrlWithCid)
      expect(issues).toHaveLength(0)
    })

    it('should report missing URL as error', () => {
      const issues = validateARC19Metadata(invalidARC19UrlNone)
      expect(issues).toHaveLength(1)
      expect(issues[0]).toMatchObject({
        field: 'url',
        severity: 'error',
        message: expect.stringContaining('requires a URL')
      })
    })

    it('should report wrong protocol as error', () => {
      const issues = validateARC19Metadata(invalidARC19UrlWrongProtocol)
      expect(issues.length).toBeGreaterThan(0)
      const protocolIssue = issues.find(i => i.message.includes('template-ipfs://'))
      expect(protocolIssue).toBeDefined()
      expect(protocolIssue?.severity).toBe('error')
    })

    it('should report missing {id} placeholder as warning', () => {
      const issues = validateARC19Metadata(invalidARC19UrlNoPlaceholder)
      const placeholderIssue = issues.find(i => i.message.includes('{id}'))
      expect(placeholderIssue).toBeDefined()
      expect(placeholderIssue?.severity).toBe('warning')
    })
  })

  describe('determineTokenStandard', () => {
    it('should identify ARC3 tokens', () => {
      const standard = determineTokenStandard('ipfs://QmTest#arc3', true)
      expect(standard).toBe('ARC3')
    })

    it('should identify ARC19 tokens', () => {
      const standard = determineTokenStandard('template-ipfs://{id}', false)
      expect(standard).toBe('ARC19')
    })

    it('should identify ASA tokens with URL', () => {
      const standard = determineTokenStandard('https://example.com', false)
      expect(standard).toBe('ASA')
    })

    it('should identify ASA tokens without URL', () => {
      const standard = determineTokenStandard(undefined, false)
      expect(standard).toBe('ASA')
    })
  })

  describe('validateTokenMetadata', () => {
    it('should validate ARC3 token with no issues', () => {
      const result = validateTokenMetadata(
        'ARC3',
        'ipfs://QmTest#arc3',
        validARC3Metadata
      )
      
      expect(result.isValid).toBe(true)
      expect(result.standard).toBe('ARC3')
      expect(result.score).toBe(100)
      expect(result.issues).toHaveLength(0)
      expect(result.passedChecks.length).toBeGreaterThan(0)
      expect(result.summary).toContain('Fully compliant')
    })

    it('should validate ARC3 token with warnings', () => {
      const result = validateTokenMetadata(
        'ARC3',
        'ipfs://QmTest#arc3',
        minimalARC3Metadata
      )
      
      expect(result.isValid).toBe(true) // No errors, just warnings
      expect(result.score).toBeLessThan(100)
      expect(result.issues.length).toBeGreaterThan(0)
      expect(result.summary).toContain('recommendations')
    })

    it('should validate ARC3 token with errors', () => {
      const result = validateTokenMetadata(
        'ARC3',
        'ipfs://QmTest#arc3',
        invalidARC3Metadata
      )
      
      expect(result.isValid).toBe(false)
      expect(result.score).toBeLessThan(100)
      const errors = result.issues.filter(i => i.severity === 'error')
      expect(errors.length).toBeGreaterThan(0)
      expect(result.summary).toContain('error')
    })

    it('should calculate score correctly based on issue severity', () => {
      const result = validateTokenMetadata(
        'ARC3',
        'ipfs://QmTest#arc3',
        minimalARC3Metadata
      )
      
      // Should have warnings but no errors
      const warnings = result.issues.filter(i => i.severity === 'warning')
      const expectedScore = 100 - (warnings.length * 10)
      expect(result.score).toBeLessThanOrEqual(expectedScore)
    })

    it('should validate ARC19 token', () => {
      const result = validateTokenMetadata(
        'ARC19',
        validARC19Url,
        null
      )
      
      expect(result.standard).toBe('ARC19')
      expect(result.isValid).toBe(true)
      expect(result.passedChecks).toContain('Valid ARC19 URL format')
      expect(result.passedChecks).toContain('Has {id} placeholder')
    })

    it('should validate ARC69 token', () => {
      const result = validateTokenMetadata(
        'ARC69',
        undefined,
        null,
        validARC69Metadata
      )
      
      expect(result.standard).toBe('ARC69')
      expect(result.isValid).toBe(true)
    })

    it('should validate standard ASA token', () => {
      const result = validateTokenMetadata(
        'ASA',
        'https://example.com',
        null
      )
      
      expect(result.standard).toBe('ASA')
      expect(result.isValid).toBe(true)
      expect(result.passedChecks).toContain('Standard ASA token')
    })

    it('should clamp score between 0 and 100', () => {
      // Create metadata with many errors to test clamping
      const manyErrors = { ...invalidARC3Metadata, decimals: -1 }
      const result = validateTokenMetadata(
        'ARC3',
        'ipfs://QmTest#arc3',
        manyErrors
      )
      
      expect(result.score).toBeGreaterThanOrEqual(0)
      expect(result.score).toBeLessThanOrEqual(100)
    })
  })

  describe('normalizeMetadata', () => {
    it('should normalize ARC3 metadata with all fields', () => {
      const result = normalizeMetadata(
        'ARC3',
        normalizationTestCases.withARC3.assetParams,
        normalizationTestCases.withARC3.arc3Metadata
      )
      
      expect(result.title).toBe(normalizationTestCases.withARC3.expectedTitle)
      expect(result.description).toBe(normalizationTestCases.withARC3.expectedDescription)
      expect(result.imageUrl).toBe(normalizationTestCases.withARC3.expectedImageUrl)
      expect(result.imageResolved).toBe(true)
      expect(result.standard).toBe('ARC3')
    })

    it('should normalize ASA without ARC3 metadata', () => {
      const result = normalizeMetadata(
        'ASA',
        normalizationTestCases.withoutARC3.assetParams,
        normalizationTestCases.withoutARC3.arc3Metadata
      )
      
      expect(result.title).toBe(normalizationTestCases.withoutARC3.expectedTitle)
      expect(result.description).toBe(normalizationTestCases.withoutARC3.expectedDescription)
      expect(result.imageUrl).toBeNull()
      expect(result.imageResolved).toBe(false)
    })

    it('should fallback to on-chain values when ARC3 fields are missing', () => {
      const result = normalizeMetadata(
        'ARC3',
        normalizationTestCases.fallbackToOnChain.assetParams,
        normalizationTestCases.fallbackToOnChain.arc3Metadata
      )
      
      expect(result.title).toBe(normalizationTestCases.fallbackToOnChain.expectedTitle)
      // Unit name falls back to on-chain params when not in ARC3 metadata
      expect(result.unitName).toBe('OCN')
    })

    it('should handle missing asset ID', () => {
      const paramsWithoutId = { ...sampleAssetParamsASA, assetId: undefined }
      const result = normalizeMetadata('ASA', paramsWithoutId, null)
      
      // Falls back to on-chain name when asset ID is missing
      expect(result.title).toBe('Standard ASA')
    })

    it('should normalize IPFS URLs in image and external_url', () => {
      const result = normalizeMetadata('ARC3', sampleAssetParamsARC3, validARC3Metadata)
      
      expect(result.imageUrl).toContain('https://ipfs.io/ipfs/')
      expect(result.externalUrl).toBe('https://example.com/token')
    })

    it('should include properties from ARC3 metadata', () => {
      const result = normalizeMetadata('ARC3', sampleAssetParamsARC3, validARC3Metadata)
      
      expect(result.properties).toEqual(validARC3Metadata.properties)
    })

    it('should include creator and supply', () => {
      const result = normalizeMetadata('ARC3', sampleAssetParamsARC3, validARC3Metadata)
      
      expect(result.creator).toBe(sampleAssetParamsARC3.creator)
      expect(result.supply).toBe(String(sampleAssetParamsARC3.total))
    })
  })

  describe('getScoreColorClass', () => {
    it('should return green for scores >= 90', () => {
      expect(getScoreColorClass(100)).toContain('green')
      expect(getScoreColorClass(90)).toContain('green')
    })

    it('should return yellow for scores >= 70', () => {
      expect(getScoreColorClass(70)).toContain('yellow')
      expect(getScoreColorClass(89)).toContain('yellow')
    })

    it('should return orange for scores >= 50', () => {
      expect(getScoreColorClass(50)).toContain('orange')
      expect(getScoreColorClass(69)).toContain('orange')
    })

    it('should return red for scores < 50', () => {
      expect(getScoreColorClass(49)).toContain('red')
      expect(getScoreColorClass(0)).toContain('red')
    })
  })

  describe('getScoreBadgeLabel', () => {
    it('should return "Excellent" for scores >= 90', () => {
      expect(getScoreBadgeLabel(100)).toBe('Excellent')
      expect(getScoreBadgeLabel(90)).toBe('Excellent')
    })

    it('should return "Good" for scores >= 70', () => {
      expect(getScoreBadgeLabel(70)).toBe('Good')
      expect(getScoreBadgeLabel(89)).toBe('Good')
    })

    it('should return "Fair" for scores >= 50', () => {
      expect(getScoreBadgeLabel(50)).toBe('Fair')
      expect(getScoreBadgeLabel(69)).toBe('Fair')
    })

    it('should return "Poor" for scores < 50', () => {
      expect(getScoreBadgeLabel(49)).toBe('Poor')
      expect(getScoreBadgeLabel(0)).toBe('Poor')
    })
  })
})
