/**
 * Metadata validation utilities for Algorand token standards
 * Supports ARC3, ARC69, and ARC19 validation and quality scoring
 */

import type { ARC3Metadata } from '../composables/useTokenMetadata'

export type MetadataStandard = 'ARC3' | 'ARC69' | 'ARC19' | 'ASA'

export interface ValidationIssue {
  field: string
  severity: 'error' | 'warning' | 'info'
  message: string
}

export interface MetadataValidationResult {
  isValid: boolean
  standard: MetadataStandard
  score: number // 0-100 quality score
  issues: ValidationIssue[]
  passedChecks: string[]
  summary: string
}

export interface NormalizedMetadata {
  title: string
  description: string
  imageUrl: string | null
  imageResolved: boolean
  externalUrl: string | null
  properties: Record<string, any>
  creator: string
  supply: string
  decimals: number
  unitName: string
  standard: MetadataStandard
}

/**
 * Validates URL format (http, https, ipfs)
 */
export function validateUrl(url: string): boolean {
  if (!url) return false
  
  // Valid URL patterns
  const httpRegex = /^https?:\/\/.+/
  const ipfsRegex = /^ipfs:\/\/.+/
  const templateIpfsRegex = /^template-ipfs:\/\/.+/
  
  return httpRegex.test(url) || ipfsRegex.test(url) || templateIpfsRegex.test(url)
}

/**
 * Resolves IPFS URLs to HTTP gateway URLs
 */
export function resolveIpfsUrl(url: string, gateway: string = 'https://ipfs.io/ipfs/'): string {
  if (url.startsWith('ipfs://')) {
    const cid = url.replace('ipfs://', '')
    return `${gateway}${cid}`
  }
  if (url.startsWith('template-ipfs://')) {
    const cid = url.replace('template-ipfs://', '')
    return `${gateway}${cid}`
  }
  return url
}

/**
 * Normalizes various URL formats for display and fetching
 */
export function normalizeMetadataUrl(url: string | undefined): string | null {
  if (!url) return null
  
  // Remove ARC3 fragment identifier
  let cleanUrl = url.replace('#arc3', '')
  
  // Resolve IPFS URLs
  if (cleanUrl.startsWith('ipfs://') || cleanUrl.startsWith('template-ipfs://')) {
    cleanUrl = resolveIpfsUrl(cleanUrl)
  }
  
  return cleanUrl
}

/**
 * Validates ARC3 metadata structure
 * Reference: https://github.com/algorandfoundation/ARCs/blob/main/ARCs/arc-0003.md
 */
export function validateARC3Metadata(metadata: ARC3Metadata | null | undefined): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  
  if (!metadata) {
    issues.push({
      field: 'metadata',
      severity: 'error',
      message: 'ARC3 metadata is missing or could not be fetched'
    })
    return issues
  }
  
  // Name is required
  if (!metadata.name || metadata.name.trim() === '') {
    issues.push({
      field: 'name',
      severity: 'error',
      message: 'Token name is required in ARC3 metadata'
    })
  }
  
  // Description is recommended
  if (!metadata.description || metadata.description.trim() === '') {
    issues.push({
      field: 'description',
      severity: 'warning',
      message: 'Token description is recommended for ARC3 tokens'
    })
  }
  
  // Image is recommended
  if (!metadata.image || metadata.image.trim() === '') {
    issues.push({
      field: 'image',
      severity: 'warning',
      message: 'Token image is recommended for ARC3 tokens'
    })
  } else if (!validateUrl(metadata.image)) {
    issues.push({
      field: 'image',
      severity: 'error',
      message: 'Token image URL is invalid (must be http://, https://, or ipfs://)'
    })
  }
  
  // Image integrity is recommended when image is present
  if (metadata.image && !metadata.image_integrity) {
    issues.push({
      field: 'image_integrity',
      severity: 'info',
      message: 'Image integrity hash is recommended for verification'
    })
  }
  
  // Image mimetype is recommended when image is present
  if (metadata.image && !metadata.image_mimetype) {
    issues.push({
      field: 'image_mimetype',
      severity: 'info',
      message: 'Image mimetype is recommended (e.g., image/png, image/jpeg)'
    })
  }
  
  // External URL validation
  if (metadata.external_url && !validateUrl(metadata.external_url)) {
    issues.push({
      field: 'external_url',
      severity: 'warning',
      message: 'External URL format is invalid'
    })
  }
  
  // Decimals validation
  if (metadata.decimals !== undefined && (metadata.decimals < 0 || metadata.decimals > 19)) {
    issues.push({
      field: 'decimals',
      severity: 'error',
      message: 'Decimals must be between 0 and 19'
    })
  }
  
  return issues
}

/**
 * Validates ARC69 metadata structure
 * Reference: https://github.com/algorandfoundation/ARCs/blob/main/ARCs/arc-0069.md
 */
export function validateARC69Metadata(metadata: any): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  
  if (!metadata) {
    issues.push({
      field: 'metadata',
      severity: 'error',
      message: 'ARC69 metadata is missing'
    })
    return issues
  }
  
  // Standard field is recommended
  if (!metadata.standard || metadata.standard !== 'arc69') {
    issues.push({
      field: 'standard',
      severity: 'info',
      message: 'ARC69 metadata should include "standard": "arc69" field'
    })
  }
  
  // Description is recommended
  if (!metadata.description || metadata.description.trim() === '') {
    issues.push({
      field: 'description',
      severity: 'warning',
      message: 'Description is recommended for ARC69 tokens'
    })
  }
  
  // External URL validation
  if (metadata.external_url && !validateUrl(metadata.external_url)) {
    issues.push({
      field: 'external_url',
      severity: 'warning',
      message: 'External URL format is invalid'
    })
  }
  
  // Media URL validation
  if (metadata.media_url && !validateUrl(metadata.media_url)) {
    issues.push({
      field: 'media_url',
      severity: 'warning',
      message: 'Media URL format is invalid'
    })
  }
  
  // Properties validation
  if (metadata.properties && typeof metadata.properties !== 'object') {
    issues.push({
      field: 'properties',
      severity: 'error',
      message: 'Properties field must be an object'
    })
  }
  
  return issues
}

/**
 * Validates ARC19 metadata structure
 * Reference: https://github.com/algorandfoundation/ARCs/blob/main/ARCs/arc-0019.md
 */
export function validateARC19Metadata(assetUrl: string | undefined): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  
  if (!assetUrl) {
    issues.push({
      field: 'url',
      severity: 'error',
      message: 'ARC19 requires a URL field'
    })
    return issues
  }
  
  // Must use template-ipfs:// format
  if (!assetUrl.startsWith('template-ipfs://')) {
    issues.push({
      field: 'url',
      severity: 'error',
      message: 'ARC19 URL must start with "template-ipfs://"'
    })
  }
  
  // Must contain {id} placeholder
  if (!assetUrl.includes('{id}')) {
    issues.push({
      field: 'url',
      severity: 'warning',
      message: 'ARC19 URL should contain {id} placeholder for asset ID'
    })
  }
  
  return issues
}

/**
 * Determines the token standard based on URL and metadata
 */
export function determineTokenStandard(assetUrl: string | undefined, _hasMetadata: boolean): MetadataStandard {
  if (!assetUrl) return 'ASA'
  
  // ARC19: template-ipfs:// URL
  if (assetUrl.startsWith('template-ipfs://')) {
    return 'ARC19'
  }
  
  // ARC3: URL ends with #arc3
  if (assetUrl.endsWith('#arc3')) {
    return 'ARC3'
  }
  
  // ARC69: Has metadata in note field (handled elsewhere)
  // For now, we treat tokens with URL but not ARC3/ARC19 as ASA
  return 'ASA'
}

/**
 * Validates token metadata based on detected standard
 */
export function validateTokenMetadata(
  standard: MetadataStandard,
  assetUrl: string | undefined,
  arc3Metadata: ARC3Metadata | null | undefined,
  arc69Metadata: any = null
): MetadataValidationResult {
  const issues: ValidationIssue[] = []
  const passedChecks: string[] = []
  
  // Validate based on standard
  if (standard === 'ARC3') {
    const arc3Issues = validateARC3Metadata(arc3Metadata)
    issues.push(...arc3Issues)
    
    // Track passed checks
    if (arc3Metadata?.name) passedChecks.push('Has name')
    if (arc3Metadata?.description) passedChecks.push('Has description')
    if (arc3Metadata?.image && validateUrl(arc3Metadata.image)) passedChecks.push('Has valid image URL')
    if (arc3Metadata?.image_integrity) passedChecks.push('Has image integrity')
    if (arc3Metadata?.external_url && validateUrl(arc3Metadata.external_url)) passedChecks.push('Has external URL')
    if (assetUrl?.endsWith('#arc3')) passedChecks.push('Valid ARC3 URL format')
  } else if (standard === 'ARC69') {
    const arc69Issues = validateARC69Metadata(arc69Metadata)
    issues.push(...arc69Issues)
    
    if (arc69Metadata?.standard === 'arc69') passedChecks.push('Has standard field')
    if (arc69Metadata?.description) passedChecks.push('Has description')
    if (arc69Metadata?.media_url && validateUrl(arc69Metadata.media_url)) passedChecks.push('Has valid media URL')
  } else if (standard === 'ARC19') {
    const arc19Issues = validateARC19Metadata(assetUrl)
    issues.push(...arc19Issues)
    
    if (assetUrl?.startsWith('template-ipfs://')) passedChecks.push('Valid ARC19 URL format')
    if (assetUrl?.includes('{id}')) passedChecks.push('Has {id} placeholder')
  } else {
    // Standard ASA - basic validation
    passedChecks.push('Standard ASA token')
  }
  
  // Calculate quality score (0-100)
  const errorCount = issues.filter(i => i.severity === 'error').length
  const warningCount = issues.filter(i => i.severity === 'warning').length
  const infoCount = issues.filter(i => i.severity === 'info').length
  
  let score = 100
  score -= errorCount * 20 // Each error: -20 points
  score -= warningCount * 10 // Each warning: -10 points
  score -= infoCount * 5 // Each info: -5 points
  score = Math.max(0, Math.min(100, score)) // Clamp to 0-100
  
  // Determine if valid (no errors)
  const isValid = errorCount === 0
  
  // Generate summary
  let summary = ''
  if (isValid && issues.length === 0) {
    summary = `Fully compliant ${standard} metadata with no issues`
  } else if (isValid) {
    summary = `Valid ${standard} metadata with ${warningCount + infoCount} recommendations`
  } else {
    summary = `${standard} metadata has ${errorCount} error(s) and ${warningCount} warning(s)`
  }
  
  return {
    isValid,
    standard,
    score,
    issues,
    passedChecks,
    summary
  }
}

/**
 * Normalizes metadata fields for consistent display
 */
export function normalizeMetadata(
  standard: MetadataStandard,
  assetParams: any,
  arc3Metadata: ARC3Metadata | null | undefined
): NormalizedMetadata {
  // Determine display values with fallbacks
  const title = arc3Metadata?.name || assetParams.name || `Asset ${assetParams.assetId || 'Unknown'}`
  const description = arc3Metadata?.description || assetParams.note || ''
  const imageUrl = arc3Metadata?.image ? normalizeMetadataUrl(arc3Metadata.image) : null
  const externalUrl = arc3Metadata?.external_url ? normalizeMetadataUrl(arc3Metadata.external_url) : null
  const properties = arc3Metadata?.properties || {}
  const creator = assetParams.creator || ''
  const supply = assetParams.total ? String(assetParams.total) : '0'
  const decimals = arc3Metadata?.decimals ?? assetParams.decimals ?? 0
  const unitName = arc3Metadata?.unitName || assetParams.unitName || ''
  
  return {
    title,
    description,
    imageUrl,
    imageResolved: !!imageUrl,
    externalUrl,
    properties,
    creator,
    supply,
    decimals,
    unitName,
    standard
  }
}

/**
 * Attempts to fetch and validate an image URL
 */
export async function validateImageUrl(url: string | null, timeout: number = 5000): Promise<boolean> {
  if (!url) return false
  
  try {
    const resolvedUrl = normalizeMetadataUrl(url)
    if (!resolvedUrl) return false
    
    // Use HEAD request to check if image exists without downloading it
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)
    
    const response = await fetch(resolvedUrl, {
      method: 'HEAD',
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    
    // Check if response is successful and is an image
    const contentType = response.headers.get('content-type')
    return response.ok && (contentType?.startsWith('image/') ?? false)
  } catch (error) {
    console.warn('Image validation failed:', error)
    return false
  }
}

/**
 * Gets a color class for the validation score
 */
export function getScoreColorClass(score: number): string {
  if (score >= 90) return 'text-green-400 bg-green-500/20 border-green-500/30'
  if (score >= 70) return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30'
  if (score >= 50) return 'text-orange-400 bg-orange-500/20 border-orange-500/30'
  return 'text-red-400 bg-red-500/20 border-red-500/30'
}

/**
 * Gets a badge label for the validation score
 */
export function getScoreBadgeLabel(score: number): string {
  if (score >= 90) return 'Excellent'
  if (score >= 70) return 'Good'
  if (score >= 50) return 'Fair'
  return 'Poor'
}
