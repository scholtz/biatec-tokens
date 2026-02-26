import { describe, it, expect } from 'vitest'
import {
  isAlgorandBasedToken,
  calculateComplianceScore,
  getDefaultNetwork,
  ALGORAND_STANDARDS,
} from './compliance'
import type { Token } from '../stores/tokens'

const makeToken = (overrides: Partial<Token> = {}): Token => ({
  id: 'test-token',
  name: 'Test Token',
  symbol: 'TST',
  standard: 'ASA',
  type: 'FT',
  supply: 1000000,
  decimals: 6,
  description: 'test',
  status: 'draft',
  createdAt: new Date(),
  ...overrides,
})

describe('compliance utils', () => {
  describe('ALGORAND_STANDARDS', () => {
    it('should contain all expected Algorand standards', () => {
      expect(ALGORAND_STANDARDS).toContain('ASA')
      expect(ALGORAND_STANDARDS).toContain('ARC3FT')
      expect(ALGORAND_STANDARDS).toContain('ARC3NFT')
      expect(ALGORAND_STANDARDS).toContain('ARC3FNFT')
      expect(ALGORAND_STANDARDS).toContain('ARC200')
      expect(ALGORAND_STANDARDS).toContain('ARC72')
    })
  })

  describe('isAlgorandBasedToken', () => {
    it('should return true for ASA', () => {
      expect(isAlgorandBasedToken('ASA')).toBe(true)
    })

    it('should return true for ARC3FT', () => {
      expect(isAlgorandBasedToken('ARC3FT')).toBe(true)
    })

    it('should return true for ARC3NFT', () => {
      expect(isAlgorandBasedToken('ARC3NFT')).toBe(true)
    })

    it('should return true for ARC3FNFT', () => {
      expect(isAlgorandBasedToken('ARC3FNFT')).toBe(true)
    })

    it('should return true for ARC200', () => {
      expect(isAlgorandBasedToken('ARC200')).toBe(true)
    })

    it('should return true for ARC72', () => {
      expect(isAlgorandBasedToken('ARC72')).toBe(true)
    })

    it('should return false for ERC20', () => {
      expect(isAlgorandBasedToken('ERC20')).toBe(false)
    })

    it('should return false for ERC721', () => {
      expect(isAlgorandBasedToken('ERC721')).toBe(false)
    })

    it('should return false for an empty string', () => {
      expect(isAlgorandBasedToken('')).toBe(false)
    })

    it('should return false for an unknown standard', () => {
      expect(isAlgorandBasedToken('UNKNOWN')).toBe(false)
    })
  })

  describe('calculateComplianceScore', () => {
    it('should return 0 for a draft token with no attestation', () => {
      const token = makeToken({ status: 'draft' })
      expect(calculateComplianceScore(token)).toBe(0)
    })

    it('should return 20 for a deployed token with no attestation', () => {
      const token = makeToken({ status: 'deployed' })
      expect(calculateComplianceScore(token)).toBe(20)
    })

    it('should return 50 for a deployed token with attestation enabled but no summary', () => {
      const token = makeToken({
        status: 'deployed',
        attestationMetadata: {
          enabled: true,
          complianceSummary: undefined,
        } as any,
      })
      expect(calculateComplianceScore(token)).toBe(50)
    })

    it('should return 50 for a non-deployed token with attestation enabled but no summary', () => {
      const token = makeToken({
        status: 'draft',
        attestationMetadata: {
          enabled: true,
          complianceSummary: undefined,
        } as any,
      })
      expect(calculateComplianceScore(token)).toBe(30)
    })

    it('should return 100 for a fully compliant deployed token', () => {
      const token = makeToken({
        status: 'deployed',
        attestationMetadata: {
          enabled: true,
          complianceSummary: {
            kycCompliant: true,
            accreditedInvestor: true,
            jurisdictionApproved: true,
          },
        } as any,
      })
      expect(calculateComplianceScore(token)).toBe(100)
    })

    it('should return 70 for deployed + attestation + kycCompliant only', () => {
      const token = makeToken({
        status: 'deployed',
        attestationMetadata: {
          enabled: true,
          complianceSummary: {
            kycCompliant: true,
            accreditedInvestor: false,
            jurisdictionApproved: false,
          },
        } as any,
      })
      // 20 (deployed) + 30 (attestation) + 20 (kyc) = 70
      expect(calculateComplianceScore(token)).toBe(70)
    })

    it('should return 65 for deployed + attestation + accreditedInvestor only', () => {
      const token = makeToken({
        status: 'deployed',
        attestationMetadata: {
          enabled: true,
          complianceSummary: {
            kycCompliant: false,
            accreditedInvestor: true,
            jurisdictionApproved: false,
          },
        } as any,
      })
      // 20 (deployed) + 30 (attestation) + 15 (accredited) = 65
      expect(calculateComplianceScore(token)).toBe(65)
    })

    it('should return 65 for deployed + attestation + jurisdictionApproved only', () => {
      const token = makeToken({
        status: 'deployed',
        attestationMetadata: {
          enabled: true,
          complianceSummary: {
            kycCompliant: false,
            accreditedInvestor: false,
            jurisdictionApproved: true,
          },
        } as any,
      })
      // 20 (deployed) + 30 (attestation) + 15 (jurisdiction) = 65
      expect(calculateComplianceScore(token)).toBe(65)
    })

    it('should not exceed 100', () => {
      const token = makeToken({
        status: 'deployed',
        attestationMetadata: {
          enabled: true,
          complianceSummary: {
            kycCompliant: true,
            accreditedInvestor: true,
            jurisdictionApproved: true,
          },
        } as any,
      })
      expect(calculateComplianceScore(token)).toBeLessThanOrEqual(100)
    })

    it('should return 0 for a token with no attestationMetadata', () => {
      const token = makeToken({ status: 'draft', attestationMetadata: undefined })
      expect(calculateComplianceScore(token)).toBe(0)
    })

    it('should return 0 when attestationMetadata.enabled is false', () => {
      const token = makeToken({
        status: 'draft',
        attestationMetadata: {
          enabled: false,
          complianceSummary: {
            kycCompliant: true,
            accreditedInvestor: true,
            jurisdictionApproved: true,
          },
        } as any,
      })
      // enabled=false so no attestation bonus
      expect(calculateComplianceScore(token)).toBe(0)
    })
  })

  describe('getDefaultNetwork', () => {
    it('should return VOI as default network', () => {
      expect(getDefaultNetwork()).toBe('VOI')
    })
  })
})
