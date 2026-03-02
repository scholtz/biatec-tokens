import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  runNetworkCheck,
  runTokenConfigCheck,
  runComplianceCheck,
  validatePreflightChecks,
  isPreflightPassed,
  getPreflightStatusColor,
  getPreflightStatusIcon,
  type TokenLaunchConfig,
  type PreflightCheckStatus,
} from '../launchPreflightValidator'

describe('runNetworkCheck', () => {
  it('returns fail when network is undefined', () => {
    const result = runNetworkCheck(undefined)
    expect(result.status).toBe('fail')
    expect(result.isRequired).toBe(true)
    expect(result.message).toMatch(/no network selected/i)
  })

  it('returns fail when network is empty string', () => {
    const result = runNetworkCheck('')
    expect(result.status).toBe('fail')
  })

  it('returns fail when network is whitespace only', () => {
    const result = runNetworkCheck('   ')
    expect(result.status).toBe('fail')
  })

  it('returns pass for algorand mainnet', () => {
    const result = runNetworkCheck('algorand')
    expect(result.status).toBe('pass')
    expect(result.message).toContain('algorand')
  })

  it('returns pass for algorand testnet', () => {
    expect(runNetworkCheck('algorand-testnet').status).toBe('pass')
  })

  it('returns pass for ethereum', () => {
    expect(runNetworkCheck('ethereum').status).toBe('pass')
  })

  it('returns pass for voi', () => {
    expect(runNetworkCheck('voi').status).toBe('pass')
  })

  it('returns pass for base', () => {
    expect(runNetworkCheck('base').status).toBe('pass')
  })

  it('returns warning for unknown network', () => {
    const result = runNetworkCheck('polkadot')
    expect(result.status).toBe('warning')
    expect(result.message).toContain('polkadot')
  })

  it('is case-insensitive for network matching', () => {
    expect(runNetworkCheck('ALGORAND').status).toBe('pass')
    expect(runNetworkCheck('Ethereum').status).toBe('pass')
  })

  it('sets category to network', () => {
    expect(runNetworkCheck('algorand').category).toBe('network')
  })
})

describe('runTokenConfigCheck', () => {
  const validConfig: TokenLaunchConfig = {
    tokenName: 'MyToken',
    tokenSymbol: 'MYTKN',
    totalSupply: 1000000,
    templateSelected: true,
  }

  it('returns 4 checks', () => {
    expect(runTokenConfigCheck(validConfig)).toHaveLength(4)
  })

  it('passes all checks for valid config', () => {
    const checks = runTokenConfigCheck(validConfig)
    checks.forEach(c => expect(c.status).toBe('pass'))
  })

  it('fails token name when missing', () => {
    const checks = runTokenConfigCheck({ ...validConfig, tokenName: undefined })
    const nameCheck = checks.find(c => c.id === 'token-name')!
    expect(nameCheck.status).toBe('fail')
  })

  it('fails token name when 1 character', () => {
    const checks = runTokenConfigCheck({ ...validConfig, tokenName: 'A' })
    const nameCheck = checks.find(c => c.id === 'token-name')!
    expect(nameCheck.status).toBe('fail')
  })

  it('passes token name when exactly 2 characters', () => {
    const checks = runTokenConfigCheck({ ...validConfig, tokenName: 'AB' })
    const nameCheck = checks.find(c => c.id === 'token-name')!
    expect(nameCheck.status).toBe('pass')
  })

  it('fails token symbol when missing', () => {
    const checks = runTokenConfigCheck({ ...validConfig, tokenSymbol: undefined })
    const symbolCheck = checks.find(c => c.id === 'token-symbol')!
    expect(symbolCheck.status).toBe('fail')
  })

  it('fails token symbol with lowercase letters', () => {
    const checks = runTokenConfigCheck({ ...validConfig, tokenSymbol: 'mytkn' })
    const symbolCheck = checks.find(c => c.id === 'token-symbol')!
    expect(symbolCheck.status).toBe('fail')
  })

  it('fails token symbol with special characters', () => {
    const checks = runTokenConfigCheck({ ...validConfig, tokenSymbol: 'TKN$' })
    expect(checks.find(c => c.id === 'token-symbol')!.status).toBe('fail')
  })

  it('passes token symbol with digits', () => {
    const checks = runTokenConfigCheck({ ...validConfig, tokenSymbol: 'TKN1' })
    expect(checks.find(c => c.id === 'token-symbol')!.status).toBe('pass')
  })

  it('fails total supply when zero', () => {
    const checks = runTokenConfigCheck({ ...validConfig, totalSupply: 0 })
    expect(checks.find(c => c.id === 'total-supply')!.status).toBe('fail')
  })

  it('fails total supply when negative', () => {
    const checks = runTokenConfigCheck({ ...validConfig, totalSupply: -1 })
    expect(checks.find(c => c.id === 'total-supply')!.status).toBe('fail')
  })

  it('passes supply of 0.5 (positive fraction)', () => {
    const checks = runTokenConfigCheck({ ...validConfig, totalSupply: 0.5 })
    expect(checks.find(c => c.id === 'total-supply')!.status).toBe('pass')
  })

  it('fails total supply when undefined', () => {
    const checks = runTokenConfigCheck({ ...validConfig, totalSupply: undefined })
    expect(checks.find(c => c.id === 'total-supply')!.status).toBe('fail')
  })

  it('fails template when not selected', () => {
    const checks = runTokenConfigCheck({ ...validConfig, templateSelected: false })
    expect(checks.find(c => c.id === 'template-selected')!.status).toBe('fail')
  })

  it('passes template when selected', () => {
    const checks = runTokenConfigCheck(validConfig)
    expect(checks.find(c => c.id === 'template-selected')!.status).toBe('pass')
  })

  it('all token config checks have isRequired=true', () => {
    const checks = runTokenConfigCheck(validConfig)
    checks.forEach(c => expect(c.isRequired).toBe(true))
  })

  it('all token config checks have category token_config', () => {
    const checks = runTokenConfigCheck(validConfig)
    checks.forEach(c => expect(c.category).toBe('token_config'))
  })
})

describe('runComplianceCheck', () => {
  it('returns 3 checks', () => {
    expect(runComplianceCheck({})).toHaveLength(3)
  })

  it('compliance check is warning when not complete (not required)', () => {
    const checks = runComplianceCheck({ complianceComplete: false })
    const check = checks.find(c => c.id === 'compliance-complete')!
    expect(check.status).toBe('warning')
    expect(check.isRequired).toBe(false)
  })

  it('compliance check passes when complete', () => {
    const checks = runComplianceCheck({ complianceComplete: true })
    expect(checks.find(c => c.id === 'compliance-complete')!.status).toBe('pass')
  })

  it('identity check is warning when not verified (not required)', () => {
    const checks = runComplianceCheck({ identityVerified: false })
    const check = checks.find(c => c.id === 'identity-verified')!
    expect(check.status).toBe('warning')
    expect(check.isRequired).toBe(false)
  })

  it('identity check passes when verified', () => {
    const checks = runComplianceCheck({ identityVerified: true })
    expect(checks.find(c => c.id === 'identity-verified')!.status).toBe('pass')
  })

  it('organization check fails when not verified (is required)', () => {
    const checks = runComplianceCheck({ organizationVerified: false })
    const check = checks.find(c => c.id === 'organization-verified')!
    expect(check.status).toBe('fail')
    expect(check.isRequired).toBe(true)
  })

  it('organization check passes when verified', () => {
    const checks = runComplianceCheck({ organizationVerified: true })
    expect(checks.find(c => c.id === 'organization-verified')!.status).toBe('pass')
  })
})

describe('validatePreflightChecks', () => {
  const fullyValidConfig: TokenLaunchConfig = {
    tokenName: 'MyToken',
    tokenSymbol: 'MYTKN',
    totalSupply: 1000000,
    network: 'algorand',
    complianceComplete: true,
    identityVerified: true,
    organizationVerified: true,
    templateSelected: true,
  }

  it('passes for fully valid config', () => {
    const result = validatePreflightChecks(fullyValidConfig)
    expect(result.passed).toBe(true)
    expect(result.failedRequired).toHaveLength(0)
    expect(result.summary).toMatch(/all preflight checks passed/i)
  })

  it('fails when token name is missing', () => {
    const result = validatePreflightChecks({ ...fullyValidConfig, tokenName: undefined })
    expect(result.passed).toBe(false)
    expect(result.failedRequired.length).toBeGreaterThan(0)
  })

  it('fails when network is not selected', () => {
    const result = validatePreflightChecks({ ...fullyValidConfig, network: undefined })
    expect(result.passed).toBe(false)
  })

  it('fails when organization is not verified', () => {
    const result = validatePreflightChecks({ ...fullyValidConfig, organizationVerified: false })
    expect(result.passed).toBe(false)
  })

  it('passes with warnings when compliance is not complete', () => {
    const result = validatePreflightChecks({ ...fullyValidConfig, complianceComplete: false })
    expect(result.passed).toBe(true)
    expect(result.warnings.length).toBeGreaterThan(0)
    expect(result.summary).toMatch(/advisory notice/i)
  })

  it('includes timestamp in result', () => {
    const result = validatePreflightChecks(fullyValidConfig)
    expect(result.timestamp).toBeInstanceOf(Date)
  })

  it('result checks array is non-empty', () => {
    const result = validatePreflightChecks(fullyValidConfig)
    expect(result.checks.length).toBeGreaterThan(0)
  })

  it('summary mentions failure count when failing', () => {
    const result = validatePreflightChecks({})
    expect(result.summary).toMatch(/failed/i)
  })
})

describe('isPreflightPassed', () => {
  it('returns true when passed is true', () => {
    const result = validatePreflightChecks({
      tokenName: 'MyToken',
      tokenSymbol: 'MYTKN',
      totalSupply: 1000000,
      network: 'algorand',
      organizationVerified: true,
      templateSelected: true,
    })
    expect(isPreflightPassed(result)).toBe(result.passed)
  })

  it('returns false when required checks fail', () => {
    const result = validatePreflightChecks({})
    expect(isPreflightPassed(result)).toBe(false)
  })
})

describe('getPreflightStatusColor', () => {
  const cases: [PreflightCheckStatus, string][] = [
    ['pass', 'text-green-400'],
    ['fail', 'text-red-400'],
    ['warning', 'text-amber-400'],
    ['skipped', 'text-gray-400'],
  ]
  it.each(cases)('returns correct color for %s', (status, expected) => {
    expect(getPreflightStatusColor(status)).toBe(expected)
  })
})

describe('getPreflightStatusIcon', () => {
  it('returns check-circle for pass', () => {
    expect(getPreflightStatusIcon('pass')).toBe('check-circle')
  })

  it('returns x-circle for fail', () => {
    expect(getPreflightStatusIcon('fail')).toBe('x-circle')
  })

  it('returns exclamation-triangle for warning', () => {
    expect(getPreflightStatusIcon('warning')).toBe('exclamation-triangle')
  })

  it('returns minus-circle for skipped', () => {
    expect(getPreflightStatusIcon('skipped')).toBe('minus-circle')
  })
})
