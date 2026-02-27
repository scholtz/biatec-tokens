import { describe, it, expect } from 'vitest';
import {
  getWalletSupport,
  getWalletsForStandard,
  getCompatibilitySummary,
  WALLET_COMPATIBILITY,
  WALLET_STANDARD_SUPPORT,
} from '../walletCompatibility';

describe('walletCompatibility', () => {
  describe('WALLET_COMPATIBILITY constant', () => {
    it('should export known wallets', () => {
      expect(WALLET_COMPATIBILITY['pera']).toBeDefined();
      expect(WALLET_COMPATIBILITY['pera'].name).toBeTruthy();
    });

    it('should have valid date string in lastVerified on each wallet', () => {
      for (const wallet of Object.values(WALLET_COMPATIBILITY)) {
        expect(wallet.lastVerified).toBeTruthy();
        // Verify it's a valid parseable date
        expect(Date.parse(wallet.lastVerified)).not.toBeNaN();
      }
    });
  });

  describe('WALLET_STANDARD_SUPPORT constant', () => {
    it('should contain support entries', () => {
      expect(WALLET_STANDARD_SUPPORT.length).toBeGreaterThan(0);
    });
  });

  describe('getWalletSupport', () => {
    it('should return support entry for known wallet and standard', () => {
      const support = getWalletSupport('pera', 'ARC3');
      expect(support).toBeDefined();
      expect(support?.wallet).toBe('pera');
      expect(support?.standard).toBe('ARC3');
    });

    it('should return undefined for unknown wallet', () => {
      const support = getWalletSupport('unknown_wallet', 'ARC3');
      expect(support).toBeUndefined();
    });

    it('should return undefined for unknown standard', () => {
      const support = getWalletSupport('pera', 'UNKNOWN_STANDARD' as any);
      expect(support).toBeUndefined();
    });

    it('should return support for defly + ASA', () => {
      const support = getWalletSupport('defly', 'ASA');
      expect(support).toBeDefined();
      expect(support?.standard).toBe('ASA');
    });
  });

  describe('getWalletsForStandard', () => {
    it('should return supported wallets for ARC3', () => {
      const wallets = getWalletsForStandard('ARC3');
      expect(wallets.length).toBeGreaterThan(0);
      wallets.forEach(w => {
        expect(w.standard).toBe('ARC3');
        expect(w.supported).toBe(true);
      });
    });

    it('should return empty array for unknown standard', () => {
      const wallets = getWalletsForStandard('UNKNOWN' as any);
      expect(wallets).toEqual([]);
    });

    it('should return wallets for ASA', () => {
      const wallets = getWalletsForStandard('ASA');
      expect(wallets.length).toBeGreaterThan(0);
    });

    it('should return wallets for ARC69', () => {
      const wallets = getWalletsForStandard('ARC69');
      expect(wallets.length).toBeGreaterThan(0);
    });
  });

  describe('getCompatibilitySummary', () => {
    it('should return summary for ARC3', () => {
      const summary = getCompatibilitySummary('ARC3');
      expect(summary.totalWallets).toBeGreaterThan(0);
      expect(typeof summary.excellentCount).toBe('number');
      expect(typeof summary.goodCount).toBe('number');
      expect(typeof summary.partialCount).toBe('number');
      expect(typeof summary.poorCount).toBe('number');
    });

    it('should return all zeros for unknown standard', () => {
      const summary = getCompatibilitySummary('UNKNOWN' as any);
      expect(summary.totalWallets).toBe(0);
      expect(summary.excellentCount).toBe(0);
      expect(summary.goodCount).toBe(0);
      expect(summary.partialCount).toBe(0);
      expect(summary.poorCount).toBe(0);
    });

    it('should return correct counts across quality levels for ASA', () => {
      const summary = getCompatibilitySummary('ASA');
      const total = summary.excellentCount + summary.goodCount + summary.partialCount + summary.poorCount;
      expect(total).toBe(summary.totalWallets);
    });
  });
});
