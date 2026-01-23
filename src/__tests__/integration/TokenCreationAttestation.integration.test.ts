import { describe, it, expect, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useTokenStore } from '../../stores/tokens';
import { AttestationType } from '../../types/compliance';
import type { WalletAttestation, TokenAttestationMetadata } from '../../types/compliance';

describe('Token Creation with Attestations Integration', () => {
  let pinia: any;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
  });

  describe('Token Store Attestation Support', () => {
    it('should create token without attestations (default flow)', () => {
      const tokenStore = useTokenStore();
      const initialCount = tokenStore.tokens.length;

      tokenStore.createToken({
        name: 'Test Token',
        symbol: 'TST',
        standard: 'ARC200',
        type: 'FT',
        supply: 1000000,
        decimals: 6,
        description: 'Test token description',
      });

      expect(tokenStore.tokens.length).toBe(initialCount + 1);
      const createdToken = tokenStore.tokens[tokenStore.tokens.length - 1];
      expect(createdToken.name).toBe('Test Token');
      expect(createdToken.symbol).toBe('TST');
      expect(createdToken.attestationMetadata).toBeUndefined();
    });

    it('should create token with attestation metadata', () => {
      const tokenStore = useTokenStore();
      const initialCount = tokenStore.tokens.length;

      const attestations: WalletAttestation[] = [{
        id: 'att-1',
        type: AttestationType.KYC_AML,
        proofHash: '0x1234567890abcdef',
        status: 'pending',
        metadata: {
          createdAt: new Date().toISOString(),
        },
      }];

      const attestationMetadata: TokenAttestationMetadata = {
        enabled: true,
        attestations,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        complianceSummary: {
          kycCompliant: true,
          accreditedInvestor: false,
          jurisdictionApproved: false,
          overallStatus: 'partial',
        },
      };

      tokenStore.createToken({
        name: 'Compliance Token',
        symbol: 'CPL',
        standard: 'ARC200',
        type: 'FT',
        supply: 1000000,
        decimals: 6,
        description: 'Token with attestations',
        attestationMetadata,
      });

      expect(tokenStore.tokens.length).toBe(initialCount + 1);
      const createdToken = tokenStore.tokens[tokenStore.tokens.length - 1];
      expect(createdToken.name).toBe('Compliance Token');
      expect(createdToken.attestationMetadata).toBeDefined();
      expect(createdToken.attestationMetadata?.enabled).toBe(true);
      expect(createdToken.attestationMetadata?.attestations).toHaveLength(1);
      expect(createdToken.attestationMetadata?.attestations[0].type).toBe(AttestationType.KYC_AML);
    });

    it('should handle multiple attestations', () => {
      const tokenStore = useTokenStore();

      const attestations: WalletAttestation[] = [
        {
          id: 'att-1',
          type: AttestationType.KYC_AML,
          proofHash: '0xkyc123',
          status: 'pending',
        },
        {
          id: 'att-2',
          type: AttestationType.ACCREDITED_INVESTOR,
          proofHash: '0xinvestor456',
          status: 'pending',
        },
        {
          id: 'att-3',
          type: AttestationType.JURISDICTION,
          proofHash: '0xjurisdiction789',
          status: 'pending',
        },
      ];

      const attestationMetadata: TokenAttestationMetadata = {
        enabled: true,
        attestations,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        complianceSummary: {
          kycCompliant: true,
          accreditedInvestor: true,
          jurisdictionApproved: true,
          overallStatus: 'compliant',
        },
      };

      tokenStore.createToken({
        name: 'Multi-Attestation Token',
        symbol: 'MAT',
        standard: 'ARC200',
        type: 'FT',
        supply: 1000000,
        decimals: 6,
        description: 'Token with multiple attestations',
        attestationMetadata,
      });

      const createdToken = tokenStore.tokens[tokenStore.tokens.length - 1];
      expect(createdToken.attestationMetadata?.attestations).toHaveLength(3);
      expect(createdToken.attestationMetadata?.complianceSummary?.kycCompliant).toBe(true);
      expect(createdToken.attestationMetadata?.complianceSummary?.accreditedInvestor).toBe(true);
      expect(createdToken.attestationMetadata?.complianceSummary?.jurisdictionApproved).toBe(true);
      expect(createdToken.attestationMetadata?.complianceSummary?.overallStatus).toBe('compliant');
    });

    it('should handle tokens with verification status', () => {
      const tokenStore = useTokenStore();

      const attestations: WalletAttestation[] = [{
        id: 'att-1',
        type: AttestationType.KYC_AML,
        proofHash: '0xverified123',
        status: 'verified',
        verifiedBy: 'compliance-officer@example.com',
        verifiedAt: '2024-01-15T10:00:00Z',
        metadata: {
          createdAt: new Date().toISOString(),
        },
      }];

      const attestationMetadata: TokenAttestationMetadata = {
        enabled: true,
        attestations,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        complianceSummary: {
          kycCompliant: true,
          accreditedInvestor: false,
          jurisdictionApproved: false,
          overallStatus: 'partial',
        },
      };

      tokenStore.createToken({
        name: 'Verified Token',
        symbol: 'VER',
        standard: 'ARC200',
        type: 'FT',
        supply: 1000000,
        decimals: 6,
        description: 'Token with verified attestation',
        attestationMetadata,
      });

      const createdToken = tokenStore.tokens[tokenStore.tokens.length - 1];
      expect(createdToken.attestationMetadata?.attestations[0].status).toBe('verified');
      expect(createdToken.attestationMetadata?.attestations[0].verifiedBy).toBe('compliance-officer@example.com');
      expect(createdToken.attestationMetadata?.attestations[0].verifiedAt).toBe('2024-01-15T10:00:00Z');
    });

    it('should handle attestations with documents', () => {
      const tokenStore = useTokenStore();

      const attestations: WalletAttestation[] = [{
        id: 'att-1',
        type: AttestationType.KYC_AML,
        proofHash: '0xdoc123',
        documentUrl: 'https://ipfs.io/ipfs/QmXxx',
        status: 'pending',
        notes: 'KYC documents uploaded',
      }];

      const attestationMetadata: TokenAttestationMetadata = {
        enabled: true,
        attestations,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      tokenStore.createToken({
        name: 'Document Token',
        symbol: 'DOC',
        standard: 'ARC200',
        type: 'FT',
        supply: 1000000,
        decimals: 6,
        description: 'Token with document attestation',
        attestationMetadata,
      });

      const createdToken = tokenStore.tokens[tokenStore.tokens.length - 1];
      expect(createdToken.attestationMetadata?.attestations[0].documentUrl).toBe('https://ipfs.io/ipfs/QmXxx');
      expect(createdToken.attestationMetadata?.attestations[0].notes).toBe('KYC documents uploaded');
    });
  });

  describe('Backward Compatibility', () => {
    it('should handle tokens without attestation metadata', () => {
      const tokenStore = useTokenStore();

      // Create a token without attestation metadata (old format)
      tokenStore.createToken({
        name: 'Old Token',
        symbol: 'OLD',
        standard: 'ARC200',
        type: 'FT',
        supply: 1000000,
        decimals: 6,
        description: 'Old format token',
      });

      const createdToken = tokenStore.tokens[tokenStore.tokens.length - 1];
      expect(createdToken).toBeDefined();
      expect(createdToken.attestationMetadata).toBeUndefined();
      expect(createdToken.name).toBe('Old Token');
    });

    it('should handle undefined and null attestation metadata', () => {
      const tokenStore = useTokenStore();

      tokenStore.createToken({
        name: 'No Attestation',
        symbol: 'NA',
        standard: 'ARC200',
        type: 'FT',
        supply: 1000000,
        description: 'Token without attestations',
        attestationMetadata: undefined,
      });

      const createdToken = tokenStore.tokens[tokenStore.tokens.length - 1];
      expect(createdToken.attestationMetadata).toBeUndefined();
    });

    it('should handle disabled attestation metadata', () => {
      const tokenStore = useTokenStore();

      const attestationMetadata: TokenAttestationMetadata = {
        enabled: false,
        attestations: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      tokenStore.createToken({
        name: 'Disabled Attestation',
        symbol: 'DA',
        standard: 'ARC200',
        type: 'FT',
        supply: 1000000,
        description: 'Token with disabled attestations',
        attestationMetadata,
      });

      const createdToken = tokenStore.tokens[tokenStore.tokens.length - 1];
      expect(createdToken.attestationMetadata?.enabled).toBe(false);
      expect(createdToken.attestationMetadata?.attestations).toHaveLength(0);
    });
  });

  describe('Compliance Summary Calculation', () => {
    it('should calculate partial status for single attestation', () => {
      const tokenStore = useTokenStore();

      const attestations: WalletAttestation[] = [{
        id: 'att-1',
        type: AttestationType.KYC_AML,
        proofHash: '0xtest',
        status: 'pending',
      }];

      const attestationMetadata: TokenAttestationMetadata = {
        enabled: true,
        attestations,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        complianceSummary: {
          kycCompliant: true,
          accreditedInvestor: false,
          jurisdictionApproved: false,
          overallStatus: 'partial',
        },
      };

      tokenStore.createToken({
        name: 'Partial Compliance',
        symbol: 'PC',
        standard: 'ARC200',
        type: 'FT',
        supply: 1000000,
        description: 'Partially compliant token',
        attestationMetadata,
      });

      const createdToken = tokenStore.tokens[tokenStore.tokens.length - 1];
      expect(createdToken.attestationMetadata?.complianceSummary?.overallStatus).toBe('partial');
    });

    it('should calculate compliant status for multiple attestations', () => {
      const tokenStore = useTokenStore();

      const attestations: WalletAttestation[] = [
        {
          id: 'att-1',
          type: AttestationType.KYC_AML,
          proofHash: '0xkyc',
          status: 'pending',
        },
        {
          id: 'att-2',
          type: AttestationType.ACCREDITED_INVESTOR,
          proofHash: '0xinvestor',
          status: 'pending',
        },
      ];

      const attestationMetadata: TokenAttestationMetadata = {
        enabled: true,
        attestations,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        complianceSummary: {
          kycCompliant: true,
          accreditedInvestor: true,
          jurisdictionApproved: false,
          overallStatus: 'compliant',
        },
      };

      tokenStore.createToken({
        name: 'Fully Compliant',
        symbol: 'FC',
        standard: 'ARC200',
        type: 'FT',
        supply: 1000000,
        description: 'Fully compliant token',
        attestationMetadata,
      });

      const createdToken = tokenStore.tokens[tokenStore.tokens.length - 1];
      expect(createdToken.attestationMetadata?.complianceSummary?.overallStatus).toBe('compliant');
    });

    it('should handle empty attestations array', () => {
      const tokenStore = useTokenStore();

      const attestationMetadata: TokenAttestationMetadata = {
        enabled: true,
        attestations: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        complianceSummary: {
          kycCompliant: false,
          accreditedInvestor: false,
          jurisdictionApproved: false,
          overallStatus: 'non_compliant',
        },
      };

      tokenStore.createToken({
        name: 'Non Compliant',
        symbol: 'NC',
        standard: 'ARC200',
        type: 'FT',
        supply: 1000000,
        description: 'Non-compliant token',
        attestationMetadata,
      });

      const createdToken = tokenStore.tokens[tokenStore.tokens.length - 1];
      expect(createdToken.attestationMetadata?.attestations).toHaveLength(0);
      expect(createdToken.attestationMetadata?.complianceSummary?.overallStatus).toBe('non_compliant');
    });
  });
});
