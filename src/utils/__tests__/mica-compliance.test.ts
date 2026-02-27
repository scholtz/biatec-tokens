import { describe, it, expect } from 'vitest';
import {
  getMicaClassificationLabel,
  getMicaClassificationGuidance,
  parseRestrictedJurisdictions,
  isValidEmail,
} from '../mica-compliance';

describe('mica-compliance utils', () => {
  describe('getMicaClassificationLabel', () => {
    it('should return label for utility', () => {
      expect(getMicaClassificationLabel('utility')).toBe('Utility Token');
    });

    it('should return label for e-money', () => {
      expect(getMicaClassificationLabel('e-money')).toBe('E-Money Token');
    });

    it('should return label for asset-referenced', () => {
      expect(getMicaClassificationLabel('asset-referenced')).toBe('Asset-Referenced Token');
    });

    it('should return label for other', () => {
      expect(getMicaClassificationLabel('other')).toBe('Other');
    });

    it('should return the raw classification for unknown type', () => {
      expect(getMicaClassificationLabel('custom_type')).toBe('custom_type');
    });
  });

  describe('getMicaClassificationGuidance', () => {
    it('should return guidance for utility', () => {
      const guidance = getMicaClassificationGuidance('utility');
      expect(guidance).toContain('Provides access');
    });

    it('should return guidance for e-money', () => {
      const guidance = getMicaClassificationGuidance('e-money');
      expect(guidance).toContain('fiat currency');
    });

    it('should return guidance for asset-referenced', () => {
      const guidance = getMicaClassificationGuidance('asset-referenced');
      expect(guidance).toContain('stabilized');
    });

    it('should return guidance for other', () => {
      const guidance = getMicaClassificationGuidance('other');
      expect(guidance).toContain('Does not fit');
    });

    it('should return empty string for unknown classification', () => {
      expect(getMicaClassificationGuidance('unknown_class')).toBe('');
    });
  });

  describe('parseRestrictedJurisdictions', () => {
    it('should parse valid country codes', () => {
      const result = parseRestrictedJurisdictions('US,CN,EU');
      expect(result.valid).toEqual(['US', 'CN', 'EU']);
      expect(result.invalid).toEqual([]);
    });

    it('should handle mixed valid and invalid codes', () => {
      const result = parseRestrictedJurisdictions('US,INVALID,XX,DE');
      expect(result.valid).toContain('US');
      expect(result.valid).toContain('DE');
      expect(result.invalid).toContain('INVALID');
      expect(result.invalid).toContain('XX');
    });

    it('should normalize lowercase to uppercase', () => {
      const result = parseRestrictedJurisdictions('us,gb');
      expect(result.valid).toContain('US');
      expect(result.valid).toContain('GB');
    });

    it('should handle empty string', () => {
      const result = parseRestrictedJurisdictions('');
      expect(result.valid).toEqual([]);
      expect(result.invalid).toEqual([]);
    });

    it('should handle whitespace around codes', () => {
      const result = parseRestrictedJurisdictions('US , DE , FR');
      expect(result.valid).toEqual(['US', 'DE', 'FR']);
    });

    it('should handle all invalid codes', () => {
      const result = parseRestrictedJurisdictions('AA,BB,CC');
      expect(result.valid).toEqual([]);
      expect(result.invalid).toEqual(['AA', 'BB', 'CC']);
    });
  });

  describe('isValidEmail', () => {
    it('should return true for valid email', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
    });

    it('should return true for email with subdomain', () => {
      expect(isValidEmail('user@mail.example.com')).toBe(true);
    });

    it('should return true for email with + tag in local part', () => {
      expect(isValidEmail('user+tag@example.com')).toBe(true);
    });

    it('should return false for email without @', () => {
      expect(isValidEmail('userexample.com')).toBe(false);
    });

    it('should return false for email without domain', () => {
      expect(isValidEmail('user@')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isValidEmail('')).toBe(false);
    });

    it('should return false for email with spaces', () => {
      expect(isValidEmail('user @example.com')).toBe(false);
    });

    it('should return false for email with multiple @ symbols', () => {
      expect(isValidEmail('user@@example.com')).toBe(false);
    });
  });
});
