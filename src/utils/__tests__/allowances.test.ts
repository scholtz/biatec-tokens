import { describe, it, expect, vi } from 'vitest'
import {
  isUnlimitedAllowance,
  formatAllowanceAmount,
  calculateEVMRiskLevel,
  calculateAVMRiskLevel,
  calculateActivityStatus,
  generateAllowanceId,
  getKnownSpenderName,
  formatAddress,
  isValidEthereumAddress,
  getRiskBadgeVariant,
  getActivityBadgeVariant,
  getRiskLevelLabel,
  getActivityStatusLabel,
} from '../allowances'
import { AllowanceRiskLevel, AllowanceActivityStatus } from '../../types/allowances'
import type { NetworkId } from '../../stores/network'

// Threshold is 10^38 = "100000000000000000000000000000000000000"
const UNLIMITED = '100000000000000000000000000000000000000'
const JUST_BELOW = '99999999999999999999999999999999999999'

describe('allowances utilities', () => {
  describe('isUnlimitedAllowance', () => {
    it('returns true for the exact threshold value', () => {
      expect(isUnlimitedAllowance(UNLIMITED)).toBe(true)
    })

    it('returns true for a value above the threshold', () => {
      expect(isUnlimitedAllowance('999999999999999999999999999999999999999')).toBe(true)
    })

    it('returns false for a value just below the threshold', () => {
      expect(isUnlimitedAllowance(JUST_BELOW)).toBe(false)
    })

    it('returns false for zero', () => {
      expect(isUnlimitedAllowance('0')).toBe(false)
    })

    it('returns false for small amounts', () => {
      expect(isUnlimitedAllowance('1000000000000000000')).toBe(false)
    })

    it('returns false for invalid (non-numeric) string', () => {
      expect(isUnlimitedAllowance('not-a-number')).toBe(false)
    })
  })

  describe('formatAllowanceAmount', () => {
    it('returns "Unlimited" for unlimited amounts', () => {
      expect(formatAllowanceAmount(UNLIMITED, 18, 'ETH')).toBe('Unlimited')
    })

    it('formats whole number tokens correctly', () => {
      // 1 token with 6 decimals
      const amount = '1000000' // 10^6
      expect(formatAllowanceAmount(amount, 6, 'USDC')).toBe('1 USDC')
    })

    it('formats fractional tokens correctly', () => {
      // 1.5 tokens with 6 decimals
      const amount = '1500000' // 1.5 * 10^6
      const result = formatAllowanceAmount(amount, 6, 'USDC')
      expect(result).toContain('1')
      expect(result).toContain('5')
      expect(result).toContain('USDC')
    })

    it('handles zero correctly', () => {
      expect(formatAllowanceAmount('0', 18, 'ETH')).toBe('0 ETH')
    })

    it('trims trailing zeros in fractional part', () => {
      // 1.5 with 18 decimals → fractional should trim trailing zeros
      const amount = '1500000000000000000'
      const result = formatAllowanceAmount(amount, 18, 'ETH')
      expect(result).not.toMatch(/0 ETH$/)
      expect(result).toContain('ETH')
    })

    it('returns raw amount with symbol on BigInt parse error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const result = formatAllowanceAmount('not-a-bigint', 18, 'ETH')
      expect(result).toContain('not-a-bigint')
      expect(result).toContain('ETH')
      consoleSpy.mockRestore()
    })
  })

  describe('calculateEVMRiskLevel', () => {
    it('returns CRITICAL for unlimited allowance', () => {
      expect(calculateEVMRiskLevel({ isUnlimited: true })).toBe(AllowanceRiskLevel.CRITICAL)
    })

    it('returns CRITICAL for valueUSD > 10000', () => {
      expect(calculateEVMRiskLevel({ isUnlimited: false, valueUSD: 10001 })).toBe(AllowanceRiskLevel.CRITICAL)
    })

    it('returns HIGH for valueUSD between 1001 and 10000', () => {
      expect(calculateEVMRiskLevel({ isUnlimited: false, valueUSD: 5000 })).toBe(AllowanceRiskLevel.HIGH)
    })

    it('returns MEDIUM for valueUSD between 101 and 1000', () => {
      expect(calculateEVMRiskLevel({ isUnlimited: false, valueUSD: 500 })).toBe(AllowanceRiskLevel.MEDIUM)
    })

    it('returns LOW for valueUSD <= 100', () => {
      expect(calculateEVMRiskLevel({ isUnlimited: false, valueUSD: 50 })).toBe(AllowanceRiskLevel.LOW)
    })

    it('falls back to amount-based heuristic when no USD value', () => {
      // 50000 whole units with 0 decimals → HIGH
      expect(calculateEVMRiskLevel({ isUnlimited: false, allowanceAmount: '50000', tokenDecimals: 0 })).toBe(AllowanceRiskLevel.HIGH)
    })

    it('returns MEDIUM as fallback when no USD value and no amount', () => {
      expect(calculateEVMRiskLevel({})).toBe(AllowanceRiskLevel.MEDIUM)
    })

    it('returns MEDIUM when BigInt parse fails in amount heuristic', () => {
      expect(calculateEVMRiskLevel({ isUnlimited: false, allowanceAmount: 'invalid', tokenDecimals: 18 })).toBe(AllowanceRiskLevel.MEDIUM)
    })
  })

  describe('calculateAVMRiskLevel', () => {
    it('always returns LOW (AVM opt-in is generally safe)', () => {
      expect(calculateAVMRiskLevel({})).toBe(AllowanceRiskLevel.LOW)
      expect(calculateAVMRiskLevel({ assetId: 12345 } as any)).toBe(AllowanceRiskLevel.LOW)
    })
  })

  describe('calculateActivityStatus', () => {
    it('returns UNKNOWN when no date is provided', () => {
      expect(calculateActivityStatus(undefined)).toBe(AllowanceActivityStatus.UNKNOWN)
    })

    it('returns ACTIVE for interaction within 30 days', () => {
      const recent = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
      expect(calculateActivityStatus(recent)).toBe(AllowanceActivityStatus.ACTIVE)
    })

    it('returns INACTIVE for interaction 30–90 days ago', () => {
      const inactive = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) // 60 days ago
      expect(calculateActivityStatus(inactive)).toBe(AllowanceActivityStatus.INACTIVE)
    })

    it('returns DORMANT for interaction more than 90 days ago', () => {
      const dormant = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000) // 100 days ago
      expect(calculateActivityStatus(dormant)).toBe(AllowanceActivityStatus.DORMANT)
    })
  })

  describe('generateAllowanceId', () => {
    it('generates a lowercase string with all parts', () => {
      const id = generateAllowanceId('ethereum' as NetworkId, '0xOwner', '0xSpender', '0xToken')
      expect(id).toBe('ethereum-0xowner-0xspender-0xtoken')
    })

    it('is deterministic', () => {
      const a = generateAllowanceId('base' as NetworkId, 'OWNER', 'SPENDER', 'TOKEN')
      const b = generateAllowanceId('base' as NetworkId, 'OWNER', 'SPENDER', 'TOKEN')
      expect(a).toBe(b)
    })
  })

  describe('getKnownSpenderName', () => {
    it('returns "Uniswap V3 Router" for the known Ethereum Uniswap address', () => {
      const name = getKnownSpenderName('0x68b3465833fb72A70ecdf485E0e4C7bD8665Fc45', 'ethereum' as NetworkId)
      expect(name).toBe('Uniswap V3 Router')
    })

    it('is case-insensitive for known addresses', () => {
      const name = getKnownSpenderName('0x68B3465833FB72A70ECDF485E0E4C7BD8665FC45', 'ethereum' as NetworkId)
      expect(name).toBe('Uniswap V3 Router')
    })

    it('returns undefined for an unknown spender', () => {
      expect(getKnownSpenderName('0x0000000000000000000000000000000000000001', 'ethereum' as NetworkId)).toBeUndefined()
    })

    it('returns undefined for a known address on the wrong network', () => {
      // Uniswap V3 on Ethereum, checked against Arbitrum context
      const name = getKnownSpenderName('0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45', 'voi' as NetworkId)
      expect(name).toBeUndefined()
    })
  })

  describe('formatAddress', () => {
    it('truncates a long address with default lengths', () => {
      const addr = '0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45'
      const result = formatAddress(addr)
      expect(result).toBe('0x68b3...fc45')
    })

    it('returns the address unchanged when it is short', () => {
      expect(formatAddress('0x1234', 6, 4)).toBe('0x1234')
    })

    it('uses custom lengths', () => {
      const addr = '0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45'
      const result = formatAddress(addr, 4, 4)
      expect(result).toBe('0x68...fc45')
    })
  })

  describe('isValidEthereumAddress', () => {
    it('returns true for a valid checksummed Ethereum address', () => {
      expect(isValidEthereumAddress('0x68b3465833fb72A70ecdf485E0e4C7bD8665Fc45')).toBe(true)
    })

    it('returns true for a lowercase Ethereum address', () => {
      expect(isValidEthereumAddress('0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45')).toBe(true)
    })

    it('returns false for missing 0x prefix', () => {
      expect(isValidEthereumAddress('68b3465833fb72a70ecdf485e0e4c7bd8665fc45')).toBe(false)
    })

    it('returns false for address that is too short', () => {
      expect(isValidEthereumAddress('0x1234')).toBe(false)
    })

    it('returns false for address with non-hex characters', () => {
      expect(isValidEthereumAddress('0xGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG')).toBe(false)
    })

    it('returns false for empty string', () => {
      expect(isValidEthereumAddress('')).toBe(false)
    })
  })

  describe('getRiskBadgeVariant', () => {
    it('returns error for CRITICAL', () => {
      expect(getRiskBadgeVariant(AllowanceRiskLevel.CRITICAL)).toBe('error')
    })

    it('returns warning for HIGH', () => {
      expect(getRiskBadgeVariant(AllowanceRiskLevel.HIGH)).toBe('warning')
    })

    it('returns default for MEDIUM', () => {
      expect(getRiskBadgeVariant(AllowanceRiskLevel.MEDIUM)).toBe('default')
    })

    it('returns success for LOW', () => {
      expect(getRiskBadgeVariant(AllowanceRiskLevel.LOW)).toBe('success')
    })
  })

  describe('getActivityBadgeVariant', () => {
    it('returns success for ACTIVE', () => {
      expect(getActivityBadgeVariant(AllowanceActivityStatus.ACTIVE)).toBe('success')
    })

    it('returns warning for INACTIVE', () => {
      expect(getActivityBadgeVariant(AllowanceActivityStatus.INACTIVE)).toBe('warning')
    })

    it('returns default for DORMANT', () => {
      expect(getActivityBadgeVariant(AllowanceActivityStatus.DORMANT)).toBe('default')
    })

    it('returns default for UNKNOWN', () => {
      expect(getActivityBadgeVariant(AllowanceActivityStatus.UNKNOWN)).toBe('default')
    })
  })

  describe('getRiskLevelLabel', () => {
    it('returns "Critical Risk" for CRITICAL', () => {
      expect(getRiskLevelLabel(AllowanceRiskLevel.CRITICAL)).toBe('Critical Risk')
    })

    it('returns "High Risk" for HIGH', () => {
      expect(getRiskLevelLabel(AllowanceRiskLevel.HIGH)).toBe('High Risk')
    })

    it('returns "Medium Risk" for MEDIUM', () => {
      expect(getRiskLevelLabel(AllowanceRiskLevel.MEDIUM)).toBe('Medium Risk')
    })

    it('returns "Low Risk" for LOW', () => {
      expect(getRiskLevelLabel(AllowanceRiskLevel.LOW)).toBe('Low Risk')
    })
  })

  describe('getActivityStatusLabel', () => {
    it('returns "Recently Used" for ACTIVE', () => {
      expect(getActivityStatusLabel(AllowanceActivityStatus.ACTIVE)).toBe('Recently Used')
    })

    it('returns a label containing day range for INACTIVE', () => {
      expect(getActivityStatusLabel(AllowanceActivityStatus.INACTIVE)).toContain('30')
    })

    it('returns a label mentioning dormant or >90 days for DORMANT', () => {
      const label = getActivityStatusLabel(AllowanceActivityStatus.DORMANT)
      expect(label.toLowerCase()).toContain('dormant')
    })

    it('returns "Unknown" for UNKNOWN', () => {
      expect(getActivityStatusLabel(AllowanceActivityStatus.UNKNOWN)).toBe('Unknown')
    })
  })
})
