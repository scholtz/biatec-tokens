import { describe, it, expect } from 'vitest'
import { isValidEmail, isRequiredFieldValid, EMAIL_REGEX } from '../formValidation'

describe('formValidation utilities', () => {
  describe('EMAIL_REGEX', () => {
    it('is a RegExp', () => {
      expect(EMAIL_REGEX).toBeInstanceOf(RegExp)
    })
  })

  describe('isValidEmail', () => {
    it('returns true for a standard email', () => {
      expect(isValidEmail('user@biatec.io')).toBe(true)
    })

    it('returns true for email with subdomain', () => {
      expect(isValidEmail('user@mail.biatec.io')).toBe(true)
    })

    it('returns true for email with plus sign in local part', () => {
      expect(isValidEmail('user+tag@biatec.io')).toBe(true)
    })

    it('returns false for missing @ symbol', () => {
      expect(isValidEmail('userbiatec.io')).toBe(false)
    })

    it('returns false for missing domain', () => {
      expect(isValidEmail('user@')).toBe(false)
    })

    it('returns false for missing local part', () => {
      expect(isValidEmail('@biatec.io')).toBe(false)
    })

    it('returns false for empty string', () => {
      expect(isValidEmail('')).toBe(false)
    })

    it('returns false for plain text with no @ or dot', () => {
      expect(isValidEmail('notanemail')).toBe(false)
    })

    it('returns false for email with spaces', () => {
      expect(isValidEmail('user @biatec.io')).toBe(false)
    })

    it('returns false for missing TLD', () => {
      expect(isValidEmail('user@biatec')).toBe(false)
    })
  })

  describe('isRequiredFieldValid', () => {
    it('returns true for a non-empty string', () => {
      expect(isRequiredFieldValid('hello')).toBe(true)
    })

    it('returns true for a string with inner spaces but non-empty trimmed', () => {
      expect(isRequiredFieldValid('  hello  ')).toBe(true)
    })

    it('returns false for an empty string', () => {
      expect(isRequiredFieldValid('')).toBe(false)
    })

    it('returns false for a whitespace-only string', () => {
      expect(isRequiredFieldValid('   ')).toBe(false)
    })

    it('returns false for a tab-only string', () => {
      expect(isRequiredFieldValid('\t')).toBe(false)
    })

    it('returns true for a single character', () => {
      expect(isRequiredFieldValid('a')).toBe(true)
    })

    it('returns true for a numeric string', () => {
      expect(isRequiredFieldValid('123')).toBe(true)
    })
  })
})
