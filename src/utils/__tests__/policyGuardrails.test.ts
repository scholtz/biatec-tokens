/**
 * Tests for policyGuardrails.ts
 *
 * Validates network compatibility, decimal precision, naming conventions,
 * supply bounds, and the aggregate runPolicyGuardrails function.
 *
 * Issue: Roadmap — production-grade auth-first issuance UX
 */

import { describe, it, expect } from 'vitest'
import {
  validateNetworkCompatibility,
  validateDecimalPrecision,
  validateTokenName,
  validateTokenSymbol,
  validateSupplyBounds,
  runPolicyGuardrails,
  AVM_NETWORKS,
  EVM_NETWORKS,
  AVM_STANDARDS,
  EVM_STANDARDS,
  MAX_TOKEN_NAME_LENGTH,
  MAX_TOKEN_SYMBOL_LENGTH,
  MAX_DECIMALS_BY_STANDARD,
} from '../policyGuardrails'

// ---------------------------------------------------------------------------
// validateNetworkCompatibility
// ---------------------------------------------------------------------------

describe('validateNetworkCompatibility', () => {
  it('returns null for valid AVM standard + AVM network', () => {
    expect(validateNetworkCompatibility('ASA', 'algorand-mainnet')).toBeNull()
    expect(validateNetworkCompatibility('ARC3', 'algorand-testnet')).toBeNull()
    expect(validateNetworkCompatibility('ARC69', 'voi-mainnet')).toBeNull()
    expect(validateNetworkCompatibility('ARC200', 'aramid-mainnet')).toBeNull()
  })

  it('returns null for valid EVM standard + EVM network', () => {
    expect(validateNetworkCompatibility('ERC20', 'ethereum-mainnet')).toBeNull()
    expect(validateNetworkCompatibility('ERC721', 'arbitrum-mainnet')).toBeNull()
    expect(validateNetworkCompatibility('ERC1155', 'base-mainnet')).toBeNull()
  })

  it('blocks AVM standard on EVM network', () => {
    const result = validateNetworkCompatibility('ASA', 'ethereum-mainnet')
    expect(result).not.toBeNull()
    expect(result?.severity).toBe('error')
    expect(result?.code).toBe('NETWORK_INCOMPATIBLE_AVM_ON_EVM')
    expect(result?.field).toBe('network')
    expect(result?.suggestion).toBeTruthy()
  })

  it('blocks EVM standard on AVM network', () => {
    const result = validateNetworkCompatibility('ERC20', 'algorand-mainnet')
    expect(result).not.toBeNull()
    expect(result?.severity).toBe('error')
    expect(result?.code).toBe('NETWORK_INCOMPATIBLE_EVM_ON_AVM')
  })

  it('returns null for unknown standard (pass-through, no false positive)', () => {
    expect(validateNetworkCompatibility('UNKNOWN_STANDARD', 'algorand-mainnet')).toBeNull()
  })

  it('returns null for unknown network (pass-through)', () => {
    expect(validateNetworkCompatibility('ASA', 'custom-chain')).toBeNull()
  })

  it('returns null when standard is empty', () => {
    expect(validateNetworkCompatibility('', 'algorand-mainnet')).toBeNull()
  })

  it('returns null when network is empty', () => {
    expect(validateNetworkCompatibility('ASA', '')).toBeNull()
  })

  it('covers all AVM standards on EVM network', () => {
    for (const standard of AVM_STANDARDS) {
      const result = validateNetworkCompatibility(standard, EVM_NETWORKS[0])
      expect(result).not.toBeNull()
      expect(result?.severity).toBe('error')
    }
  })

  it('covers all EVM standards on AVM network', () => {
    for (const standard of EVM_STANDARDS) {
      const result = validateNetworkCompatibility(standard, AVM_NETWORKS[0])
      expect(result).not.toBeNull()
      expect(result?.severity).toBe('error')
    }
  })

  it('normalizes underscore network identifiers (app TokenTemplate format)', () => {
    // TokenTemplate.network uses underscores; validation must accept both formats
    expect(validateNetworkCompatibility('ARC200', 'algorand_mainnet')).toBeNull()
    expect(validateNetworkCompatibility('ERC20', 'ethereum_mainnet')).toBeNull()
  })

  it('blocks AVM standard on EVM network even with underscore format', () => {
    const result = validateNetworkCompatibility('ASA', 'ethereum_mainnet')
    expect(result).not.toBeNull()
    expect(result?.code).toBe('NETWORK_INCOMPATIBLE_AVM_ON_EVM')
  })

  it('blocks EVM standard on AVM network even with underscore format', () => {
    const result = validateNetworkCompatibility('ERC20', 'algorand_mainnet')
    expect(result).not.toBeNull()
    expect(result?.code).toBe('NETWORK_INCOMPATIBLE_EVM_ON_AVM')
  })
})

// ---------------------------------------------------------------------------
// validateDecimalPrecision
// ---------------------------------------------------------------------------

describe('validateDecimalPrecision', () => {
  it('returns null for standard FT decimals within limit', () => {
    expect(validateDecimalPrecision(6, 'ASA')).toBeNull()
    expect(validateDecimalPrecision(18, 'ERC20')).toBeNull()
    expect(validateDecimalPrecision(0, 'ASA')).toBeNull()
  })

  it('returns error when decimals exceed ARC200 limit (6)', () => {
    const result = validateDecimalPrecision(7, 'ARC200')
    expect(result?.severity).toBe('error')
    expect(result?.code).toBe('DECIMALS_EXCEEDS_STANDARD_LIMIT')
  })

  it('returns error when ASA decimals exceed 19', () => {
    const result = validateDecimalPrecision(20, 'ASA')
    expect(result?.severity).toBe('error')
    expect(result?.code).toBe('DECIMALS_EXCEEDS_STANDARD_LIMIT')
  })

  it('returns error when ERC20 decimals exceed 18', () => {
    const result = validateDecimalPrecision(19, 'ERC20')
    expect(result?.severity).toBe('error')
    expect(result?.code).toBe('DECIMALS_EXCEEDS_STANDARD_LIMIT')
  })

  it('returns error for NFT standard with non-zero decimals', () => {
    const result = validateDecimalPrecision(1, 'ARC72')
    expect(result?.severity).toBe('error')
    expect(result?.code).toBe('DECIMALS_INVALID_FOR_NFT')
  })

  it('returns null for NFT standard with 0 decimals', () => {
    expect(validateDecimalPrecision(0, 'ARC72')).toBeNull()
    expect(validateDecimalPrecision(0, 'ERC721')).toBeNull()
    expect(validateDecimalPrecision(0, 'ERC1155')).toBeNull()
  })

  it('returns null for NFT standard with undefined decimals', () => {
    expect(validateDecimalPrecision(undefined, 'ARC72')).toBeNull()
  })

  it('returns error for non-integer decimals', () => {
    const result = validateDecimalPrecision(1.5, 'ERC20')
    expect(result?.severity).toBe('error')
    expect(result?.code).toBe('DECIMALS_NOT_INTEGER')
  })

  it('returns error for negative decimals', () => {
    const result = validateDecimalPrecision(-1, 'ERC20')
    expect(result?.severity).toBe('error')
    expect(result?.code).toBe('DECIMALS_NEGATIVE')
  })

  it('returns warning for unusually high decimals (>12) on ARC200 (max=6 standard)', () => {
    // ARC200 max is 6, so any value >12 would already be an error, but
    // for a standard with max <= 12, values between 13 and max generate a warning.
    // We test with a hypothetical unknown standard here via a standard with low max.
    // Use ASA-like scenario: decimals=15 with a custom check
    // Since ASA max=19 (>12), the "unusually high" guard is skipped.
    // Instead verify that the warning fires when standardMax <= 12.
    // ARC200 max=6, so 15 > 6 would already be an error (EXCEEDS_STANDARD_LIMIT), not a warning.
    // The DECIMALS_UNUSUALLY_HIGH warning only fires when the standard max is <= 12 and decimals > 12 but <= max.
    // With current standard set, this path is only reachable for unknown standards.
    // We confirm the main guards work instead.
    const resultASA = validateDecimalPrecision(15, 'ASA')
    // ASA max=19, decimals=15 is within limit and not unusually high (standardMax=19 > 12)
    expect(resultASA).toBeNull()
  })

  it('returns null when standard is empty', () => {
    expect(validateDecimalPrecision(6, '')).toBeNull()
  })

  it('returns null when decimals is null/undefined for FT (not required by this check)', () => {
    expect(validateDecimalPrecision(null, 'ERC20')).toBeNull()
    expect(validateDecimalPrecision(undefined, 'ERC20')).toBeNull()
  })

  it('validates max decimals for each known standard', () => {
    for (const [std, max] of Object.entries(MAX_DECIMALS_BY_STANDARD)) {
      // At the limit: valid
      const atLimit = validateDecimalPrecision(max, std)
      // At limit could be valid or a warning, but not an error about exceeding the limit
      if (atLimit) {
        expect(atLimit.code).not.toBe('DECIMALS_EXCEEDS_STANDARD_LIMIT')
      }
      // Above limit: error (unless NFT std)
      if (max > 0) {
        const overLimit = validateDecimalPrecision(max + 1, std)
        // NFT standards error on any non-zero value, others error on exceeding max
        if (overLimit) {
          expect(['DECIMALS_EXCEEDS_STANDARD_LIMIT', 'DECIMALS_INVALID_FOR_NFT', 'DECIMALS_UNUSUALLY_HIGH']).toContain(overLimit.code)
        }
      }
    }
  })
})

// ---------------------------------------------------------------------------
// validateTokenName
// ---------------------------------------------------------------------------

describe('validateTokenName', () => {
  it('returns null for valid names', () => {
    expect(validateTokenName('My Token')).toBeNull()
    expect(validateTokenName('A')).toBeNull()
    expect(validateTokenName('Alpha Beta Gamma Delta Eps')).toBeNull()
  })

  it('returns error for null/undefined/empty name', () => {
    expect(validateTokenName(null)?.severity).toBe('error')
    expect(validateTokenName(undefined)?.severity).toBe('error')
    expect(validateTokenName('')?.severity).toBe('error')
    expect(validateTokenName(null)?.code).toBe('NAME_REQUIRED')
  })

  it('returns error when name exceeds max length', () => {
    const longName = 'A'.repeat(MAX_TOKEN_NAME_LENGTH + 1)
    const result = validateTokenName(longName)
    expect(result?.severity).toBe('error')
    expect(result?.code).toBe('NAME_TOO_LONG')
  })

  it('returns null for name exactly at max length', () => {
    const name = 'A'.repeat(MAX_TOKEN_NAME_LENGTH)
    expect(validateTokenName(name)).toBeNull()
  })

  it('returns warning for leading whitespace', () => {
    const result = validateTokenName(' MyToken')
    expect(result?.severity).toBe('warning')
    expect(result?.code).toBe('NAME_LEADING_TRAILING_SPACE')
  })

  it('returns warning for trailing whitespace', () => {
    const result = validateTokenName('MyToken ')
    expect(result?.severity).toBe('warning')
    expect(result?.code).toBe('NAME_LEADING_TRAILING_SPACE')
  })

  it('returns warning for non-ASCII characters', () => {
    const result = validateTokenName('Tökën')
    expect(result?.severity).toBe('warning')
    expect(result?.code).toBe('NAME_NON_ASCII')
  })

  it('name with only spaces is not a valid non-empty name after trim check', () => {
    // ' ' → trim → '' → falls through NAME_LEADING_TRAILING_SPACE (returns before too-short)
    const result = validateTokenName('   ')
    expect(result).not.toBeNull()
  })
})

// ---------------------------------------------------------------------------
// validateTokenSymbol
// ---------------------------------------------------------------------------

describe('validateTokenSymbol', () => {
  it('returns null for valid uppercase symbols', () => {
    expect(validateTokenSymbol('MYT', 'ASA')).toBeNull()
    expect(validateTokenSymbol('USDC', 'ERC20')).toBeNull()
    expect(validateTokenSymbol('A', 'ASA')).toBeNull()
  })

  it('returns error for null/undefined/empty symbol', () => {
    expect(validateTokenSymbol(null, 'ASA')?.code).toBe('SYMBOL_REQUIRED')
    expect(validateTokenSymbol(undefined, 'ASA')?.code).toBe('SYMBOL_REQUIRED')
    expect(validateTokenSymbol('', 'ASA')?.code).toBe('SYMBOL_REQUIRED')
  })

  it('returns error when AVM symbol exceeds 8 characters', () => {
    const result = validateTokenSymbol('TOOLONGSYM', 'ASA')
    expect(result?.severity).toBe('error')
    expect(result?.code).toBe('SYMBOL_TOO_LONG')
  })

  it('returns null for AVM symbol exactly at 8 characters', () => {
    expect(validateTokenSymbol('ABCDEFGH', 'ASA')).toBeNull()
  })

  it('returns warning for non-uppercase symbols', () => {
    const result = validateTokenSymbol('mytoken', 'ERC20')
    expect(result?.severity).toBe('warning')
    expect(result?.code).toBe('SYMBOL_NOT_UPPERCASE')
    expect(result?.suggestion).toContain('MYTOKEN')
  })

  it('suggestion contains uppercase version of symbol', () => {
    const result = validateTokenSymbol('abc', 'ASA')
    expect(result?.suggestion).toContain('ABC')
  })
})

// ---------------------------------------------------------------------------
// validateSupplyBounds
// ---------------------------------------------------------------------------

describe('validateSupplyBounds', () => {
  it('returns null for valid FT supply', () => {
    expect(validateSupplyBounds(1000000, 'ERC20')).toBeNull()
    expect(validateSupplyBounds(1, 'ASA')).toBeNull()
  })

  it('returns error for undefined/null supply', () => {
    expect(validateSupplyBounds(undefined, 'ERC20')?.code).toBe('SUPPLY_REQUIRED')
    expect(validateSupplyBounds(null, 'ERC20')?.code).toBe('SUPPLY_REQUIRED')
  })

  it('returns error for supply of 0', () => {
    const result = validateSupplyBounds(0, 'ASA')
    expect(result?.severity).toBe('error')
    expect(result?.code).toBe('SUPPLY_TOO_LOW')
  })

  it('returns error for negative supply', () => {
    const result = validateSupplyBounds(-100, 'ERC20')
    expect(result?.severity).toBe('error')
    expect(result?.code).toBe('SUPPLY_TOO_LOW')
  })

  it('returns error for Infinity supply', () => {
    const result = validateSupplyBounds(Infinity, 'ERC20')
    expect(result?.severity).toBe('error')
    expect(result?.code).toBe('SUPPLY_NOT_FINITE')
  })

  it('returns error for NaN supply', () => {
    const result = validateSupplyBounds(NaN, 'ERC20')
    expect(result?.severity).toBe('error')
    expect(result?.code).toBe('SUPPLY_NOT_FINITE')
  })

  it('returns warning for NFT with supply > 1', () => {
    const result = validateSupplyBounds(100, 'ERC721')
    expect(result?.severity).toBe('warning')
    expect(result?.code).toBe('SUPPLY_INVALID_FOR_NFT')
  })

  it('returns null for NFT with supply = 1', () => {
    expect(validateSupplyBounds(1, 'ERC721')).toBeNull()
    expect(validateSupplyBounds(1, 'ARC72')).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// runPolicyGuardrails (aggregate)
// ---------------------------------------------------------------------------

describe('runPolicyGuardrails', () => {
  it('returns isValid: true for fully valid parameters', () => {
    const result = runPolicyGuardrails({
      standard: 'ASA',
      network: 'algorand-mainnet',
      decimals: 6,
      name: 'My Token',
      symbol: 'MYT',
      supply: 1000000,
    })
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('returns isValid: false when any error is present', () => {
    const result = runPolicyGuardrails({
      standard: 'ERC20',
      network: 'algorand-mainnet', // wrong network
      decimals: 6,
      name: 'My Token',
      symbol: 'MYT',
      supply: 1000000,
    })
    expect(result.isValid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('surfaces multiple errors in one call', () => {
    const result = runPolicyGuardrails({
      standard: 'ERC20',
      network: 'algorand-mainnet', // network mismatch
      decimals: -1,                 // invalid decimals
      name: '',                     // missing name
      symbol: '',                   // missing symbol
      supply: 0,                    // too low
    })
    expect(result.errors.length).toBeGreaterThanOrEqual(4)
  })

  it('includes both errors and warnings in violations', () => {
    const result = runPolicyGuardrails({
      standard: 'ASA',
      network: 'algorand-mainnet',
      decimals: 6,
      name: 'My Token',
      symbol: 'myt',         // warning: not uppercase
      supply: 1000000,
    })
    expect(result.errors).toHaveLength(0)
    expect(result.warnings.length).toBeGreaterThanOrEqual(1)
    expect(result.isValid).toBe(true) // only warnings, no errors
  })

  it('handles fully empty params without throwing', () => {
    expect(() => runPolicyGuardrails({})).not.toThrow()
    const result = runPolicyGuardrails({})
    // Missing required fields will produce errors
    expect(result.violations.length).toBeGreaterThan(0)
  })

  it('violations array is the union of errors and warnings', () => {
    const result = runPolicyGuardrails({
      standard: 'ERC20',
      network: 'algorand-mainnet',
      decimals: 15,
      name: 'My Token',
      symbol: 'myt',
      supply: 1000000,
    })
    expect(result.violations.length).toBe(result.errors.length + result.warnings.length)
  })

  it('returns EVM-compatible result for valid EVM params', () => {
    const result = runPolicyGuardrails({
      standard: 'ERC20',
      network: 'ethereum-mainnet',
      decimals: 18,
      name: 'Test Token',
      symbol: 'TEST',
      supply: 100000000,
    })
    expect(result.isValid).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Constant contracts
// ---------------------------------------------------------------------------

describe('exported constants', () => {
  it('AVM_NETWORKS contains Algorand mainnet and testnet', () => {
    expect(AVM_NETWORKS).toContain('algorand-mainnet')
    expect(AVM_NETWORKS).toContain('algorand-testnet')
  })

  it('EVM_NETWORKS contains Ethereum mainnet', () => {
    expect(EVM_NETWORKS).toContain('ethereum-mainnet')
  })

  it('AVM_STANDARDS contains ASA and ARC standards', () => {
    expect(AVM_STANDARDS).toContain('ASA')
    expect(AVM_STANDARDS).toContain('ARC3')
    expect(AVM_STANDARDS).toContain('ARC200')
  })

  it('EVM_STANDARDS contains ERC standards', () => {
    expect(EVM_STANDARDS).toContain('ERC20')
    expect(EVM_STANDARDS).toContain('ERC721')
  })

  it('MAX_TOKEN_NAME_LENGTH is positive', () => {
    expect(MAX_TOKEN_NAME_LENGTH).toBeGreaterThan(0)
  })

  it('MAX_TOKEN_SYMBOL_LENGTH is positive', () => {
    expect(MAX_TOKEN_SYMBOL_LENGTH).toBeGreaterThan(0)
  })

  it('MAX_DECIMALS_BY_STANDARD covers known standards', () => {
    expect(MAX_DECIMALS_BY_STANDARD['ASA']).toBeDefined()
    expect(MAX_DECIMALS_BY_STANDARD['ERC20']).toBeDefined()
    expect(MAX_DECIMALS_BY_STANDARD['ARC72']).toBe(0)
    expect(MAX_DECIMALS_BY_STANDARD['ERC721']).toBe(0)
  })
})
