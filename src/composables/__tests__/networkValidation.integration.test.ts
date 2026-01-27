import { describe, it, expect, beforeEach } from 'vitest';
import { NETWORKS, type NetworkId } from '../../composables/useWalletManager';
import { validateTokenParameters } from '../../utils/tokenValidation';

/**
 * Integration tests for network switching combined with token validation
 * These tests verify that token creation validates correctly across different networks
 * with proper compliance requirements
 */

describe('Network Switching with Token Validation Integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('VOI Network Token Validation', () => {
    beforeEach(() => {
      localStorage.setItem('selected_network', 'voi-mainnet');
    });

    it('should validate standard token on VOI mainnet', () => {
      const result = validateTokenParameters({
        name: 'VOI Test Token',
        symbol: 'VTT',
        description: 'A test token for VOI network',
        type: 'FT',
        supply: 1000000,
        decimals: 6,
        standard: 'ASA',
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should require MICA compliance for ARC200 on VOI', () => {
      const result = validateTokenParameters({
        name: 'VOI Compliant Token',
        symbol: 'VCT',
        description: 'An ARC200 token requiring compliance',
        type: 'FT',
        supply: 1000000,
        decimals: 6,
        standard: 'ARC200',
        complianceMetadata: undefined,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === 'complianceMetadata')).toBe(true);
    });

    it('should validate ARC200 with complete compliance metadata on VOI', () => {
      const result = validateTokenParameters({
        name: 'VOI Compliant Token',
        symbol: 'VCT',
        description: 'An ARC200 token with full compliance',
        type: 'FT',
        supply: 1000000,
        decimals: 6,
        standard: 'ARC200',
        complianceMetadata: {
          issuerLegalName: 'VOI Token Company',
          issuerRegistrationNumber: '12345',
          issuerJurisdiction: 'EU',
          micaTokenClassification: 'utility',
          tokenPurpose: 'Utility token for VOI ecosystem',
          complianceContactEmail: 'compliance@voi-token.com',
          kycRequired: true,
        },
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Aramid Network Token Validation', () => {
    beforeEach(() => {
      localStorage.setItem('selected_network', 'aramidmain');
    });

    it('should validate standard token on Aramid mainnet', () => {
      const result = validateTokenParameters({
        name: 'Aramid Test Token',
        symbol: 'ATT',
        description: 'A test token for Aramid network',
        type: 'FT',
        supply: 1000000,
        decimals: 6,
        standard: 'ASA',
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should require MICA compliance for ARC200 on Aramid', () => {
      const result = validateTokenParameters({
        name: 'Aramid Compliant Token',
        symbol: 'ACT',
        description: 'An ARC200 token requiring compliance',
        type: 'FT',
        supply: 1000000,
        decimals: 6,
        standard: 'ARC200',
        complianceMetadata: undefined,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === 'complianceMetadata')).toBe(true);
    });

    it('should validate RWA token with compliance on Aramid', () => {
      const result = validateTokenParameters({
        name: 'Real World Asset Token',
        symbol: 'RWA',
        description: 'A real-world asset token on Aramid',
        type: 'FT',
        supply: 100000,
        decimals: 2,
        standard: 'ARC200',
        isRwaToken: true,
        complianceMetadata: {
          issuerLegalName: 'Aramid RWA Ltd',
          issuerRegistrationNumber: '98765',
          issuerJurisdiction: 'US',
          micaTokenClassification: 'asset-referenced',
          tokenPurpose: 'Represents real estate assets',
          complianceContactEmail: 'compliance@aramid-rwa.com',
          kycRequired: true,
          restrictedJurisdictions: ['KP', 'IR'],
        },
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Cross-Network Token Validation', () => {
    it('should maintain validation across network switches', () => {
      // Start on VOI
      localStorage.setItem('selected_network', 'voi-mainnet');

      const tokenParams = {
        name: 'Cross Network Token',
        symbol: 'CNT',
        description: 'A token that works on multiple networks',
        type: 'FT' as const,
        supply: 1000000,
        decimals: 6,
        standard: 'ARC200',
        complianceMetadata: {
          issuerLegalName: 'Multi-Chain Company',
          issuerRegistrationNumber: '11111',
          issuerJurisdiction: 'SG',
          micaTokenClassification: 'utility' as const,
          tokenPurpose: 'Multi-chain utility token',
          complianceContactEmail: 'compliance@multichain.com',
          kycRequired: false,
        },
      };

      // Validate on VOI
      const voiResult = validateTokenParameters(tokenParams);
      expect(voiResult.isValid).toBe(true);

      // Switch to Aramid
      localStorage.setItem('selected_network', 'aramidmain');

      // Validate on Aramid - should still be valid
      const aramidResult = validateTokenParameters(tokenParams);
      expect(aramidResult.isValid).toBe(true);
    });

    it('should detect invalid parameters regardless of network', () => {
      const invalidParams = {
        name: 'Bad Token',
        symbol: 'A', // Too short
        description: 'Test',
        type: 'FT' as const,
        supply: -100, // Negative
        decimals: 25, // Too high
        standard: 'ASA',
      };

      // Test on VOI
      localStorage.setItem('selected_network', 'voi-mainnet');
      const voiResult = validateTokenParameters(invalidParams);
      expect(voiResult.isValid).toBe(false);
      expect(voiResult.errors.length).toBeGreaterThan(0);

      // Test on Aramid
      localStorage.setItem('selected_network', 'aramidmain');
      const aramidResult = validateTokenParameters(invalidParams);
      expect(aramidResult.isValid).toBe(false);
      expect(aramidResult.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Network Configuration Validation', () => {
    it('should have valid network configurations', () => {
      const networkIds: NetworkId[] = ['voi-mainnet', 'aramidmain', 'dockernet'];

      networkIds.forEach((networkId) => {
        const network = NETWORKS[networkId];
        expect(network).toBeDefined();
        expect(network.algodUrl).toBeTruthy();
        expect(network.genesisId).toBeTruthy();
        expect(network.displayName).toBeTruthy();
      });
    });

    it('should have secure URLs for production networks', () => {
      expect(NETWORKS['voi-mainnet'].algodUrl).toMatch(/^https:\/\//);
      expect(NETWORKS['aramidmain'].algodUrl).toMatch(/^https:\/\//);
    });

    it('should correctly identify testnet vs mainnet', () => {
      expect(NETWORKS['voi-mainnet'].isTestnet).toBe(false);
      expect(NETWORKS['aramidmain'].isTestnet).toBe(false);
      expect(NETWORKS['dockernet'].isTestnet).toBe(true);
    });
  });

  describe('Compliance Requirements by Network', () => {
    it('should enforce MICA compliance for ARC200 on all networks', () => {
      const networks: NetworkId[] = ['voi-mainnet', 'aramidmain', 'dockernet'];

      networks.forEach((networkId) => {
        localStorage.setItem('selected_network', networkId);

        const result = validateTokenParameters({
          name: `Token on ${networkId}`,
          symbol: 'TKN',
          description: 'Test token',
          type: 'FT',
          supply: 1000000,
          decimals: 6,
          standard: 'ARC200',
          complianceMetadata: undefined,
        });

        expect(result.isValid).toBe(false);
        expect(result.errors.some((e) => e.field === 'complianceMetadata')).toBe(true);
      });
    });

    it('should allow standard tokens without compliance on all networks', () => {
      const networks: NetworkId[] = ['voi-mainnet', 'aramidmain', 'dockernet'];

      networks.forEach((networkId) => {
        localStorage.setItem('selected_network', networkId);

        const result = validateTokenParameters({
          name: `Token on ${networkId}`,
          symbol: 'TKN',
          description: 'Standard token without compliance requirements',
          type: 'FT',
          supply: 1000000,
          decimals: 6,
          standard: 'ASA',
        });

        expect(result.isValid).toBe(true);
      });
    });
  });

  describe('Token Parameter Edge Cases', () => {
    it('should validate NFTs with supply of 1', () => {
      const result = validateTokenParameters({
        name: 'Unique NFT',
        symbol: 'UNFT',
        description: 'A unique non-fungible token',
        type: 'NFT',
        supply: 1,
        decimals: undefined,
        standard: 'ARC3NFT',
      });

      expect(result.isValid).toBe(true);
    });

    it('should warn for NFTs with supply > 1', () => {
      const result = validateTokenParameters({
        name: 'Multiple NFT',
        symbol: 'MNFT',
        description: 'An NFT with multiple copies',
        type: 'NFT',
        supply: 100,
        decimals: undefined,
        standard: 'ARC3NFT',
      });

      expect(result.isValid).toBe(true); // Still valid
      expect(result.warnings.some((w) => w.field === 'supply')).toBe(true);
    });

    it('should validate tokens with maximum safe decimals', () => {
      const result = validateTokenParameters({
        name: 'High Precision Token',
        symbol: 'HPT',
        description: 'A token with many decimals',
        type: 'FT',
        supply: 1000000,
        decimals: 12,
        standard: 'ASA',
      });

      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });
  });
});
