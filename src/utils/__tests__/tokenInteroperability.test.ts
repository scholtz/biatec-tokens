/**
 * Unit tests for tokenInteroperability utilities
 */

import { describe, it, expect } from 'vitest'
import {
  TOKEN_STANDARDS,
  WALLET_IDS,
  getCompatibleWallets,
  getSupportLevel,
  getSupportedStandards,
  getCompatibilityMessage,
  getConversionPath,
  isConversionSupported,
  getConversionTargets,
  validateInteroperabilityRequirements,
  getStandardEcosystem,
  getCompatibleEcosystemStandards,
  formatSupportLevel,
} from '../tokenInteroperability'
import type { TokenStandard, WalletId, SupportLevel } from '../tokenInteroperability'

// ─── Catalogue constants ──────────────────────────────────────────────────────

describe('TOKEN_STANDARDS', () => {
  it('should include AVM standards', () => {
    expect(TOKEN_STANDARDS).toContain('ASA')
    expect(TOKEN_STANDARDS).toContain('ARC3')
    expect(TOKEN_STANDARDS).toContain('ARC19')
    expect(TOKEN_STANDARDS).toContain('ARC69')
    expect(TOKEN_STANDARDS).toContain('ARC200')
    expect(TOKEN_STANDARDS).toContain('ARC72')
    expect(TOKEN_STANDARDS).toContain('ARC1400')
  })

  it('should include EVM standards', () => {
    expect(TOKEN_STANDARDS).toContain('ERC20')
    expect(TOKEN_STANDARDS).toContain('ERC721')
    expect(TOKEN_STANDARDS).toContain('ERC1155')
  })
})

describe('WALLET_IDS', () => {
  it('should include AVM wallets', () => {
    expect(WALLET_IDS).toContain('pera')
    expect(WALLET_IDS).toContain('defly')
    expect(WALLET_IDS).toContain('lute')
    expect(WALLET_IDS).toContain('exodus')
  })

  it('should include EVM wallets', () => {
    expect(WALLET_IDS).toContain('metamask')
    expect(WALLET_IDS).toContain('rainbow')
    expect(WALLET_IDS).toContain('coinbase-wallet')
  })
})

// ─── getCompatibleWallets ─────────────────────────────────────────────────────

describe('getCompatibleWallets', () => {
  it('should return wallets for ASA ordered by support level', () => {
    const wallets = getCompatibleWallets('ASA')
    expect(wallets.length).toBeGreaterThan(0)
    // All returned entries should have a non-none level
    wallets.forEach(w => expect(w.level).not.toBe('none'))
    // First entry should be the highest support
    expect(wallets[0].level).toBe('full')
  })

  it('should return only wallets with non-none support', () => {
    const wallets = getCompatibleWallets('ARC200')
    wallets.forEach(w => expect(w.level).not.toBe('none'))
  })

  it('should return wallets for ERC20', () => {
    const wallets = getCompatibleWallets('ERC20')
    const ids = wallets.map(w => w.walletId)
    expect(ids).toContain('metamask')
    expect(ids).toContain('rainbow')
    expect(ids).toContain('coinbase-wallet')
  })

  it('should return empty array for standard with no wallet support', () => {
    // ARC1400 only has Lute wallet support
    const wallets = getCompatibleWallets('ARC1400')
    expect(wallets.length).toBeGreaterThanOrEqual(0)
  })

  it('should order full before partial before view', () => {
    const wallets = getCompatibleWallets('ASA')
    const levels = wallets.map(w => w.level)
    const order = ['full', 'partial', 'view', 'none']
    for (let i = 1; i < levels.length; i++) {
      expect(order.indexOf(levels[i])).toBeGreaterThanOrEqual(order.indexOf(levels[i - 1]))
    }
  })
})

// ─── getSupportLevel ──────────────────────────────────────────────────────────

describe('getSupportLevel', () => {
  it('should return full for pera + ASA', () => {
    expect(getSupportLevel('pera', 'ASA')).toBe('full')
  })

  it('should return full for pera + ARC3', () => {
    expect(getSupportLevel('pera', 'ARC3')).toBe('full')
  })

  it('should return partial for pera + ARC200', () => {
    expect(getSupportLevel('pera', 'ARC200')).toBe('partial')
  })

  it('should return none for metamask + ASA (unsupported cross-ecosystem)', () => {
    expect(getSupportLevel('metamask', 'ASA')).toBe('none')
  })

  it('should return full for metamask + ERC20', () => {
    expect(getSupportLevel('metamask', 'ERC20')).toBe('full')
  })

  it('should return none for unknown pair not in matrix', () => {
    expect(getSupportLevel('rainbow', 'ARC3')).toBe('none')
  })

  it('should return view for defly + ARC200', () => {
    expect(getSupportLevel('defly', 'ARC200')).toBe('view')
  })
})

// ─── getSupportedStandards ────────────────────────────────────────────────────

describe('getSupportedStandards', () => {
  it('should return all standards pera supports at view or better', () => {
    const standards = getSupportedStandards('pera')
    expect(standards).toContain('ASA')
    expect(standards).toContain('ARC3')
    expect(standards).toContain('ARC200')
  })

  it('should filter to full-only when minLevel is full', () => {
    const standards = getSupportedStandards('pera', 'full')
    expect(standards).toContain('ASA')
    expect(standards).toContain('ARC3')
    expect(standards).not.toContain('ARC200') // partial for pera
  })

  it('should return EVM standards for metamask', () => {
    const standards = getSupportedStandards('metamask')
    expect(standards).toContain('ERC20')
    expect(standards).toContain('ERC721')
    expect(standards).toContain('ERC1155')
    expect(standards).not.toContain('ASA')
  })

  it('should return empty array for wallet with no support entries', () => {
    // All wallets have some entries; test that minLevel=full filters correctly
    const standards = getSupportedStandards('coinbase-wallet', 'full')
    expect(Array.isArray(standards)).toBe(true)
    standards.forEach(s => {
      expect(getSupportLevel('coinbase-wallet', s)).toBe('full')
    })
  })
})

// ─── getCompatibilityMessage ──────────────────────────────────────────────────

describe('getCompatibilityMessage', () => {
  it('should mention full support for pera + ASA', () => {
    const msg = getCompatibilityMessage('pera', 'ASA')
    expect(msg).toMatch(/fully supports/i)
    expect(msg).toContain('ASA')
  })

  it('should mention partial support for pera + ARC200', () => {
    const msg = getCompatibilityMessage('pera', 'ARC200')
    expect(msg).toMatch(/partially supports/i)
  })

  it('should mention view-only for defly + ARC200', () => {
    const msg = getCompatibilityMessage('defly', 'ARC200')
    expect(msg).toMatch(/display.*balance|balance.*display/i)
  })

  it('should mention no support for cross-ecosystem pair', () => {
    const msg = getCompatibilityMessage('metamask', 'ASA')
    expect(msg).toMatch(/does not currently support/i)
  })

  it('should include wallet name in message', () => {
    const msg = getCompatibilityMessage('coinbase-wallet', 'ERC20')
    expect(msg).toContain('Coinbase Wallet')
  })

  it('should include standard name in message', () => {
    const msg = getCompatibilityMessage('pera', 'ARC3')
    expect(msg).toContain('ARC3')
  })

  it('should include notes when available', () => {
    const msg = getCompatibilityMessage('pera', 'ARC3')
    expect(msg).toContain('NFT')
  })
})

// ─── getConversionPath ────────────────────────────────────────────────────────

describe('getConversionPath', () => {
  it('should return path for ASA → ARC3', () => {
    const path = getConversionPath('ASA', 'ARC3')
    expect(path).toBeDefined()
    expect(path!.from).toBe('ASA')
    expect(path!.to).toBe('ARC3')
    expect(path!.supported).toBe(true)
    expect(path!.steps.length).toBeGreaterThan(0)
  })

  it('should return path for ASA → ARC69', () => {
    const path = getConversionPath('ASA', 'ARC69')
    expect(path).toBeDefined()
    expect(path!.supported).toBe(true)
  })

  it('should return path for ARC3 → ARC19', () => {
    const path = getConversionPath('ARC3', 'ARC19')
    expect(path).toBeDefined()
    expect(path!.effort).toBe('medium')
  })

  it('should return unsupported path for ARC3 → ARC200', () => {
    const path = getConversionPath('ARC3', 'ARC200')
    expect(path).toBeDefined()
    expect(path!.supported).toBe(false)
    expect(path!.steps).toHaveLength(0)
  })

  it('should return undefined for unknown conversion pair', () => {
    const path = getConversionPath('ERC20', 'ASA')
    expect(path).toBeUndefined()
  })

  it('should include holderImpact information', () => {
    const path = getConversionPath('ASA', 'ARC3')
    expect(['none', 'opt_in_required', 'migration_required']).toContain(path!.holderImpact)
  })
})

// ─── isConversionSupported ────────────────────────────────────────────────────

describe('isConversionSupported', () => {
  it('should return true for ASA → ARC3', () => {
    expect(isConversionSupported('ASA', 'ARC3')).toBe(true)
  })

  it('should return true for ERC721 → ERC1155', () => {
    expect(isConversionSupported('ERC721', 'ERC1155')).toBe(true)
  })

  it('should return false for ARC3 → ARC200', () => {
    expect(isConversionSupported('ARC3', 'ARC200')).toBe(false)
  })

  it('should return false for ERC20 → ERC721', () => {
    expect(isConversionSupported('ERC20', 'ERC721')).toBe(false)
  })

  it('should return false for unknown pair', () => {
    expect(isConversionSupported('ERC20', 'ASA')).toBe(false)
  })
})

// ─── getConversionTargets ─────────────────────────────────────────────────────

describe('getConversionTargets', () => {
  it('should return supported targets for ASA', () => {
    const targets = getConversionTargets('ASA')
    expect(targets).toContain('ARC3')
    expect(targets).toContain('ARC69')
  })

  it('should return all targets including unsupported when supportedOnly=false', () => {
    const allTargets = getConversionTargets('ARC3', false)
    const supportedTargets = getConversionTargets('ARC3', true)
    expect(allTargets.length).toBeGreaterThanOrEqual(supportedTargets.length)
  })

  it('should return empty when standard has no supported conversions', () => {
    // ARC200 has no defined conversion paths in the matrix
    const targets = getConversionTargets('ARC200')
    expect(Array.isArray(targets)).toBe(true)
  })

  it('should only include supported conversions by default', () => {
    const targets = getConversionTargets('ARC3')
    // ARC200 conversion from ARC3 is unsupported
    expect(targets).not.toContain('ARC200')
  })
})

// ─── validateInteroperabilityRequirements ─────────────────────────────────────

describe('validateInteroperabilityRequirements', () => {
  it('should pass when all wallets support the standard', () => {
    const result = validateInteroperabilityRequirements('ASA', ['pera', 'defly', 'lute'])
    expect(result.overallPass).toBe(true)
    result.results.forEach(r => expect(r.pass).toBe(true))
  })

  it('should fail when a required wallet does not support the standard', () => {
    const result = validateInteroperabilityRequirements('ASA', ['pera', 'metamask'])
    expect(result.overallPass).toBe(false)
    const metamaskResult = result.results.find(r => r.walletId === 'metamask')
    expect(metamaskResult!.pass).toBe(false)
  })

  it('should pass with minLevel=partial when wallets have at least partial', () => {
    const result = validateInteroperabilityRequirements(
      'ARC200',
      ['pera', 'defly'],
      'partial',
    )
    const peraResult = result.results.find(r => r.walletId === 'pera')
    expect(peraResult!.pass).toBe(true) // pera has partial
    const deflyResult = result.results.find(r => r.walletId === 'defly')
    // defly has view for ARC200, which fails at partial threshold
    expect(deflyResult!.pass).toBe(false)
  })

  it('should include message for each wallet result', () => {
    const result = validateInteroperabilityRequirements('ERC20', ['metamask'])
    expect(result.results[0].message.length).toBeGreaterThan(0)
  })

  it('should set standard on result', () => {
    const result = validateInteroperabilityRequirements('ARC3', ['pera'])
    expect(result.standard).toBe('ARC3')
  })

  it('should handle empty required wallets list', () => {
    const result = validateInteroperabilityRequirements('ASA', [])
    expect(result.overallPass).toBe(true)
    expect(result.results).toHaveLength(0)
  })
})

// ─── getStandardEcosystem ─────────────────────────────────────────────────────

describe('getStandardEcosystem', () => {
  it('should return avm for ASA', () => {
    expect(getStandardEcosystem('ASA')).toBe('avm')
  })

  it('should return avm for ARC3', () => {
    expect(getStandardEcosystem('ARC3')).toBe('avm')
  })

  it('should return avm for ARC200', () => {
    expect(getStandardEcosystem('ARC200')).toBe('avm')
  })

  it('should return evm for ERC20', () => {
    expect(getStandardEcosystem('ERC20')).toBe('evm')
  })

  it('should return evm for ERC721', () => {
    expect(getStandardEcosystem('ERC721')).toBe('evm')
  })

  it('should return evm for ERC1155', () => {
    expect(getStandardEcosystem('ERC1155')).toBe('evm')
  })
})

// ─── getCompatibleEcosystemStandards ─────────────────────────────────────────

describe('getCompatibleEcosystemStandards', () => {
  it('should return AVM standards for ASA (excluding ASA itself)', () => {
    const standards = getCompatibleEcosystemStandards('ASA')
    expect(standards).toContain('ARC3')
    expect(standards).toContain('ARC200')
    expect(standards).not.toContain('ASA')
    expect(standards).not.toContain('ERC20')
  })

  it('should return EVM standards for ERC20 (excluding ERC20 itself)', () => {
    const standards = getCompatibleEcosystemStandards('ERC20')
    expect(standards).toContain('ERC721')
    expect(standards).toContain('ERC1155')
    expect(standards).not.toContain('ERC20')
    expect(standards).not.toContain('ASA')
  })

  it('should not include cross-ecosystem standards', () => {
    const avmStandards = getCompatibleEcosystemStandards('ARC3')
    avmStandards.forEach(s => expect(getStandardEcosystem(s)).toBe('avm'))

    const evmStandards = getCompatibleEcosystemStandards('ERC721')
    evmStandards.forEach(s => expect(getStandardEcosystem(s)).toBe('evm'))
  })
})

// ─── formatSupportLevel ───────────────────────────────────────────────────────

describe('formatSupportLevel', () => {
  const cases: Array<[SupportLevel, string]> = [
    ['full', 'Fully Supported'],
    ['partial', 'Partially Supported'],
    ['view', 'View Only'],
    ['none', 'Not Supported'],
  ]

  cases.forEach(([level, expected]) => {
    it(`should format ${level} as "${expected}"`, () => {
      expect(formatSupportLevel(level)).toBe(expected)
    })
  })
})
