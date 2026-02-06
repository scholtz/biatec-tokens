import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  loadWalletConnectSessions,
  saveWalletConnectSession,
  getWalletConnectSession,
  removeWalletConnectSession,
  clearAllWalletConnectSessions,
  updateWalletConnectActivity,
  isWalletConnectSessionValid,
  getWalletConnectStats,
  getCurrentWalletConnectSession,
  setCurrentWalletConnectSession,
  getAllActiveSessions,
  cleanupWalletConnectSessions,
} from '../WalletConnectService';

// Mock telemetry service
vi.mock('../TelemetryService', () => ({
  telemetryService: {
    track: vi.fn(),
  },
}));

describe('WalletConnectService', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
    // Clear all sessions
    clearAllWalletConnectSessions();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Session Management', () => {
    it('should save and retrieve a WalletConnect session', () => {
      const topic = 'test-topic-123';
      const walletId = 'walletconnect';
      const networkId = 'algorand-mainnet';
      const address = 'ADDR123...';
      const metadata = {
        name: 'Test Wallet',
        description: 'Test wallet description',
        url: 'https://test.wallet.com',
        icons: ['https://test.wallet.com/icon.png'],
      };

      saveWalletConnectSession(topic, walletId, networkId, address, metadata);

      const retrieved = getWalletConnectSession(topic);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.topic).toBe(topic);
      expect(retrieved?.walletId).toBe(walletId);
      expect(retrieved?.networkId).toBe(networkId);
      expect(retrieved?.address).toBe(address);
      expect(retrieved?.metadata).toEqual(metadata);
    });

    it('should update session activity timestamp', () => {
      const topic = 'test-topic-123';
      saveWalletConnectSession(topic, 'walletconnect', 'algorand-mainnet', 'ADDR123');

      const before = getWalletConnectSession(topic);
      const initialActivity = before!.lastActivityAt;

      // Wait a bit to ensure timestamp changes
      vi.useFakeTimers();
      vi.advanceTimersByTime(1000);

      updateWalletConnectActivity(topic);

      const after = getWalletConnectSession(topic);
      expect(after!.lastActivityAt).toBeGreaterThan(initialActivity);
      
      vi.useRealTimers();
    });

    it('should remove a session', () => {
      const topic = 'test-topic-123';
      saveWalletConnectSession(topic, 'walletconnect', 'algorand-mainnet', 'ADDR123');

      expect(getWalletConnectSession(topic)).not.toBeNull();

      removeWalletConnectSession(topic);

      expect(getWalletConnectSession(topic)).toBeNull();
    });

    it('should clear all sessions', () => {
      saveWalletConnectSession('topic1', 'walletconnect', 'algorand-mainnet', 'ADDR1');
      saveWalletConnectSession('topic2', 'walletconnect', 'algorand-testnet', 'ADDR2');

      expect(getWalletConnectSession('topic1')).not.toBeNull();
      expect(getWalletConnectSession('topic2')).not.toBeNull();

      clearAllWalletConnectSessions();

      expect(getWalletConnectSession('topic1')).toBeNull();
      expect(getWalletConnectSession('topic2')).toBeNull();
    });
  });

  describe('Session Validation', () => {
    it('should validate active sessions', () => {
      const topic = 'test-topic-123';
      saveWalletConnectSession(topic, 'walletconnect', 'algorand-mainnet', 'ADDR123');

      expect(isWalletConnectSessionValid(topic)).toBe(true);
    });

    it('should reject expired sessions', () => {
      vi.useFakeTimers();
      const topic = 'test-topic-123';
      saveWalletConnectSession(topic, 'walletconnect', 'algorand-mainnet', 'ADDR123');

      // Fast-forward time by 8 days (past 7-day expiry)
      vi.advanceTimersByTime(8 * 24 * 60 * 60 * 1000);

      expect(isWalletConnectSessionValid(topic)).toBe(false);
      
      vi.useRealTimers();
    });

    it('should reject inactive sessions', () => {
      vi.useFakeTimers();
      const topic = 'test-topic-123';
      saveWalletConnectSession(topic, 'walletconnect', 'algorand-mainnet', 'ADDR123');

      // Fast-forward time by 31 minutes (past 30-minute activity timeout)
      vi.advanceTimersByTime(31 * 60 * 1000);

      expect(isWalletConnectSessionValid(topic)).toBe(false);
      
      vi.useRealTimers();
    });

    it('should return null for non-existent sessions', () => {
      expect(getWalletConnectSession('non-existent')).toBeNull();
      expect(isWalletConnectSessionValid('non-existent')).toBe(false);
    });
  });

  describe('Session Statistics', () => {
    it('should calculate session statistics correctly', () => {
      saveWalletConnectSession('topic1', 'walletconnect', 'algorand-mainnet', 'ADDR1');
      saveWalletConnectSession('topic2', 'walletconnect', 'algorand-testnet', 'ADDR2');

      const stats = getWalletConnectStats();

      expect(stats.activeSessions).toBe(2);
      expect(stats.expiredSessions).toBe(0);
      expect(stats.totalSessions).toBe(2);
      expect(stats.oldestSession).toBeInstanceOf(Date);
      expect(stats.newestSession).toBeInstanceOf(Date);
    });

    it('should detect expired sessions in stats', () => {
      vi.useFakeTimers();
      
      saveWalletConnectSession('topic1', 'walletconnect', 'algorand-mainnet', 'ADDR1');
      
      // Fast-forward time to expire the session
      vi.advanceTimersByTime(8 * 24 * 60 * 60 * 1000);
      
      saveWalletConnectSession('topic2', 'walletconnect', 'algorand-testnet', 'ADDR2');

      const stats = getWalletConnectStats();

      expect(stats.activeSessions).toBe(1);
      expect(stats.expiredSessions).toBe(1);
      expect(stats.totalSessions).toBe(2);
      
      vi.useRealTimers();
    });
  });

  describe('Current Session Management', () => {
    it('should set and get current session', () => {
      const topic = 'test-topic-123';
      saveWalletConnectSession(topic, 'walletconnect', 'algorand-mainnet', 'ADDR123');

      setCurrentWalletConnectSession(topic);

      const current = getCurrentWalletConnectSession();
      expect(current).not.toBeNull();
      expect(current?.topic).toBe(topic);
    });

    it('should clear current session', () => {
      const topic = 'test-topic-123';
      saveWalletConnectSession(topic, 'walletconnect', 'algorand-mainnet', 'ADDR123');
      setCurrentWalletConnectSession(topic);

      setCurrentWalletConnectSession(null);

      expect(getCurrentWalletConnectSession()).toBeNull();
    });

    it('should update activity when setting current session', () => {
      vi.useFakeTimers();
      const topic = 'test-topic-123';
      saveWalletConnectSession(topic, 'walletconnect', 'algorand-mainnet', 'ADDR123');

      const before = getWalletConnectSession(topic);
      const initialActivity = before!.lastActivityAt;

      vi.advanceTimersByTime(1000);

      setCurrentWalletConnectSession(topic);

      const after = getWalletConnectSession(topic);
      expect(after!.lastActivityAt).toBeGreaterThan(initialActivity);
      
      vi.useRealTimers();
    });
  });

  describe('Active Sessions', () => {
    it('should get all active sessions', () => {
      saveWalletConnectSession('topic1', 'walletconnect', 'algorand-mainnet', 'ADDR1');
      saveWalletConnectSession('topic2', 'walletconnect', 'algorand-testnet', 'ADDR2');

      const active = getAllActiveSessions();

      expect(active).toHaveLength(2);
      expect(active.map(s => s.topic)).toContain('topic1');
      expect(active.map(s => s.topic)).toContain('topic2');
    });

    it('should filter out expired sessions from active list', () => {
      vi.useFakeTimers();
      
      saveWalletConnectSession('topic1', 'walletconnect', 'algorand-mainnet', 'ADDR1');
      
      // Expire topic1
      vi.advanceTimersByTime(8 * 24 * 60 * 60 * 1000);
      
      saveWalletConnectSession('topic2', 'walletconnect', 'algorand-testnet', 'ADDR2');

      const active = getAllActiveSessions();

      expect(active).toHaveLength(1);
      expect(active[0].topic).toBe('topic2');
      
      vi.useRealTimers();
    });
  });

  describe('Session Cleanup', () => {
    it('should clean up expired sessions', () => {
      vi.useFakeTimers();
      
      saveWalletConnectSession('topic1', 'walletconnect', 'algorand-mainnet', 'ADDR1');
      
      // Expire topic1
      vi.advanceTimersByTime(8 * 24 * 60 * 60 * 1000);
      
      saveWalletConnectSession('topic2', 'walletconnect', 'algorand-testnet', 'ADDR2');

      const cleaned = cleanupWalletConnectSessions();

      expect(cleaned).toBe(1);
      expect(getWalletConnectSession('topic1')).toBeNull();
      expect(getWalletConnectSession('topic2')).not.toBeNull();
      
      vi.useRealTimers();
    });

    it('should return 0 when no sessions need cleanup', () => {
      saveWalletConnectSession('topic1', 'walletconnect', 'algorand-mainnet', 'ADDR1');

      const cleaned = cleanupWalletConnectSessions();

      expect(cleaned).toBe(0);
    });
  });

  describe('Persistence', () => {
    it('should persist sessions to localStorage', () => {
      const topic = 'test-topic-123';
      saveWalletConnectSession(topic, 'walletconnect', 'algorand-mainnet', 'ADDR123');

      const stored = localStorage.getItem('biatec_walletconnect_sessions');
      expect(stored).not.toBeNull();
      
      const parsed = JSON.parse(stored!);
      expect(parsed[topic]).toBeDefined();
      expect(parsed[topic].walletId).toBe('walletconnect');
    });

    it('should load sessions from localStorage', () => {
      const topic = 'test-topic-123';
      const session = {
        topic,
        walletId: 'walletconnect',
        networkId: 'algorand-mainnet',
        address: 'ADDR123',
        connectedAt: Date.now(),
        lastActivityAt: Date.now(),
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
      };

      localStorage.setItem('biatec_walletconnect_sessions', JSON.stringify({ [topic]: session }));

      loadWalletConnectSessions();

      const retrieved = getWalletConnectSession(topic);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.walletId).toBe('walletconnect');
    });

    it('should handle corrupted localStorage data', () => {
      localStorage.setItem('biatec_walletconnect_sessions', 'invalid-json');

      expect(() => loadWalletConnectSessions()).not.toThrow();
      expect(getAllActiveSessions()).toHaveLength(0);
    });

    it('should filter out expired sessions on load', () => {
      const expiredSession = {
        topic: 'expired-topic',
        walletId: 'walletconnect',
        networkId: 'algorand-mainnet',
        address: 'ADDR1',
        connectedAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
        lastActivityAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
        expiresAt: Date.now() - 3 * 24 * 60 * 60 * 1000, // Expired 3 days ago
      };

      const activeSession = {
        topic: 'active-topic',
        walletId: 'walletconnect',
        networkId: 'algorand-mainnet',
        address: 'ADDR2',
        connectedAt: Date.now(),
        lastActivityAt: Date.now(),
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
      };

      localStorage.setItem(
        'biatec_walletconnect_sessions',
        JSON.stringify({
          'expired-topic': expiredSession,
          'active-topic': activeSession,
        })
      );

      loadWalletConnectSessions();

      expect(getWalletConnectSession('expired-topic')).toBeNull();
      expect(getWalletConnectSession('active-topic')).not.toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage errors gracefully during save', () => {
      const topic = 'test-topic-123';
      
      // Mock localStorage.setItem to throw
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      expect(() => {
        saveWalletConnectSession(topic, 'walletconnect', 'algorand-mainnet', 'ADDR123');
      }).not.toThrow();

      setItemSpy.mockRestore();
    });

    it('should handle localStorage errors gracefully during load', () => {
      // Mock localStorage.getItem to throw
      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('Storage error');
      });

      expect(() => loadWalletConnectSessions()).not.toThrow();
      expect(getAllActiveSessions()).toHaveLength(0);

      getItemSpy.mockRestore();
    });
  });

  describe('Metadata Handling', () => {
    it('should preserve session metadata', () => {
      const topic = 'test-topic-123';
      const metadata = {
        name: 'MetaMask',
        description: 'MetaMask Wallet',
        url: 'https://metamask.io',
        icons: ['https://metamask.io/icon.png'],
      };

      saveWalletConnectSession(topic, 'walletconnect', 'algorand-mainnet', 'ADDR123', metadata);

      const retrieved = getWalletConnectSession(topic);
      expect(retrieved?.metadata).toEqual(metadata);
    });

    it('should work without metadata', () => {
      const topic = 'test-topic-123';

      saveWalletConnectSession(topic, 'walletconnect', 'algorand-mainnet', 'ADDR123');

      const retrieved = getWalletConnectSession(topic);
      expect(retrieved?.metadata).toBeUndefined();
    });
  });
});
