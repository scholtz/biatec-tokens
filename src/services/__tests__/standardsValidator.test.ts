import { describe, it, expect } from 'vitest';
import {
  validateARC3,
  validateARC19,
  validateARC69,
  validateASA,
  calculateReadiness,
  validateStandard,
} from '../standardsValidator';
import type { MetadataValidationRequest } from '../../types/standardsValidation';

describe('Standards Validator', () => {
  describe('validateARC3', () => {
    it('should pass with valid ARC-3 configuration', () => {
      const request: MetadataValidationRequest = {
        standard: 'ARC3',
        metadataUrl: 'https://example.com/metadata.json',
        metadataHash: 'abc123',
        tokenConfig: {
          name: 'Test Token',
          unitName: 'TEST',
          decimals: 0,
          total: 1,
          url: 'https://example.com/metadata.json#arc3',
        },
      };

      const issues = validateARC3(request);
      expect(issues.length).toBe(0);
    });

    it('should fail without #arc3 suffix', () => {
      const request: MetadataValidationRequest = {
        standard: 'ARC3',
        tokenConfig: {
          name: 'Test Token',
          unitName: 'TEST',
          decimals: 0,
          total: 1,
          url: 'https://example.com/metadata.json',
        },
      };

      const issues = validateARC3(request);
      const blockerIssue = issues.find(i => i.id === 'arc3-url-suffix');
      expect(blockerIssue).toBeDefined();
      expect(blockerIssue?.severity).toBe('blocker');
    });

    it('should fail without URL', () => {
      const request: MetadataValidationRequest = {
        standard: 'ARC3',
        tokenConfig: {
          name: 'Test Token',
          unitName: 'TEST',
          decimals: 0,
          total: 1,
        },
      };

      const issues = validateARC3(request);
      const blockerIssue = issues.find(i => i.id === 'arc3-url-missing');
      expect(blockerIssue).toBeDefined();
      expect(blockerIssue?.severity).toBe('blocker');
    });

    it('should warn about missing metadata hash', () => {
      const request: MetadataValidationRequest = {
        standard: 'ARC3',
        tokenConfig: {
          name: 'Test Token',
          unitName: 'TEST',
          decimals: 0,
          total: 1,
          url: 'https://example.com/metadata.json#arc3',
        },
      };

      const issues = validateARC3(request);
      const hashIssue = issues.find(i => i.id === 'arc3-hash-missing');
      expect(hashIssue).toBeDefined();
      expect(hashIssue?.severity).toBe('major');
    });

    it('should warn about NFT with decimals > 0', () => {
      const request: MetadataValidationRequest = {
        standard: 'ARC3',
        metadataHash: 'abc123',
        tokenConfig: {
          name: 'Test NFT',
          unitName: 'NFT',
          decimals: 6, // Wrong for NFT
          total: 1,
          url: 'https://example.com/metadata.json#arc3',
        },
      };

      const issues = validateARC3(request);
      const decimalsIssue = issues.find(i => i.id === 'arc3-nft-decimals');
      expect(decimalsIssue).toBeDefined();
      expect(decimalsIssue?.severity).toBe('major');
    });

    it('should warn about long names', () => {
      const request: MetadataValidationRequest = {
        standard: 'ARC3',
        metadataHash: 'abc123',
        tokenConfig: {
          name: 'A'.repeat(60), // Very long name
          unitName: 'VERYLONGUNIT', // Long unit name
          decimals: 0,
          total: 1,
          url: 'https://example.com/metadata.json#arc3',
        },
      };

      const issues = validateARC3(request);
      const nameIssue = issues.find(i => i.id === 'arc3-name-length');
      const unitIssue = issues.find(i => i.id === 'arc3-unit-length');
      expect(nameIssue).toBeDefined();
      expect(unitIssue).toBeDefined();
      expect(nameIssue?.severity).toBe('minor');
      expect(unitIssue?.severity).toBe('minor');
    });

    it('should warn about non-https URL', () => {
      const request: MetadataValidationRequest = {
        standard: 'ARC3',
        metadataHash: 'abc123',
        tokenConfig: {
          name: 'Test Token',
          unitName: 'TEST',
          decimals: 0,
          total: 1,
          url: 'http://example.com/metadata.json#arc3', // HTTP not HTTPS
        },
      };

      const issues = validateARC3(request);
      const urlIssue = issues.find(i => i.id === 'arc3-url-scheme');
      expect(urlIssue).toBeDefined();
      expect(urlIssue?.severity).toBe('major');
    });
  });

  describe('validateARC19', () => {
    it('should pass with valid ARC-19 configuration', () => {
      const request: MetadataValidationRequest = {
        standard: 'ARC19',
        tokenConfig: {
          name: 'Mutable NFT',
          unitName: 'MNFT',
          decimals: 0,
          total: 1,
          url: 'template-ipfs://{ipfscid:0:dag-pb:reserve:sha2-256}',
          reserve: 'ALGORAND_ADDRESS_HERE',
        },
      };

      const issues = validateARC19(request);
      // Should have no blockers
      const blockers = issues.filter(i => i.severity === 'blocker');
      expect(blockers.length).toBe(0);
    });

    it('should fail without template-ipfs:// URL', () => {
      const request: MetadataValidationRequest = {
        standard: 'ARC19',
        tokenConfig: {
          name: 'Test Token',
          unitName: 'TEST',
          decimals: 0,
          total: 1,
          url: 'https://example.com/metadata.json',
          reserve: 'ALGORAND_ADDRESS',
        },
      };

      const issues = validateARC19(request);
      const urlIssue = issues.find(i => i.id === 'arc19-url-scheme');
      expect(urlIssue).toBeDefined();
      expect(urlIssue?.severity).toBe('blocker');
    });

    it('should fail without reserve address', () => {
      const request: MetadataValidationRequest = {
        standard: 'ARC19',
        tokenConfig: {
          name: 'Test Token',
          unitName: 'TEST',
          decimals: 0,
          total: 1,
          url: 'template-ipfs://{ipfscid:0:dag-pb:reserve:sha2-256}',
        },
      };

      const issues = validateARC19(request);
      const reserveIssue = issues.find(i => i.id === 'arc19-reserve-missing');
      expect(reserveIssue).toBeDefined();
      expect(reserveIssue?.severity).toBe('blocker');
    });

    it('should warn about manager address implications', () => {
      const request: MetadataValidationRequest = {
        standard: 'ARC19',
        tokenConfig: {
          name: 'Mutable NFT',
          unitName: 'MNFT',
          decimals: 0,
          total: 1,
          url: 'template-ipfs://{ipfscid:0:dag-pb:reserve:sha2-256}',
          reserve: 'ALGORAND_ADDRESS',
          manager: 'MANAGER_ADDRESS',
        },
      };

      const issues = validateARC19(request);
      const managerIssue = issues.find(i => i.id === 'arc19-manager-warning');
      expect(managerIssue).toBeDefined();
      expect(managerIssue?.severity).toBe('minor');
    });
  });

  describe('validateARC69', () => {
    it('should pass with valid ARC-69 configuration', () => {
      const metadata = JSON.stringify({
        standard: 'arc69',
        description: 'Test NFT',
        media_url: 'https://example.com/image.png',
      });

      const request: MetadataValidationRequest = {
        standard: 'ARC69',
        inlineMetadata: metadata,
        tokenConfig: {
          name: 'Test NFT',
          unitName: 'NFT',
          decimals: 0,
          total: 1,
        },
      };

      const issues = validateARC69(request);
      const blockers = issues.filter(i => i.severity === 'blocker');
      expect(blockers.length).toBe(0);
    });

    it('should warn about missing metadata', () => {
      const request: MetadataValidationRequest = {
        standard: 'ARC69',
        tokenConfig: {
          name: 'Test NFT',
          unitName: 'NFT',
          decimals: 0,
          total: 1,
        },
      };

      const issues = validateARC69(request);
      const metadataIssue = issues.find(i => i.id === 'arc69-metadata-missing');
      expect(metadataIssue).toBeDefined();
      expect(metadataIssue?.severity).toBe('major');
    });

    it('should fail with invalid JSON', () => {
      const request: MetadataValidationRequest = {
        standard: 'ARC69',
        inlineMetadata: 'not valid json {',
        tokenConfig: {
          name: 'Test NFT',
          unitName: 'NFT',
          decimals: 0,
          total: 1,
        },
      };

      const issues = validateARC69(request);
      const jsonIssue = issues.find(i => i.id === 'arc69-invalid-json');
      expect(jsonIssue).toBeDefined();
      expect(jsonIssue?.severity).toBe('blocker');
    });

    it('should fail when exceeding 1024 byte limit', () => {
      const largeMetadata = JSON.stringify({
        standard: 'arc69',
        description: 'A'.repeat(2000), // Too large
      });

      const request: MetadataValidationRequest = {
        standard: 'ARC69',
        inlineMetadata: largeMetadata,
        tokenConfig: {
          name: 'Test NFT',
          unitName: 'NFT',
          decimals: 0,
          total: 1,
        },
      };

      const issues = validateARC69(request);
      const sizeIssue = issues.find(i => i.id === 'arc69-size-limit');
      expect(sizeIssue).toBeDefined();
      expect(sizeIssue?.severity).toBe('blocker');
    });

    it('should recommend standard field', () => {
      const metadata = JSON.stringify({
        description: 'Test NFT',
        // Missing standard field
      });

      const request: MetadataValidationRequest = {
        standard: 'ARC69',
        inlineMetadata: metadata,
        tokenConfig: {
          name: 'Test NFT',
          unitName: 'NFT',
          decimals: 0,
          total: 1,
        },
      };

      const issues = validateARC69(request);
      const standardIssue = issues.find(i => i.id === 'arc69-standard-field');
      expect(standardIssue).toBeDefined();
      expect(standardIssue?.severity).toBe('minor');
    });
  });

  describe('validateASA', () => {
    it('should suggest using metadata standard', () => {
      const request: MetadataValidationRequest = {
        standard: 'ASA',
        tokenConfig: {
          name: 'Plain Token',
          unitName: 'PLAIN',
          decimals: 6,
          total: 1000000,
        },
      };

      const issues = validateASA(request);
      const metadataIssue = issues.find(i => i.id === 'asa-no-metadata');
      expect(metadataIssue).toBeDefined();
      expect(metadataIssue?.severity).toBe('minor');
    });

    it('should pass with URL present', () => {
      const request: MetadataValidationRequest = {
        standard: 'ASA',
        tokenConfig: {
          name: 'Token with URL',
          unitName: 'TOKEN',
          decimals: 6,
          total: 1000000,
          url: 'https://example.com',
        },
      };

      const issues = validateASA(request);
      expect(issues.length).toBe(0);
    });
  });

  describe('calculateReadiness', () => {
    it('should return excellent with no issues', () => {
      const readiness = calculateReadiness([]);
      expect(readiness.score).toBe(100);
      expect(readiness.level).toBe('excellent');
      expect(readiness.shouldBlock).toBe(false);
    });

    it('should return critical with blockers', () => {
      const issues = [
        {
          id: 'test-blocker',
          field: 'test',
          severity: 'blocker' as const,
          message: 'Test blocker',
        },
      ];
      const readiness = calculateReadiness(issues);
      expect(readiness.level).toBe('critical');
      expect(readiness.shouldBlock).toBe(true);
      expect(readiness.score).toBe(60); // 100 - 40
    });

    it('should calculate score correctly with mixed issues', () => {
      const issues = [
        {
          id: 'test-major',
          field: 'test',
          severity: 'major' as const,
          message: 'Major issue',
        },
        {
          id: 'test-minor',
          field: 'test',
          severity: 'minor' as const,
          message: 'Minor issue',
        },
      ];
      const readiness = calculateReadiness(issues);
      expect(readiness.score).toBe(80); // 100 - 15 - 5
      expect(readiness.level).toBe('good');
      expect(readiness.shouldBlock).toBe(false);
      expect(readiness.requiresAcknowledgment).toBe(true);
    });
  });

  describe('validateStandard', () => {
    it('should validate ARC-3 standard', () => {
      const request: MetadataValidationRequest = {
        standard: 'ARC3',
        metadataHash: 'abc123',
        tokenConfig: {
          name: 'Test Token',
          unitName: 'TEST',
          decimals: 0,
          total: 1,
          url: 'https://example.com/metadata.json#arc3',
        },
      };

      const result = validateStandard('ARC3', request);
      expect(result.standard).toBe('ARC3');
      expect(result.readiness.score).toBeGreaterThan(0);
      expect(result.summary).toBeDefined();
      expect(result.validatedAt).toBeInstanceOf(Date);
    });

    it('should provide summary for critical issues', () => {
      const request: MetadataValidationRequest = {
        standard: 'ARC3',
        tokenConfig: {
          name: 'Test Token',
          unitName: 'TEST',
          decimals: 0,
          total: 1,
          // Missing URL - blocker
        },
      };

      const result = validateStandard('ARC3', request);
      expect(result.readiness.level).toBe('critical');
      expect(result.summary).toContain('failed');
    });

    it('should provide summary for excellent compliance', () => {
      const request: MetadataValidationRequest = {
        standard: 'ASA',
        tokenConfig: {
          name: 'Plain Token',
          unitName: 'PLAIN',
          decimals: 6,
          total: 1000000,
          url: 'https://example.com',
        },
      };

      const result = validateStandard('ASA', request);
      expect(result.readiness.level).toBe('excellent');
      expect(result.summary).toContain('excellent');
    });
  });
});
