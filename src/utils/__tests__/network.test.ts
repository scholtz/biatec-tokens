import { describe, it, expect } from 'vitest'
import { detectNetworkType, formatNetworkName } from '../network'

describe('network utilities', () => {
  describe('detectNetworkType', () => {
    it('returns VOI for undefined input', () => {
      expect(detectNetworkType(undefined)).toBe('VOI')
    })

    it('returns VOI for empty string', () => {
      expect(detectNetworkType('')).toBe('VOI')
    })

    it('returns Aramid when display name contains "aramid" (lowercase)', () => {
      expect(detectNetworkType('Aramid Mainnet')).toBe('Aramid')
    })

    it('returns Aramid for "aramid" in any case', () => {
      expect(detectNetworkType('ARAMID TESTNET')).toBe('Aramid')
    })

    it('returns VOI for "VOI Testnet"', () => {
      expect(detectNetworkType('VOI Testnet')).toBe('VOI')
    })

    it('returns VOI for "Algorand Mainnet" (no aramid)', () => {
      expect(detectNetworkType('Algorand Mainnet')).toBe('VOI')
    })

    it('returns VOI for a random unknown string', () => {
      expect(detectNetworkType('Unknown Network')).toBe('VOI')
    })

    it('returns Aramid for partial match inside a longer string', () => {
      expect(detectNetworkType('My Aramid-based Network')).toBe('Aramid')
    })
  })

  describe('formatNetworkName', () => {
    it('returns "VOI Network" for VOI', () => {
      expect(formatNetworkName('VOI')).toBe('VOI Network')
    })

    it('returns "Aramid Network" for Aramid', () => {
      expect(formatNetworkName('Aramid')).toBe('Aramid Network')
    })
  })
})
