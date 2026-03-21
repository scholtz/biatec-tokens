import { describe, it, expect } from 'vitest'
import { formatAddress, isValidAlgorandAddress } from '../address'

describe('address utilities', () => {
  describe('formatAddress', () => {
    it('returns the full address when shorter than startLength + endLength', () => {
      expect(formatAddress('ABC', 6, 5)).toBe('ABC')
    })

    it('returns the full address when exactly startLength + endLength characters', () => {
      expect(formatAddress('ABCDE12345', 5, 5)).toBe('ABCDE12345')
    })

    it('truncates address with default lengths', () => {
      const addr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
      const result = formatAddress(addr)
      expect(result).toBe('ABCDEF...34567')
      expect(result).toContain('...')
    })

    it('uses custom start and end lengths', () => {
      const addr = 'AAAAAABBBBBBCCCCCC'
      const result = formatAddress(addr, 3, 3)
      expect(result).toBe('AAA...CCC')
    })

    it('returns empty string for empty input', () => {
      expect(formatAddress('')).toBe('')
    })

    it('returns null/undefined input unchanged', () => {
      expect(formatAddress(null as any)).toBe(null)
    })

    it('truncates a realistic 58-character Algorand address', () => {
      const realAddr = 'BIATECTEST7ARC76DERIVEDADDRESSAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
      const result = formatAddress(realAddr)
      expect(result.startsWith('BIATE')).toBe(true)
      expect(result.includes('...')).toBe(true)
      expect(result.endsWith(realAddr.slice(-5))).toBe(true)
    })
  })

  describe('isValidAlgorandAddress', () => {
    it('returns false for empty string', () => {
      expect(isValidAlgorandAddress('')).toBe(false)
    })

    it('returns false for null/undefined', () => {
      expect(isValidAlgorandAddress(null as any)).toBe(false)
    })

    it('returns false for addresses shorter than 58 characters', () => {
      expect(isValidAlgorandAddress('ABCDEFG')).toBe(false)
    })

    it('returns false for addresses longer than 58 characters', () => {
      const tooLong = 'A'.repeat(59)
      expect(isValidAlgorandAddress(tooLong)).toBe(false)
    })

    it('returns false for 58-character string with invalid characters (lowercase)', () => {
      const lower = 'a'.repeat(58)
      expect(isValidAlgorandAddress(lower)).toBe(false)
    })

    it('returns false for 58-character string with digits 0, 1, 8, 9 (invalid base32)', () => {
      const invalid = 'A'.repeat(57) + '0'
      expect(isValidAlgorandAddress(invalid)).toBe(false)
    })

    it('returns true for valid 58-character base32 address', () => {
      // Valid base32 chars: A-Z and 2-7
      const valid = 'BIATECTEST7ARC76DERIVEDADDRESSAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
      expect(valid.length).toBe(58)
      expect(isValidAlgorandAddress(valid)).toBe(true)
    })

    it('returns true for another valid address pattern', () => {
      const addr = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
      expect(addr.length).toBe(58)
      expect(isValidAlgorandAddress(addr)).toBe(true)
    })

    it('returns false for mixed valid/invalid characters (contains 8)', () => {
      const withEight = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8A'
      expect(isValidAlgorandAddress(withEight)).toBe(false)
    })
  })
})
