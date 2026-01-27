/**
 * Token validation utilities for preflight checks
 * Validates token parameters before deployment to reduce user errors
 */

export interface TokenValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface TokenValidationResult {
  isValid: boolean;
  errors: TokenValidationError[];
  warnings: TokenValidationError[];
}

/**
 * Validates token decimals
 * Must be between 0 and 18 (standard range for most token standards)
 */
export function validateDecimals(decimals: number | undefined, tokenType: 'FT' | 'NFT'): TokenValidationError | null {
  // NFTs don't have decimals
  if (tokenType === 'NFT') {
    return null;
  }

  if (decimals === undefined || decimals === null) {
    return {
      field: 'decimals',
      message: 'Decimals are required for fungible tokens',
      severity: 'error',
    };
  }

  if (!Number.isInteger(decimals)) {
    return {
      field: 'decimals',
      message: 'Decimals must be a whole number',
      severity: 'error',
    };
  }

  if (decimals < 0) {
    return {
      field: 'decimals',
      message: 'Decimals cannot be negative',
      severity: 'error',
    };
  }

  if (decimals > 18) {
    return {
      field: 'decimals',
      message: 'Decimals cannot exceed 18 (standard maximum)',
      severity: 'error',
    };
  }

  // Warning for unusual decimals
  if (decimals > 12) {
    return {
      field: 'decimals',
      message: 'Using more than 12 decimals is uncommon and may cause precision issues',
      severity: 'warning',
    };
  }

  return null;
}

/**
 * Validates token supply
 * Must be a positive number within reasonable bounds
 */
export function validateSupply(supply: number | undefined, tokenType: 'FT' | 'NFT'): TokenValidationError | null {
  if (supply === undefined || supply === null) {
    return {
      field: 'supply',
      message: 'Total supply is required',
      severity: 'error',
    };
  }

  if (!Number.isFinite(supply)) {
    return {
      field: 'supply',
      message: 'Supply must be a valid number',
      severity: 'error',
    };
  }

  if (supply <= 0) {
    return {
      field: 'supply',
      message: 'Supply must be greater than 0',
      severity: 'error',
    };
  }

  if (!Number.isInteger(supply)) {
    return {
      field: 'supply',
      message: 'Supply must be a whole number',
      severity: 'error',
    };
  }

  // Warning for extremely large supplies
  const maxReasonableSupply = 1e15; // 1 quadrillion
  if (supply > maxReasonableSupply) {
    return {
      field: 'supply',
      message: `Supply exceeds ${maxReasonableSupply.toExponential()} which may cause issues`,
      severity: 'warning',
    };
  }

  // NFT-specific validation
  if (tokenType === 'NFT' && supply !== 1) {
    return {
      field: 'supply',
      message: 'NFTs typically have a supply of 1. Are you sure this is correct?',
      severity: 'warning',
    };
  }

  return null;
}

/**
 * Validates token name
 */
export function validateName(name: string | undefined): TokenValidationError | null {
  if (!name || name.trim() === '') {
    return {
      field: 'name',
      message: 'Token name is required',
      severity: 'error',
    };
  }

  if (name.length < 3) {
    return {
      field: 'name',
      message: 'Token name should be at least 3 characters',
      severity: 'warning',
    };
  }

  if (name.length > 100) {
    return {
      field: 'name',
      message: 'Token name should not exceed 100 characters',
      severity: 'error',
    };
  }

  return null;
}

/**
 * Validates token symbol
 */
export function validateSymbol(symbol: string | undefined): TokenValidationError | null {
  if (!symbol || symbol.trim() === '') {
    return {
      field: 'symbol',
      message: 'Token symbol is required',
      severity: 'error',
    };
  }

  // Symbols are typically 2-8 characters, uppercase
  if (symbol.length < 2) {
    return {
      field: 'symbol',
      message: 'Token symbol should be at least 2 characters',
      severity: 'error',
    };
  }

  if (symbol.length > 10) {
    return {
      field: 'symbol',
      message: 'Token symbol should not exceed 10 characters',
      severity: 'error',
    };
  }

  // Warning for non-uppercase symbols
  if (symbol !== symbol.toUpperCase()) {
    return {
      field: 'symbol',
      message: 'Token symbols are conventionally uppercase',
      severity: 'warning',
    };
  }

  // Warning for symbols with special characters
  if (!/^[A-Z0-9]+$/.test(symbol)) {
    return {
      field: 'symbol',
      message: 'Token symbols typically contain only letters and numbers',
      severity: 'warning',
    };
  }

  return null;
}

/**
 * Validates token description
 */
export function validateDescription(description: string | undefined): TokenValidationError | null {
  if (!description || description.trim() === '') {
    return {
      field: 'description',
      message: 'Token description is required',
      severity: 'error',
    };
  }

  if (description.length < 10) {
    return {
      field: 'description',
      message: 'Please provide a more detailed description (at least 10 characters)',
      severity: 'warning',
    };
  }

  if (description.length > 1000) {
    return {
      field: 'description',
      message: 'Description should not exceed 1000 characters',
      severity: 'error',
    };
  }

  return null;
}

/**
 * Validates MICA compliance metadata
 */
export function validateMicaCompliance(
  metadata: any | undefined,
  isRequired: boolean
): TokenValidationError | null {
  if (!isRequired) {
    return null;
  }

  if (!metadata) {
    return {
      field: 'complianceMetadata',
      message: 'MICA compliance metadata is required for this token standard',
      severity: 'error',
    };
  }

  // Check required fields
  const requiredFields = [
    'issuerLegalName',
    'issuerRegistrationNumber',
    'issuerJurisdiction',
    'micaTokenClassification',
    'tokenPurpose',
    'complianceContactEmail',
  ];

  for (const field of requiredFields) {
    if (!metadata[field] || (typeof metadata[field] === 'string' && metadata[field].trim() === '')) {
      return {
        field: 'complianceMetadata',
        message: `MICA compliance field "${field}" is required`,
        severity: 'error',
      };
    }
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(metadata.complianceContactEmail)) {
    return {
      field: 'complianceMetadata',
      message: 'Invalid compliance contact email format',
      severity: 'error',
    };
  }

  return null;
}

/**
 * Validates RWA token compliance requirements
 */
export function validateRwaCompliance(
  isRwaToken: boolean,
  hasWhitelisting: boolean,
  hasCompliance: boolean
): TokenValidationError | null {
  if (!isRwaToken) {
    return null;
  }

  if (!hasWhitelisting && !hasCompliance) {
    return {
      field: 'compliance',
      message: 'RWA tokens typically require whitelisting or compliance measures',
      severity: 'warning',
    };
  }

  return null;
}

/**
 * Comprehensive token validation
 * Performs all validation checks and returns aggregated results
 */
export function validateTokenParameters(params: {
  name: string | undefined;
  symbol: string | undefined;
  description: string | undefined;
  type: 'FT' | 'NFT';
  supply: number | undefined;
  decimals: number | undefined;
  standard: string;
  complianceMetadata?: any;
  complianceMetadataValid?: boolean;
  isRwaToken?: boolean;
}): TokenValidationResult {
  const errors: TokenValidationError[] = [];
  const warnings: TokenValidationError[] = [];

  // Validate each field
  const validations = [
    validateName(params.name),
    validateSymbol(params.symbol),
    validateDescription(params.description),
    validateSupply(params.supply, params.type),
    validateDecimals(params.decimals, params.type),
    validateMicaCompliance(
      params.complianceMetadata,
      params.standard === 'ARC200' || params.isRwaToken === true
    ),
  ];

  // Separate errors and warnings
  for (const validation of validations) {
    if (validation) {
      if (validation.severity === 'error') {
        errors.push(validation);
      } else {
        warnings.push(validation);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(result: TokenValidationResult): string {
  if (result.isValid) {
    return '';
  }

  const errorMessages = result.errors.map((err) => `• ${err.message}`);
  return errorMessages.join('\n');
}

/**
 * Get validation message for a specific field
 */
export function getFieldValidationMessage(
  result: TokenValidationResult,
  fieldName: string
): string | null {
  const error = result.errors.find((e) => e.field === fieldName);
  if (error) {
    return error.message;
  }

  const warning = result.warnings.find((w) => w.field === fieldName);
  if (warning) {
    return warning.message;
  }

  return null;
}
