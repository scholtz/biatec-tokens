import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  trackCTAClick,
  trackStandardsComparison,
  calculateConversionRate,
} from '../conversionTracking';

describe('Conversion Tracking Helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('trackCTAClick', () => {
    it('should not throw error when tracking CTA click', () => {
      expect(() => {
        trackCTAClick('compare_standards', 'discovery_page', { position: 'hero' });
      }).not.toThrow();
    });
  });

  describe('trackStandardsComparison', () => {
    it('should not throw error when tracking standards comparison', () => {
      expect(() => {
        trackStandardsComparison('view', ['ARC200', 'ERC20']);
      }).not.toThrow();
    });

    it('should not throw error with select action', () => {
      expect(() => {
        trackStandardsComparison('select', ['ARC1400']);
      }).not.toThrow();
    });
  });

  describe('calculateConversionRate', () => {
    it('should calculate conversion rate correctly', () => {
      expect(calculateConversionRate(100, 75)).toBe(75);
      expect(calculateConversionRate(200, 50)).toBe(25);
      expect(calculateConversionRate(500, 250)).toBe(50);
    });

    it('should handle zero entries', () => {
      expect(calculateConversionRate(0, 0)).toBe(0);
      expect(calculateConversionRate(0, 5)).toBe(0);
    });

    it('should handle decimal results', () => {
      const result = calculateConversionRate(300, 100);
      expect(result).toBeCloseTo(33.33, 2);
    });
  });
});
