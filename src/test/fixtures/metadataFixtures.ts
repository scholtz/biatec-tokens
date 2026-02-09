/**
 * Test fixtures for metadata validation
 * Contains reference examples for ARC3, ARC69, and ARC19 standards
 */

import type { ARC3Metadata } from '../../composables/useTokenMetadata'

// Valid ARC3 metadata examples
export const validARC3Metadata: ARC3Metadata = {
  name: 'Test Token',
  description: 'A fully compliant ARC3 test token with all recommended fields',
  image: 'ipfs://QmTest123456789',
  image_integrity: 'sha256-abc123',
  image_mimetype: 'image/png',
  external_url: 'https://example.com/token',
  decimals: 6,
  unitName: 'TEST',
  properties: {
    category: 'Utility',
    supply: '1000000'
  }
}

export const minimalARC3Metadata: ARC3Metadata = {
  name: 'Minimal Token'
  // Missing description, image, and other optional fields
}

export const invalidARC3Metadata: ARC3Metadata = {
  name: '',  // Invalid: empty name
  description: 'Token with invalid fields',
  image: 'not-a-valid-url',  // Invalid URL
  decimals: 25  // Invalid: exceeds max of 19
}

export const missingNameARC3: ARC3Metadata = {
  description: 'Token missing required name field',
  image: 'ipfs://QmTest'
}

export const invalidImageUrlARC3: ARC3Metadata = {
  name: 'Test Token',
  description: 'Token with invalid image URL',
  image: 'ftp://invalid-protocol.com/image.png'  // Invalid protocol
}

// Valid ARC69 metadata examples
export const validARC69Metadata = {
  standard: 'arc69',
  description: 'A fully compliant ARC69 test token',
  external_url: 'https://example.com/token',
  media_url: 'ipfs://QmMediaTest',
  properties: {
    trait1: 'value1',
    trait2: 'value2'
  }
}

export const minimalARC69Metadata = {
  description: 'Minimal ARC69 token'
  // Missing standard field and other optional fields
}

export const invalidARC69Metadata = {
  standard: 'arc69',
  description: '',  // Empty description
  external_url: 'not-a-url',  // Invalid URL
  media_url: 'ftp://invalid.com/media',  // Invalid protocol
  properties: 'not-an-object'  // Invalid: should be object
}

// ARC19 URL examples
export const validARC19Url = 'template-ipfs://{id}'
export const validARC19UrlWithCid = 'template-ipfs://QmTest123/{id}/metadata.json'
export const invalidARC19UrlNoPlaceholder = 'template-ipfs://QmTest123/metadata.json'
export const invalidARC19UrlWrongProtocol = 'ipfs://{id}'
export const invalidARC19UrlNone = undefined

// Asset parameters for testing
export const sampleAssetParamsARC3 = {
  assetId: 123456,
  name: 'OnChain Name',
  unitName: 'OCN',
  decimals: 6,
  total: 1000000,
  creator: 'TESTCREATORADDRESS123456789012345678901234567890',
  url: 'ipfs://QmTest#arc3'
}

export const sampleAssetParamsARC19 = {
  assetId: 789012,
  name: 'ARC19 Token',
  unitName: 'A19',
  decimals: 0,
  total: 100,
  creator: 'TESTCREATORADDRESS123456789012345678901234567890',
  url: 'template-ipfs://{id}'
}

export const sampleAssetParamsASA = {
  assetId: 345678,
  name: 'Standard ASA',
  unitName: 'ASA',
  decimals: 0,
  total: 1000,
  creator: 'TESTCREATORADDRESS123456789012345678901234567890',
  url: 'https://example.com'
}

// Edge case: Asset with no URL
export const sampleAssetParamsNoUrl = {
  assetId: 111111,
  name: 'No URL Token',
  unitName: 'NUT',
  decimals: 0,
  total: 100,
  creator: 'TESTCREATORADDRESS123456789012345678901234567890'
}

// Edge case: Asset with malformed metadata
export const malformedARC3Metadata = {
  // Not following ARC3 spec at all
  token_name: 'Wrong Field Name',
  desc: 'Wrong field name for description',
  img: 'ipfs://test'
}

// Edge case: Null and undefined metadata
export const nullMetadata = null
export const undefinedMetadata = undefined

// URL test cases
export const urlTestCases = {
  validHttp: 'http://example.com/image.png',
  validHttps: 'https://example.com/image.png',
  validIpfs: 'ipfs://QmTest123456789',
  validTemplateIpfs: 'template-ipfs://{id}',
  invalidFtp: 'ftp://example.com/file',
  invalidEmpty: '',
  invalidNoProtocol: 'example.com/image.png',
  invalidMalformed: 'ht!tp://bad-url'
}

// Image URL resolution test cases
export const imageUrlResolutionCases = {
  ipfsUrl: 'ipfs://QmTest123',
  expectedIpfsResolved: 'https://ipfs.io/ipfs/QmTest123',
  httpUrl: 'https://example.com/image.png',
  expectedHttpResolved: 'https://example.com/image.png',
  arc3Url: 'ipfs://QmTest456#arc3',
  expectedArc3Resolved: 'https://ipfs.io/ipfs/QmTest456'
}

// Metadata normalization test cases
export const normalizationTestCases = {
  withARC3: {
    assetParams: sampleAssetParamsARC3,
    arc3Metadata: validARC3Metadata,
    expectedTitle: 'Test Token',
    expectedDescription: 'A fully compliant ARC3 test token with all recommended fields',
    expectedImageUrl: 'https://ipfs.io/ipfs/QmTest123456789'
  },
  withoutARC3: {
    assetParams: sampleAssetParamsASA,
    arc3Metadata: null,
    expectedTitle: 'Standard ASA',
    expectedDescription: '',
    expectedImageUrl: null
  },
  fallbackToOnChain: {
    assetParams: sampleAssetParamsARC3,
    arc3Metadata: minimalARC3Metadata,
    expectedTitle: 'Minimal Token',
    expectedDescription: '',
    expectedUnitName: 'TEST'
  }
}
