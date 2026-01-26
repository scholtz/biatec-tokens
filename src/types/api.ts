/**
 * API Type Definitions for BiatecTokensApi Backend
 * 
 * Type-safe interfaces matching backend DTOs for token deployment and management
 */

/**
 * Token standards supported by the platform
 */
export enum TokenStandard {
  ERC20 = 'ERC20',
  ARC3 = 'ARC3',
  ARC200 = 'ARC200',
  ARC1400 = 'ARC1400',
}

/**
 * Metadata structure for tokens (especially NFTs)
 */
export interface TokenMetadata {
  name: string;
  description?: string;
  image?: string;
  image_integrity?: string;
  image_mimetype?: string;
  external_url?: string;
  animation_url?: string;
  properties?: Record<string, any>;
  extra_metadata?: string;
  localization?: {
    uri: string;
    default: string;
    locales: string[];
  };
}

/**
 * Base deployment request interface
 */
interface BaseDeploymentRequest {
  standard: TokenStandard;
  name: string;
  walletAddress: string;
  description?: string;
  icon?: string;
}

/**
 * ERC20 token deployment request
 */
export interface ERC20DeploymentRequest extends BaseDeploymentRequest {
  standard: TokenStandard.ERC20;
  symbol: string;
  decimals: number;
  totalSupply: string;
}

/**
 * ARC3 token deployment request (Algorand Standard Asset with metadata)
 * Supports both regular NFTs (total=1) and fractional NFTs (total>1)
 */
export interface ARC3DeploymentRequest extends BaseDeploymentRequest {
  standard: TokenStandard.ARC3;
  unitName: string;
  total: number;
  decimals: number;
  url?: string;
  metadata?: TokenMetadata;
  metadataHash?: string;
  freeze?: string;
  clawback?: string;
  reserve?: string;
  manager?: string;
}

/**
 * MICA compliance metadata for ARC-200 tokens
 * Supports regulatory requirements under Markets in Crypto-Assets regulation
 */
export interface MicaComplianceMetadata {
  /** Legal entity name of the token issuer */
  issuerLegalName: string;
  /** Issuer registration number (e.g., company registration number) */
  issuerRegistrationNumber: string;
  /** Jurisdiction where the issuer is registered */
  issuerJurisdiction: string;
  /** Regulatory license number if applicable */
  regulatoryLicense?: string;
  /** Token classification under MICA (e-money, asset-referenced, utility, etc.) */
  micaTokenClassification: 'utility' | 'e-money' | 'asset-referenced' | 'other';
  /** Brief description of token purpose and rights */
  tokenPurpose: string;
  /** Whether whitelist/KYC is required for token holders */
  kycRequired: boolean;
  /** List of restricted jurisdictions (ISO 3166-1 alpha-2 codes) */
  restrictedJurisdictions?: string[];
  /** Contact email for compliance inquiries */
  complianceContactEmail: string;
  /** URL to whitepaper or prospectus */
  whitepaperUrl?: string;
  /** URL to terms and conditions */
  termsAndConditionsUrl?: string;
}

/**
 * ARC200 token deployment request (Smart contract token compatible with ERC20)
 */
export interface ARC200DeploymentRequest extends BaseDeploymentRequest {
  standard: TokenStandard.ARC200;
  symbol: string;
  decimals: number;
  totalSupply: string;
  contractId?: number;
  /** MICA compliance metadata (required for regulated tokens) */
  complianceMetadata?: MicaComplianceMetadata;
}

/**
 * ARC1400 security token deployment request
 * Supports partitions for different tranches of tokens
 */
export interface ARC1400DeploymentRequest extends BaseDeploymentRequest {
  standard: TokenStandard.ARC1400;
  symbol: string;
  decimals: number;
  totalSupply: string;
  partitions: string[];
  controllers?: string[];
  defaultPartition?: string;
}

/**
 * Union type for all token deployment requests
 */
export type TokenDeploymentRequest =
  | ERC20DeploymentRequest
  | ARC3DeploymentRequest
  | ARC200DeploymentRequest
  | ARC1400DeploymentRequest;

/**
 * Response from token deployment API
 */
export interface TokenDeploymentResponse {
  success: boolean;
  transactionId?: string;
  tokenId?: string;
  contractAddress?: string;
  assetId?: number;
  appId?: number;
  error?: string;
  errorCode?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

/**
 * Token information response
 */
export interface TokenInfo {
  id: string;
  standard: TokenStandard;
  name: string;
  symbol?: string;
  unitName?: string;
  decimals: number;
  totalSupply: string;
  contractAddress?: string;
  assetId?: number;
  appId?: number;
  creator: string;
  createdAt: string;
  metadata?: TokenMetadata;
}

/**
 * Validation result for deployment requests
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * Type guard to check if request is ERC20
 */
export function isERC20Request(
  request: TokenDeploymentRequest
): request is ERC20DeploymentRequest {
  return request.standard === TokenStandard.ERC20;
}

/**
 * Type guard to check if request is ARC3
 */
export function isARC3Request(
  request: TokenDeploymentRequest
): request is ARC3DeploymentRequest {
  return request.standard === TokenStandard.ARC3;
}

/**
 * Type guard to check if request is ARC200
 */
export function isARC200Request(
  request: TokenDeploymentRequest
): request is ARC200DeploymentRequest {
  return request.standard === TokenStandard.ARC200;
}

/**
 * Type guard to check if request is ARC1400
 */
export function isARC1400Request(
  request: TokenDeploymentRequest
): request is ARC1400DeploymentRequest {
  return request.standard === TokenStandard.ARC1400;
}

/**
 * Validates a token deployment request
 * @param request - The token deployment request to validate
 * @returns Validation result with errors and warnings
 */
export function validateTokenDeploymentRequest(
  request: TokenDeploymentRequest
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Common validations
  if (!request.name || request.name.trim().length === 0) {
    errors.push('Token name is required');
  }

  if (!request.walletAddress || request.walletAddress.trim().length === 0) {
    errors.push('Wallet address is required');
  }

  // Standard-specific validations
  if (isERC20Request(request)) {
    if (!request.symbol || request.symbol.trim().length === 0) {
      errors.push('Token symbol is required for ERC20');
    }
    if (request.decimals < 0 || request.decimals > 18) {
      warnings.push('Decimals should be between 0 and 18');
    }
    if (!request.totalSupply || request.totalSupply === '0') {
      errors.push('Total supply must be greater than 0');
    }
    // Validate Ethereum address format (basic check)
    if (request.walletAddress && !request.walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      errors.push('Invalid Ethereum wallet address format');
    }
  } else if (isARC3Request(request)) {
    if (!request.unitName || request.unitName.trim().length === 0) {
      errors.push('Unit name is required for ARC3');
    }
    if (request.total <= 0) {
      errors.push('Total must be greater than 0');
    }
    if (request.decimals < 0) {
      errors.push('Decimals cannot be negative');
    }
    // Validate Algorand address format (basic check - should be 58 chars and contain only valid base32 chars)
    if (request.walletAddress && request.walletAddress.length > 0) {
      if (!request.walletAddress.match(/^[A-Z2-7]+$/)) {
        errors.push('Invalid Algorand wallet address format (must contain only uppercase letters and numbers 2-7)');
      } else if (request.walletAddress.length !== 58) {
        warnings.push('Algorand addresses are typically 58 characters long');
      }
    }
  } else if (isARC200Request(request)) {
    if (!request.symbol || request.symbol.trim().length === 0) {
      errors.push('Token symbol is required for ARC200');
    }
    if (request.decimals < 0) {
      errors.push('Decimals cannot be negative');
    }
    if (!request.totalSupply || request.totalSupply === '0') {
      errors.push('Total supply must be greater than 0');
    }
    // Validate Algorand address format (basic check)
    if (request.walletAddress && request.walletAddress.length > 0) {
      if (!request.walletAddress.match(/^[A-Z2-7]+$/)) {
        errors.push('Invalid Algorand wallet address format (must contain only uppercase letters and numbers 2-7)');
      } else if (request.walletAddress.length !== 58) {
        warnings.push('Algorand addresses are typically 58 characters long');
      }
    }
  } else if (isARC1400Request(request)) {
    if (!request.symbol || request.symbol.trim().length === 0) {
      errors.push('Token symbol is required for ARC1400');
    }
    if (!request.partitions || request.partitions.length === 0) {
      errors.push('At least one partition is required for ARC1400');
    }
    if (request.decimals < 0) {
      errors.push('Decimals cannot be negative');
    }
    if (!request.totalSupply || request.totalSupply === '0') {
      errors.push('Total supply must be greater than 0');
    }
    // Validate Algorand address format (basic check)
    if (request.walletAddress && request.walletAddress.length > 0) {
      if (!request.walletAddress.match(/^[A-Z2-7]+$/)) {
        errors.push('Invalid Algorand wallet address format (must contain only uppercase letters and numbers 2-7)');
      } else if (request.walletAddress.length !== 58) {
        warnings.push('Algorand addresses are typically 58 characters long');
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * API error response
 */
export interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
  details?: Record<string, any>;
}

/**
 * Health check response
 */
export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version?: string;
  services?: Record<string, 'up' | 'down'>;
}
