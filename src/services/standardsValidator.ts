/**
 * Standards Validator Service
 * 
 * Comprehensive validation for ARC-3, ARC-19, and ARC-69 token standards.
 * Provides readiness scoring and actionable feedback for token issuers.
 */

import type {
  AlgorandStandard,
  ValidationIssue,
  ReadinessAssessment,
  StandardsValidationResult,
  MetadataValidationRequest,
} from '../types/standardsValidation';

/**
 * Validates ARC-3 metadata requirements
 * Reference: https://github.com/algorandfoundation/ARCs/blob/main/ARCs/arc-0003.md
 */
export function validateARC3(request: MetadataValidationRequest): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const { tokenConfig, metadataHash } = request;

  // Blocker: URL must end with #arc3
  if (tokenConfig.url && !tokenConfig.url.endsWith('#arc3')) {
    issues.push({
      id: 'arc3-url-suffix',
      field: 'url',
      severity: 'blocker',
      message: 'ARC-3 URL must end with #arc3',
      details: 'The ARC-3 standard requires the asset URL to end with the #arc3 fragment identifier to signal that the URL points to ARC-3 compliant metadata.',
      remediation: 'Add #arc3 to the end of your metadata URL',
      userStory: 'As a wallet developer, I need the #arc3 suffix to identify ARC-3 tokens and fetch metadata correctly.',
    });
  }

  // Blocker: URL must be provided
  if (!tokenConfig.url || tokenConfig.url.trim() === '') {
    issues.push({
      id: 'arc3-url-missing',
      field: 'url',
      severity: 'blocker',
      message: 'ARC-3 requires a metadata URL',
      details: 'ARC-3 tokens must have a URL pointing to JSON metadata. This is how wallets and explorers discover token information like name, description, and image.',
      remediation: 'Provide a valid HTTPS or IPFS URL pointing to your ARC-3 metadata JSON file',
      userStory: 'As a marketplace, I need a metadata URL to display token information to users.',
    });
  }

  // Major: URL should use HTTPS or IPFS
  if (tokenConfig.url && !isValidMetadataUrl(tokenConfig.url.replace('#arc3', ''))) {
    issues.push({
      id: 'arc3-url-scheme',
      field: 'url',
      severity: 'major',
      message: 'Metadata URL should use https:// or ipfs:// scheme',
      details: 'While technically any URL scheme is allowed, wallets primarily support HTTPS and IPFS URLs. HTTP (without S) may fail due to security policies. IPFS provides decentralization and immutability.',
      remediation: 'Use https:// for centralized hosting or ipfs:// for decentralized storage',
      userStory: 'As a wallet, I need secure URLs to protect users from man-in-the-middle attacks.',
    });
  }

  // Major: Metadata hash recommended for immutability
  if (!metadataHash) {
    issues.push({
      id: 'arc3-hash-missing',
      field: 'metadataHash',
      severity: 'major',
      message: 'Metadata hash is recommended for ARC-3',
      details: 'Including a SHA-256 hash of the metadata ensures immutability and allows verification. This is especially important for NFTs and compliance scenarios where metadata must not change.',
      remediation: 'Calculate SHA-256 hash of your metadata JSON and include it in the metadataHash field',
      userStory: 'As a compliance auditor, I need metadata hashes to verify that token information has not been tampered with.',
    });
  }

  // Minor: Token name length
  if (tokenConfig.name.length > 50) {
    issues.push({
      id: 'arc3-name-length',
      field: 'name',
      severity: 'minor',
      message: 'Token name is very long (over 50 characters)',
      details: 'While there is no hard limit, very long names may be truncated in wallet UIs. Most wallets display 30-50 characters comfortably.',
      remediation: 'Consider shortening to 50 characters or less for better display',
    });
  }

  // Minor: Unit name length
  if (tokenConfig.unitName.length > 10) {
    issues.push({
      id: 'arc3-unit-length',
      field: 'unitName',
      severity: 'minor',
      message: 'Unit name is long (over 10 characters)',
      details: 'Unit names longer than 10 characters may not display properly in some wallet interfaces, especially on mobile.',
      remediation: 'Keep unit name to 10 characters or less (3-5 is ideal)',
    });
  }

  // Major: Decimals validation for NFTs
  if (tokenConfig.total === 1 && tokenConfig.decimals !== 0) {
    issues.push({
      id: 'arc3-nft-decimals',
      field: 'decimals',
      severity: 'major',
      message: 'NFTs (total=1) should have decimals=0',
      details: 'Single-edition NFTs should not be divisible. Setting decimals > 0 creates fractional NFTs which may not be recognized as NFTs by marketplaces.',
      remediation: 'Set decimals to 0 for true NFTs',
      userStory: 'As an NFT marketplace, I filter by total=1 AND decimals=0 to identify true NFTs.',
    });
  }

  return issues;
}

/**
 * Validates ARC-19 metadata requirements
 * Reference: https://github.com/algorandfoundation/ARCs/blob/main/ARCs/arc-0019.md
 */
export function validateARC19(request: MetadataValidationRequest): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const { tokenConfig } = request;

  // Blocker: Must use template-ipfs:// URL
  if (!tokenConfig.url || !tokenConfig.url.startsWith('template-ipfs://')) {
    issues.push({
      id: 'arc19-url-scheme',
      field: 'url',
      severity: 'blocker',
      message: 'ARC-19 requires template-ipfs:// URL format',
      details: 'ARC-19 enables mutable NFT metadata by using a template URL with placeholder. The template-ipfs:// scheme signals to wallets that they should resolve the URL dynamically using the reserve address.',
      remediation: 'Use format: template-ipfs://{ipfscid:0:dag-pb:reserve:sha2-256} or template-ipfs://{ipfscid:1:raw:reserve:sha2-256}',
      userStory: 'As a wallet, I need the template-ipfs:// scheme to identify ARC-19 tokens and resolve metadata using the reserve address.',
    });
  }

  // Blocker: Reserve address must be set for ARC-19
  if (!tokenConfig.reserve) {
    issues.push({
      id: 'arc19-reserve-missing',
      field: 'reserve',
      severity: 'blocker',
      message: 'ARC-19 requires a reserve address',
      details: 'The reserve address is used to resolve the metadata CID. Without it, wallets cannot fetch the metadata. The reserve address can be updated to change the metadata URL.',
      remediation: 'Set a reserve address that contains the IPFS CID of your metadata',
      userStory: 'As a creator, I need to set a reserve address so I can update my NFT metadata by changing the reserve address.',
    });
  }

  // Major: Warn about mutability implications
  if (tokenConfig.manager) {
    issues.push({
      id: 'arc19-manager-warning',
      field: 'manager',
      severity: 'minor',
      message: 'Manager address set - metadata can be changed',
      details: 'With a manager address, the reserve address can be updated, allowing metadata changes. This is the core feature of ARC-19 but should be communicated clearly to buyers.',
      remediation: 'Document your metadata update policy. Consider removing manager to make metadata immutable.',
      userStory: 'As an NFT buyer, I need to know if the creator can change the NFT metadata after purchase.',
    });
  }

  // Minor: URL should contain {ipfscid} placeholder
  if (tokenConfig.url && !tokenConfig.url.includes('{ipfscid:')) {
    issues.push({
      id: 'arc19-placeholder',
      field: 'url',
      severity: 'minor',
      message: 'URL should contain {ipfscid:...} placeholder',
      details: 'The placeholder format {ipfscid:VERSION:CODEC:FIELD:HASH} tells wallets how to extract and decode the CID from the reserve address.',
      remediation: 'Use proper template format with {ipfscid:0:dag-pb:reserve:sha2-256} or similar',
    });
  }

  // Minor: NFT recommendations
  if (tokenConfig.total === 1 && tokenConfig.decimals !== 0) {
    issues.push({
      id: 'arc19-nft-decimals',
      field: 'decimals',
      severity: 'major',
      message: 'NFTs (total=1) should have decimals=0',
      details: 'Single-edition NFTs should not be divisible.',
      remediation: 'Set decimals to 0 for true NFTs',
    });
  }

  return issues;
}

/**
 * Validates ARC-69 metadata requirements
 * Reference: https://github.com/algorandfoundation/ARCs/blob/main/ARCs/arc-0069.md
 */
export function validateARC69(request: MetadataValidationRequest): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const { tokenConfig, inlineMetadata } = request;

  // Major: Inline metadata recommended
  if (!inlineMetadata || inlineMetadata.trim() === '') {
    issues.push({
      id: 'arc69-metadata-missing',
      field: 'inlineMetadata',
      severity: 'major',
      message: 'ARC-69 metadata is missing',
      details: 'ARC-69 stores metadata in the transaction note field during asset configuration. Without it, the token will have no metadata.',
      remediation: 'Provide JSON metadata in the note field (max 1024 bytes)',
      userStory: 'As a wallet, I need note field metadata to display ARC-69 token information.',
    });
  }

  // Blocker: Metadata must be valid JSON
  if (inlineMetadata) {
    try {
      JSON.parse(inlineMetadata);
    } catch (error) {
      issues.push({
        id: 'arc69-invalid-json',
        field: 'inlineMetadata',
        severity: 'blocker',
        message: 'ARC-69 metadata must be valid JSON',
        details: 'The note field must contain valid JSON that can be parsed by wallets.',
        remediation: 'Check your JSON syntax for errors',
      });
    }
  }

  // Blocker: Metadata size limit
  if (inlineMetadata && new TextEncoder().encode(inlineMetadata).length > 1024) {
    issues.push({
      id: 'arc69-size-limit',
      field: 'inlineMetadata',
      severity: 'blocker',
      message: 'ARC-69 metadata exceeds 1024 byte limit',
      details: 'The Algorand transaction note field has a maximum size of 1024 bytes. ARC-69 metadata must fit within this limit.',
      remediation: 'Reduce metadata size or use ARC-3 for larger metadata',
      userStory: 'As an issuer, I should use ARC-3 for rich metadata and ARC-69 for simple, on-chain metadata.',
    });
  }

  // Minor: Standard field recommendation
  if (inlineMetadata) {
    try {
      const parsed = JSON.parse(inlineMetadata);
      if (!parsed.standard || parsed.standard !== 'arc69') {
        issues.push({
          id: 'arc69-standard-field',
          field: 'inlineMetadata',
          severity: 'minor',
          message: 'Consider adding "standard": "arc69" field',
          details: 'Including a standard field helps tools identify the metadata format.',
          remediation: 'Add "standard": "arc69" to your metadata JSON',
        });
      }

      // Minor: Description recommended
      if (!parsed.description) {
        issues.push({
          id: 'arc69-description',
          field: 'inlineMetadata',
          severity: 'minor',
          message: 'Description field is recommended',
          details: 'A description helps users understand the token purpose.',
          remediation: 'Add "description" field to metadata',
        });
      }

      // Minor: Media URL validation
      if (parsed.media_url && !isValidMetadataUrl(parsed.media_url)) {
        issues.push({
          id: 'arc69-media-url',
          field: 'inlineMetadata',
          severity: 'minor',
          message: 'media_url should use https:// or ipfs:// scheme',
          details: 'Ensure media URLs are accessible from wallets.',
          remediation: 'Use secure URL scheme for media',
        });
      }
    } catch {
      // Already caught by JSON validation above
    }
  }

  // Minor: NFT recommendations
  if (tokenConfig.total === 1 && tokenConfig.decimals !== 0) {
    issues.push({
      id: 'arc69-nft-decimals',
      field: 'decimals',
      severity: 'major',
      message: 'NFTs (total=1) should have decimals=0',
      details: 'Single-edition NFTs should not be divisible.',
      remediation: 'Set decimals to 0 for true NFTs',
    });
  }

  return issues;
}

/**
 * Validates plain ASA (no metadata standard)
 */
export function validateASA(request: MetadataValidationRequest): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const { tokenConfig } = request;

  // Minor: Consider using metadata standard
  if (!tokenConfig.url) {
    issues.push({
      id: 'asa-no-metadata',
      field: 'url',
      severity: 'minor',
      message: 'Consider using ARC-3 for richer token display',
      details: 'Plain ASA tokens do not have metadata like images or descriptions. Wallets will only show the name and unit name.',
      remediation: 'Use ARC-3, ARC-19, or ARC-69 for enhanced metadata',
      userStory: 'As an issuer, I can improve token discoverability by adding metadata.',
    });
  }

  return issues;
}

/**
 * Helper: Validate URL format
 */
function isValidMetadataUrl(url: string): boolean {
  if (!url) return false;
  return url.startsWith('https://') || url.startsWith('ipfs://') || url.startsWith('template-ipfs://');
}

/**
 * Calculate readiness score and assessment
 */
export function calculateReadiness(issues: ValidationIssue[]): ReadinessAssessment {
  const blockers = issues.filter(i => i.severity === 'blocker');
  const major = issues.filter(i => i.severity === 'major');
  const minor = issues.filter(i => i.severity === 'minor');

  // Score calculation:
  // Start at 100, subtract points for issues
  let score = 100;
  score -= blockers.length * 40; // Each blocker: -40 points
  score -= major.length * 15; // Each major: -15 points
  score -= minor.length * 5; // Each minor: -5 points
  score = Math.max(0, score);

  // Determine level
  let level: ReadinessAssessment['level'];
  if (blockers.length > 0) {
    level = 'critical';
  } else if (score >= 90) {
    level = 'excellent';
  } else if (score >= 70) {
    level = 'good';
  } else if (score >= 50) {
    level = 'fair';
  } else {
    level = 'poor';
  }

  // Determine passed checks
  const passedChecks: string[] = [];
  if (issues.length === 0) {
    passedChecks.push('All validation checks passed');
  } else {
    if (blockers.length === 0) passedChecks.push('No blocking issues');
    if (major.length === 0) passedChecks.push('No major issues');
    if (minor.length === 0) passedChecks.push('No minor issues');
  }

  return {
    score,
    level,
    shouldBlock: blockers.length > 0,
    requiresAcknowledgment: major.length > 0 || minor.length > 0,
    issues: {
      blockers,
      major,
      minor,
    },
    passedChecks,
  };
}

/**
 * Main validation function
 */
export function validateStandard(
  standard: AlgorandStandard,
  request: MetadataValidationRequest
): StandardsValidationResult {
  let issues: ValidationIssue[] = [];

  // Validate based on standard
  switch (standard) {
    case 'ARC3':
      issues = validateARC3(request);
      break;
    case 'ARC19':
      issues = validateARC19(request);
      break;
    case 'ARC69':
      issues = validateARC69(request);
      break;
    case 'ASA':
      issues = validateASA(request);
      break;
  }

  const readiness = calculateReadiness(issues);

  // Generate summary
  let summary = '';
  if (readiness.level === 'critical') {
    summary = `${standard} validation failed with ${readiness.issues.blockers.length} blocking issue(s)`;
  } else if (readiness.level === 'excellent') {
    summary = `${standard} validation passed with excellent compliance`;
  } else if (readiness.level === 'good') {
    summary = `${standard} validation passed with ${readiness.issues.major.length + readiness.issues.minor.length} recommendation(s)`;
  } else {
    summary = `${standard} validation has issues that should be addressed`;
  }

  return {
    standard,
    readiness,
    summary,
    validatedAt: new Date(),
  };
}
