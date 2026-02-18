/**
 * API Contract Validation Tests
 * Ensures frontend-backend type compatibility for critical data structures
 * Prevents contract drift and catches breaking changes early
 */

import { describe, it, expect } from 'vitest';
import type {
  TokenMetadata,
  ERC20DeploymentRequest,
  ARC3DeploymentRequest,
  MicaComplianceMetadata,
} from '../../types/api';

describe('API Contract Validation', () => {
  describe('TokenMetadata Contract', () => {
    it('should have required fields for basic metadata', () => {
      const validMetadata: TokenMetadata = {
        name: 'Test Token',
      };

      expect(validMetadata.name).toBeDefined();
      expect(typeof validMetadata.name).toBe('string');
    });

    it('should support optional description field', () => {
      const metadata: TokenMetadata = {
        name: 'Test Token',
        description: 'A test token for validation',
      };

      expect(metadata.description).toBeDefined();
      expect(typeof metadata.description).toBe('string');
    });

    it('should support optional image field', () => {
      const metadata: TokenMetadata = {
        name: 'Test Token',
        image: 'https://example.com/image.png',
      };

      expect(metadata.image).toBeDefined();
      expect(typeof metadata.image).toBe('string');
    });

    it('should support image integrity fields', () => {
      const metadata: TokenMetadata = {
        name: 'Test Token',
        image: 'ipfs://QmTest',
        image_integrity: 'sha256-abc123',
        image_mimetype: 'image/png',
      };

      expect(metadata.image_integrity).toBeDefined();
      expect(metadata.image_mimetype).toBeDefined();
    });

    it('should support external_url field', () => {
      const metadata: TokenMetadata = {
        name: 'Test Token',
        external_url: 'https://example.com/token',
      };

      expect(metadata.external_url).toBeDefined();
    });

    it('should support animation_url field', () => {
      const metadata: TokenMetadata = {
        name: 'Test Token',
        animation_url: 'https://example.com/animation.mp4',
      };

      expect(metadata.animation_url).toBeDefined();
    });

    it('should support properties field as Record<string, any>', () => {
      const metadata: TokenMetadata = {
        name: 'Test Token',
        properties: {
          trait_type: 'Rarity',
          value: 'Epic',
        },
      };

      expect(metadata.properties).toBeDefined();
      expect(typeof metadata.properties).toBe('object');
    });

    it('should support extra_metadata string field', () => {
      const metadata: TokenMetadata = {
        name: 'Test Token',
        extra_metadata: 'Additional metadata',
      };

      expect(metadata.extra_metadata).toBeDefined();
      expect(typeof metadata.extra_metadata).toBe('string');
    });

    it('should support localization structure', () => {
      const metadata: TokenMetadata = {
        name: 'Test Token',
        localization: {
          uri: 'ipfs://QmLocalization/{locale}.json',
          default: 'en',
          locales: ['en', 'es', 'fr'],
        },
      };

      expect(metadata.localization).toBeDefined();
      expect(metadata.localization?.uri).toBeDefined();
      expect(metadata.localization?.default).toBe('en');
      expect(Array.isArray(metadata.localization?.locales)).toBe(true);
      expect(metadata.localization?.locales).toContain('en');
    });

    it('should handle complete metadata object', () => {
      const completeMetadata: TokenMetadata = {
        name: 'Complete Token',
        description: 'A fully populated token metadata',
        image: 'ipfs://QmImage',
        image_integrity: 'sha256-integrity',
        image_mimetype: 'image/png',
        external_url: 'https://example.com',
        animation_url: 'https://example.com/animation.mp4',
        properties: {
          rarity: 'Legendary',
          power: '9000',
        },
        extra_metadata: 'Extra information',
        localization: {
          uri: 'ipfs://QmLocale/{locale}.json',
          default: 'en',
          locales: ['en', 'es', 'fr', 'de'],
        },
      };

      expect(completeMetadata.name).toBe('Complete Token');
      expect(completeMetadata.description).toBeDefined();
      expect(completeMetadata.image).toBeDefined();
      expect(completeMetadata.properties).toBeDefined();
      expect(completeMetadata.localization).toBeDefined();
    });
  });

  describe('ERC20DeploymentRequest Contract', () => {
    it('should have all required fields', () => {
      const request: ERC20DeploymentRequest = {
        standard: 'ERC20' as const,
        name: 'Test Token',
        symbol: 'TST',
        decimals: 18,
        totalSupply: '1000000',
        walletAddress: '0x1234567890123456789012345678901234567890',
      };

      expect(request.standard).toBe('ERC20');
      expect(request.name).toBeDefined();
      expect(request.symbol).toBeDefined();
      expect(request.decimals).toBe(18);
      expect(request.totalSupply).toBe('1000000');
      expect(request.walletAddress).toBeDefined();
    });

    it('should support optional description field', () => {
      const request: ERC20DeploymentRequest = {
        standard: 'ERC20',
        name: 'Test Token',
        symbol: 'TST',
        decimals: 18,
        totalSupply: '1000000',
        walletAddress: '0x1234567890123456789012345678901234567890',
        description: 'A test token',
      };

      expect(request.description).toBe('A test token');
    });

    it('should support optional icon field', () => {
      const request: ERC20DeploymentRequest = {
        standard: 'ERC20',
        name: 'Test Token',
        symbol: 'TST',
        decimals: 18,
        totalSupply: '1000000',
        walletAddress: '0x1234567890123456789012345678901234567890',
        icon: 'https://example.com/icon.png',
      };

      expect(request.icon).toBe('https://example.com/icon.png');
    });

    it('should enforce correct standard value', () => {
      const request: ERC20DeploymentRequest = {
        standard: 'ERC20',
        name: 'Test Token',
        symbol: 'TST',
        decimals: 18,
        totalSupply: '1000000',
        walletAddress: '0x1234567890123456789012345678901234567890',
      };

      // TypeScript ensures standard is exactly 'ERC20'
      expect(request.standard).toBe('ERC20');
    });

    it('should use string for totalSupply to handle large numbers', () => {
      const request: ERC20DeploymentRequest = {
        standard: 'ERC20',
        name: 'Test Token',
        symbol: 'TST',
        decimals: 18,
        totalSupply: '1000000000000000000000000', // Very large number as string
        walletAddress: '0x1234567890123456789012345678901234567890',
      };

      expect(typeof request.totalSupply).toBe('string');
      expect(request.totalSupply.length).toBeGreaterThan(10);
    });

    it('should support various decimal values', () => {
      const decimals = [0, 6, 8, 12, 18];
      
      decimals.forEach(dec => {
        const request: ERC20DeploymentRequest = {
          standard: 'ERC20',
          name: 'Test Token',
          symbol: 'TST',
          decimals: dec,
          totalSupply: '1000000',
          walletAddress: '0x1234567890123456789012345678901234567890',
        };

        expect(request.decimals).toBe(dec);
      });
    });
  });

  describe('ARC3DeploymentRequest Contract', () => {
    it('should have all required fields', () => {
      const request: ARC3DeploymentRequest = {
        standard: 'ARC3',
        name: 'Test NFT',
        unitName: 'TNFT',
        total: 1,
        decimals: 0,
        walletAddress: 'TESTADDRESS1234567890TESTADDRESS1234567890TESTADDRESS12',
      };

      expect(request.standard).toBe('ARC3');
      expect(request.name).toBeDefined();
      expect(request.unitName).toBeDefined();
      expect(request.total).toBe(1);
      expect(request.decimals).toBe(0);
      expect(request.walletAddress).toBeDefined();
    });

    it('should support optional url field', () => {
      const request: ARC3DeploymentRequest = {
        standard: 'ARC3',
        name: 'Test NFT',
        unitName: 'TNFT',
        total: 1,
        decimals: 0,
        walletAddress: 'TESTADDRESS1234567890TESTADDRESS1234567890TESTADDRESS12',
        url: 'ipfs://QmTest#arc3',
      };

      expect(request.url).toBe('ipfs://QmTest#arc3');
    });

    it('should support optional metadata field', () => {
      const request: ARC3DeploymentRequest = {
        standard: 'ARC3',
        name: 'Test NFT',
        unitName: 'TNFT',
        total: 1,
        decimals: 0,
        walletAddress: 'TESTADDRESS1234567890TESTADDRESS1234567890TESTADDRESS12',
        metadata: {
          name: 'Test NFT',
          description: 'A test NFT',
          image: 'ipfs://QmImage',
        },
      };

      expect(request.metadata).toBeDefined();
      expect(request.metadata?.name).toBe('Test NFT');
    });

    it('should support optional metadataHash field', () => {
      const request: ARC3DeploymentRequest = {
        standard: 'ARC3',
        name: 'Test NFT',
        unitName: 'TNFT',
        total: 1,
        decimals: 0,
        walletAddress: 'TESTADDRESS1234567890TESTADDRESS1234567890TESTADDRESS12',
        metadataHash: 'b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9',
      };

      expect(request.metadataHash).toBeDefined();
    });

    it('should support optional freeze/clawback/reserve/manager addresses', () => {
      const request: ARC3DeploymentRequest = {
        standard: 'ARC3',
        name: 'Test NFT',
        unitName: 'TNFT',
        total: 1,
        decimals: 0,
        walletAddress: 'TESTADDRESS1234567890TESTADDRESS1234567890TESTADDRESS12',
        freeze: 'FREEZEADDR1234567890FREEZEADDR1234567890FREEZEADDR123',
        clawback: 'CLAWBACK1234567890CLAWBACK1234567890CLAWBACK1234567',
        reserve: 'RESERVEADDR1234567890RESERVEADDR1234567890RESERVEADDR1',
        manager: 'MANAGERADDR1234567890MANAGERADDR1234567890MANAGERADDR1',
      };

      expect(request.freeze).toBeDefined();
      expect(request.clawback).toBeDefined();
      expect(request.reserve).toBeDefined();
      expect(request.manager).toBeDefined();
    });

    it('should support fractional NFTs with total > 1', () => {
      const request: ARC3DeploymentRequest = {
        standard: 'ARC3',
        name: 'Fractional NFT',
        unitName: 'FNFT',
        total: 1000,
        decimals: 2,
        walletAddress: 'TESTADDRESS1234567890TESTADDRESS1234567890TESTADDRESS12',
      };

      expect(request.total).toBe(1000);
      expect(request.decimals).toBe(2);
    });

    it('should support description and icon fields from BaseDeploymentRequest', () => {
      const request: ARC3DeploymentRequest = {
        standard: 'ARC3',
        name: 'Test NFT',
        unitName: 'TNFT',
        total: 1,
        decimals: 0,
        walletAddress: 'TESTADDRESS1234567890TESTADDRESS1234567890TESTADDRESS12',
        description: 'A test NFT description',
        icon: 'https://example.com/icon.png',
      };

      expect(request.description).toBe('A test NFT description');
      expect(request.icon).toBe('https://example.com/icon.png');
    });
  });

  describe('MicaComplianceMetadata Contract', () => {
    it('should have all required issuer fields', () => {
      const metadata: MicaComplianceMetadata = {
        issuerLegalName: 'Test Company Ltd',
        issuerRegistrationNumber: 'REG123456',
        issuerJurisdiction: 'EU',
        micaTokenClassification: 'utility',
        tokenPurpose: 'Platform utility token',
        kycRequired: true,
        complianceContactEmail: 'compliance@test.com',
      };

      expect(metadata.issuerLegalName).toBe('Test Company Ltd');
      expect(metadata.issuerRegistrationNumber).toBe('REG123456');
      expect(metadata.issuerJurisdiction).toBe('EU');
    });

    it('should support optional regulatoryLicense field', () => {
      const metadata: MicaComplianceMetadata = {
        issuerLegalName: 'Test Company Ltd',
        issuerRegistrationNumber: 'REG123456',
        issuerJurisdiction: 'EU',
        regulatoryLicense: 'LIC-2024-001',
        micaTokenClassification: 'utility',
        tokenPurpose: 'Platform utility token',
        kycRequired: true,
        complianceContactEmail: 'compliance@test.com',
      };

      expect(metadata.regulatoryLicense).toBe('LIC-2024-001');
    });

    it('should support all token classification types', () => {
      const classifications: Array<'utility' | 'e-money' | 'asset-referenced' | 'other'> = [
        'utility',
        'e-money',
        'asset-referenced',
        'other',
      ];

      classifications.forEach(classification => {
        const metadata: MicaComplianceMetadata = {
          issuerLegalName: 'Test Company Ltd',
          issuerRegistrationNumber: 'REG123456',
          issuerJurisdiction: 'EU',
          micaTokenClassification: classification,
          tokenPurpose: 'Test purpose',
          kycRequired: false,
          complianceContactEmail: 'compliance@test.com',
        };

        expect(metadata.micaTokenClassification).toBe(classification);
      });
    });

    it('should support optional restrictedJurisdictions array', () => {
      const metadata: MicaComplianceMetadata = {
        issuerLegalName: 'Test Company Ltd',
        issuerRegistrationNumber: 'REG123456',
        issuerJurisdiction: 'EU',
        micaTokenClassification: 'utility',
        tokenPurpose: 'Platform utility token',
        kycRequired: true,
        restrictedJurisdictions: ['US', 'KP', 'IR'],
        complianceContactEmail: 'compliance@test.com',
      };

      expect(metadata.restrictedJurisdictions).toBeDefined();
      expect(Array.isArray(metadata.restrictedJurisdictions)).toBe(true);
      expect(metadata.restrictedJurisdictions).toContain('US');
      expect(metadata.restrictedJurisdictions?.length).toBe(3);
    });

    it('should support optional whitepaperUrl field', () => {
      const metadata: MicaComplianceMetadata = {
        issuerLegalName: 'Test Company Ltd',
        issuerRegistrationNumber: 'REG123456',
        issuerJurisdiction: 'EU',
        micaTokenClassification: 'utility',
        tokenPurpose: 'Platform utility token',
        kycRequired: false,
        complianceContactEmail: 'compliance@test.com',
        whitepaperUrl: 'https://example.com/whitepaper.pdf',
      };

      expect(metadata.whitepaperUrl).toBe('https://example.com/whitepaper.pdf');
    });

    it('should support boolean kycRequired field', () => {
      const withKyc: MicaComplianceMetadata = {
        issuerLegalName: 'Test Company Ltd',
        issuerRegistrationNumber: 'REG123456',
        issuerJurisdiction: 'EU',
        micaTokenClassification: 'asset-referenced',
        tokenPurpose: 'RWA token',
        kycRequired: true,
        complianceContactEmail: 'compliance@test.com',
      };

      const withoutKyc: MicaComplianceMetadata = {
        issuerLegalName: 'Test Company Ltd',
        issuerRegistrationNumber: 'REG123456',
        issuerJurisdiction: 'EU',
        micaTokenClassification: 'utility',
        tokenPurpose: 'Utility token',
        kycRequired: false,
        complianceContactEmail: 'compliance@test.com',
      };

      expect(withKyc.kycRequired).toBe(true);
      expect(withoutKyc.kycRequired).toBe(false);
    });

    it('should handle complete compliance metadata', () => {
      const completeMetadata: MicaComplianceMetadata = {
        issuerLegalName: 'Biatec Tokens Ltd',
        issuerRegistrationNumber: 'EU-REG-2024-001',
        issuerJurisdiction: 'EU',
        regulatoryLicense: 'MICA-LIC-2024-001',
        micaTokenClassification: 'asset-referenced',
        tokenPurpose: 'Real-world asset tokenization for regulated securities',
        kycRequired: true,
        restrictedJurisdictions: ['US', 'CN', 'KP', 'IR', 'SY'],
        complianceContactEmail: 'compliance@biatec.io',
        whitepaperUrl: 'https://biatec.io/whitepaper.pdf',
      };

      expect(completeMetadata.issuerLegalName).toBe('Biatec Tokens Ltd');
      expect(completeMetadata.micaTokenClassification).toBe('asset-referenced');
      expect(completeMetadata.kycRequired).toBe(true);
      expect(completeMetadata.restrictedJurisdictions).toContain('US');
      expect(completeMetadata.whitepaperUrl).toBeDefined();
    });
  });

  describe('Contract Compatibility', () => {
    it('should allow ERC20 deployment with MICA compliance metadata', () => {
      // This represents how frontend might send a deployment request
      // The contract should be compatible with adding compliance metadata
      const request: ERC20DeploymentRequest & { compliance?: MicaComplianceMetadata } = {
        standard: 'ERC20',
        name: 'Compliant Token',
        symbol: 'CMPL',
        decimals: 18,
        totalSupply: '1000000',
        walletAddress: '0x1234567890123456789012345678901234567890',
        compliance: {
          issuerLegalName: 'Compliant Corp',
          issuerRegistrationNumber: 'REG001',
          issuerJurisdiction: 'EU',
          micaTokenClassification: 'utility',
          tokenPurpose: 'Utility token',
          kycRequired: true,
          complianceContactEmail: 'compliance@compliant.com',
        },
      };

      expect(request.standard).toBe('ERC20');
      expect(request.compliance).toBeDefined();
      expect(request.compliance?.kycRequired).toBe(true);
    });

    it('should allow ARC3 deployment with extended metadata', () => {
      const request: ARC3DeploymentRequest = {
        standard: 'ARC3',
        name: 'Extended NFT',
        unitName: 'ENFT',
        total: 1,
        decimals: 0,
        walletAddress: 'TESTADDRESS1234567890TESTADDRESS1234567890TESTADDRESS12',
        metadata: {
          name: 'Extended NFT',
          description: 'NFT with full metadata',
          image: 'ipfs://QmImage',
          image_integrity: 'sha256-integrity',
          image_mimetype: 'image/png',
          external_url: 'https://example.com/nft/1',
          properties: {
            rarity: 'Legendary',
            edition: '1/1',
          },
        },
      };

      expect(request.metadata).toBeDefined();
      expect(request.metadata?.image_integrity).toBeDefined();
      expect(request.metadata?.properties).toBeDefined();
    });
  });
});
