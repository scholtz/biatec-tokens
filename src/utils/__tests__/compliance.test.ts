import { describe, it, expect } from 'vitest'
import { isAlgorandBasedToken, calculateComplianceScore, getDefaultNetwork, ALGORAND_STANDARDS } from '../compliance'
import type { Token } from '../../stores/tokens'

function makeToken(overrides: Partial<Token> = {}): Token {
  return {
    id: 'token-1',
    name: 'Test Token',
    symbol: 'TEST',
    standard: 'ASA',
    type: 'FT',
    supply: 1000,
    description: 'Test',
    status: 'created',
    createdAt: new Date(),
    ...overrides,
  }
}

describe('compliance utilities', () => {
  describe('ALGORAND_STANDARDS', () => {
    it('contains the expected Algorand-compatible standards', () => {
      expect(ALGORAND_STANDARDS).toContain('ASA')
      expect(ALGORAND_STANDARDS).toContain('ARC200')
      expect(ALGORAND_STANDARDS).toContain('ARC72')
    })

    it('does not contain EVM standards', () => {
      expect(ALGORAND_STANDARDS).not.toContain('ERC20')
      expect(ALGORAND_STANDARDS).not.toContain('ERC721')
    })
  })

  describe('isAlgorandBasedToken', () => {
    it('returns true for ASA', () => {
      expect(isAlgorandBasedToken('ASA')).toBe(true)
    })

    it('returns true for ARC200', () => {
      expect(isAlgorandBasedToken('ARC200')).toBe(true)
    })

    it('returns true for ARC72', () => {
      expect(isAlgorandBasedToken('ARC72')).toBe(true)
    })

    it('returns true for ARC3FT', () => {
      expect(isAlgorandBasedToken('ARC3FT')).toBe(true)
    })

    it('returns true for ARC3NFT', () => {
      expect(isAlgorandBasedToken('ARC3NFT')).toBe(true)
    })

    it('returns true for ARC3FNFT', () => {
      expect(isAlgorandBasedToken('ARC3FNFT')).toBe(true)
    })

    it('returns false for ERC20', () => {
      expect(isAlgorandBasedToken('ERC20')).toBe(false)
    })

    it('returns false for ERC721', () => {
      expect(isAlgorandBasedToken('ERC721')).toBe(false)
    })

    it('returns false for empty string', () => {
      expect(isAlgorandBasedToken('')).toBe(false)
    })

    it('returns false for an unrecognised string', () => {
      expect(isAlgorandBasedToken('UNKNOWN')).toBe(false)
    })
  })

  describe('calculateComplianceScore', () => {
    it('returns 0 for a token with no attestation and status "created"', () => {
      const token = makeToken({ status: 'created' })
      expect(calculateComplianceScore(token)).toBe(0)
    })

    it('returns 20 for a deployed token with no attestation', () => {
      const token = makeToken({ status: 'deployed' })
      expect(calculateComplianceScore(token)).toBe(20)
    })

    it('returns 50 for deployed + attestation enabled (no compliance summary)', () => {
      const token = makeToken({
        status: 'deployed',
        attestationMetadata: {
          enabled: true,
          attestations: [],
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
      })
      expect(calculateComplianceScore(token)).toBe(50)
    })

    it('returns 70 for deployed + attestation + kycCompliant', () => {
      const token = makeToken({
        status: 'deployed',
        attestationMetadata: {
          enabled: true,
          attestations: [],
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
          complianceSummary: {
            kycCompliant: true,
            accreditedInvestor: false,
            jurisdictionApproved: false,
            overallStatus: 'partial',
          },
        },
      })
      expect(calculateComplianceScore(token)).toBe(70)
    })

    it('returns 100 for all compliance flags set', () => {
      const token = makeToken({
        status: 'deployed',
        attestationMetadata: {
          enabled: true,
          attestations: [],
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
          complianceSummary: {
            kycCompliant: true,
            accreditedInvestor: true,
            jurisdictionApproved: true,
            overallStatus: 'compliant',
          },
        },
      })
      expect(calculateComplianceScore(token)).toBe(100)
    })

    it('returns at most 100 even if somehow all flags are beyond cap', () => {
      const token = makeToken({
        status: 'deployed',
        attestationMetadata: {
          enabled: true,
          attestations: [],
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
          complianceSummary: {
            kycCompliant: true,
            accreditedInvestor: true,
            jurisdictionApproved: true,
            overallStatus: 'compliant',
          },
        },
      })
      const score = calculateComplianceScore(token)
      expect(score).toBeLessThanOrEqual(100)
    })

    it('returns 0 for failing token with attestation disabled', () => {
      const token = makeToken({
        status: 'failed',
        attestationMetadata: {
          enabled: false,
          attestations: [],
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
      })
      expect(calculateComplianceScore(token)).toBe(0)
    })

    it('scores non-deployed token with attestation enabled as 30', () => {
      const token = makeToken({
        status: 'created',
        attestationMetadata: {
          enabled: true,
          attestations: [],
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
      })
      expect(calculateComplianceScore(token)).toBe(30)
    })
  })

  describe('getDefaultNetwork', () => {
    it('returns VOI', () => {
      expect(getDefaultNetwork()).toBe('VOI')
    })
  })
})
