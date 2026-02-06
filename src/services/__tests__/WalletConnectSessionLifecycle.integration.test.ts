import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ref } from 'vue';
import {
  saveWalletConnectSession,
  getWalletConnectSession,
  loadWalletConnectSessions,
  isWalletConnectSessionValid,
  cleanupWalletConnectSessions,
  clearAllWalletConnectSessions,
} from '../WalletConnectService';

// Mock telemetry
vi.mock('../TelemetryService', () => ({
  telemetryService: {
    track: vi.fn(),
  },
}));

describe('WalletConnect Session Lifecycle Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    clearAllWalletConnectSessions();
  });

  describe('Session Creation and Persistence', () => {
    it('should create and persist a new session', () => {
      const topic = 'test-topic';
      const walletId = 'walletconnect';
      const networkId = 'algorand-mainnet';
      const address = 'ADDR123...';

      saveWalletConnectSession(topic, walletId, networkId, address);

      // Verify session is in memory
      const session = getWalletConnectSession(topic);
      expect(session).not.toBeNull();
      expect(session?.topic).toBe(topic);
      expect(session?.walletId).toBe(walletId);

      // Verify session is in localStorage
      const stored = localStorage.getItem('biatec_walletconnect_sessions');
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed[topic]).toBeDefined();
    });

    it('should restore sessions from localStorage on load', () => {
      // Save session to localStorage directly
      const topic = 'restored-topic';
      const session = {
        topic,
        walletId: 'walletconnect',
        networkId: 'algorand-mainnet',
        address: 'ADDR456...',
        connectedAt: Date.now(),
        lastActivityAt: Date.now(),
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
      };
      localStorage.setItem('biatec_walletconnect_sessions', JSON.stringify({ [topic]: session }));

      // Force reload from storage
      loadWalletConnectSessions();

      // Verify session was restored
      const restored = getWalletConnectSession(topic);
      expect(restored).not.toBeNull();
      expect(restored?.walletId).toBe('walletconnect');
    });
  });

  describe('Session Expiry', () => {
    it('should mark session as expired after 7 days', () => {
      vi.useFakeTimers();
      const topic = 'expiry-test-topic';
      
      saveWalletConnectSession(topic, 'walletconnect', 'algorand-mainnet', 'ADDR789...');
      
      // Initially valid
      expect(isWalletConnectSessionValid(topic)).toBe(true);
      
      // Fast forward 8 days
      vi.advanceTimersByTime(8 * 24 * 60 * 60 * 1000);
      
      // Now expired
      expect(isWalletConnectSessionValid(topic)).toBe(false);
      
      vi.useRealTimers();
    });

    it('should clean up expired sessions', () => {
      vi.useFakeTimers();
      
      const validTopic = 'valid-topic';
      const expiredTopic = 'expired-topic';
      
      saveWalletConnectSession(validTopic, 'walletconnect', 'algorand-mainnet', 'ADDR1');
      
      // Fast forward 1 day
      vi.advanceTimersByTime(1 * 24 * 60 * 60 * 1000);
      
      saveWalletConnectSession(expiredTopic, 'walletconnect', 'algorand-mainnet', 'ADDR2');
      
      // Fast forward 8 more days (total 9 days for first session, 8 for second)
      vi.advanceTimersByTime(8 * 24 * 60 * 60 * 1000);
      
      // Cleanup
      const cleaned = cleanupWalletConnectSessions();
      
      // Both should be expired
      expect(cleaned).toBeGreaterThan(0);
      
      vi.useRealTimers();
    });
  });

  describe('Session Disconnect', () => {
    it('should remove session on disconnect', () => {
      const topic = 'disconnect-topic';
      
      saveWalletConnectSession(topic, 'walletconnect', 'algorand-mainnet', 'ADDR123');
      expect(getWalletConnectSession(topic)).not.toBeNull();
      
      clearAllWalletConnectSessions();
      
      expect(getWalletConnectSession(topic)).toBeNull();
      
      // Verify localStorage is cleared
      const stored = localStorage.getItem('biatec_walletconnect_sessions');
      expect(stored).toBeNull();
    });
  });

  describe('Network Switching', () => {
    it('should allow multiple sessions for different networks', () => {
      const mainnetTopic = 'mainnet-topic';
      const testnetTopic = 'testnet-topic';
      
      saveWalletConnectSession(mainnetTopic, 'walletconnect', 'algorand-mainnet', 'ADDR_MAIN');
      saveWalletConnectSession(testnetTopic, 'walletconnect', 'algorand-testnet', 'ADDR_TEST');
      
      const mainnetSession = getWalletConnectSession(mainnetTopic);
      const testnetSession = getWalletConnectSession(testnetTopic);
      
      expect(mainnetSession?.networkId).toBe('algorand-mainnet');
      expect(testnetSession?.networkId).toBe('algorand-testnet');
    });

    it('should update session on network switch', () => {
      const topic = 'switch-topic';
      
      // Create initial session on mainnet
      saveWalletConnectSession(topic, 'walletconnect', 'algorand-mainnet', 'ADDR_SWITCH');
      
      let session = getWalletConnectSession(topic);
      expect(session?.networkId).toBe('algorand-mainnet');
      
      // "Switch" network by creating new session with same address but different network
      saveWalletConnectSession(topic, 'walletconnect', 'algorand-testnet', 'ADDR_SWITCH');
      
      session = getWalletConnectSession(topic);
      expect(session?.networkId).toBe('algorand-testnet');
    });
  });

  describe('Session Reconnection After Page Reload', () => {
    it('should successfully reconnect with valid session', () => {
      const topic = 'reconnect-topic';
      
      // Create and save session
      saveWalletConnectSession(topic, 'walletconnect', 'algorand-mainnet', 'ADDR_RECONNECT');
      
      // Simulate page reload by reloading from localStorage
      loadWalletConnectSessions();
      
      // Session should be restored
      const session = getWalletConnectSession(topic);
      expect(session).not.toBeNull();
      expect(session?.address).toBe('ADDR_RECONNECT');
      expect(isWalletConnectSessionValid(topic)).toBe(true);
    });

    it('should not reconnect with expired session after reload', () => {
      vi.useFakeTimers();
      const topic = 'expired-reconnect-topic';
      
      // Create session
      saveWalletConnectSession(topic, 'walletconnect', 'algorand-mainnet', 'ADDR_EXPIRED');
      
      // Fast forward past expiry
      vi.advanceTimersByTime(8 * 24 * 60 * 60 * 1000);
      
      // Simulate page reload
      clearAllWalletConnectSessions();
      loadWalletConnectSessions();
      
      // Session should be filtered out as expired
      const session = getWalletConnectSession(topic);
      expect(session).toBeNull();
      
      vi.useRealTimers();
    });
  });

  describe('Error Handling', () => {
    it('should handle corrupted localStorage data', () => {
      localStorage.setItem('biatec_walletconnect_sessions', 'invalid-json{{{');
      
      expect(() => loadWalletConnectSessions()).not.toThrow();
      
      // Should return empty sessions after corruption
      const session = getWalletConnectSession('any-topic');
      expect(session).toBeNull();
    });

    it('should handle missing metadata gracefully', () => {
      const topic = 'no-metadata-topic';
      
      // Save without metadata
      saveWalletConnectSession(topic, 'walletconnect', 'algorand-mainnet', 'ADDR_NO_META');
      
      const session = getWalletConnectSession(topic);
      expect(session).not.toBeNull();
      expect(session?.metadata).toBeUndefined();
    });

    it('should handle localStorage quota exceeded', () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });
      
      expect(() => {
        saveWalletConnectSession('quota-topic', 'walletconnect', 'algorand-mainnet', 'ADDR');
      }).not.toThrow();
      
      setItemSpy.mockRestore();
    });
  });

  describe('Wallet Injection Guard', () => {
    it('should validate session before allowing operations', () => {
      vi.useFakeTimers();
      const topic = 'validation-topic';
      
      saveWalletConnectSession(topic, 'walletconnect', 'algorand-mainnet', 'ADDR');
      
      // Valid initially
      expect(isWalletConnectSessionValid(topic)).toBe(true);
      
      // Expire session
      vi.advanceTimersByTime(8 * 24 * 60 * 60 * 1000);
      
      // Should now be invalid
      expect(isWalletConnectSessionValid(topic)).toBe(false);
      
      // Trying to get expired session should return null
      const session = getWalletConnectSession(topic);
      expect(session).toBeNull();
      
      vi.useRealTimers();
    });
  });
});
