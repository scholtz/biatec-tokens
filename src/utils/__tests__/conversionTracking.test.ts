import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  trackCTAClick,
  trackStandardsComparison,
  calculateConversionRate,
  trackFunnelEntry,
  trackFunnelMilestone,
  trackFunnelCompletion,
  trackFunnelAbandonment,
  trackWalletConnectAttempt,
  trackWalletConnectSuccess,
  trackWalletConnectFailure,
} from '../conversionTracking';

describe('Conversion Tracking Helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('trackFunnelEntry', () => {
    it('should not throw when tracking discovery funnel entry', () => {
      expect(() => {
        trackFunnelEntry('discovery', { source: 'homepage' });
      }).not.toThrow();
    });

    it('should not throw when tracking comparison funnel entry', () => {
      expect(() => {
        trackFunnelEntry('comparison');
      }).not.toThrow();
    });

    it('should not throw when tracking activation funnel entry', () => {
      expect(() => {
        trackFunnelEntry('activation', { userId: 'u1' });
      }).not.toThrow();
    });
  });

  describe('trackFunnelMilestone', () => {
    it('should not throw when tracking milestone', () => {
      expect(() => {
        trackFunnelMilestone('discovery', 'standard_selected', { standard: 'ARC200' });
      }).not.toThrow();
    });

    it('should not throw when tracking milestone without metadata', () => {
      expect(() => {
        trackFunnelMilestone('comparison', 'comparison_started');
      }).not.toThrow();
    });
  });

  describe('trackFunnelCompletion', () => {
    it('should not throw when tracking funnel completion', () => {
      expect(() => {
        trackFunnelCompletion('discovery', { standard: 'ARC1400' });
      }).not.toThrow();
    });

    it('should not throw when tracking completion without metadata', () => {
      expect(() => {
        trackFunnelCompletion('activation');
      }).not.toThrow();
    });
  });

  describe('trackFunnelAbandonment', () => {
    it('should not throw when tracking abandonment with reason', () => {
      expect(() => {
        trackFunnelAbandonment('comparison', 'step_2', 'too_complex', { timeSpent: 120 });
      }).not.toThrow();
    });

    it('should not throw when tracking abandonment without reason', () => {
      expect(() => {
        trackFunnelAbandonment('discovery', 'step_1');
      }).not.toThrow();
    });
  });

  describe('trackCTAClick', () => {
    it('should not throw error when tracking CTA click', () => {
      expect(() => {
        trackCTAClick('compare_standards', 'discovery_page', { position: 'hero' });
      }).not.toThrow();
    });

    it('should not throw when tracking CTA click without metadata', () => {
      expect(() => {
        trackCTAClick('get_started', 'landing_page');
      }).not.toThrow();
    });
  });

  describe('trackWalletConnectAttempt', () => {
    it('should not throw when tracking wallet connect attempt', () => {
      expect(() => {
        trackWalletConnectAttempt('pera', { network: 'mainnet' });
      }).not.toThrow();
    });

    it('should not throw when tracking attempt without metadata', () => {
      expect(() => {
        trackWalletConnectAttempt('defly');
      }).not.toThrow();
    });
  });

  describe('trackWalletConnectSuccess', () => {
    it('should not throw when tracking wallet connect success', () => {
      expect(() => {
        trackWalletConnectSuccess('pera', { address: 'AAAA' });
      }).not.toThrow();
    });

    it('should not throw when tracking success without metadata', () => {
      expect(() => {
        trackWalletConnectSuccess('defly');
      }).not.toThrow();
    });
  });

  describe('trackWalletConnectFailure', () => {
    it('should not throw when tracking wallet connect failure', () => {
      expect(() => {
        trackWalletConnectFailure('pera', 'user_rejected', { network: 'mainnet' });
      }).not.toThrow();
    });

    it('should not throw when tracking failure without metadata', () => {
      expect(() => {
        trackWalletConnectFailure('defly', 'timeout');
      }).not.toThrow();
    });
  });

  describe('trackStandardsComparison', () => {
    it('should not throw error when tracking standards comparison', () => {
      expect(() => {
        trackStandardsComparison('view', ['ARC200', 'ERC20']);
      }).not.toThrow();
    });

    it('should not throw error with compare action', () => {
      expect(() => {
        trackStandardsComparison('compare', ['ARC1400', 'ERC1400'], { context: 'detail_page' });
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

    it('should handle 100% conversion rate', () => {
      expect(calculateConversionRate(50, 50)).toBe(100);
    });
  });
});
