import { describe, it, expect } from 'vitest';
import { getAttestationTypeLabel } from './attestation';
import { AttestationType } from '../types/compliance';

describe('Attestation Utilities', () => {
  describe('getAttestationTypeLabel', () => {
    it('should return correct label for KYC_AML', () => {
      const result = getAttestationTypeLabel(AttestationType.KYC_AML);
      expect(result).toBe('KYC/AML Verification');
    });

    it('should return correct label for ACCREDITED_INVESTOR', () => {
      const result = getAttestationTypeLabel(AttestationType.ACCREDITED_INVESTOR);
      expect(result).toBe('Accredited Investor');
    });

    it('should return correct label for JURISDICTION', () => {
      const result = getAttestationTypeLabel(AttestationType.JURISDICTION);
      expect(result).toBe('Jurisdiction Approval');
    });

    it('should return correct label for ISSUER_VERIFICATION', () => {
      const result = getAttestationTypeLabel(AttestationType.ISSUER_VERIFICATION);
      expect(result).toBe('Issuer Verification');
    });

    it('should return correct label for OTHER', () => {
      const result = getAttestationTypeLabel(AttestationType.OTHER);
      expect(result).toBe('Other');
    });

    it('should return the type itself if label not found', () => {
      // Cast to test edge case
      const unknownType = 'unknown_type' as AttestationType;
      const result = getAttestationTypeLabel(unknownType);
      expect(result).toBe('unknown_type');
    });
  });
});
