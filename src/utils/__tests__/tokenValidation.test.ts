import { describe, it, expect } from 'vitest';
import {
  validateDecimals,
  validateSupply,
  validateName,
  validateSymbol,
  validateDescription,
  validateMicaCompliance,
  validateTokenParameters,
  formatValidationErrors,
  getFieldValidationMessage,
} from '../tokenValidation';

describe('Token Validation', () => {
  describe('validateDecimals', () => {
    it('should accept valid decimals for FT', () => {
      expect(validateDecimals(6, 'FT')).toBeNull();
      expect(validateDecimals(0, 'FT')).toBeNull();
      expect(validateDecimals(12, 'FT')).toBeNull();
    });

    it('should return null for NFT (decimals not applicable)', () => {
      expect(validateDecimals(undefined, 'NFT')).toBeNull();
      expect(validateDecimals(0, 'NFT')).toBeNull();
    });

    it('should reject undefined decimals for FT', () => {
      const error = validateDecimals(undefined, 'FT');
      expect(error).not.toBeNull();
      expect(error?.field).toBe('decimals');
      expect(error?.severity).toBe('error');
    });

    it('should reject negative decimals', () => {
      const error = validateDecimals(-1, 'FT');
      expect(error).not.toBeNull();
      expect(error?.message).toContain('cannot be negative');
    });

    it('should reject decimals > 18', () => {
      const error = validateDecimals(19, 'FT');
      expect(error).not.toBeNull();
      expect(error?.message).toContain('cannot exceed 18');
    });

    it('should warn for decimals > 12', () => {
      const warning = validateDecimals(15, 'FT');
      expect(warning).not.toBeNull();
      expect(warning?.severity).toBe('warning');
    });

    it('should reject non-integer decimals', () => {
      const error = validateDecimals(6.5, 'FT');
      expect(error).not.toBeNull();
      expect(error?.message).toContain('whole number');
    });
  });

  describe('validateSupply', () => {
    it('should accept valid supply', () => {
      expect(validateSupply(1000000, 'FT')).toBeNull();
      expect(validateSupply(1, 'FT')).toBeNull();
    });

    it('should reject undefined supply', () => {
      const error = validateSupply(undefined, 'FT');
      expect(error).not.toBeNull();
      expect(error?.field).toBe('supply');
    });

    it('should reject zero or negative supply', () => {
      expect(validateSupply(0, 'FT')).not.toBeNull();
      expect(validateSupply(-100, 'FT')).not.toBeNull();
    });

    it('should reject non-integer supply', () => {
      const error = validateSupply(1000.5, 'FT');
      expect(error).not.toBeNull();
      expect(error?.message).toContain('whole number');
    });

    it('should warn for extremely large supply', () => {
      const warning = validateSupply(1e16, 'FT');
      expect(warning).not.toBeNull();
      expect(warning?.severity).toBe('warning');
    });

    it('should warn when NFT supply is not 1', () => {
      const warning = validateSupply(100, 'NFT');
      expect(warning).not.toBeNull();
      expect(warning?.severity).toBe('warning');
      expect(warning?.message).toContain('typically have a supply of 1');
    });
  });

  describe('validateName', () => {
    it('should accept valid names', () => {
      expect(validateName('My Token')).toBeNull();
      expect(validateName('Awesome Project')).toBeNull();
    });

    it('should reject empty names', () => {
      expect(validateName('')).not.toBeNull();
      expect(validateName(undefined)).not.toBeNull();
      expect(validateName('   ')).not.toBeNull();
    });

    it('should warn for very short names', () => {
      const warning = validateName('AB');
      expect(warning).not.toBeNull();
      expect(warning?.severity).toBe('warning');
    });

    it('should reject very long names', () => {
      const longName = 'A'.repeat(101);
      const error = validateName(longName);
      expect(error).not.toBeNull();
      expect(error?.severity).toBe('error');
    });
  });

  describe('validateSymbol', () => {
    it('should accept valid symbols', () => {
      expect(validateSymbol('BTC')).toBeNull();
      expect(validateSymbol('MYTOKEN')).toBeNull();
    });

    it('should reject empty symbols', () => {
      expect(validateSymbol('')).not.toBeNull();
      expect(validateSymbol(undefined)).not.toBeNull();
    });

    it('should reject very short symbols', () => {
      const error = validateSymbol('A');
      expect(error).not.toBeNull();
      expect(error?.severity).toBe('error');
    });

    it('should reject very long symbols', () => {
      const error = validateSymbol('VERYLONGSYMBOL');
      expect(error).not.toBeNull();
    });

    it('should warn for lowercase symbols', () => {
      const warning = validateSymbol('btc');
      expect(warning).not.toBeNull();
      expect(warning?.severity).toBe('warning');
      expect(warning?.message).toContain('uppercase');
    });

    it('should warn for symbols with special characters', () => {
      const warning = validateSymbol('MY-TOKEN');
      expect(warning).not.toBeNull();
      expect(warning?.severity).toBe('warning');
    });
  });

  describe('validateDescription', () => {
    it('should accept valid descriptions', () => {
      expect(validateDescription('This is a valid token description')).toBeNull();
    });

    it('should reject empty descriptions', () => {
      expect(validateDescription('')).not.toBeNull();
      expect(validateDescription(undefined)).not.toBeNull();
    });

    it('should warn for very short descriptions', () => {
      const warning = validateDescription('Short');
      expect(warning).not.toBeNull();
      expect(warning?.severity).toBe('warning');
    });

    it('should reject very long descriptions', () => {
      const longDesc = 'A'.repeat(1001);
      const error = validateDescription(longDesc);
      expect(error).not.toBeNull();
      expect(error?.severity).toBe('error');
    });
  });

  describe('validateMicaCompliance', () => {
    it('should return null when not required', () => {
      expect(validateMicaCompliance(undefined, false)).toBeNull();
    });

    it('should reject missing metadata when required', () => {
      const error = validateMicaCompliance(undefined, true);
      expect(error).not.toBeNull();
      expect(error?.message).toContain('required');
    });

    it('should accept complete metadata', () => {
      const metadata = {
        issuerLegalName: 'Test Company',
        issuerRegistrationNumber: '12345',
        issuerJurisdiction: 'EU',
        micaTokenClassification: 'utility',
        tokenPurpose: 'Test purpose',
        complianceContactEmail: 'test@example.com',
        kycRequired: false,
      };
      expect(validateMicaCompliance(metadata, true)).toBeNull();
    });

    it('should reject incomplete metadata', () => {
      const metadata = {
        issuerLegalName: 'Test Company',
        // Missing other required fields
      };
      const error = validateMicaCompliance(metadata, true);
      expect(error).not.toBeNull();
    });

    it('should reject invalid email format', () => {
      const metadata = {
        issuerLegalName: 'Test Company',
        issuerRegistrationNumber: '12345',
        issuerJurisdiction: 'EU',
        micaTokenClassification: 'utility',
        tokenPurpose: 'Test purpose',
        complianceContactEmail: 'invalid-email',
        kycRequired: false,
      };
      const error = validateMicaCompliance(metadata, true);
      expect(error).not.toBeNull();
      expect(error?.message).toContain('email');
    });
  });

  describe('validateTokenParameters', () => {
    it('should validate complete valid token', () => {
      const result = validateTokenParameters({
        name: 'My Token',
        symbol: 'MTK',
        description: 'This is a test token',
        type: 'FT',
        supply: 1000000,
        decimals: 6,
        standard: 'ASA',
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should collect multiple errors', () => {
      const result = validateTokenParameters({
        name: '',
        symbol: 'A',
        description: '',
        type: 'FT',
        supply: -100,
        decimals: 20,
        standard: 'ASA',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should require MICA compliance for ARC200', () => {
      const result = validateTokenParameters({
        name: 'My Token',
        symbol: 'MTK',
        description: 'Test token',
        type: 'FT',
        supply: 1000000,
        decimals: 6,
        standard: 'ARC200',
        complianceMetadata: undefined,
      });

      expect(result.isValid).toBe(false);
      const complianceError = result.errors.find((e) => e.field === 'complianceMetadata');
      expect(complianceError).toBeDefined();
    });

    it('should separate errors and warnings', () => {
      const result = validateTokenParameters({
        name: 'My Token',
        symbol: 'mtk', // lowercase - warning
        description: 'This is a test token',
        type: 'FT',
        supply: 1000000,
        decimals: 15, // high decimals - warning
        standard: 'ASA',
      });

      expect(result.isValid).toBe(true); // no errors
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('formatValidationErrors', () => {
    it('should format multiple errors', () => {
      const result = {
        isValid: false,
        errors: [
          { field: 'name', message: 'Name is required', severity: 'error' as const },
          { field: 'symbol', message: 'Symbol is required', severity: 'error' as const },
        ],
        warnings: [],
      };

      const formatted = formatValidationErrors(result);
      expect(formatted).toContain('Name is required');
      expect(formatted).toContain('Symbol is required');
    });

    it('should return empty string for valid result', () => {
      const result = {
        isValid: true,
        errors: [],
        warnings: [],
      };

      expect(formatValidationErrors(result)).toBe('');
    });
  });

  describe('getFieldValidationMessage', () => {
    it('should return error message for field', () => {
      const result = {
        isValid: false,
        errors: [{ field: 'name', message: 'Name is required', severity: 'error' as const }],
        warnings: [],
      };

      expect(getFieldValidationMessage(result, 'name')).toBe('Name is required');
    });

    it('should return warning message when no error', () => {
      const result = {
        isValid: true,
        errors: [],
        warnings: [{ field: 'symbol', message: 'Uppercase recommended', severity: 'warning' as const }],
      };

      expect(getFieldValidationMessage(result, 'symbol')).toBe('Uppercase recommended');
    });

    it('should return null when no validation message', () => {
      const result = {
        isValid: true,
        errors: [],
        warnings: [],
      };

      expect(getFieldValidationMessage(result, 'name')).toBeNull();
    });
  });
});
