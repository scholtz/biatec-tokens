import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  saveWalletSession,
  loadWalletSession,
  clearWalletSession,
  logConnectionEvent,
  getConnectionHistory,
} from '../../services/WalletSessionService';
import { WalletConnectionState } from '../../composables/walletState';
import type { NetworkId } from '../../composables/useWalletManager';

describe('Wallet Lifecycle Integration Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Complete Wallet Connection Lifecycle', () => {
    it('should complete full wallet connection and reconnection lifecycle', () => {
      // Step 1: Initial state - no session
      let session = loadWalletSession();
      expect(session).toBeNull();
      expect(getConnectionHistory()).toHaveLength(0);

      // Step 2: User initiates connection
      logConnectionEvent('connect_initiated', 'Wallet: pera');
      const history1 = getConnectionHistory();
      expect(history1).toHaveLength(1);
      expect(history1[0].event).toBe('connect_initiated');

      // Step 3: Wallet provider detected
      logConnectionEvent('provider_detected', 'Pera wallet found');
      const history2 = getConnectionHistory();
      expect(history2).toHaveLength(2);
      expect(history2[0].event).toBe('provider_detected');

      // Step 4: Connection successful, save session
      const walletId = 'pera';
      const networkId: NetworkId = 'algorand-mainnet';
      const address = 'TESTADDRESS123456789';
      saveWalletSession(walletId, networkId, address);
      logConnectionEvent('connect_success', `Connected to ${networkId}`);

      // Step 5: Verify session saved correctly
      session = loadWalletSession();
      expect(session).toBeDefined();
      expect(session!.walletId).toBe(walletId);
      expect(session!.networkId).toBe(networkId);
      expect(session!.address).toBe(address);
      expect(session!.connectedAt).toBeLessThanOrEqual(Date.now());
      expect(session!.lastActivityAt).toBeLessThanOrEqual(Date.now());
      expect(session!.expiresAt).toBeGreaterThan(Date.now());

      // Step 6: Simulate user activity
      const oldActivityTime = session!.lastActivityAt;
      vi.useFakeTimers();
      vi.advanceTimersByTime(5000);
      
      // Session should still be valid and activity time updated on load
      session = loadWalletSession();
      expect(session).toBeDefined();
      expect(session!.lastActivityAt).toBeGreaterThan(oldActivityTime);
      vi.useRealTimers();

      // Step 7: Simulate page refresh - session should persist
      const beforeRefresh = loadWalletSession();
      expect(beforeRefresh).toBeDefined();
      
      // After "refresh", session should still be loadable
      const afterRefresh = loadWalletSession();
      expect(afterRefresh).toBeDefined();
      expect(afterRefresh!.walletId).toBe(walletId);
      expect(afterRefresh!.networkId).toBe(networkId);
      expect(afterRefresh!.address).toBe(address);

      // Step 8: User disconnects
      clearWalletSession();
      logConnectionEvent('disconnect', 'User disconnected');
      
      session = loadWalletSession();
      expect(session).toBeNull();

      // Step 9: Connection history should be preserved
      const finalHistory = getConnectionHistory();
      expect(finalHistory.length).toBeGreaterThan(0);
      expect(finalHistory[0].event).toBe('disconnect');
      expect(finalHistory.some(h => h.event === 'connect_success')).toBe(true);
      expect(finalHistory.some(h => h.event === 'connect_initiated')).toBe(true);
    });

    it('should handle session expiry in lifecycle', () => {
      // Create a session that expires immediately
      const walletId = 'defly';
      const networkId: NetworkId = 'voi-mainnet';
      const address = 'VOI123456789';
      const expiredDuration = -1000; // Already expired

      saveWalletSession(walletId, networkId, address, expiredDuration);
      logConnectionEvent('session_created', 'Created with short expiry');

      // Try to load expired session
      const session = loadWalletSession();
      expect(session).toBeNull();

      // Verify expiry was logged
      const history = getConnectionHistory();
      expect(history.some(h => h.event === 'session_expired')).toBe(true);
    });

    it('should handle network switch in lifecycle', () => {
      // Start with mainnet
      const walletId = 'pera';
      const initialNetwork: NetworkId = 'algorand-mainnet';
      const address = 'TEST123';

      saveWalletSession(walletId, initialNetwork, address);
      logConnectionEvent('connect_success', `Connected to ${initialNetwork}`);

      let session = loadWalletSession();
      expect(session!.networkId).toBe(initialNetwork);

      // Switch to testnet
      const newNetwork: NetworkId = 'algorand-testnet';
      logConnectionEvent('network_switch_initiated', `From ${initialNetwork} to ${newNetwork}`);
      
      // Clear old session and save with new network
      clearWalletSession();
      saveWalletSession(walletId, newNetwork, address);
      logConnectionEvent('network_switch_success', `Switched to ${newNetwork}`);

      session = loadWalletSession();
      expect(session!.networkId).toBe(newNetwork);

      // Verify history contains network switch
      const history = getConnectionHistory();
      expect(history.some(h => h.event === 'network_switch_success')).toBe(true);
    });

    it('should track multiple connection attempts and failures', () => {
      // First attempt - fails
      logConnectionEvent('connect_initiated', 'Attempt 1');
      logConnectionEvent('provider_not_found', 'Wallet not installed');
      
      let history = getConnectionHistory();
      expect(history).toHaveLength(2);
      expect(history[0].event).toBe('provider_not_found');

      // Second attempt - also fails
      logConnectionEvent('connect_initiated', 'Attempt 2');
      logConnectionEvent('connection_rejected', 'User rejected');
      
      history = getConnectionHistory();
      expect(history).toHaveLength(4);

      // Third attempt - succeeds
      logConnectionEvent('connect_initiated', 'Attempt 3');
      logConnectionEvent('provider_detected', 'Wallet found');
      const walletId = 'pera';
      const networkId: NetworkId = 'algorand-mainnet';
      const address = 'TEST123';
      saveWalletSession(walletId, networkId, address);
      logConnectionEvent('connect_success', 'Finally connected');

      // Verify session was saved
      const session = loadWalletSession();
      expect(session).toBeDefined();
      expect(session!.walletId).toBe(walletId);

      // Verify complete history
      history = getConnectionHistory();
      expect(history.length).toBeGreaterThanOrEqual(7);
      expect(history[0].event).toBe('connect_success');
      expect(history.some(h => h.event === 'provider_not_found')).toBe(true);
      expect(history.some(h => h.event === 'connection_rejected')).toBe(true);
    });
  });

  describe('State Machine Transitions', () => {
    it('should track state transitions through connection flow', () => {
      const transitions: { from: string; to: string }[] = [];

      // DISCONNECTED -> DETECTING
      logConnectionEvent('state_transition', 'DISCONNECTED -> DETECTING');
      transitions.push({ from: 'DISCONNECTED', to: 'DETECTING' });

      // DETECTING -> CONNECTING
      logConnectionEvent('state_transition', 'DETECTING -> CONNECTING');
      transitions.push({ from: 'DETECTING', to: 'CONNECTING' });

      // CONNECTING -> CONNECTED
      logConnectionEvent('state_transition', 'CONNECTING -> CONNECTED');
      transitions.push({ from: 'CONNECTING', to: 'CONNECTED' });

      // Save successful connection
      saveWalletSession('pera', 'algorand-mainnet', 'TEST123');

      const history = getConnectionHistory();
      expect(history.length).toBeGreaterThanOrEqual(3);
      expect(history.some(h => h.details?.includes('CONNECTED'))).toBe(true);
    });

    it('should track state transitions through error recovery', () => {
      // DISCONNECTED -> CONNECTING
      logConnectionEvent('state_transition', 'DISCONNECTED -> CONNECTING');

      // CONNECTING -> FAILED
      logConnectionEvent('state_transition', 'CONNECTING -> FAILED');
      logConnectionEvent('error_occurred', 'Connection timeout');

      // FAILED -> RECONNECTING
      logConnectionEvent('state_transition', 'FAILED -> RECONNECTING');

      // RECONNECTING -> CONNECTED
      logConnectionEvent('state_transition', 'RECONNECTING -> CONNECTED');
      saveWalletSession('pera', 'algorand-mainnet', 'TEST123');

      const history = getConnectionHistory();
      expect(history.some(h => h.details?.includes('FAILED'))).toBe(true);
      expect(history.some(h => h.details?.includes('RECONNECTING'))).toBe(true);
      expect(history.some(h => h.event === 'error_occurred')).toBe(true);

      // Verify session was saved after recovery
      const session = loadWalletSession();
      expect(session).toBeDefined();
    });
  });

  describe('Multi-Wallet Scenarios', () => {
    it('should handle switching between different wallets', () => {
      // Connect with Pera
      const pera = { walletId: 'pera', networkId: 'algorand-mainnet' as NetworkId, address: 'PERA123' };
      saveWalletSession(pera.walletId, pera.networkId, pera.address);
      logConnectionEvent('wallet_connected', `Connected: ${pera.walletId}`);

      let session = loadWalletSession();
      expect(session!.walletId).toBe('pera');

      // Switch to Defly
      clearWalletSession();
      logConnectionEvent('wallet_disconnected', 'Disconnected: pera');

      const defly = { walletId: 'defly', networkId: 'algorand-mainnet' as NetworkId, address: 'DEFLY456' };
      saveWalletSession(defly.walletId, defly.networkId, defly.address);
      logConnectionEvent('wallet_connected', `Connected: ${defly.walletId}`);

      session = loadWalletSession();
      expect(session!.walletId).toBe('defly');
      expect(session!.address).toBe('DEFLY456');

      // Verify history shows both wallets
      const history = getConnectionHistory();
      expect(history.some(h => h.details?.includes('pera'))).toBe(true);
      expect(history.some(h => h.details?.includes('defly'))).toBe(true);
    });
  });

  describe('Error Recovery Patterns', () => {
    it('should recover from connection timeout with retry', () => {
      // Initial attempt times out
      logConnectionEvent('connect_initiated', 'Attempt 1');
      logConnectionEvent('connection_timeout', 'Timeout after 30s');

      // Retry with backoff
      logConnectionEvent('retry_initiated', 'Attempt 2 with backoff');
      logConnectionEvent('connection_timeout', 'Timeout after 30s');

      // Final retry succeeds
      logConnectionEvent('retry_initiated', 'Attempt 3');
      saveWalletSession('pera', 'algorand-mainnet', 'TEST123');
      logConnectionEvent('connect_success', 'Connected after retry');

      const session = loadWalletSession();
      expect(session).toBeDefined();

      const history = getConnectionHistory();
      expect(history.filter(h => h.event === 'connection_timeout')).toHaveLength(2);
      expect(history.filter(h => h.event === 'retry_initiated')).toHaveLength(2);
      expect(history[0].event).toBe('connect_success');
    });

    it('should recover from provider not found', () => {
      // Provider not found
      logConnectionEvent('connect_initiated', 'Check for wallet');
      logConnectionEvent('provider_not_found', 'No wallet extension');

      // User installs wallet
      logConnectionEvent('user_action', 'Wallet installed');

      // Retry and succeed
      logConnectionEvent('connect_initiated', 'Retry after install');
      logConnectionEvent('provider_detected', 'Wallet now available');
      saveWalletSession('pera', 'algorand-mainnet', 'TEST123');
      logConnectionEvent('connect_success', 'Connected');

      const session = loadWalletSession();
      expect(session).toBeDefined();

      const history = getConnectionHistory();
      expect(history.some(h => h.event === 'provider_not_found')).toBe(true);
      expect(history.some(h => h.event === 'provider_detected')).toBe(true);
    });
  });

  describe('Idempotent Operations', () => {
    it('should handle redundant disconnect calls gracefully', () => {
      // Connect
      saveWalletSession('pera', 'algorand-mainnet', 'TEST123');
      logConnectionEvent('connect_success', 'Connected');

      // Disconnect
      clearWalletSession();
      logConnectionEvent('disconnect', 'First disconnect');
      expect(loadWalletSession()).toBeNull();

      // Redundant disconnect (should be safe)
      clearWalletSession();
      logConnectionEvent('disconnect', 'Redundant disconnect');
      expect(loadWalletSession()).toBeNull();

      const history = getConnectionHistory();
      expect(history.filter(h => h.event === 'disconnect')).toHaveLength(2);
    });

    it('should handle redundant session save operations', () => {
      // Save session
      saveWalletSession('pera', 'algorand-mainnet', 'TEST123');
      const session1 = loadWalletSession();

      // Save again with same data
      saveWalletSession('pera', 'algorand-mainnet', 'TEST123');
      const session2 = loadWalletSession();

      // Both should be valid
      expect(session1).toBeDefined();
      expect(session2).toBeDefined();
      expect(session2!.walletId).toBe(session1!.walletId);
    });
  });

  describe('Session Boundary Scenarios', () => {
    it('should handle session recovery after simulated page reload', () => {
      // Initial connection
      saveWalletSession('pera', 'algorand-mainnet', 'TEST123');
      logConnectionEvent('connect_success', 'Initial connection');

      const beforeReload = loadWalletSession();
      expect(beforeReload).toBeDefined();

      // Simulate page reload by just loading again
      // (In real app, this would be a fresh page load)
      const afterReload = loadWalletSession();
      expect(afterReload).toBeDefined();
      expect(afterReload!.walletId).toBe(beforeReload!.walletId);
      expect(afterReload!.address).toBe(beforeReload!.address);
      
      // Activity timestamp should be updated
      expect(afterReload!.lastActivityAt).toBeGreaterThanOrEqual(beforeReload!.lastActivityAt);
    });

    it('should not recover expired session after simulated page reload', () => {
      // Create already-expired session
      saveWalletSession('pera', 'algorand-mainnet', 'TEST123', -1000);

      // Try to load (simulating page reload)
      const session = loadWalletSession();
      expect(session).toBeNull();

      // Verify expiry was logged
      const history = getConnectionHistory();
      expect(history.some(h => h.event === 'session_expired')).toBe(true);
    });
  });
});
