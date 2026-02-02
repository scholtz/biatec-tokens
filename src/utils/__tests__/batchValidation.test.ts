import { describe, it, expect } from 'vitest';
import { 
  validateBatchDeployment, 
  canRetryBatch,
  getValidationSummary,
  MAX_BATCH_SIZE,
  MIN_BATCH_SIZE
} from '../batchValidation';
import type { TokenDeploymentRequest } from '../../types/api';
import { TokenStandard } from '../../types/api';

describe('Batch Validation', () => {
  describe('validateBatchDeployment', () => {
    it('should validate a valid batch', () => {
      const tokens: TokenDeploymentRequest[] = [
        {
          standard: TokenStandard.ERC20,
          name: 'Token A',
          symbol: 'TKNA',
          decimals: 18,
          totalSupply: '1000000',
          walletAddress: '0x1234567890123456789012345678901234567890',
        },
        {
          standard: TokenStandard.ERC20,
          name: 'Token B',
          symbol: 'TKNB',
          decimals: 18,
          totalSupply: '2000000',
          walletAddress: '0x1234567890123456789012345678901234567890',
        },
      ];

      const result = validateBatchDeployment(tokens);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty batch', () => {
      const tokens: TokenDeploymentRequest[] = [];
      const result = validateBatchDeployment(tokens);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'BATCH_TOO_SMALL')).toBe(true);
    });

    it('should reject batch exceeding maximum size', () => {
      const tokens: TokenDeploymentRequest[] = Array(MAX_BATCH_SIZE + 1).fill({
        standard: TokenStandard.ERC20,
        name: 'Token',
        symbol: 'TKN',
        decimals: 18,
        totalSupply: '1000000',
        walletAddress: '0x1234567890123456789012345678901234567890',
      });

      const result = validateBatchDeployment(tokens);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'BATCH_TOO_LARGE')).toBe(true);
    });

    it('should detect duplicate symbols', () => {
      const tokens: TokenDeploymentRequest[] = [
        {
          standard: TokenStandard.ERC20,
          name: 'Token A',
          symbol: 'TKN',
          decimals: 18,
          totalSupply: '1000000',
          walletAddress: '0x1234567890123456789012345678901234567890',
        },
        {
          standard: TokenStandard.ERC20,
          name: 'Token B',
          symbol: 'TKN',
          decimals: 18,
          totalSupply: '2000000',
          walletAddress: '0x1234567890123456789012345678901234567890',
        },
      ];

      const result = validateBatchDeployment(tokens);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'DUPLICATE_SYMBOL')).toBe(true);
    });

    it('should detect duplicate symbols case-insensitively', () => {
      const tokens: TokenDeploymentRequest[] = [
        {
          standard: TokenStandard.ERC20,
          name: 'Token A',
          symbol: 'tkn',
          decimals: 18,
          totalSupply: '1000000',
          walletAddress: '0x1234567890123456789012345678901234567890',
        },
        {
          standard: TokenStandard.ERC20,
          name: 'Token B',
          symbol: 'TKN',
          decimals: 18,
          totalSupply: '2000000',
          walletAddress: '0x1234567890123456789012345678901234567890',
        },
      ];

      const result = validateBatchDeployment(tokens);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'DUPLICATE_SYMBOL')).toBe(true);
    });

    it('should detect inconsistent wallet addresses', () => {
      const tokens: TokenDeploymentRequest[] = [
        {
          standard: TokenStandard.ERC20,
          name: 'Token A',
          symbol: 'TKNA',
          decimals: 18,
          totalSupply: '1000000',
          walletAddress: '0x1234567890123456789012345678901234567890',
        },
        {
          standard: TokenStandard.ERC20,
          name: 'Token B',
          symbol: 'TKNB',
          decimals: 18,
          totalSupply: '2000000',
          walletAddress: '0x0987654321098765432109876543210987654321',
        },
      ];

      const result = validateBatchDeployment(tokens);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'INCONSISTENT_WALLETS')).toBe(true);
    });

    it('should warn about mixed token standards', () => {
      const tokens: TokenDeploymentRequest[] = [
        {
          standard: TokenStandard.ERC20,
          name: 'Token A',
          symbol: 'TKNA',
          decimals: 18,
          totalSupply: '1000000',
          walletAddress: '0x1234567890123456789012345678901234567890',
        },
        {
          standard: TokenStandard.ARC200,
          name: 'Token B',
          symbol: 'TKNB',
          decimals: 6,
          totalSupply: '2000000',
          walletAddress: '0x1234567890123456789012345678901234567890',
        },
      ];

      const result = validateBatchDeployment(tokens);

      expect(result.warnings.some(w => w.code === 'MIXED_STANDARDS')).toBe(true);
      expect(result.warnings.some(w => w.code === 'MIXED_CHAIN_TYPES')).toBe(true);
    });

    it('should warn about inconsistent compliance metadata', () => {
      const tokens: TokenDeploymentRequest[] = [
        {
          standard: TokenStandard.ARC200,
          name: 'Token A',
          symbol: 'TKNA',
          decimals: 6,
          totalSupply: '1000000',
          walletAddress: '0x1234567890123456789012345678901234567890',
          complianceMetadata: {
            issuerLegalName: 'Test Corp',
            issuerRegistrationNumber: '12345',
            issuerJurisdiction: 'US',
            micaTokenClassification: 'utility',
            tokenPurpose: 'Test token',
            kycRequired: true,
            complianceContactEmail: 'test@example.com',
          },
        },
        {
          standard: TokenStandard.ARC200,
          name: 'Token B',
          symbol: 'TKNB',
          decimals: 6,
          totalSupply: '2000000',
          walletAddress: '0x1234567890123456789012345678901234567890',
        },
      ];

      const result = validateBatchDeployment(tokens);

      expect(result.warnings.some(w => w.code === 'INCONSISTENT_COMPLIANCE')).toBe(true);
      expect(result.warnings.some(w => w.code === 'KYC_REQUIRED')).toBe(true);
    });

    it('should validate ARC3 tokens with unitName', () => {
      // Valid Algorand address format: 58 characters, uppercase letters and numbers 2-7
      const algoAddress = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
      
      const tokens: TokenDeploymentRequest[] = [
        {
          standard: TokenStandard.ARC3,
          name: 'NFT A',
          unitName: 'NFTA',
          total: 1,
          decimals: 0,
          walletAddress: algoAddress,
        },
        {
          standard: TokenStandard.ARC3,
          name: 'NFT B',
          unitName: 'NFTB',
          total: 1,
          decimals: 0,
          walletAddress: algoAddress,
        },
      ];

      const result = validateBatchDeployment(tokens);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('canRetryBatch', () => {
    it('should allow retry for partial status', () => {
      expect(canRetryBatch('partial')).toBe(true);
    });

    it('should allow retry for failed status', () => {
      expect(canRetryBatch('failed')).toBe(true);
    });

    it('should not allow retry for completed status', () => {
      expect(canRetryBatch('completed')).toBe(false);
    });

    it('should not allow retry for deploying status', () => {
      expect(canRetryBatch('deploying')).toBe(false);
    });
  });

  describe('getValidationSummary', () => {
    it('should return success message for valid batch with no warnings', () => {
      const result = {
        valid: true,
        errors: [],
        warnings: [],
      };

      const summary = getValidationSummary(result);

      expect(summary).toBe('All validations passed successfully.');
    });

    it('should return error count for invalid batch', () => {
      const result = {
        valid: false,
        errors: [
          { code: 'ERROR1', message: 'Error 1' },
          { code: 'ERROR2', message: 'Error 2' },
        ],
        warnings: [],
      };

      const summary = getValidationSummary(result);

      expect(summary).toContain('2 error(s) found');
    });

    it('should return warning count for valid batch with warnings', () => {
      const result = {
        valid: true,
        errors: [],
        warnings: [
          { code: 'WARN1', message: 'Warning 1' },
        ],
      };

      const summary = getValidationSummary(result);

      expect(summary).toContain('1 warning(s)');
    });

    it('should return both error and warning counts', () => {
      const result = {
        valid: false,
        errors: [
          { code: 'ERROR1', message: 'Error 1' },
        ],
        warnings: [
          { code: 'WARN1', message: 'Warning 1' },
          { code: 'WARN2', message: 'Warning 2' },
        ],
      };

      const summary = getValidationSummary(result);

      expect(summary).toContain('1 error(s) found');
      expect(summary).toContain('2 warning(s)');
    });
  });
});
