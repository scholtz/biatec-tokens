/**
 * Batch Deployment Validation Utilities
 * 
 * Validates batch deployment configurations including token-level and batch-level constraints
 */

import type { TokenDeploymentRequest } from '../types/api';
import type { 
  BatchValidationResult, 
  BatchValidationError, 
  BatchValidationWarning 
} from '../types/batch';
import { validateTokenDeploymentRequest } from '../types/api';

/**
 * Maximum tokens allowed per batch (can be tier-dependent in future)
 */
export const MAX_BATCH_SIZE = 50;

/**
 * Minimum tokens required for a batch
 */
export const MIN_BATCH_SIZE = 1;

/**
 * Validate a batch deployment request
 */
export function validateBatchDeployment(
  tokens: TokenDeploymentRequest[]
): BatchValidationResult {
  const errors: BatchValidationError[] = [];
  const warnings: BatchValidationWarning[] = [];

  // Validate batch size
  if (tokens.length < MIN_BATCH_SIZE) {
    errors.push({
      code: 'BATCH_TOO_SMALL',
      message: `Batch must contain at least ${MIN_BATCH_SIZE} token(s)`,
    });
  }

  if (tokens.length > MAX_BATCH_SIZE) {
    errors.push({
      code: 'BATCH_TOO_LARGE',
      message: `Batch cannot contain more than ${MAX_BATCH_SIZE} tokens`,
    });
  }

  // Validate each token individually
  tokens.forEach((token, index) => {
    const validation = validateTokenDeploymentRequest(token);
    
    if (!validation.valid) {
      validation.errors.forEach(err => {
        errors.push({
          code: 'TOKEN_VALIDATION_FAILED',
          message: `Token ${index + 1} (${token.name}): ${err}`,
          tokenIndex: index,
          field: err,
        });
      });
    }

    if (validation.warnings && validation.warnings.length > 0) {
      validation.warnings.forEach(warning => {
        warnings.push({
          code: 'TOKEN_VALIDATION_WARNING',
          message: `Token ${index + 1} (${token.name}): ${warning}`,
          tokenIndex: index,
        });
      });
    }
  });

  // Batch-level validations
  validateUniqueSymbols(tokens, errors);
  validateConsistentWallets(tokens, errors);
  validateNetworkCompatibility(tokens, warnings);
  validateComplianceRequirements(tokens, warnings);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate that token symbols are unique within the batch
 */
function validateUniqueSymbols(
  tokens: TokenDeploymentRequest[],
  errors: BatchValidationError[]
): void {
  const symbolMap = new Map<string, number[]>();

  tokens.forEach((token, index) => {
    // Get symbol based on token standard
    let symbol: string | undefined;
    
    if ('symbol' in token) {
      symbol = token.symbol;
    } else if ('unitName' in token) {
      symbol = token.unitName;
    }

    if (symbol) {
      const normalizedSymbol = symbol.toUpperCase();
      if (!symbolMap.has(normalizedSymbol)) {
        symbolMap.set(normalizedSymbol, []);
      }
      symbolMap.get(normalizedSymbol)!.push(index);
    }
  });

  // Check for duplicates
  symbolMap.forEach((indices, symbol) => {
    if (indices.length > 1) {
      const tokenNames = indices.map(i => tokens[i].name).join(', ');
      errors.push({
        code: 'DUPLICATE_SYMBOL',
        message: `Symbol "${symbol}" is used by multiple tokens: ${tokenNames}`,
      });
    }
  });
}

/**
 * Validate that all tokens use the same wallet address
 */
function validateConsistentWallets(
  tokens: TokenDeploymentRequest[],
  errors: BatchValidationError[]
): void {
  if (tokens.length === 0) return;

  const firstWallet = tokens[0].walletAddress;
  const inconsistentTokens: number[] = [];

  tokens.forEach((token, index) => {
    if (token.walletAddress !== firstWallet) {
      inconsistentTokens.push(index);
    }
  });

  if (inconsistentTokens.length > 0) {
    errors.push({
      code: 'INCONSISTENT_WALLETS',
      message: `All tokens in a batch must use the same wallet address. Tokens at indices ${inconsistentTokens.join(', ')} use different wallet addresses.`,
    });
  }
}

/**
 * Validate network compatibility and provide warnings for cross-chain batches
 */
function validateNetworkCompatibility(
  tokens: TokenDeploymentRequest[],
  warnings: BatchValidationWarning[]
): void {
  // Group tokens by standard to detect cross-chain deployments
  const standardGroups = new Map<string, number>();
  
  tokens.forEach(token => {
    const count = standardGroups.get(token.standard) || 0;
    standardGroups.set(token.standard, count + 1);
  });

  // If batch contains multiple standards, warn about sequential deployment
  if (standardGroups.size > 1) {
    const standards = Array.from(standardGroups.keys()).join(', ');
    warnings.push({
      code: 'MIXED_STANDARDS',
      message: `Batch contains tokens of different standards (${standards}). Tokens will be deployed sequentially, which may take longer.`,
    });
  }

  // Check for EVM and AVM mix
  const hasEVM = tokens.some(t => ['ERC20', 'ERC721'].includes(t.standard));
  const hasAVM = tokens.some(t => ['ARC3', 'ARC200', 'ARC1400'].includes(t.standard));

  if (hasEVM && hasAVM) {
    warnings.push({
      code: 'MIXED_CHAIN_TYPES',
      message: 'Batch contains both EVM and AVM tokens. Ensure you have the appropriate wallet connections for both chain types.',
    });
  }
}

/**
 * Validate compliance requirements across the batch
 */
function validateComplianceRequirements(
  tokens: TokenDeploymentRequest[],
  warnings: BatchValidationWarning[]
): void {
  // Check for tokens with compliance metadata
  const tokensWithCompliance = tokens.filter(token => {
    return 'complianceMetadata' in token && token.complianceMetadata !== undefined;
  });

  if (tokensWithCompliance.length > 0 && tokensWithCompliance.length < tokens.length) {
    warnings.push({
      code: 'INCONSISTENT_COMPLIANCE',
      message: `${tokensWithCompliance.length} of ${tokens.length} tokens have compliance metadata. Consider adding compliance metadata to all tokens for consistency.`,
    });
  }

  // Check for tokens with KYC requirements
  const tokensWithKYC = tokens.filter(token => {
    if ('complianceMetadata' in token && token.complianceMetadata) {
      return token.complianceMetadata.kycRequired;
    }
    return false;
  });

  if (tokensWithKYC.length > 0) {
    warnings.push({
      code: 'KYC_REQUIRED',
      message: `${tokensWithKYC.length} token(s) in this batch require KYC. Ensure whitelist/allowlist configuration is complete before deployment.`,
    });
  }
}

/**
 * Validate that a batch can be retried
 */
export function canRetryBatch(status: string): boolean {
  return ['partial', 'failed'].includes(status);
}

/**
 * Get user-friendly validation summary
 */
export function getValidationSummary(result: BatchValidationResult): string {
  if (result.valid && result.warnings.length === 0) {
    return 'All validations passed successfully.';
  }

  const parts: string[] = [];

  if (!result.valid) {
    parts.push(`${result.errors.length} error(s) found`);
  }

  if (result.warnings.length > 0) {
    parts.push(`${result.warnings.length} warning(s)`);
  }

  return parts.join(', ');
}
