import { describe, it, expect } from 'vitest'
import { AttestationType } from '../../types/compliance'
import { getAttestationTypeLabel } from '../attestation'

describe('getAttestationTypeLabel', () => {
  it('returns correct label for KYC_AML', () => {
    expect(getAttestationTypeLabel(AttestationType.KYC_AML)).toBe('KYC/AML Verification')
  })

  it('returns correct label for ACCREDITED_INVESTOR', () => {
    expect(getAttestationTypeLabel(AttestationType.ACCREDITED_INVESTOR)).toBe('Accredited Investor')
  })

  it('returns correct label for JURISDICTION', () => {
    expect(getAttestationTypeLabel(AttestationType.JURISDICTION)).toBe('Jurisdiction Approval')
  })

  it('returns correct label for ISSUER_VERIFICATION', () => {
    expect(getAttestationTypeLabel(AttestationType.ISSUER_VERIFICATION)).toBe('Issuer Verification')
  })

  it('returns correct label for OTHER', () => {
    expect(getAttestationTypeLabel(AttestationType.OTHER)).toBe('Other')
  })

  it('covers all AttestationType enum values', () => {
    const allTypes = Object.values(AttestationType)
    for (const type of allTypes) {
      const label = getAttestationTypeLabel(type)
      expect(typeof label).toBe('string')
      expect(label.length).toBeGreaterThan(0)
    }
  })

  it('returns the raw type value as fallback for unknown types', () => {
    // Test the fallback branch where `labels[type]` is undefined
    const unknown = 'unknown_type' as AttestationType
    expect(getAttestationTypeLabel(unknown)).toBe('unknown_type')
  })
})
