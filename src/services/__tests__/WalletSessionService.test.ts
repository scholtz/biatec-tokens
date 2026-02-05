import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  saveWalletSession,
  loadWalletSession,
  clearWalletSession,
  isSessionValid,
  updateSessionActivity,
  logConnectionEvent,
  getConnectionHistory,
  collectDiagnosticData,
  formatDiagnosticData,
  copyDiagnosticData,
  type WalletSession,
} from '../WalletSessionService';
import type { NetworkId } from '../../composables/useWalletManager';

describe('WalletSessionService', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Session Management', () => {
    it('should save wallet session to localStorage', () => {
      const walletId = 'pera';
      const networkId: NetworkId = 'algorand-mainnet';
      const address = 'TEST123456789';

      saveWalletSession(walletId, networkId, address);

      const saved = localStorage.getItem('biatec_wallet_session');
      expect(saved).toBeDefined();

      const session: WalletSession = JSON.parse(saved!);
      expect(session.walletId).toBe(walletId);
      expect(session.networkId).toBe(networkId);
      expect(session.address).toBe(address);
      expect(session.connectedAt).toBeDefined();
      expect(session.lastActivityAt).toBeDefined();
      expect(session.expiresAt).toBeDefined();
    });

    it('should load valid wallet session', () => {
      const walletId = 'defly';
      const networkId: NetworkId = 'voi-mainnet';
      const address = 'VOI123456789';

      saveWalletSession(walletId, networkId, address);
      const loaded = loadWalletSession();

      expect(loaded).toBeDefined();
      expect(loaded!.walletId).toBe(walletId);
      expect(loaded!.networkId).toBe(networkId);
      expect(loaded!.address).toBe(address);
    });

    it('should return null for expired session', () => {
      const walletId = 'pera';
      const networkId: NetworkId = 'algorand-testnet';
      const address = 'TEST123456789';
      const expiredDuration = -1000; // Already expired

      saveWalletSession(walletId, networkId, address, expiredDuration);
      const loaded = loadWalletSession();

      expect(loaded).toBeNull();
    });

    it('should clear wallet session', () => {
      saveWalletSession('pera', 'algorand-mainnet', 'TEST123');
      expect(localStorage.getItem('biatec_wallet_session')).toBeDefined();

      clearWalletSession();
      expect(localStorage.getItem('biatec_wallet_session')).toBeNull();
    });

    it('should validate session existence', () => {
      expect(isSessionValid()).toBe(false);

      saveWalletSession('pera', 'algorand-mainnet', 'TEST123');
      expect(isSessionValid()).toBe(true);

      clearWalletSession();
      expect(isSessionValid()).toBe(false);
    });

    it('should update session activity timestamp', () => {
      saveWalletSession('pera', 'algorand-mainnet', 'TEST123');
      const initial = loadWalletSession();
      
      // Wait a bit to ensure timestamp changes
      vi.useFakeTimers();
      vi.advanceTimersByTime(1000);

      updateSessionActivity();
      const updated = loadWalletSession();

      expect(updated!.lastActivityAt).toBeGreaterThan(initial!.lastActivityAt);
      vi.useRealTimers();
    });
  });

  describe('Connection History', () => {
    it('should log connection events', () => {
      logConnectionEvent('connect_initiated', 'Wallet: pera');
      logConnectionEvent('connect_success', 'Connected to mainnet');

      const history = getConnectionHistory();
      expect(history).toHaveLength(2);
      expect(history[0].event).toBe('connect_success');
      expect(history[1].event).toBe('connect_initiated');
    });

    it('should limit connection history to 20 items', () => {
      // Log 25 events
      for (let i = 0; i < 25; i++) {
        logConnectionEvent(`event_${i}`, `Details ${i}`);
      }

      const history = getConnectionHistory();
      expect(history).toHaveLength(20);
      expect(history[0].event).toBe('event_24'); // Most recent
    });

    it('should handle empty connection history', () => {
      const history = getConnectionHistory();
      expect(history).toEqual([]);
    });
  });

  describe('Diagnostic Data', () => {
    it('should collect diagnostic data', () => {
      const walletState = {
        connectionState: 'connected',
        currentNetwork: 'algorand-mainnet' as NetworkId,
        activeAddress: 'TEST123456789',
        activeWallet: 'pera',
        lastError: {
          type: 'connection_timeout',
          message: 'Connection timed out',
          diagnosticCode: 'DIAG_001',
          timestamp: new Date(),
        },
      };

      const diagnostics = collectDiagnosticData(walletState);

      expect(diagnostics.timestamp).toBeDefined();
      expect(diagnostics.walletState).toBe('connected');
      expect(diagnostics.network).toBe('algorand-mainnet');
      expect(diagnostics.address).toBe('TEST123456789');
      expect(diagnostics.walletId).toBe('pera');
      expect(diagnostics.lastError).toBeDefined();
      expect(diagnostics.lastError!.type).toBe('connection_timeout');
      expect(diagnostics.browserInfo).toBeDefined();
      expect(diagnostics.browserInfo.userAgent).toBeDefined();
      expect(diagnostics.connectionHistory).toBeDefined();
    });

    it('should collect diagnostic data without error', () => {
      const walletState = {
        connectionState: 'disconnected',
        currentNetwork: 'algorand-mainnet' as NetworkId,
        activeAddress: null,
        activeWallet: null,
        lastError: null,
      };

      const diagnostics = collectDiagnosticData(walletState);

      expect(diagnostics.walletState).toBe('disconnected');
      expect(diagnostics.address).toBeNull();
      expect(diagnostics.walletId).toBeNull();
      expect(diagnostics.lastError).toBeNull();
    });

    it('should format diagnostic data as text', () => {
      logConnectionEvent('test_event', 'Test details');

      const walletState = {
        connectionState: 'connected',
        currentNetwork: 'algorand-mainnet' as NetworkId,
        activeAddress: 'TEST123',
        activeWallet: 'pera',
        lastError: null,
      };

      const diagnostics = collectDiagnosticData(walletState);
      const formatted = formatDiagnosticData(diagnostics);

      expect(formatted).toContain('=== Wallet Diagnostic Report ===');
      expect(formatted).toContain('State: connected');
      expect(formatted).toContain('Network: algorand-mainnet');
      expect(formatted).toContain('Address: TEST123');
      expect(formatted).toContain('Wallet: pera');
      expect(formatted).toContain('Recent Connection History:');
    });

    it('should copy diagnostic data to clipboard', async () => {
      const mockWriteText = vi.fn().mockResolvedValue(undefined);
      const originalClipboard = navigator.clipboard;
      
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: mockWriteText,
        },
        writable: true,
        configurable: true,
      });

      const walletState = {
        connectionState: 'connected',
        currentNetwork: 'algorand-mainnet' as NetworkId,
        activeAddress: 'TEST123',
        activeWallet: 'pera',
        lastError: null,
      };

      const diagnostics = collectDiagnosticData(walletState);
      const result = await copyDiagnosticData(diagnostics);

      expect(result).toBe(true);
      expect(mockWriteText).toHaveBeenCalledOnce();
      expect(mockWriteText).toHaveBeenCalledWith(expect.stringContaining('=== Wallet Diagnostic Report ==='));

      // Restore original clipboard
      Object.defineProperty(navigator, 'clipboard', {
        value: originalClipboard,
        writable: true,
        configurable: true,
      });
    });

    it('should handle clipboard copy failure', async () => {
      const mockWriteText = vi.fn().mockRejectedValue(new Error('Clipboard not available'));
      const originalClipboard = navigator.clipboard;
      
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: mockWriteText,
        },
        writable: true,
        configurable: true,
      });

      const walletState = {
        connectionState: 'connected',
        currentNetwork: 'algorand-mainnet' as NetworkId,
        activeAddress: 'TEST123',
        activeWallet: 'pera',
        lastError: null,
      };

      const diagnostics = collectDiagnosticData(walletState);
      const result = await copyDiagnosticData(diagnostics);

      expect(result).toBe(false);

      // Restore original clipboard
      Object.defineProperty(navigator, 'clipboard', {
        value: originalClipboard,
        writable: true,
        configurable: true,
      });
    });
  });

  describe('Session Expiry', () => {
    it('should set correct expiry time', () => {
      const customDuration = 24 * 60 * 60 * 1000; // 24 hours
      saveWalletSession('pera', 'algorand-mainnet', 'TEST123', customDuration);

      const session = loadWalletSession();
      expect(session).toBeDefined();

      const expectedExpiry = Date.now() + customDuration;
      const actualExpiry = session!.expiresAt;

      // Allow 1 second tolerance for test execution time
      expect(Math.abs(actualExpiry - expectedExpiry)).toBeLessThan(1000);
    });

    it('should use default 7-day expiry when not specified', () => {
      saveWalletSession('pera', 'algorand-mainnet', 'TEST123');

      const session = loadWalletSession();
      expect(session).toBeDefined();

      const defaultDuration = 7 * 24 * 60 * 60 * 1000;
      const expectedExpiry = Date.now() + defaultDuration;
      const actualExpiry = session!.expiresAt;

      // Allow 1 second tolerance
      expect(Math.abs(actualExpiry - expectedExpiry)).toBeLessThan(1000);
    });
  });

  describe('Error Handling', () => {
    it('should handle corrupted session data', () => {
      localStorage.setItem('biatec_wallet_session', 'invalid json {');
      const session = loadWalletSession();
      expect(session).toBeNull();
    });

    it('should handle corrupted history data', () => {
      localStorage.setItem('biatec_connection_history', 'invalid json [');
      const history = getConnectionHistory();
      expect(history).toEqual([]);
    });

    it('should handle missing localStorage gracefully', () => {
      const originalGetItem = Storage.prototype.getItem;
      Storage.prototype.getItem = vi.fn().mockImplementation(() => {
        throw new Error('localStorage not available');
      });

      const session = loadWalletSession();
      expect(session).toBeNull();

      Storage.prototype.getItem = originalGetItem;
    });
  });
});
