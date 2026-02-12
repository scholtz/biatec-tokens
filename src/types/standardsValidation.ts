/**
 * Standards Validation Types
 * 
 * Comprehensive type definitions for ARC-3, ARC-19, and ARC-69 validation
 * and wallet compatibility checking.
 */

/**
 * Supported Algorand token standards for validation
 */
export type AlgorandStandard = 'ARC3' | 'ARC19' | 'ARC69' | 'ASA';

/**
 * Issue severity levels
 */
export type IssueSeverity = 'blocker' | 'major' | 'minor';

/**
 * Validation issue with detailed context
 */
export interface ValidationIssue {
  /** Issue identifier for tracking */
  id: string;
  /** Field name that has the issue */
  field: string;
  /** Severity level: blocker (prevents deployment), major (strong warning), minor (recommendation) */
  severity: IssueSeverity;
  /** Human-readable message */
  message: string;
  /** Detailed explanation and remediation guidance */
  details?: string;
  /** Suggested fix or action */
  remediation?: string;
  /** Related user story (e.g., "As a marketplace seller, I need...") */
  userStory?: string;
}

/**
 * Overall readiness assessment
 */
export interface ReadinessAssessment {
  /** Overall readiness score (0-100) */
  score: number;
  /** Readiness level based on score */
  level: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  /** Whether deployment should be blocked (has blockers) */
  shouldBlock: boolean;
  /** Whether user acknowledgment is required */
  requiresAcknowledgment: boolean;
  /** Issues categorized by severity */
  issues: {
    blockers: ValidationIssue[];
    major: ValidationIssue[];
    minor: ValidationIssue[];
  };
  /** List of checks that passed */
  passedChecks: string[];
}

/**
 * Standards validation result
 */
export interface StandardsValidationResult {
  /** Detected or selected standard */
  standard: AlgorandStandard;
  /** Overall readiness assessment */
  readiness: ReadinessAssessment;
  /** Summary message */
  summary: string;
  /** Timestamp of validation */
  validatedAt: Date;
}

/**
 * Wallet display behavior information
 */
export interface WalletBehavior {
  /** Wallet name */
  walletName: string;
  /** How the wallet displays token name */
  nameDisplay: string;
  /** How the wallet displays unit name */
  unitDisplay: string;
  /** How the wallet handles decimals */
  decimalsHandling: string;
  /** How the wallet shows frozen assets */
  frozenBehavior: string;
  /** How the wallet handles reserve address */
  reserveBehavior: string;
  /** Whether metadata/images are supported */
  metadataSupport: boolean;
  /** Additional notes */
  notes?: string;
}

/**
 * Wallet compatibility information
 */
export interface WalletCompatibility {
  /** Wallet identifier */
  id: string;
  /** Wallet display name */
  name: string;
  /** Logo URL or path */
  logo?: string;
  /** Supported standards */
  supportedStandards: AlgorandStandard[];
  /** Standard-specific behavior notes */
  behaviorNotes: Record<AlgorandStandard, string>;
  /** Overall compatibility score with current token (0-100) */
  compatibilityScore?: number;
  /** Known issues or limitations */
  knownIssues?: string[];
}

/**
 * Metadata validation request
 */
export interface MetadataValidationRequest {
  /** Standard to validate against */
  standard: AlgorandStandard;
  /** Metadata URL (for ARC-3, ARC-19) */
  metadataUrl?: string;
  /** Metadata hash (for ARC-3 with immutability) */
  metadataHash?: string;
  /** Inline metadata (for ARC-69) */
  inlineMetadata?: string;
  /** Token configuration */
  tokenConfig: {
    name: string;
    unitName: string;
    decimals: number;
    total: number;
    url?: string;
    reserve?: string;
    freeze?: string;
    clawback?: string;
    manager?: string;
  };
}

/**
 * Backend metadata validation response
 */
export interface MetadataValidationResponse {
  /** Overall status */
  status: 'success' | 'warning' | 'error';
  /** HTTP status code (if URL was checked) */
  httpStatus?: number;
  /** Content type header */
  contentType?: string;
  /** Whether hash matches content */
  hashMatches?: boolean;
  /** Parsed metadata (if available) */
  metadata?: Record<string, any>;
  /** Validation errors */
  errors: ValidationIssue[];
  /** Validation warnings */
  warnings: ValidationIssue[];
  /** Diagnostic information */
  diagnostics?: {
    fetchTime?: number;
    contentLength?: number;
    cacheHit?: boolean;
  };
}

/**
 * User acknowledgment of risks
 */
export interface RiskAcknowledgment {
  /** List of issue IDs acknowledged */
  acknowledgedIssues: string[];
  /** Timestamp of acknowledgment */
  acknowledgedAt: Date;
  /** User statement */
  statement: string;
}

/**
 * Compatibility matrix entry
 */
export interface CompatibilityMatrixEntry {
  wallet: string;
  standard: AlgorandStandard;
  supported: boolean;
  displayQuality: 'excellent' | 'good' | 'partial' | 'poor' | 'none';
  notes: string;
}
